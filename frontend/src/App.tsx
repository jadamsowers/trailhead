import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser, SignUp } from '@clerk/clerk-react';
import ProtectedRoute from './components/ProtectedRoute';
import BackendHealthCheck from './components/Shared/BackendHealthCheck';
import TopographicBackground from './components/Shared/TopographicBackground';
import { ThemeToggleCompact } from './components/Shared/ThemeToggle';
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
            <h1 style={{ fontSize: '48px', marginBottom: '20px', color: 'var(--sa-dark-blue)' }}>
                ⚜️ Scouting Outing Manager 🏕️
            </h1>
            <p style={{ fontSize: '20px', marginBottom: '40px', color: 'var(--text-secondary)' }}>
                Manage scout troop outings, signups, and participant information
            </p>

            <div style={{
                padding: '30px',
                backgroundColor: 'var(--alert-info-bg)',
                borderRadius: '12px',
                marginBottom: '40px',
                border: '1px solid var(--alert-info-border)'
            }}>
                <h2 style={{ color: 'var(--alert-info-text)', marginBottom: '15px' }}>
                    Get Started
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '20px' }}>
                    Sign in or create an account to manage your family and sign up for outings
                </p>
                <Link
                    to="/login"
                    style={{
                        display: 'inline-block',
                        padding: '15px 40px',
                        backgroundColor: 'var(--btn-primary-bg)',
                        color: 'var(--btn-primary-text)',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)'}
                >
                    Sign In / Sign Up
                </Link>
            </div>

            <div style={{
                marginTop: '60px',
                padding: '30px',
                backgroundColor: 'var(--bg-tertiary)',
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navStyles = `
        .nav-container {
            padding: 15px 30px;
        }
        
        .nav-desktop-menu {
            display: flex;
            gap: 20px;
            align-items: center;
        }
        
        .nav-mobile-toggle {
            display: none;
        }
        
        .nav-mobile-menu {
            display: none;
        }
        
        @media (max-width: 768px) {
            .nav-container {
                padding: 12px 20px !important;
            }
            
            .nav-desktop-menu {
                display: none !important;
            }
            
            .nav-mobile-toggle {
                display: block;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 5px;
                line-height: 1;
            }
            
            .nav-mobile-menu {
                display: ${mobileMenuOpen ? 'flex' : 'none'};
                flex-direction: column;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background-color: var(--sa-dark-blue);
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 1000;
            }
            
            .nav-mobile-menu a,
            .nav-mobile-menu > div {
                padding: 12px 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .nav-mobile-menu a:hover {
                background-color: rgba(255,255,255,0.1);
            }
            
            .nav-brand {
                font-size: 18px !important;
            }
            
            .nav-user-email {
                display: none;
            }
        }
        
        @media (max-width: 480px) {
            .nav-container {
                padding: 10px 15px !important;
            }
            
            .nav-mobile-menu a,
            .nav-mobile-menu > div {
                padding: 10px 15px;
            }
            
            .nav-mobile-toggle {
                font-size: 22px;
            }
            
            .nav-brand {
                font-size: 15px !important;
            }
        }
    `;

    return (
        <>
            <style>{navStyles}</style>
            <nav style={{
                backgroundColor: 'var(--sa-dark-blue)',
                boxShadow: 'var(--shadow-md)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                transition: 'background-color var(--transition-base)'
            }}>
                <div className="nav-container" style={{
                    padding: '15px 30px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Link
                        to="/"
                        className="nav-brand"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: '24px',
                            fontWeight: 'bold'
                        }}
                    >
                        ⚜️ Scouting Outing Manager 🏕️
                    </Link>

                    {/* Desktop Menu */}
                    <div className="nav-desktop-menu">
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
                            {/* Theme Toggle */}
                            <ThemeToggleCompact />
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                        <SignedOut>
                            {/* Theme Toggle */}
                            <ThemeToggleCompact />
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

                    {/* Mobile Menu Toggle */}
                    <button
                        className="nav-mobile-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className="nav-mobile-menu">
                    <SignedIn>
                        <Link
                            to="/outings"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                color: 'white',
                                textDecoration: 'none'
                            }}
                        >
                            Outings
                        </Link>
                        <Link
                            to="/family-setup"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                color: 'white',
                                textDecoration: 'none'
                            }}
                        >
                            My Family
                        </Link>
                        <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                color: 'white',
                                textDecoration: 'none'
                            }}
                        >
                            Admin
                        </Link>
                        <div style={{
                            padding: '12px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span style={{ color: 'white', fontSize: '14px' }}>Theme</span>
                            <ThemeToggleCompact />
                        </div>
                        <div style={{
                            color: 'white',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span>{user?.primaryEmailAddress?.emailAddress}</span>
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    </SignedIn>
                    <SignedOut>
                        <div style={{
                            padding: '12px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span style={{ color: 'white', fontSize: '14px' }}>Theme</span>
                            <ThemeToggleCompact />
                        </div>
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                color: 'white',
                                textDecoration: 'none'
                            }}
                        >
                            Sign In
                        </Link>
                    </SignedOut>
                </div>
            </nav>
        </>
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
                            <p>Scouting Outing Manager </p>
                            <p><em>Putting the 'outing' back in 'Scouting'</em></p>
                            <p><a href="https://github.com/jadamsowers/scouting-outing-manager">Vibe-coded</a> with ⚜️❤️ by <a href="https://scouthacks.net/">Adam Sowers</a></p>
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