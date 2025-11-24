import React, { useEffect, useState } from 'react';
import { healthAPI } from '../../services/api';

interface BackendHealthCheckProps {
    children: React.ReactNode;
}

const BackendHealthCheck: React.FC<BackendHealthCheckProps> = ({ children }) => {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showBanner, setShowBanner] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    useEffect(() => {
        checkBackendHealth();
        // Check health every 30 seconds
        const interval = setInterval(checkBackendHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkBackendHealth = async () => {
        try {
            await healthAPI.check();
            setIsHealthy(true);
            setErrorMessage('');
        } catch (error) {
            setIsHealthy(false);
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsChecking(false);
        }
    };

    const retryConnection = () => {
        setIsChecking(true);
        checkBackendHealth();
    };

    // Banner for backend connection issues
    const showConnectionBanner = !isChecking && isHealthy === false && showBanner;

    return (
        <>
            {showConnectionBanner && (
                <div style={{
                    backgroundColor: 'var(--alert-error-bg, #fff3f3)',
                    border: '1px solid var(--alert-error-border, #e57373)',
                    color: 'var(--alert-error-text, #b71c1c)',
                    padding: '10px 18px',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    minWidth: 0,
                    maxWidth: 360,
                    width: '90%',
                    zIndex: 2000,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                    opacity: 0.97,
                    fontSize: 14
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18, marginRight: 6 }}>⚠️</span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                            Unable to connect to the backend.
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 8 }}>
                            <button onClick={retryConnection} style={{ color: 'inherit', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, padding: 0 }}>Retry</button>
                        </span>
                        {errorMessage && (
                            <span style={{ fontSize: 12, color: 'var(--alert-error-text)', marginLeft: 10 }}>
                                <strong>Error:</strong> {errorMessage}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowBanner(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--alert-error-text)',
                            fontSize: 18,
                            cursor: 'pointer',
                            marginLeft: 10,
                            padding: 0
                        }}
                        aria-label="Dismiss backend connection error"
                    >
                        ✕
                    </button>
                </div>
            )}
            {children}
        </>
    );
};

export default BackendHealthCheck;