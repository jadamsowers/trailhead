import React, { useState, useEffect } from 'react';
import { Outing, OutingCreate, SignupResponse, ParticipantResponse } from '../../types';
import { outingAPI, pdfAPI, signupAPI } from '../../services/api';
import { formatPhoneNumber } from '../../utils/phoneUtils';

const OutingAdmin: React.FC = () => {
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

    const [outings, setOutings] = useState<Outing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedOutingId, setExpandedOutingId] = useState<string | null>(null);
    const [outingSignups, setOutingSignups] = useState<{ [outingId: string]: SignupResponse[] }>({});
    const [loadingSignups, setLoadingSignups] = useState<{ [outingId: string]: boolean }>({});
    const [isCreateOutingExpanded, setIsCreateOutingExpanded] = useState(false);
    const [editingOutingId, setEditingOutingId] = useState<string | null>(null);
    const [editOuting, setEditOuting] = useState<OutingCreate | null>(null);
    
    // Email functionality state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedOutingForEmail, setSelectedOutingForEmail] = useState<Outing | null>(null);
    const [emailList, setEmailList] = useState<string[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailFrom, setEmailFrom] = useState('');
    const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
    const [newOuting, setNewOuting] = useState<OutingCreate>({
        name: '',
        outing_date: defaultDates.friday,
        end_date: defaultDates.sunday,
        location: '',
        description: '',
        max_participants: 30,
        capacity_type: 'vehicle',
        is_overnight: true,
        outing_lead_name: '',
        outing_lead_email: '',
        outing_lead_phone: ''
    });

    // Load outings on component mount
    useEffect(() => {
        loadOutings();
    }, []);

    const loadOutings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await outingAPI.getAll();
            setOutings(data);
        } catch (err) {
            console.error('Error loading outings:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load outings';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const loadOutingSignups = async (outingId: string) => {
        if (outingSignups[outingId]) {
            // Already loaded
            return;
        }

        try {
            setLoadingSignups({ ...loadingSignups, [outingId]: true });
            const signups = await signupAPI.getByOuting(outingId);
            setOutingSignups({ ...outingSignups, [outingId]: signups });
        } catch (err) {
            console.error('Error loading signups:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load signups';
            setError(errorMessage);
        } finally {
            setLoadingSignups({ ...loadingSignups, [outingId]: false });
        }
    };

    const handleOutingClick = async (outingId: string) => {
        if (expandedOutingId === outingId) {
            // Collapse
            setExpandedOutingId(null);
        } else {
            // Expand and load signups if not already loaded
            setExpandedOutingId(outingId);
            await loadOutingSignups(outingId);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setNewOuting({
                ...newOuting,
                [name]: checked
            });
        } else if (name === 'max_participants') {
            setNewOuting({
                ...newOuting,
                [name]: parseInt(value) || 0
            });
        } else if (name === 'outing_lead_phone') {
            // Apply phone formatting
            setNewOuting({
                ...newOuting,
                [name]: formatPhoneNumber(value)
            });
        } else {
            setNewOuting({
                ...newOuting,
                [name]: value
            });
        }
    };

    const handleCreateOuting = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await outingAPI.create(newOuting);
            // Reset form with new default dates
            const newDefaultDates = getNextWeekendDates();
            setNewOuting({
                name: '',
                outing_date: newDefaultDates.friday,
                end_date: newDefaultDates.sunday,
                location: '',
                description: '',
                max_participants: 30,
                capacity_type: 'vehicle',
                is_overnight: true,
                outing_lead_name: '',
                outing_lead_email: '',
                outing_lead_phone: ''
            });
            // Reload outings
            await loadOutings();
        } catch (err) {
            console.error('Error creating outing:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to create outing';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleEditOuting = (outing: Outing) => {
        setEditingOutingId(outing.id);
        setEditOuting({
            name: outing.name,
            outing_date: outing.outing_date,
            end_date: outing.end_date || '',
            location: outing.location,
            description: outing.description || '',
            max_participants: outing.max_participants,
            capacity_type: outing.capacity_type,
            is_overnight: outing.is_overnight,
            outing_lead_name: outing.outing_lead_name || '',
            outing_lead_email: outing.outing_lead_email || '',
            outing_lead_phone: outing.outing_lead_phone || ''
        });
        setExpandedOutingId(null);
    };

    const handleCancelEdit = () => {
        setEditingOutingId(null);
        setEditOuting(null);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!editOuting) return;
        
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setEditOuting({
                ...editOuting,
                [name]: checked
            });
        } else if (name === 'max_participants') {
            setEditOuting({
                ...editOuting,
                [name]: parseInt(value) || 0
            });
        } else if (name === 'outing_lead_phone') {
            // Apply phone formatting
            setEditOuting({
                ...editOuting,
                [name]: formatPhoneNumber(value)
            });
        } else {
            setEditOuting({
                ...editOuting,
                [name]: value
            });
        }
    };

    const handleUpdateOuting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOutingId || !editOuting) return;

        try {
            setLoading(true);
            setError(null);
            await outingAPI.update(editingOutingId, editOuting);
            setEditingOutingId(null);
            setEditOuting(null);
            await loadOutings();
        } catch (err) {
            console.error('Error updating outing:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to update outing';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOuting = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this outing?')) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await outingAPI.delete(id);
            await loadOutings();
        } catch (err) {
            console.error('Error deleting outing:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete outing';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleExportRosterPDF = async (outingId: string, outingName: string) => {
        try {
            setLoading(true);
            setError(null);
            const blob = await pdfAPI.exportRosterPDF(outingId);
            pdfAPI.downloadPDF(blob, `${outingName.replace(/\s+/g, '_')}_roster.pdf`);
        } catch (err) {
            console.error('Error exporting roster PDF:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to export roster PDF';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleShowEmailModal = async (outing: Outing) => {
        try {
            setLoading(true);
            setError(null);
            setEmailSuccess(null);
            const data = await signupAPI.getEmails(outing.id);
            setEmailList(data.emails);
            setSelectedOutingForEmail(outing);
            setEmailSubject(`Update: ${outing.name}`);
            setEmailMessage('');
            setEmailFrom('');
            setShowEmailModal(true);
        } catch (err) {
            console.error('Error loading emails:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load email addresses';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseEmailModal = () => {
        setShowEmailModal(false);
        setSelectedOutingForEmail(null);
        setEmailList([]);
        setEmailSubject('');
        setEmailMessage('');
        setEmailFrom('');
        setEmailSuccess(null);
    };

    const handleCopyEmails = () => {
        const emailString = emailList.join(', ');
        navigator.clipboard.writeText(emailString);
        setEmailSuccess('Email addresses copied to clipboard!');
        setTimeout(() => setEmailSuccess(null), 3000);
    };

    const handleSendEmail = async () => {
        if (!selectedOutingForEmail || !emailFrom || !emailSubject || !emailMessage) {
            setError('Please fill in all email fields');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await signupAPI.sendEmail(selectedOutingForEmail.id, {
                subject: emailSubject,
                message: emailMessage,
                from_email: emailFrom
            });
            
            setEmailSuccess(`Email prepared for ${result.recipient_count} recipients. ${result.note}`);
            
            // Create mailto link
            const mailtoLink = `mailto:${emailList.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
            window.location.href = mailtoLink;
        } catch (err) {
            console.error('Error preparing email:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to prepare email';
            setError(errorMessage);
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
                    backgroundColor: 'var(--card-bg)',
                    boxShadow: 'var(--card-shadow)'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: isAdult ? 'var(--sa-dark-blue)' : 'var(--sa-scouts-orange)', color: 'white' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Age</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Gender</th>
                            {!isAdult && <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Troop/Patrol</th>}
                            {isAdult && <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Training</th>}
                            {isAdult && <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Passengers</th>}
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Dietary</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Allergies</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((participant, index) => (
                            <tr key={participant.id} style={{
                                backgroundColor: index % 2 === 0 ? 'var(--bg-tertiary)' : 'var(--card-bg)',
                                borderBottom: '1px solid var(--card-border)'
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
                                            <span style={{ color: 'var(--alert-success-text)', fontWeight: 'bold' }}>✓</span>
                                        ) : (
                                            <span style={{ color: 'var(--alert-error-text)' }}>✗</span>
                                        )}
                                    </td>
                                )}
                                {isAdult && (
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--sa-dark-blue)' }}>
                                        {participant.vehicle_capacity > 0 ? `🚗 ${participant.vehicle_capacity}` : '-'}
                                    </td>
                                )}
                                <td style={{ padding: '12px' }}>
                                    {participant.dietary_restrictions.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {participant.dietary_restrictions.map((restriction, idx) => (
                                                <span key={idx} style={{
                                                    padding: '2px 6px',
                                                    backgroundColor: 'var(--alert-success-bg)',
                                                    border: '1px solid var(--alert-success-border)',
                                                    borderRadius: '3px',
                                                    fontSize: '11px',
                                                    color: 'var(--alert-success-text)',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {restriction}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-tertiary)' }}>None</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {participant.allergies.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {participant.allergies.map((allergy, idx) => (
                                                <span key={idx} style={{
                                                    padding: '2px 6px',
                                                    backgroundColor: 'var(--alert-error-bg)',
                                                    border: '1px solid var(--alert-error-border)',
                                                    borderRadius: '3px',
                                                    fontSize: '11px',
                                                    color: 'var(--alert-error-text)',
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    ⚠️ {allergy}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-tertiary)' }}>None</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {participant.medical_notes || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderOutingSignups = (outingId: string) => {
        const signups = outingSignups[outingId];
        const isLoading = loadingSignups[outingId];

        if (isLoading) {
            return <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading participants...</p>;
        }

        if (!signups || signups.length === 0) {
            return <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No signups yet for this outing.</p>;
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
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>Participant Details</h3>
                
                {allAdults.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h4 style={{
                            padding: '10px',
                            backgroundColor: 'var(--sa-dark-blue)',
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
                            backgroundColor: 'var(--sa-scouts-orange)',
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
            <h1 style={{ color: 'var(--text-primary)' }}>Outing Administrator Interface</h1>
            
            {error && (
                <div style={{
                    padding: '10px',
                    marginBottom: '20px',
                    backgroundColor: 'var(--alert-error-bg)',
                    color: 'var(--alert-error-text)',
                    borderRadius: '4px',
                    border: '1px solid var(--alert-error-border)'
                }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '40px', border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <div
                    onClick={() => setIsCreateOutingExpanded(!isCreateOutingExpanded)}
                    style={{
                        padding: '20px',
                        cursor: 'pointer',
                        backgroundColor: isCreateOutingExpanded ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                        transition: 'background-color 0.2s',
                        borderBottom: isCreateOutingExpanded ? '1px solid var(--card-border)' : 'none'
                    }}
                >
                    <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                        {isCreateOutingExpanded ? '▼' : '▶'} Create New Outing
                    </h2>
                </div>
                {isCreateOutingExpanded && (
                    <form onSubmit={handleCreateOuting} style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Outing Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={newOuting.name}
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
                                checked={newOuting.is_overnight}
                                onChange={handleInputChange}
                                style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontWeight: 'bold' }}>Overnight Outing</span>
                        </label>
                    </div>

                    <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: newOuting.is_overnight ? '1fr 1fr' : '1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                {newOuting.is_overnight ? 'Start Date *' : 'Outing Date *'}
                            </label>
                            <input
                                type="date"
                                name="outing_date"
                                value={newOuting.outing_date}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                        </div>
                        {newOuting.is_overnight && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    End Date *
                                </label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={newOuting.end_date || ''}
                                    onChange={handleInputChange}
                                    required
                                    min={newOuting.outing_date}
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
                            value={newOuting.location}
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
                            value={newOuting.description}
                            onChange={handleInputChange}
                            placeholder="Outing details and activities..."
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
                            value={newOuting.capacity_type}
                            onChange={handleInputChange}
                            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                        >
                            <option value="fixed">Fixed Capacity</option>
                            <option value="vehicle">Vehicle-Based Capacity</option>
                        </select>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                            {newOuting.capacity_type === 'fixed'
                                ? 'Set a fixed maximum number of participants'
                                : 'Capacity based on available vehicle seats from adults'}
                        </p>
                    </div>

                    {newOuting.capacity_type === 'fixed' && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Maximum Capacity *
                            </label>
                            <input
                                type="number"
                                name="max_participants"
                                value={newOuting.max_participants}
                                onChange={handleInputChange}
                                min="1"
                                required
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Outing Lead Contact Information (Optional)</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Outing Lead Name
                            </label>
                            <input
                                type="text"
                                name="outing_lead_name"
                                value={newOuting.outing_lead_name || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., John Smith"
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Outing Lead Email
                            </label>
                            <input
                                type="email"
                                name="outing_lead_email"
                                value={newOuting.outing_lead_email || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., john.smith@example.com"
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Outing Lead Phone
                            </label>
                            <input
                                type="tel"
                                name="outing_lead_phone"
                                value={newOuting.outing_lead_phone || ''}
                                onChange={handleInputChange}
                                placeholder="(555) 123-4567"
                                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '0' }}>
                                Format: (XXX) XXX-XXXX
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit" 
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        {loading ? 'Creating...' : 'Create Outing'}
                    </button>
                    </form>
                )}
            </div>

            <div>
                <h2 style={{ color: 'var(--text-primary)' }}>Current Outings ({outings.length})</h2>
                {loading && outings.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading outings...</p>
                ) : outings.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No outings created yet. Create your first outing above!</p>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {outings.map((outing) => (
                            <div
                                key={outing.id}
                                style={{
                                    border: '1px solid var(--card-border)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    overflow: 'hidden'
                                }}
                            >
                                {editingOutingId === outing.id && editOuting ? (
                                    <div style={{ backgroundColor: 'var(--alert-warning-bg)' }}>
                                        <div style={{ padding: '20px', borderBottom: '1px solid var(--card-border)', backgroundColor: 'var(--sa-scouts-orange)', color: 'white' }}>
                                            <h3 style={{ margin: 0 }}>✏️ Editing: {outing.name}</h3>
                                        </div>
                                        <form onSubmit={handleUpdateOuting} style={{ padding: '20px' }}>
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Outing Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editOuting.name}
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
                                                        checked={editOuting.is_overnight}
                                                        onChange={handleEditInputChange}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    <span style={{ fontWeight: 'bold' }}>Overnight Outing</span>
                                                </label>
                                            </div>

                                            <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: editOuting.is_overnight ? '1fr 1fr' : '1fr', gap: '15px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        {editOuting.is_overnight ? 'Start Date *' : 'Outing Date *'}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="outing_date"
                                                        value={editOuting.outing_date}
                                                        onChange={handleEditInputChange}
                                                        required
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                </div>
                                                {editOuting.is_overnight && (
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                            End Date *
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="end_date"
                                                            value={editOuting.end_date || ''}
                                                            onChange={handleEditInputChange}
                                                            required
                                                            min={editOuting.outing_date}
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
                                                    value={editOuting.location}
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
                                                    value={editOuting.description}
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
                                                    value={editOuting.capacity_type}
                                                    onChange={handleEditInputChange}
                                                    style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                >
                                                    <option value="fixed">Fixed Capacity</option>
                                                    <option value="vehicle">Vehicle-Based Capacity</option>
                                                </select>
                                            </div>

                                            {editOuting.capacity_type === 'fixed' && (
                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Maximum Capacity *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="max_participants"
                                                        value={editOuting.max_participants}
                                                        onChange={handleEditInputChange}
                                                        min="1"
                                                        required
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                </div>
                                            )}

                                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                                                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Outing Lead Contact (Optional)</h3>
                                                
                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Outing Lead Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="outing_lead_name"
                                                        value={editOuting.outing_lead_name || ''}
                                                        onChange={handleEditInputChange}
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                </div>

                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Outing Lead Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="outing_lead_email"
                                                        value={editOuting.outing_lead_email || ''}
                                                        onChange={handleEditInputChange}
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                </div>

                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Outing Lead Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="outing_lead_phone"
                                                        value={editOuting.outing_lead_phone || ''}
                                                        onChange={handleEditInputChange}
                                                        placeholder="(555) 123-4567"
                                                        style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                                                    />
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '0' }}>
                                                        Format: (XXX) XXX-XXXX
                                                    </p>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    style={{
                                                        padding: '10px 20px',
                                                        backgroundColor: 'var(--btn-primary-bg)',
                                                        color: 'var(--btn-primary-text)',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: loading ? 'not-allowed' : 'pointer',
                                                        fontSize: '16px'
                                                    }}
                                                >
                                                    {loading ? 'Updating...' : 'Update Outing'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    disabled={loading}
                                                    style={{
                                                        padding: '10px 20px',
                                                        backgroundColor: 'var(--btn-secondary-bg)',
                                                        color: 'var(--btn-secondary-text)',
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
                                            onClick={() => handleOutingClick(outing.id)}
                                            style={{
                                                padding: '20px',
                                                cursor: 'pointer',
                                                backgroundColor: expandedOutingId === outing.id ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>
                                                {expandedOutingId === outing.id ? '▼' : '▶'} {outing.name}
                                            </h3>
                                            <p style={{ margin: '5px 0' }}>
                                                <strong>Date:</strong> {formatDate(outing.outing_date)}
                                                {outing.is_overnight && outing.end_date && ` - ${formatDate(outing.end_date)}`}
                                            </p>
                                            <p style={{ margin: '5px 0' }}><strong>Location:</strong> {outing.location}</p>
                                            {outing.description && <p style={{ margin: '5px 0' }}><strong>Description:</strong> {outing.description}</p>}
                                            <p style={{ margin: '5px 0' }}>
                                                <strong>Capacity Type:</strong> {outing.capacity_type === 'fixed' ? 'Fixed' : 'Vehicle-Based'}
                                            </p>
                                            {outing.capacity_type === 'fixed' ? (
                                                <p style={{ margin: '5px 0' }}>
                                                    <strong>Capacity:</strong> {outing.signup_count} / {outing.max_participants} participants
                                                    {outing.is_full && (
                                                        <span style={{ color: 'var(--alert-error-text)', marginLeft: '10px' }}>FULL</span>
                                                    )}
                                                </p>
                                            ) : (
                                                <>
                                                    <p style={{ margin: '5px 0' }}>
                                                        <strong>Participants:</strong> {outing.signup_count}
                                                    </p>
                                                    <p style={{ margin: '5px 0' }}>
                                                        <strong>Vehicle Capacity:</strong> {outing.total_vehicle_capacity} seats
                                                    </p>
                                                    <p style={{ margin: '5px 0' }}>
                                                        <strong>Available Seats:</strong> {outing.available_spots}
                                                        {outing.is_full && (
                                                            <span style={{ color: 'var(--alert-error-text)', marginLeft: '10px' }}>FULL</span>
                                                        )}
                                                    </p>
                                                    {outing.needs_more_drivers && (
                                                        <p style={{
                                                            color: 'var(--alert-warning-text)',
                                                            fontWeight: 'bold',
                                                            padding: '8px',
                                                            backgroundColor: 'var(--alert-warning-bg)',
                                                            borderRadius: '4px',
                                                            marginTop: '10px',
                                                            border: '1px solid var(--alert-warning-border)'
                                                        }}>
                                                            ⚠️ More drivers needed! Current vehicle capacity ({outing.total_vehicle_capacity}) is less than participants ({outing.signup_count})
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                            {outing.is_overnight && (
                                                <p style={{ margin: '10px 0 0 0' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: 'var(--badge-info-bg)',
                                                        color: 'var(--badge-info-text)',
                                                        borderRadius: '4px'
                                                    }}>Overnight Outing</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {expandedOutingId === outing.id && renderOutingSignups(outing.id)}

                                <div style={{ padding: '15px 20px', backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--card-border)' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExportRosterPDF(outing.id, outing.name);
                                        }}
                                        disabled={loading}
                                        style={{
                                            padding: '8px 16px',
                                            marginRight: '10px',
                                            backgroundColor: 'var(--sa-pale-blue)',
                                            color: 'var(--sa-dark-blue)',
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
                                            handleShowEmailModal(outing);
                                        }}
                                        disabled={loading || outing.signup_count === 0}
                                        style={{
                                            padding: '8px 16px',
                                            marginRight: '10px',
                                            backgroundColor: outing.signup_count === 0 ? 'var(--btn-disabled-bg)' : 'var(--alert-success-bg)',
                                            color: outing.signup_count === 0 ? 'var(--btn-disabled-text)' : 'var(--alert-success-text)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading || outing.signup_count === 0 ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                        title={outing.signup_count === 0 ? 'No signups yet' : 'Email all participants'}
                                    >
                                        📧 Email Participants
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditOuting(outing);
                                        }}
                                        disabled={loading}
                                        style={{
                                            padding: '8px 16px',
                                            marginRight: '10px',
                                            backgroundColor: 'var(--sa-scouts-orange)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        ✏️ Edit Outing
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteOuting(outing.id);
                                        }}
                                        disabled={loading}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'var(--alert-error-bg)',
                                            color: 'var(--alert-error-text)',
                                            border: '1px solid var(--alert-error-border)',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Delete Outing
                                    </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Email Modal */}
            {showEmailModal && selectedOutingForEmail && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '8px',
                        padding: '30px',
                        maxWidth: '700px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        border: '1px solid var(--card-border)'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--sa-dark-blue)' }}>
                            📧 Email Participants - {selectedOutingForEmail.name}
                        </h2>

                        {emailSuccess && (
                            <div style={{
                                padding: '12px',
                                marginBottom: '20px',
                                backgroundColor: 'var(--alert-success-bg)',
                                color: 'var(--alert-success-text)',
                                borderRadius: '4px',
                                border: '1px solid var(--alert-success-border)'
                            }}>
                                {emailSuccess}
                            </div>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ marginBottom: '10px' }}>
                                Email Addresses ({emailList.length})
                            </h3>
                            <div style={{
                                padding: '12px',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '4px',
                                border: '1px solid var(--card-border)',
                                maxHeight: '150px',
                                overflow: 'auto',
                                fontSize: '14px',
                                wordBreak: 'break-all',
                                color: 'var(--text-primary)'
                            }}>
                                {emailList.length > 0 ? emailList.join(', ') : 'No email addresses found'}
                            </div>
                            <button
                                onClick={handleCopyEmails}
                                disabled={emailList.length === 0}
                                style={{
                                    marginTop: '10px',
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--sa-pale-blue)',
                                    color: 'var(--sa-dark-blue)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: emailList.length === 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                📋 Copy Email Addresses
                            </button>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                From Email *
                            </label>
                            <input
                                type="email"
                                value={emailFrom}
                                onChange={(e) => setEmailFrom(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '14px',
                                    border: '1px solid var(--input-border)',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Subject *
                            </label>
                            <input
                                type="text"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Email subject"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '14px',
                                    border: '1px solid var(--input-border)',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Message *
                            </label>
                            <textarea
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                placeholder="Enter your message to participants..."
                                required
                                rows={8}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '14px',
                                    border: '1px solid var(--input-border)',
                                    borderRadius: '4px',
                                    fontFamily: 'inherit',
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{
                            padding: '12px',
                            backgroundColor: 'var(--alert-warning-bg)',
                            borderRadius: '4px',
                            marginBottom: '20px',
                            fontSize: '13px',
                            color: 'var(--alert-warning-text)',
                            border: '1px solid var(--alert-warning-border)'
                        }}>
                            <strong>Note:</strong> Clicking "Send Email" will open your default email client with the recipients, subject, and message pre-filled. You can review and send from there.
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleCloseEmailModal}
                                disabled={loading}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: 'var(--btn-secondary-bg)',
                                    color: 'var(--btn-secondary-text)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendEmail}
                                disabled={loading || emailList.length === 0 || !emailFrom || !emailSubject || !emailMessage}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: emailList.length === 0 || !emailFrom || !emailSubject || !emailMessage ? 'var(--btn-disabled-bg)' : 'var(--alert-success-bg)',
                                    color: emailList.length === 0 || !emailFrom || !emailSubject || !emailMessage ? 'var(--btn-disabled-text)' : 'var(--alert-success-text)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading || emailList.length === 0 || !emailFrom || !emailSubject || !emailMessage ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {loading ? 'Preparing...' : '📧 Send Email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutingAdmin;