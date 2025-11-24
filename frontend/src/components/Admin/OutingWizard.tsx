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
          <div className="mt-5">
            <p className="text-secondary mb-5">
              Enter the basic information about your outing. This will help us
              suggest relevant rank requirements and merit badges.
            </p>
            <div className="grid gap-5">
              <div>
                <label className="block mb-1 font-semibold text-primary text-sm">
                  Outing Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Winter Camping at Pine Ridge"
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-semibold text-primary text-sm">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-primary text-sm">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-primary text-sm">
                  Location *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Camp Whispering Pines"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-primary text-sm">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the activities, goals, and what scouts will experience..."
                  rows={4}
                  className="form-textarea"
                />
                <small className="helper-text">
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

              <div className="grid grid-cols-2 gap-4">
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
          <div className="mt-5">
            <p className="text-secondary mb-5">
              Based on your outing details, we've identified relevant rank
              requirements and merit badges.
            </p>

            {loading && (
              <div className="text-center py-10">
                <div className="text-2xl">⏳</div>
                <p>Loading suggestions...</p>
              </div>
            )}

            {error && (
              <div className="p-4 mb-5 rounded border border-[rgba(255,193,7,0.3)] bg-[rgba(255,193,7,0.1)]">
                {error}
              </div>
            )}

            {suggestions && !loading && (
              <div className="grid grid-cols-2 gap-5">
                <div className="p-4 rounded-lg border border-[rgba(var(--bsa-olive-rgb),0.2)] bg-[rgba(var(--bsa-olive-rgb),0.05)]">
                  <h3 className="mt-0 flex items-center gap-2">
                    🏆 Rank Requirements
                  </h3>
                  <p className="text-secondary text-sm">
                    {suggestions.requirements.length} relevant requirements
                    found
                  </p>
                  {suggestions.requirements.slice(0, 3).map((req) => (
                    <div key={req.requirement.id} className="mt-2">
                      <div className="font-bold text-sm">
                        {req.requirement.rank} - {req.requirement.category}
                      </div>
                      <div className="text-xs text-secondary">
                        Match: {(req.match_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                  {suggestions.requirements.length > 3 && (
                    <p className="text-xs text-secondary mt-2">
                      +{suggestions.requirements.length - 3} more...
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-lg border border-[rgba(0,150,0,0.2)] bg-[rgba(0,150,0,0.05)]">
                  <h3 className="mt-0 flex items-center gap-2">
                    🎖️ Merit Badges
                  </h3>
                  <p className="text-secondary text-sm">
                    {suggestions.merit_badges.length} relevant badges found
                  </p>
                  {suggestions.merit_badges.slice(0, 3).map((badge) => (
                    <div key={badge.merit_badge.id} className="mt-2">
                      <div className="font-bold text-sm">
                        {badge.merit_badge.name}
                      </div>
                      <div className="text-xs text-secondary">
                        Match: {(badge.match_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                  {suggestions.merit_badges.length > 3 && (
                    <p className="text-xs text-secondary mt-2">
                      +{suggestions.merit_badges.length - 3} more...
                    </p>
                  )}
                </div>
              </div>
            )}

            {suggestions &&
              suggestions.requirements.length === 0 &&
              suggestions.merit_badges.length === 0 && (
                <div className="p-4 rounded border border-[rgba(33,150,243,0.3)] bg-[rgba(33,150,243,0.1)]">
                  No suggestions found. You can manually add requirements and
                  merit badges after creating the outing.
                </div>
              )}
          </div>
        );

      case 2:
        return (
          <div className="mt-5">
            <p className="text-secondary mb-5">
              Select the rank requirements and merit badges that scouts can work
              on during this outing.
            </p>

            {suggestions && (
              <div className="grid gap-8">
                <div>
                  <h3>🏆 Rank Requirements</h3>
                  {suggestions.requirements.length === 0 ? (
                    <p className="text-secondary">No suggestions available</p>
                  ) : (
                    <div className="grid gap-4">
                      {suggestions.requirements.map((req) => (
                        <div
                          key={req.requirement.id}
                          className={
                            `p-4 rounded-lg border border-card ` +
                            (selectedRequirements.has(req.requirement.id)
                              ? "bg-[rgba(var(--bsa-olive-rgb),0.05)]"
                              : "bg-tertiary")
                          }
                        >
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedRequirements.has(
                                req.requirement.id
                              )}
                              onChange={() => handleToggleRequirement(req)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-bold mb-1">
                                {req.requirement.rank} -{" "}
                                {req.requirement.category}
                                <span className="ml-2 text-xs py-0.5 px-2 rounded-xl bg-[rgba(var(--bsa-olive-rgb),0.2)]">
                                  {(req.match_score * 100).toFixed(0)}% match
                                </span>
                              </div>
                              <div className="text-sm text-secondary">
                                {req.requirement.requirement_text}
                              </div>
                            </div>
                          </label>
                          {selectedRequirements.has(req.requirement.id) && (
                            <div className="mt-2 ml-7">
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
                                className="form-input"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px bg-[var(--card-border)]" />

                <div>
                  <h3>🎖️ Merit Badges</h3>
                  {suggestions.merit_badges.length === 0 ? (
                    <p className="text-secondary">No suggestions available</p>
                  ) : (
                    <div className="grid gap-4">
                      {suggestions.merit_badges.map((badge) => (
                        <div
                          key={badge.merit_badge.id}
                          className={
                            `p-4 rounded-lg border border-card ` +
                            (selectedMeritBadges.has(badge.merit_badge.id)
                              ? "bg-[rgba(0,150,0,0.05)]"
                              : "bg-tertiary")
                          }
                        >
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMeritBadges.has(
                                badge.merit_badge.id
                              )}
                              onChange={() => handleToggleMeritBadge(badge)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-bold mb-1">
                                {badge.merit_badge.name}
                                <span className="ml-2 text-xs py-0.5 px-2 rounded-xl bg-[rgba(0,150,0,0.2)]">
                                  {(badge.match_score * 100).toFixed(0)}% match
                                </span>
                              </div>
                              <div className="text-sm text-secondary">
                                {badge.merit_badge.description}
                              </div>
                            </div>
                          </label>
                          {selectedMeritBadges.has(badge.merit_badge.id) && (
                            <div className="mt-2 ml-7">
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
                                className="form-input"
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
          <div className="mt-5">
            <p className="text-secondary mb-5">
              Configure additional details for the outing.
            </p>

            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-semibold text-primary text-sm">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) =>
                      setCapacity(parseInt(e.target.value) || 30)
                    }
                    min="1"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-primary text-sm">
                    Cost (optional)
                  </label>
                  <div className="flex items-center">
                    <span className="mr-2">$</span>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="form-input flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-primary text-sm">
                  Gear List
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={gearInput}
                    onChange={(e) => setGearInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddGear()}
                    placeholder="Add gear item..."
                    className="form-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddGear}
                    className="px-4 py-2 bg-bsa-olive text-white rounded cursor-pointer hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gearList.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 py-1 px-3 bg-tertiary border border-card rounded-2xl text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveGear(index)}
                        className="p-0 bg-transparent border-0 cursor-pointer text-secondary text-base hover:text-primary"
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
          <div className="mt-5">
            <p className="text-secondary mb-5">
              Review your outing details before creating.
            </p>

            <div className="grid gap-5">
              <div className="p-4 bg-tertiary rounded-lg">
                <h3 className="mt-0">Basic Information</h3>
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
                <div className="p-4 rounded-lg border border-[rgba(var(--bsa-olive-rgb),0.2)] bg-[rgba(var(--bsa-olive-rgb),0.05)]">
                  <h3 className="mt-0">
                    🏆 Rank Requirements ({selectedRequirements.size})
                  </h3>
                  {Array.from(selectedRequirements.entries()).map(
                    ([reqId, notes]) => {
                      const req = suggestions?.requirements.find(
                        (r) => r.requirement.id === reqId
                      );
                      return (
                        <div key={reqId} className="mb-2">
                          <div className="font-bold">
                            ✓ {req?.requirement.rank} -{" "}
                            {req?.requirement.category}
                          </div>
                          {notes && (
                            <div className="text-sm text-secondary ml-5">
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
                <div className="p-4 rounded-lg border border-[rgba(0,150,0,0.2)] bg-[rgba(0,150,0,0.05)]">
                  <h3 className="mt-0">
                    🎖️ Merit Badges ({selectedMeritBadges.size})
                  </h3>
                  {Array.from(selectedMeritBadges.entries()).map(
                    ([badgeId, notes]) => {
                      const badge = suggestions?.merit_badges.find(
                        (b) => b.merit_badge.id === badgeId
                      );
                      return (
                        <div key={badgeId} className="mb-2">
                          <div className="font-bold">
                            ✓ {badge?.merit_badge.name}
                          </div>
                          {notes && (
                            <div className="text-sm text-secondary ml-5">
                              {notes}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <div className="p-4 bg-tertiary rounded-lg">
                <h3 className="mt-0">Additional Details</h3>
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
                    <div className="flex flex-wrap gap-2 mt-2">
                      {gearList.map((item, index) => (
                        <span
                          key={index}
                          className="py-1 px-3 bg-secondary rounded-2xl text-sm"
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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-5 bg-[var(--bg-overlay)]"
      onClick={handleClose}
    >
      <div
        className="bg-primary rounded-lg max-w-[900px] w-full max-h-[90vh] overflow-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-card">
          <h2 className="m-0 text-primary text-xl font-bold">
            Create New Outing
          </h2>
          <p className="mt-1 text-secondary text-sm">
            Step {activeStep + 1} of {steps.length}
          </p>
        </div>

        {/* Stepper */}
        <div className="p-5 border-b border-card">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex-1 text-center relative">
                <div
                  className={
                    `w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-bold ` +
                    (index <= activeStep
                      ? "bg-bsa-olive text-white"
                      : "bg-tertiary text-secondary")
                  }
                >
                  {index < activeStep ? "✓" : index + 1}
                </div>
                <div
                  className={
                    `mt-1 text-xs ` +
                    (index <= activeStep ? "text-primary" : "text-secondary")
                  }
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[300px]">
          {error && (
            <div className="relative mb-5 rounded border border-error bg-[var(--alert-error-bg)] p-4 text-primary">
              {error}
              <button
                onClick={() => setError(null)}
                className="absolute top-2 right-3 text-secondary hover:text-primary text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-card flex justify-between">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2 border border-card rounded text-primary text-sm font-medium hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              className="px-5 py-2 border border-card rounded text-primary text-sm font-medium hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="px-5 py-2 rounded text-light text-sm font-bold bg-bsa-olive disabled:opacity-50 disabled:cursor-not-allowed"
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
