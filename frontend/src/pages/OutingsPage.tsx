import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import SignupWizard from '../components/Participant/SignupWizard';
import { familyAPI, outingAPI } from '../services/api';

const OUTINGS_CACHE_KEY = 'cached_outings';

const OutingsPage: React.FC = () => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();
    const [checkingFamily, setCheckingFamily] = useState(true);
    const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
    const [outings, setOutings] = useState<any[] | null>(null);
    const [outingsError, setOutingsError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const checkFamilyMembers = async () => {
            if (!isLoaded || !user) return;
            try {
                const data = await familyAPI.getSummary();
                if (!mounted) return;
                setHasFamilyMembers(data.length > 0);
            } catch (err) {
                console.error('Failed to check family members:', err);
            } finally {
                if (mounted) setCheckingFamily(false);
            }
        };

        checkFamilyMembers();
        return () => { mounted = false; };
    }, [isLoaded, user]);

    // Fetch outings (online or from cache)
    useEffect(() => {
        let mounted = true;
        const fetchOutings = async () => {
            try {
                const data = await outingAPI.getAll();
                if (!mounted) return;
                setOutings(data);
            } catch (err) {
                // Try cache if offline or fetch fails
                const cached = localStorage.getItem(OUTINGS_CACHE_KEY);
                if (cached) {
                    setOutings(JSON.parse(cached));
                    setOutingsError('Showing offline data');
                } else {
                    setOutingsError('Unable to load outings');
                }
            }
        };
        fetchOutings();
        return () => { mounted = false; };
    }, []);

    if (!isLoaded || checkingFamily) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-xl" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <SignedIn>
                {outingsError && (
                    <div style={{ color: 'var(--alert-warning-text)', background: 'var(--alert-warning-bg)', padding: 8, borderRadius: 6, margin: '12px 0', textAlign: 'center' }}>{outingsError}</div>
                )}
                {hasFamilyMembers ? (
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Pass outings to SignupWizard or render your own list here if needed */}
                        <SignupWizard outings={outings || []} />
                    </div>
                ) : (
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh] flex items-center justify-center">
                        <div className="max-w-md w-full glass-card p-10 text-center">
                            <h2 className="text-3xl font-bold font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
                                Welcome to Outing Signups!
                            </h2>
                            <p className="mb-8 text-lg" style={{ color: 'var(--text-secondary)' }}>
                                Before you can sign up for outings, you need to add family members to your account.
                            </p>
                            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                                Add yourself and any youth or adults who will be participating in outings.
                            </p>
                            <button
                                onClick={() => navigate('/family-setup')}
                                className="px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full"
                                style={{
                                    backgroundColor: 'var(--btn-primary-bg)',
                                    color: 'var(--btn-primary-text)'
                                }}
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
                        <h1 className="text-3xl font-bold font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
                            Sign In Required
                        </h1>
                        <p className="mb-8 text-lg" style={{ color: 'var(--text-secondary)' }}>
                            Please sign in or create an account to view and sign up for outings.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full px-8 py-4 rounded-lg"
                            style={{
                                backgroundColor: 'var(--btn-primary-bg)',
                                color: 'var(--btn-primary-text)'
                            }}
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