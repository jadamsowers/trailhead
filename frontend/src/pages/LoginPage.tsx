import React, { useEffect, useState } from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../utils/themeManager';

const LoginPage: React.FC = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();
    const { effectiveTheme } = useTheme();
    const [clerkAppearance, setClerkAppearance] = useState<any>({});

    // Update Clerk appearance whenever theme changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;
        const styles = getComputedStyle(root);

        // Helper to get CSS variable value
        const getCSSVar = (varName: string) => styles.getPropertyValue(varName).trim();

        console.log('🎨 Clerk appearance updating for theme:', effectiveTheme);

        const newAppearance = {
            variables: {
                colorPrimary: getCSSVar('--color-primary'),
                colorBackground: getCSSVar('--bg-primary'),
                colorInputBackground: getCSSVar('--input-bg'),
                colorInputText: getCSSVar('--input-text'),
                colorText: getCSSVar('--text-primary'),
                colorTextSecondary: getCSSVar('--text-secondary'),
                colorDanger: getCSSVar('--color-error'),
                borderRadius: '0.75rem',
            },
            elements: {
                card: {
                    border: `1px solid ${getCSSVar('--border-light')}`,
                    boxShadow: getCSSVar('--shadow-md'),
                },
                formButtonPrimary: {
                    backgroundColor: getCSSVar('--btn-primary-bg'),
                    color: getCSSVar('--btn-primary-text'),
                    '&:hover': {
                        backgroundColor: getCSSVar('--btn-primary-hover'),
                    },
                },
                // Style OAuth buttons (Google, etc.) for better contrast
                socialButtonsBlockButton: {
                    backgroundColor: effectiveTheme === 'dark' ? '#303731' : '#F7F5F2',
                    color: effectiveTheme === 'dark' ? '#EFE9E3' : '#0C160E',
                    border: `1px solid ${getCSSVar('--border-medium')}`,
                    '&:hover': {
                        backgroundColor: effectiveTheme === 'dark' ? '#3A4139' : '#EFE9E3',
                    },
                },
                socialButtonsBlockButtonText: {
                    color: effectiveTheme === 'dark' ? '#EFE9E3' : '#0C160E',
                    fontWeight: '600',
                },
            },
        };

        setClerkAppearance(newAppearance);
    }, [effectiveTheme]);

    useEffect(() => {
        // Redirect to family setup if user is signed in
        if (isSignedIn) {
            navigate('/family-setup');
        }
    }, [isSignedIn, navigate]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-200px)] flex items-center justify-center flex-col gap-8">
            <div
                className="max-w-md w-full p-10 rounded-lg shadow-lg text-center"
                style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-light)',
                }}
            >
                <h1
                    className="font-heading mb-2.5"
                    style={{ color: 'var(--color-primary)' }}
                >
                    Welcome Back
                </h1>
                <p
                    className="mb-8 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Sign in to set up your family and sign up for outings
                </p>

                <div className="flex justify-center">
                    <SignIn
                        key={effectiveTheme} // Force re-render when theme changes
                        afterSignInUrl="/family-setup"
                        signUpUrl="/sign-up"
                        appearance={clerkAppearance}
                    />
                </div>
            </div>

            <div
                className="max-w-md w-full p-5 rounded text-sm text-center"
                style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                }}
            >
                <p className="mb-2.5">
                    <strong style={{ color: 'var(--text-primary)' }}>First time setup?</strong>
                </p>
                <p className="mb-4">
                    If you're setting up the system for the first time, you'll need to create an initial admin account.
                </p>
                <Link
                    to="/admin-setup"
                    className="inline-block px-5 py-2.5 no-underline rounded text-sm font-bold transition-colors"
                    style={{
                        backgroundColor: 'var(--btn-primary-bg)',
                        color: 'var(--btn-primary-text)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)';
                    }}
                >
                    Initial Admin Setup
                </Link>
            </div>

            <div
                className="max-w-md w-full p-4 rounded text-xs"
                style={{
                    backgroundColor: 'var(--alert-info-bg)',
                    color: 'var(--alert-info-text)',
                    border: '1px solid var(--alert-info-border)',
                }}
            >
                <strong>ℹ️ About Clerk Authentication:</strong><br />
                Clerk provides secure, modern authentication with built-in user management. Your credentials are never stored in this application.
            </div>
        </div>
    );
};

export default LoginPage;