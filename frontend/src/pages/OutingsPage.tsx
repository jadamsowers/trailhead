import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "@stackframe/stack";
import SignupWizard from "../components/Participant/SignupWizard";
import { familyAPI } from "../services/api";

// Removed OUTINGS_CACHE_KEY (offline caching handled elsewhere)

const OutingsPage: React.FC = () => {
  const user = useUser();
  const isSignedIn = !!user;
  const navigate = useNavigate();
  const [checkingFamily, setCheckingFamily] = useState(true);
  const [hasFamilyMembers, setHasFamilyMembers] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkFamilyMembers = async () => {
      if (!isSignedIn) return;
      try {
        const data = await familyAPI.getSummary();
        if (!mounted) return;
        setHasFamilyMembers(data.length > 0);
      } catch (err) {
        console.error("Failed to check family members:", err);
      } finally {
        if (mounted) setCheckingFamily(false);
      }
    };

    checkFamilyMembers();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, user]);

  // Outings fetching removed

  if (checkingFamily && isSignedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="text-xl" style={{ color: "var(--text-secondary)" }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isSignedIn ? (
        <>
        {hasFamilyMembers ? (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* SignupWizard manages its own data; remove unused outings prop */}
            <SignupWizard />
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full glass-card p-10 text-center">
              <h2
                className="text-3xl font-bold font-heading mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Welcome to Outing Signups!
              </h2>
              <p
                className="mb-8 text-lg"
                style={{ color: "var(--text-secondary)" }}
              >
                Before you can sign up for outings, you need to add family
                members to your account.
              </p>
              <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
                Add yourself and any youth or adults who will be participating
                in outings.
              </p>
              <button
                onClick={() => navigate("/family-setup")}
                className="px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full"
                style={{
                  backgroundColor: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                }}
              >
                Add Family Members
              </button>
            </div>
          </div>
        )}
        </>
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh] flex items-center justify-center">
          <div className="max-w-md w-full glass-card p-10 text-center">
            <h1
              className="text-3xl font-bold font-heading mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Sign In Required
            </h1>
            <p
              className="mb-8 text-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              Please sign in or create an account to view and sign up for
              outings.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full px-8 py-4 rounded-lg"
              style={{
                backgroundColor: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
              }}
            >
              Sign In / Sign Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutingsPage;
