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
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="text-center text-secondary">
                    <p>Checking setup status...</p>
                </div>
            </div>
        );
    }

    if (setupComplete) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="max-w-lg w-full bg-[var(--card-bg)] p-10 rounded-lg shadow-[var(--card-shadow)] text-center border border-[var(--card-border)]">
                    <h1 className="font-bold text-sa-dark-blue mb-5 text-3xl">
                        Setup Already Complete
                    </h1>
                    <p className="mb-8 text-secondary">
                        An admin account has already been created for this system.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-none rounded font-bold text-base cursor-pointer"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="max-w-lg w-full bg-[var(--card-bg)] p-10 rounded-lg shadow-[var(--card-shadow)] border border-[var(--card-border)]">
                <h1 className="font-bold text-center mb-2.5 text-sa-dark-blue text-3xl">
                    Initial Admin Setup
                </h1>
                <p className="text-center mb-8 text-secondary text-sm">
                    Create the first administrator account for this system.
                    This page will only be accessible until the first admin is created.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label className="block mb-2 font-bold text-primary">
                            Full Name:
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-3 border border-[var(--input-border)] rounded text-base bg-[var(--input-bg)] text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block mb-2 font-bold text-primary">
                            Email:
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-3 border border-[var(--input-border)] rounded text-base bg-[var(--input-bg)] text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block mb-2 font-bold text-primary">
                            Password:
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-3 border border-[var(--input-border)] rounded text-base bg-[var(--input-bg)] text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Minimum 8 characters"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block mb-2 font-bold text-primary">
                            Confirm Password:
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-3 border border-[var(--input-border)] rounded text-base bg-[var(--input-bg)] text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Re-enter password"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-[var(--alert-error-bg)] text-[var(--alert-error-text)] rounded mb-5 text-sm border border-[var(--alert-error-border)]">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`
                            w-full p-3 border-none rounded text-base font-bold cursor-pointer
                            ${loading
                                ? 'bg-[var(--btn-disabled-bg)] text-[var(--btn-disabled-text)] cursor-not-allowed'
                                : 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
                            }
                        `}
                    >
                        {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
                    </button>
                </form>

                <div className="mt-5 p-4 bg-[var(--alert-warning-bg)] rounded text-sm text-[var(--alert-warning-text)] border border-[var(--alert-warning-border)]">
                    <strong>⚠️ Important:</strong><br />
                    This is a one-time setup. After creating the admin account, this page will no longer be accessible.
                    Make sure to save your credentials securely.
                </div>
            </div>
        </div>
    );
};

export default AdminSetupPage;