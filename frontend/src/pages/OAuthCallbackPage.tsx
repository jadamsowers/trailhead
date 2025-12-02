import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    // react-oidc-context handles the callback automatically
    // Once authentication is complete, redirect to appropriate page
    if (!auth.loading) {
      if (auth.isAuthenticated) {
        navigate("/family-setup", { replace: true });
      } else if (auth.error) {
        console.error("Authentication error:", auth.error);
        navigate("/login", { replace: true });
      }
    }
  }, [auth.isAuthenticated, auth.loading, auth.error, navigate]);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 200px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "#666",
        }}
      >
        <h2>Completing login...</h2>
        <p>Please wait while we complete your authentication.</p>
        {auth.error && (
          <p style={{ color: "red" }}>Error: {auth.error.message}</p>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
