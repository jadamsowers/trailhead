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
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-5">
                <div className="text-center">
                    <p>Checking setup status...</p>
                </div>
            </div>
        );
    }

    if (setupComplete) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-5">
                <div className="max-w-lg w-full bg-white p-10 rounded-lg shadow-lg text-center">
                    <h1 className="font-heading text-primary-500 mb-5">
                        Setup Already Complete
                    </h1>
                    <p className="mb-8 text-gray-600">
                        An admin account has already been created for this system.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-primary-500 text-white border-0 rounded font-bold text-base cursor-pointer hover:bg-primary-600 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-5">
            <div className="max-w-lg w-full bg-white p-10 rounded-lg shadow-lg">
                <h1 className="font-heading text-center mb-2.5 text-primary-500">
                    Initial Admin Setup
                </h1>
                <p className="text-center mb-8 text-gray-600 text-sm">
                    Create the first administrator account for this system.
                    This page will only be accessible until the first admin is created.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label className="block mb-2 font-bold text-gray-800">
                            Full Name:
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-3 border border-gray-300 rounded text-base box-border disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block mb-2 font-bold text-gray-800">
                            Email:
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-3 border border-gray-300 rounded text-base box-border disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block mb-2 font-bold text-gray-800">
                            Password:
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-3 border border-gray-300 rounded text-base box-border disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Minimum 8 characters"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block mb-2 font-bold text-gray-800">
                            Confirm Password:
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full p-3 border border-gray-300 rounded text-base box-border disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Re-enter password"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-800 rounded mb-5 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 bg-primary-500 text-white border-0 rounded text-base font-bold cursor-pointer transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-primary-600"
                    >
                        {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
                    </button>
                </form>

                <div className="mt-5 p-4 bg-orange-50 rounded text-sm text-orange-800">
                    <strong>⚠️ Important:</strong><br />
                    This is a one-time setup. After creating the admin account, this page will no longer be accessible.
                    Make sure to save your credentials securely.
                </div>
            </div>
        </div>
    );
};

export default AdminSetupPage;