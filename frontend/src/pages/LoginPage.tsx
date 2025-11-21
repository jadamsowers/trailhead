import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
    return (
        <div style={{
            minHeight: 'calc(100vh - 200px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            flexDirection: 'column',
            gap: '30px'
        }}>
            <div style={{
                maxWidth: '450px',
                width: '100%',
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                <h1 style={{
                    marginBottom: '10px',
                    color: '#1976d2'
                }}>
                    Welcome Back
                </h1>
                <p style={{
                    marginBottom: '30px',
                    color: '#666',
                    fontSize: '14px'
                }}>
                    Sign in to manage trips and view signups
                </p>

                <SignIn 
                    routing="path"
                    path="/login"
                    signUpUrl="/sign-up"
                    afterSignInUrl="/admin"
                />
            </div>

            <div style={{
                maxWidth: '450px',
                width: '100%',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#666',
                textAlign: 'center'
            }}>
                <p style={{ marginBottom: '10px' }}>
                    <strong>First time setup?</strong>
                </p>
                <p style={{ marginBottom: '15px' }}>
                    If you're setting up the system for the first time, you'll need to create an initial admin account.
                </p>
                <Link
                    to="/admin-setup"
                    style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                >
                    Initial Admin Setup
                </Link>
            </div>

            <div style={{
                maxWidth: '450px',
                width: '100%',
                padding: '15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#1565c0'
            }}>
                <strong>ℹ️ About Clerk Authentication:</strong><br />
                Clerk provides secure, modern authentication with built-in user management. Your credentials are never stored in this application.
            </div>
        </div>
    );
};

export default LoginPage;