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
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-5 flex-col gap-8">
            <div className="max-w-md w-full bg-white p-10 rounded-lg shadow-lg text-center">
                <h1 className="font-heading mb-2.5 text-primary-500">
                    Welcome Back
                </h1>
                <p className="mb-8 text-gray-600 text-sm">
                    Sign in to set up your family and sign up for trips
                </p>

                <SignIn
                    afterSignInUrl="/family-setup"
                    signUpUrl="/sign-up"
                />
            </div>

            <div className="max-w-md w-full p-5 bg-gray-100 rounded text-sm text-gray-600 text-center">
                <p className="mb-2.5">
                    <strong>First time setup?</strong>
                </p>
                <p className="mb-4">
                    If you're setting up the system for the first time, you'll need to create an initial admin account.
                </p>
                <Link
                    to="/admin-setup"
                    className="inline-block px-5 py-2.5 bg-primary-500 text-white no-underline rounded text-sm font-bold transition-colors hover:bg-primary-600"
                >
                    Initial Admin Setup
                </Link>
            </div>

            <div className="max-w-md w-full p-4 bg-blue-50 rounded text-xs text-primary-600">
                <strong>ℹ️ About Clerk Authentication:</strong><br />
                Clerk provides secure, modern authentication with built-in user management. Your credentials are never stored in this application.
            </div>
        </div>
    );
};

export default LoginPage;