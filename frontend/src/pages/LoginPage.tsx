import React, { useEffect } from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to family setup if user is signed in
        if (isSignedIn) {
            navigate('/family-setup');
        }
    }, [isSignedIn, navigate]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-200px)] flex items-center justify-center flex-col gap-8 p-16">
            <div className="max-w-md w-full glass-card p-16 rounded-lg shadow-lg text-center">
                <h1 className="font-heading mb-2.5" style={{ color: 'var(--color-primary)' }}>
                    Welcome Back
                </h1>
                <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Sign in to set up your family and sign up for outings
                </p>

                <div className="flex justify-center">
                    <SignIn
                        afterSignInUrl="/family-setup"
                        signUpUrl="/sign-up"
                    />
                </div>
            </div>

            <div className="max-w-md w-full p-5 rounded text-sm text-center glass-card">
                <p className="mb-2.5">
                    <strong>First time setup?</strong>
                </p>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                    If you're setting up the system for the first time, you'll need to create an initial admin account.
                </p>
                <Link
                    to="/admin-setup"
                    className="inline-block px-5 py-2.5 no-underline rounded text-sm font-bold transition-colors"
                    style={{
                        backgroundColor: 'var(--btn-primary-bg)',
                        color: 'var(--btn-primary-text)'
                    }}
                >
                    Initial Admin Setup
                </Link>
            </div>

            <div className="max-w-md w-full p-4 rounded text-xs" style={{
                backgroundColor: 'var(--alert-info-bg)',
                color: 'var(--alert-info-text)',
                border: '1px solid var(--alert-info-border)'
            }}>
                <strong>ℹ️ About Clerk Authentication:</strong><br />
                Clerk provides secure, modern authentication with built-in user management. Your credentials are never stored in this application.
            </div>
        </div>
    );
};

export default LoginPage;