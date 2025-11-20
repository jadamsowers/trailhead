import React, { useState, useEffect } from 'react';
import { Trip, TripCreate, SignupResponse, ParticipantResponse } from '../../types';
import { tripAPI, csvAPI, signupAPI, APIError } from '../../services/api';

const TripAdmin: React.FC = () => {
    // Helper function to get next Friday-Sunday dates
    const getNextWeekendDates = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
        
        // Calculate days until next Friday
        let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        if (daysUntilFriday === 0 && today.getDay() === 5) {
            // If today is Friday, get next Friday
            daysUntilFriday = 7;
        }
        
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + daysUntilFriday);
        
        const nextSunday = new Date(nextFriday);
        nextSunday.setDate(nextFriday.getDate() + 2);
        
        // Format as YYYY-MM-DD for date input
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        return {
            friday: formatDate(nextFriday),
            sunday: formatDate(nextSunday)
        };
    };

    const defaultDates = getNextWeekendDates();

    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
    const [tripSignups, setTripSignups] = useState<{ [tripId: string]: SignupResponse[] }>({});
    const [loadingSignups, setLoadingSignups] = useState<{ [tripId: string]: boolean }>({});
    const [isCreateTripExpanded, setIsCreateTripExpanded] = useState(false);
    const [editingTripId, setEditingTripId] = useState<string | null>(null);
    const [editTrip, setEditTrip] = useState<TripCreate | null>(null);
    const [newTrip, setNewTrip] = useState<TripCreate>({
        name: '',
        trip_date: defaultDates.friday,
        end_date: defaultDates.sunday,
        location: '',
        description: '',
        max_participants: 30,
        capacity_type: 'vehicle',
        is_overnight: true,
        trip_lead_name: '',
        trip_lead_email: '',
        trip_lead_phone: ''
    });

    // Load trips on component mount
    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await tripAPI.getAll();
            setTrips(data);
        } catch (err) {
            console.error('Error loading trips:', err);
            if (err instanceof APIError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to load trips');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadTripSignups = async (tripId: string) => {
        if (tripSignups[tripId]) {
            // Already loaded
            return;
        }

        try {
            setLoadingSignups({ ...loadingSignups, [tripId]: true });
            const signups = await signupAPI.getByTrip(tripId);
            setTripSignups({ ...tripSignups, [tripId]: signups });
        } catch (err) {
            console.error('Error loading signups:', err);
            if (err instanceof APIError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to load signups');
            }
        } finally {
            setLoadingSignups({ ...loadingSignups, [tripId]: false });
        }
    };

    const handleTripClick = async (tripId: string) => {
        if (expandedTripId === tripId) {
            // Collapse
            setExpandedTripId(null);
        } else {
            // Expand and load signups if not already loaded
            setExpandedTripId(tripId);
            await loadTripSignups(tripId);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setNewTrip({
                ...newTrip,
                [name]: checked
            });
        } else if (name === 'max_participants') {
            setNewTrip({
                ...newTrip,
                [name]: parseInt(value) || 0
            });
        } else {
            setNewTrip({
                ...newTrip,
                [name]: value
            });
        }
    };

    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await tripAPI.create(newTrip);
            // Reset form with new default dates
            const newDefaultDates = getNextWeekendDates();
            setNewTrip({
                name: '',
                trip_date: newDefaultDates.friday,
                end_date: newDefaultDates.sunday,
                location: '',
                description: '',
                max_participants: 30,
                capacity_type: 'vehicle',
                is_overnight: true,
                trip_lead_name: '',
                trip_lead_email: '',
                trip_lead_phone: ''
            });
            // Reload trips
            await loadTrips();
        } catch (err) {
            console.error('Error creating trip:', err);
            if (err instanceof APIError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to create trip');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditTrip = (trip: Trip) => {
        setEditingTripId(trip.id);
        setEditTrip({
            name: trip.name,
            trip_date: trip.trip_date,
            end_date: trip.end_date || '',
            location: trip.location,
            description: trip.description || '',
            max_participants: trip.max_participants,
            capacity_type: trip.capacity_type,
            is_overnight: trip.is_overnight,
            trip_lead_name: trip.trip_lead_name || '',
            trip_lead_email: trip.trip_lead_email || '',
            trip_lead_phone: trip.trip_lead_phone || ''
        });
        setExpandedTripId(null);
    };

    const handleCancelEdit = () => {
        setEditingTripId(null);
        setEditTrip(null);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!editTrip) return;
        
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setEditTrip({
                ...editTrip,
                [name]: checked
            });
        } else if (name === 'max_participants') {
            setEditTrip({
                ...editTrip,
                [name]: parseInt(value) || 0
            });
        } else {
            setEditTrip({
                ...editTrip,
                [name]: value
            });
        }
    };

    const handleUpdateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTripId || !editTrip) return;

        try {
            setLoading(true);
            setError(null);
            await tripAPI.update(editingTripId, editTrip);
            setEditingTripId(null);
            setEditTrip(null);
            await loadTrips();
        } catch (err) {
            console.error('Error updating trip:', err);
            if (err instanceof APIError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to update trip');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrip = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this trip?')) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await tripAPI.delete(id);
            await loadTrips();
        } catch (err) {
            console.error('Error deleting trip:', err);
            if (err instanceof APIError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to delete trip');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportRoster = async (tripId: string, tripName: string) => {
        try {
            setLoading(true);
            setError(null);
            const blob = await csvAPI.exportRoster(tripId);
            csvAPI.downloadCSV(blob, `${tripName.replace(/\s+/g, '_')}_roster.csv`);
        } catch (err) {
            console.error('Error exporting roster:', err);
            if (err instanceof APIError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to export roster');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportRosterPDF = async (tripId: string, tripName: string) => {
        try {
            setLoading(true);
            setError(null);
            const blob = await csvAPI.exportRosterPDF(tripId);
            csvAPI.downloadPDF(blob, `${tripName.replace(/\s+/g, '_')}_roster.pdf`);
        } catch (err) {
            console.error('Error exporting roster PDF:', err);
            if (err instanceof APIError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to export roster PDF');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderParticipantsTable = (participants: ParticipantResponse[], isAdult: boolean) => {
        if (participants.length === 0) return null;

        return (
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: isAdult ? '#1976d2' : '#f57c00', color: 'white' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Age</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Gender</th>
                            {!isAdult && <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Troop/Patrol</th>}
                            {isAdult && <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Training</th>}
                            {isAdult && <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Vehicle</th>}
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Dietary</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Allergies</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((participant, index) => (
                            <tr key={participant.id} style={{
                                backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                                borderBottom: '1px solid #eee'
                            }}>
                                <td style={{ padding: '12px', fontWeight: '500' }}>{participant.name}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>{isAdult ? '21+' : participant.age}</td>
                                <td style={{ padding: '12px', textAlign: 'center', textTransform: 'capitalize' }}>{participant.gender}</td>
                                {!isAdult && (
                                    <td style={{ padding: '12px' }}>
                                        {participant.troop_number && (
                                            <div>
                                                <div><strong>Troop:</strong> {participant.troop_number}</div>
                                                {participant.patrol_name && <div><strong>Patrol:</strong> {participant.patrol_name}</div>}
                                            </div>
                                        )}
                                    </td>
                                )}
                                {isAdult && (
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {participant.has_youth_protection ? (
                                            <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓</span>
                                        ) : (
                                            <span style={{ color: '#d32f2f' }}>✗</span>
                                        )}
                                    </td>
                                )}
                                {isAdult && (
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
                                        {participant.vehicle_capacity > 0 ? `🚗 ${participant.vehicle_capacity}` : '-'}
                                    </td>
                                )}
                                <td style={{ padding: '12px' }}>
                                    {participant.dietary_restrictions.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {participant.dietary_restrictions.map((restriction, idx) => (
                                                <span key={idx} style={{
                                                    padding: '2px 6px',
                                                    backgroundColor: '#e8f5e9',
                                                    border: '1px solid #4caf50',
                                                    borderRadius: '3px',
                                                    fontSize: '11px',
                                                    color: '#2e7d32',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {restriction}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: '#999' }}>None</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {participant.allergies.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {participant.allergies.map((allergy, idx) => (
                                                <span key={idx} style={{
                                                    padding: '2px 6px',
                                                    backgroundColor: '#ffebee',
                                                    border: '1px solid #f44336',
                                                    borderRadius: '3px',
                                                    fontSize: '11px',
                                                    color: '#c62828',
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    ⚠️ {allergy}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: '#999' }}>None</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                                    {participant.medical_notes || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderTripSignups = (tripId: string) => {
        const signups = tripSignups[tripId];
        const isLoading = loadingSignups[tripId];

        if (isLoading) {
            return <p style={{ padding: '20px', textAlign: 'center' }}>Loading participants...</p>;
        }

        if (!signups || signups.length === 0) {
            return <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No signups yet for this trip.</p>;
        }

        // Group all participants by type
        const allAdults: ParticipantResponse[] = [];
        const allScouts: ParticipantResponse[] = [];

        signups.forEach(signup => {
            signup.participants.forEach(participant => {
                if (participant.is_adult) {
                    allAdults.push(participant);
                } else {
                    allScouts.push(participant);
                }
            });
        });

        return (
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Participant Details</h3>
                
                {allAdults.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h4 style={{
                            padding: '10px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            borderRadius: '4px 4px 0 0',
                            margin: '0'
                        }}>
                            Adults ({allAdults.length})
                        </h4>
                        {renderParticipantsTable(allAdults, true)}
                    </div>
                )}

                {allScouts.length > 0 && (
                    <div>
                        <h4 style={{
                            padding: '10px',
                            backgroundColor: '#f57c00',
                            color: 'white',
                            borderRadius: '4px 4px 0 0',
                            margin: '0'
                        }}>
                            Scouts ({allScouts.length})
                        </h4>
                        {renderParticipantsTable(allScouts, false)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Trip Administrator Interface</h1>
            
            {error && (
                <div style={{ 
                    padding: '10px', 
                    marginBottom: '20px', 
                    backgroundColor: '#ffebee', 
                    color: '#c62828',
                    borderRadius: '4px'
                }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '40px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <div
                    onClick={() => setIsCreateTripExpanded(!isCreateTripExpanded)}
                    style={{
                        padding: '20px',
                        cursor: 'pointer',
                        backgroundColor: isCreateTripExpanded ? '#e3f2fd' : '#f9f9f9',
                        transition: 'background-color 0.2s',
                        borderBottom: isCreateTripExpanded ? '1px solid #ddd' : 'none'
                    }}
                >
                    <h2 style={{ margin: 0 }}>
                        {isCreateTripExpanded ? '▼' : '▶'} Create New Trip
                    </h2>
                </div>
                {isCreateTripExpanded && (
                    <form onSubmit={handleCreateTrip} style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Trip Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={newTrip.name}
                            onChange={handleInputChange}
                            placeholder="e.g., Summer Camp 2026"
                            required
                            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
                            <input
                                type="checkbox"
                                name="is_overnight"
                                checked={newTrip.is_overnight}
                                onChange={handleInputChange}
                                style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontWeight: 'bold' }}>Overnight Trip</span>
                        </label>
                    </div>

                    <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: newTrip.is_overnight ? '1fr 1fr' : '1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                {newTrip.is_overnight ? 'Start Date *' : 'Trip Date *'}
                            </label>
                            <input
                                type="date"
                                name="trip_date"
                                value={newTrip.trip_date}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                        </div>
                        {newTrip.is_overnight && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    End Date *
                                </label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={newTrip.end_date || ''}
                                    onChange={handleInputChange}
                                    required
                                    min={newTrip.trip_date}
                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                />
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Location *
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={newTrip.location}
                            onChange={handleInputChange}
                            placeholder="e.g., Camp Wilderness"
                            required
                            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={newTrip.description}
                            onChange={handleInputChange}
                            placeholder="Trip details and activities..."
                            rows={4}
                            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Capacity Type *
                        </label>
                        <select
                            name="capacity_type"
                            value={newTrip.capacity_type}
                            onChange={handleInputChange}
                            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                        >
                            <option value="fixed">Fixed Capacity</option>
                            <option value="vehicle">Vehicle-Based Capacity</option>
                        </select>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            {newTrip.capacity_type === 'fixed'
                                ? 'Set a fixed maximum number of participants'
                                : 'Capacity based on available vehicle seats from adults'}
                        </p>
                    </div>

                    {newTrip.capacity_type === 'fixed' && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Maximum Capacity *
                            </label>
                            <input
                                type="number"
                                name="max_participants"
                                value={newTrip.max_participants}
                                onChange={handleInputChange}
                                min="1"
                                required
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Trip Lead Contact Information (Optional)</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Trip Lead Name
                            </label>
                            <input
                                type="text"
                                name="trip_lead_name"
                                value={newTrip.trip_lead_name || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., John Smith"
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Trip Lead Email
                            </label>
                            <input
                                type="email"
                                name="trip_lead_email"
                                value={newTrip.trip_lead_email || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., john.smith@example.com"
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Trip Lead Phone
                            </label>
                            <input
                                type="tel"
                                name="trip_lead_phone"
                                value={newTrip.trip_lead_phone || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., (555) 123-4567"
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit" 
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        {loading ? 'Creating...' : 'Create Trip'}
                    </button>
                    </form>
                )}
            </div>

            <div>
                <h2>Current Trips ({trips.length})</h2>
                {loading && trips.length === 0 ? (
                    <p>Loading trips...</p>
                ) : trips.length === 0 ? (
                    <p>No trips created yet. Create your first trip above!</p>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {trips.map((trip) => (
                            <div
                                key={trip.id}
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    backgroundColor: '#f9f9f9',
                                    overflow: 'hidden'
                                }}
                            >
                                {editingTripId === trip.id && editTrip ? (
                                    <div style={{ backgroundColor: '#fff3e0' }}>
                                        <div style={{ padding: '20px', borderBottom: '1px solid #ddd', backgroundColor: '#ff9800', color: 'white' }}>
                                            <h3 style={{ margin: 0 }}>✏️ Editing: {trip.name}</h3>
                                        </div>
                                        <form onSubmit={handleUpdateTrip} style={{ padding: '20px' }}>
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Trip Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editTrip.name}
                                                    onChange={handleEditInputChange}
                                                    required
                                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        name="is_overnight"
                                                        checked={editTrip.is_overnight}
                                                        onChange={handleEditInputChange}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    <span style={{ fontWeight: 'bold' }}>Overnight Trip</span>
                                                </label>
                                            </div>

                                            <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: editTrip.is_overnight ? '1fr 1fr' : '1fr', gap: '15px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        {editTrip.is_overnight ? 'Start Date *' : 'Trip Date *'}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="trip_date"
                                                        value={editTrip.trip_date}
                                                        onChange={handleEditInputChange}
                                                        required
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                </div>
                                                {editTrip.is_overnight && (
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                            End Date *
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="end_date"
                                                            value={editTrip.end_date || ''}
                                                            onChange={handleEditInputChange}
                                                            required
                                                            min={editTrip.trip_date}
                                                            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Location *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={editTrip.location}
                                                    onChange={handleEditInputChange}
                                                    required
                                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Description
                                                </label>
                                                <textarea
                                                    name="description"
                                                    value={editTrip.description}
                                                    onChange={handleEditInputChange}
                                                    rows={4}
                                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Capacity Type *
                                                </label>
                                                <select
                                                    name="capacity_type"
                                                    value={editTrip.capacity_type}
                                                    onChange={handleEditInputChange}
                                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                >
                                                    <option value="fixed">Fixed Capacity</option>
                                                    <option value="vehicle">Vehicle-Based Capacity</option>
                                                </select>
                                            </div>

                                            {editTrip.capacity_type === 'fixed' && (
                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Maximum Capacity *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="max_participants"
                                                        value={editTrip.max_participants}
                                                        onChange={handleEditInputChange}
                                                        min="1"
                                                        required
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                </div>
                                            )}

                                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Trip Lead Contact (Optional)</h3>
                                                
                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Trip Lead Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="trip_lead_name"
                                                        value={editTrip.trip_lead_name || ''}
                                                        onChange={handleEditInputChange}
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                </div>

                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Trip Lead Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="trip_lead_email"
                                                        value={editTrip.trip_lead_email || ''}
                                                        onChange={handleEditInputChange}
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                </div>

                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Trip Lead Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="trip_lead_phone"
                                                        value={editTrip.trip_lead_phone || ''}
                                                        onChange={handleEditInputChange}
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    style={{
                                                        padding: '10px 20px',
                                                        backgroundColor: '#1976d2',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: loading ? 'not-allowed' : 'pointer',
                                                        fontSize: '16px'
                                                    }}
                                                >
                                                    {loading ? 'Updating...' : 'Update Trip'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    disabled={loading}
                                                    style={{
                                                        padding: '10px 20px',
                                                        backgroundColor: '#757575',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: loading ? 'not-allowed' : 'pointer',
                                                        fontSize: '16px'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            onClick={() => handleTripClick(trip.id)}
                                            style={{
                                                padding: '20px',
                                                cursor: 'pointer',
                                                backgroundColor: expandedTripId === trip.id ? '#e3f2fd' : '#f9f9f9',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>
                                                {expandedTripId === trip.id ? '▼' : '▶'} {trip.name}
                                            </h3>
                                            <p style={{ margin: '5px 0' }}>
                                                <strong>Date:</strong> {formatDate(trip.trip_date)}
                                                {trip.is_overnight && trip.end_date && ` - ${formatDate(trip.end_date)}`}
                                            </p>
                                            <p style={{ margin: '5px 0' }}><strong>Location:</strong> {trip.location}</p>
                                            {trip.description && <p style={{ margin: '5px 0' }}><strong>Description:</strong> {trip.description}</p>}
                                            <p style={{ margin: '5px 0' }}>
                                                <strong>Capacity Type:</strong> {trip.capacity_type === 'fixed' ? 'Fixed' : 'Vehicle-Based'}
                                            </p>
                                            {trip.capacity_type === 'fixed' ? (
                                                <p style={{ margin: '5px 0' }}>
                                                    <strong>Capacity:</strong> {trip.signup_count} / {trip.max_participants} participants
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
                                                        <strong>Vehicle Capacity:</strong> {trip.total_vehicle_capacity} seats
                                                    </p>
                                                    <p style={{ margin: '5px 0' }}>
                                                        <strong>Available Seats:</strong> {trip.available_spots}
                                                        {trip.is_full && (
                                                            <span style={{ color: '#d32f2f', marginLeft: '10px' }}>FULL</span>
                                                        )}
                                                    </p>
                                                    {trip.needs_more_drivers && (
                                                        <p style={{
                                                            color: '#f57c00',
                                                            fontWeight: 'bold',
                                                            padding: '8px',
                                                            backgroundColor: '#fff3e0',
                                                            borderRadius: '4px',
                                                            marginTop: '10px'
                                                        }}>
                                                            ⚠️ More drivers needed! Current vehicle capacity ({trip.total_vehicle_capacity}) is less than participants ({trip.signup_count})
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                            {trip.is_overnight && (
                                                <p style={{ margin: '10px 0 0 0' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: '#e3f2fd',
                                                        borderRadius: '4px'
                                                    }}>Overnight Trip</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {expandedTripId === trip.id && renderTripSignups(trip.id)}

                                <div style={{ padding: '15px 20px', backgroundColor: '#fff', borderTop: '1px solid #ddd' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExportRosterPDF(trip.id, trip.name);
                                        }}
                                        disabled={loading}
                                        style={{
                                            padding: '8px 16px',
                                            marginRight: '10px',
                                            backgroundColor: '#2196f3',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                        title="Download printable PDF roster with checkboxes for check-in"
                                    >
                                        📄 Export Roster (PDF)
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExportRoster(trip.id, trip.name);
                                        }}
                                        disabled={loading}
                                        style={{
                                            padding: '8px 16px',
                                            marginRight: '10px',
                                            backgroundColor: '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Export Roster (CSV)
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditTrip(trip);
                                        }}
                                        disabled={loading}
                                        style={{
                                            padding: '8px 16px',
                                            marginRight: '10px',
                                            backgroundColor: '#ff9800',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        ✏️ Edit Trip
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTrip(trip.id);
                                        }}
                                        disabled={loading}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#f44336',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Delete Trip
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TripAdmin;