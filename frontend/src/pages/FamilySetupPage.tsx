import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@stackframe/stack";
import { FamilyManagement } from "../components/Adult/FamilyManagement";
import { familyAPI } from "../services/api";

const FamilySetupPage: React.FC = () => {
  const stackUser = useUser();
  const user = stackUser;
  const isSignedIn = !!stackUser;
  const navigate = useNavigate();
  const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check family members after Stack Auth is loaded AND user is signed in
    if (isLoaded && isSignedIn) {
      // Add a small delay to ensure Stack Auth session is fully initialized
      const timer = setTimeout(() => {
        checkFamilyMembers();
      }, 100);
      return () => clearTimeout(timer);
    } else if (isLoaded && !isSignedIn) {
      // User is not signed in, stop loading
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const checkFamilyMembers = async () => {
    try {
      const data = await familyAPI.getSummary();
      setHasFamilyMembers(data.length > 0);
    } catch (err) {
      console.error("Failed to check family members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate("/outings");
  };

  const handleMemberAdded = () => {
    checkFamilyMembers();
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-5">
        <div className="text-center" style={{ color: "var(--text-secondary)" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header Card */}
        <div className="p-10 rounded-lg mb-8 text-center glass-card">
          <h1
            className="text-3xl font-bold mb-2.5"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome, {user?.firstName || "Adult"}!
          </h1>
          <p
            className="text-base mb-0"
            style={{ color: "var(--text-secondary)" }}
          >
            Let's set up your family members so you can easily sign up for
            outings
          </p>
        </div>

        {/* Instructions Card - Only show if no family members */}
        {!hasFamilyMembers && (
          <div className="bg-[var(--alert-info-bg)] border border-[var(--alert-info-border)] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-[var(--alert-info-text)] mb-4 flex items-center gap-2.5">
              <span className="text-3xl">👨‍👩‍👧‍👦</span>
              Add Your Family Members
            </h2>
            <p className="text-[var(--alert-info-text)] mb-5 text-[15px] leading-relaxed">
              Before you can sign up for outings, please add at least one family
              member (scout or adult). This information will be saved and can be
              reused for future outing signups, saving you time!
            </p>
            <ul className="text-[var(--alert-info-text)] pl-5 m-0 leading-loose">
              <li>Add scouts with their troop information</li>
              <li>Add parents/adults with youth protection training status</li>
              <li>Include dietary restrictions and allergies</li>
              <li>Update information anytime</li>
            </ul>
          </div>
        )}

        {/* Family Management Section */}
        <div className="mb-8">
          <FamilyManagement onMemberAdded={handleMemberAdded} />
        </div>

        {/* Continue Button - Only show if has family members */}
        {hasFamilyMembers && (
          <div className="text-center mb-8">
            <button
              onClick={handleContinue}
              className="px-12 py-4 bg-[var(--btn-success-bg)] text-[var(--btn-success-text)] border-none rounded-lg text-lg font-bold cursor-pointer shadow-md transition-all duration-200 hover:bg-[var(--btn-success-hover)] hover:-translate-y-0.5 hover:shadow-lg"
            >
              Continue to Outing Signups →
            </button>
          </div>
        )}

        {/* Help Text - Only show if no family members */}
        {!hasFamilyMembers && (
          <div className="text-center p-5 rounded-lg text-sm glass-card">
            <p className="m-0" style={{ color: "var(--text-secondary)" }}>
              Once you've added at least one family member, you can continue to
              browse and sign up for outings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilySetupPage;
