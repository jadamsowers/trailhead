import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import SignupForm from '../components/Participant/SignupForm';
import { familyAPI } from '../services/api';

const TripsPage: React.FC = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkFamilyMembers();
    }, []);

    const checkFamilyMembers = async () => {
        try {
            const data = await familyAPI.getSummary();
            setHasFamilyMembers(data.length > 0);
            
            // Redirect to family setup if no family members
            if (data.length === 0) {
                navigate('/family-setup');
            }
        } catch (err) {
            console.error('Failed to check family members:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div>
            <SignedIn>
                {hasFamilyMembers ? (
                    <SignupForm />
                ) : (
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Setting up your family...
                            </h2>
                            <p className="text-gray-600">Redirecting to family setup...</p>
                        </div>
                    </div>
                )}
            </SignedIn>
            <SignedOut>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Sign In Required
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Please sign in or create an account to view and sign up for trips.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full"
                        >
                            Sign In / Sign Up
                        </button>
                    </div>
                </div>
            </SignedOut>
        </div>
    );
};

export default TripsPage;