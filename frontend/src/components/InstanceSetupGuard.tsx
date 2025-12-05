import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { organizationAPI } from "../services/api";

/**
 * InstanceSetupGuard
 * Redirects first admin to instance setup wizard if not complete
 * Persists wizard progress in localStorage
 */
export const InstanceSetupGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const user = auth.user;
  const isLoaded = !auth.loading;
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Exclude setup and login routes
  const excludedRoutes = ["/instance-setup", "/login", "/callback", "/"]; 

  useEffect(() => {
    const checkInstanceSetup = async () => {
      if (!isLoaded || !user || excludedRoutes.includes(location.pathname)) {
        setChecking(false);
        return;
      }
      try {
        // Only check for admins
        if (user.role !== "admin") {
          setChecking(false);
          return;
        }
        // Get organization info
        const orgs = await organizationAPI.getAll();
        const org = orgs.organizations[0];
        if (org && !org.is_setup_complete) {
          setNeedsSetup(true);
          navigate("/instance-setup", { replace: true });
        }
      } catch (error) {
        console.error("Error checking instance setup status:", error);
      } finally {
        setChecking(false);
      }
    };
    checkInstanceSetup();
  }, [isLoaded, user, location.pathname, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
      </div>
    );
  }
  if (needsSetup) {
    return null; // Will redirect to /instance-setup
  }
  return <>{children}</>;
};
