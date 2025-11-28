import React, { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { Outing } from "../../types";
import { OutingIconDisplay } from "../OutingIconDisplay";
import { signupAPI, userAPI, APIError } from "../../services/api";
import {
  formatPhoneNumber,
  validatePhoneWithMessage,
} from "../../utils/phoneUtils";
import {
  useAvailableOutings,
  useFamilySummary,
  useMySignups,
  invalidateOutings,
  invalidateSignups,
  invalidateFamilyData,
} from "../../hooks/useSWR";
import { RequirementsService } from "../../client/services/RequirementsService";
import { calculateAge } from "../../utils/ageInference";
import type { OutingRequirementResponse } from "../../client/models/OutingRequirementResponse";
import type { OutingMeritBadgeResponse } from "../../client/models/OutingMeritBadgeResponse";

type WizardStep =
  | "select-trip"
  | "contact-info"
  | "select-adults"
  | "select-scouts"
  | "review";

// Add responsive styles
// Styles removed in favor of Tailwind classes

const SignupWizard: React.FC = () => {
  const { user, isSignedIn } = useUser();

  // Helper function to format date, omitting year if it's the current year
  const formatOutingDate = (dateString: string): string => {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();

    if (dateYear === currentYear) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("select-trip");
  const [selectedOuting, setSelectedOuting] = useState<Outing | null>(null);
  const [editingSignupId, setEditingSignupId] = useState<string | null>(null);

  // Use SWR hooks for data fetching with automatic caching
  const {
    outings: rawOutings = [],
    isLoading: outingsLoading,
    error: outingsError,
  } = useAvailableOutings();
  const {
    signups: mySignups = [],
    isLoading: signupsLoading,
    error: signupsError,
  } = useMySignups();
  const {
    familyMembers = [],
    isLoading: familyLoading,
    error: familyError,
  } = useFamilySummary(selectedOuting?.id);

  // Sort outings by date (earliest first)
  const outings = [...rawOutings].sort(
    (a, b) =>
      new Date(a.outing_date).getTime() - new Date(b.outing_date).getTime()
  );

  // Derived state
  const mySignupOutingIds = new Set(mySignups.map((s) => s.outing_id));
  const [expandedSignupId, setExpandedSignupId] = useState<string>("");
  const [selectedAdultIds, setSelectedAdultIds] = useState<string[]>([]);
  const [selectedScoutIds, setSelectedScoutIds] = useState<string[]>([]);

  // Contact info state
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [cancelingSignupId, setCancelingSignupId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Collapsible sections state
  const [collapsedLogistics, setCollapsedLogistics] = useState<{
    [outingId: string]: boolean;
  }>({});
  const [collapsedGear, setCollapsedGear] = useState<{
    [outingId: string]: boolean;
  }>({});
  const [collapsedRequirements, setCollapsedRequirements] = useState<{
    [outingId: string]: boolean;
  }>({});

  // Requirements and merit badges data
  const [outingRequirements, setOutingRequirements] = useState<{
    [outingId: string]: OutingRequirementResponse[];
  }>({});
  const [outingMeritBadges, setOutingMeritBadges] = useState<{
    [outingId: string]: OutingMeritBadgeResponse[];
  }>({});
  const [loadingRequirements, setLoadingRequirements] = useState<{
    [outingId: string]: boolean;
  }>({});

  // Load user contact info on mount
  useEffect(() => {
    if (isSignedIn) {
      loadUserContactInfo();
    }
  }, [isSignedIn, user]);

  // Log data loading status for diagnostics
  useEffect(() => {
    if (outingsLoading) {
      console.log("🔄 Loading outings...");
    } else if (outingsError) {
      console.error("❌ Error loading outings:", outingsError);
    } else if (outings) {
      console.log("✅ Outings loaded:", { count: outings.length });
    }
  }, [outings, outingsLoading, outingsError]);

  useEffect(() => {
    if (signupsLoading) {
      console.log("🔄 Loading my signups...");
    } else if (signupsError) {
      console.error("❌ Error loading signups:", signupsError);
    } else if (mySignups) {
      console.log("✅ My signups loaded:", { count: mySignups.length });
    }
  }, [mySignups, signupsLoading, signupsError]);

  useEffect(() => {
    if (familyLoading) {
      console.log("🔄 Loading family members...");
    } else if (familyError) {
      console.error("❌ Error loading family members:", familyError);
    } else if (familyMembers) {
      console.log("✅ Family members loaded:", { count: familyMembers.length });
    }
  }, [familyMembers, familyLoading, familyError]);

  const loadUserContactInfo = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      console.log("Loaded user data:", userData);
      setContactInfo({
        email: user?.primaryEmailAddress?.emailAddress || "",
        phone: userData.phone ?? "",
        emergency_contact_name: userData.emergency_contact_name ?? "",
        emergency_contact_phone: userData.emergency_contact_phone ?? "",
      });
    } catch (err) {
      console.error("Failed to load user contact info:", err);
      // Fallback to email from Clerk
      if (user?.primaryEmailAddress?.emailAddress) {
        setContactInfo((prev) => ({
          ...prev,
          email: user.primaryEmailAddress?.emailAddress || prev.email,
        }));
      }
    }
  };

  const loadOutingRequirementsAndBadges = async (outingId: string) => {
    // Don't load if already loading or already loaded
    if (loadingRequirements[outingId] || outingRequirements[outingId]) {
      return;
    }

    try {
      setLoadingRequirements((prev) => ({ ...prev, [outingId]: true }));

      const [requirements, meritBadges] = await Promise.all([
        RequirementsService.listOutingRequirementsApiRequirementsOutingsOutingIdRequirementsGet(
          outingId
        ),
        RequirementsService.listOutingMeritBadgesApiRequirementsOutingsOutingIdMeritBadgesGet(
          outingId
        ),
      ]);

      setOutingRequirements((prev) => ({ ...prev, [outingId]: requirements }));
      setOutingMeritBadges((prev) => ({ ...prev, [outingId]: meritBadges }));
    } catch (err) {
      console.error("Failed to load requirements/badges for outing:", err);
    } finally {
      setLoadingRequirements((prev) => ({ ...prev, [outingId]: false }));
    }
  };

  const handleCancelSignup = async (signupId: string, outingName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel your signup for "${outingName}" ? This action cannot be undone.`
      )
    ) {
      return;
    }

    // Check cancellation deadline
    const signup = mySignups.find((s) => s.id === signupId);
    if (signup) {
      const outing = outings.find((o) => o.id === signup.outing_id);
      if (outing && outing.cancellation_deadline) {
        const deadline = new Date(outing.cancellation_deadline);
        const now = new Date();
        if (now > deadline) {
          alert(
            `The cancellation deadline for this outing was ${deadline.toLocaleDateString()}. Please contact the outing lead or Scoutmaster to cancel.`
          );
          return;
        }
      }
    }

    try {
      setCancelingSignupId(signupId);
      setError(null);
      console.log("🗑️ Canceling signup:", signupId);
      await signupAPI.cancelSignup(signupId);
      console.log("✅ Signup canceled, invalidating caches...");
      // Invalidate caches to trigger refetch
      await Promise.all([invalidateSignups(), invalidateOutings()]);
      setExpandedSignupId("");
    } catch (err) {
      console.error("❌ Failed to cancel signup:", err);
      setError(
        err instanceof APIError ? err.message : "Failed to cancel signup"
      );
    } finally {
      setCancelingSignupId(null);
    }
  };

  const calculateAvailableSeats = (): number => {
    if (!selectedOuting || selectedOuting.capacity_type !== "vehicle") {
      return selectedOuting?.available_spots || 0;
    }

    const selectedAdults = familyMembers.filter(
      (fm) => selectedAdultIds.includes(fm.id) && fm.member_type === "adult"
    );

    const additionalSeats = selectedAdults.reduce(
      (sum, adult) => sum + (adult.vehicle_capacity || 0),
      0
    );

    const totalParticipants = selectedAdultIds.length + selectedScoutIds.length;

    return (
      (selectedOuting.available_spots || 0) +
      additionalSeats -
      totalParticipants
    );
  };

  const goToNextStep = () => {
    setError(null);

    if (currentStep === "select-trip") {
      if (!selectedOuting) {
        setError("Please select a trip");
        return;
      }
      setCurrentStep("contact-info");
    } else if (currentStep === "contact-info") {
      if (!validateContactInfo()) return;
      setCurrentStep("select-adults");
    } else if (currentStep === "select-adults") {
      setCurrentStep("select-scouts");
    } else if (currentStep === "select-scouts") {
      if (selectedAdultIds.length === 0 && selectedScoutIds.length === 0) {
        setError("Please select at least one participant");
        return;
      }
      setCurrentStep("review");
    }
  };

  const goToPreviousStep = () => {
    setError(null);

    if (currentStep === "contact-info") {
      setCurrentStep("select-trip");
    } else if (currentStep === "select-adults") {
      setCurrentStep("contact-info");
    } else if (currentStep === "select-scouts") {
      setCurrentStep("select-adults");
    } else if (currentStep === "review") {
      setCurrentStep("select-scouts");
    }
  };

  const validateContactInfo = (): boolean => {
    if (!contactInfo.email) {
      setError("Email is required");
      return false;
    }

    // Validate phone numbers with detailed messages
    const phoneError = validatePhoneWithMessage(
      contactInfo.phone,
      "Phone number"
    );
    if (phoneError) {
      setError(phoneError);
      return false;
    }

    if (!contactInfo.emergency_contact_name) {
      setError("Emergency contact name is required");
      return false;
    }

    const emergencyPhoneError = validatePhoneWithMessage(
      contactInfo.emergency_contact_phone,
      "Emergency contact phone"
    );
    if (emergencyPhoneError) {
      setError(emergencyPhoneError);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedOuting) return;

    const allSelectedIds = [...selectedAdultIds, ...selectedScoutIds];
    if (allSelectedIds.length === 0) {
      setError("Please select at least one participant");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("💾 Saving contact info as default...");
      // Save contact info as user's default for future signups
      try {
        await userAPI.updateContactInfo({
          phone: contactInfo.phone,
          emergency_contact_name: contactInfo.emergency_contact_name,
          emergency_contact_phone: contactInfo.emergency_contact_phone,
        });
        console.log("✅ Contact info saved");
      } catch (err) {
        console.error("⚠️ Failed to save contact info as default:", err);
        // Continue with signup even if saving defaults fails
      }

      const signupData = {
        family_contact: {
          email: contactInfo.email,
          phone: contactInfo.phone,
          emergency_contact_name: contactInfo.emergency_contact_name,
          emergency_contact_phone: contactInfo.emergency_contact_phone,
        },
        family_member_ids: allSelectedIds,
      };

      let response;
      if (editingSignupId) {
        console.log("✏️ Updating signup:", editingSignupId);
        // Update existing signup
        response = await signupAPI.updateSignup(editingSignupId, signupData);
        console.log("✅ Signup updated");
        setSuccess(true);
        setWarnings([]);
      } else {
        console.log("➕ Creating new signup for outing:", selectedOuting.id);
        // Create new signup
        response = await signupAPI.create({
          outing_id: selectedOuting.id,
          ...signupData,
        });
        console.log("✅ Signup created");
        setSuccess(true);
        setWarnings(response.warnings || []);
      }

      console.log("🔄 Invalidating caches...");
      // Invalidate caches to trigger refetch
      await Promise.all([
        invalidateSignups(),
        invalidateOutings(),
        invalidateFamilyData(),
      ]);

      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (err) {
      console.error("❌ Failed to submit signup:", err);
      setError(
        err instanceof APIError
          ? err.message
          : `Failed to ${editingSignupId ? "update" : "submit"} signup`
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep("select-trip");
    setSelectedOuting(null);
    setSelectedAdultIds([]);
    setSelectedScoutIds([]);
    setEditingSignupId(null);
    setContactInfo({
      email: user?.primaryEmailAddress?.emailAddress || "",
      phone: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    });
    setSuccess(false);
    setWarnings([]);
    setError(null);
  };

  const handleCancelWizard = () => {
    if (currentStep === "select-trip") {
      // Already at the start, nothing to cancel
      return;
    }

    const hasChanges =
      selectedOuting !== null ||
      selectedAdultIds.length > 0 ||
      selectedScoutIds.length > 0 ||
      editingSignupId !== null;

    if (hasChanges) {
      const confirmMessage = editingSignupId
        ? "Are you sure you want to cancel editing this signup? Your changes will be lost."
        : "Are you sure you want to cancel this signup? Your progress will be lost.";

      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    // Reset form and reload user contact info
    resetForm();
    loadUserContactInfo();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="w-full">
        <h1
          className="text-3xl font-bold font-heading mb-6"
          style={{ color: "var(--text-primary)" }}
        >
          {editingSignupId ? "✏️ Edit Signup" : "Outing Signup"}
        </h1>

        {editingSignupId && (
          <div
            className="p-4 mb-5 rounded-lg border-2"
            style={{
              backgroundColor: "var(--alert-info-bg)",
              color: "var(--alert-info-text)",
              borderColor: "var(--alert-info-border)",
            }}
          >
            <strong>Editing Mode:</strong> You're editing your signup for{" "}
            {selectedOuting?.name}. Make your changes and submit to update.
          </div>
        )}

        {success && (
          <>
            <div
              className="p-4 mb-5 rounded-lg font-bold border"
              style={{
                backgroundColor: "var(--alert-success-bg)",
                color: "var(--alert-success-text)",
                borderColor: "var(--alert-success-border)",
              }}
            >
              ✓ Signup {editingSignupId ? "updated" : "submitted"} successfully!
            </div>

            {warnings.length > 0 && (
              <div
                className="p-4 mb-5 rounded-lg border"
                style={{
                  backgroundColor: "var(--alert-warning-bg)",
                  color: "var(--alert-warning-text)",
                  borderColor: "var(--alert-warning-border)",
                }}
              >
                <strong>Important Reminders:</strong>
                {warnings.map((warning, index) => (
                  <div key={index} className="mt-2">
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {error && (
          <div
            className="p-4 mb-5 rounded-lg border"
            style={{
              backgroundColor: "var(--alert-error-bg)",
              color: "var(--alert-error-text)",
              borderColor: "var(--alert-error-border)",
            }}
          >
            {error}
          </div>
        )}

        {/* Progress Indicator - Only show after trip selection */}
        {currentStep !== "select-trip" && (
          <div
            className="mb-8 p-5 rounded-xl border"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-light)",
            }}
          >
            <div className="flex justify-between items-center">
              {[
                { key: "contact-info", label: "Contact", number: 1 },
                { key: "select-adults", label: "Adults", number: 2 },
                { key: "select-scouts", label: "Scouts", number: 3 },
                { key: "review", label: "Review", number: 4 },
              ].map((step, index, arr) => {
                const stepIndex = arr.findIndex((s) => s.key === currentStep);
                const isComplete = index < stepIndex;
                const isCurrent = step.key === currentStep;

                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors duration-300 shadow-md"
                        style={{
                          backgroundColor:
                            isComplete || isCurrent
                              ? "var(--color-primary)"
                              : "var(--bg-tertiary)",
                          color:
                            isComplete || isCurrent
                              ? "var(--text-on-primary)"
                              : "var(--text-muted)",
                        }}
                      >
                        {isComplete ? "✓" : step.number}
                      </div>
                      <div
                        className="text-xs text-center transition-colors duration-300"
                        style={{
                          fontWeight: isCurrent ? "bold" : "normal",
                          color:
                            isCurrent || isComplete
                              ? "var(--color-primary)"
                              : "var(--text-muted)",
                        }}
                      >
                        {step.label}
                      </div>
                    </div>
                    {index < arr.length - 1 && (
                      <div
                        className="flex-1 h-0.5 mb-6 transition-colors duration-300"
                        style={{
                          backgroundColor: isComplete
                            ? "var(--color-primary)"
                            : "var(--border-light)",
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* My Signups Section - Show before trip selection */}
        {mySignups.length > 0 && currentStep === "select-trip" && (
          <div className="mb-10 glass-panel p-8">
            <h2
              className="mb-4 text-2xl font-semibold"
              style={{ color: "var(--color-success)" }}
            >
              ✓ My Signups ({mySignups.length})
            </h2>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              Outings you're already signed up for. Click to view details or
              cancel.
            </p>
            <div className="grid gap-4">
              {mySignups.map((signup) => {
                const outing = outings.find((o) => o.id === signup.outing_id);
                if (!outing) return null;

                const isExpanded = expandedSignupId === signup.id;
                const isCanceling = cancelingSignupId === signup.id;

                return (
                  <div
                    key={signup.id}
                    className="rounded-lg overflow-hidden transition-all duration-200"
                    style={{
                      border: isExpanded
                        ? "2px solid var(--border-success)"
                        : "1px solid var(--border-success)",
                      backgroundColor: "var(--card-success-bg)",
                      boxShadow: isExpanded
                        ? "var(--card-hover-shadow)"
                        : "none",
                    }}
                  >
                    <div
                      onClick={() =>
                        setExpandedSignupId(isExpanded ? "" : signup.id)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedSignupId(isExpanded ? "" : signup.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      className="p-5 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      style={{
                        backgroundColor: isExpanded
                          ? "var(--card-success-bg)"
                          : "transparent",
                      }}
                      onMouseEnter={(e) =>
                        !isExpanded &&
                        (e.currentTarget.style.backgroundColor =
                          "var(--bg-tertiary)")
                      }
                      onMouseLeave={(e) =>
                        !isExpanded &&
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                            <OutingIconDisplay icon={outing.icon} />
                            <span
                              className="text-lg font-bold whitespace-nowrap"
                              style={{ color: "var(--color-success)" }}
                            >
                              📅 {formatOutingDate(outing.outing_date)}
                              {outing.end_date &&
                                ` - ${formatOutingDate(outing.end_date)} `}
                            </span>
                            <h3
                              className="m-0 font-bold text-lg"
                              style={{ color: "var(--color-success)" }}
                            >
                              ✓ {outing.name}
                            </h3>
                          </div>
                          <div className="mt-2">
                            <strong style={{ color: "var(--text-primary)" }}>
                              Participants ({signup.participant_count}):
                            </strong>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {signup.participants.map((participant) => (
                                <span
                                  key={participant.id}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border shadow-sm"
                                  style={{
                                    backgroundColor: "var(--card-bg)",
                                    color: "var(--color-success)",
                                    borderColor: "var(--border-success)",
                                  }}
                                >
                                  {participant.is_adult ? "🌲" : "🌱"}{" "}
                                  {participant.name}
                                  {participant.vehicle_capacity > 0 && (
                                    <span
                                      className="ml-1 font-bold"
                                      style={{ color: "var(--color-info)" }}
                                    >
                                      🚗: {participant.vehicle_capacity}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span
                          className="text-xl ml-4"
                          style={{ color: "var(--color-success)" }}
                        >
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                      {outing.cancellation_deadline &&
                        new Date(outing.cancellation_deadline) < new Date() && (
                          <div className="mt-2 text-sm text-amber-600 font-medium">
                            ⚠️ Cancellation deadline passed. Please contact the
                            outing lead or Scoutmaster for cancellation
                            requests.
                          </div>
                        )}
                    </div>

                    {isExpanded && (
                      <div
                        className="p-5 border-t-2"
                        style={{
                          backgroundColor: "var(--card-bg)",
                          borderColor: "var(--border-success)",
                        }}
                      >
                        <div className="mb-5">
                          <h4
                            className="mb-2 font-bold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Outing Details
                          </h4>
                          <p
                            className="my-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <strong>Location:</strong> {outing.location}
                          </p>
                          {outing.description && (
                            <p
                              className="my-2"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {outing.description}
                            </p>
                          )}
                        </div>

                        <div className="mb-5">
                          <h4
                            className="mb-2 font-bold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Your Participants
                          </h4>
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                            {signup.participants.map((participant) => (
                              <div
                                key={participant.id}
                                className="p-3 rounded-lg border"
                                style={{
                                  backgroundColor: "var(--bg-tertiary)",
                                  borderColor: "var(--border-light)",
                                }}
                              >
                                <p
                                  className="m-0 mb-1 font-bold"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {participant.name}
                                </p>
                                <p
                                  className="my-1 text-sm"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {participant.is_adult
                                    ? "🌲 Adult"
                                    : "🌱 Scout"}
                                </p>
                                {participant.troop_number && (
                                  <p
                                    className="my-1 text-sm"
                                    style={{ color: "var(--text-secondary)" }}
                                  >
                                    Troop {participant.troop_number}
                                  </p>
                                )}
                                {participant.vehicle_capacity > 0 && (
                                  <p
                                    className="my-1 text-sm font-bold"
                                    style={{ color: "var(--color-info)" }}
                                  >
                                    🚗 {participant.vehicle_capacity} seats
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div
                          className="mb-5 p-3 rounded-lg border"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            borderColor: "var(--border-light)",
                          }}
                        >
                          <h4
                            className="mb-2 text-sm font-bold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Contact Information
                          </h4>
                          <p
                            className="my-1 text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <strong>Email:</strong>{" "}
                            {signup.family_contact_email}
                          </p>
                          <p
                            className="my-1 text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <strong>Phone:</strong>{" "}
                            {signup.family_contact_phone}
                          </p>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Set up edit mode
                              setEditingSignupId(signup.id);
                              setSelectedOuting(outing);
                              setContactInfo({
                                email: signup.family_contact_email,
                                phone: signup.family_contact_phone,
                                emergency_contact_name:
                                  signup.family_contact_name,
                                emergency_contact_phone:
                                  signup.family_contact_phone,
                              });
                              // Pre-select current participants
                                                      const participantFamilyMemberIds = signup.participants
                                                        .map((p) => {
                                                          // Match by name; fallback to classification by age if needed
                                                          const fm = familyMembers.find((f) => f.name === p.name);
                                                          return fm?.id;
                                                        })
                                                        .filter(Boolean) as string[];

                                                      const adults = participantFamilyMemberIds.filter((id) => {
                                                        const fm = familyMembers.find((f) => f.id === id);
                                                        if (!fm) return false;
                                                        // Re-infer type from DOB to ensure consistency
                                                        const age = calculateAge(fm.date_of_birth || undefined);
                                                        return age !== null && age >= 18;
                                                      });
                                                      const scouts = participantFamilyMemberIds.filter((id) => {
                                                        const fm = familyMembers.find((f) => f.id === id);
                                                        if (!fm) return false;
                                                        const age = calculateAge(fm.date_of_birth || undefined);
                                                        return age !== null && age < 18;
                                                      });

                              setSelectedAdultIds(adults);
                              setSelectedScoutIds(scouts);
                              setCurrentStep("contact-info");
                              setExpandedSignupId("");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="flex-1 py-3 px-6 rounded-lg font-bold transition-colors shadow-sm"
                            style={{
                              backgroundColor: "var(--btn-primary-bg)",
                              color: "var(--btn-primary-text)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "var(--btn-primary-hover)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "var(--btn-primary-bg)")
                            }
                          >
                            ✏️ Edit Signup
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelSignup(signup.id, outing.name);
                            }}
                            disabled={isCanceling}
                            className="flex-1 py-3 px-6 rounded-lg font-bold transition-colors shadow-sm"
                            style={{
                              backgroundColor: isCanceling
                                ? "var(--btn-disabled-bg)"
                                : "var(--btn-danger-bg)",
                              color: isCanceling
                                ? "var(--btn-disabled-text)"
                                : "var(--btn-danger-text)",
                              cursor: isCanceling ? "not-allowed" : "pointer",
                            }}
                            onMouseEnter={(e) =>
                              !isCanceling &&
                              (e.currentTarget.style.backgroundColor =
                                "var(--btn-danger-hover)")
                            }
                            onMouseLeave={(e) =>
                              !isCanceling &&
                              (e.currentTarget.style.backgroundColor =
                                "var(--btn-danger-bg)")
                            }
                          >
                            {isCanceling ? "Canceling..." : "🗑️ Cancel"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === "select-trip" && (
            <div>
              <h2
                className="text-3xl font-bold font-heading mb-6 text-center"
                style={{ color: "var(--text-primary)" }}
              >
                {mySignups.length > 0
                  ? "Sign Up for Another Outing"
                  : "Select an Outing"}
              </h2>
              {outingsLoading && outings.length === 0 ? (
                <p>Loading available outings...</p>
              ) : outingsError ? (
                <p className="text-red-700">
                  Error loading outings: {outingsError.message}
                </p>
              ) : outings.filter((o) => !mySignupOutingIds.has(o.id)).length ===
                0 ? (
                <p>
                  No upcoming outings available
                  {mySignups.length > 0
                    ? " (you're signed up for all available outings)"
                    : ""}
                  .
                </p>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  {outings
                    .filter((o) => !mySignupOutingIds.has(o.id))
                    .map((outing) => (
                      <div
                        key={outing.id}
                        onClick={() => {
                          setSelectedOuting(outing);
                          // Automatically advance to next step after a brief delay
                          setTimeout(() => {
                            setCurrentStep("contact-info");
                            // Scroll to top of page
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }, 300);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedOuting(outing);
                            setTimeout(() => {
                              setCurrentStep("contact-info");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }, 300);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={`
glass-card p-8 rounded-lg cursor-pointer transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
${
  selectedOuting?.id === outing.id
    ? "border-2 border-sa-blue bg-blue-50/80 shadow-lg scale-105"
    : "border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5"
}                                                }
`}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            {/* Top row: Date, Cost, and Capacity */}
                            <div className="flex justify-between items-center gap-3 mb-3">
                              <span
                                className="text-lg font-bold whitespace-nowrap"
                                style={{ color: "var(--text-primary)" }}
                              >
                                📅 {formatOutingDate(outing.outing_date)}
                                {outing.end_date &&
                                  ` - ${formatOutingDate(outing.end_date)} `}
                              </span>
                              {outing.cost != null && (
                                <div
                                  className="px-3 py-2 rounded-lg shadow-sm border text-center"
                                  style={{
                                    backgroundColor: "var(--bg-secondary)",
                                    borderColor: "var(--card-border)",
                                  }}
                                >
                                  <div
                                    className="text-xs mb-1 uppercase tracking-wider font-semibold"
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    Cost
                                  </div>
                                  <div
                                    className="text-lg font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    $
                                    {typeof outing.cost === "number"
                                      ? outing.cost.toFixed(2)
                                      : parseFloat(outing.cost as any).toFixed(
                                          2
                                        )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Second row: Icon and Title */}
                            <div className="flex items-baseline gap-3 mb-2">
                              <OutingIconDisplay icon={outing.icon} />
                              <h3 className="text-xl font-bold font-heading text-sa-dark-blue m-0">
                                {outing.name}
                              </h3>
                            </div>

                            {/* Warnings right below title */}
                            {outing.needs_two_deep_leadership && (
                              <div
                                className="mb-3 p-3 rounded-md text-sm font-bold border flex items-center gap-2"
                                style={{
                                  backgroundColor: "var(--alert-warning-bg)",
                                  color: "var(--alert-warning-text)",
                                  borderColor: "var(--alert-warning-border)",
                                }}
                              >
                                <span>⚠️</span> Needs {2 - outing.adult_count}{" "}
                                more adult(s) for two-deep leadership
                              </div>
                            )}
                            {outing.needs_female_leader && (
                              <div
                                className="mb-3 p-3 rounded-md text-sm font-bold border flex items-center gap-2"
                                style={{
                                  backgroundColor: "var(--alert-warning-bg)",
                                  color: "var(--alert-warning-text)",
                                  borderColor: "var(--alert-warning-border)",
                                }}
                              >
                                <span>⚠️</span> Needs female adult leader
                                (female youth present)
                              </div>
                            )}
                            {outing.capacity_type === "vehicle" &&
                              outing.needs_more_drivers && (
                                <div
                                  className="mb-3 p-3 rounded-md text-sm font-bold border flex items-center gap-2"
                                  style={{
                                    backgroundColor: "var(--alert-warning-bg)",
                                    color: "var(--alert-warning-text)",
                                    borderColor: "var(--alert-warning-border)",
                                  }}
                                >
                                  <span>⚠️</span> Need more drivers! Current
                                  capacity: {outing.total_vehicle_capacity}{" "}
                                  seats for {outing.signup_count} participants
                                </div>
                              )}

                            <p className="my-1 text-gray-700">
                              <strong>Location:</strong> {outing.location}
                            </p>
                            {outing.description && (
                              <p className="mt-2 text-gray-600">
                                {outing.description}
                              </p>
                            )}

                            {/* Collapsible Logistics */}
                            {(outing.drop_off_time ||
                              outing.drop_off_location ||
                              outing.pickup_time ||
                              outing.pickup_location) && (
                              <div className="mt-3">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCollapsedLogistics((prev) => ({
                                      ...prev,
                                      [outing.id]:
                                        prev[outing.id] === false
                                          ? true
                                          : false,
                                    }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setCollapsedLogistics((prev) => ({
                                        ...prev,
                                        [outing.id]:
                                          prev[outing.id] === false
                                            ? true
                                            : false,
                                      }));
                                    }
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  aria-expanded={
                                    collapsedLogistics[outing.id] === false
                                  }
                                  className="p-2 rounded cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  style={{
                                    backgroundColor: "var(--bg-secondary)",
                                    border: "1px solid var(--card-border)",
                                  }}
                                >
                                  <p
                                    className="m-0 font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {collapsedLogistics[outing.id] === false
                                      ? "▼"
                                      : "▶"}{" "}
                                    📍 Logistics
                                  </p>
                                </div>
                                {collapsedLogistics[outing.id] === false && (
                                  <div
                                    className="p-2 rounded-b"
                                    style={{
                                      backgroundColor: "var(--bg-secondary)",
                                      border: "1px solid var(--card-border)",
                                      borderTop: "none",
                                    }}
                                  >
                                    {(outing.drop_off_time ||
                                      outing.drop_off_location) && (
                                      <p className="my-1 ml-3 text-sm">
                                        <strong>Drop-off:</strong>{" "}
                                        {outing.drop_off_time &&
                                          `${outing.drop_off_time}`}
                                        {outing.drop_off_time &&
                                          outing.drop_off_location &&
                                          " at "}
                                        {outing.drop_off_location}
                                      </p>
                                    )}
                                    {(outing.pickup_time ||
                                      outing.pickup_location) && (
                                      <p className="my-1 ml-3 text-sm">
                                        <strong>Pickup:</strong>{" "}
                                        {outing.pickup_time &&
                                          `${outing.pickup_time}`}
                                        {outing.pickup_time &&
                                          outing.pickup_location &&
                                          " at "}
                                        {outing.pickup_location}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Collapsible Gear List */}
                            {outing.gear_list && (
                              <div className="mt-3">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCollapsedGear((prev) => ({
                                      ...prev,
                                      [outing.id]:
                                        prev[outing.id] === false
                                          ? true
                                          : false,
                                    }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setCollapsedGear((prev) => ({
                                        ...prev,
                                        [outing.id]:
                                          prev[outing.id] === false
                                            ? true
                                            : false,
                                      }));
                                    }
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  aria-expanded={
                                    collapsedGear[outing.id] === false
                                  }
                                  className="p-2 rounded cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  style={{
                                    backgroundColor: "var(--bg-secondary)",
                                    border: "1px solid var(--card-border)",
                                  }}
                                >
                                  <p
                                    className="m-0 font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {collapsedGear[outing.id] === false
                                      ? "▼"
                                      : "▶"}{" "}
                                    🎒 Suggested Gear
                                  </p>
                                </div>
                                {collapsedGear[outing.id] === false && (
                                  <div
                                    className="p-2 rounded-b"
                                    style={{
                                      backgroundColor: "var(--bg-secondary)",
                                      border: "1px solid var(--card-border)",
                                      borderTop: "none",
                                    }}
                                  >
                                    <p className="my-1 text-sm whitespace-pre-wrap">
                                      {outing.gear_list}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Requirements & Merit Badges */}
                            <div className="mt-3">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Load data if not already loaded
                                  if (
                                    !outingRequirements[outing.id] &&
                                    !loadingRequirements[outing.id]
                                  ) {
                                    loadOutingRequirementsAndBadges(outing.id);
                                  }
                                  setCollapsedRequirements((prev) => ({
                                    ...prev,
                                    [outing.id]:
                                      prev[outing.id] === false ? true : false,
                                  }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (
                                      !outingRequirements[outing.id] &&
                                      !loadingRequirements[outing.id]
                                    ) {
                                      loadOutingRequirementsAndBadges(
                                        outing.id
                                      );
                                    }
                                    setCollapsedRequirements((prev) => ({
                                      ...prev,
                                      [outing.id]:
                                        prev[outing.id] === false
                                          ? true
                                          : false,
                                    }));
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-expanded={
                                  collapsedRequirements[outing.id] === false
                                }
                                className="p-2 rounded cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                style={{
                                  backgroundColor: "var(--bg-secondary)",
                                  border: "1px solid var(--card-border)",
                                }}
                              >
                                <p
                                  className="m-0 font-bold"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {collapsedRequirements[outing.id] === false
                                    ? "▼"
                                    : "▶"}{" "}
                                  🏆 Possible Requirements & Merit Badges to
                                  earn
                                </p>
                              </div>
                              {collapsedRequirements[outing.id] === false && (
                                <div
                                  className="p-3 rounded-b"
                                  style={{
                                    backgroundColor: "var(--bg-secondary)",
                                    border: "1px solid var(--card-border)",
                                    borderTop: "none",
                                  }}
                                >
                                  {loadingRequirements[outing.id] ? (
                                    <p
                                      className="text-sm text-center py-2"
                                      style={{ color: "var(--text-secondary)" }}
                                    >
                                      Loading...
                                    </p>
                                  ) : (
                                    <>
                                      {/* Requirements Table */}
                                      {outingRequirements[outing.id] &&
                                      outingRequirements[outing.id].length >
                                        0 ? (
                                        <div className="mb-3">
                                          <h4
                                            className="text-sm font-bold mb-2"
                                            style={{
                                              color: "var(--text-primary)",
                                            }}
                                          >
                                            Rank Requirements
                                          </h4>
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                              <thead>
                                                <tr
                                                  style={{
                                                    borderBottom:
                                                      "1px solid var(--card-border)",
                                                  }}
                                                >
                                                  <th
                                                    className="text-left py-1 px-2"
                                                    style={{
                                                      color:
                                                        "var(--text-primary)",
                                                    }}
                                                  >
                                                    Rank
                                                  </th>
                                                  <th
                                                    className="text-left py-1 px-2"
                                                    style={{
                                                      color:
                                                        "var(--text-primary)",
                                                    }}
                                                  >
                                                    Requirement
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {outingRequirements[
                                                  outing.id
                                                ].map((req) => (
                                                  <tr
                                                    key={req.id}
                                                    style={{
                                                      borderBottom:
                                                        "1px solid var(--border-light)",
                                                    }}
                                                  >
                                                    <td
                                                      className="py-1 px-2 align-top"
                                                      style={{
                                                        color:
                                                          "var(--text-secondary)",
                                                      }}
                                                    >
                                                      {req.requirement.rank}
                                                    </td>
                                                    <td
                                                      className="py-1 px-2"
                                                      style={{
                                                        color:
                                                          "var(--text-secondary)",
                                                      }}
                                                    >
                                                      <div className="font-medium">
                                                        {
                                                          req.requirement
                                                            .category
                                                        }
                                                      </div>
                                                      {req.requirement
                                                        .requirement_text && (
                                                        <div className="text-xs mt-0.5">
                                                          {
                                                            req.requirement
                                                              .requirement_text
                                                          }
                                                        </div>
                                                      )}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      ) : null}

                                      {/* Merit Badges Table */}
                                      {outingMeritBadges[outing.id] &&
                                      outingMeritBadges[outing.id].length >
                                        0 ? (
                                        <div>
                                          <h4
                                            className="text-sm font-bold mb-2"
                                            style={{
                                              color: "var(--text-primary)",
                                            }}
                                          >
                                            Merit Badges
                                          </h4>
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                              <thead>
                                                <tr
                                                  style={{
                                                    borderBottom:
                                                      "1px solid var(--card-border)",
                                                  }}
                                                >
                                                  <th
                                                    className="text-left py-1 px-2"
                                                    style={{
                                                      color:
                                                        "var(--text-primary)",
                                                    }}
                                                  >
                                                    Badge
                                                  </th>
                                                  <th
                                                    className="text-left py-1 px-2"
                                                    style={{
                                                      color:
                                                        "var(--text-primary)",
                                                    }}
                                                  >
                                                    Type
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {outingMeritBadges[
                                                  outing.id
                                                ].map((badge) => (
                                                  <tr
                                                    key={badge.id}
                                                    style={{
                                                      borderBottom:
                                                        "1px solid var(--border-light)",
                                                    }}
                                                  >
                                                    <td
                                                      className="py-1 px-2"
                                                      style={{
                                                        color:
                                                          "var(--text-secondary)",
                                                      }}
                                                    >
                                                      {badge.merit_badge.name}
                                                    </td>
                                                    <td
                                                      className="py-1 px-2"
                                                      style={{
                                                        color:
                                                          "var(--text-secondary)",
                                                      }}
                                                    >
                                                      {badge.merit_badge
                                                        .eagle_required
                                                        ? "🦅 Eagle Required"
                                                        : "Elective"}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      ) : null}

                                      {/* No data message */}
                                      {(!outingRequirements[outing.id] ||
                                        outingRequirements[outing.id].length ===
                                          0) &&
                                        (!outingMeritBadges[outing.id] ||
                                          outingMeritBadges[outing.id]
                                            .length === 0) && (
                                          <p
                                            className="text-sm text-center py-2"
                                            style={{
                                              color: "var(--text-secondary)",
                                            }}
                                          >
                                            No requirements or merit badges
                                            linked to this outing yet.
                                          </p>
                                        )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Capacity Badge */}
                          <div
                            className="px-4 py-2 rounded-lg text-center min-w-[100px] shadow-sm border"
                            style={{
                              backgroundColor: outing.is_full
                                ? "var(--card-error-bg)"
                                : "var(--card-success-bg)",
                              borderColor: outing.is_full
                                ? "var(--border-error)"
                                : "var(--border-success)",
                            }}
                          >
                            <div
                              className="text-xs mb-1 uppercase tracking-wider font-semibold"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {outing.capacity_type === "vehicle"
                                ? "Seats"
                                : "Capacity"}
                            </div>
                            <div
                              className="text-xl font-bold"
                              style={{
                                color: outing.is_full
                                  ? "var(--color-error)"
                                  : "var(--color-success)",
                              }}
                            >
                              {outing.capacity_type === "vehicle"
                                ? `${outing.signup_count}/${outing.total_vehicle_capacity}`
                                : `${outing.signup_count}/${outing.max_participants}`}
                            </div>
                            {outing.is_full && (
                              <div
                                className="text-xs font-bold mt-1"
                                style={{ color: "var(--color-error)" }}
                              >
                                FULL
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {currentStep === "contact-info" && (
            <div>
              <h2
                className="text-2xl font-bold font-heading mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Contact Information
              </h2>
              <p
                className="mb-5 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                This information will be saved as your default for future
                signups. You can change it for each trip if needed.
              </p>
              <div className="grid gap-5 p-8 rounded-lg border shadow-sm glass-card">
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block mb-1 font-bold text-gray-700"
                  >
                    Email *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, email: e.target.value })
                    }
                    className="w-full p-2.5 text-base rounded-md border border-gray-300 focus:border-sa-blue focus:ring-1 focus:ring-sa-blue outline-none transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block mb-1 font-bold text-gray-700"
                  >
                    Phone *
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo({
                        ...contactInfo,
                        phone: formatPhoneNumber(e.target.value),
                      })
                    }
                    placeholder="(555) 123-4567"
                    className="w-full p-2.5 text-base rounded-md border border-gray-300 focus:border-sa-blue focus:ring-1 focus:ring-sa-blue outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: (XXX) XXX-XXXX
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="emergency-name"
                    className="block mb-1 font-bold text-gray-700"
                  >
                    Emergency Contact Name *
                  </label>
                  <input
                    id="emergency-name"
                    type="text"
                    value={contactInfo.emergency_contact_name}
                    onChange={(e) =>
                      setContactInfo({
                        ...contactInfo,
                        emergency_contact_name: e.target.value,
                      })
                    }
                    className="w-full p-2.5 text-base rounded-md border border-gray-300 focus:border-sa-blue focus:ring-1 focus:ring-sa-blue outline-none transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="emergency-phone"
                    className="block mb-1 font-bold text-gray-700"
                  >
                    Emergency Contact Phone *
                  </label>
                  <input
                    id="emergency-phone"
                    type="tel"
                    value={contactInfo.emergency_contact_phone}
                    onChange={(e) =>
                      setContactInfo({
                        ...contactInfo,
                        emergency_contact_phone: formatPhoneNumber(
                          e.target.value
                        ),
                      })
                    }
                    placeholder="(555) 123-4567"
                    className="w-full p-2.5 text-base rounded-md border border-gray-300 focus:border-sa-blue focus:ring-1 focus:ring-sa-blue outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: (XXX) XXX-XXXX
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === "select-adults" && (
            <div>
              <h2
                className="text-2xl font-bold font-heading mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Select Adults
              </h2>
              <p className="mb-5" style={{ color: "var(--text-secondary)" }}>
                Select adults attending (optional - skip if no adults)
              </p>
              {familyMembers.filter((m) => m.member_type === "adult").length ===
              0 ? (
                <p style={{ color: "var(--text-secondary)" }}>
                  No adults in family.{" "}
                  <a
                    href="/family-setup"
                    style={{ color: "var(--text-link)" }}
                    className="hover:underline"
                  >
                    Add adults
                  </a>
                </p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                  {familyMembers
                    .filter((m) => {
                      // Re-infer adult classification by DOB for consistency
                      const age = calculateAge(m.date_of_birth || undefined);
                      return age !== null && age >= 18;
                    })
                    .map((member) => {
                      const isSelected = selectedAdultIds.includes(member.id);
                      const isExpired =
                        member.youth_protection_expired === true;
                      const canSelect = !isExpired;
                      return (
                        <div
                          key={member.id}
                          onClick={() =>
                            canSelect &&
                            setSelectedAdultIds((prev) =>
                              prev.includes(member.id)
                                ? prev.filter((id) => id !== member.id)
                                : [...prev, member.id]
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              (e.key === "Enter" || e.key === " ") &&
                              canSelect
                            ) {
                              e.preventDefault();
                              setSelectedAdultIds((prev) =>
                                prev.includes(member.id)
                                  ? prev.filter((id) => id !== member.id)
                                  : [...prev, member.id]
                              );
                            }
                          }}
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-disabled={!canSelect}
                          tabIndex={canSelect ? 0 : -1}
                          className="p-5 rounded-lg border cursor-pointer relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          style={{
                            borderWidth: isSelected
                              ? "3px"
                              : isExpired
                              ? "2px"
                              : "1px",
                            borderColor: isSelected
                              ? "var(--border-success)"
                              : isExpired
                              ? "var(--border-error)"
                              : "var(--border-light)",
                            backgroundColor: isSelected
                              ? "var(--card-success-bg)"
                              : isExpired
                              ? "var(--card-error-bg)"
                              : "var(--card-bg)",
                            opacity: isExpired ? 0.7 : 1,
                            cursor: canSelect ? "pointer" : "not-allowed",
                            boxShadow: isSelected
                              ? "var(--card-hover-shadow)"
                              : "none",
                            transform: isSelected ? "scale(1.02)" : "scale(1)",
                          }}
                          onMouseEnter={(e) =>
                            !isSelected &&
                            !isExpired &&
                            ((e.currentTarget.style.borderColor =
                              "var(--color-primary)"),
                            (e.currentTarget.style.boxShadow =
                              "var(--card-hover-shadow)"),
                            (e.currentTarget.style.transform =
                              "translateY(-2px)"))
                          }
                          onMouseLeave={(e) =>
                            !isSelected &&
                            !isExpired &&
                            ((e.currentTarget.style.borderColor =
                              "var(--border-light)"),
                            (e.currentTarget.style.boxShadow = "none"),
                            (e.currentTarget.style.transform = "translateY(0)"))
                          }
                        >
                          {isSelected && (
                            <div
                              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold shadow-sm"
                              style={{
                                backgroundColor: "var(--color-success)",
                                color: "white",
                              }}
                            >
                              ✓
                            </div>
                          )}
                          <h3
                            className="m-0 mb-2 font-bold text-lg"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {member.name}
                          </h3>
                          {(member.vehicle_capacity ?? 0) > 0 && (
                            <p
                              className="my-1 font-bold flex items-center gap-1"
                              style={{ color: "var(--color-info)" }}
                            >
                              <span>🚗</span> {member.vehicle_capacity ?? 0}{" "}
                              seats
                            </p>
                          )}
                          {member.has_youth_protection !== undefined && (
                            <p
                              className="my-1 text-xs font-medium"
                              style={{
                                color: member.youth_protection_expired
                                  ? "var(--color-error)"
                                  : "var(--color-success)",
                                fontWeight: member.youth_protection_expired
                                  ? "bold"
                                  : "normal",
                              }}
                            >
                              {member.youth_protection_expired
                                ? `⚠️ Youth Protection expires before trip ends - Cannot Sign Up`
                                : member.has_youth_protection
                                ? "✓ Youth Protection valid through trip"
                                : ""}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
              {selectedOuting?.capacity_type === "vehicle" &&
                selectedAdultIds.length > 0 && (
                  <div
                    className="mt-5 p-4 rounded-lg border"
                    style={{
                      backgroundColor: "var(--alert-info-bg)",
                      borderColor: "var(--alert-info-border)",
                    }}
                  >
                    <p
                      className="m-0 font-bold"
                      style={{ color: "var(--alert-info-text)" }}
                    >
                      Available Seats: {calculateAvailableSeats()}
                    </p>
                  </div>
                )}
            </div>
          )}

          {currentStep === "select-scouts" && (
            <div>
              <h2
                className="text-2xl font-bold font-heading mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Select Scouts
              </h2>
              <p className="mb-5" style={{ color: "var(--text-secondary)" }}>
                Select scouts attending (optional - skip if no scouts)
              </p>
              {selectedOuting?.capacity_type === "vehicle" && (
                <div
                  className="mb-5 p-4 rounded-lg border"
                  style={{
                    backgroundColor: "var(--alert-info-bg)",
                    borderColor: "var(--alert-info-border)",
                  }}
                >
                  <p
                    className="m-0 font-bold"
                    style={{ color: "var(--alert-info-text)" }}
                  >
                    Available Seats: {calculateAvailableSeats()}
                  </p>
                </div>
              )}
              {familyMembers.filter((m) => m.member_type === "scout").length ===
              0 ? (
                <p style={{ color: "var(--text-secondary)" }}>
                  No scouts in family.{" "}
                  <a
                    href="/family-setup"
                    style={{ color: "var(--text-link)" }}
                    className="hover:underline"
                  >
                    Add scouts
                  </a>
                </p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                  {familyMembers
                    .filter((m) => {
                      const age = calculateAge(m.date_of_birth || undefined);
                      return age !== null && age < 18;
                    })
                    .map((member) => {
                      const isSelected = selectedScoutIds.includes(member.id);
                      const availableSeats = calculateAvailableSeats();
                      const canSelect =
                        selectedOuting?.capacity_type !== "vehicle" ||
                        availableSeats > 0 ||
                        isSelected;

                      return (
                        <div
                          key={member.id}
                          onClick={() =>
                            canSelect &&
                            setSelectedScoutIds((prev) =>
                              prev.includes(member.id)
                                ? prev.filter((id) => id !== member.id)
                                : [...prev, member.id]
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              (e.key === "Enter" || e.key === " ") &&
                              canSelect
                            ) {
                              e.preventDefault();
                              setSelectedScoutIds((prev) =>
                                prev.includes(member.id)
                                  ? prev.filter((id) => id !== member.id)
                                  : [...prev, member.id]
                              );
                            }
                          }}
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-disabled={!canSelect}
                          tabIndex={canSelect ? 0 : -1}
                          className="p-5 rounded-lg border cursor-pointer relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          style={{
                            borderWidth: isSelected ? "3px" : "1px",
                            borderColor: isSelected
                              ? "var(--border-success)"
                              : "var(--border-light)",
                            backgroundColor: isSelected
                              ? "var(--card-success-bg)"
                              : !canSelect
                              ? "var(--bg-tertiary)"
                              : "var(--card-bg)",
                            opacity: !canSelect ? 0.7 : 1,
                            cursor: canSelect ? "pointer" : "not-allowed",
                            boxShadow: isSelected
                              ? "var(--card-hover-shadow)"
                              : "none",
                            transform: isSelected ? "scale(1.02)" : "scale(1)",
                          }}
                          onMouseEnter={(e) =>
                            !isSelected &&
                            canSelect &&
                            ((e.currentTarget.style.borderColor =
                              "var(--color-primary)"),
                            (e.currentTarget.style.boxShadow =
                              "var(--card-hover-shadow)"),
                            (e.currentTarget.style.transform =
                              "translateY(-2px)"))
                          }
                          onMouseLeave={(e) =>
                            !isSelected &&
                            canSelect &&
                            ((e.currentTarget.style.borderColor =
                              "var(--border-light)"),
                            (e.currentTarget.style.boxShadow = "none"),
                            (e.currentTarget.style.transform = "translateY(0)"))
                          }
                        >
                          {isSelected && (
                            <div
                              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold shadow-sm"
                              style={{
                                backgroundColor: "var(--color-success)",
                                color: "white",
                              }}
                            >
                              ✓
                            </div>
                          )}
                          <h3
                            className="m-0 mb-2 font-bold text-lg"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {member.name}
                          </h3>
                          {member.troop_number && (
                            <p
                              className="my-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Troop {member.troop_number}
                            </p>
                          )}
                          {!canSelect && (
                            <p
                              className="mt-2 text-sm font-bold"
                              style={{ color: "var(--color-error)" }}
                            >
                              No seats available
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {currentStep === "review" && (
            <div>
              <h2
                className="text-2xl font-bold font-heading mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Review Signup
              </h2>
              <div className="mb-5 p-8 rounded-lg border glass-card">
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Trip: {selectedOuting?.name}
                </h3>
                <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
                  <strong>Contact:</strong> {contactInfo.email} |{" "}
                  {contactInfo.phone}
                </p>
                <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
                  <strong>Adults:</strong> {selectedAdultIds.length}
                </p>
                <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
                  <strong>Scouts:</strong> {selectedScoutIds.length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between mt-8 pt-5 border-t border-gray-200">
          {currentStep !== "select-trip" && (
            <button
              onClick={goToPreviousStep}
              disabled={loading}
              className={`
                                bg-gray-500 text-white font-bold transition-colors shadow-sm
                                ${
                                  loading
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-gray-600"
                                }
                            `}
            >
              ← Back
            </button>
          )}

          <div className="flex gap-3 ml-auto">
            {currentStep !== "select-trip" && (
              <button
                onClick={handleCancelWizard}
                disabled={loading}
                className={`
                                    bg-white text-red-600 border-2 border-red-200 font-bold transition-colors shadow-sm
                                    ${
                                      loading
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-red-50 hover:border-red-300"
                                    }
                                `}
              >
                ✕ Cancel
              </button>
            )}

            {currentStep !== "review" ? (
              <button
                onClick={goToNextStep}
                disabled={loading}
                className={`
                                    bg-sa-blue text-white font-bold transition-colors shadow-sm
                                    ${
                                      loading
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-blue-700"
                                    }
                                `}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`
                                    py-3 px-6 text-white rounded-lg font-bold transition-colors shadow-sm
                                    ${
                                      loading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700"
                                    }
                                `}
              >
                {loading ? "Submitting..." : "Submit Signup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupWizard;
