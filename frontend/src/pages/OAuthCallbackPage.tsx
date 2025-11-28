import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@stackframe/stack";

const OAuthCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const { isSignedIn, isLoaded } = useUser();

    useEffect(() => {
        // Stack Auth handles OAuth callbacks automatically
        // Once loaded, redirect to appropriate page
        if (isLoaded) {
            if (isSignedIn) {
                navigate('/family-setup', { replace: true });
            } else {
                // If authentication failed, redirect to login
                navigate('/login', { replace: true });
            }
        }
    }, [isSignedIn, isLoaded, navigate]);

    return (
        <div style={{
            minHeight: 'calc(100vh - 200px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                textAlign: 'center',
                color: '#666'
            }}>
                <h2>Completing login...</h2>
                <p>Please wait while we complete your authentication.</p>
            </div>
        </div>
    );
};

export default OAuthCallbackPage;

