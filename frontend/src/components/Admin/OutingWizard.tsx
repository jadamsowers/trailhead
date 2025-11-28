import React, { useState, useEffect } from "react";
import { OutingsService } from "../../client";
import type { OutingCreate } from "../../client";
import type {
  OutingSuggestions,
  OutingRequirementCreate,
  OutingMeritBadgeCreate,
  Place,
  RankRequirement,
  MeritBadge,
  PackingListTemplate,
  PackingListTemplateWithItems,
} from "../../types";
import { requirementsAPI, packingListAPI } from "../../services/api";
import { PlacePicker } from "./PlacePicker";
import {
  OutingIconPicker,
  suggestIconFromName,
  OUTING_ICONS,
} from "../OutingIconPicker";

interface OutingWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = [
  "Basic Information",
  "Requirements & Suggestions",
  "Packing List",
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
  // Fallback catalogs when suggestions unavailable
  const [allRequirements, setAllRequirements] = useState<RankRequirement[]>([]);
  const [allMeritBadges, setAllMeritBadges] = useState<MeritBadge[]>([]);

  // Manual selection visibility
  const [showManualRequirements, setShowManualRequirements] = useState(false);
  const [showManualBadges, setShowManualBadges] = useState(false);

  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [dropoffTime, setDropoffTime] = useState<string>("17:30");
  const [pickupTime, setPickupTime] = useState<string>("11:30");
  const [isDayTrip, setIsDayTrip] = useState(false);

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

  // Step 4: Packing Lists
  const [packingListTemplates, setPackingListTemplates] = useState<
    PackingListTemplate[]
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<PackingListTemplateWithItems | null>(null);
  const [customPackingItems, setCustomPackingItems] = useState<
    Array<{ name: string; quantity: number }>
  >([]);
  const [packingItemInput, setPackingItemInput] = useState("");
  const [packingItemQuantity, setPackingItemQuantity] = useState("1");

  // Step 5: Additional Details
  const [capacityType, setCapacityType] = useState<"fixed" | "vehicle">(
    "fixed"
  );
  const [capacity, setCapacity] = useState<number>(30);
  const [cost, setCost] = useState<string>("");
  const [signupCloseDate, setSignupCloseDate] = useState<string>("");
  const [cancellationDeadline, setCancellationDeadline] = useState<string>("");
  const [icon, setIcon] = useState<string>("");

  // Food budget fields for grubmaster functionality
  const [foodBudgetPerPerson, setFoodBudgetPerPerson] = useState<string>("8");
  const [mealCount, setMealCount] = useState<string>("4");
  const [budgetType, setBudgetType] = useState<"total" | "per_meal">(
    "per_meal"
  );

  // Load suggestions when moving to step 2
  useEffect(() => {
    if (activeStep === 1) {
      if (name && !suggestions) {
        loadSuggestions();
      }
      if (!allRequirements.length || !allMeritBadges.length) {
        (async () => {
          try {
            setLoading(true);
            const [reqs, badges] = await Promise.all([
              requirementsAPI.getRankRequirements(),
              requirementsAPI.getMeritBadges(),
            ]);
            setAllRequirements(reqs);
            setAllMeritBadges(badges);
          } catch (e) {
            console.error("Failed loading catalogs", e);
          } finally {
            setLoading(false);
          }
        })();
      }
    }
    if (activeStep === 2) {
      // Load packing list templates
      (async () => {
        try {
          setLoading(true);
          const response = await packingListAPI.getTemplates();
          setPackingListTemplates(response.items);
        } catch (e) {
          console.error("Failed loading packing list templates", e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [activeStep]);

  // Auto-calculate signup close date (2 weeks before start date)
  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      const closeDate = new Date(start);
      closeDate.setDate(closeDate.getDate() - 14); // 2 weeks before
      setSignupCloseDate(closeDate.toISOString().split("T")[0]);

      // Default cancellation deadline to 1 week before
      const cancelDate = new Date(start);
      cancelDate.setDate(cancelDate.getDate() - 7);
      setCancellationDeadline(cancelDate.toISOString().split("T")[0]);
    }
  }, [startDate]);

  // Auto-suggest icon based on outing name
  useEffect(() => {
    if (name && !icon) {
      const suggested = suggestIconFromName(name);
      if (suggested) {
        setIcon(suggested);
      }
    }
  }, [name]);

  // If this is a day trip, keep endDate synced to startDate so the picker evaluates immediately
  useEffect(() => {
    if (isDayTrip && startDate) {
      setEndDate(startDate);
    }
  }, [isDayTrip, startDate]);

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
        capacity_type: capacityType,
        is_overnight: true,
        cost: cost ? parseFloat(cost) : undefined,
        icon: icon || undefined,
        outing_address: outingAddress.address,
        outing_place_id: outingAddress.placeId,
        pickup_address: pickupAddress.address,
        pickup_place_id: pickupAddress.placeId,
        dropoff_address: dropoffAddress.address,
        dropoff_place_id: dropoffAddress.placeId,
        drop_off_time: dropoffTime,
        pickup_time: pickupTime,
        signups_close_at: signupCloseDate
          ? `${signupCloseDate}T23:59:59Z`
          : undefined,
        cancellation_deadline: cancellationDeadline
          ? `${cancellationDeadline}T23:59:59Z`
          : undefined,
        food_budget_per_person: foodBudgetPerPerson
          ? budgetType === "per_meal" && mealCount
            ? Number(foodBudgetPerPerson) * parseInt(mealCount)
            : Number(foodBudgetPerPerson)
          : undefined,
        meal_count: mealCount ? parseInt(mealCount) : undefined,
        budget_type: budgetType,
      };

      const newOuting = await OutingsService.createOutingApiOutingsPost(
        outingData
      );

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

      // Create packing list if template selected
      if (selectedTemplateId) {
        try {
          const packingList = await packingListAPI.addToOuting(newOuting.id, {
            template_id: selectedTemplateId,
          });

          // Add custom items to the packing list
          for (const customItem of customPackingItems) {
            await packingListAPI.addCustomItem(newOuting.id, packingList.id, {
              name: customItem.name,
              quantity: customItem.quantity,
              checked: false,
            });
          }
        } catch (err) {
          console.error("Error creating packing list:", err);
          // Don't fail the whole outing creation if packing list fails
        }
      }

      onSuccess();
      handleClose(true); // Force close after successful creation
    } catch (err) {
      console.error("Error creating outing:", err);
      setError("Failed to create outing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (force: boolean = false) => {
    // Check if user has entered any data
    const hasData =
      name ||
      startDate ||
      endDate ||
      location ||
      icon ||
      description ||
      outingAddress.address ||
      pickupAddress.address ||
      dropoffAddress.address ||
      selectedRequirements.size > 0 ||
      selectedMeritBadges.size > 0 ||
      cost;

    if (!force && hasData) {
      const confirmed = window.confirm(
        "Are you sure you want to close? All unsaved changes will be lost."
      );
      if (!confirmed) return;
    }

    setActiveStep(0);
    setName("");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setDescription("");
    setDropoffTime("");
    setPickupTime("");
    setOutingAddress({});
    setPickupAddress({});
    setDropoffAddress({});
    setSelectedRequirements(new Map());
    setSelectedMeritBadges(new Map());
    setCapacityType("fixed");
    setCapacity(30);
    setCapacity(30);
    setCost("");
    setSignupCloseDate("");
    setCancellationDeadline("");
    setIcon("");
    setFoodBudgetPerPerson("8");
    setMealCount("4");
    setBudgetType("per_meal");
    setSuggestions(null);
    setError(null);
    onClose();
  };

  const handleBackdropClick = () => {
    handleClose(false);
  };

  const isStepValid = () => {
    // Validate basic required fields and date logic for step 0
    if (activeStep === 0) {
      // Ensure all required fields are present
      if (!name || !startDate || !endDate || !location) {
        return false;
      }
      // Compare dates using date-only (midnight) to avoid time-of-day issues
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      // Start date must be today or after (allow same-day outings)
      if (start < today) {
        return false;
      }
      // End date must be same or after start date (allow same-day for day trips handled elsewhere)
      if (end < start) {
        return false;
      }
      return true;
    }
    return true;
  };

  // Return validation flags/messages for date inputs to show immediate feedback
  const getDateErrors = () => {
    const result = {
      startError: false as boolean,
      startMessage: "" as string,
      endError: false as boolean,
      endMessage: "" as string,
    };

    if (!startDate) return result;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    let e: Date | null = null;
    if (endDate) {
      e = new Date(endDate);
      e.setHours(0, 0, 0, 0);
    }

    if (s < today) {
      result.startError = true;
      result.startMessage = "Start date must be today or in the future";
    }

    if (e && e < s) {
      result.endError = true;
      result.endMessage = "End date must be the same or after the start date";
    }

    return result;
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
              <div>
                <label className="block mb-1 font-semibold text-primary text-sm">
                  Icon
                </label>
                <OutingIconPicker value={icon} onChange={setIcon} />
                <small className="helper-text">
                  An icon is automatically suggested based on your outing name
                </small>
              </div>
              {(() => {
                const { startError, startMessage, endError, endMessage } =
                  getDateErrors();
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-semibold text-primary text-sm">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`form-input ${
                          startError ? "ring-2 ring-red-500" : ""
                        }`}
                      />
                      {startError && (
                        <p className="text-xs text-red-600 mt-1">
                          {startMessage}
                        </p>
                      )}
                    </div>

                    {!isDayTrip && (
                      <div>
                        <label className="block mb-1 font-semibold text-primary text-sm">
                          End Date *
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          className={`form-input ${
                            endError ? "ring-2 ring-red-500" : ""
                          }`}
                        />
                        {endError && (
                          <p className="text-xs text-red-600 mt-1">
                            {endMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isDayTrip}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsDayTrip(checked);
                      if (checked) {
                        setEndDate(startDate);
                      }
                    }}
                  />
                  Day‑trip (same start & end date)
                </label>
              </div>{" "}
              <div>
                <PlacePicker
                  label="Outing Location *"
                  value={outingAddress}
                  onChange={(val) => {
                    setOutingAddress(val);
                    const newLocation = val.place?.name || val.address || "";
                    setLocation(newLocation);
                  }}
                  helperText={
                    "Search saved places or enter a new one. When entering manually, use two lines: street on the first line, city and state on the second (ZIP optional)."
                  }
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
              {/* Outing address is now combined with Outing Location above */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <PlacePicker
                    label="Drop-off Location"
                    value={dropoffAddress}
                    onChange={setDropoffAddress}
                    helperText={
                      "Where are scouts dropped off after? Use the two-line address format when entering manually."
                    }
                  />
                </div>
                <div>
                  <PlacePicker
                    label="Pickup Location"
                    value={pickupAddress}
                    onChange={setPickupAddress}
                    helperText={
                      "Where do scouts/families meet? Use the two-line address format when entering manually."
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-semibold text-primary text-sm">
                    Drop-off Time
                  </label>
                  <input
                    type="time"
                    value={dropoffTime}
                    onChange={(e) => setDropoffTime(e.target.value)}
                    className="form-input"
                  />
                  <small className="helper-text">
                    When should scouts arrive for departure?
                  </small>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-primary text-sm">
                    Pickup Time
                  </label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="form-input"
                  />
                  <small className="helper-text">
                    When should families pick up scouts?
                  </small>
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
              requirements and merit badges. Select the ones scouts can work on
              during this outing.
            </p>
            {loading && (
              <div className="text-center py-10">
                <div className="text-2xl">⏳</div>
                <p>Loading suggestions and catalogs...</p>
              </div>
            )}
            {error && (
              <div className="p-4 mb-5 rounded border border-[rgba(255,193,7,0.3)] bg-[rgba(255,193,7,0.1)]">
                {error}
              </div>
            )}
            {(suggestions ||
              allRequirements.length > 0 ||
              allMeritBadges.length > 0) &&
              !loading && (
                <div className="grid gap-8">
                  {/* Suggestions summary */}
                  {suggestions && (
                    <div className="grid grid-cols-2 gap-5 mb-8">
                      <div className="p-4 rounded-lg border border-[rgba(var(--bsa-olive-rgb),0.2)] bg-[rgba(var(--bsa-olive-rgb),0.05)]">
                        <h3 className="mt-0 flex items-center gap-2">
                          🏆 Suggested Rank Requirements
                        </h3>
                        <p className="text-secondary text-sm">
                          {suggestions.requirements.length} relevant
                          requirements found
                        </p>
                        {suggestions.requirements.slice(0, 3).map((req) => (
                          <div key={req.id} className="mt-2">
                            <div className="font-bold text-sm">
                              {req.rank} {req.requirement_number}
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
                          🎖️ Suggested Merit Badges
                        </h3>
                        <p className="text-secondary text-sm">
                          {suggestions.merit_badges.length} relevant badges
                          found
                        </p>
                        {suggestions.merit_badges
                          .slice(0, 3)
                          .map((badge, idx) => (
                            <div key={badge.name || idx} className="mt-2">
                              <div className="font-bold text-sm">
                                {badge.name}
                                {badge.eagle_required && (
                                  <span className="ml-2 text-xs">🦅</span>
                                )}
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
                  {/* Requirements selection */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="m-0">🏆 Rank Requirements</h3>
                      {(suggestions
                        ? suggestions.requirements.length > 0
                        : allRequirements.length > 0) && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const allReqs = suggestions
                                ? suggestions.requirements.map((r) => r.id)
                                : allRequirements.map((r) => r.id);
                              setSelectedRequirements((prev) => {
                                const newMap = new Map(prev);
                                allReqs.forEach((id) => {
                                  if (!newMap.has(id)) {
                                    newMap.set(id, "");
                                  }
                                });
                                return newMap;
                              });
                            }}
                            className="text-xs px-3 py-1 rounded border border-bsa-olive text-bsa-olive hover:bg-[rgba(var(--bsa-olive-rgb),0.1)]"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRequirements(new Map())}
                            className="text-xs px-3 py-1 rounded border border-card text-secondary hover:bg-tertiary"
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>
                    {(
                      suggestions
                        ? suggestions.requirements.length === 0
                        : allRequirements.length === 0
                    ) ? (
                      <p className="text-secondary">
                        No requirements available
                      </p>
                    ) : (
                      <div className="grid gap-4">
                        {(suggestions
                          ? suggestions.requirements.map((r) => ({
                              id: r.id,
                              rank: r.rank,
                              requirement_number: r.requirement_number,
                              requirement_text: r.description,
                              category: "",
                              match_score: r.match_score,
                              matched_keywords: r.matched_keywords,
                              isFlattened: true,
                            }))
                          : allRequirements.map((r) => ({
                              id: r.id,
                              rank: r.rank,
                              requirement_number: r.requirement_number,
                              requirement_text: r.requirement_text,
                              category: r.category || "",
                              match_score: 0,
                              matched_keywords: [] as string[],
                              isFlattened: false,
                            }))
                        ).map((reqObj) => {
                          const id = reqObj.id;
                          return (
                            <div
                              key={id}
                              className={
                                `p-4 rounded-lg border border-card ` +
                                (selectedRequirements.has(id)
                                  ? "bg-[rgba(var(--bsa-olive-rgb),0.05)]"
                                  : "bg-tertiary")
                              }
                            >
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedRequirements.has(id)}
                                  onChange={() => {
                                    setSelectedRequirements((prev) => {
                                      const newMap = new Map(prev);
                                      if (newMap.has(id)) {
                                        newMap.delete(id);
                                      } else {
                                        newMap.set(id, "");
                                      }
                                      return newMap;
                                    });
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="font-bold mb-1">
                                    {reqObj.rank} {reqObj.requirement_number}
                                    {reqObj.category && ` - ${reqObj.category}`}
                                    {suggestions && reqObj.match_score > 0 && (
                                      <span className="ml-2 text-xs py-0.5 px-2 rounded-xl bg-[rgba(var(--bsa-olive-rgb),0.2)]">
                                        {(reqObj.match_score * 100).toFixed(0)}%
                                        match
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-secondary">
                                    {reqObj.requirement_text}
                                  </div>
                                </div>
                              </label>
                              {selectedRequirements.has(id) && (
                                <div className="mt-2 ml-7">
                                  <input
                                    type="text"
                                    placeholder="Add specific details or instructions (optional)..."
                                    value={selectedRequirements.get(id) || ""}
                                    onChange={(e) =>
                                      handleRequirementNotesChange(
                                        id,
                                        e.target.value
                                      )
                                    }
                                    className="form-input"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Manual Selection for Requirements Not in Suggestions */}
                    {suggestions && allRequirements.length > 0 && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() =>
                            setShowManualRequirements(!showManualRequirements)
                          }
                          className="flex items-center gap-2 text-sm font-semibold text-bsa-olive hover:underline"
                        >
                          {showManualRequirements ? "▼" : "▶"}
                          Browse All Requirements (Manual Selection)
                        </button>
                        {showManualRequirements && (
                          <div className="mt-4 p-4 rounded-lg border border-card bg-[rgba(var(--bsa-olive-rgb),0.03)]">
                            <p className="text-sm text-secondary mb-3">
                              Select additional requirements not suggested by
                              the AI
                            </p>
                            <div className="grid gap-3 max-h-96 overflow-y-auto">
                              {allRequirements
                                .filter((req) => {
                                  // Exclude requirements already in suggestions
                                  return !suggestions.requirements.some(
                                    (suggestedReq) => suggestedReq.id === req.id
                                  );
                                })
                                .sort((a, b) => {
                                  // Define rank order
                                  const rankOrder: { [key: string]: number } = {
                                    "Scout": 1,
                                    "Tenderfoot": 2,
                                    "Second Class": 3,
                                    "First Class": 4,
                                  };
                                  
                                  // First sort by rank
                                  const rankA = rankOrder[a.rank] || 999;
                                  const rankB = rankOrder[b.rank] || 999;
                                  
                                  if (rankA !== rankB) {
                                    return rankA - rankB;
                                  }
                                  
                                  // Then sort by requirement number
                                  // Extract numeric part for proper sorting (e.g., "1a" -> 1, "10" -> 10)
                                  const numA = parseFloat(a.requirement_number) || 0;
                                  const numB = parseFloat(b.requirement_number) || 0;
                                  
                                  if (numA !== numB) {
                                    return numA - numB;
                                  }
                                  
                                  // If numeric parts are equal, sort alphabetically by full requirement number
                                  return a.requirement_number.localeCompare(b.requirement_number);
                                })
                                .map((req) => (
                                  <div
                                    key={req.id}
                                    className={
                                      `p-3 rounded border border-card ` +
                                      (selectedRequirements.has(req.id)
                                        ? "bg-[rgba(var(--bsa-olive-rgb),0.1)]"
                                        : "bg-primary")
                                    }
                                  >
                                    <label className="flex items-start gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedRequirements.has(
                                          req.id
                                        )}
                                        onChange={() => {
                                          setSelectedRequirements((prev) => {
                                            const newMap = new Map(prev);
                                            if (newMap.has(req.id)) {
                                              newMap.delete(req.id);
                                            } else {
                                              newMap.set(req.id, "");
                                            }
                                            return newMap;
                                          });
                                        }}
                                        className="mt-0.5"
                                      />
                                      <div className="flex-1">
                                        <div className="font-semibold text-sm">
                                          {req.rank} {req.requirement_number}
                                          {req.category && ` - ${req.category}`}
                                        </div>
                                        <div className="text-xs text-secondary mt-0.5">
                                          {req.requirement_text}
                                        </div>
                                      </div>
                                    </label>
                                    {selectedRequirements.has(req.id) && (
                                      <div className="mt-2 ml-6">
                                        <input
                                          type="text"
                                          placeholder="Add specific details..."
                                          value={
                                            selectedRequirements.get(req.id) ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleRequirementNotesChange(
                                              req.id,
                                              e.target.value
                                            )
                                          }
                                          className="form-input text-sm"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-[var(--card-border)]" />
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="m-0">🎖️ Merit Badges</h3>
                      {(suggestions
                        ? suggestions.merit_badges.length > 0
                        : allMeritBadges.length > 0) && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const allBadges = suggestions
                                ? suggestions.merit_badges.map((b) => b.name)
                                : allMeritBadges.map((b) => b.id);
                              setSelectedMeritBadges((prev) => {
                                const newMap = new Map(prev);
                                allBadges.forEach((id) => {
                                  if (!newMap.has(id)) {
                                    newMap.set(id, "");
                                  }
                                });
                                return newMap;
                              });
                            }}
                            className="text-xs px-3 py-1 rounded border border-bsa-olive text-bsa-olive hover:bg-[rgba(var(--bsa-olive-rgb),0.1)]"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedMeritBadges(new Map())}
                            className="text-xs px-3 py-1 rounded border border-card text-secondary hover:bg-tertiary"
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>
                    {(
                      suggestions
                        ? suggestions.merit_badges.length === 0
                        : allMeritBadges.length === 0
                    ) ? (
                      <p className="text-secondary">
                        No merit badges available
                      </p>
                    ) : (
                      <div className="grid gap-4">
                        {(suggestions
                          ? suggestions.merit_badges.map((b) => ({
                              id: b.name,
                              name: b.name,
                              description: b.description,
                              eagle_required: b.eagle_required,
                              match_score: b.match_score,
                              matched_keywords: b.matched_keywords,
                              isFlattened: true,
                            }))
                          : allMeritBadges.map((b) => ({
                              id: b.id,
                              name: b.name,
                              description: b.description,
                              eagle_required: b.eagle_required || false,
                              match_score: 0,
                              matched_keywords: [] as string[],
                              isFlattened: false,
                            }))
                        ).map((badgeObj) => {
                          const id = badgeObj.id;
                          return (
                            <div
                              key={id}
                              className={
                                `p-4 rounded-lg border border-card ` +
                                (selectedMeritBadges.has(id)
                                  ? "bg-[rgba(0,150,0,0.05)]"
                                  : "bg-tertiary")
                              }
                            >
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedMeritBadges.has(id)}
                                  onChange={() => {
                                    setSelectedMeritBadges((prev) => {
                                      const newMap = new Map(prev);
                                      if (newMap.has(id)) {
                                        newMap.delete(id);
                                      } else {
                                        newMap.set(id, "");
                                      }
                                      return newMap;
                                    });
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="font-bold mb-1">
                                    {badgeObj.name}
                                    {badgeObj.eagle_required && (
                                      <span className="ml-2 text-xs">🦅</span>
                                    )}
                                    {suggestions &&
                                      badgeObj.match_score > 0 && (
                                        <span className="ml-2 text-xs py-0.5 px-2 rounded-xl bg-[rgba(0,150,0,0.2)]">
                                          {(badgeObj.match_score * 100).toFixed(
                                            0
                                          )}
                                          % match
                                        </span>
                                      )}
                                  </div>
                                  <div className="text-sm text-secondary">
                                    {badgeObj.description}
                                  </div>
                                </div>
                              </label>
                              {selectedMeritBadges.has(id) && (
                                <div className="mt-2 ml-7">
                                  <input
                                    type="text"
                                    placeholder="Add specific details or instructions (optional)..."
                                    value={selectedMeritBadges.get(id) || ""}
                                    onChange={(e) =>
                                      handleMeritBadgeNotesChange(
                                        id,
                                        e.target.value
                                      )
                                    }
                                    className="form-input"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Manual Selection for Merit Badges Not in Suggestions */}
                    {suggestions && allMeritBadges.length > 0 && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setShowManualBadges(!showManualBadges)}
                          className="flex items-center gap-2 text-sm font-semibold text-bsa-olive hover:underline"
                        >
                          {showManualBadges ? "▼" : "▶"}
                          Browse All Merit Badges (Manual Selection)
                        </button>
                        {showManualBadges && (
                          <div className="mt-4 p-4 rounded-lg border border-card bg-[rgba(0,150,0,0.03)]">
                            <p className="text-sm text-secondary mb-3">
                              Select additional merit badges not suggested by
                              the AI
                            </p>
                            <div className="grid gap-3 max-h-96 overflow-y-auto">
                              {allMeritBadges
                                .filter((badge) => {
                                  // Exclude badges already in suggestions
                                  return !suggestions.merit_badges.some(
                                    (suggestedBadge) =>
                                      suggestedBadge.name === badge.id
                                  );
                                })
                                .map((badge) => (
                                  <div
                                    key={badge.id}
                                    className={
                                      `p-3 rounded border border-card ` +
                                      (selectedMeritBadges.has(badge.id)
                                        ? "bg-[rgba(0,150,0,0.1)]"
                                        : "bg-primary")
                                    }
                                  >
                                    <label className="flex items-start gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedMeritBadges.has(
                                          badge.id
                                        )}
                                        onChange={() => {
                                          setSelectedMeritBadges((prev) => {
                                            const newMap = new Map(prev);
                                            if (newMap.has(badge.id)) {
                                              newMap.delete(badge.id);
                                            } else {
                                              newMap.set(badge.id, "");
                                            }
                                            return newMap;
                                          });
                                        }}
                                        className="mt-0.5"
                                      />
                                      <div className="flex-1">
                                        <div className="font-semibold text-sm">
                                          {badge.name}
                                          {badge.eagle_required && (
                                            <span className="ml-2 text-xs">
                                              🦅
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-secondary mt-0.5">
                                          {badge.description}
                                        </div>
                                      </div>
                                    </label>
                                    {selectedMeritBadges.has(badge.id) && (
                                      <div className="mt-2 ml-6">
                                        <input
                                          type="text"
                                          placeholder="Add specific details..."
                                          value={
                                            selectedMeritBadges.get(badge.id) ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleMeritBadgeNotesChange(
                                              badge.id,
                                              e.target.value
                                            )
                                          }
                                          className="form-input text-sm"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            {!suggestions &&
              !loading &&
              allRequirements.length === 0 &&
              allMeritBadges.length === 0 && (
                <div className="text-secondary">
                  No requirements or merit badges available.
                </div>
              )}
          </div>
        );

      case 2:
        return (
          <div className="mt-5">
            <p className="text-secondary mb-5">
              Select a packing list template to help participants prepare for
              the outing.
            </p>

            {loading && (
              <div className="text-center py-10">
                <div className="text-2xl">⏳</div>
                <p>Loading templates...</p>
              </div>
            )}

            {!loading && packingListTemplates.length > 0 && (
              <div className="grid gap-5">
                <div>
                  <h3>📦 Packing List Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    {packingListTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedTemplateId === template.id
                            ? "border-bsa-olive bg-[rgba(var(--bsa-olive-rgb),0.1)]"
                            : "border-card bg-tertiary hover:border-bsa-olive"
                        }`}
                        onClick={async () => {
                          setSelectedTemplateId(template.id);
                          try {
                            const fullTemplate =
                              await packingListAPI.getTemplate(template.id);
                            setSelectedTemplate(fullTemplate);
                          } catch (e) {
                            console.error("Failed to load template details", e);
                          }
                        }}
                      >
                        <div className="font-bold mb-1">{template.name}</div>
                        <div className="text-sm text-secondary">
                          {template.description}
                        </div>
                        {selectedTemplateId === template.id &&
                          selectedTemplate && (
                            <div className="mt-2 text-xs text-secondary">
                              {selectedTemplate.items.length} items
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="p-4 bg-tertiary rounded-lg">
                    <h4 className="mt-0">
                      Selected Template: {selectedTemplate.name}
                    </h4>
                    <p className="text-sm text-secondary mb-3">
                      {selectedTemplate.items.length} items will be added to
                      this outing's packing list
                    </p>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {selectedTemplate.items.slice(0, 20).map((item) => (
                          <div key={item.id} className="text-sm">
                            • {item.name} ({item.quantity})
                          </div>
                        ))}
                      </div>
                      {selectedTemplate.items.length > 20 && (
                        <p className="text-xs text-secondary mt-2">
                          +{selectedTemplate.items.length - 20} more items...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="h-px bg-[var(--card-border)]" />

                <div>
                  <h4>Add Custom Items (Optional)</h4>
                  <p className="text-sm text-secondary mb-3">
                    Add any additional items not in the template
                  </p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={packingItemInput}
                      onChange={(e) => setPackingItemInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          if (packingItemInput.trim()) {
                            setCustomPackingItems([
                              ...customPackingItems,
                              {
                                name: packingItemInput.trim(),
                                quantity: parseInt(packingItemQuantity) || 1,
                              },
                            ]);
                            setPackingItemInput("");
                            setPackingItemQuantity("1");
                          }
                        }
                      }}
                      placeholder="Item name..."
                      style={{ width: "60%" }}
                      className="form-input"
                    />
                    <input
                      type="number"
                      value={packingItemQuantity}
                      onChange={(e) => setPackingItemQuantity(e.target.value)}
                      min="1"
                      placeholder="Qty"
                      style={{ width: "15%" }}
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (packingItemInput.trim()) {
                          setCustomPackingItems([
                            ...customPackingItems,
                            {
                              name: packingItemInput.trim(),
                              quantity: parseInt(packingItemQuantity) || 1,
                            },
                          ]);
                          setPackingItemInput("");
                          setPackingItemQuantity("1");
                        }
                      }}
                      style={{ width: "25%" }}
                      className="px-4 py-2 bg-bsa-olive text-white rounded cursor-pointer hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                  {customPackingItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {customPackingItems.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 py-1 px-3 bg-tertiary border border-card rounded-2xl text-sm"
                        >
                          {item.name} ({item.quantity})
                          <button
                            type="button"
                            onClick={() => {
                              setCustomPackingItems(
                                customPackingItems.filter((_, i) => i !== index)
                              );
                            }}
                            className="p-0 bg-transparent border-0 cursor-pointer text-secondary text-base hover:text-primary"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && packingListTemplates.length === 0 && (
              <div className="p-4 rounded border border-[rgba(33,150,243,0.3)] bg-[rgba(33,150,243,0.1)]">
                No packing list templates available. You can skip this step.
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
              <div>
                <label className="block mb-1 font-semibold text-primary text-sm">
                  Capacity Type
                </label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="capacityType"
                      value="fixed"
                      checked={capacityType === "fixed"}
                      onChange={(e) =>
                        setCapacityType(e.target.value as "fixed" | "vehicle")
                      }
                      className="cursor-pointer"
                    />
                    <span>Fixed Number</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="capacityType"
                      value="vehicle"
                      checked={capacityType === "vehicle"}
                      onChange={(e) =>
                        setCapacityType(e.target.value as "fixed" | "vehicle")
                      }
                      className="cursor-pointer"
                    />
                    <span>Based on Vehicle Seats</span>
                  </label>
                </div>
                {capacityType === "fixed" && (
                  <div>
                    <label className="block mb-1 font-semibold text-primary text-sm">
                      Maximum Participants
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
                )}
                {capacityType === "vehicle" && (
                  <p className="text-sm text-secondary">
                    Capacity will be automatically calculated based on available
                    vehicle seats from adult participants.
                  </p>
                )}
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

              {/* Food Budget Section */}
              <div
                className="mt-4 p-4 rounded-lg"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <h4 className="font-semibold text-primary mb-3">
                  🍳 Food Budget (for Grubmasters)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 font-semibold text-primary text-sm">
                      Budget Per Person
                    </label>
                    <div className="flex items-center">
                      <span className="mr-2">$</span>
                      <input
                        type="number"
                        value={foodBudgetPerPerson}
                        onChange={(e) => setFoodBudgetPerPerson(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="form-input flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-primary text-sm">
                      Number of Meals
                    </label>
                    <input
                      type="number"
                      value={mealCount}
                      onChange={(e) => setMealCount(e.target.value)}
                      placeholder="4"
                      min="1"
                      className="form-input"
                    />
                    <small className="helper-text">
                      Typically 4 for weekend (Sat B/L/D, Sun B)
                    </small>
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-primary text-sm">
                      Budget Type
                    </label>
                    <select
                      value={budgetType}
                      onChange={(e) =>
                        setBudgetType(e.target.value as "total" | "per_meal")
                      }
                      className="form-input"
                    >
                      <option value="total">Total per person</option>
                      <option value="per_meal">Per meal (× meals)</option>
                    </select>
                  </div>
                </div>
                {foodBudgetPerPerson && (
                  <p
                    className="mt-3 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    💰 Budget: ${parseFloat(foodBudgetPerPerson).toFixed(2)} per
                    person
                    {budgetType === "per_meal" && mealCount && (
                      <>
                        {" "}
                        × {mealCount} meals = $
                        {(
                          parseFloat(foodBudgetPerPerson) * parseInt(mealCount)
                        ).toFixed(2)}{" "}
                        total
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block mb-1 font-semibold text-primary text-sm">
                    Signups Close Date
                  </label>
                  <input
                    type="date"
                    value={signupCloseDate}
                    onChange={(e) => setSignupCloseDate(e.target.value)}
                    className="form-input"
                  />
                  <small className="helper-text">
                    When should signups automatically close?
                  </small>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-primary text-sm">
                    Cancellation Deadline
                  </label>
                  <input
                    type="date"
                    value={cancellationDeadline}
                    onChange={(e) => setCancellationDeadline(e.target.value)}
                    className="form-input"
                  />
                  <small className="helper-text">
                    Last day for users to self-cancel
                  </small>
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
                {icon && (
                  <p>
                    <strong>Icon:</strong>{" "}
                    {OUTING_ICONS.find((i) => i.name === icon)?.icon} {icon}
                  </p>
                )}
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
                {dropoffTime && (
                  <p>
                    <strong>Drop-off Time:</strong> {dropoffTime}
                  </p>
                )}
                {pickupTime && (
                  <p>
                    <strong>Pickup Time:</strong> {pickupTime}
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
                        (r) => r.id === reqId
                      );
                      // If not in suggestions, look in allRequirements
                      const requirement = req
                        ? {
                            rank: req.rank,
                            requirement_number: req.requirement_number,
                            category: "",
                            requirement_text: req.description,
                          }
                        : allRequirements.find((r) => r.id === reqId);

                      if (!requirement) return null;

                      const descriptionText =
                        (req && req.description) ||
                        requirement.requirement_text ||
                        "";

                      return (
                        <div key={reqId} className="mb-2">
                          <div className="font-bold">
                            ✓ {requirement.rank} {req?.requirement_number || ""}
                            {requirement.category &&
                              ` - ${requirement.category}`}
                          </div>
                          {descriptionText && (
                            <div className="text-sm text-secondary ml-5">
                              {descriptionText}
                            </div>
                          )}
                          {notes && (
                            <div className="text-sm text-secondary ml-5 mt-1">
                              <em>{notes}</em>
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
                        (b) => b.id === badgeId
                      );
                      // If not in suggestions, look in allMeritBadges
                      const meritBadge = badge
                        ? {
                            name: badge.name,
                            eagle_required: badge.eagle_required,
                          }
                        : allMeritBadges.find((mb) => mb.id === badgeId);

                      if (!meritBadge) return null;

                      return (
                        <div key={badgeId} className="mb-2">
                          <div className="font-bold">✓ {meritBadge.name}</div>
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
                  <strong>Capacity:</strong>{" "}
                  {capacityType === "fixed"
                    ? `${capacity} participants (fixed)`
                    : "Based on vehicle seats"}
                </p>
                {cost && (
                  <p>
                    <strong>Cost:</strong> ${cost}
                  </p>
                )}
                {foodBudgetPerPerson && (
                  <p>
                    <strong>Food Budget:</strong> $
                    {parseFloat(foodBudgetPerPerson).toFixed(2)} per person
                    {budgetType === "per_meal" && mealCount && (
                      <>
                        {" "}
                        × {mealCount} meals = $
                        {(
                          parseFloat(foodBudgetPerPerson) * parseInt(mealCount)
                        ).toFixed(2)}{" "}
                        total
                      </>
                    )}
                  </p>
                )}
                {signupCloseDate && (
                  <p>
                    <strong>Signup Close Date:</strong>{" "}
                    {new Date(signupCloseDate).toLocaleDateString()}
                  </p>
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
      onClick={handleBackdropClick}
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
            onClick={() => handleClose(false)}
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
