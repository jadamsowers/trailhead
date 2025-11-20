import React, { useState, useEffect } from 'react';
import {
    Trip,
    SignupFormData,
    DIETARY_RESTRICTIONS,
    ALLERGY_TYPES,
    ALLERGY_SEVERITIES
} from '../../types';
import { tripAPI, signupAPI, APIError } from '../../services/api';

const SignupForm: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [showTripLeadInfo, setShowTripLeadInfo] = useState<{[key: string]: boolean}>({});
    
    const [formData, setFormData] = useState<SignupFormData>({
        trip_id: '',
        email: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        participants: [{
            full_name: '',
            participant_type: 'scout',
            gender: 'male',
            age: '',
            troop_number: '',
            patrol: '',
            has_youth_protection_training: false,
            vehicle_capacity: '',
            dietary_restrictions: {},
            dietary_notes: '',
            allergies: []
        }]
    });

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            setLoading(true);
            const data = await tripAPI.getAll();
            // Filter to show only future trips
            const futureTrips = data.filter(trip => new Date(trip.trip_date) >= new Date());
            setTrips(futureTrips);
        } catch (err) {
            setError(err instanceof APIError ? err.message : 'Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    const handleTripSelect = (tripId: string) => {
        setSelectedTripId(tripId);
        setFormData({ ...formData, trip_id: tripId });
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleParticipantChange = (index: number, field: string, value: any) => {
        const updatedParticipants = [...formData.participants];
        updatedParticipants[index] = {
            ...updatedParticipants[index],
            [field]: value
        };
        setFormData({ ...formData, participants: updatedParticipants });
    };

    const handleDietaryRestrictionToggle = (index: number, restriction: string) => {
        const updatedParticipants = [...formData.participants];
        updatedParticipants[index].dietary_restrictions = {
            ...updatedParticipants[index].dietary_restrictions,
            [restriction]: !updatedParticipants[index].dietary_restrictions[restriction]
        };
        setFormData({ ...formData, participants: updatedParticipants });
    };

    const handleAddAllergy = (index: number) => {
        const updatedParticipants = [...formData.participants];
        updatedParticipants[index].allergies.push({
            type: '',
            severity: 'mild',
            notes: ''
        });
        setFormData({ ...formData, participants: updatedParticipants });
    };

    const handleAllergyChange = (participantIndex: number, allergyIndex: number, field: string, value: any) => {
        const updatedParticipants = [...formData.participants];
        updatedParticipants[participantIndex].allergies[allergyIndex] = {
            ...updatedParticipants[participantIndex].allergies[allergyIndex],
            [field]: value
        };
        setFormData({ ...formData, participants: updatedParticipants });
    };

    const handleRemoveAllergy = (participantIndex: number, allergyIndex: number) => {
        const updatedParticipants = [...formData.participants];
        updatedParticipants[participantIndex].allergies.splice(allergyIndex, 1);
        setFormData({ ...formData, participants: updatedParticipants });
    };

    const handleAddParticipant = () => {
        setFormData({
            ...formData,
            participants: [...formData.participants, {
                full_name: '',
                participant_type: 'scout',
                gender: 'male',
                age: '',
                troop_number: '',
                patrol: '',
                has_youth_protection_training: false,
                vehicle_capacity: '',
                dietary_restrictions: {},
                dietary_notes: '',
                allergies: []
            }]
        });
    };

    const handleRemoveParticipant = (index: number) => {
        if (formData.participants.length > 1) {
            const updatedParticipants = formData.participants.filter((_, i) => i !== index);
            setFormData({ ...formData, participants: updatedParticipants });
        }
    };

    const validateForm = (): string | null => {
        if (!formData.trip_id) return 'Please select a trip';
        if (!formData.email) return 'Email is required';
        if (!formData.phone) return 'Phone number is required';
        if (!formData.emergency_contact_name) return 'Emergency contact name is required';
        if (!formData.emergency_contact_phone) return 'Emergency contact phone is required';
        
        for (let i = 0; i < formData.participants.length; i++) {
            const p = formData.participants[i];
            if (!p.full_name) return `Participant ${i + 1}: Name is required`;
            if (!p.gender) return `Participant ${i + 1}: Gender is required`;
            
            if (p.participant_type === 'scout') {
                if (!p.age || parseInt(p.age) < 1) return `Participant ${i + 1}: Valid age is required for scouts`;
                if (!p.troop_number) return `Participant ${i + 1}: Troop number is required for scouts`;
            } else if (p.participant_type === 'adult') {
                if (!p.has_youth_protection_training) {
                    return `Participant ${i + 1}: All adult participants must have current Scouting America SAFE Youth Training. Please complete the training before signing up.`;
                }
            }
        }
        
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Transform form data to API format
            const signupData = {
                trip_id: formData.trip_id,
                family_contact: {
                    email: formData.email,
                    phone: formData.phone,
                    emergency_contact_name: formData.emergency_contact_name,
                    emergency_contact_phone: formData.emergency_contact_phone
                },
                participants: formData.participants.map(p => {
                    const baseParticipant = {
                        full_name: p.full_name,
                        participant_type: p.participant_type,
                        gender: p.gender,
                        dietary_restrictions: Object.entries(p.dietary_restrictions)
                            .filter(([_, checked]) => checked)
                            .map(([type]) => ({
                                restriction_type: type,
                                notes: p.dietary_notes || undefined
                            })),
                        allergies: p.allergies
                            .filter(a => a.type)
                            .map(a => ({
                                allergy_type: a.type,
                                severity: a.severity,
                                notes: a.notes || undefined
                            }))
                    };

                    if (p.participant_type === 'scout') {
                        return {
                            ...baseParticipant,
                            participant_type: 'scout' as const,
                            age: parseInt(p.age),
                            troop_number: p.troop_number,
                            patrol: p.patrol || undefined
                        };
                    } else {
                        return {
                            ...baseParticipant,
                            participant_type: 'adult' as const,
                            has_youth_protection_training: p.has_youth_protection_training,
                            vehicle_capacity: p.vehicle_capacity ? parseInt(p.vehicle_capacity) : undefined
                        };
                    }
                })
            };

            const response = await signupAPI.create(signupData);
            setSuccess(true);
            setWarnings(response.warnings || []);
            
            // Reset form after successful submission
            setTimeout(() => {
                setWarnings([]);
                setFormData({
                    trip_id: '',
                    email: '',
                    phone: '',
                    emergency_contact_name: '',
                    emergency_contact_phone: '',
                    participants: [{
                        full_name: '',
                        participant_type: 'scout',
                        gender: 'male',
                        age: '',
                        troop_number: '',
                        patrol: '',
                        has_youth_protection_training: false,
                        vehicle_capacity: '',
                        dietary_restrictions: {},
                        dietary_notes: '',
                        allergies: []
                    }]
                });
                setSelectedTripId('');
                setSuccess(false);
            }, 3000);
        } catch (err) {
            setError(err instanceof APIError ? err.message : 'Failed to submit signup');
        } finally {
            setLoading(false);
        }
    };

    const selectedTrip = trips.find(t => t.id === selectedTripId);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Trip Signup Form</h1>
            
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
                        ✓ Signup submitted successfully! You will receive a confirmation email shortly.
                    </div>
                    
                    {warnings.length > 0 && (
                        <div style={{
                            padding: '15px',
                            marginBottom: '20px',
                            backgroundColor: '#fff3e0',
                            color: '#e65100',
                            borderRadius: '4px',
                            border: '2px solid #f57c00'
                        }}>
                            <strong style={{ display: 'block', marginBottom: '10px' }}>Important Reminders:</strong>
                            {warnings.map((warning, index) => (
                                <div key={index} style={{ marginBottom: '8px', paddingLeft: '10px' }}>
                                    {warning}
                                </div>
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

            <form onSubmit={handleSubmit}>
                {/* Trip Selection */}
                <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h2>Select Trip</h2>
                    {loading && trips.length === 0 ? (
                        <p>Loading available trips...</p>
                    ) : trips.length === 0 ? (
                        <p>No upcoming trips available at this time.</p>
                    ) : (
                        <div>
                            {trips.map(trip => (
                                <div 
                                    key={trip.id}
                                    onClick={() => handleTripSelect(trip.id)}
                                    style={{
                                        padding: '15px',
                                        marginBottom: '10px',
                                        border: selectedTripId === trip.id ? '2px solid #1976d2' : '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedTripId === trip.id ? '#e3f2fd' : 'white'
                                    }}
                                >
                                    <h3 style={{ margin: '0 0 10px 0' }}>{trip.name}</h3>
                                    <p style={{ margin: '5px 0' }}>
                                        <strong>Date:</strong> {new Date(trip.trip_date).toLocaleDateString()}
                                    </p>
                                    <p style={{ margin: '5px 0' }}>
                                        <strong>Location:</strong> {trip.location}
                                    </p>
                                    
                                    {/* Scouting America Two-Deep Leadership Warning */}
                                    {trip.needs_two_deep_leadership && (
                                        <p style={{
                                            margin: '10px 0',
                                            padding: '10px',
                                            backgroundColor: '#fff3e0',
                                            color: '#e65100',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}>
                                            ⚠️ Scouting America Requirement: This trip needs at least {2 - trip.adult_count} more adult(s).
                                            Scouting America requires a minimum of 2 adults on every trip for two-deep leadership.
                                        </p>
                                    )}
                                    
                                    {/* Scouting America Female Leader Warning */}
                                    {trip.needs_female_leader && (
                                        <p style={{
                                            margin: '10px 0',
                                            padding: '10px',
                                            backgroundColor: '#fff3e0',
                                            color: '#e65100',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}>
                                            ⚠️ Scouting America Requirement: This trip has female youth participants and requires at least one female adult leader.
                                        </p>
                                    )}
                                    
                                    {trip.capacity_type === 'fixed' ? (
                                        <p style={{ margin: '5px 0' }}>
                                            <strong>Capacity:</strong> {trip.signup_count} / {trip.max_participants}
                                            {trip.is_full && (
                                                <span style={{ color: '#d32f2f', marginLeft: '10px' }}>FULL</span>
                                            )}
                                        </p>
                                    ) : (
                                        <>
                                            <p style={{ margin: '5px 0' }}>
                                                <strong>Participants:</strong> {trip.signup_count}
                                            </p>
                                            <p style={{ margin: '5px 0' }}>
                                                <strong>Vehicle Seats Available:</strong> {trip.available_spots}
                                                {trip.is_full && (
                                                    <span style={{ color: '#d32f2f', marginLeft: '10px' }}>FULL</span>
                                                )}
                                            </p>
                                            {trip.needs_more_drivers && (
                                                <p style={{
                                                    margin: '10px 0',
                                                    padding: '10px',
                                                    backgroundColor: '#fff3e0',
                                                    color: '#e65100',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    ⚠️ We need more adult drivers! Current vehicle capacity is {trip.total_vehicle_capacity} seats for {trip.signup_count} participants.
                                                    If you're an adult, please consider signing up with vehicle capacity to help transport scouts.
                                                </p>
                                            )}
                                            {trip.is_full && !trip.needs_more_drivers && (
                                                <p style={{
                                                    margin: '10px 0',
                                                    padding: '10px',
                                                    backgroundColor: '#ffebee',
                                                    color: '#c62828',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    This trip is currently full. We need more adults to sign up with vehicle capacity to accommodate additional participants.
                                                    If you're an adult willing to drive, your signup will help create space for more scouts!
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {trip.description && <p style={{ margin: '10px 0 0 0' }}>{trip.description}</p>}
                                    
                                    {/* Trip Lead Contact Information - Collapsible */}
                                    {(trip.trip_lead_name || trip.trip_lead_email || trip.trip_lead_phone) && (
                                        <div style={{ marginTop: '15px' }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowTripLeadInfo({
                                                    ...showTripLeadInfo,
                                                    [trip.id]: !showTripLeadInfo[trip.id]
                                                })}
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: '#2196f3',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {showTripLeadInfo[trip.id] ? '▼ Hide' : '▶ Show'} Trip Lead Contact Info
                                            </button>
                                            
                                            {showTripLeadInfo[trip.id] && (
                                                <div style={{
                                                    marginTop: '10px',
                                                    padding: '15px',
                                                    backgroundColor: '#e3f2fd',
                                                    borderRadius: '4px',
                                                    border: '1px solid #2196f3'
                                                }}>
                                                    <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Trip Lead Contact</h4>
                                                    {trip.trip_lead_name && (
                                                        <p style={{ margin: '5px 0' }}>
                                                            <strong>Name:</strong> {trip.trip_lead_name}
                                                        </p>
                                                    )}
                                                    {trip.trip_lead_email && (
                                                        <p style={{ margin: '5px 0' }}>
                                                            <strong>Email:</strong> <a href={`mailto:${trip.trip_lead_email}`} style={{ color: '#1976d2' }}>{trip.trip_lead_email}</a>
                                                        </p>
                                                    )}
                                                    {trip.trip_lead_phone && (
                                                        <p style={{ margin: '5px 0' }}>
                                                            <strong>Phone:</strong> <a href={`tel:${trip.trip_lead_phone}`} style={{ color: '#1976d2' }}>{trip.trip_lead_phone}</a>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedTrip && (
                    <>
                        {/* Family Contact Information */}
                        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <h2>Family Contact Information</h2>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleContactChange}
                                    required
                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleContactChange}
                                    required
                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Emergency Contact Name *
                                </label>
                                <input
                                    type="text"
                                    name="emergency_contact_name"
                                    value={formData.emergency_contact_name}
                                    onChange={handleContactChange}
                                    required
                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Emergency Contact Phone *
                                </label>
                                <input
                                    type="tel"
                                    name="emergency_contact_phone"
                                    value={formData.emergency_contact_phone}
                                    onChange={handleContactChange}
                                    required
                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        {/* Participants */}
                        {formData.participants.map((participant, index) => (
                            <div key={index} style={{ marginBottom: '30px', padding: '20px', border: '2px solid #1976d2', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h2>Participant {index + 1}</h2>
                                    {formData.participants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveParticipant(index)}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={participant.full_name}
                                        onChange={(e) => handleParticipantChange(index, 'full_name', e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Participant Type *
                                    </label>
                                    <select
                                        value={participant.participant_type}
                                        onChange={(e) => handleParticipantChange(index, 'participant_type', e.target.value)}
                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                    >
                                        <option value="scout">Scout</option>
                                        <option value="adult">Adult</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Gender *
                                    </label>
                                    <select
                                        value={participant.gender}
                                        onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {participant.participant_type === 'scout' ? (
                                    <>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Age *
                                            </label>
                                            <input
                                                type="number"
                                                value={participant.age}
                                                onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                                                min="1"
                                                max="99"
                                                required
                                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Troop Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={participant.troop_number}
                                                onChange={(e) => handleParticipantChange(index, 'troop_number', e.target.value)}
                                                required
                                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Patrol (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={participant.patrol}
                                                onChange={(e) => handleParticipantChange(index, 'patrol', e.target.value)}
                                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {selectedTrip.is_overnight && (
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={participant.has_youth_protection_training}
                                                        onChange={(e) => handleParticipantChange(index, 'has_youth_protection_training', e.target.checked)}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    <span>Has Scouting America Youth Protection Training (Required for overnight trips)</span>
                                                </label>
                                            </div>
                                        )}

                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Vehicle Capacity (Optional)
                                            </label>
                                            <input
                                                type="number"
                                                value={participant.vehicle_capacity}
                                                onChange={(e) => handleParticipantChange(index, 'vehicle_capacity', e.target.value)}
                                                min="0"
                                                placeholder="How many people can you transport?"
                                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Dietary Restrictions */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                                        Dietary Restrictions
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        {DIETARY_RESTRICTIONS.map(restriction => (
                                            <label key={restriction} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={participant.dietary_restrictions[restriction] || false}
                                                    onChange={() => handleDietaryRestrictionToggle(index, restriction)}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span style={{ textTransform: 'capitalize' }}>{restriction.replace('_', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={participant.dietary_notes}
                                        onChange={(e) => handleParticipantChange(index, 'dietary_notes', e.target.value)}
                                        placeholder="Additional dietary notes..."
                                        style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '10px' }}
                                    />
                                </div>

                                {/* Allergies */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                                        Allergies
                                    </label>
                                    {participant.allergies.map((allergy, allergyIndex) => (
                                        <div key={allergyIndex} style={{ 
                                            padding: '10px', 
                                            marginBottom: '10px', 
                                            border: '1px solid #ddd', 
                                            borderRadius: '4px',
                                            backgroundColor: '#f9f9f9'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <select
                                                    value={allergy.type}
                                                    onChange={(e) => handleAllergyChange(index, allergyIndex, 'type', e.target.value)}
                                                    style={{ flex: 1, marginRight: '10px', padding: '8px' }}
                                                >
                                                    <option value="">Select allergy type...</option>
                                                    {ALLERGY_TYPES.map(type => (
                                                        <option key={type} value={type}>
                                                            {type.replace('_', ' ')}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={allergy.severity}
                                                    onChange={(e) => handleAllergyChange(index, allergyIndex, 'severity', e.target.value)}
                                                    style={{ width: '120px', marginRight: '10px', padding: '8px' }}
                                                >
                                                    {ALLERGY_SEVERITIES.map(severity => (
                                                        <option key={severity} value={severity}>
                                                            {severity}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAllergy(index, allergyIndex)}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={allergy.notes}
                                                onChange={(e) => handleAllergyChange(index, allergyIndex, 'notes', e.target.value)}
                                                placeholder="Additional notes (e.g., EpiPen required)..."
                                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => handleAddAllergy(index)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        + Add Allergy
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={handleAddParticipant}
                            style={{
                                padding: '10px 20px',
                                marginBottom: '20px',
                                backgroundColor: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            + Add Another Participant
                        </button>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: loading ? '#ccc' : '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    width: '100%'
                                }}
                            >
                                {loading ? 'Submitting...' : 'Submit Signup'}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

export default SignupForm;