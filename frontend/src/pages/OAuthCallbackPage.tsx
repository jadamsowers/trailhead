import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        // The AuthContext will handle the OAuth callback
        // Once authenticated, redirect to appropriate page
        if (!loading) {
            if (isAuthenticated) {
                navigate('/admin', { replace: true });
            } else {
                // If authentication failed, redirect to login
                navigate('/login', { replace: true });
            }
        }
    }, [isAuthenticated, loading, navigate]);

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

