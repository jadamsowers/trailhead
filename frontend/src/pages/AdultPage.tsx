import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { FamilyManagement } from '../components/Adult/FamilyManagement';
import OutingList from '../components/Shared/OutingList';
import { outingAPI } from '../services/api';
import { Outing } from '../types';

export const AdultPage: React.FC = () => {
    const { user } = useUser();
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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-bold text-gray-900">
                        Welcome, {user?.firstName || user?.fullName || 'Adult'}!
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Manage your family and sign up for outings
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('outings')}
                            className={`${
                                activeTab === 'outings'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Available Outings
                        </button>
                        <button
                            onClick={() => setActiveTab('family')}
                            className={`${
                                activeTab === 'family'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            My Family
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'outings' && (
                        <div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <h3 className="font-heading font-semibold text-blue-900 mb-2">
                                    💡 Tip: Add your family members first!
                                </h3>
                                <p className="text-blue-800 text-sm">
                                    Before signing up for outings, add your family members in the "My Family" tab.
                                    This will save you time when registering for outings, as you can select from your saved family members.
                                </p>
                            </div>
                            {loading ? (
                                <div className="text-center py-8 text-gray-600">Loading outings...</div>
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