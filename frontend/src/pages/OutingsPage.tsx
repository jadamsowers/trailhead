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
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-secondary)'
            }}>
                <div style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div>
            <SignedIn>
                {hasFamilyMembers ? (
                    <SignupWizard />
                ) : (
                    <div style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '20px'
                    }}>
                        <div style={{
                            maxWidth: '28rem',
                            width: '100%',
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '8px',
                            boxShadow: 'var(--card-shadow)',
                            padding: '2rem',
                            textAlign: 'center',
                            border: '1px solid var(--card-border)'
                        }}>
                            <h2 style={{
                                fontSize: '1.875rem',
                                fontWeight: 'bold',
                                color: 'var(--text-primary)',
                                marginBottom: '1rem'
                            }}>
                                Welcome to Outing Signups!
                            </h2>
                            <p style={{
                                color: 'var(--text-secondary)',
                                marginBottom: '1.5rem'
                            }}>
                                Before you can sign up for outings, you need to add family members to your account.
                            </p>
                            <p style={{
                                color: 'var(--text-secondary)',
                                marginBottom: '2rem'
                            }}>
                                Add yourself and any youth or adults who will be participating in outings.
                            </p>
                            <button
                                onClick={() => navigate('/family-setup')}
                                style={{
                                    backgroundColor: 'var(--btn-primary-bg)',
                                    color: 'var(--btn-primary-text)',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer',
                                    width: '100%',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)'}
                            >
                                Add Family Members
                            </button>
                        </div>
                    </div>
                )}
            </SignedIn>
            <SignedOut>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '20px'
                }}>
                    <div style={{
                        maxWidth: '28rem',
                        width: '100%',
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '8px',
                        boxShadow: 'var(--card-shadow)',
                        padding: '2rem',
                        textAlign: 'center',
                        border: '1px solid var(--card-border)'
                    }}>
                        <h1 style={{
                            fontSize: '1.875rem',
                            fontWeight: 'bold',
                            color: 'var(--text-primary)',
                            marginBottom: '1rem'
                        }}>
                            Sign In Required
                        </h1>
                        <p style={{
                            color: 'var(--text-secondary)',
                            marginBottom: '1.5rem'
                        }}>
                            Please sign in or create an account to view and sign up for outings.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                backgroundColor: 'var(--btn-primary-bg)',
                                color: 'var(--btn-primary-text)',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)'}
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