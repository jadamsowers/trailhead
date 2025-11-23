import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AdminSetupPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingSetup, setCheckingSetup] = useState(true);
    const [setupComplete, setSetupComplete] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if admin setup is already complete
        const checkSetupStatus = async () => {
            try {
                const response = await authAPI.checkSetupStatus();
                if (response.setup_complete) {
                    setSetupComplete(true);
                }
            } catch (err) {
                // If endpoint doesn't exist or errors, assume setup is needed
                console.error('Error checking setup status:', err);
            } finally {
                setCheckingSetup(false);
            }
        };

        checkSetupStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            await authAPI.setupAdmin({
                email,
                password,
                full_name: fullName
            });

            // Redirect to login page after successful setup
            navigate('/login', {
                state: {
                    message: 'Admin account created successfully! Please log in.'
                }
            });
        } catch (err: any) {
            setError(err.message || 'Failed to create admin account');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSetup) {
        return (
            <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Checking setup status...</p>
                </div>
            </div>
        );
    }

    if (setupComplete) {
        return (
            <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
                <div style={{ maxWidth: '32rem', width: '100%', backgroundColor: 'var(--card-bg)', padding: '2.5rem', borderRadius: '8px', boxShadow: 'var(--card-shadow)', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                    <h1 style={{ fontWeight: 'bold', color: 'var(--sa-dark-blue)', marginBottom: '1.25rem', fontSize: '1.875rem' }}>
                        Setup Already Complete
                    </h1>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                        An admin account has already been created for this system.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
            <div style={{ maxWidth: '32rem', width: '100%', backgroundColor: 'var(--card-bg)', padding: '2.5rem', borderRadius: '8px', boxShadow: 'var(--card-shadow)', border: '1px solid var(--card-border)' }}>
                <h1 style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '0.625rem', color: 'var(--sa-dark-blue)', fontSize: '1.875rem' }}>
                    Initial Admin Setup
                </h1>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Create the first administrator account for this system.
                    This page will only be accessible until the first admin is created.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            Full Name:
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--input-border)',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                opacity: loading ? 0.5 : 1,
                                cursor: loading ? 'not-allowed' : 'text'
                            }}
                            placeholder="John Doe"
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            Email:
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--input-border)',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                opacity: loading ? 0.5 : 1,
                                cursor: loading ? 'not-allowed' : 'text'
                            }}
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            Password:
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--input-border)',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                opacity: loading ? 0.5 : 1,
                                cursor: loading ? 'not-allowed' : 'text'
                            }}
                            placeholder="Minimum 8 characters"
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            Confirm Password:
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--input-border)',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                opacity: loading ? 0.5 : 1,
                                cursor: loading ? 'not-allowed' : 'text'
                            }}
                            placeholder="Re-enter password"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: 'var(--alert-error-bg)',
                            color: 'var(--alert-error-text)',
                            borderRadius: '4px',
                            marginBottom: '1.25rem',
                            fontSize: '0.875rem',
                            border: '1px solid var(--alert-error-border)'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: loading ? 'var(--btn-disabled-bg)' : 'var(--btn-primary-bg)',
                            color: loading ? 'var(--btn-disabled-text)' : 'var(--btn-primary-text)',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
                    </button>
                </form>

                <div style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    backgroundColor: 'var(--alert-warning-bg)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    color: 'var(--alert-warning-text)',
                    border: '1px solid var(--alert-warning-border)'
                }}>
                    <strong>⚠️ Important:</strong><br />
                    This is a one-time setup. After creating the admin account, this page will no longer be accessible.
                    Make sure to save your credentials securely.
                </div>
            </div>
        </div>
    );
};

export default AdminSetupPage;