
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { FamilyMember, Outing } from '../../types';
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
// Styles removed in favor of Tailwind classes

const SignupWizard: React.FC = () => {
    const { user, isSignedIn } = useUser();

    // Helper function to format date, omitting year if it's the current year
    const formatOutingDate = (dateString: string): string => {
        const date = new Date(dateString);
        const currentYear = new Date().getFullYear();
        const dateYear = date.getFullYear();

        if (dateYear === currentYear) {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
    };

    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('select-trip');
    const [selectedOuting, setSelectedOuting] = useState<Outing | null>(null);
    const [editingSignupId, setEditingSignupId] = useState<string | null>(null);

    // Use SWR hooks for data fetching with automatic caching
    const { outings: rawOutings = [], isLoading: outingsLoading, error: outingsError } = useAvailableOutings();
    const { signups: mySignups = [], isLoading: signupsLoading, error: signupsError } = useMySignups();
    const { familyMembers = [], isLoading: familyLoading, error: familyError } = useFamilySummary(selectedOuting?.id);

    // Sort outings by date (earliest first)
    const outings = [...rawOutings].sort((a, b) =>
        new Date(a.outing_date).getTime() - new Date(b.outing_date).getTime()
    );

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
        if (!window.confirm(`Are you sure you want to cancel your signup for "${outingName}" ? This action cannot be undone.`)) {
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
            <div className="w-full">
                <h1 className="text-3xl font-bold font-heading text-sa-dark-blue mb-6">{editingSignupId ? '✏️ Edit Signup' : 'Outing Signup'}</h1>

                {editingSignupId && (
                    <div className="p-4 mb-5 bg-blue-50 text-blue-800 rounded-lg border-2 border-blue-600">
                        <strong>Editing Mode:</strong> You're editing your signup for {selectedOuting?.name}. Make your changes and submit to update.
                    </div>
                )}

                {success && (
                    <>
                        <div className="p-4 mb-5 bg-green-50 text-green-800 rounded-lg font-bold border border-green-200">
                            ✓ Signup {editingSignupId ? 'updated' : 'submitted'} successfully!
                        </div>

                        {warnings.length > 0 && (
                            <div className="p-4 mb-5 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                                <strong>Important Reminders:</strong>
                                {warnings.map((warning, index) => (
                                    <div key={index} className="mt-2">{warning}</div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {error && (
                    <div className="p-4 mb-5 bg-red-50 text-red-800 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                {/* Progress Indicator - Only show after trip selection */}
                {currentStep !== 'select-trip' && (
                    <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center">
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
                                        <div className="flex flex-col items-center flex-1">
                                            <div className={`
w - 10 h - 10 rounded - full flex items - center justify - center font - bold text - lg mb - 2 transition - colors duration - 300
                                            ${isComplete || isCurrent ? 'bg-sa-blue text-white shadow-md' : 'bg-gray-200 text-white'}
`}>
                                                {isComplete ? '✓' : step.number}
                                            </div>
                                            <div className={`
text - xs text - center transition - colors duration - 300
                                            ${isCurrent ? 'font-bold text-sa-blue' : isComplete ? 'text-sa-blue' : 'text-gray-400'}
`}>
                                                {step.label}
                                            </div>
                                        </div>
                                        {index < arr.length - 1 && (
                                            <div className={`
flex - 1 h - 0.5 mb - 6 transition - colors duration - 300
                                            ${isComplete ? 'bg-sa-blue' : 'bg-gray-200'}
`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* My Signups Section - Show before trip selection */}
                {mySignups.length > 0 && currentStep === 'select-trip' && (
                    <div className="mb-10 glass-panel p-8">
                        <h2 className="text-green-700 mb-4 text-2xl font-semibold">✓ My Signups ({mySignups.length})</h2>
                        <p className="mb-6 text-gray-600">
                            Outings you're already signed up for. Click to view details or cancel.
                        </p>
                        <div className="grid gap-4">
                            {mySignups.map(signup => {
                                const outing = outings.find(o => o.id === signup.outing_id);
                                if (!outing) return null;

                                const isExpanded = expandedSignupId === signup.id;
                                const isCanceling = cancelingSignupId === signup.id;

                                return (
                                    <div
                                        key={signup.id}
                                        className={`
rounded - lg overflow - hidden transition - all duration - 200
                                        ${isExpanded ? 'border-2 border-green-600 shadow-md' : 'border border-green-200'}
bg - green - 50
    `}
                                    >
                                        <div
                                            onClick={() => setExpandedSignupId(isExpanded ? '' : signup.id)}
                                            className={`
p - 5 cursor - pointer transition - colors
                                            ${isExpanded ? 'bg-green-100' : 'hover:bg-green-100/50'}
`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                                                        <h3 className="m-0 text-green-800 font-bold text-lg">✓ {outing.name}</h3>
                                                        <span className="text-lg font-bold text-green-700 whitespace-nowrap">
                                                            📅 {formatOutingDate(outing.outing_date)}
                                                            {outing.end_date && ` - ${formatOutingDate(outing.end_date)} `}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <strong className="text-green-900">Participants ({signup.participant_count}):</strong>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {signup.participants.map(participant => (
                                                                <span
                                                                    key={participant.id}
                                                                    className="inline-flex items-center px-3 py-1 bg-white text-green-800 rounded-full text-sm font-medium border border-green-200 shadow-sm"
                                                                >
                                                                    {participant.is_adult ? '🌲' : '🌱'} {participant.name}
                                                                    {participant.vehicle_capacity > 0 && (
                                                                        <span className="ml-1 font-bold text-blue-600">
                                                                            🚗: {participant.vehicle_capacity}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xl ml-4 text-green-700">
                                                    {isExpanded ? '▼' : '▶'}
                                                </span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-5 bg-white border-t-2 border-green-600">
                                                <div className="mb-5">
                                                    <h4 className="mb-2 font-bold text-gray-800">Outing Details</h4>
                                                    <p className="my-1 text-gray-600"><strong>Location:</strong> {outing.location}</p>
                                                    {outing.description && <p className="my-2 text-gray-600">{outing.description}</p>}
                                                </div>

                                                <div className="mb-5">
                                                    <h4 className="mb-2 font-bold text-gray-800">Your Participants</h4>
                                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                                                        {signup.participants.map(participant => (
                                                            <div
                                                                key={participant.id}
                                                                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                            >
                                                                <p className="m-0 mb-1 font-bold text-gray-800">{participant.name}</p>
                                                                <p className="my-1 text-sm text-gray-600">
                                                                    {participant.is_adult ? '🌲 Adult' : '🌱 Scout'}
                                                                </p>
                                                                {participant.troop_number && (
                                                                    <p className="my-1 text-sm text-gray-600">Troop {participant.troop_number}</p>
                                                                )}
                                                                {participant.vehicle_capacity > 0 && (
                                                                    <p className="my-1 text-sm text-blue-600 font-bold">
                                                                        🚗 {participant.vehicle_capacity} seats
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <h4 className="mb-2 text-sm font-bold text-gray-700">Contact Information</h4>
                                                    <p className="my-1 text-sm text-gray-600"><strong>Email:</strong> {signup.family_contact_email}</p>
                                                    <p className="my-1 text-sm text-gray-600"><strong>Phone:</strong> {signup.family_contact_phone}</p>
                                                </div>

                                                <div className="flex gap-3 flex-wrap">
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
                                                        className="flex-1 py-3 px-6 bg-sa-blue text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                                    >
                                                        ✏️ Edit Signup
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelSignup(signup.id, outing.name);
                                                        }}
                                                        disabled={isCanceling}
                                                        className={`
flex - 1 py - 3 px - 6 text - white rounded - lg font - bold transition - colors shadow - sm
                                                        ${isCanceling ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}
`}
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
                <div className="mb-8">
                    {currentStep === 'select-trip' && (
                        <div>
                            <h2 className="text-3xl font-bold font-heading text-sa-dark-blue mb-6 text-center">
                                {mySignups.length > 0 ? 'Sign Up for Another Outing' : 'Select an Outing'}
                            </h2>
                            {outingsLoading && outings.length === 0 ? (
                                <p>Loading available outings...</p>
                            ) : outingsError ? (
                                <p className="text-red-700">Error loading outings: {outingsError.message}</p>
                            ) : outings.filter(o => !mySignupOutingIds.has(o.id)).length === 0 ? (
                                <p>No upcoming outings available{mySignups.length > 0 ? ' (you\'re signed up for all available outings)' : ''}.</p>
                            ) : (
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
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
                                            className={`
glass-card p-8 rounded-lg cursor-pointer transition-all duration-200 relative group
${selectedOuting?.id === outing.id
                                                    ? 'border-2 border-sa-blue bg-blue-50/80 shadow-lg scale-105'
                                                    : 'border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5'}                                                }
`}
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                                                        <h3 className="text-xl font-bold font-heading text-sa-dark-blue m-0">{outing.name}</h3>
                                                        <span className="text-lg font-bold text-sa-blue whitespace-nowrap">
                                                            📅 {formatOutingDate(outing.outing_date)}
                                                            {outing.end_date && ` - ${formatOutingDate(outing.end_date)} `}
                                                        </span>
                                                    </div>
                                                    <p className="my-1 text-gray-700"><strong>Location:</strong> {outing.location}</p>
                                                    {outing.description && <p className="mt-2 text-gray-600">{outing.description}</p>}
                                                </div>

                                                {/* Capacity Badge */}
                                                <div className={`
px - 4 py - 2 rounded - lg text - center min - w - [100px] shadow - sm
                                                ${outing.is_full ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}
`}>
                                                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">
                                                        {outing.capacity_type === 'vehicle' ? 'Seats' : 'Capacity'}
                                                    </div>
                                                    <div className={`
text - xl font - bold
                                                    ${outing.is_full ? 'text-red-700' : 'text-green-700'}
`}>
                                                        {outing.capacity_type === 'vehicle'
                                                            ? `${outing.signup_count}/${outing.total_vehicle_capacity}`
                                                            : `${outing.signup_count}/${outing.max_participants}`
                                                        }
                                                    </div >
                                                    {
                                                        outing.is_full && (
                                                            <div className="text-xs text-red-700 font-bold mt-1">
                                                                FULL
                                                            </div>
                                                        )
                                                    }
                                                </div >
                                            </div >

                                            {/* Warnings */}
                                            {
                                                outing.needs_two_deep_leadership && (
                                                    <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm font-bold border border-yellow-200 flex items-center gap-2">
                                                        <span>⚠️</span> Needs {2 - outing.adult_count} more adult(s) for two-deep leadership
                                                    </div>
                                                )
                                            }

                                            {
                                                outing.needs_female_leader && (
                                                    <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm font-bold border border-yellow-200 flex items-center gap-2">
                                                        <span>⚠️</span> Needs female adult leader (female youth present)
                                                    </div>
                                                )
                                            }

                                            {
                                                outing.capacity_type === 'vehicle' && outing.needs_more_drivers && (
                                                    <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm font-bold border border-yellow-200 flex items-center gap-2">
                                                        <span>⚠️</span> Need more drivers! Current capacity: {outing.total_vehicle_capacity} seats for {outing.signup_count} participants
                                                    </div>
                                                )
                                            }
                                        </div >
                                    ))}
                                </div >
                            )}
                        </div >
                    )}

                    {
                        currentStep === 'contact-info' && (
                            <div>
                                <h2 className="text-2xl font-bold font-heading text-sa-dark-blue mb-4">Contact Information</h2>
                                <p className="mb-5 text-gray-600 text-sm">
                                    This information will be saved as your default for future signups. You can change it for each trip if needed.
                                </p>
                                <div className="grid gap-5 p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <div>
                                        <label className="block mb-1 font-bold text-gray-700">Email *</label>
                                        <input
                                            type="email"
                                            value={contactInfo.email}
                                            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                                            className="w-full p-2.5 text-base rounded-md border border-gray-300 focus:border-sa-blue focus:ring-1 focus:ring-sa-blue outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-gray-700">Phone *</label>
                                        <input
                                            type="tel"
                                            value={contactInfo.phone}
                                            onChange={(e) => setContactInfo({ ...contactInfo, phone: formatPhoneNumber(e.target.value) })}
                                            placeholder="(555) 123-4567"
                                            className="w-full p-2.5 text-base rounded-md border border-gray-300 focus:border-sa-blue focus:ring-1 focus:ring-sa-blue outline-none transition-colors"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Format: (XXX) XXX-XXXX
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-gray-700">Emergency Contact Name *</label>
                                        <input
                                            type="text"
                                            value={contactInfo.emergency_contact_name}
                                            onChange={(e) => setContactInfo({ ...contactInfo, emergency_contact_name: e.target.value })}
                                            className="w-full p-2.5 text-base rounded-md border border-gray-300 focus:border-sa-blue focus:ring-1 focus:ring-sa-blue outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-gray-700">Emergency Contact Phone *</label>
                                        <input
                                            type="tel"
                                            value={contactInfo.emergency_contact_phone}
                                            onChange={(e) => setContactInfo({ ...contactInfo, emergency_contact_phone: formatPhoneNumber(e.target.value) })}
                                            placeholder="(555) 123-4567"
                                            className="w-full p-2.5 text-base rounded-md border border-gray-300 focus:border-sa-blue focus:ring-1 focus:ring-sa-blue outline-none transition-colors"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Format: (XXX) XXX-XXXX
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        currentStep === 'select-adults' && (
                            <div>
                                <h2 className="text-2xl font-bold font-heading text-sa-dark-blue mb-4">Select Adults</h2>
                                <p className="mb-5 text-gray-600">
                                    Select adults attending (optional - skip if no adults)
                                </p>
                                {familyMembers.filter(m => m.member_type === 'adult').length === 0 ? (
                                    <p>No adults in family. <a href="/family-setup" className="text-sa-blue hover:underline">Add adults</a></p>
                                ) : (
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
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
                                                    className={`
                                                    p-5 rounded-lg border cursor-pointer relative transition-all duration-200
                                                    ${isSelected
                                                            ? 'border-[3px] border-green-500 bg-green-50 shadow-md scale-[1.02]'
                                                            : isExpired
                                                                ? 'border-2 border-red-200 bg-red-50 opacity-70 cursor-not-allowed'
                                                                : 'border-gray-200 bg-white hover:border-sa-blue hover:shadow-md hover:-translate-y-0.5'
                                                        }
                                                `}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                                                            ✓
                                                        </div>
                                                    )}
                                                    <h3 className="m-0 mb-2 font-bold text-lg text-gray-800">{member.name}</h3>
                                                    {(member.vehicle_capacity ?? 0) > 0 && (
                                                        <p className="my-1 text-blue-600 font-bold flex items-center gap-1">
                                                            <span>🚗</span> {member.vehicle_capacity ?? 0} seats
                                                        </p>
                                                    )}
                                                    {member.has_youth_protection !== undefined && (
                                                        <p className={`
                                                        my-1 text-xs font-medium
                                                        ${member.youth_protection_expired ? 'text-red-700 font-bold' : 'text-green-700'}
                                                    `}>
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
                                    <div className="mt-5 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="m-0 font-bold text-blue-800">
                                            Available Seats: {calculateAvailableSeats()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {
                        currentStep === 'select-scouts' && (
                            <div>
                                <h2 className="text-2xl font-bold font-heading text-sa-dark-blue mb-4">Select Scouts</h2>
                                <p className="mb-5 text-gray-600">
                                    Select scouts attending (optional - skip if no scouts)
                                </p>
                                {selectedOuting?.capacity_type === 'vehicle' && (
                                    <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="m-0 font-bold text-blue-800">
                                            Available Seats: {calculateAvailableSeats()}
                                        </p>
                                    </div>
                                )}
                                {familyMembers.filter(m => m.member_type === 'scout').length === 0 ? (
                                    <p>No scouts in family. <a href="/family-setup" className="text-sa-blue hover:underline">Add scouts</a></p>
                                ) : (
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
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
                                                    className={`
                                                    p-5 rounded-lg border cursor-pointer relative transition-all duration-200
                                                    ${isSelected
                                                            ? 'border-[3px] border-green-500 bg-green-50 shadow-md scale-[1.02]'
                                                            : canSelect
                                                                ? 'border-gray-200 bg-white hover:border-sa-blue hover:shadow-md hover:-translate-y-0.5'
                                                                : 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed'
                                                        }
                                                `}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                                                            ✓
                                                        </div>
                                                    )}
                                                    <h3 className="m-0 mb-2 font-bold text-lg text-gray-800">{member.name}</h3>
                                                    {member.troop_number && <p className="my-1 text-gray-600">Troop {member.troop_number}</p>}
                                                    {!canSelect && <p className="mt-2 text-red-600 text-sm font-bold">No seats available</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {
                        currentStep === 'review' && (
                            <div>
                                <h2 className="text-2xl font-bold font-heading text-sa-dark-blue mb-4">Review Signup</h2>
                                <div className="mb-5 p-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="text-xl font-bold text-sa-dark-blue mb-3">Trip: {selectedOuting?.name}</h3>
                                    <p className="mb-2 text-gray-700"><strong>Contact:</strong> {contactInfo.email} | {contactInfo.phone}</p>
                                    <p className="mb-2 text-gray-700"><strong>Adults:</strong> {selectedAdultIds.length}</p>
                                    <p className="mb-2 text-gray-700"><strong>Scouts:</strong> {selectedScoutIds.length}</p>
                                </div>
                            </div>
                        )
                    }
                </div >

                {/* Navigation Buttons */}
                {/* Navigation Buttons */}
                <div className="flex gap-3 justify-between mt-8 pt-5 border-t border-gray-200">
                    {currentStep !== 'select-trip' && (
                        <button
                            onClick={goToPreviousStep}
                            disabled={loading}
                            className={`
                                bg-gray-500 text-white font-bold transition-colors shadow-sm
                                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}
                            `}
                        >
                            ← Back
                        </button>
                    )}

                    <div className="flex gap-3 ml-auto">
                        {currentStep !== 'select-trip' && (
                            <button
                                onClick={handleCancelWizard}
                                disabled={loading}
                                className={`
                                    bg-white text-red-600 border-2 border-red-200 font-bold transition-colors shadow-sm
                                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 hover:border-red-300'}
                                `}
                            >
                                ✕ Cancel
                            </button>
                        )}

                        {currentStep !== 'review' ? (
                            <button
                                onClick={goToNextStep}
                                disabled={loading}
                                className={`
                                    bg-sa-blue text-white font-bold transition-colors shadow-sm
                                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
                                `}
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={`
                                    py-3 px-6 text-white rounded-lg font-bold transition-colors shadow-sm
                                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
                                `}
                            >
                                {loading ? 'Submitting...' : 'Submit Signup'}
                            </button>
                        )}
                    </div>
                </div>
            </div >
        </>
    );
};

export default SignupWizard;
