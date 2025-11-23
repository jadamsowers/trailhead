import React, { useState, useEffect } from 'react';
import { familyAPI } from '../../services/api';
import {
    FamilyMember,
    FamilyMemberCreate,
    FamilyMemberUpdate,
} from '../../types';
import { useFamilyMembers, invalidateFamilyData } from '../../hooks/useSWR';

// Responsive styles for family management
const familyManagementStyles = `
    .family-member-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
    }
    
    .family-member-card {
        padding: 20px;
    }
    
    @media (max-width: 768px) {
        .family-member-grid {
            grid-template-columns: 1fr !important;
        }
        
        .family-member-card {
            padding: 16px !important;
        }
    }
    
    @media (max-width: 480px) {
        .family-member-grid {
            grid-template-columns: 1fr !important;
            gap: 12px;
        }
        
        .family-member-card {
            padding: 12px !important;
        }
    }
`;

interface FamilyManagementProps {
    onMemberAdded?: () => void;
}

export const FamilyManagement: React.FC<FamilyManagementProps> = ({ onMemberAdded }) => {
    // Use SWR hook for data fetching with automatic caching
    const { familyMembers: members, isLoading: loading, error: swrError, revalidate } = useFamilyMembers();
    
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

    // Log family members data when it changes (for diagnostics)
    useEffect(() => {
        if (loading) {
            console.log('🔄 Loading family members...');
        } else if (swrError) {
            const errorMessage = swrError?.message || 'Failed to load family members';
            console.error('❌ Error loading family members:', {
                error: swrError,
                message: errorMessage,
            });
        } else if (members) {
            console.log('✅ Family members loaded:', { members, total: members.length });
        }
    }, [members, loading, swrError]);

    // Convert SWR error to string for display
    const displayError = error || (swrError ? swrError.message || 'Failed to load family members' : null);

    const handleAddMember = () => {
        setShowAddForm(true);
        setEditingMember(null);
    };

    const handleEditMember = (member: FamilyMember) => {
        setEditingMember(member);
        setShowAddForm(true);
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm('Are you sure you want to delete this family member?')) {
            return;
        }

        try {
            console.log('🗑️ Deleting family member:', id);
            await familyAPI.delete(id);
            console.log('✅ Family member deleted, invalidating cache...');
            // Invalidate cache to trigger refetch
            await invalidateFamilyData();
        } catch (err) {
            console.error('❌ Failed to delete family member:', err);
            setError('Failed to delete family member');
        }
    };

    const handleFormClose = () => {
        setShowAddForm(false);
        setEditingMember(null);
    };

    const handleFormSuccess = async () => {
        console.log('✅ Family member saved, invalidating cache...');
        // Invalidate cache to trigger refetch
        await invalidateFamilyData();
        handleFormClose();
        if (onMemberAdded) {
            onMemberAdded();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-gray-600">Loading family members...</div>
            </div>
        );
    }

    return (
        <>
            <style>{familyManagementStyles}</style>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2', margin: '0' }}>Family Members</h2>
                <button
                    onClick={handleAddMember}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#1565c0';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#1976d2';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                >
                    + Add Family Member
                </button>
            </div>

            {displayError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {displayError}
                </div>
            )}

            {members.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px'
                }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '16px' }}>No family members added yet</p>
                    <button
                        onClick={handleAddMember}
                        style={{
                            padding: '14px 32px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#1565c0';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#1976d2';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                    >
                        Add Your First Family Member
                    </button>
                </div>
            ) : (
                <>
                    {/* Adults Section */}
                    {members.filter(m => m.member_type === 'adult').length > 0 && (
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{
                                fontSize: '22px',
                                fontWeight: '600',
                                color: '#7b1fa2',
                                marginBottom: '16px',
                                paddingBottom: '8px',
                                borderBottom: '2px solid #f3e5f5'
                            }}>
                                🌲 Adults ({members.filter(m => m.member_type === 'adult').length})
                            </h3>
                            <div className="family-member-grid">
                                {members
                                    .filter(m => m.member_type === 'adult')
                                    .map((member) => (
                                        <FamilyMemberCard
                                            key={member.id}
                                            member={member}
                                            onEdit={() => handleEditMember(member)}
                                            onDelete={() => handleDeleteMember(member.id)}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Youth/Scouts Section */}
                    {members.filter(m => m.member_type === 'scout').length > 0 && (
                        <div>
                            <h3 style={{
                                fontSize: '22px',
                                fontWeight: '600',
                                color: '#1976d2',
                                marginBottom: '16px',
                                paddingBottom: '8px',
                                borderBottom: '2px solid #e3f2fd'
                            }}>
                                🌱 Youth ({members.filter(m => m.member_type === 'scout').length})
                            </h3>
                            <div className="family-member-grid">
                                {members
                                    .filter(m => m.member_type === 'scout')
                                    .map((member) => (
                                        <FamilyMemberCard
                                            key={member.id}
                                            member={member}
                                            onEdit={() => handleEditMember(member)}
                                            onDelete={() => handleDeleteMember(member.id)}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {showAddForm && (
                <FamilyMemberForm
                    member={editingMember}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            )}
            </div>
        </>
    );
};

interface FamilyMemberCardProps {
    member: FamilyMember;
    onEdit: () => void;
    onDelete: () => void;
}

const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({ member, onEdit, onDelete }) => {
    const age = member.date_of_birth
        ? Math.floor((new Date().getTime() - new Date(member.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

    return (
        <div
            className="family-member-card"
            style={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                transition: 'box-shadow 0.2s, transform 0.2s',
                cursor: 'default',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
        }}>
            {/* Header with name and actions */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f0f0f0'
            }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#1976d2',
                        marginBottom: '8px',
                        lineHeight: '1.2'
                    }}>
                        {member.name}
                    </h3>
                    <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '12px',
                        backgroundColor: member.member_type === 'scout' ? '#e3f2fd' : '#f3e5f5',
                        color: member.member_type === 'scout' ? '#1976d2' : '#7b1fa2'
                    }}>
                        {member.member_type === 'scout' ? '🌱 Scout' : '🌲 Adult'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    <button
                        onClick={onEdit}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            padding: '4px',
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={onDelete}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            padding: '4px',
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Details */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '14px',
                color: '#666',
                flex: 1
            }}>
                {age && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', minWidth: '80px', color: '#333' }}>Age:</span>
                        <span>{age} years old</span>
                    </div>
                )}
                {member.troop_number && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', minWidth: '80px', color: '#333' }}>Troop:</span>
                        <span>{member.troop_number}</span>
                    </div>
                )}
                {member.patrol_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', minWidth: '80px', color: '#333' }}>Patrol:</span>
                        <span>{member.patrol_name}</span>
                    </div>
                )}
                
                {member.member_type === 'adult' && (
                    <>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            padding: '8px 12px',
                            backgroundColor: !member.has_youth_protection || (member.youth_protection_expiration && new Date(member.youth_protection_expiration) < new Date()) ? '#ffebee' : '#e8f5e9',
                            borderRadius: '4px',
                            marginTop: '4px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: !member.has_youth_protection || (member.youth_protection_expiration && new Date(member.youth_protection_expiration) < new Date()) ? '#c62828' : '#2e7d32',
                                fontWeight: '500'
                            }}>
                                {!member.has_youth_protection
                                    ? '⚠️ Youth Protection: Not Trained'
                                    : member.youth_protection_expiration && new Date(member.youth_protection_expiration) < new Date()
                                        ? '⚠️ Youth Protection: Expired'
                                        : '✓ Youth Protection: Valid'}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: !member.has_youth_protection || (member.youth_protection_expiration && new Date(member.youth_protection_expiration) < new Date()) ? '#c62828' : '#666'
                            }}>
                                Expiration: {member.youth_protection_expiration
                                    ? new Date(member.youth_protection_expiration).toLocaleDateString()
                                    : 'N/A'}
                            </div>
                        </div>
                        {member.vehicle_capacity > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: '600', minWidth: '80px', color: '#333' }}>Vehicle:</span>
                                <span>{member.vehicle_capacity} passengers</span>
                            </div>
                        )}
                    </>
                )}

                {member.dietary_preferences.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px' }}>Dietary:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {member.dietary_preferences.map((p, idx) => (
                                <span key={idx} style={{
                                    padding: '4px 10px',
                                    backgroundColor: 'var(--badge-scout-bg)',
                                    color: 'var(--badge-scout-text)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}>
                                    {p.preference}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {member.allergies.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px' }}>⚠️ Allergies:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {member.allergies.map((a, idx) => (
                                <span key={idx} style={{
                                    padding: '6px 10px',
                                    backgroundColor: 'var(--alert-error-bg)',
                                    color: 'var(--alert-error-text)',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    border: '1px solid #ef9a9a'
                                }}>
                                    {a.allergy}{a.severity && ` (${a.severity})`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface FamilyMemberFormProps {
    member: FamilyMember | null;
    onClose: () => void;
    onSuccess: () => void;
}

const FamilyMemberForm: React.FC<FamilyMemberFormProps> = ({ member, onClose, onSuccess }) => {
    // Common dietary preferences
    const commonDietaryPreferences = [
        'Vegetarian',
        'Vegan',
        'Gluten-Free',
        'Dairy-Free',
        'Nut Allergy',
        'Kosher',
        'Halal',
        'Pescatarian',
        'Low-Sodium',
        'Diabetic'
    ];

    const [formData, setFormData] = useState<FamilyMemberCreate>({
        name: member?.name || '',
        member_type: member?.member_type || 'scout',
        date_of_birth: member?.date_of_birth || '',
        troop_number: member?.troop_number || '',
        patrol_name: member?.patrol_name || '',
        has_youth_protection: member?.has_youth_protection || false,
        youth_protection_expiration: member?.youth_protection_expiration || '',
        vehicle_capacity: member?.vehicle_capacity || 0,
        medical_notes: member?.medical_notes || '',
        dietary_preferences: member?.dietary_preferences.map(p => p.preference) || [],
        allergies: member?.allergies.map(a => ({ allergy: a.allergy, severity: a.severity })) || [],
    });

    const [newAllergy, setNewAllergy] = useState({ allergy: '', severity: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validate youth protection for adults
        if (formData.member_type === 'adult' && !formData.has_youth_protection) {
            setError('⚠️ Youth Protection Training is required for all adults attending outings. Please complete the training at my.scouting.org and then enter the date of your SAFE Youth Training expiration and confirm.');
            setSubmitting(false);
            return;
        }

        try {
            if (member) {
                await familyAPI.update(member.id, formData);
            } else {
                await familyAPI.create(formData);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to save family member');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleDietaryPreference = (preference: string) => {
        const current = formData.dietary_preferences || [];
        if (current.includes(preference)) {
            setFormData({
                ...formData,
                dietary_preferences: current.filter(p => p !== preference),
            });
        } else {
            setFormData({
                ...formData,
                dietary_preferences: [...current, preference],
            });
        }
    };

    const addAllergy = () => {
        if (newAllergy.allergy.trim()) {
            setFormData({
                ...formData,
                allergies: [...(formData.allergies || []), newAllergy],
            });
            setNewAllergy({ allergy: '', severity: '' });
        }
    };

    const removeAllergy = (index: number) => {
        setFormData({
            ...formData,
            allergies: formData.allergies?.filter((_, i) => i !== index) || [],
        });
    };

    return (
        <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000
        }}>
        <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
            <div style={{ padding: '32px' }}>
                <h3 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    marginBottom: '24px',
                    color: '#1976d2'
                }}>
                        {member ? 'Edit Family Member' : 'Add Family Member'}
                    </h3>

                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'var(--alert-error-bg)',
                            color: 'var(--alert-error-text)',
                            borderRadius: '6px',
                            marginBottom: '20px',
                            fontSize: '14px',
                            border: '1px solid #ef9a9a'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="Enter full name"
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                Member Type *
                            </label>
                            <select
                                required
                                value={formData.member_type}
                                onChange={(e) => setFormData({ ...formData, member_type: e.target.value as 'scout' | 'adult' })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '15px',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="scout">Scout</option>
                                <option value="adult">Adult</option>
                            </select>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                Date of Birth {formData.member_type === 'scout' && '*'}
                            </label>
                            <input
                                type="date"
                                required={formData.member_type === 'scout'}
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                Troop Number
                            </label>
                            <input
                                type="text"
                                value={formData.troop_number}
                                onChange={(e) => setFormData({ ...formData, troop_number: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="e.g., 123"
                            />
                        </div>

                        {formData.member_type === 'scout' && (
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#333',
                                    fontSize: '15px'
                                }}>
                                    Patrol Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.patrol_name}
                                    onChange={(e) => setFormData({ ...formData, patrol_name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '15px',
                                        boxSizing: 'border-box'
                                    }}
                                    placeholder="e.g., Eagle Patrol"
                                />
                            </div>
                        )}

                        {formData.member_type === 'adult' && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        id="youth_protection"
                                        checked={formData.has_youth_protection}
                                        onChange={(e) => setFormData({ ...formData, has_youth_protection: e.target.checked })}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="youth_protection" style={{ fontSize: '15px', color: '#333', cursor: 'pointer' }}>
                                        Youth Protection Trained (SAFE Youth Training)
                                    </label>
                                </div>

                                {formData.has_youth_protection && (
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: '600',
                                            color: '#333',
                                            fontSize: '15px'
                                        }}>
                                            Youth Protection Certificate Expiration Date *
                                        </label>
                                        <input
                                            type="date"
                                            required={formData.has_youth_protection}
                                            value={formData.youth_protection_expiration}
                                            onChange={(e) => setFormData({ ...formData, youth_protection_expiration: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px',
                                                fontSize: '15px',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                        <p style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                                            SAFE Youth Training certificates are typically valid for 2 years
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#333',
                                        fontSize: '15px'
                                    }}>
                                        Vehicle Capacity (passengers)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.vehicle_capacity}
                                        onChange={(e) => setFormData({ ...formData, vehicle_capacity: parseInt(e.target.value) || 0 })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '15px',
                                            boxSizing: 'border-box'
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                Medical Notes
                            </label>
                            <textarea
                                value={formData.medical_notes}
                                onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '15px',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                                placeholder="Any medical conditions or notes..."
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '12px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                Dietary Preferences
                            </label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '12px',
                                padding: '16px',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '6px'
                            }}>
                                {commonDietaryPreferences.map((preference) => (
                                    <label
                                        key={preference}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            backgroundColor: formData.dietary_preferences?.includes(preference) ? '#e3f2fd' : 'white',
                                            borderRadius: '4px',
                                            border: formData.dietary_preferences?.includes(preference) ? '2px solid #1976d2' : '1px solid #ddd',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.dietary_preferences?.includes(preference) || false}
                                            onChange={() => toggleDietaryPreference(preference)}
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '14px', color: '#333' }}>{preference}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                Allergies
                            </label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    value={newAllergy.allergy}
                                    onChange={(e) => setNewAllergy({ ...newAllergy, allergy: e.target.value })}
                                    placeholder="Allergy type (e.g., Peanuts)"
                                    style={{
                                        flex: '1',
                                        minWidth: '200px',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '15px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <select
                                    value={newAllergy.severity}
                                    onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value })}
                                    style={{
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '15px',
                                        backgroundColor: 'white',
                                        minWidth: '150px'
                                    }}
                                >
                                    <option value="">Severity</option>
                                    <option value="mild">Mild</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="severe">Severe</option>
                                    <option value="life-threatening">Life-threatening</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={addAllergy}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '15px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                                >
                                    Add
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {formData.allergies?.map((allergy, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            backgroundColor: 'var(--alert-error-bg)',
                                            border: '1px solid var(--alert-error-border)',
                                            padding: '12px 16px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span style={{ fontSize: '14px', color: 'var(--alert-error-text)', fontWeight: '500' }}>
                                            {allergy.allergy}
                                            {allergy.severity && ` (${allergy.severity})`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeAllergy(index)}
                                            style={{
                                                color: 'var(--alert-error-text)',
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '20px',
                                                cursor: 'pointer',
                                                padding: '0 8px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', paddingTop: '24px' }}>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    flex: '1',
                                    padding: '14px',
                                    backgroundColor: submitting ? '#ccc' : '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    if (!submitting) e.currentTarget.style.backgroundColor = '#1565c0';
                                }}
                                onMouseOut={(e) => {
                                    if (!submitting) e.currentTarget.style.backgroundColor = '#1976d2';
                                }}
                            >
                                {submitting ? 'Saving...' : member ? 'Update' : 'Add'} Family Member
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    flex: '1',
                                    padding: '14px',
                                    backgroundColor: 'var(--btn-secondary-bg)',
                                    color: 'var(--btn-secondary-text)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-secondary-hover)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-secondary-bg)'}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};