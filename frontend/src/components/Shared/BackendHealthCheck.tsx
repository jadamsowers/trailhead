import React, { useEffect, useState } from 'react';
import { healthAPI } from '../../services/api';

interface BackendHealthCheckProps {
    children: React.ReactNode;
}

const BackendHealthCheck: React.FC<BackendHealthCheckProps> = ({ children }) => {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string>('');
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

    if (isChecking) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--bg-secondary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '5px solid #e0e0e0',
                        borderTop: '5px solid #1976d2',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }} />
                    <p style={{ color: '#666', fontSize: '18px' }}>Connecting to backend...</p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    if (isHealthy === false) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--bg-secondary)',
                padding: '20px'
            }}>
                <div style={{
                    maxWidth: '600px',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    padding: '40px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '64px',
                        marginBottom: '20px'
                    }}>
                        ⚠️
                    </div>
                    <h1 style={{
                        color: 'var(--alert-error-text)',
                        marginBottom: '20px',
                        fontSize: '28px'
                    }}>
                        Backend Connection Error
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '16px',
                        marginBottom: '30px',
                        lineHeight: '1.6'
                    }}>
                        Unable to connect to the backend server. Please ensure the backend is running and accessible.
                    </p>
                    <div style={{
                        backgroundColor: 'var(--alert-warning-bg)',
                        border: '1px solid var(--alert-warning-border)',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '30px',
                        textAlign: 'left'
                    }}>
                        <h3 style={{ color: '#f57c00', marginBottom: '10px', fontSize: '16px' }}>
                            Troubleshooting Steps:
                        </h3>
                        <ol style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px' }}>
                            <li>Verify the backend server is running on <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-primary)' }}>{apiUrl}</code></li>
                            <li>Check that your <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-primary)' }}>VITE_API_URL</code> environment variable is set correctly</li>
                            <li>Ensure there are no firewall or network issues blocking the connection</li>
                            <li>Review the backend logs for any startup errors</li>
                        </ol>
                    </div>
                    <div style={{
                        backgroundColor: 'var(--alert-error-bg)',
                        border: '1px solid var(--alert-error-border)',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '30px'
                    }}>
                        <p style={{ color: 'var(--alert-error-text)', fontSize: '14px', margin: 0 }}>
                            <strong>Error:</strong> {errorMessage}
                        </p>
                    </div>
                    <button
                        onClick={retryConnection}
                        style={{
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            padding: '12px 32px',
                            borderRadius: '6px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                    >
                        🔄 Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default BackendHealthCheck;