import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser, SignUp } from '@clerk/clerk-react';
import BackendHealthCheck from './components/Shared/BackendHealthCheck';
import { ThemeToggleCompact } from './components/Shared/ThemeToggle';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import AdminSetupPage from './pages/AdminSetupPage';
import FamilySetupPage from './pages/FamilySetupPage';
import OutingsPage from './pages/OutingsPage';
import CheckInPage from './pages/CheckInPage';

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_your_clerk_publishable_key_here';

const HomePage: React.FC = () => {
    const { isSignedIn } = useUser();

    // Redirect signed-in users to family setup or outings
    if (isSignedIn) {
        return <Navigate to="/family-setup" replace />;
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <h1 className="text-5xl mb-5 flex items-center justify-center gap-3" style={{ color: 'var(--color-primary)' }}>
                <img src="/icon/icon-large-bordered.png" alt="Trailhead Logo" style={{ height: '2.5em', width: '2.5em', display: 'inline-block', verticalAlign: 'middle' }} />
                Trailhead 🏕️
            </h1>
            <p className="text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>
                Manage scout troop outings, signups, and participant information
            </p>

            <div className="p-8 rounded-xl mb-10 glass-card" style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
            }}>
                <h2 className="mb-4 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Get Started
                </h2>
                <p className="text-base mb-5" style={{ color: 'var(--text-secondary)' }}>
                    Sign in or create an account to manage your family and sign up for outings
                </p>
                <Link
                    to="/login"
                    className="inline-block px-10 py-4 no-underline rounded-lg text-lg font-bold transition-all hover:-translate-y-1"
                    style={{
                        backgroundColor: 'var(--btn-primary-bg)',
                        color: 'var(--btn-primary-text)'
                    }}
                >
                    Sign In / Sign Up
                </Link>
            </div>

            <div className="mt-16 p-8 rounded-lg glass-card">
                <h3 className="mb-4 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Features</h3>
                <ul className="list-none p-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 text-left" style={{ color: 'var(--text-secondary)' }}>
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


    // Use theme variable for maximum contrast in both modes
    const navTextStyle = {
        color: 'var(--text-on-primary)',
        textShadow: '0 1px 2px rgba(0,0,0,0.15)'
    };
    const navButtonStyle = {
        backgroundColor: 'transparent',
        color: 'var(--text-on-primary)',
        borderRadius: '0.5rem',
        boxShadow: 'none',
        transition: 'none',
        fontWeight: 700
    };
    return (
        <nav className="shadow-lg sticky top-0 z-[1000] backdrop-blur-md bg-opacity-95 border-b border-white/10" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--text-on-primary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo / Brand */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link
                            to="/"
                            className="no-underline text-xl font-bold font-heading tracking-tight flex items-center gap-4"
                            style={navTextStyle}
                        >
                            <img src="/icon/icon-small-bordered.png" alt="Trailhead Logo" style={{ height: '2em', width: '2em', display: 'inline-block', verticalAlign: 'middle' }} />
                            <span>Trailhead</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center">
                        <SignedIn>
                            <div className="flex items-center gap-8 lg:gap-12">
                                <Link
                                    to="/outings"
                                    className="px-6 py-4 text-base font-bold"
                                    style={navTextStyle}
                                >
                                    Outings
                                </Link>
                                <Link
                                    to="/family-setup"
                                    className="px-6 py-4 text-base font-bold"
                                    style={navTextStyle}
                                >
                                    My Family
                                </Link>
                                <Link
                                    to="/admin"
                                    className="px-6 py-4 text-base font-bold"
                                    style={navTextStyle}
                                >
                                    Admin
                                </Link>
                                <div className="flex items-center gap-5 pl-8 border-l-2 border-white/20 h-10">
                                    <ThemeToggleCompact />
                                    <UserButton afterSignOutUrl="/" appearance={{ 
                                        elements: { 
                                            avatarBox: { borderRadius: '0.25rem', width: '40px', height: '40px' },
                                            userButtonTrigger: { borderRadius: '0.25rem', width: '40px', height: '40px' }
                                        } 
                                    }} />
                                </div>
                            </div>
                        </SignedIn>
                        <SignedOut>
                            <div className="flex items-center gap-6">
                                <ThemeToggleCompact />
                                <Link
                                    to="/login"
                                    className="px-8 py-3 text-base font-bold"
                                    style={navButtonStyle}
                                >
                                    Sign In
                                </Link>
                            </div>
                        </SignedOut>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center p-2"
                            style={{ ...navButtonStyle, borderRadius: '0.5rem' }}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {mobileMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden border-t border-white/10`} style={{ backgroundColor: 'var(--color-primary)' }} role="menu">
                <div className="flex flex-col">
                    <SignedIn>
                        <Link
                            to="/outings"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-6 py-4 text-lg font-medium border-b border-white/10 hover:bg-white/5 transition-colors"
                            style={navTextStyle}
                            role="menuitem"
                            tabIndex={0}
                        >
                            Outings
                        </Link>
                        <Link
                            to="/family-setup"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-6 py-4 text-lg font-medium border-b border-white/10 hover:bg-white/5 transition-colors"
                            style={navTextStyle}
                            role="menuitem"
                            tabIndex={0}
                        >
                            My Family
                        </Link>
                        <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-6 py-4 text-lg font-medium border-b border-white/10 hover:bg-white/5 transition-colors"
                            style={navTextStyle}
                            role="menuitem"
                            tabIndex={0}
                        >
                            Admin
                        </Link>
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 hover:bg-white/5 transition-colors">
                            <span style={{ color: 'var(--text-on-primary)', fontSize: '1rem', fontWeight: 500 }}>Theme</span>
                            <ThemeToggleCompact />
                        </div>
                        <div className="px-6 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                            <UserButton afterSignOutUrl="/" appearance={{ 
                                elements: { 
                                    avatarBox: { borderRadius: '0.25rem', width: '40px', height: '40px' },
                                    userButtonTrigger: { borderRadius: '0.25rem', width: '40px', height: '40px' }
                                } 
                            }} />
                            <span style={{ color: 'var(--text-on-primary)', fontSize: '0.875rem' }}>{user?.primaryEmailAddress?.emailAddress}</span>
                        </div>
                    </SignedIn>
                    <SignedOut>
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 hover:bg-white/5 transition-colors">
                            <span style={{ color: 'var(--text-on-primary)', fontSize: '1rem', fontWeight: 500 }}>Theme</span>
                            <ThemeToggleCompact />
                        </div>
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-6 py-4 text-lg font-medium hover:bg-white/5 transition-colors"
                            style={navTextStyle}
                            role="menuitem"
                            tabIndex={0}
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
    // Set window title with [DEV] prefix in development mode
    useEffect(() => {
        const isDevelopment = import.meta.env.DEV;
        const baseTitle = 'Trailhead';
        document.title = isDevelopment ? `[DEV] ${baseTitle}` : baseTitle;
    }, []);

    return (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
            <BackendHealthCheck>
                <Router>
                    <div className="min-h-screen relative flex flex-col">
                        {/* Navigation Bar */}
                        <Navigation />

                        {/* Main Content */}
                        <main className="flex-grow w-full">
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/sign-up" element={
                                    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-5">
                                        <div className="glass-panel p-8 rounded-xl w-full max-w-md">
                                            <SignUp
                                                afterSignUpUrl="/family-setup"
                                                signInUrl="/login"
                                            />
                                        </div>
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
                                <Route path="/check-in/:outingId" element={
                                    <SignedIn>
                                        <CheckInPage />
                                    </SignedIn>
                                } />

                            </Routes>
                        </main>

                        {/* Footer */}
                        <footer className="py-4 sm:py-8 mt-auto border-t border-white/10" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--text-on-primary)' }}>
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                                <div className="flex items-center justify-center gap-3 flex-wrap">
                                    <img src="/icon/icon-small-bordered.png" alt="Trailhead Logo" style={{ height: '2em', width: '2em' }} className="sm:!h-10 sm:!w-10" />
                                    <span className="font-heading font-bold text-xl sm:text-2xl" style={{ color: 'var(--text-on-primary)' }}>Trailhead</span>
                                    <span className="text-lg sm:text-xl" style={{ color: 'var(--text-on-primary)', opacity: 0.85 }}>•</span>
                                    <span className="italic text-base sm:text-lg" style={{ color: 'var(--text-on-primary)', opacity: 0.85 }}>Putting the 'outing' back in 'Scouting'</span>
                                    <span className="text-lg sm:text-xl" style={{ color: 'var(--text-on-primary)', opacity: 0.85 }}>•</span>
                                    <span className="text-sm sm:text-base" style={{ color: 'var(--text-on-primary)', opacity: 0.85 }}>
                                        <a href="https://github.com/jadamsowers/trailhead" className="hover:underline" style={{ color: 'var(--text-on-primary)' }}>Vibe-coded</a> with ⚜️❤️ by <a href="https://scouthacks.net/" className="hover:underline" style={{ color: 'var(--text-on-primary)' }}>Adam Sowers</a>
                                    </span>
                                </div>
                            </div>
                        </footer>
                    </div>
                </Router>
            </BackendHealthCheck>
        </ClerkProvider>
    );
};

export default App;