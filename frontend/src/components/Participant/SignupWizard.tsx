import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Outing, FamilyMemberSummary } from '../../types';
import { outingAPI, signupAPI, familyAPI, userAPI, APIError } from '../../services/api';
import { formatPhoneNumber, validatePhoneWithMessage } from '../../utils/phoneUtils';

type WizardStep = 'select-trip' | 'contact-info' | 'select-adults' | 'select-scouts' | 'review';

const SignupWizard: React.FC = () => {
    const { user, isSignedIn } = useUser();
    
    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('select-trip');
    const [selectedOuting, setSelectedOuting] = useState<Outing | null>(null);
    
    // Data state
    const [outings, setOutings] = useState<Outing[]>([]);
    const [familyMembers, setFamilyMembers] = useState<FamilyMemberSummary[]>([]);
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
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    useEffect(() => {
        loadOutings();
        if (isSignedIn) {
            loadFamilyMembers();
            loadUserContactInfo();
        }
    }, [isSignedIn, user]);

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

    const loadOutings = async () => {
        try {
            setLoading(true);
            const data = await outingAPI.getAll();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const futureOutings = data.filter(outing => {
                const outingDate = new Date(outing.outing_date);
                outingDate.setHours(0, 0, 0, 0);
                return outingDate >= today;
            });
            setOutings(futureOutings);
        } catch (err) {
            setError(err instanceof APIError ? err.message : 'Failed to load outings');
        } finally {
            setLoading(false);
        }
    };

    const loadFamilyMembers = async () => {
        try {
            const data = await familyAPI.getSummary();
            setFamilyMembers(data);
        } catch (err) {
            console.error('Failed to load family members:', err);
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
            
            // Save contact info as user's default for future signups
            try {
                await userAPI.updateContactInfo({
                    phone: contactInfo.phone,
                    emergency_contact_name: contactInfo.emergency_contact_name,
                    emergency_contact_phone: contactInfo.emergency_contact_phone
                });
            } catch (err) {
                console.error('Failed to save contact info as default:', err);
                // Continue with signup even if saving defaults fails
            }
            
            const signupData = {
                outing_id: selectedOuting.id,
                family_contact: {
                    email: contactInfo.email,
                    phone: contactInfo.phone,
                    emergency_contact_name: contactInfo.emergency_contact_name,
                    emergency_contact_phone: contactInfo.emergency_contact_phone
                },
                family_member_ids: allSelectedIds
            };

            const response = await signupAPI.create(signupData);
            
            setSuccess(true);
            setWarnings(response.warnings || []);
            
            setTimeout(() => {
                resetForm();
            }, 3000);
        } catch (err) {
            setError(err instanceof APIError ? err.message : 'Failed to submit signup');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentStep('select-trip');
        setSelectedOuting(null);
        setSelectedAdultIds([]);
        setSelectedScoutIds([]);
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

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h1>Outing Signup</h1>
            
            {success && (
                <>
                    <div style={{
                        padding: '15px',
                        marginBottom: '20px',
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                    }}>
                        ✓ Signup submitted successfully!
                    </div>
                    
                    {warnings.length > 0 && (
                        <div style={{
                            padding: '15px',
                            marginBottom: '20px',
                            backgroundColor: '#fff3e0',
                            color: '#e65100',
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
                <div style={{
                    padding: '15px',
                    marginBottom: '20px',
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    borderRadius: '4px'
                }}>
                    {error}
                </div>
            )}

            {/* Progress Indicator - Only show after trip selection */}
            {currentStep !== 'select-trip' && (
                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
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
                                        <div style={{
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

            {/* Step Content */}
            <div style={{ marginBottom: '30px' }}>
                {currentStep === 'select-trip' && (
                    <div>
                        <h2>Select a Trip</h2>
                        {loading && outings.length === 0 ? (
                            <p>Loading available outings...</p>
                        ) : outings.length === 0 ? (
                            <p>No upcoming outings available.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {outings.map(outing => (
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
                                            border: selectedOuting?.id === outing.id ? '3px solid #1976d2' : '1px solid #ddd',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedOuting?.id === outing.id ? '#e3f2fd' : 'white',
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                                            <div style={{
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
                                                backgroundColor: '#fff3e0',
                                                color: '#e65100',
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
                                                backgroundColor: '#fff3e0',
                                                color: '#e65100',
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
                                                backgroundColor: '#fff3e0',
                                                color: '#e65100',
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
                        <div style={{ display: 'grid', gap: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
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
                                                backgroundColor: isSelected ? '#e8f5e9' : isExpired ? '#ffebee' : 'white',
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
                                                        ? '⚠️ Youth Protection EXPIRED - Cannot Sign Up'
                                                        : member.has_youth_protection
                                                            ? '✓ Youth Protection Trained'
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
                            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
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
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                                <p style={{ margin: '0', fontWeight: 'bold' }}>
                                    Available Seats: {calculateAvailableSeats()}
                                </p>
                            </div>
                        )}
                        {familyMembers.filter(m => m.member_type === 'scout').length === 0 ? (
                            <p>No scouts in family. <a href="/family-setup">Add scouts</a></p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
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
                                                backgroundColor: isSelected ? '#e8f5e9' : canSelect ? 'white' : '#f5f5f5',
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
                        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                            <h3>Trip: {selectedOuting?.name}</h3>
                            <p><strong>Contact:</strong> {contactInfo.email} | {contactInfo.phone}</p>
                            <p><strong>Adults:</strong> {selectedAdultIds.length}</p>
                            <p><strong>Scouts:</strong> {selectedScoutIds.length}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
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
                            fontWeight: 'bold',
                            marginLeft: 'auto'
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
                            fontWeight: 'bold',
                            marginLeft: 'auto'
                        }}
                    >
                        {loading ? 'Submitting...' : 'Submit Signup'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SignupWizard;
