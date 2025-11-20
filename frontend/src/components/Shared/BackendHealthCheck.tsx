import React, { useEffect, useState } from 'react';
import { healthAPI } from '../../services/api';

interface BackendHealthCheckProps {
    children: React.ReactNode;
}

const BackendHealthCheck: React.FC<BackendHealthCheckProps> = ({ children }) => {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string>('');

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
                backgroundColor: '#fafafa'
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
                backgroundColor: '#fafafa',
                padding: '20px'
            }}>
                <div style={{
                    maxWidth: '600px',
                    backgroundColor: 'white',
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
                        color: '#d32f2f',
                        marginBottom: '20px',
                        fontSize: '28px'
                    }}>
                        Backend Connection Error
                    </h1>
                    <p style={{
                        color: '#666',
                        fontSize: '16px',
                        marginBottom: '30px',
                        lineHeight: '1.6'
                    }}>
                        Unable to connect to the backend server. Please ensure the backend is running and accessible.
                    </p>
                    <div style={{
                        backgroundColor: '#fff3e0',
                        border: '1px solid #ffb74d',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '30px',
                        textAlign: 'left'
                    }}>
                        <h3 style={{ color: '#f57c00', marginBottom: '10px', fontSize: '16px' }}>
                            Troubleshooting Steps:
                        </h3>
                        <ol style={{ color: '#666', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px' }}>
                            <li>Verify the backend server is running on <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>http://localhost:8000</code></li>
                            <li>Check that your <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>VITE_API_URL</code> environment variable is set correctly</li>
                            <li>Ensure there are no firewall or network issues blocking the connection</li>
                            <li>Review the backend logs for any startup errors</li>
                        </ol>
                    </div>
                    <div style={{
                        backgroundColor: '#ffebee',
                        border: '1px solid #ef5350',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '30px'
                    }}>
                        <p style={{ color: '#c62828', fontSize: '14px', margin: 0 }}>
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