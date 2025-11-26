import React, { useEffect, useState, useCallback } from "react";
import { healthAPI } from "../../services/api";
import BackendErrorOverlay from "./BackendErrorOverlay";

interface BackendHealthCheckProps {
  children: React.ReactNode;
}

const BackendHealthCheck: React.FC<BackendHealthCheckProps> = ({
  children,
}) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  // Overlay always shows if unhealthy

  // Memoize retry to avoid unnecessary re-renders
  const checkBackendHealth = useCallback(async () => {
    try {
      await healthAPI.check();
      setIsHealthy(true);
      setErrorMessage("");
    } catch (error) {
      setIsHealthy(false);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    // No interval here; auto-retry is handled by overlay
    // (removes double retry logic)
    // If you want to keep a periodic check, add it here
    // const interval = setInterval(checkBackendHealth, 30000);
    // return () => clearInterval(interval);
  }, [checkBackendHealth]);

  // Show fullscreen overlay if backend is unhealthy
  if (!isChecking && isHealthy === false) {
    return (
      <>
        <BackendErrorOverlay
          errorMessage={errorMessage}
          onRetry={() => {
            setIsChecking(true);
            checkBackendHealth();
          }}
          retryDelay={5000}
        />
        {children}
      </>
    );
  }
  // Otherwise, just render children
  return <>{children}</>;
};

export default BackendHealthCheck;
