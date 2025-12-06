import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const auth = useAuth();
  const isSignedIn = auth.isAuthenticated;
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to family setup if user is signed in
    if (isSignedIn) {
      navigate("/family-setup");
    }
  }, [isSignedIn, navigate]);

  const handleSignIn = () => {
    // Redirect to backend login flow which initiates OIDC
    auth.loginWithOAuth();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-200px)] flex items-center justify-center flex-col gap-8">
      <div
        className="max-w-md w-full p-10 rounded-lg shadow-lg text-center"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-light)",
        }}
      >
        <h1
          className="font-heading mb-2.5"
          style={{ color: "var(--color-primary)" }}
        >
          Welcome to Trailhead!
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>
          Sign in to set up your family and sign up for outings
        </p>

        <div className="flex justify-center">
          <button
            onClick={handleSignIn}
            className="px-8 py-4 rounded-lg text-lg font-bold transition-all hover:-translate-y-1"
            style={{
              backgroundColor: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
            }}
          >
            Sign In with Authentik
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
