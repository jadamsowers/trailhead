import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import OutingAdmin from '../components/Admin/OutingAdmin';
import UserManagement from '../components/Admin/UserManagement';
import DevDataSeeder from '../components/Admin/DevDataSeeder';

const AdminPage: React.FC = () => {
    const { isLoaded } = useUser();
    const [activeTab, setActiveTab] = useState<'outings' | 'users'>('outings');

    if (!isLoaded) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'center' }}>
            <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                    }}>
                        Admin Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Manage outings, users, and system settings
                    </p>
                </div>

                {/* Seed Data Section */}
                <DevDataSeeder />

                {/* Large Colorful Button Navigation */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('outings')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '3rem',
                            borderRadius: '1rem',
                            border: activeTab === 'outings' ? '2px solid var(--btn-primary-bg)' : '1px solid var(--card-border)',
                            backgroundColor: activeTab === 'outings' ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
                            color: activeTab === 'outings' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            boxShadow: activeTab === 'outings' ? 'var(--shadow-elevated)' : 'var(--card-shadow)',
                            transform: activeTab === 'outings' ? 'scale(1.02)' : 'scale(1)'
                        }}
                        onMouseOver={(e) => {
                            if (activeTab !== 'outings') {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (activeTab !== 'outings') {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                            }
                        }}
                    >
                        <svg
                            style={{ width: '3rem', height: '3rem' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                        </svg>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{
                                fontSize: '1.875rem',
                                fontWeight: 'bold',
                                margin: 0,
                                color: 'inherit',
                                fontFamily: 'var(--font-heading)'
                            }}>
                                Outing Management
                            </h2>
                            <p style={{
                                fontSize: '1rem',
                                opacity: 0.9,
                                margin: '0.5rem 0 0 0',
                                color: 'inherit'
                            }}>
                                Create, edit, and manage scouting outings
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '3rem',
                            borderRadius: '1rem',
                            border: activeTab === 'users' ? '2px solid var(--btn-primary-bg)' : '1px solid var(--card-border)',
                            backgroundColor: activeTab === 'users' ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
                            color: activeTab === 'users' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            boxShadow: activeTab === 'users' ? 'var(--shadow-elevated)' : 'var(--card-shadow)',
                            transform: activeTab === 'users' ? 'scale(1.02)' : 'scale(1)'
                        }}
                        onMouseOver={(e) => {
                            if (activeTab !== 'users') {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (activeTab !== 'users') {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                            }
                        }}
                    >
                        <svg
                            style={{ width: '3rem', height: '3rem' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{
                                fontSize: '1.875rem',
                                fontWeight: 'bold',
                                margin: 0,
                                color: 'inherit',
                                fontFamily: 'var(--font-heading)'
                            }}>
                                User Management
                            </h2>
                            <p style={{
                                fontSize: '1rem',
                                opacity: 0.9,
                                margin: '0.5rem 0 0 0',
                                color: 'inherit'
                            }}>
                                Manage user accounts and permissions
                            </p>
                        </div>
                    </button>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'outings' && <OutingAdmin />}
                    {activeTab === 'users' && <UserManagement />}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;