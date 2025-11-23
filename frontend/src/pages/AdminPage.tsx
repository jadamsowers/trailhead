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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
                    <button
                        onClick={() => setActiveTab('outings')}
                        className={`
                            ${activeTab === 'outings' 
                                ? 'bg-gradient-scout shadow-elevated scale-105 ring-4 ring-blue-500/30' 
                                : 'bg-gradient-scout-light shadow-lg scale-100'
                            }
                            text-white border-0 rounded-2xl p-12 cursor-pointer 
                            transition-all duration-300 ease-in-out
                            hover:scale-105 hover:shadow-elevated
                            active:scale-100
                        `}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <svg
                                className="w-12 h-12"
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
                            <h2 className="text-3xl font-heading font-bold m-0">Outing Management</h2>
                            <p className="text-base opacity-90 m-0">
                                Create, edit, and manage scouting outings
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('users')}
                        className={`
                            ${activeTab === 'users' 
                                ? 'bg-gradient-user shadow-elevated scale-105 ring-4 ring-purple-500/30' 
                                : 'bg-gradient-user-light shadow-lg scale-100'
                            }
                            text-white border-0 rounded-2xl p-12 cursor-pointer 
                            transition-all duration-300 ease-in-out
                            hover:scale-105 hover:shadow-elevated
                            active:scale-100
                        `}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <svg
                                className="w-12 h-12"
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
                            <h2 className="text-3xl font-heading font-bold m-0">User Management</h2>
                            <p className="text-base opacity-90 m-0">
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