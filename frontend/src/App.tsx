import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser, SignUp } from '@clerk/clerk-react';
import ProtectedRoute from './components/ProtectedRoute';
import BackendHealthCheck from './components/Shared/BackendHealthCheck';
import TopographicBackground from './components/Shared/TopographicBackground';
import AdminPage from './pages/AdminPage';
import ParticipantPage from './pages/ParticipantPage';
import LoginPage from './pages/LoginPage';
import AdminSetupPage from './pages/AdminSetupPage';
import FamilySetupPage from './pages/FamilySetupPage';
import OutingsPage from './pages/OutingsPage';

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_your_clerk_publishable_key_here';

const HomePage: React.FC = () => {
    const { isSignedIn } = useUser();

    // Redirect signed-in users to family setup or outings
    if (isSignedIn) {
        return <Navigate to="/family-setup" replace />;
    }

    return (
        <div style={{
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center'
        }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#1976d2' }}>
                Scouting Outing Manager
            </h1>
            <p style={{ fontSize: '20px', marginBottom: '40px', color: '#666' }}>
                Manage scout troop outings, signups, and participant information
            </p>
            
            <div style={{
                padding: '30px',
                backgroundColor: '#e3f2fd',
                borderRadius: '12px',
                marginBottom: '40px'
            }}>
                <h2 style={{ color: '#1976d2', marginBottom: '15px' }}>
                    Get Started
                </h2>
                <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>
                    Sign in or create an account to manage your family and sign up for outings
                </p>
                <Link
                    to="/login"
                    style={{
                        display: 'inline-block',
                        padding: '15px 40px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                >
                    Sign In / Sign Up
                </Link>
            </div>

            <div style={{
                marginTop: '60px',
                padding: '30px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
            }}>
                <h3 style={{ marginBottom: '15px' }}>Features</h3>
                <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    textAlign: 'left'
                }}>
                    <li>✓ Multi-participant family signups</li>
                    <li>✓ Dietary restrictions tracking</li>
                    <li>✓ Allergy management</li>
                    <li>✓ Scouting America youth protection compliance</li>
                    <li>✓ Two-deep leadership tracking</li>
                    <li>✓ Transportation capacity planning</li>
                    <li>✓ CSV roster import/export</li>
                    <li>✓ Outing capacity management</li>
                </ul>
            </div>
        </div>
    );
};

const Navigation: React.FC = () => {
    const { user } = useUser();

    return (
        <nav style={{
            backgroundColor: '#1976d2',
            padding: '15px 30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Link
                    to="/"
                    style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }}
                >
                    Scouting Outing Manager
                </Link>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <SignedIn>
                        <Link
                            to="/outings"
                            style={{
                                color: 'white',
                                textDecoration: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Outings
                        </Link>
                        <Link
                            to="/family-setup"
                            style={{
                                color: 'white',
                                textDecoration: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            My Family
                        </Link>
                        <Link
                            to="/admin"
                            style={{
                                color: 'white',
                                textDecoration: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Admin
                        </Link>
                        <span style={{ color: 'white', fontSize: '14px' }}>
                            {user?.primaryEmailAddress?.emailAddress}
                        </span>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                    <SignedOut>
                        <Link
                            to="/login"
                            style={{
                                color: 'white',
                                textDecoration: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                border: '1px solid white',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Sign In
                        </Link>
                    </SignedOut>
                </div>
            </div>
        </nav>
    );
};

const App: React.FC = () => {
    return (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
            <BackendHealthCheck>
                <Router>
                    <TopographicBackground />
                    <div style={{ minHeight: '100vh', position: 'relative' }}>
                        {/* Navigation Bar */}
                        <Navigation />

                        {/* Main Content */}
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/sign-up" element={
                                <div style={{
                                    minHeight: 'calc(100vh - 200px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px'
                                }}>
                                    <SignUp
                                        afterSignUpUrl="/family-setup"
                                        signInUrl="/login"
                                    />
                                </div>
                            } />
                            <Route path="/admin-setup" element={<AdminSetupPage />} />
                            <Route
                                path="/admin"
                                element={<AdminPage />}
                            />
                            <Route path="/family-setup" element={
                                <SignedIn>
                                    <FamilySetupPage />
                                </SignedIn>
                            } />
                            <Route path="/outings" element={<OutingsPage />} />
                            {/* Legacy routes - redirect to new flow */}
                            <Route path="/outings" element={<Navigate to="/outings" replace />} />
                            <Route path="/participant" element={<Navigate to="/outings" replace />} />
                        </Routes>

                    {/* Footer */}
                    <footer style={{
                        backgroundColor: '#333',
                        color: 'white',
                        padding: '20px',
                        textAlign: 'center',
                        marginTop: '60px'
                    }}>
                        <p>Scouting Outing Manager - vibe-coded with ⚜️❤️ by <a href="https://scouthacks.net/">Adam Sowers</a></p>
                        <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
                            API Documentation: <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" style={{ color: '#64b5f6' }}>http://localhost:8000/docs</a>
                        </p>
                    </footer>
                </div>
            </Router>
            </BackendHealthCheck>
        </ClerkProvider>
    );
};

export default App;