import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import ParticipantPage from './pages/ParticipantPage';
import LoginPage from './pages/LoginPage';

const HomePage: React.FC = () => {
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
                Manage scout troop trips, signups, and participant information
            </p>
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                marginTop: '40px'
            }}>
                <Link 
                    to="/participant" 
                    style={{ 
                        textDecoration: 'none',
                        padding: '40px',
                        border: '2px solid #1976d2',
                        borderRadius: '12px',
                        backgroundColor: '#e3f2fd',
                        transition: 'transform 0.2s',
                        display: 'block'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <h2 style={{ color: '#1976d2', marginBottom: '15px' }}>
                        📝 Sign Up for a Trip
                    </h2>
                    <p style={{ color: '#666', fontSize: '16px' }}>
                        Register your scouts and family members for upcoming trips
                    </p>
                </Link>

                <Link 
                    to="/admin" 
                    style={{ 
                        textDecoration: 'none',
                        padding: '40px',
                        border: '2px solid #f57c00',
                        borderRadius: '12px',
                        backgroundColor: '#fff3e0',
                        transition: 'transform 0.2s',
                        display: 'block'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <h2 style={{ color: '#f57c00', marginBottom: '15px' }}>
                        🔧 Administrator
                    </h2>
                    <p style={{ color: '#666', fontSize: '16px' }}>
                        Create trips, view signups, and manage trip details
                    </p>
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
                    <li>✓ Trip capacity management</li>
                </ul>
            </div>
        </div>
    );
};

const Navigation: React.FC = () => {
    const { isAuthenticated, logout, user } = useAuth();

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
                    <Link
                        to="/participant"
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
                        Sign Up
                    </Link>
                    {isAuthenticated ? (
                        <>
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
                                {user?.email}
                            </span>
                            <button
                                onClick={logout}
                                style={{
                                    color: 'white',
                                    backgroundColor: 'transparent',
                                    border: '1px solid white',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
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
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
                    {/* Navigation Bar */}
                    <Navigation />

                    {/* Main Content */}
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requireAdmin>
                                    <AdminPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/participant" element={<ParticipantPage />} />
                    </Routes>

                {/* Footer */}
                <footer style={{ 
                    backgroundColor: '#333', 
                    color: 'white',
                    padding: '20px',
                    textAlign: 'center',
                    marginTop: '60px'
                }}>
                    <p>Scouting Outing Manager - Built for Scouting America Troops</p>
                    <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
                        API Documentation: <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" style={{ color: '#64b5f6' }}>http://localhost:8000/docs</a>
                    </p>
                </footer>
            </div>
        </Router>
        </AuthProvider>
    );
};

export default App;