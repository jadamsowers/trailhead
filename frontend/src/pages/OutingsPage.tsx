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
            <div className="min-h-screen flex items-center justify-center bg-secondary">
                <div className="text-xl text-secondary">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <SignedIn>
                {hasFamilyMembers ? (
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <SignupWizard />
                    </div>
                ) : (
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh] flex items-center justify-center">
                        <div className="max-w-md w-full glass-card p-10 text-center">
                            <h2 className="text-3xl font-bold font-heading text-sa-dark-blue mb-4">
                                Welcome to Outing Signups!
                            </h2>
                            <p className="text-secondary mb-8 text-lg">
                                Before you can sign up for outings, you need to add family members to your account.
                            </p>
                            <p className="text-secondary mb-8">
                                Add yourself and any youth or adults who will be participating in outings.
                            </p>
                            <button
                                onClick={() => navigate('/family-setup')}
                                className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full"
                            >
                                Add Family Members
                            </button>
                        </div>
                    </div>
                )}
            </SignedIn>
            <SignedOut>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh] flex items-center justify-center">
                    <div className="max-w-md w-full glass-card p-10 text-center">
                        <h1 className="text-3xl font-bold font-heading text-sa-dark-blue mb-4">
                            Sign In Required
                        </h1>
                        <p className="text-secondary mb-8 text-lg">
                            Please sign in or create an account to view and sign up for outings.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full"
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