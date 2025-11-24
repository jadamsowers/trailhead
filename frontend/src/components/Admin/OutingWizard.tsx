import React, { useState, useEffect } from "react";
import type {
  OutingCreate,
  OutingSuggestions,
  RequirementSuggestion,
  MeritBadgeSuggestion,
  OutingRequirementCreate,
  OutingMeritBadgeCreate,
  Place,
} from "../../types";
import { outingAPI, requirementsAPI } from "../../services/api";
import { PlacePicker } from "./PlacePicker";

interface OutingWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = [
  "Basic Information",
  "View Suggestions",
  "Select Requirements",
  "Configure Details",
  "Review & Create",
];

export const OutingWizard: React.FC<OutingWizardProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<OutingSuggestions | null>(
    null
  );

  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Address fields
  const [outingAddress, setOutingAddress] = useState<{
    address?: string;
    placeId?: string;
    place?: Place;
  }>({});
  const [pickupAddress, setPickupAddress] = useState<{
    address?: string;
    placeId?: string;
    place?: Place;
  }>({});
  const [dropoffAddress, setDropoffAddress] = useState<{
    address?: string;
    placeId?: string;
    place?: Place;
  }>({});

  // Step 3: Selected Requirements/Badges
  const [selectedRequirements, setSelectedRequirements] = useState<
    Map<string, string>
  >(new Map());
  const [selectedMeritBadges, setSelectedMeritBadges] = useState<
    Map<string, string>
  >(new Map());

  // Step 4: Additional Details
  const [capacity, setCapacity] = useState<number>(30);
  const [gearList, setGearList] = useState<string[]>([]);
  const [gearInput, setGearInput] = useState("");
  const [cost, setCost] = useState<string>("");

  // Load suggestions when moving to step 2
  useEffect(() => {
    if (activeStep === 1 && name) {
      loadSuggestions();
    }
  }, [activeStep]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requirementsAPI.getPreviewSuggestions(
        name,
        description
      );
      setSuggestions(result);
    } catch (err) {
      console.error("Error loading suggestions:", err);
      setError("Failed to load suggestions. You can continue without them.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleToggleRequirement = (req: RequirementSuggestion) => {
    setSelectedRequirements((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(req.requirement.id)) {
        newMap.delete(req.requirement.id);
      } else {
        newMap.set(req.requirement.id, "");
      }
      return newMap;
    });
  };

  const handleToggleMeritBadge = (badge: MeritBadgeSuggestion) => {
    setSelectedMeritBadges((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(badge.merit_badge.id)) {
        newMap.delete(badge.merit_badge.id);
      } else {
        newMap.set(badge.merit_badge.id, "");
      }
      return newMap;
    });
  };

  const handleRequirementNotesChange = (
    requirementId: string,
    notes: string
  ) => {
    setSelectedRequirements((prev) => {
      const newMap = new Map(prev);
      newMap.set(requirementId, notes);
      return newMap;
    });
  };

  const handleMeritBadgeNotesChange = (badgeId: string, notes: string) => {
    setSelectedMeritBadges((prev) => {
      const newMap = new Map(prev);
      newMap.set(badgeId, notes);
      return newMap;
    });
  };

  const handleAddGear = () => {
    if (gearInput.trim()) {
      setGearList([...gearList, gearInput.trim()]);
      setGearInput("");
    }
  };

  const handleRemoveGear = (index: number) => {
    setGearList(gearList.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name || !startDate || !endDate || !location) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const outingData: OutingCreate = {
        name,
        outing_date: startDate,
        end_date: endDate,
        location,
        description: description || "",
        max_participants: capacity,
        capacity_type: "fixed",
        is_overnight: true,
        gear_list: gearList.length > 0 ? gearList.join(", ") : undefined,
        cost: cost ? parseFloat(cost) : undefined,
        outing_address: outingAddress.address,
        outing_place_id: outingAddress.placeId,
        pickup_address: pickupAddress.address,
        pickup_place_id: pickupAddress.placeId,
        dropoff_address: dropoffAddress.address,
        dropoff_place_id: dropoffAddress.placeId,
      };

      const newOuting = await outingAPI.create(outingData);

      // Add selected requirements
      for (const [requirementId, notes] of selectedRequirements.entries()) {
        const reqData: OutingRequirementCreate = {
          rank_requirement_id: requirementId,
          notes: notes || undefined,
        };
        await requirementsAPI.addRequirementToOuting(newOuting.id, reqData);
      }

      // Add selected merit badges
      for (const [badgeId, notes] of selectedMeritBadges.entries()) {
        const badgeData: OutingMeritBadgeCreate = {
          merit_badge_id: badgeId,
          notes: notes || undefined,
        };
        await requirementsAPI.addMeritBadgeToOuting(newOuting.id, badgeData);
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error creating outing:", err);
      setError("Failed to create outing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setName("");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setDescription("");
    setOutingAddress({});
    setPickupAddress({});
    setDropoffAddress({});
    setSelectedRequirements(new Map());
    setSelectedMeritBadges(new Map());
    setCapacity(30);
    setGearList([]);
    setGearInput("");
    setCost("");
    setSuggestions(null);
    setError(null);
    onClose();
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return name && startDate && endDate && location;
      default:
        return true;
    }
  };

  if (!open) return null;

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div style={{ marginTop: "20px" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Enter the basic information about your outing. This will help us
              suggest relevant rank requirements and merit badges.
            </p>

            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Outing Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Winter Camping at Pine Ridge"
                  style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: "14px",
                    border: "1px solid var(--input-border)",
                    borderRadius: "4px",
                    backgroundColor: "var(--input-bg)",
                    color: "var(--input-text)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "14px",
                      border: "1px solid var(--input-border)",
                      borderRadius: "4px",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "14px",
                      border: "1px solid var(--input-border)",
                      borderRadius: "4px",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Location *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Camp Whispering Pines"
                  style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: "14px",
                    border: "1px solid var(--input-border)",
                    borderRadius: "4px",
                    backgroundColor: "var(--input-bg)",
                    color: "var(--input-text)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the activities, goals, and what scouts will experience..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: "14px",
                    border: "1px solid var(--input-border)",
                    borderRadius: "4px",
                    backgroundColor: "var(--input-bg)",
                    color: "var(--input-text)",
                  }}
                />
                <small style={{ color: "var(--text-secondary)" }}>
                  A detailed description helps us suggest better requirements
                  and merit badges
                </small>
              </div>

              <div>
                <PlacePicker
                  label="Outing Address"
                  value={outingAddress}
                  onChange={setOutingAddress}
                  helperText="Where is the outing taking place?"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div>
                  <PlacePicker
                    label="Pickup Location"
                    value={pickupAddress}
                    onChange={setPickupAddress}
                    helperText="Where do scouts/families meet?"
                  />
                </div>
                <div>
                  <PlacePicker
                    label="Drop-off Location"
                    value={dropoffAddress}
                    onChange={setDropoffAddress}
                    helperText="Where are scouts dropped off after?"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div style={{ marginTop: "20px" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Based on your outing details, we've identified relevant rank
              requirements and merit badges.
            </p>

            {loading && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "24px" }}>⏳</div>
                <p>Loading suggestions...</p>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "rgba(255, 193, 7, 0.1)",
                  border: "1px solid rgba(255, 193, 7, 0.3)",
                  borderRadius: "4px",
                  marginBottom: "20px",
                }}
              >
                {error}
              </div>
            )}

            {suggestions && !loading && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    padding: "15px",
                    backgroundColor: "rgba(var(--bsa-olive-rgb), 0.05)",
                    borderRadius: "8px",
                    border: "1px solid rgba(var(--bsa-olive-rgb), 0.2)",
                  }}
                >
                  <h3
                    style={{
                      marginTop: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    🏆 Rank Requirements
                  </h3>
                  <p
                    style={{ color: "var(--text-secondary)", fontSize: "14px" }}
                  >
                    {suggestions.requirements.length} relevant requirements
                    found
                  </p>
                  {suggestions.requirements.slice(0, 3).map((req) => (
                    <div key={req.requirement.id} style={{ marginTop: "10px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                        {req.requirement.rank} - {req.requirement.category}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Match: {(req.match_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                  {suggestions.requirements.length > 3 && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        marginTop: "10px",
                      }}
                    >
                      +{suggestions.requirements.length - 3} more...
                    </p>
                  )}
                </div>

                <div
                  style={{
                    padding: "15px",
                    backgroundColor: "rgba(0, 150, 0, 0.05)",
                    borderRadius: "8px",
                    border: "1px solid rgba(0, 150, 0, 0.2)",
                  }}
                >
                  <h3
                    style={{
                      marginTop: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    🎖️ Merit Badges
                  </h3>
                  <p
                    style={{ color: "var(--text-secondary)", fontSize: "14px" }}
                  >
                    {suggestions.merit_badges.length} relevant badges found
                  </p>
                  {suggestions.merit_badges.slice(0, 3).map((badge) => (
                    <div
                      key={badge.merit_badge.id}
                      style={{ marginTop: "10px" }}
                    >
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                        {badge.merit_badge.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Match: {(badge.match_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                  {suggestions.merit_badges.length > 3 && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        marginTop: "10px",
                      }}
                    >
                      +{suggestions.merit_badges.length - 3} more...
                    </p>
                  )}
                </div>
              </div>
            )}

            {suggestions &&
              suggestions.requirements.length === 0 &&
              suggestions.merit_badges.length === 0 && (
                <div
                  style={{
                    padding: "15px",
                    backgroundColor: "rgba(33, 150, 243, 0.1)",
                    border: "1px solid rgba(33, 150, 243, 0.3)",
                    borderRadius: "4px",
                  }}
                >
                  No suggestions found. You can manually add requirements and
                  merit badges after creating the outing.
                </div>
              )}
          </div>
        );

      case 2:
        return (
          <div style={{ marginTop: "20px" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Select the rank requirements and merit badges that scouts can work
              on during this outing.
            </p>

            {suggestions && (
              <div style={{ display: "grid", gap: "30px" }}>
                <div>
                  <h3>🏆 Rank Requirements</h3>
                  {suggestions.requirements.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>
                      No suggestions available
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: "15px" }}>
                      {suggestions.requirements.map((req) => (
                        <div
                          key={req.requirement.id}
                          style={{
                            padding: "15px",
                            border: "1px solid var(--card-border)",
                            borderRadius: "8px",
                            backgroundColor: selectedRequirements.has(
                              req.requirement.id
                            )
                              ? "rgba(var(--bsa-olive-rgb), 0.05)"
                              : "var(--bg-tertiary)",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "start",
                              gap: "10px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRequirements.has(
                                req.requirement.id
                              )}
                              onChange={() => handleToggleRequirement(req)}
                              style={{ marginTop: "4px" }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: "bold",
                                  marginBottom: "5px",
                                }}
                              >
                                {req.requirement.rank} -{" "}
                                {req.requirement.category}
                                <span
                                  style={{
                                    marginLeft: "10px",
                                    fontSize: "12px",
                                    padding: "2px 8px",
                                    backgroundColor:
                                      "rgba(var(--bsa-olive-rgb), 0.2)",
                                    borderRadius: "12px",
                                  }}
                                >
                                  {(req.match_score * 100).toFixed(0)}% match
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {req.requirement.requirement_text}
                              </div>
                            </div>
                          </label>
                          {selectedRequirements.has(req.requirement.id) && (
                            <div
                              style={{ marginTop: "10px", marginLeft: "30px" }}
                            >
                              <input
                                type="text"
                                placeholder="Add specific details or instructions (optional)..."
                                value={
                                  selectedRequirements.get(
                                    req.requirement.id
                                  ) || ""
                                }
                                onChange={(e) =>
                                  handleRequirementNotesChange(
                                    req.requirement.id,
                                    e.target.value
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  fontSize: "14px",
                                  border: "1px solid var(--input-border)",
                                  borderRadius: "4px",
                                  backgroundColor: "var(--input-bg)",
                                  color: "var(--input-text)",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    height: "1px",
                    backgroundColor: "var(--card-border)",
                  }}
                />

                <div>
                  <h3>🎖️ Merit Badges</h3>
                  {suggestions.merit_badges.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>
                      No suggestions available
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: "15px" }}>
                      {suggestions.merit_badges.map((badge) => (
                        <div
                          key={badge.merit_badge.id}
                          style={{
                            padding: "15px",
                            border: "1px solid var(--card-border)",
                            borderRadius: "8px",
                            backgroundColor: selectedMeritBadges.has(
                              badge.merit_badge.id
                            )
                              ? "rgba(0, 150, 0, 0.05)"
                              : "var(--bg-tertiary)",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "start",
                              gap: "10px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedMeritBadges.has(
                                badge.merit_badge.id
                              )}
                              onChange={() => handleToggleMeritBadge(badge)}
                              style={{ marginTop: "4px" }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: "bold",
                                  marginBottom: "5px",
                                }}
                              >
                                {badge.merit_badge.name}
                                <span
                                  style={{
                                    marginLeft: "10px",
                                    fontSize: "12px",
                                    padding: "2px 8px",
                                    backgroundColor: "rgba(0, 150, 0, 0.2)",
                                    borderRadius: "12px",
                                  }}
                                >
                                  {(badge.match_score * 100).toFixed(0)}% match
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {badge.merit_badge.description}
                              </div>
                            </div>
                          </label>
                          {selectedMeritBadges.has(badge.merit_badge.id) && (
                            <div
                              style={{ marginTop: "10px", marginLeft: "30px" }}
                            >
                              <input
                                type="text"
                                placeholder="Add specific details or instructions (optional)..."
                                value={
                                  selectedMeritBadges.get(
                                    badge.merit_badge.id
                                  ) || ""
                                }
                                onChange={(e) =>
                                  handleMeritBadgeNotesChange(
                                    badge.merit_badge.id,
                                    e.target.value
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  fontSize: "14px",
                                  border: "1px solid var(--input-border)",
                                  borderRadius: "4px",
                                  backgroundColor: "var(--input-bg)",
                                  color: "var(--input-text)",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div style={{ marginTop: "20px" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Configure additional details for the outing.
            </p>

            <div style={{ display: "grid", gap: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) =>
                      setCapacity(parseInt(e.target.value) || 30)
                    }
                    min="1"
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "14px",
                      border: "1px solid var(--input-border)",
                      borderRadius: "4px",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Cost (optional)
                  </label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: "8px" }}>$</span>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      style={{
                        flex: 1,
                        padding: "8px",
                        fontSize: "14px",
                        border: "1px solid var(--input-border)",
                        borderRadius: "4px",
                        backgroundColor: "var(--input-bg)",
                        color: "var(--input-text)",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Gear List
                </label>
                <div
                  style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
                >
                  <input
                    type="text"
                    value={gearInput}
                    onChange={(e) => setGearInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddGear()}
                    placeholder="Add gear item..."
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "14px",
                      border: "1px solid var(--input-border)",
                      borderRadius: "4px",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddGear}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "var(--bsa-olive)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {gearList.map((item, index) => (
                    <span
                      key={index}
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "var(--bg-tertiary)",
                        border: "1px solid var(--card-border)",
                        borderRadius: "16px",
                        fontSize: "14px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveGear(index)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0",
                          color: "var(--text-secondary)",
                          fontSize: "16px",
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ marginTop: "20px" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Review your outing details before creating.
            </p>

            <div style={{ display: "grid", gap: "20px" }}>
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Basic Information</h3>
                <p>
                  <strong>Name:</strong> {name}
                </p>
                <p>
                  <strong>Dates:</strong>{" "}
                  {new Date(startDate).toLocaleDateString()} -{" "}
                  {new Date(endDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Location:</strong> {location}
                </p>
                {description && (
                  <p>
                    <strong>Description:</strong> {description}
                  </p>
                )}
                {outingAddress.address && (
                  <p>
                    <strong>Outing Address:</strong>{" "}
                    {outingAddress.place
                      ? outingAddress.place.name
                      : outingAddress.address}
                  </p>
                )}
                {pickupAddress.address && (
                  <p>
                    <strong>Pickup:</strong>{" "}
                    {pickupAddress.place
                      ? pickupAddress.place.name
                      : pickupAddress.address}
                  </p>
                )}
                {dropoffAddress.address && (
                  <p>
                    <strong>Drop-off:</strong>{" "}
                    {dropoffAddress.place
                      ? dropoffAddress.place.name
                      : dropoffAddress.address}
                  </p>
                )}
              </div>

              {selectedRequirements.size > 0 && (
                <div
                  style={{
                    padding: "15px",
                    backgroundColor: "rgba(var(--bsa-olive-rgb), 0.05)",
                    borderRadius: "8px",
                    border: "1px solid rgba(var(--bsa-olive-rgb), 0.2)",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    🏆 Rank Requirements ({selectedRequirements.size})
                  </h3>
                  {Array.from(selectedRequirements.entries()).map(
                    ([reqId, notes]) => {
                      const req = suggestions?.requirements.find(
                        (r) => r.requirement.id === reqId
                      );
                      return (
                        <div key={reqId} style={{ marginBottom: "10px" }}>
                          <div style={{ fontWeight: "bold" }}>
                            ✓ {req?.requirement.rank} -{" "}
                            {req?.requirement.category}
                          </div>
                          {notes && (
                            <div
                              style={{
                                fontSize: "14px",
                                color: "var(--text-secondary)",
                                marginLeft: "20px",
                              }}
                            >
                              {notes}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {selectedMeritBadges.size > 0 && (
                <div
                  style={{
                    padding: "15px",
                    backgroundColor: "rgba(0, 150, 0, 0.05)",
                    borderRadius: "8px",
                    border: "1px solid rgba(0, 150, 0, 0.2)",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    🎖️ Merit Badges ({selectedMeritBadges.size})
                  </h3>
                  {Array.from(selectedMeritBadges.entries()).map(
                    ([badgeId, notes]) => {
                      const badge = suggestions?.merit_badges.find(
                        (b) => b.merit_badge.id === badgeId
                      );
                      return (
                        <div key={badgeId} style={{ marginBottom: "10px" }}>
                          <div style={{ fontWeight: "bold" }}>
                            ✓ {badge?.merit_badge.name}
                          </div>
                          {notes && (
                            <div
                              style={{
                                fontSize: "14px",
                                color: "var(--text-secondary)",
                                marginLeft: "20px",
                              }}
                            >
                              {notes}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <div
                style={{
                  padding: "15px",
                  backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Additional Details</h3>
                <p>
                  <strong>Capacity:</strong> {capacity} participants
                </p>
                {cost && (
                  <p>
                    <strong>Cost:</strong> ${cost}
                  </p>
                )}
                {gearList.length > 0 && (
                  <div>
                    <p>
                      <strong>Gear List:</strong>
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginTop: "8px",
                      }}
                    >
                      {gearList.map((item, index) => (
                        <span
                          key={index}
                          style={{
                            padding: "4px 12px",
                            backgroundColor: "var(--bg-secondary)",
                            borderRadius: "16px",
                            fontSize: "14px",
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          borderRadius: "8px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          <h2 style={{ margin: 0, color: "var(--text-primary)" }}>
            Create New Outing
          </h2>
          <p
            style={{
              margin: "5px 0 0",
              color: "var(--text-secondary)",
              fontSize: "14px",
            }}
          >
            Step {activeStep + 1} of {steps.length}
          </p>
        </div>

        {/* Stepper */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {steps.map((step, index) => (
              <div
                key={step}
                style={{
                  flex: 1,
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor:
                      index <= activeStep
                        ? "var(--bsa-olive)"
                        : "var(--bg-tertiary)",
                    color:
                      index <= activeStep ? "white" : "var(--text-secondary)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  {index < activeStep ? "✓" : index + 1}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    marginTop: "5px",
                    color:
                      index <= activeStep
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px", minHeight: "300px" }}>
          {error && (
            <div
              style={{
                padding: "15px",
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                border: "1px solid rgba(244, 67, 54, 0.3)",
                borderRadius: "4px",
                marginBottom: "20px",
                color: "var(--text-primary)",
              }}
            >
              {error}
              <button
                onClick={() => setError(null)}
                style={{
                  float: "right",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "var(--text-secondary)",
                }}
              >
                ×
              </button>
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid var(--card-border)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--card-border)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "var(--text-primary)",
                border: "1px solid var(--card-border)",
                borderRadius: "4px",
                cursor: activeStep === 0 || loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                opacity: activeStep === 0 || loading ? 0.5 : 1,
              }}
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              style={{
                padding: "10px 20px",
                backgroundColor: "var(--bsa-olive)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: !isStepValid() || loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                opacity: !isStepValid() || loading ? 0.5 : 1,
              }}
            >
              {loading
                ? "⏳"
                : activeStep === steps.length - 1
                ? "✓ Create Outing"
                : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutingWizard;
