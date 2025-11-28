import React, { useState, useEffect } from 'react';
import { useUser } from "@stackframe/stack";
import { userAPI } from '../services/api';
import type { User } from '../types';

const ProfilePage: React.FC = () => {
    const stackUser = useUser();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [contactInfo, setContactInfo] = useState({
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        youth_protection_expiration: ''
    });

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const userData = await userAPI.getCurrentUser();
            setUser(userData);
            setContactInfo({
                phone: userData.phone || '',
                emergency_contact_name: userData.emergency_contact_name || '',
                emergency_contact_phone: userData.emergency_contact_phone || '',
                youth_protection_expiration: userData.youth_protection_expiration || ''
            });
        } catch (err) {
            setError('Failed to load profile information');
            console.error('Error loading profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatPhoneNumber = (value: string) => {
        // Remove all non-numeric characters
        const cleaned = value.replace(/\D/g, '');

        // Format as (XXX) XXX-XXXX
        if (cleaned.length <= 3) {
            return cleaned;
        } else if (cleaned.length <= 6) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        } else {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        }
    };

    const handlePhoneChange = (field: 'phone' | 'emergency_contact_phone', value: string) => {
        const formatted = formatPhoneNumber(value);
        setContactInfo(prev => ({ ...prev, [field]: formatted }));
    };

    const handleDateChange = (value: string) => {
        setContactInfo(prev => ({ ...prev, youth_protection_expiration: value }));
    };

    const validatePhone = (phone: string): boolean => {
        if (!phone) return true; // Optional
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate phone numbers
        if (contactInfo.phone && !validatePhone(contactInfo.phone)) {
            setError('Phone number must be 10 digits');
            return;
        }

        if (contactInfo.emergency_contact_phone && !validatePhone(contactInfo.emergency_contact_phone)) {
            setError('Emergency contact phone must be 10 digits');
            return;
        }

        if (contactInfo.emergency_contact_name && !contactInfo.emergency_contact_phone) {
            setError('Emergency contact phone is required when name is provided');
            return;
        }

        if (contactInfo.emergency_contact_phone && !contactInfo.emergency_contact_name) {
            setError('Emergency contact name is required when phone is provided');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            const updatedUser = await userAPI.updateContactInfo(contactInfo);
            setUser(updatedUser);
            setSuccessMessage('Profile updated successfully! These details will be used as defaults for future signups.');

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError('Failed to update profile');
            console.error('Error updating profile:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 py-8">
                <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                    Loading profile...
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold font-heading mb-6" style={{ color: 'var(--text-primary)' }}>
                My Profile
            </h1>

            {error && (
                <div className="mb-6 p-4 rounded-lg" style={{
                    backgroundColor: 'var(--color-error-bg, #ffebee)',
                    color: 'var(--color-error, #c62828)',
                    border: '1px solid var(--color-error, #c62828)'
                }}>
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-6 p-4 rounded-lg" style={{
                    backgroundColor: 'var(--color-success-bg, #e8f5e9)',
                    color: 'var(--color-success, #2e7d32)',
                    border: '1px solid var(--color-success, #2e7d32)'
                }}>
                    {successMessage}
                </div>
            )}

            <div className="glass-card p-6 rounded-lg mb-6" style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
            }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Account Information
                </h2>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Name
                        </label>
                        <div className="text-base" style={{ color: 'var(--text-primary)' }}>
                            {user?.full_name || stackUser?.displayName || 'Not set'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Email
                        </label>
                        <div className="text-base" style={{ color: 'var(--text-primary)' }}>
                            {user?.email || stackUser?.primaryEmail || 'Not set'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Role
                        </label>
                        <div className="text-base capitalize" style={{ color: 'var(--text-primary)' }}>
                            {user?.role || 'User'}
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <div className="glass-card p-6 rounded-lg" style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)'
                }}>
                    <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Contact Information
                    </h2>
                    <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        This information will be used as your default contact details for outing signups.
                        You can change it for individual signups if needed.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={contactInfo.phone}
                                onChange={(e) => handlePhoneChange('phone', e.target.value)}
                                placeholder="(555) 123-4567"
                                className="w-full p-2.5 text-base rounded-md border"
                                style={{
                                    borderColor: 'var(--border-light)',
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Format: (XXX) XXX-XXXX
                            </p>
                        </div>

                        <div className="pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                                Emergency Contact
                            </h3>

                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    Emergency Contact Name
                                </label>
                                <input
                                    type="text"
                                    value={contactInfo.emergency_contact_name}
                                    onChange={(e) => setContactInfo(prev => ({
                                        ...prev,
                                        emergency_contact_name: e.target.value
                                    }))}
                                    placeholder="John Doe"
                                    className="w-full p-2.5 text-base rounded-md border"
                                    style={{
                                        borderColor: 'var(--border-light)',
                                        backgroundColor: 'var(--input-bg)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    Emergency Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    value={contactInfo.emergency_contact_phone}
                                    onChange={(e) => handlePhoneChange('emergency_contact_phone', e.target.value)}
                                    placeholder="(555) 123-4567"
                                    className="w-full p-2.5 text-base rounded-md border"
                                    style={{
                                        borderColor: 'var(--border-light)',
                                        backgroundColor: 'var(--input-bg)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    Format: (XXX) XXX-XXXX
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                                Youth Protection
                            </h3>

                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    SAFE Youth Training Expiration
                                </label>
                                <input
                                    type="date"
                                    value={contactInfo.youth_protection_expiration}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full p-2.5 text-base rounded-md border"
                                    style={{
                                        borderColor: 'var(--border-light)',
                                        backgroundColor: 'var(--input-bg)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    Please enter the expiration date from your Scouting America SAFE Youth Training certificate.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-lg font-bold transition-all hover:-translate-y-0.5"
                            style={{
                                backgroundColor: 'var(--btn-primary-bg)',
                                color: 'var(--btn-primary-text)',
                                opacity: saving ? 0.6 : 1,
                                cursor: saving ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                        <button
                            type="button"
                            onClick={loadUserProfile}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-lg font-bold transition-all"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-light)',
                                cursor: saving ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;
