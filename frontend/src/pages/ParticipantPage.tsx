import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Legacy ParticipantPage - redirects to new flow
 * This page is kept for backward compatibility but redirects users to the new outings page
 */
const ParticipantPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to the new outings page
        navigate('/outings', { replace: true });
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Redirecting...
                </h2>
                <p className="text-gray-600">Taking you to the outings page...</p>
            </div>
        </div>
    );
};

export default ParticipantPage;