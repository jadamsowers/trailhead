// Authentik OIDC authentication configuration
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import BackendHealthCheck from "./components/Shared/BackendHealthCheck";
import { BackgroundSync } from "./components/BackgroundSync";
import { ThemeToggleCompact } from "./components/Shared/ThemeToggle";
import TopoBackground from "./components/Shared/TopoBackground";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";

import FamilySetupPage from "./pages/FamilySetupPage";
import OutingsPage from "./pages/OutingsPage";
import CheckInPage from "./pages/CheckInPage";
import ProfilePage from "./pages/ProfilePage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import InitialSignInWizard from "./components/InitialSignInWizard";
import { InitialSetupGuard } from "./components/InitialSetupGuard";
import { userAPI } from "./services/api";
import type { User } from "./types";

// Offline message component
type OfflineMessageProps = {
  isAdmin?: boolean;
  onAdminClick?: () => void;
};

const OfflineMessage: React.FC<OfflineMessageProps> = ({
  isAdmin,
  onAdminClick,
}) => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-primary)",
      color: "var(--text-on-primary)",
      textAlign: "center",
      padding: "2rem",
    }}
  >
    <img
      src="/icon/icon-large-bordered.png"
      alt="Trailhead Logo"
      style={{ height: "4em", marginBottom: "1em" }}
    />
    <h1 style={{ fontSize: "2.5em", marginBottom: "0.5em" }}>
      You've gone off-trail!
    </h1>
    <p style={{ fontSize: "1.2em", marginBottom: "1.5em" }}>
      Trailhead cannot connect to the internet.
      <br />
      Please reconnect to access all features.
      <br />
      {isAdmin ? (
        <>
          <br />
          As an outing lead or administrator, you can access cached admin
          features.
          <br />
          <button
            onClick={onAdminClick}
            style={{
              marginTop: "1.5em",
              padding: "0.75em 2em",
              fontSize: "1.1em",
              fontWeight: 600,
              borderRadius: "0.5em",
              background: "var(--btn-primary-bg, #1565c0)",
              color: "var(--btn-primary-text, #fff)",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              transition: "background 0.2s",
            }}
          >
            Enter Admin Mode
          </button>
        </>
      ) : (
        <>
          If you are an outing lead or administrator, you may have limited
          access to cached admin features.
        </>
      )}
    </p>
    <span style={{ fontSize: "1em", opacity: 0.7 }}>
      Trailhead works best online, but you can still view some information
      offline.
    </span>
  </div>
);

const HomePage: React.FC = () => {
  const auth = useAuth();
  const isSignedIn = auth.isAuthenticated;

  // Redirect signed-in users to family setup or outings
  if (isSignedIn) {
    return <Navigate to="/family-setup" replace />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
      <h1
        className="text-5xl mb-5 flex items-center justify-center gap-3"
        style={{ color: "var(--color-primary)" }}
      >
        <img
          src="/icon/icon-large-bordered.png"
          alt="Trailhead Logo"
          style={{
            height: "2.5em",
            width: "2.5em",
            display: "inline-block",
            verticalAlign: "middle",
          }}
        />
        Trailhead 🏕️
      </h1>
      <p className="text-xl mb-10" style={{ color: "var(--text-secondary)" }}>
        Manage scout troop outings, signups, and participant information
      </p>

      <div
        className="p-8 rounded-xl mb-10 glass-card"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <h2
          className="mb-4 text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Get Started
        </h2>
        <p
          className="text-base mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          Sign in or create an account to manage your family and sign up for
          outings
        </p>
        <Link
          to="/login"
          className="inline-block px-10 py-4 no-underline rounded-lg text-lg font-bold transition-all hover:-translate-y-1"
          style={{
            backgroundColor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
          }}
        >
          Sign In / Sign Up
        </Link>
      </div>

      <div className="mt-16 p-8 rounded-lg glass-card">
        <h3
          className="mb-4 text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Features
        </h3>
        <ul
          className="list-none p-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 text-left"
          style={{ color: "var(--text-secondary)" }}
        >
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
  const auth = useAuth();
  const isSignedIn = auth.isAuthenticated;
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendUser, setBackendUser] = useState<User | null>(null);

  // Fetch user role from backend
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Wait for auth to be fully loaded and user to be signed in
        if (!isSignedIn) {
          console.log(
            "⏳ Navigation: Waiting for auth to load and user to sign in"
          );
          return;
        }

        console.log("🔄 Navigation: Fetching user role from backend");
        const userData = await userAPI.getCurrentUser();
        setBackendUser(userData);
        console.log("✅ Navigation: User role fetched:", userData.role);
      } catch (error) {
        console.error("❌ Navigation: Failed to fetch user role:", error);
      }
    };

    fetchUserRole();
  }, [auth.user, isSignedIn]);

  const isAdmin = backendUser?.role === "admin";
  const isActive = (path: string) => location.pathname === path;

  // Use theme variable for maximum contrast in both modes
  const navTextStyle = {
    color: "var(--text-on-primary)",
    textShadow: "0 1px 2px rgba(0,0,0,0.15)",
  };
  const navButtonStyle = {
    backgroundColor: "transparent",
    color: "var(--text-on-primary)",
    borderRadius: "0.5rem",
    boxShadow: "none",
    transition: "none",
    fontWeight: 700,
  };
  const getNavLinkStyle = (path: string) => ({
    ...navTextStyle,
    backgroundColor: isActive(path)
      ? "rgba(255, 255, 255, 0.15)"
      : "transparent",
    borderRadius: "0.5rem",
    transition: "background-color 0.2s ease",
  });

  const handleSignOut = () => {
    // Use the app's logout helper which clears the session cookie and local cache
    auth.logout();
  };

  return (
    <nav
      className="shadow-lg sticky top-0 z-[1000] backdrop-blur-md bg-opacity-95 border-b border-white/10"
      style={{
        backgroundColor: "var(--color-primary)",
        color: "var(--text-on-primary)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="no-underline text-xl font-bold font-heading tracking-tight flex items-center gap-4"
              style={navTextStyle}
            >
              <img
                src="/icon/icon-small-bordered.png"
                alt="Trailhead Logo"
                style={{
                  height: "2em",
                  width: "2em",
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              />
              <span>Trailhead</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center">
            {isSignedIn ? (
              <div className="flex items-center w-full gap-4">
                {/* Left side navigation */}
                <div className="flex items-center gap-4">
                  <Link
                    to="/outings"
                    className="px-4 py-3 text-base font-bold flex items-center gap-2 whitespace-nowrap"
                    style={getNavLinkStyle("/outings")}
                  >
                    <span>🏕️</span>
                    <span>Outings</span>
                  </Link>
                  <Link
                    to="/family-setup"
                    className="px-4 py-3 text-base font-bold flex items-center gap-2 whitespace-nowrap"
                    style={getNavLinkStyle("/family-setup")}
                  >
                    <span>👨‍👩‍👧‍👦</span>
                    <span>Family</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="px-4 py-3 text-base font-bold flex items-center gap-2 whitespace-nowrap"
                    style={getNavLinkStyle("/profile")}
                  >
                    <span>👤</span>
                    <span>Profile</span>
                  </Link>
                </div>
                {/* Right side - Admin and utilities */}
                <div className="flex items-center gap-4 ml-auto">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-4 py-3 text-base font-bold flex items-center gap-2 whitespace-nowrap"
                      style={getNavLinkStyle("/admin")}
                    >
                      <span>⚙️</span>
                      <span>Admin</span>
                    </Link>
                  )}
                  <div className="flex items-center gap-3 pl-4 border-l-2 border-white/20 h-10">
                    <ThemeToggleCompact />
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 rounded-lg font-medium text-sm"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: "var(--text-on-primary)",
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } lg:hidden border-t border-white/10`}
        style={{ backgroundColor: "var(--color-primary)" }}
        role="menu"
      >
        <div className="flex flex-col">
          {isSignedIn ? (
            <>
              <Link
                to="/outings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-6 py-4 text-lg font-medium border-b border-white/10 hover:bg-white/5 transition-colors"
                style={{
                  ...navTextStyle,
                  backgroundColor: isActive("/outings")
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                }}
                role="menuitem"
                tabIndex={0}
              >
                <span>🏕️</span>
                <span>Outings</span>
              </Link>
              <Link
                to="/family-setup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-6 py-4 text-lg font-medium border-b border-white/10 hover:bg-white/5 transition-colors"
                style={{
                  ...navTextStyle,
                  backgroundColor: isActive("/family-setup")
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                }}
                role="menuitem"
                tabIndex={0}
              >
                <span>👨‍👩‍👧‍👦</span>
                <span>Family</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-6 py-4 text-lg font-medium border-b border-white/10 hover:bg-white/5 transition-colors"
                style={{
                  ...navTextStyle,
                  backgroundColor: isActive("/profile")
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                }}
                role="menuitem"
                tabIndex={0}
              >
                <span>👤</span>
                <span>Profile</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-6 py-4 text-lg font-medium border-b border-white/10 hover:bg-white/5 transition-colors"
                  style={{
                    ...navTextStyle,
                    backgroundColor: isActive("/admin")
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  }}
                  role="menuitem"
                  tabIndex={0}
                >
                  <span>⚙️</span>
                  <span>Admin</span>
                </Link>
              )}
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 hover:bg-white/5 transition-colors">
                <span
                  style={{
                    color: "var(--text-on-primary)",
                    fontSize: "1rem",
                    fontWeight: 500,
                  }}
                >
                  Theme
                </span>
                <ThemeToggleCompact />
              </div>
              <div className="px-6 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg font-medium text-sm"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "var(--text-on-primary)",
                  }}
                >
                  Sign Out
                </button>
                <span
                  style={{
                    color: "var(--text-on-primary)",
                    fontSize: "0.875rem",
                  }}
                >
                  {(auth.user as any)?.profile?.email || auth.user?.email}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 hover:bg-white/5 transition-colors">
                <span
                  style={{
                    color: "var(--text-on-primary)",
                    fontSize: "1rem",
                    fontWeight: 500,
                  }}
                >
                  Theme
                </span>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cachedUser, setCachedUser] = useState<any>(null);
  const auth = useAuth();

  // Load cached user for offline detection
  useEffect(() => {
    const cached = localStorage.getItem("cached_user");
    console.log("Loading cached user:", cached);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.log("Parsed cached user:", parsed);
        setCachedUser(parsed);
      } catch (e) {
        console.error("Failed to parse cached user:", e);
      }
    }
  }, [isOffline]);

  const isAdmin = cachedUser?.role === "admin";
  console.log("App offline state:", { isOffline, cachedUser, isAdmin });

  useEffect(() => {
    const isDevelopment = import.meta.env.DEV;
    const baseTitle = "Trailhead";
    document.title = isDevelopment ? `[DEV] ${baseTitle}` : baseTitle;
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log("Network: ONLINE");
      setIsOffline(false);
    };
    const handleOffline = () => {
      console.log("Network: OFFLINE");
      setIsOffline(true);
    };

    // Set initial state
    console.log(
      "Initial network state:",
      navigator.onLine ? "ONLINE" : "OFFLINE"
    );
    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle OIDC loading state
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Handle OIDC error state
  if (auth.error) {
    console.error("OIDC error:", auth.error);
  }

  // If offline, show appropriate content
  if (isOffline) {
    console.log("🔴 OFFLINE MODE - Rendering offline UI");
    console.log("   isAdmin:", isAdmin, "cachedUser:", cachedUser);
    return (
      <Router>
        <Routes>
          <Route
            path="/admin"
            element={
              cachedUser && isAdmin ? (
                <>
                  {console.log("✅ Showing AdminPage for cached admin")}
                  <AdminPage />
                </>
              ) : (
                <>
                  {console.log(
                    "❌ Showing OfflineMessage (not admin or no cached user)"
                  )}
                  <OfflineMessage
                    isAdmin={isAdmin}
                    onAdminClick={() => {
                      console.log(
                        "🔘 Admin button clicked, navigating to /admin"
                      );
                      window.location.href = "/admin";
                    }}
                  />
                </>
              )
            }
          />
          <Route
            path="*"
            element={
              <>
                {console.log("📍 Catch-all route - showing OfflineMessage")}
                <OfflineMessage
                  isAdmin={isAdmin}
                  onAdminClick={() => {
                    console.log(
                      "🔘 Admin button clicked, navigating to /admin"
                    );
                    window.location.href = "/admin";
                  }}
                />
              </>
            }
          />
        </Routes>
      </Router>
    );
  }

  console.log("🟢 ONLINE MODE - Rendering normal app");
  return (
    <BackendHealthCheck>
      <Router>
        <div className="min-h-screen relative flex flex-col">
          <TopoBackground />
          {/* Navigation Bar */}
          <Navigation />
          {/* Background Sync (global) */}
          <BackgroundSync />
          {/* Main Content */}
          <main className="flex-grow w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/callback" element={<OAuthCallbackPage />} />

              <Route path="/admin" element={<AdminPage />} />
              <Route
                path="/initial-setup"
                element={
                  <RequireAuth>
                    <InitialSignInWizard />
                  </RequireAuth>
                }
              />
              <Route
                path="/family-setup"
                element={
                  <RequireAuth>
                    <InitialSetupGuard>
                      <FamilySetupPage />
                    </InitialSetupGuard>
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <InitialSetupGuard>
                      <ProfilePage />
                    </InitialSetupGuard>
                  </RequireAuth>
                }
              />
              <Route
                path="/outings"
                element={
                  <InitialSetupGuard>
                    <OutingsPage />
                  </InitialSetupGuard>
                }
              />
              <Route
                path="/check-in/:outingId"
                element={
                  <RequireAuth>
                    <InitialSetupGuard>
                      <CheckInPage />
                    </InitialSetupGuard>
                  </RequireAuth>
                }
              />
            </Routes>
          </main>
          {/* Footer */}
          <footer
            className="py-10 sm:py-16 mt-auto border-t border-white/15"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--text-on-primary)",
            }}
          >
            <div className="max-w-6xl mx-auto px-6 sm:px-8">
              <div className="flex flex-col items-center gap-8 text-center">
                {/* Logo and Title */}
                <div className="flex items-center gap-5">
                  <img
                    src="/icon/icon-large-bordered.png"
                    alt="Trailhead Logo"
                    className="h-14 w-14 sm:h-20 sm:w-20"
                  />
                  <h2
                    className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight leading-none"
                    style={{
                      color: "var(--text-on-primary)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Trailhead
                  </h2>
                </div>

                {/* Tagline */}
                <p
                  className="italic text-xl sm:text-2xl font-light max-w-2xl leading-relaxed"
                  style={{
                    color: "var(--text-on-primary)",
                    opacity: 0.95,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Putting the 'outing' back in 'Scouting'
                </p>

                {/* Credits */}
                <div
                  className="italic text-base sm:text-lg font-light leading-relaxed tracking-wide"
                  style={{
                    color: "var(--text-on-primary)",
                    opacity: 0.9,
                    fontFamily: '"Merriweather", Georgia, serif',
                  }}
                >
                  <a
                    href="https://github.com/jadamsowers/trailhead"
                    className="hover:underline transition-all duration-200 hover:opacity-100 hover:scale-105 inline-block font-semibold"
                    style={{ color: "var(--text-on-primary)" }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Vibe-coded
                  </a>{" "}
                  with
                  <span className="mx-2 text-xl">⚜️</span>
                  <span className="mx-1 text-xl">❤️</span>
                  <span className="mx-2 text-xl">🤖</span>
                  <span className="font-normal">by </span>
                  <a
                    href="https://scouthacks.net/"
                    className="hover:underline transition-all duration-200 hover:opacity-100 hover:scale-105 inline-block font-bold"
                    style={{ color: "var(--text-on-primary)" }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Adam Sowers
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </BackendHealthCheck>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

// Helper component to require authentication
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default App;
