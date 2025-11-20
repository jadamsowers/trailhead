import React, { useState, useEffect } from 'react';
import { familyAPI } from '../../services/api';
import {
    FamilyMember,
    FamilyMemberCreate,
    FamilyMemberUpdate,
} from '../../types';

interface FamilyManagementProps {
    onMemberAdded?: () => void;
}

export const FamilyManagement: React.FC<FamilyManagementProps> = ({ onMemberAdded }) => {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

    useEffect(() => {
        loadFamilyMembers();
    }, []);

    const loadFamilyMembers = async () => {
        try {
            setLoading(true);
            const response = await familyAPI.getAll();
            setMembers(response.members);
            setError(null);
        } catch (err) {
            setError('Failed to load family members');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
            await familyAPI.delete(id);
            await loadFamilyMembers();
        } catch (err) {
            setError('Failed to delete family member');
            console.error(err);
        }
    };

    const handleFormClose = () => {
        setShowAddForm(false);
        setEditingMember(null);
    };

    const handleFormSuccess = async () => {
        await loadFamilyMembers();
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Family Members</h2>
                <button
                    onClick={handleAddMember}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    + Add Family Member
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {members.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">No family members added yet</p>
                    <button
                        onClick={handleAddMember}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Add Your First Family Member
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {members.map((member) => (
                        <FamilyMemberCard
                            key={member.id}
                            member={member}
                            onEdit={() => handleEditMember(member)}
                            onDelete={() => handleDeleteMember(member.id)}
                        />
                    ))}
                </div>
            )}

            {showAddForm && (
                <FamilyMemberForm
                    member={editingMember}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
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
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                        member.member_type === 'scout' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                        {member.member_type === 'scout' ? 'Scout' : 'Parent'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onEdit}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
                {age && <div>Age: {age}</div>}
                {member.troop_number && <div>Troop: {member.troop_number}</div>}
                {member.patrol_name && <div>Patrol: {member.patrol_name}</div>}
                
                {member.member_type === 'parent' && (
                    <>
                        {member.has_youth_protection && (
                            <div className="text-green-600">✓ Youth Protection Trained</div>
                        )}
                        {member.vehicle_capacity > 0 && (
                            <div>Vehicle Capacity: {member.vehicle_capacity} passengers</div>
                        )}
                    </>
                )}

                {member.dietary_preferences.length > 0 && (
                    <div>
                        <strong>Dietary:</strong> {member.dietary_preferences.map(p => p.preference).join(', ')}
                    </div>
                )}

                {member.allergies.length > 0 && (
                    <div>
                        <strong>Allergies:</strong> {member.allergies.map(a => a.allergy).join(', ')}
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
    const [formData, setFormData] = useState<FamilyMemberCreate>({
        name: member?.name || '',
        member_type: member?.member_type || 'scout',
        date_of_birth: member?.date_of_birth || '',
        troop_number: member?.troop_number || '',
        patrol_name: member?.patrol_name || '',
        has_youth_protection: member?.has_youth_protection || false,
        vehicle_capacity: member?.vehicle_capacity || 0,
        medical_notes: member?.medical_notes || '',
        dietary_preferences: member?.dietary_preferences.map(p => p.preference) || [],
        allergies: member?.allergies.map(a => ({ allergy: a.allergy, severity: a.severity })) || [],
    });

    const [newDietaryPref, setNewDietaryPref] = useState('');
    const [newAllergy, setNewAllergy] = useState({ allergy: '', severity: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

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

    const addDietaryPreference = () => {
        if (newDietaryPref.trim()) {
            setFormData({
                ...formData,
                dietary_preferences: [...(formData.dietary_preferences || []), newDietaryPref.trim()],
            });
            setNewDietaryPref('');
        }
    };

    const removeDietaryPreference = (index: number) => {
        setFormData({
            ...formData,
            dietary_preferences: formData.dietary_preferences?.filter((_, i) => i !== index) || [],
        });
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-2xl font-bold mb-4">
                        {member ? 'Edit Family Member' : 'Add Family Member'}
                    </h3>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Member Type *
                            </label>
                            <select
                                required
                                value={formData.member_type}
                                onChange={(e) => setFormData({ ...formData, member_type: e.target.value as 'scout' | 'parent' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                                <option value="scout">Scout</option>
                                <option value="parent">Parent</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date of Birth {formData.member_type === 'scout' && '*'}
                            </label>
                            <input
                                type="date"
                                required={formData.member_type === 'scout'}
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Troop Number
                            </label>
                            <input
                                type="text"
                                value={formData.troop_number}
                                onChange={(e) => setFormData({ ...formData, troop_number: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {formData.member_type === 'scout' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Patrol Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.patrol_name}
                                    onChange={(e) => setFormData({ ...formData, patrol_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        )}

                        {formData.member_type === 'parent' && (
                            <>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="youth_protection"
                                        checked={formData.has_youth_protection}
                                        onChange={(e) => setFormData({ ...formData, has_youth_protection: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="youth_protection" className="text-sm text-gray-700">
                                        Youth Protection Trained
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vehicle Capacity (passengers)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.vehicle_capacity}
                                        onChange={(e) => setFormData({ ...formData, vehicle_capacity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Medical Notes
                            </label>
                            <textarea
                                value={formData.medical_notes}
                                onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dietary Preferences
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newDietaryPref}
                                    onChange={(e) => setNewDietaryPref(e.target.value)}
                                    placeholder="e.g., vegetarian, gluten-free"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    type="button"
                                    onClick={addDietaryPreference}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.dietary_preferences?.map((pref, index) => (
                                    <span
                                        key={index}
                                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {pref}
                                        <button
                                            type="button"
                                            onClick={() => removeDietaryPreference(index)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Allergies
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newAllergy.allergy}
                                    onChange={(e) => setNewAllergy({ ...newAllergy, allergy: e.target.value })}
                                    placeholder="Allergy type"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                                <select
                                    value={newAllergy.severity}
                                    onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.allergies?.map((allergy, index) => (
                                    <div
                                        key={index}
                                        className="bg-red-50 border border-red-200 px-3 py-2 rounded-lg flex justify-between items-center"
                                    >
                                        <span className="text-sm">
                                            {allergy.allergy}
                                            {allergy.severity && ` (${allergy.severity})`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeAllergy(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {submitting ? 'Saving...' : member ? 'Update' : 'Add'} Family Member
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
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