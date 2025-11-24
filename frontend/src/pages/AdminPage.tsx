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
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
                        Admin Dashboard
                    </h1>
                    <p className="mt-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
                        Manage outings, users, and system settings
                    </p>
                </div>

                {/* Large Colorful Button Navigation */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 md:gap-8 mb-8">
                    <button
                        onClick={() => setActiveTab('outings')}
                        className={`
                            flex flex-col items-center gap-3 md:gap-4 p-6 md:p-10 rounded-2xl cursor-pointer transition-all duration-300 ease-in-out group relative overflow-hidden
                            ${activeTab === 'outings'
                                ? 'text-white shadow-xl scale-[1.02]'
                                : 'glass-card hover:-translate-y-1 hover:shadow-xl'
                            }
                        `}
                        style={activeTab === 'outings' ? {
                            background: `linear-gradient(to bottom right, var(--color-primary), var(--color-primary-light))`,
                            boxShadow: '0 0 0 4px rgba(var(--bsa-olive-rgb), 0.1)'
                        } : {}}
                    >
                        <div className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" style={{
                            backgroundColor: activeTab === 'outings' ? 'white' : 'var(--color-primary)'
                        }}></div>
                        <svg
                            className="w-10 h-10 md:w-14 md:h-14 transition-transform duration-300 group-hover:scale-110"
                            style={{ color: activeTab === 'outings' ? 'white' : 'var(--color-primary)' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                        </svg>
                        <div className="text-center relative z-10">
                            <h2 className="text-lg md:text-xl font-bold m-0 font-heading" style={{
                                color: activeTab === 'outings' ? 'white' : 'var(--text-primary)'
                            }}>
                                Outing Management
                            </h2>
                            <p className="text-sm md:text-base mt-2" style={{
                                color: activeTab === 'outings' ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'
                            }}>
                                Create, edit, and manage scouting outings
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('users')}
                        className={`
                            flex flex-col items-center gap-3 md:gap-4 p-6 md:p-10 rounded-2xl cursor-pointer transition-all duration-300 ease-in-out group relative overflow-hidden
                            ${activeTab === 'users'
                                ? 'text-white shadow-xl scale-[1.02]'
                                : 'glass-card hover:-translate-y-1 hover:shadow-xl'
                            }
                        `}
                        style={activeTab === 'users' ? {
                            background: `linear-gradient(to bottom right, var(--color-primary), var(--color-primary-light))`,
                            boxShadow: '0 0 0 4px rgba(var(--bsa-olive-rgb), 0.1)'
                        } : {}}
                    >
                        <div className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" style={{
                            backgroundColor: activeTab === 'users' ? 'white' : 'var(--color-primary)'
                        }}></div>
                        <svg
                            className="w-10 h-10 md:w-14 md:h-14 transition-transform duration-300 group-hover:scale-110"
                            style={{ color: activeTab === 'users' ? 'white' : 'var(--color-primary)' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                        <div className="text-center relative z-10">
                            <h2 className="text-xl md:text-2xl font-bold m-0 font-heading" style={{
                                color: activeTab === 'users' ? 'white' : 'var(--text-primary)'
                            }}>
                                User Management
                            </h2>
                            <p className="text-sm md:text-base mt-2" style={{
                                color: activeTab === 'users' ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'
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

                {/* Seed Data Section */}
                <div className="mt-12">
                    <DevDataSeeder />
                </div>
            </div>
        </div>
    );
};

export default AdminPage;