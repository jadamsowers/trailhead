import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Outing, FamilyMemberSummary, SignupResponse } from '../../types';
import { signupAPI, userAPI, APIError } from '../../services/api';
import { formatPhoneNumber, validatePhoneWithMessage } from '../../utils/phoneUtils';
import {
    useAvailableOutings,
    useFamilySummary,
    useMySignups,
    invalidateOutings,
    invalidateSignups,
    invalidateFamilyData
} from '../../hooks/useSWR';

type WizardStep = 'select-trip' | 'contact-info' | 'select-adults' | 'select-scouts' | 'review';

// Add responsive styles
const styles = `
    @media (max-width: 768px) {
        .wizard-container {
            padding: 10px !important;
        }
        
        .wizard-container h1 {
            font-size: 24px !important;
        }
        
        .wizard-container h2 {
            font-size: 20px !important;
        }
        
        .progress-indicator {
            padding: 15px !important;
        }
        
        .progress-step-label {
            font-size: 10px !important;
        }
        
        .progress-step-circle {
            width: 32px !important;
            height: 32px !important;
            font-size: 14px !important;
        }
        
        .outing-card {
            flex-direction: column !important;
        }
        
        .capacity-badge {
            margin-left: 0 !important;
            margin-top: 10px !important;
            align-self: flex-start !important;
        }
        
        .participant-grid {
            grid-template-columns: 1fr !important;
        }
        
        .member-selection-grid {
            grid-template-columns: 1fr !important;
        }
        
        .navigation-buttons {
            flex-direction: column !important;
        }
        
        .navigation-buttons > * {
            width: 100% !important;
        }
        
        .navigation-buttons .button-group {
            width: 100% !important;
            flex-direction: column !important;
        }
        
        .navigation-buttons button {
            width: 100% !important;
        }
        
        .participant-chip {
            font-size: 12px !important;
            padding: 3px 8px !important;
        }
        
        .signup-actions {
            flex-direction: column !important;
        }
        
        .signup-actions button {
            width: 100% !important;
        }
    }
    
    @media (max-width: 480px) {
        .wizard-container {
            padding: 5px !important;
        }
        
        .wizard-container h1 {
            font-size: 20px !important;
        }
        
        .wizard-container h2 {
            font-size: 18px !important;
        }
        
        .progress-indicator {
            padding: 10px !important;
        }
        
        .progress-step-circle {
            width: 28px !important;
            height: 28px !important;
            font-size: 12px !important;
        }
        
        .participant-chip {
            font-size: 11px !important;
        }
    }
`;

const SignupWizard: React.FC = () => {
    const { user, isSignedIn } = useUser();
    
    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('select-trip');
    const [selectedOuting, setSelectedOuting] = useState<Outing | null>(null);
    const [editingSignupId, setEditingSignupId] = useState<string | null>(null);
    
    // Use SWR hooks for data fetching with automatic caching
    const { outings = [], isLoading: outingsLoading, error: outingsError } = useAvailableOutings();
    const { signups: mySignups = [], isLoading: signupsLoading, error: signupsError } = useMySignups();
    const { familyMembers = [], isLoading: familyLoading, error: familyError } = useFamilySummary(selectedOuting?.id);
    
    // Derived state
    const mySignupOutingIds = new Set(mySignups.map(s => s.outing_id));
    const [expandedSignupId, setExpandedSignupId] = useState<string>('');
    const [selectedAdultIds, setSelectedAdultIds] = useState<string[]>([]);
    const [selectedScoutIds, setSelectedScoutIds] = useState<string[]>([]);
    
    // Contact info state
    const [contactInfo, setContactInfo] = useState({
        email: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [cancelingSignupId, setCancelingSignupId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    // Load user contact info on mount
    useEffect(() => {
        if (isSignedIn) {
            loadUserContactInfo();
        }
    }, [isSignedIn, user]);

    // Log data loading status for diagnostics
    useEffect(() => {
        if (outingsLoading) {
            console.log('🔄 Loading outings...');
        } else if (outingsError) {
            console.error('❌ Error loading outings:', outingsError);
        } else if (outings) {
            console.log('✅ Outings loaded:', { count: outings.length });
        }
    }, [outings, outingsLoading, outingsError]);

    useEffect(() => {
        if (signupsLoading) {
            console.log('🔄 Loading my signups...');
        } else if (signupsError) {
            console.error('❌ Error loading signups:', signupsError);
        } else if (mySignups) {
            console.log('✅ My signups loaded:', { count: mySignups.length });
        }
    }, [mySignups, signupsLoading, signupsError]);

    useEffect(() => {
        if (familyLoading) {
            console.log('🔄 Loading family members...');
        } else if (familyError) {
            console.error('❌ Error loading family members:', familyError);
        } else if (familyMembers) {
            console.log('✅ Family members loaded:', { count: familyMembers.length });
        }
    }, [familyMembers, familyLoading, familyError]);

    const loadUserContactInfo = async () => {
        try {
            const userData = await userAPI.getCurrentUser();
            console.log('Loaded user data:', userData);
            setContactInfo({
                email: user?.primaryEmailAddress?.emailAddress || '',
                phone: userData.phone ?? '',
                emergency_contact_name: userData.emergency_contact_name ?? '',
                emergency_contact_phone: userData.emergency_contact_phone ?? ''
            });
        } catch (err) {
            console.error('Failed to load user contact info:', err);
            // Fallback to email from Clerk
            if (user?.primaryEmailAddress?.emailAddress) {
                setContactInfo(prev => ({
                    ...prev,
                    email: user.primaryEmailAddress?.emailAddress || prev.email
                }));
            }
        }
    };


    const handleCancelSignup = async (signupId: string, outingName: string) => {
        if (!window.confirm(`Are you sure you want to cancel your signup for "${outingName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setCancelingSignupId(signupId);
            setError(null);
            console.log('🗑️ Canceling signup:', signupId);
            await signupAPI.cancelSignup(signupId);
            console.log('✅ Signup canceled, invalidating caches...');
            // Invalidate caches to trigger refetch
            await Promise.all([
                invalidateSignups(),
                invalidateOutings()
            ]);
            setExpandedSignupId('');
        } catch (err) {
            console.error('❌ Failed to cancel signup:', err);
            setError(err instanceof APIError ? err.message : 'Failed to cancel signup');
        } finally {
            setCancelingSignupId(null);
        }
    };

    const calculateAvailableSeats = (): number => {
        if (!selectedOuting || selectedOuting.capacity_type !== 'vehicle') {
            return selectedOuting?.available_spots || 0;
        }
        
        const selectedAdults = familyMembers.filter(fm => 
            selectedAdultIds.includes(fm.id) && fm.member_type === 'adult'
        );
        
        const additionalSeats = selectedAdults.reduce((sum, adult) => 
            sum + (adult.vehicle_capacity || 0), 0
        );
        
        const totalParticipants = selectedAdultIds.length + selectedScoutIds.length;
        
        return (selectedOuting.available_spots || 0) + additionalSeats - totalParticipants;
    };

    const goToNextStep = () => {
        setError(null);
        
        if (currentStep === 'select-trip') {
            if (!selectedOuting) {
                setError('Please select a trip');
                return;
            }
            setCurrentStep('contact-info');
        } else if (currentStep === 'contact-info') {
            if (!validateContactInfo()) return;
            setCurrentStep('select-adults');
        } else if (currentStep === 'select-adults') {
            setCurrentStep('select-scouts');
        } else if (currentStep === 'select-scouts') {
            if (selectedAdultIds.length === 0 && selectedScoutIds.length === 0) {
                setError('Please select at least one participant');
                return;
            }
            setCurrentStep('review');
        }
    };

    const goToPreviousStep = () => {
        setError(null);
        
        if (currentStep === 'contact-info') {
            setCurrentStep('select-trip');
        } else if (currentStep === 'select-adults') {
            setCurrentStep('contact-info');
        } else if (currentStep === 'select-scouts') {
            setCurrentStep('select-adults');
        } else if (currentStep === 'review') {
            setCurrentStep('select-scouts');
        }
    };

    const validateContactInfo = (): boolean => {
        if (!contactInfo.email) {
            setError('Email is required');
            return false;
        }
        
        // Validate phone numbers with detailed messages
        const phoneError = validatePhoneWithMessage(contactInfo.phone, 'Phone number');
        if (phoneError) {
            setError(phoneError);
            return false;
        }
        
        if (!contactInfo.emergency_contact_name) {
            setError('Emergency contact name is required');
            return false;
        }
        
        const emergencyPhoneError = validatePhoneWithMessage(contactInfo.emergency_contact_phone, 'Emergency contact phone');
        if (emergencyPhoneError) {
            setError(emergencyPhoneError);
            return false;
        }
        
        return true;
    };

    const handleSubmit = async () => {
        if (!selectedOuting) return;
        
        const allSelectedIds = [...selectedAdultIds, ...selectedScoutIds];
        if (allSelectedIds.length === 0) {
            setError('Please select at least one participant');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log('💾 Saving contact info as default...');
            // Save contact info as user's default for future signups
            try {
                await userAPI.updateContactInfo({
                    phone: contactInfo.phone,
                    emergency_contact_name: contactInfo.emergency_contact_name,
                    emergency_contact_phone: contactInfo.emergency_contact_phone
                });
                console.log('✅ Contact info saved');
            } catch (err) {
                console.error('⚠️ Failed to save contact info as default:', err);
                // Continue with signup even if saving defaults fails
            }
            
            const signupData = {
                family_contact: {
                    email: contactInfo.email,
                    phone: contactInfo.phone,
                    emergency_contact_name: contactInfo.emergency_contact_name,
                    emergency_contact_phone: contactInfo.emergency_contact_phone
                },
                family_member_ids: allSelectedIds
            };

            let response;
            if (editingSignupId) {
                console.log('✏️ Updating signup:', editingSignupId);
                // Update existing signup
                response = await signupAPI.updateSignup(editingSignupId, signupData);
                console.log('✅ Signup updated');
                setSuccess(true);
                setWarnings([]);
            } else {
                console.log('➕ Creating new signup for outing:', selectedOuting.id);
                // Create new signup
                response = await signupAPI.create({
                    outing_id: selectedOuting.id,
                    ...signupData
                });
                console.log('✅ Signup created');
                setSuccess(true);
                setWarnings(response.warnings || []);
            }
            
            console.log('🔄 Invalidating caches...');
            // Invalidate caches to trigger refetch
            await Promise.all([
                invalidateSignups(),
                invalidateOutings(),
                invalidateFamilyData()
            ]);
            
            setTimeout(() => {
                resetForm();
            }, 3000);
        } catch (err) {
            console.error('❌ Failed to submit signup:', err);
            setError(err instanceof APIError ? err.message : `Failed to ${editingSignupId ? 'update' : 'submit'} signup`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentStep('select-trip');
        setSelectedOuting(null);
        setSelectedAdultIds([]);
        setSelectedScoutIds([]);
        setEditingSignupId(null);
        setContactInfo({
            email: user?.primaryEmailAddress?.emailAddress || '',
            phone: '',
            emergency_contact_name: '',
            emergency_contact_phone: ''
        });
        setSuccess(false);
        setWarnings([]);
        setError(null);
    };

    const handleCancelWizard = () => {
        if (currentStep === 'select-trip') {
            // Already at the start, nothing to cancel
            return;
        }

        const hasChanges = selectedOuting !== null ||
                          selectedAdultIds.length > 0 ||
                          selectedScoutIds.length > 0 ||
                          (editingSignupId !== null);

        if (hasChanges) {
            const confirmMessage = editingSignupId
                ? 'Are you sure you want to cancel editing this signup? Your changes will be lost.'
                : 'Are you sure you want to cancel this signup? Your progress will be lost.';
            
            if (!window.confirm(confirmMessage)) {
                return;
            }
        }

        // Reset form and reload user contact info
        resetForm();
        loadUserContactInfo();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <style>{styles}</style>
            <div className="wizard-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h1>{editingSignupId ? '✏️ Edit Signup' : 'Outing Signup'}</h1>
            
            {editingSignupId && (
                <div style={{
                    padding: '15px',
                    marginBottom: '20px',
                    backgroundColor: 'var(--alert-info-bg)',
                    color: 'var(--alert-info-text)',
                    borderRadius: '4px',
                    border: '2px solid #1976d2'
                }}>
                    <strong>Editing Mode:</strong> You're editing your signup for {selectedOuting?.name}. Make your changes and submit to update.
                </div>
            )}
            
            {success && (
                <>
                    <div style={{
                        padding: '15px',
                        marginBottom: '20px',
                        backgroundColor: 'var(--alert-success-bg)',
                        color: 'var(--alert-success-text)',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                    }}>
                        ✓ Signup {editingSignupId ? 'updated' : 'submitted'} successfully!
                    </div>
                    
                    {warnings.length > 0 && (
                        <div style={{
                            padding: '15px',
                            marginBottom: '20px',
                            backgroundColor: 'var(--alert-warning-bg)',
                            color: 'var(--alert-warning-text)',
                            borderRadius: '4px'
                        }}>
                            <strong>Important Reminders:</strong>
                            {warnings.map((warning, index) => (
                                <div key={index} style={{ marginTop: '8px' }}>{warning}</div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {error && (
                <div className="progress-step-label" style={{
                    padding: '15px',
                    marginBottom: '20px',
                    backgroundColor: 'var(--alert-error-bg)',
                    color: 'var(--alert-error-text)',
                    borderRadius: '4px'
                }}>
                    {error}
                </div>
            )}

            {/* Progress Indicator - Only show after trip selection */}
            {currentStep !== 'select-trip' && (
                <div className="progress-indicator" style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {[
                            { key: 'contact-info', label: 'Contact', number: 1 },
                            { key: 'select-adults', label: 'Adults', number: 2 },
                            { key: 'select-scouts', label: 'Scouts', number: 3 },
                            { key: 'review', label: 'Review', number: 4 }
                        ].map((step, index, arr) => {
                            const stepIndex = arr.findIndex(s => s.key === currentStep);
                            const isComplete = index < stepIndex;
                            const isCurrent = step.key === currentStep;
                            
                            return (
                                <React.Fragment key={step.key}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                        <div className="progress-step-circle" style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: isComplete || isCurrent ? '#1976d2' : '#e0e0e0',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                            marginBottom: '8px'
                                        }}>
                                            {isComplete ? '✓' : step.number}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: isCurrent ? 'bold' : 'normal',
                                            color: isComplete || isCurrent ? '#1976d2' : '#757575',
                                            textAlign: 'center'
                                        }}>
                                            {step.label}
                                        </div>
                                    </div>
                                    {index < arr.length - 1 && (
                                        <div style={{
                                            flex: 1,
                                            height: '2px',
                                            backgroundColor: isComplete ? '#1976d2' : '#e0e0e0',
                                            marginBottom: '30px'
                                        }} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* My Signups Section - Show before trip selection */}
            {currentStep === 'select-trip' && mySignups.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>✓ My Signups ({mySignups.length})</h2>
                    <p style={{ marginBottom: '20px', color: '#666' }}>
                        Outings you're already signed up for. Click to view details or cancel.
                    </p>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {mySignups.map(signup => {
                            const outing = outings.find(o => o.id === signup.outing_id);
                            if (!outing) return null;
                            
                            const isExpanded = expandedSignupId === signup.id;
                            const isCanceling = cancelingSignupId === signup.id;
                            
                            return (
                                <div
                                    key={signup.id}
                                    style={{
                                        border: isExpanded ? '2px solid #2e7d32' : '1px solid #c8e6c9',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        backgroundColor: 'var(--alert-success-bg)'
                                    }}
                                >
                                    <div
                                        onClick={() => setExpandedSignupId(isExpanded ? '' : signup.id)}
                                        style={{
                                            padding: '20px',
                                            cursor: 'pointer',
                                            backgroundColor: isExpanded ? '#e8f5e9' : '#f1f8f4'
                                        }}
                                    >
                                        <div className="outing-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>✓ {outing.name}</h3>
                                                <p style={{ margin: '5px 0' }}>
                                                    <strong>Date:</strong> {new Date(outing.outing_date).toLocaleDateString()}
                                                </p>
                                                <div style={{ margin: '10px 0 0 0' }}>
                                                    <strong>Participants ({signup.participant_count}):</strong>
                                                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {signup.participants.map(participant => (
                                                            <span
                                                                key={participant.id}
                                                                className="participant-chip"
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    padding: '4px 10px',
                                                                    backgroundColor: 'var(--badge-scout-bg)',
                                                                    color: 'var(--badge-scout-text)',
                                                                    borderRadius: '12px',
                                                                    fontSize: '13px',
                                                                    fontWeight: '500',
                                                                    border:  '1px solid #90caf9'
                                                                }}
                                                            >
                                                                {participant.is_adult ? '🌲' : '🌱'} {participant.name}
                                                                {participant.vehicle_capacity > 0 && (
                                                                    <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>
                                                                        🚗: {participant.vehicle_capacity}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '20px', marginLeft: '15px' }}>
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ padding: '20px', backgroundColor: 'var(--card-bg)', borderTop: '2px solid #2e7d32' }}>
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ marginBottom: '10px' }}>Outing Details</h4>
                                                <p style={{ margin: '5px 0' }}><strong>Location:</strong> {outing.location}</p>
                                                {outing.description && <p style={{ margin: '10px 0' }}>{outing.description}</p>}
                                            </div>

                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ marginBottom: '10px' }}>Your Participants</h4>
                                                <div className="participant-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                                    {signup.participants.map(participant => (
                                                        <div
                                                            key={participant.id}
                                                            style={{
                                                                padding: '12px',
                                                                backgroundColor: 'var(--bg-tertiary)',
                                                                borderRadius: '6px',
                                                                border: '1px solid #ddd'
                                                            }}
                                                        >
                                                            <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>{participant.name}</p>
                                                            <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                                                {participant.is_adult ? '🌲 Adult' : '🌱 Scout'}
                                                            </p>
                                                            {participant.troop_number && (
                                                                <p style={{ margin: '4px 0', fontSize: '14px' }}>Troop {participant.troop_number}</p>
                                                            )}
                                                            {participant.vehicle_capacity > 0 && (
                                                                <p style={{ margin: '4px 0', fontSize: '13px', color: '#1976d2', fontWeight: 'bold' }}>
                                                                    🚗 {participant.vehicle_capacity} seats
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                                                <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Contact Information</h4>
                                                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Email:</strong> {signup.family_contact_email}</p>
                                                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Phone:</strong> {signup.family_contact_phone}</p>
                                            </div>

                                            <div className="signup-actions" style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Set up edit mode
                                                        setEditingSignupId(signup.id);
                                                        setSelectedOuting(outing);
                                                        setContactInfo({
                                                            email: signup.family_contact_email,
                                                            phone: signup.family_contact_phone,
                                                            emergency_contact_name: signup.family_contact_name,
                                                            emergency_contact_phone: signup.family_contact_phone
                                                        });
                                                        // Pre-select current participants
                                                        const participantFamilyMemberIds = signup.participants.map(p => {
                                                            // Find the family member ID from the participant
                                                            const fm = familyMembers.find(f => f.name === p.name);
                                                            return fm?.id;
                                                        }).filter(Boolean) as string[];
                                                        
                                                        const adults = participantFamilyMemberIds.filter(id => {
                                                            const fm = familyMembers.find(f => f.id === id);
                                                            return fm?.member_type === 'adult';
                                                        });
                                                        const scouts = participantFamilyMemberIds.filter(id => {
                                                            const fm = familyMembers.find(f => f.id === id);
                                                            return fm?.member_type === 'scout';
                                                        });
                                                        
                                                        setSelectedAdultIds(adults);
                                                        setSelectedScoutIds(scouts);
                                                        setCurrentStep('contact-info');
                                                        setExpandedSignupId('');
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px 24px',
                                                        backgroundColor: '#1976d2',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    ✏️ Edit Signup
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelSignup(signup.id, outing.name);
                                                    }}
                                                    disabled={isCanceling}
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px 24px',
                                                        backgroundColor: isCanceling ? '#ccc' : '#d32f2f',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: isCanceling ? 'not-allowed' : 'pointer',
                                                        fontSize: '16px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {isCanceling ? 'Canceling...' : '🗑️ Cancel'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step Content */}
            <div style={{ marginBottom: '30px' }}>
                {currentStep === 'select-trip' && (
                    <div>
                        <h2>{mySignups.length > 0 ? 'Sign Up for Another Trip' : 'Select a Trip'}</h2>
                        {outingsLoading && outings.length === 0 ? (
                            <p>Loading available outings...</p>
                        ) : outingsError ? (
                            <p style={{ color: '#c62828' }}>Error loading outings: {outingsError.message}</p>
                        ) : outings.filter(o => !mySignupOutingIds.has(o.id)).length === 0 ? (
                            <p>No upcoming outings available{mySignups.length > 0 ? ' (you\'re signed up for all available outings)' : ''}.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {outings.filter(o => !mySignupOutingIds.has(o.id)).map(outing => (
                                    <div
                                        key={outing.id}
                                        onClick={() => {
                                            setSelectedOuting(outing);
                                            // Automatically advance to next step after a brief delay
                                            setTimeout(() => {
                                                setCurrentStep('contact-info');
                                                // Scroll to top of page
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }, 300);
                                        }}
                                        style={{
                                            padding: '20px',
                                            border: selectedOuting?.id === outing.id ? '3px solid #1976d2' : '1px solid var(--card-border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedOuting?.id === outing.id ? 'var(--badge-info-bg)' : 'var(--card-bg)',
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                    >
                                        <div className="outing-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: '0 0 10px 0' }}>{outing.name}</h3>
                                                <p style={{ margin: '5px 0' }}>
                                                    <strong>Date:</strong> {new Date(outing.outing_date).toLocaleDateString()}
                                                    {outing.end_date && ` - ${new Date(outing.end_date).toLocaleDateString()}`}
                                                </p>
                                                <p style={{ margin: '5px 0' }}><strong>Location:</strong> {outing.location}</p>
                                                {outing.description && <p style={{ margin: '10px 0 0 0' }}>{outing.description}</p>}
                                            </div>
                                            
                                            {/* Capacity Badge */}
                                            <div className="capacity-badge" style={{
                                                marginLeft: '15px',
                                                padding: '8px 12px',
                                                backgroundColor: outing.is_full ? '#ffebee' : '#e8f5e9',
                                                borderRadius: '4px',
                                                textAlign: 'center',
                                                minWidth: '80px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                                                    {outing.capacity_type === 'vehicle' ? 'Seats' : 'Capacity'}
                                                </div>
                                                <div style={{
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    color: outing.is_full ? '#c62828' : '#2e7d32'
                                                }}>
                                                    {outing.capacity_type === 'vehicle'
                                                        ? `${outing.signup_count}/${outing.total_vehicle_capacity}`
                                                        : `${outing.signup_count}/${outing.max_participants}`
                                                    }
                                                </div>
                                                {outing.is_full && (
                                                    <div style={{ fontSize: '11px', color: '#c62828', fontWeight: 'bold', marginTop: '2px' }}>
                                                        FULL
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Warnings */}
                                        {outing.needs_two_deep_leadership && (
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '10px',
                                                backgroundColor: 'var(--alert-warning-bg)',
                                                color: 'var(--alert-warning-text)',
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                fontWeight: 'bold'
                                            }}>
                                                ⚠️ Needs {2 - outing.adult_count} more adult(s) for two-deep leadership
                                            </div>
                                        )}
                                        
                                        {outing.needs_female_leader && (
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '10px',
                                                backgroundColor: 'var(--alert-warning-bg)',
                                                color: 'var(--alert-warning-text)',
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                fontWeight: 'bold'
                                            }}>
                                                ⚠️ Needs female adult leader (female youth present)
                                            </div>
                                        )}
                                        
                                        {outing.capacity_type === 'vehicle' && outing.needs_more_drivers && (
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '10px',
                                                backgroundColor: 'var(--alert-warning-bg)',
                                                color: 'var(--alert-warning-text)',
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                fontWeight: 'bold'
                                            }}>
                                                ⚠️ Need more drivers! Current capacity: {outing.total_vehicle_capacity} seats for {outing.signup_count} participants
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 'contact-info' && (
                    <div>
                        <h2>Contact Information</h2>
                        <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
                            This information will be saved as your default for future signups. You can change it for each trip if needed.
                        </p>
                        <div style={{ display: 'grid', gap: '20px', padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email *</label>
                                <input
                                    type="email"
                                    value={contactInfo.email}
                                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                                    style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone *</label>
                                <input
                                    type="tel"
                                    value={contactInfo.phone}
                                    onChange={(e) => setContactInfo({ ...contactInfo, phone: formatPhoneNumber(e.target.value) })}
                                    placeholder="(555) 123-4567"
                                    style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginBottom: '0' }}>
                                    Format: (XXX) XXX-XXXX
                                </p>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Emergency Contact Name *</label>
                                <input
                                    type="text"
                                    value={contactInfo.emergency_contact_name}
                                    onChange={(e) => setContactInfo({ ...contactInfo, emergency_contact_name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Emergency Contact Phone *</label>
                                <input
                                    type="tel"
                                    value={contactInfo.emergency_contact_phone}
                                    onChange={(e) => setContactInfo({ ...contactInfo, emergency_contact_phone: formatPhoneNumber(e.target.value) })}
                                    placeholder="(555) 123-4567"
                                    style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginBottom: '0' }}>
                                    Format: (XXX) XXX-XXXX
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 'select-adults' && (
                    <div>
                        <h2>Select Adults</h2>
                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            Select adults attending (optional - skip if no adults)
                        </p>
                        {familyMembers.filter(m => m.member_type === 'adult').length === 0 ? (
                            <p>No adults in family. <a href="/family-setup">Add adults</a></p>
                        ) : (
                            <div className="member-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                {familyMembers.filter(m => m.member_type === 'adult').map(member => {
                                    const isSelected = selectedAdultIds.includes(member.id);
                                    const isExpired = member.youth_protection_expired === true;
                                    const canSelect = !isExpired;
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => canSelect && setSelectedAdultIds(prev =>
                                                prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id]
                                            )}
                                            style={{
                                                padding: '20px',
                                                border: isSelected ? '3px solid #4caf50' : isExpired ? '2px solid #c62828' : '1px solid #ddd',
                                                borderRadius: '8px',
                                                cursor: canSelect ? 'pointer' : 'not-allowed',
                                                backgroundColor: isSelected ? 'var(--alert-success-bg)' : isExpired ? 'var(--alert-error-bg)' : 'var(--card-bg)',
                                                position: 'relative',
                                                opacity: isExpired ? 0.7 : 1
                                            }}
                                        >
                                            {isSelected && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    width: '30px',
                                                    height: '30px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#4caf50',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '18px'
                                                }}>✓</div>
                                            )}
                                            <h3 style={{ margin: '0 0 10px 0' }}>{member.name}</h3>
                                            {member.vehicle_capacity && member.vehicle_capacity > 0 && (
                                                <p style={{ margin: '5px 0', color: '#1976d2', fontWeight: 'bold' }}>
                                                    🚗 {member.vehicle_capacity} seats
                                                </p>
                                            )}
                                            {member.has_youth_protection !== undefined && (
                                                <p style={{
                                                    margin: '5px 0',
                                                    fontSize: '12px',
                                                    color: member.youth_protection_expired ? '#c62828' : '#2e7d32',
                                                    fontWeight: member.youth_protection_expired ? 'bold' : 'normal'
                                                }}>
                                                    {member.youth_protection_expired
                                                        ? `⚠️ Youth Protection expires before trip ends - Cannot Sign Up`
                                                        : member.has_youth_protection
                                                            ? '✓ Youth Protection valid through trip'
                                                            : ''
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {selectedOuting?.capacity_type === 'vehicle' && selectedAdultIds.length > 0 && (
                            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--alert-info-bg)', borderRadius: '8px' }}>
                                <p style={{ margin: '0', fontWeight: 'bold' }}>
                                    Available Seats: {calculateAvailableSeats()}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 'select-scouts' && (
                    <div>
                        <h2>Select Scouts</h2>
                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            Select scouts attending (optional - skip if no scouts)
                        </p>
                        {selectedOuting?.capacity_type === 'vehicle' && (
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--alert-info-bg)', borderRadius: '8px' }}>
                                <p style={{ margin: '0', fontWeight: 'bold' }}>
                                    Available Seats: {calculateAvailableSeats()}
                                </p>
                            </div>
                        )}
                        {familyMembers.filter(m => m.member_type === 'scout').length === 0 ? (
                            <p>No scouts in family. <a href="/family-setup">Add scouts</a></p>
                        ) : (
                            <div className="member-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                {familyMembers.filter(m => m.member_type === 'scout').map(member => {
                                    const isSelected = selectedScoutIds.includes(member.id);
                                    const availableSeats = calculateAvailableSeats();
                                    const canSelect = selectedOuting?.capacity_type !== 'vehicle' || availableSeats > 0 || isSelected;
                                    
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => canSelect && setSelectedScoutIds(prev => 
                                                prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id]
                                            )}
                                            style={{
                                                padding: '20px',
                                                border: isSelected ? '3px solid #4caf50' : '1px solid #ddd',
                                                borderRadius: '8px',
                                                cursor: canSelect ? 'pointer' : 'not-allowed',
                                                backgroundColor: isSelected ? 'var(--alert-success-bg)' : canSelect ? 'var(--card-bg)' : 'var(--bg-tertiary)',
                                                position: 'relative',
                                                opacity: canSelect ? 1 : 0.6
                                            }}
                                        >
                                            {isSelected && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    width: '30px',
                                                    height: '30px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#4caf50',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '18px'
                                                }}>✓</div>
                                            )}
                                            <h3 style={{ margin: '0 0 10px 0' }}>{member.name}</h3>
                                            {member.troop_number && <p style={{ margin: '5px 0' }}>Troop {member.troop_number}</p>}
                                            {!canSelect && <p style={{ margin: '10px 0 0 0', color: '#c62828', fontSize: '13px' }}>No seats available</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 'review' && (
                    <div>
                        <h2>Review Signup</h2>
                        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                            <h3>Trip: {selectedOuting?.name}</h3>
                            <p><strong>Contact:</strong> {contactInfo.email} | {contactInfo.phone}</p>
                            <p><strong>Adults:</strong> {selectedAdultIds.length}</p>
                            <p><strong>Scouts:</strong> {selectedScoutIds.length}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="navigation-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                {currentStep !== 'select-trip' && (
                    <button
                        onClick={goToPreviousStep}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#757575',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        ← Back
                    </button>
                )}
                
                <div className="button-group" style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                    {currentStep !== 'select-trip' && (
                        <button
                            onClick={handleCancelWizard}
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: 'var(--card-bg)',
                                color: 'var(--alert-error-text)',
                                border: '2px solid var(--alert-error-border)',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            ✕ Cancel
                        </button>
                    )}
                    
                    {currentStep !== 'review' ? (
                        <button
                            onClick={goToNextStep}
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: loading ? '#ccc' : '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            {loading ? 'Submitting...' : 'Submit Signup'}
                        </button>
                    )}
                </div>
            </div>
            </div>
        </>
    );
};

export default SignupWizard;
