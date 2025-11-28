import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@stackframe/stack";
import { getApiBase } from "../utils/apiBase";

/**
 * InitialSetupGuard
 * Checks if user has completed initial setup (phone, emergency contact)
 * If not, redirects to /initial-setup
 * Excludes certain routes from the check
 */
export const InitialSetupGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const stackUser = useUser();
  const user = stackUser;
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Routes that don't require setup check
  const excludedRoutes = [
    "/initial-setup",
    "/login",
    "/sign-up",
    "/admin-setup",
    "/",
  ];

  useEffect(() => {
    const checkSetup = async () => {
      // Skip check if user not loaded or on excluded route
      if (!isLoaded || !user || excludedRoutes.includes(location.pathname)) {
        setChecking(false);
        return;
      }

      try {
        // Get Clerk session token
        const token = await window.Clerk?.session?.getToken();
        if (!token) {
          setChecking(false);
          return;
        }

        // Check if user has completed initial setup by fetching their profile from Clerk-backed endpoint
        const response = await fetch(`${getApiBase()}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();

          // Use explicit DB flag to determine if initial setup is complete
          const hasCompletedSetup = Boolean(userData.initial_setup_complete);

          if (!hasCompletedSetup) {
            setNeedsSetup(true);
            navigate("/initial-setup", { replace: true });
          }
        }
      } catch (error) {
        console.error("Error checking initial setup status:", error);
      } finally {
        setChecking(false);
      }
    };

    checkSetup();
  }, [isLoaded, user, location.pathname, navigate]);

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
      </div>
    );
  }

  if (needsSetup) {
    return null; // Will redirect to /initial-setup
  }

  return <>{children}</>;
};
