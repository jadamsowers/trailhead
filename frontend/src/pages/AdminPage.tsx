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
            <div className="min-h-screen bg-secondary flex items-center justify-center">
                <div className="text-center text-secondary">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold font-heading text-sa-dark-blue mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-secondary mt-2 text-lg">
                        Manage outings, users, and system settings
                    </p>
                </div>

                {/* Seed Data Section */}
                <DevDataSeeder />

                {/* Large Colorful Button Navigation */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 mb-8">
                    <button
                        onClick={() => setActiveTab('outings')}
                        className={`
                            flex flex-col items-center gap-4 p-12 rounded-2xl cursor-pointer transition-all duration-300 ease-in-out group relative overflow-hidden
                            ${activeTab === 'outings'
                                ? 'bg-gradient-to-br from-sa-dark-blue to-sa-blue text-white shadow-xl scale-[1.02] ring-4 ring-blue-100'
                                : 'glass-card hover:bg-white hover:-translate-y-1 hover:shadow-xl'
                            }
                        `}
                    >
                        <div className={`absolute inset-0 opacity-10 ${activeTab === 'outings' ? 'bg-white' : 'bg-sa-blue'} transition-opacity group-hover:opacity-20`}></div>
                        <svg
                            className={`w-16 h-16 transition-transform duration-300 group-hover:scale-110 ${activeTab === 'outings' ? 'text-white' : 'text-sa-dark-blue'}`}
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
                            <h2 className={`text-3xl font-bold m-0 font-heading ${activeTab === 'outings' ? 'text-white' : 'text-sa-dark-blue'}`}>
                                Outing Management
                            </h2>
                            <p className={`text-base mt-2 ${activeTab === 'outings' ? 'text-blue-100' : 'text-secondary'}`}>
                                Create, edit, and manage scouting outings
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('users')}
                        className={`
                            flex flex-col items-center gap-4 p-12 rounded-2xl cursor-pointer transition-all duration-300 ease-in-out group relative overflow-hidden
                            ${activeTab === 'users'
                                ? 'bg-gradient-to-br from-sa-dark-blue to-sa-blue text-white shadow-xl scale-[1.02] ring-4 ring-blue-100'
                                : 'glass-card hover:bg-white hover:-translate-y-1 hover:shadow-xl'
                            }
                        `}
                    >
                        <div className={`absolute inset-0 opacity-10 ${activeTab === 'users' ? 'bg-white' : 'bg-sa-blue'} transition-opacity group-hover:opacity-20`}></div>
                        <svg
                            className={`w-16 h-16 transition-transform duration-300 group-hover:scale-110 ${activeTab === 'users' ? 'text-white' : 'text-sa-dark-blue'}`}
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
                            <h2 className={`text-3xl font-bold m-0 font-heading ${activeTab === 'users' ? 'text-white' : 'text-sa-dark-blue'}`}>
                                User Management
                            </h2>
                            <p className={`text-base mt-2 ${activeTab === 'users' ? 'text-blue-100' : 'text-secondary'}`}>
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