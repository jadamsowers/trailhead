import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser, SignUp } from '@clerk/clerk-react';
import ProtectedRoute from './components/ProtectedRoute';
import BackendHealthCheck from './components/Shared/BackendHealthCheck';
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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <h1 className="text-5xl mb-5 text-sa-blue">
                ⚜️ Scouting Outing Manager 🏕️
            </h1>
            <p className="text-xl mb-10 text-secondary">
                Manage scout troop outings, signups, and participant information
            </p>

            <div className="p-8 bg-sa-pale-blue/80 rounded-xl mb-10 border border-sa-pale-blue">
                <h2 className="text-sa-dark-blue mb-4 text-2xl font-bold">
                    Get Started
                </h2>
                <p className="text-secondary text-base mb-5">
                    Sign in or create an account to manage your family and sign up for outings
                </p>
                <Link
                    to="/login"
                    className="inline-block px-10 py-4 bg-primary text-white no-underline rounded-lg text-lg font-bold transition-colors hover:bg-primary-dark"
                >
                    Sign In / Sign Up
                </Link>
            </div>

            <div className="mt-16 p-8 bg-tertiary rounded-lg">
                <h3 className="mb-4 text-2xl font-bold">Features</h3>
                <ul className="list-none p-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 text-left">
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

    return (
        <nav className="bg-[var(--sa-dark-blue)] text-white shadow-lg sticky top-0 z-[1000] backdrop-blur-md bg-opacity-95 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo / Brand */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link
                            to="/"
                            className="text-white no-underline text-xl font-bold font-heading tracking-tight flex items-center gap-4 hover:text-sa-pale-blue transition-colors"
                        >
                            <span className="text-2xl">⚜️</span>
                            <span className="hidden sm:block">Scouting Outing Manager</span>
                            <span className="sm:hidden">SOM</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center">
                        <SignedIn>
                            <div className="flex items-center gap-8 lg:gap-12">
                                <Link
                                    to="/outings"
                                    className="text-gray-100 hover:bg-white/10 hover:text-white px-6 py-4 rounded-lg text-base font-bold transition-all hover:shadow-md"
                                >
                                    Outings
                                </Link>
                                <Link
                                    to="/family-setup"
                                    className="text-gray-100 hover:bg-white/10 hover:text-white px-6 py-4 rounded-lg text-base font-bold transition-all hover:shadow-md"
                                >
                                    My Family
                                </Link>
                                <Link
                                    to="/admin"
                                    className="text-gray-100 hover:bg-white/10 hover:text-white px-6 py-4 rounded-lg text-base font-bold transition-all hover:shadow-md"
                                >
                                    Admin
                                </Link>
                                <div className="flex items-center gap-5 pl-8 border-l-2 border-white/20 h-10">
                                    <ThemeToggleCompact />
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </div>
                        </SignedIn>
                        <SignedOut>
                            <div className="flex items-center gap-6">
                                <ThemeToggleCompact />
                                <Link
                                    to="/login"
                                    className="px-8 py-3 border border-transparent text-base font-bold rounded-lg text-sa-dark-blue bg-white hover:bg-gray-50 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
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
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
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
            <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-[var(--sa-dark-blue)] border-t border-white/10`}>
                <div className="px-4 pt-4 pb-6 space-y-2 sm:px-6">
                    <SignedIn>
                        <Link
                            to="/outings"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-gray-100 hover:bg-white/10 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        >
                            Outings
                        </Link>
                        <Link
                            to="/family-setup"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-gray-100 hover:bg-white/10 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        >
                            My Family
                        </Link>
                        <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-gray-100 hover:bg-white/10 hover:text-white block px-4 py-3 rounded-md text-base font-medium"
                        >
                            Admin
                        </Link>
                        <div className="px-3 py-2 flex items-center justify-between border-t border-white/10 mt-2 pt-3">
                            <span className="text-gray-300 text-sm">Theme</span>
                            <ThemeToggleCompact />
                        </div>
                        <div className="px-3 py-2 flex items-center gap-3">
                            <UserButton afterSignOutUrl="/" />
                            <span className="text-gray-300 text-sm">{user?.primaryEmailAddress?.emailAddress}</span>
                        </div>
                    </SignedIn>
                    <SignedOut>
                        <div className="px-3 py-2 flex items-center justify-between border-b border-white/10 mb-2">
                            <span className="text-gray-300 text-sm">Theme</span>
                            <ThemeToggleCompact />
                        </div>
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-gray-100 hover:bg-white/10 hover:text-white block px-4 py-3 rounded-md text-base font-medium"
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
        const baseTitle = 'Scouting Outing Manager';
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
                                {/* Legacy routes - redirect to new flow */}
                                <Route path="/outings" element={<Navigate to="/outings" replace />} />
                                <Route path="/participant" element={<Navigate to="/outings" replace />} />
                            </Routes>
                        </main>

                        {/* Footer */}
                        <footer className="bg-[var(--sa-dark-blue)] text-white py-8 mt-auto border-t border-white/10">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                                <p className="font-heading font-bold text-lg mb-2">Scouting Outing Manager</p>
                                <p className="text-gray-400 italic mb-4">Putting the 'outing' back in 'Scouting'</p>
                                <p className="text-sm text-gray-400">
                                    <a href="https://github.com/jadamsowers/scouting-outing-manager" className="hover:text-white transition-colors">Vibe-coded</a> with ⚜️❤️ by <a href="https://scouthacks.net/" className="hover:text-white transition-colors">Adam Sowers</a>
                                </p>
                                <p className="text-xs text-gray-500 mt-4">
                                    API Documentation: <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="text-sa-pale-blue hover:underline">http://localhost:8000/docs</a>
                                </p>
                            </div>
                        </footer>
                    </div>
                </Router>
            </BackendHealthCheck>
        </ClerkProvider>
    );
};

export default App;