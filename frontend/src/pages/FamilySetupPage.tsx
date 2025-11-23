import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { FamilyManagement } from '../components/Adult/FamilyManagement';
import { familyAPI } from '../services/api';
import TopographicBackground from '../components/Shared/TopographicBackground';

const FamilySetupPage: React.FC = () => {
    const { user, isLoaded, isSignedIn } = useUser();
    const navigate = useNavigate();
    const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only check family members after Clerk is loaded AND user is signed in
        if (isLoaded && isSignedIn) {
            // Add a small delay to ensure Clerk session is fully initialized
            const timer = setTimeout(() => {
                checkFamilyMembers();
            }, 100);
            return () => clearTimeout(timer);
        } else if (isLoaded && !isSignedIn) {
            // User is not signed in, stop loading
            setLoading(false);
        }
    }, [isLoaded, isSignedIn]);

    const checkFamilyMembers = async () => {
        try {
            const data = await familyAPI.getSummary();
            setHasFamilyMembers(data.length > 0);
        } catch (err) {
            console.error('Failed to check family members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        navigate('/outings');
    };

    const handleMemberAdded = () => {
        checkFamilyMembers();
    };

    if (!isLoaded || loading) {
        return (
            <>
                <TopographicBackground />
                <div style={{
                    minHeight: 'calc(100vh - 200px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p>Loading...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <TopographicBackground />
            <div style={{
                minHeight: 'calc(100vh - 200px)',
                padding: '40px 20px'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {/* Welcome Header Card */}
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        padding: '40px',
                        borderRadius: '8px',
                        boxShadow: 'var(--card-shadow)',
                        marginBottom: '30px',
                        textAlign: 'center',
                        border: '1px solid var(--card-border)'
                    }}>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: 'bold',
                            color: 'var(--sa-dark-blue)',
                            marginBottom: '10px'
                        }}>
                            Welcome, {user?.firstName || 'Adult'}!
                        </h1>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '16px',
                            marginBottom: '0'
                        }}>
                            Let's set up your family members so you can easily sign up for outings
                        </p>
                    </div>

                    {/* Instructions Card - Only show if no family members */}
                    {!hasFamilyMembers && (
                        <div style={{
                            backgroundColor: 'var(--alert-info-bg)',
                            border: '1px solid var(--alert-info-border)',
                            borderRadius: '8px',
                            padding: '30px',
                            marginBottom: '30px'
                        }}>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: '600',
                                color: 'var(--alert-info-text)',
                                marginBottom: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '28px' }}>👨‍👩‍👧‍👦</span>
                                Add Your Family Members
                            </h2>
                            <p style={{
                                color: 'var(--alert-info-text)',
                                marginBottom: '20px',
                                fontSize: '15px',
                                lineHeight: '1.6'
                            }}>
                                Before you can sign up for outings, please add at least one family member (scout or adult).
                                This information will be saved and can be reused for future outing signups, saving you time!
                            </p>
                            <ul style={{
                                color: 'var(--alert-info-text)',
                                paddingLeft: '20px',
                                margin: '0',
                                lineHeight: '2'
                            }}>
                                <li>Add scouts with their troop information</li>
                                <li>Add parents/adults with youth protection training status</li>
                                <li>Include dietary restrictions and allergies</li>
                                <li>Update information anytime</li>
                            </ul>
                        </div>
                    )}

                    {/* Family Management Section */}
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        padding: '40px',
                        borderRadius: '8px',
                        boxShadow: 'var(--card-shadow)',
                        marginBottom: '30px',
                        border: '1px solid var(--card-border)'
                    }}>
                        <FamilyManagement onMemberAdded={handleMemberAdded} />
                    </div>

                    {/* Continue Button - Only show if has family members */}
                    {hasFamilyMembers && (
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '30px'
                        }}>
                            <button
                                onClick={handleContinue}
                                style={{
                                    padding: '16px 48px',
                                    backgroundColor: 'var(--btn-success-bg)',
                                    color: 'var(--btn-success-text)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--btn-success-hover)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--btn-success-bg)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                }}
                            >
                                Continue to Outing Signups →
                            </button>
                        </div>
                    )}

                    {/* Help Text - Only show if no family members */}
                    {!hasFamilyMembers && (
                        <div style={{
                            textAlign: 'center',
                            padding: '20px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            fontSize: '14px'
                        }}>
                            <p style={{ margin: '0' }}>
                                Once you've added at least one family member, you can continue to browse and sign up for outings.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FamilySetupPage;