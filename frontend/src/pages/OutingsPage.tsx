import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import SignupWizard from '../components/Participant/SignupWizard';
import { familyAPI } from '../services/api';

const OutingsPage: React.FC = () => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();
    const [checkingFamily, setCheckingFamily] = useState(true);
    const [hasFamilyMembers, setHasFamilyMembers] = useState(false);

    useEffect(() => {
        let mounted = true;
        
        const checkFamilyMembers = async () => {
            // Only check family members when Clerk is loaded and user is available
            if (!isLoaded || !user) {
                return;
            }

            try {
                const data = await familyAPI.getSummary();
                
                if (!mounted) return;
                
                setHasFamilyMembers(data.length > 0);
            } catch (err) {
                console.error('Failed to check family members:', err);
            } finally {
                if (mounted) {
                    setCheckingFamily(false);
                }
            }
        };

        checkFamilyMembers();
        
        return () => {
            mounted = false;
        };
    }, [isLoaded, user]);

    // Show loading while Clerk is initializing or while checking family members
    if (!isLoaded || checkingFamily) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div>
            <SignedIn>
                {hasFamilyMembers ? (
                    <SignupWizard />
                ) : (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Welcome to Outing Signups!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Before you can sign up for outings, you need to add family members to your account.
                            </p>
                            <p className="text-gray-600 mb-8">
                                Add yourself and any youth or adults who will be participating in outings.
                            </p>
                            <button
                                onClick={() => navigate('/family-setup')}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full"
                            >
                                Add Family Members
                            </button>
                        </div>
                    </div>
                )}
            </SignedIn>
            <SignedOut>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Sign In Required
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Please sign in or create an account to view and sign up for outings.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full"
                        >
                            Sign In / Sign Up
                        </button>
                    </div>
                </div>
            </SignedOut>
        </div>
    );
};

export default OutingsPage;