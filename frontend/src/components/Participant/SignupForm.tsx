import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Outing,
  SignupFormData,
  FamilyMemberSummary,
  SignupResponse,
} from "../../types";
import { outingAPI, signupAPI, familyAPI, APIError } from "../../services/api";
import {
  formatPhoneNumber,
  validatePhoneWithMessage,
} from "../../utils/phoneUtils";

const SignupForm: React.FC = () => {
  const auth = useAuth();
  const user = auth.user;
  const isSignedIn = auth.isAuthenticated;
  const isAuthenticated = isSignedIn;
  const isParent = true; // All Authentik users are parents by default
  const [outings, setOutings] = useState<Outing[]>([]);
  const [mySignups, setMySignups] = useState<SignupResponse[]>([]);
  const [mySignupOutingIds, setMySignupOutingIds] = useState<Set<string>>(
    new Set()
  );
  const [expandedOutingId, setExpandedOutingId] = useState<string>("");
  const [expandedSignupId, setExpandedSignupId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingFamilyMembers, setLoadingFamilyMembers] = useState(false);
  const [cancelingSignupId, setCancelingSignupId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showOutingLeadInfo, setShowOutingLeadInfo] = useState<{
    [key: string]: boolean;
  }>({});
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberSummary[]>([]);
  const [selectedFamilyMemberIds, setSelectedFamilyMemberIds] = useState<
    string[]
  >([]);
  // Grubmaster request state - tracks which scouts want to be grubmasters
  const [grubmasterRequests, setGrubmasterRequests] = useState<{
    [memberId: string]: { interest: boolean; reason?: string };
  }>({});
  // Legacy participant editing state replaced by family member selection flow
  const [showFamilySelection, setShowFamilySelection] = useState<boolean>(true);

  const [formData, setFormData] = useState<SignupFormData>({
    outing_id: "",
    email: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    participants: [
      {
        full_name: "",
        participant_type: "scout",
        gender: "male",
        age: "",
        troop_number: "",
        patrol: "",
        has_youth_protection_training: false,
        vehicle_capacity: "",
        dietary_restrictions: {},
        dietary_notes: "",
        allergies: [],
      },
    ],
  });

  useEffect(() => {
    loadOutings();
    if (isAuthenticated && isParent) {
      loadFamilyMembers();
      loadMySignups();
      // Pre-fill contact info from user profile
      if (user?.email) {
        setFormData((prev) => ({
          ...prev,
          email: user.email || prev.email,
        }));
      }
    }
  }, [isAuthenticated, isParent, user]);

  const loadOutings = async () => {
    try {
      setLoading(true);
      const data = await outingAPI.getAll();
      // Filter to show only future outings (compare dates only, not time)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to start of day
      const futureOutings = data.filter((outing) => {
        const outingDate = new Date(outing.outing_date);
        outingDate.setHours(0, 0, 0, 0); // Reset to start of day
        return outingDate >= today;
      });
      setOutings(futureOutings);
    } catch (err) {
      setError(
        err instanceof APIError ? err.message : "Failed to load outings"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMySignups = async () => {
    try {
      const signups = await signupAPI.getMySignups();
      setMySignups(signups);
      // Create a set of outing IDs where user is already signed up
      const signupOutingIds = new Set(signups.map((s) => s.outing_id));
      setMySignupOutingIds(signupOutingIds);
    } catch (err) {
      console.error("Failed to load my signups:", err);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      setLoadingFamilyMembers(true);
      console.log("🔄 Loading family members...");
      const data = await familyAPI.getSummary();
      console.log("✅ Family members loaded:", data.length);
      setFamilyMembers(data);

      // If no family members found, show a helpful message
      if (data.length === 0) {
        console.warn("⚠️ No family members found for user");
      }
    } catch (err) {
      console.error("❌ Failed to load family members:", err);
      // Set error to inform user
      setError(
        "Unable to load your family members. Please refresh the page or contact support if the problem persists. " +
          (err instanceof Error ? err.message : "")
      );
    } finally {
      setLoadingFamilyMembers(false);
    }
  };

  const handleOutingToggle = (outingId: string) => {
    if (expandedOutingId === outingId) {
      // Collapse if already expanded
      setExpandedOutingId("");
      setFormData({ ...formData, outing_id: "" });
    } else {
      // Expand and set outing
      setExpandedOutingId(outingId);
      setFormData({ ...formData, outing_id: outingId });
      // Reset form state when switching outings
      setShowFamilySelection(true);
      setSelectedFamilyMemberIds([]);
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Apply phone formatting for phone fields
    if (name === "phone" || name === "emergency_contact_phone") {
      setFormData({
        ...formData,
        [name]: formatPhoneNumber(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAddParticipant = () => {
    window.location.href = "/family-setup";
  };

  const handleToggleFamilyMember = async (memberId: string) => {
    const isSelected = selectedFamilyMemberIds.includes(memberId);

    if (isSelected) {
      // Remove from selection
      setSelectedFamilyMemberIds((prev) =>
        prev.filter((id) => id !== memberId)
      );
    } else {
      // Add to selection
      setSelectedFamilyMemberIds((prev) => [...prev, memberId]);
    }
  };

  const handleConfirmSelection = async () => {
    if (selectedFamilyMemberIds.length === 0) {
      setError("Please select at least one family member");
      return;
    }

    // Simply hide the selection UI - we'll send the IDs directly to the API
    setShowFamilySelection(false);
  };

  // handleAddNewParticipant removed (unused in current flow)

  const handleBackToFamilySelection = () => {
    setShowFamilySelection(true);
    setSelectedFamilyMemberIds([]);
    // Reset participants
    setFormData((prev) => ({
      ...prev,
      participants: [
        {
          full_name: "",
          participant_type: "scout",
          gender: "male",
          age: "",
          troop_number: "",
          patrol: "",
          has_youth_protection_training: false,
          vehicle_capacity: "",
          dietary_restrictions: {},
          dietary_notes: "",
          allergies: [],
        },
      ],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate basic form fields
    if (!formData.outing_id) {
      setError("Please select an outing");
      return;
    }
    if (!formData.email) {
      setError("Email is required");
      return;
    }

    // Validate phone numbers with detailed messages
    const phoneError = validatePhoneWithMessage(formData.phone, "Phone number");
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (!formData.emergency_contact_name) {
      setError("Emergency contact name is required");
      return;
    }

    const emergencyPhoneError = validatePhoneWithMessage(
      formData.emergency_contact_phone,
      "Emergency contact phone"
    );
    if (emergencyPhoneError) {
      setError(emergencyPhoneError);
      return;
    }
    if (selectedFamilyMemberIds.length === 0) {
      setError("Please select at least one family member");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build grubmaster requests array for scouts who have interest
      const grubmasterRequestsArray = selectedFamilyMemberIds
        .filter((id) => grubmasterRequests[id]?.interest)
        .map((id) => ({
          family_member_id: id,
          grubmaster_interest: grubmasterRequests[id]?.interest || false,
          grubmaster_reason: grubmasterRequests[id]?.reason,
        }));

      // Send family member IDs directly to the API
      const signupData = {
        outing_id: formData.outing_id,
        family_contact: {
          email: formData.email,
          phone: formData.phone,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
        },
        family_member_ids: selectedFamilyMemberIds,
        grubmaster_requests:
          grubmasterRequestsArray.length > 0
            ? grubmasterRequestsArray
            : undefined,
      };

      const response = await signupAPI.create(signupData);

      setSuccess(true);
      setWarnings(response.warnings || []);

      // Reload signups to update the list
      await loadMySignups();

      // Reset form after successful submission
      setTimeout(() => {
        setWarnings([]);
        setFormData({
          outing_id: "",
          email: user?.email || "",
          phone: "",
          emergency_contact_name: "",
          emergency_contact_phone: "",
          participants: [
            {
              full_name: "",
              participant_type: "scout",
              gender: "male",
              age: "",
              troop_number: "",
              patrol: "",
              has_youth_protection_training: false,
              vehicle_capacity: "",
              dietary_restrictions: {},
              dietary_notes: "",
              allergies: [],
            },
          ],
        });
        setExpandedOutingId("");
        setSuccess(false);
        setSelectedFamilyMemberIds([]);
        setGrubmasterRequests({});
        setShowFamilySelection(true);
      }, 3000);
    } catch (err) {
      setError(
        err instanceof APIError ? err.message : "Failed to submit signup"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSignup = async (signupId: string, outingName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel your signup for "${outingName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setCancelingSignupId(signupId);
      setError(null);
      await signupAPI.cancelSignup(signupId);
      // Reload signups and outings after successful cancellation
      await loadMySignups();
      await loadOutings();
      setExpandedSignupId("");
    } catch (err) {
      setError(
        err instanceof APIError ? err.message : "Failed to cancel signup"
      );
    } finally {
      setCancelingSignupId(null);
    }
  };

  const selectedOuting = outings.find((t) => t.id === expandedOutingId);
  const availableOutings = outings.filter((o) => !mySignupOutingIds.has(o.id));

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Outing Signups</h1>

      {success && (
        <>
          <div
            style={{
              padding: "15px",
              marginBottom: "20px",
              backgroundColor: "#e8f5e9",
              color: "#2e7d32",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            ✓ Signup submitted successfully! You will receive a confirmation
            email shortly.
          </div>

          {warnings.length > 0 && (
            <div
              style={{
                padding: "15px",
                marginBottom: "20px",
                backgroundColor: "#fff3e0",
                color: "#e65100",
                borderRadius: "4px",
                border: "2px solid #f57c00",
              }}
            >
              <strong style={{ display: "block", marginBottom: "10px" }}>
                Important Reminders:
              </strong>
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  style={{ marginBottom: "8px", paddingLeft: "10px" }}
                >
                  {warning}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {error && (
        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {/* My Signups Section */}
      {isAuthenticated && mySignups.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ color: "#2e7d32", marginBottom: "15px" }}>
            ✓ My Signups ({mySignups.length})
          </h2>
          <p style={{ marginBottom: "20px", color: "#666" }}>
            Outings you're already signed up for. Click on any signup to view
            details or cancel.
          </p>
          <div>
            {mySignups.map((signup) => {
              const outing = outings.find((o) => o.id === signup.outing_id);
              if (!outing) return null;

              const isExpanded = expandedSignupId === signup.id;
              const isCanceling = cancelingSignupId === signup.id;

              return (
                <div
                  key={signup.id}
                  style={{
                    marginBottom: "20px",
                    border: isExpanded ? "2px solid #2e7d32" : "1px solid #ddd",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "#f1f8f4",
                  }}
                >
                  {/* Signup Header - Clickable */}
                  <div
                    onClick={() =>
                      setExpandedSignupId(isExpanded ? "" : signup.id)
                    }
                    style={{
                      padding: "15px",
                      cursor: "pointer",
                      backgroundColor: isExpanded ? "#e8f5e9" : "#f1f8f4",
                      transition: "background-color 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 10px 0", color: "#2e7d32" }}>
                          ✓ {outing.name}
                        </h3>
                        <p style={{ margin: "5px 0", fontSize: "14px" }}>
                          <strong>Date:</strong>{" "}
                          {new Date(outing.outing_date).toLocaleDateString()}
                        </p>
                        <p style={{ margin: "5px 0", fontSize: "14px" }}>
                          <strong>Participants:</strong>{" "}
                          {signup.participant_count} ({signup.adult_count} adult
                          {signup.adult_count !== 1 ? "s" : ""},{" "}
                          {signup.scout_count} scout
                          {signup.scout_count !== 1 ? "s" : ""})
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          marginLeft: "10px",
                        }}
                      >
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Signup Details */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "20px",
                        backgroundColor: "white",
                        borderTop: "2px solid #2e7d32",
                      }}
                    >
                      <div style={{ marginBottom: "20px" }}>
                        <h4 style={{ marginBottom: "10px" }}>Outing Details</h4>
                        <p style={{ margin: "5px 0" }}>
                          <strong>Location:</strong> {outing.location}
                        </p>
                        {outing.description && (
                          <p style={{ margin: "10px 0" }}>
                            {outing.description}
                          </p>
                        )}
                      </div>

                      <div style={{ marginBottom: "20px" }}>
                        <h4 style={{ marginBottom: "10px" }}>
                          Your Participants
                        </h4>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(250px, 1fr))",
                            gap: "15px",
                          }}
                        >
                          {signup.participants.map((participant) => (
                            <div
                              key={participant.id}
                              style={{
                                padding: "15px",
                                backgroundColor: "#f5f5f5",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                              }}
                            >
                              <p
                                style={{
                                  margin: "0 0 8px 0",
                                  fontWeight: "bold",
                                  fontSize: "16px",
                                }}
                              >
                                {participant.name}
                              </p>
                              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                                <strong>Type:</strong>{" "}
                                {participant.is_adult ? "🌲 Adult" : "🌱 Scout"}
                              </p>
                              {participant.age && (
                                <p
                                  style={{ margin: "4px 0", fontSize: "14px" }}
                                >
                                  <strong>Age:</strong> {participant.age}
                                </p>
                              )}
                              {participant.troop_number && (
                                <p
                                  style={{ margin: "4px 0", fontSize: "14px" }}
                                >
                                  <strong>Troop:</strong>{" "}
                                  {participant.troop_number}
                                </p>
                              )}
                              {participant.vehicle_capacity > 0 && (
                                <p
                                  style={{
                                    margin: "4px 0",
                                    fontSize: "14px",
                                    color: "#1976d2",
                                    fontWeight: "bold",
                                  }}
                                >
                                  🚗 Can transport{" "}
                                  {participant.vehicle_capacity} passenger
                                  {participant.vehicle_capacity !== 1
                                    ? "s"
                                    : ""}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        style={{
                          marginBottom: "20px",
                          padding: "15px",
                          backgroundColor: "#f5f5f5",
                          borderRadius: "8px",
                        }}
                      >
                        <h4 style={{ marginBottom: "10px" }}>
                          Contact Information
                        </h4>
                        <p style={{ margin: "4px 0" }}>
                          <strong>Email:</strong> {signup.family_contact_email}
                        </p>
                        <p style={{ margin: "4px 0" }}>
                          <strong>Phone:</strong> {signup.family_contact_phone}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleCancelSignup(signup.id, outing.name)
                        }
                        disabled={isCanceling}
                        style={{
                          padding: "12px 24px",
                          backgroundColor: isCanceling ? "#ccc" : "#d32f2f",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: isCanceling ? "not-allowed" : "pointer",
                          fontSize: "16px",
                          fontWeight: "bold",
                          width: "100%",
                        }}
                      >
                        {isCanceling ? "Canceling..." : "Cancel This Signup"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Outings Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Available Outings to Sign Up</h2>
        {loading && outings.length === 0 ? (
          <p>Loading available outings...</p>
        ) : availableOutings.length === 0 ? (
          <p>
            No upcoming outings available at this time
            {mySignups.length > 0
              ? " (you're already signed up for all available outings)"
              : ""}
            .
          </p>
        ) : (
          <div>
            {availableOutings.map((outing) => (
              <div
                key={outing.id}
                style={{
                  marginBottom: "20px",
                  border:
                    expandedOutingId === outing.id
                      ? "2px solid #1976d2"
                      : "1px solid #ddd",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Outing Header - Clickable */}
                <div
                  onClick={() => handleOutingToggle(outing.id)}
                  style={{
                    padding: "15px",
                    cursor: "pointer",
                    backgroundColor:
                      expandedOutingId === outing.id ? "#e3f2fd" : "white",
                    transition: "background-color 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h3 style={{ margin: "0 0 10px 0" }}>{outing.name}</h3>
                    <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                      {expandedOutingId === outing.id ? "▼" : "▶"}
                    </span>
                  </div>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Date:</strong>{" "}
                    {new Date(outing.outing_date).toLocaleDateString()}
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    <strong>Location:</strong> {outing.location}
                  </p>

                  {/* Scouting America Two-Deep Leadership Warning */}
                  {outing.needs_two_deep_leadership && (
                    <p
                      style={{
                        margin: "10px 0",
                        padding: "10px",
                        backgroundColor: "#fff3e0",
                        color: "#e65100",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      ⚠️ Scouting America Requirement: This outing needs at
                      least {2 - outing.adult_count} more adult(s). Scouting
                      America requires a minimum of 2 adults on every outing for
                      two-deep leadership.
                    </p>
                  )}

                  {/* Scouting America Female Leader Warning */}
                  {outing.needs_female_leader && (
                    <p
                      style={{
                        margin: "10px 0",
                        padding: "10px",
                        backgroundColor: "#fff3e0",
                        color: "#e65100",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      ⚠️ Scouting America Requirement: This outing has female
                      youth participants and requires at least one female adult
                      leader.
                    </p>
                  )}

                  {outing.capacity_type === "fixed" ? (
                    <p style={{ margin: "5px 0" }}>
                      <strong>Capacity:</strong> {outing.signup_count} /{" "}
                      {outing.max_participants}
                      {outing.is_full && (
                        <span style={{ color: "#d32f2f", marginLeft: "10px" }}>
                          FULL
                        </span>
                      )}
                    </p>
                  ) : (
                    <>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Participants:</strong> {outing.signup_count}
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Vehicle Seats Available:</strong>{" "}
                        {outing.available_spots}
                        {outing.is_full && (
                          <span
                            style={{ color: "#d32f2f", marginLeft: "10px" }}
                          >
                            FULL
                          </span>
                        )}
                      </p>
                      {outing.needs_more_drivers && (
                        <p
                          style={{
                            margin: "10px 0",
                            padding: "10px",
                            backgroundColor: "#fff3e0",
                            color: "#e65100",
                            borderRadius: "4px",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          ⚠️ We need more adult drivers! Current vehicle
                          capacity is {outing.total_vehicle_capacity} seats for{" "}
                          {outing.signup_count} participants. If you're an
                          adult, please consider signing up with vehicle
                          capacity to help transport scouts.
                        </p>
                      )}
                      {outing.is_full && !outing.needs_more_drivers && (
                        <p
                          style={{
                            margin: "10px 0",
                            padding: "10px",
                            backgroundColor: "#ffebee",
                            color: "#c62828",
                            borderRadius: "4px",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          This outing is currently full. We need more adults to
                          sign up with vehicle capacity to accommodate
                          additional participants. If you're an adult willing to
                          drive, your signup will help create space for more
                          scouts!
                        </p>
                      )}
                    </>
                  )}
                  {outing.description && (
                    <p style={{ margin: "10px 0 0 0" }}>{outing.description}</p>
                  )}

                  {/* Cost */}
                  {outing.cost && (
                    <p style={{ margin: "10px 0 0 0", fontSize: "16px" }}>
                      <strong>Cost:</strong> $
                      {typeof outing.cost === "number"
                        ? outing.cost.toFixed(2)
                        : parseFloat(outing.cost as any).toFixed(2)}
                    </p>
                  )}

                  {/* Drop-off & Pickup Information */}
                  {(outing.drop_off_time ||
                    outing.drop_off_location ||
                    outing.pickup_time ||
                    outing.pickup_location) && (
                    <div
                      style={{
                        margin: "15px 0",
                        padding: "15px",
                        backgroundColor: "#e8f5e9",
                        borderRadius: "4px",
                        border: "1px solid #4caf50",
                      }}
                    >
                      <h4 style={{ margin: "0 0 10px 0", color: "#2e7d32" }}>
                        Drop-off & Pickup
                      </h4>
                      {(outing.drop_off_time || outing.drop_off_location) && (
                        <div style={{ marginBottom: "10px" }}>
                          <p
                            style={{
                              margin: "5px 0",
                              fontWeight: "bold",
                              color: "#1b5e20",
                            }}
                          >
                            Drop-off:
                          </p>
                          {outing.drop_off_time && (
                            <p style={{ margin: "5px 0 5px 15px" }}>
                              <strong>Time:</strong> {outing.drop_off_time}
                            </p>
                          )}
                          {outing.drop_off_location && (
                            <p style={{ margin: "5px 0 5px 15px" }}>
                              <strong>Location:</strong>{" "}
                              {outing.drop_off_location}
                            </p>
                          )}
                        </div>
                      )}
                      {(outing.pickup_time || outing.pickup_location) && (
                        <div>
                          <p
                            style={{
                              margin: "5px 0",
                              fontWeight: "bold",
                              color: "#1b5e20",
                            }}
                          >
                            Pickup:
                          </p>
                          {outing.pickup_time && (
                            <p style={{ margin: "5px 0 5px 15px" }}>
                              <strong>Time:</strong> {outing.pickup_time}
                            </p>
                          )}
                          {outing.pickup_location && (
                            <p style={{ margin: "5px 0 5px 15px" }}>
                              <strong>Location:</strong>{" "}
                              {outing.pickup_location}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Gear List */}
                  {outing.gear_list && (
                    <div
                      style={{
                        margin: "15px 0",
                        padding: "15px",
                        backgroundColor: "#fff3e0",
                        borderRadius: "4px",
                        border: "1px solid #ff9800",
                      }}
                    >
                      <h4 style={{ margin: "0 0 10px 0", color: "#e65100" }}>
                        Suggested Gear
                      </h4>
                      <p style={{ margin: "0", whiteSpace: "pre-wrap" }}>
                        {outing.gear_list}
                      </p>
                    </div>
                  )}

                  {/* Outing Lead Contact Information - Collapsible */}
                  {(outing.outing_lead_name ||
                    outing.outing_lead_email ||
                    outing.outing_lead_phone) && (
                    <div
                      style={{ marginTop: "15px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOutingLeadInfo({
                            ...showOutingLeadInfo,
                            [outing.id]: !showOutingLeadInfo[outing.id],
                          });
                        }}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#2196f3",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        {showOutingLeadInfo[outing.id] ? "▼ Hide" : "▶ Show"}{" "}
                        Outing Lead Contact Info
                      </button>

                      {showOutingLeadInfo[outing.id] && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "15px",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "4px",
                            border: "1px solid #2196f3",
                          }}
                        >
                          <h4
                            style={{ margin: "0 0 10px 0", color: "#1976d2" }}
                          >
                            Outing Lead Contact
                          </h4>
                          {outing.outing_lead_name && (
                            <p style={{ margin: "5px 0" }}>
                              <strong>Name:</strong> {outing.outing_lead_name}
                            </p>
                          )}
                          {outing.outing_lead_email && (
                            <p style={{ margin: "5px 0" }}>
                              <strong>Email:</strong>{" "}
                              <a
                                href={`mailto:${outing.outing_lead_email}`}
                                style={{ color: "#1976d2" }}
                              >
                                {outing.outing_lead_email}
                              </a>
                            </p>
                          )}
                          {outing.outing_lead_phone && (
                            <p style={{ margin: "5px 0" }}>
                              <strong>Phone:</strong>{" "}
                              <a
                                href={`tel:${outing.outing_lead_phone}`}
                                style={{ color: "#1976d2" }}
                              >
                                {outing.outing_lead_phone}
                              </a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expandable Form Section */}
                {expandedOutingId === outing.id && selectedOuting && (
                  <form
                    onSubmit={handleSubmit}
                    style={{
                      padding: "20px",
                      backgroundColor: "#f5f5f5",
                      borderTop: "2px solid #1976d2",
                    }}
                  >
                    {/* Family Member Selection (for authenticated parents) */}
                    {isAuthenticated && isParent && showFamilySelection && (
                      <div
                        style={{
                          marginBottom: "30px",
                          padding: "20px",
                          border: "2px solid #4caf50",
                          borderRadius: "8px",
                          backgroundColor: "#f1f8f4",
                        }}
                      >
                        <h2>Select Participants from Your Family</h2>

                        {loadingFamilyMembers ? (
                          <div style={{ padding: "40px", textAlign: "center" }}>
                            <p
                              style={{
                                fontSize: "16px",
                                color: "#666",
                                marginBottom: "10px",
                              }}
                            >
                              🔄 Loading your family members...
                            </p>
                            <p style={{ fontSize: "14px", color: "#999" }}>
                              Please wait while we fetch your family information
                            </p>
                          </div>
                        ) : familyMembers.length === 0 ? (
                          <div
                            style={{
                              padding: "20px",
                              backgroundColor: "#fff3e0",
                              borderRadius: "8px",
                              border: "2px solid #ff9800",
                            }}
                          >
                            <p
                              style={{
                                margin: "0 0 15px 0",
                                fontSize: "16px",
                                color: "#e65100",
                                fontWeight: "bold",
                              }}
                            >
                              ⚠️ No family members found
                            </p>
                            <p style={{ margin: "0 0 15px 0", color: "#555" }}>
                              You need to add family members before you can sign
                              up for outings. Click the button below to go to
                              the Family Setup page and add your family members.
                            </p>
                            <button
                              type="button"
                              onClick={handleAddParticipant}
                              style={{
                                padding: "12px 24px",
                                backgroundColor: "#ff9800",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "bold",
                              }}
                            >
                              Go to Family Setup
                            </button>
                          </div>
                        ) : (
                          <>
                            <p style={{ marginBottom: "15px", color: "#555" }}>
                              Select one or more family members to sign up for
                              this outing
                            </p>

                            {/* Group parents and scouts separately */}
                            {(() => {
                              const adults = familyMembers.filter(
                                (m) => m.member_type === "adult"
                              );
                              const scouts = familyMembers.filter(
                                (m) => m.member_type === "scout"
                              );

                              return (
                                <>
                                  {adults.length > 0 && (
                                    <div style={{ marginBottom: "20px" }}>
                                      <h3
                                        style={{
                                          margin: "0 0 10px 0",
                                          fontSize: "16px",
                                          color: "#555",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        Adults
                                      </h3>
                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns:
                                            "repeat(auto-fill, minmax(200px, 1fr))",
                                          gap: "15px",
                                        }}
                                      >
                                        {adults.map((member) => {
                                          const isSelected =
                                            selectedFamilyMemberIds.includes(
                                              member.id
                                            );
                                          const isExpired =
                                            member.youth_protection_expired ===
                                            true;
                                          const canSelect = !isExpired;
                                          return (
                                            <div
                                              key={member.id}
                                              onClick={() =>
                                                canSelect &&
                                                handleToggleFamilyMember(
                                                  member.id
                                                )
                                              }
                                              style={{
                                                padding: "15px",
                                                border: isSelected
                                                  ? "2px solid #4caf50"
                                                  : isExpired
                                                  ? "2px solid #c62828"
                                                  : "1px solid #ddd",
                                                borderRadius: "8px",
                                                cursor: canSelect
                                                  ? "pointer"
                                                  : "not-allowed",
                                                backgroundColor: isSelected
                                                  ? "#e8f5e9"
                                                  : isExpired
                                                  ? "#ffebee"
                                                  : "white",
                                                transition: "all 0.2s",
                                                position: "relative",
                                                opacity: isExpired ? 0.7 : 1,
                                              }}
                                            >
                                              {isSelected && (
                                                <div
                                                  style={{
                                                    position: "absolute",
                                                    top: "8px",
                                                    right: "8px",
                                                    width: "24px",
                                                    height: "24px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "#4caf50",
                                                    color: "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "16px",
                                                    fontWeight: "bold",
                                                  }}
                                                >
                                                  ✓
                                                </div>
                                              )}
                                              <h3
                                                style={{
                                                  margin: "0 0 8px 0",
                                                  fontSize: "16px",
                                                }}
                                              >
                                                {member.name}
                                              </h3>
                                              <p
                                                style={{
                                                  margin: "4px 0",
                                                  fontSize: "14px",
                                                  color: "#666",
                                                }}
                                              >
                                                <strong>Type:</strong> Adult
                                              </p>
                                              {member.age && (
                                                <p
                                                  style={{
                                                    margin: "4px 0",
                                                    fontSize: "14px",
                                                    color: "#666",
                                                  }}
                                                >
                                                  <strong>Age:</strong>{" "}
                                                  {member.age}
                                                </p>
                                              )}
                                              {member.troop_number && (
                                                <p
                                                  style={{
                                                    margin: "4px 0",
                                                    fontSize: "14px",
                                                    color: "#666",
                                                  }}
                                                >
                                                  <strong>Troop:</strong>{" "}
                                                  {member.troop_number}
                                                </p>
                                              )}
                                              {member.vehicle_capacity !==
                                                undefined &&
                                                member.vehicle_capacity > 0 && (
                                                  <p
                                                    style={{
                                                      margin: "4px 0",
                                                      fontSize: "14px",
                                                      color: "#1976d2",
                                                      fontWeight: "bold",
                                                    }}
                                                  >
                                                    🚗 Can transport{" "}
                                                    {member.vehicle_capacity}{" "}
                                                    passenger
                                                    {member.vehicle_capacity !==
                                                    1
                                                      ? "s"
                                                      : ""}
                                                  </p>
                                                )}
                                              {member.has_youth_protection !==
                                                undefined && (
                                                <p
                                                  style={{
                                                    margin: "4px 0",
                                                    fontSize: "12px",
                                                    color:
                                                      member.youth_protection_expired
                                                        ? "#c62828"
                                                        : "#2e7d32",
                                                    fontWeight:
                                                      member.youth_protection_expired
                                                        ? "bold"
                                                        : "normal",
                                                  }}
                                                >
                                                  {member.youth_protection_expired
                                                    ? "⚠️ Youth Protection EXPIRED - Cannot Sign Up"
                                                    : member.has_youth_protection
                                                    ? "✓ Youth Protection Trained"
                                                    : ""}
                                                </p>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {scouts.length > 0 && (
                                    <div style={{ marginBottom: "15px" }}>
                                      <h3
                                        style={{
                                          margin: "0 0 10px 0",
                                          fontSize: "16px",
                                          color: "#555",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        Scouts
                                      </h3>
                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns:
                                            "repeat(auto-fill, minmax(200px, 1fr))",
                                          gap: "15px",
                                        }}
                                      >
                                        {scouts.map((member) => {
                                          const isSelected =
                                            selectedFamilyMemberIds.includes(
                                              member.id
                                            );
                                          return (
                                            <div
                                              key={member.id}
                                              onClick={() =>
                                                handleToggleFamilyMember(
                                                  member.id
                                                )
                                              }
                                              style={{
                                                padding: "15px",
                                                border: isSelected
                                                  ? "2px solid #4caf50"
                                                  : "1px solid #ddd",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                backgroundColor: isSelected
                                                  ? "#e8f5e9"
                                                  : "white",
                                                transition: "all 0.2s",
                                                position: "relative",
                                              }}
                                            >
                                              {isSelected && (
                                                <div
                                                  style={{
                                                    position: "absolute",
                                                    top: "8px",
                                                    right: "8px",
                                                    width: "24px",
                                                    height: "24px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "#4caf50",
                                                    color: "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "16px",
                                                    fontWeight: "bold",
                                                  }}
                                                >
                                                  ✓
                                                </div>
                                              )}
                                              <h3
                                                style={{
                                                  margin: "0 0 8px 0",
                                                  fontSize: "16px",
                                                }}
                                              >
                                                {member.name}
                                              </h3>
                                              <p
                                                style={{
                                                  margin: "4px 0",
                                                  fontSize: "14px",
                                                  color: "#666",
                                                }}
                                              >
                                                <strong>Type:</strong> Scout
                                              </p>
                                              {member.age && (
                                                <p
                                                  style={{
                                                    margin: "4px 0",
                                                    fontSize: "14px",
                                                    color: "#666",
                                                  }}
                                                >
                                                  <strong>Age:</strong>{" "}
                                                  {member.age}
                                                </p>
                                              )}
                                              {member.troop_number && (
                                                <p
                                                  style={{
                                                    margin: "4px 0",
                                                    fontSize: "14px",
                                                    color: "#666",
                                                  }}
                                                >
                                                  <strong>Troop:</strong>{" "}
                                                  {member.troop_number}
                                                </p>
                                              )}
                                              {/* Grubmaster Request Section */}
                                              {isSelected && (
                                                <div
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  style={{
                                                    marginTop: "12px",
                                                    paddingTop: "12px",
                                                    borderTop: "1px solid #ddd",
                                                  }}
                                                >
                                                  <label
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: "8px",
                                                      cursor: "pointer",
                                                      fontSize: "14px",
                                                    }}
                                                  >
                                                    <input
                                                      type="checkbox"
                                                      checked={
                                                        grubmasterRequests[
                                                          member.id
                                                        ]?.interest || false
                                                      }
                                                      onChange={(e) => {
                                                        setGrubmasterRequests(
                                                          (prev) => ({
                                                            ...prev,
                                                            [member.id]: {
                                                              ...prev[
                                                                member.id
                                                              ],
                                                              interest:
                                                                e.target
                                                                  .checked,
                                                            },
                                                          })
                                                        );
                                                      }}
                                                      style={{
                                                        width: "16px",
                                                        height: "16px",
                                                      }}
                                                    />
                                                    <span>
                                                      🍳 Volunteer as Grubmaster
                                                    </span>
                                                  </label>
                                                  {grubmasterRequests[member.id]
                                                    ?.interest && (
                                                    <select
                                                      value={
                                                        grubmasterRequests[
                                                          member.id
                                                        ]?.reason || ""
                                                      }
                                                      onChange={(e) => {
                                                        setGrubmasterRequests(
                                                          (prev) => ({
                                                            ...prev,
                                                            [member.id]: {
                                                              ...prev[
                                                                member.id
                                                              ],
                                                              reason:
                                                                e.target.value,
                                                            },
                                                          })
                                                        );
                                                      }}
                                                      style={{
                                                        marginTop: "8px",
                                                        padding: "6px 10px",
                                                        borderRadius: "4px",
                                                        border:
                                                          "1px solid #ddd",
                                                        fontSize: "13px",
                                                        width: "100%",
                                                      }}
                                                    >
                                                      <option value="">
                                                        Why do you want to be
                                                        grubmaster?
                                                      </option>
                                                      <option value="rank_requirement">
                                                        Rank Requirement
                                                      </option>
                                                      <option value="cooking_merit_badge">
                                                        Cooking Merit Badge
                                                      </option>
                                                      <option value="just_because">
                                                        Just Because - I Like to
                                                        Cook!
                                                      </option>
                                                    </select>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}

                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                onClick={handleConfirmSelection}
                                disabled={selectedFamilyMemberIds.length === 0}
                                style={{
                                  padding: "10px 20px",
                                  backgroundColor:
                                    selectedFamilyMemberIds.length === 0
                                      ? "#ccc"
                                      : "#4caf50",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor:
                                    selectedFamilyMemberIds.length === 0
                                      ? "not-allowed"
                                      : "pointer",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}
                              >
                                Continue with {selectedFamilyMemberIds.length}{" "}
                                Selected
                              </button>
                              <button
                                type="button"
                                onClick={handleAddParticipant}
                                style={{
                                  padding: "10px 20px",
                                  backgroundColor: "#2196f3",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}
                              >
                                + Add New Participant
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Back to Family Selection Button */}
                    {isAuthenticated &&
                      isParent &&
                      !showFamilySelection &&
                      !loadingFamilyMembers && (
                        <div style={{ marginBottom: "20px" }}>
                          <button
                            type="button"
                            onClick={handleBackToFamilySelection}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#757575",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            ← Back to Family Selection
                          </button>
                        </div>
                      )}

                    {/* Family Contact Information */}
                    <div
                      style={{
                        marginBottom: "30px",
                        padding: "20px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                      }}
                    >
                      <h2>Family Contact Information</h2>

                      <div style={{ marginBottom: "15px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "5px",
                            fontWeight: "bold",
                          }}
                        >
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleContactChange}
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "5px",
                            fontWeight: "bold",
                          }}
                        >
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleContactChange}
                          placeholder="(555) 123-4567"
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "14px",
                          }}
                        />
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginTop: "4px",
                            marginBottom: "0",
                          }}
                        >
                          Format: (XXX) XXX-XXXX
                        </p>
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "5px",
                            fontWeight: "bold",
                          }}
                        >
                          Emergency Contact Name *
                        </label>
                        <input
                          type="text"
                          name="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={handleContactChange}
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "5px",
                            fontWeight: "bold",
                          }}
                        >
                          Emergency Contact Phone *
                        </label>
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={handleContactChange}
                          placeholder="(555) 123-4567"
                          required
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "14px",
                          }}
                        />
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginTop: "4px",
                            marginBottom: "0",
                          }}
                        >
                          Format: (XXX) XXX-XXXX
                        </p>
                      </div>
                    </div>

                    {/* Selected Participants Summary */}
                    {!showFamilySelection &&
                      selectedFamilyMemberIds.length > 0 && (
                        <div
                          style={{
                            marginBottom: "30px",
                            padding: "20px",
                            border: "2px solid #4caf50",
                            borderRadius: "8px",
                            backgroundColor: "#f1f8f4",
                          }}
                        >
                          <h2
                            style={{ marginBottom: "10px", color: "#2e7d32" }}
                          >
                            Selected Participants (
                            {selectedFamilyMemberIds.length})
                          </h2>
                          <p
                            style={{
                              marginBottom: "15px",
                              fontSize: "14px",
                              color: "#555",
                              fontStyle: "italic",
                            }}
                          >
                            💡 Click on any participant to remove them from the
                            signup
                          </p>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px",
                              marginBottom: "15px",
                            }}
                          >
                            {familyMembers
                              .filter((fm) =>
                                selectedFamilyMemberIds.includes(fm.id)
                              )
                              .map((member) => (
                                <div
                                  key={member.id}
                                  onClick={() =>
                                    handleToggleFamilyMember(member.id)
                                  }
                                  style={{
                                    padding: "15px",
                                    backgroundColor: "white",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    cursor: "pointer",
                                    position: "relative",
                                    transition: "all 0.2s",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#ffebee";
                                    e.currentTarget.style.borderColor =
                                      "#f44336";
                                    e.currentTarget.style.transform =
                                      "translateX(-5px)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "white";
                                    e.currentTarget.style.borderColor = "#ddd";
                                    e.currentTarget.style.transform =
                                      "translateX(0)";
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "10px",
                                      right: "10px",
                                      width: "20px",
                                      height: "20px",
                                      borderRadius: "50%",
                                      backgroundColor: "#e0e0e0",
                                      color: "#757575",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "14px",
                                      fontWeight: "normal",
                                      opacity: "0.7",
                                      transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#f44336";
                                      e.currentTarget.style.color = "white";
                                      e.currentTarget.style.opacity = "1";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "#e0e0e0";
                                      e.currentTarget.style.color = "#757575";
                                      e.currentTarget.style.opacity = "0.7";
                                    }}
                                  >
                                    ✕
                                  </div>
                                  <p
                                    style={{
                                      margin: "5px 0",
                                      fontSize: "16px",
                                      paddingRight: "40px",
                                    }}
                                  >
                                    <strong>Name:</strong> {member.name}
                                  </p>
                                  <p
                                    style={{
                                      margin: "5px 0",
                                      fontSize: "16px",
                                    }}
                                  >
                                    <strong>Type:</strong>{" "}
                                    {member.member_type === "scout"
                                      ? "Scout"
                                      : "Adult"}
                                  </p>
                                  {member.troop_number && (
                                    <p
                                      style={{
                                        margin: "5px 0",
                                        fontSize: "16px",
                                      }}
                                    >
                                      <strong>Troop:</strong>{" "}
                                      {member.troop_number}
                                    </p>
                                  )}
                                </div>
                              ))}
                          </div>
                          <div
                            style={{
                              padding: "15px",
                              backgroundColor: "#fff3e0",
                              borderRadius: "6px",
                              border: "1px solid #ff9800",
                            }}
                          >
                            <p
                              style={{
                                margin: "0",
                                fontSize: "14px",
                                color: "#e65100",
                              }}
                            >
                              ℹ️ <strong>Need to add more participants?</strong>{" "}
                              Please go to the Family Setup page to add
                              additional family members, then return here to
                              sign them up for this outing.
                            </p>
                            <button
                              type="button"
                              onClick={handleAddParticipant}
                              style={{
                                marginTop: "12px",
                                padding: "10px 20px",
                                backgroundColor: "#ff9800",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "bold",
                              }}
                            >
                              Go to Family Setup
                            </button>
                          </div>
                        </div>
                      )}

                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          padding: "15px 30px",
                          backgroundColor: loading ? "#ccc" : "#1976d2",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: "18px",
                          fontWeight: "bold",
                          width: "100%",
                        }}
                      >
                        {loading ? "Submitting..." : "Submit Signup"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupForm;
