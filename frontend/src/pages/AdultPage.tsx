import React, { useState, useEffect } from 'react';
import { useAuth } from "react-oidc-context";
import { FamilyManagement } from '../components/Adult/FamilyManagement';
import OutingList from '../components/Shared/OutingList';
import { outingAPI } from '../services/api';
import { Outing } from '../types';

export const AdultPage: React.FC = () => {
    const auth = useAuth();
    const user = auth.user;
    const [activeTab, setActiveTab] = useState<'outings' | 'family'>('outings');
    const [outings, setOutings] = useState<Outing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOutings();
    }, []);

    const loadOutings = async () => {
        try {
            setLoading(true);
            const availableOutings = await outingAPI.getAvailable();
            setOutings(availableOutings);
        } catch (error) {
            console.error('Failed to load outings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        Welcome, {user?.firstName || user?.fullName || 'Adult'}!
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Manage your family and sign up for outings
                    </p>
                </div>

                {/* Tab Navigation */}
                <div style={{ borderBottom: '1px solid var(--card-border)', marginBottom: '1.5rem' }}>
                    <nav style={{ display: 'flex', gap: '2rem', marginBottom: '-1px' }}>
                        <button
                            onClick={() => setActiveTab('outings')}
                            style={{
                                whiteSpace: 'nowrap',
                                padding: '1rem 0.25rem',
                                color: activeTab === 'outings' ? 'var(--sa-scouts-green)' : 'var(--text-secondary)',
                                fontWeight: '500',
                                fontSize: '0.875rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'outings' ? '2px solid var(--sa-scouts-green)' : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                            }}
                        >
                            Available Outings
                        </button>
                        <button
                            onClick={() => setActiveTab('family')}
                            style={{
                                whiteSpace: 'nowrap',
                                padding: '1rem 0.25rem',
                                color: activeTab === 'family' ? 'var(--sa-scouts-green)' : 'var(--text-secondary)',
                                fontWeight: '500',
                                fontSize: '0.875rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'family' ? '2px solid var(--sa-scouts-green)' : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                            }}
                        >
                            My Family
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'outings' && (
                        <div>
                            <div style={{
                                backgroundColor: 'var(--badge-info-bg)',
                                border: '1px solid var(--badge-info-border)',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <h3 style={{ fontWeight: '600', color: 'var(--badge-info-text)', marginBottom: '0.5rem' }}>
                                    💡 Tip: Add your family members first!
                                </h3>
                                <p style={{ color: 'var(--badge-info-text)', fontSize: '0.875rem' }}>
                                    Before signing up for outings, add your family members in the "My Family" tab.
                                    This will save you time when registering for outings, as you can select from your saved family members.
                                </p>
                            </div>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>Loading outings...</div>
                            ) : (
                                <OutingList outings={outings} />
                            )}
                        </div>
                    )}
                    {activeTab === 'family' && <FamilyManagement />}
                </div>
            </div>
        </div>
    );
};