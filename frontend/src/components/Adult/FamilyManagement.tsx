import React, { useState, useEffect, useRef } from "react";
import { familyAPI, troopAPI, patrolAPI } from "../../services/api";
import { FamilyMember, FamilyMemberCreate } from "../../types";
import { useFamilyMembers, invalidateFamilyData } from "../../hooks/useSWR";
import { calculateAge, validateMemberForm } from "../../utils/ageInference";

interface FamilyManagementProps {
  onMemberAdded?: () => void;
}

export const FamilyManagement: React.FC<FamilyManagementProps> = ({
  onMemberAdded,
}) => {
  // Use SWR hook for data fetching with automatic caching
  const {
    familyMembers: members,
    isLoading: loading,
    error: swrError,
  } = useFamilyMembers();

  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Log family members data when it changes (for diagnostics)
  useEffect(() => {
    if (loading) {
      console.log("🔄 Loading family members...");
    } else if (swrError) {
      const errorMessage = swrError?.message || "Failed to load family members";
      console.error("❌ Error loading family members:", {
        error: swrError,
        message: errorMessage,
      });
    } else if (members) {
      console.log("✅ Family members loaded:", {
        members,
        total: members.length,
      });
    }
  }, [members, loading, swrError]);

  // Convert SWR error to string for display
  const displayError =
    error ||
    (swrError ? swrError.message || "Failed to load family members" : null);

  const handleAddMember = () => {
    setShowAddForm(true);
    setEditingMember(null);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setShowAddForm(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this family member?")) {
      return;
    }

    try {
      console.log("🗑️ Deleting family member:", id);
      await familyAPI.delete(id);
      console.log("✅ Family member deleted, invalidating cache...");
      // Invalidate cache to trigger refetch
      await invalidateFamilyData();
    } catch (err) {
      console.error("❌ Failed to delete family member:", err);
      setError("Failed to delete family member");
    }
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setEditingMember(null);
  };

  const handleFormSuccess = async () => {
    console.log("✅ Family member saved, invalidating cache...");
    // Invalidate cache to trigger refetch
    await invalidateFamilyData();
    handleFormClose();
    if (onMemberAdded) {
      onMemberAdded();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-secondary">Loading family members...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2
            className="text-3xl font-bold m-0"
            style={{ color: "var(--text-primary)" }}
          >
            Family Members
          </h2>
          <button
            onClick={handleAddMember}
            className="px-6 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-none rounded-md text-base font-bold cursor-pointer transition-all duration-200 shadow-sm hover:bg-[var(--btn-primary-hover)] hover:-translate-y-px hover:shadow-md"
          >
            + Add Family Member
          </button>
        </div>

        {displayError && (
          <div
            className="px-4 py-3 rounded border"
            style={{
              backgroundColor: "var(--alert-error-bg)",
              borderColor: "var(--alert-error-border)",
              color: "var(--alert-error-text)",
            }}
          >
            {displayError}
          </div>
        )}

        {!loading && members && members.length === 0 ? (
          <div className="text-center py-12 px-6 bg-[var(--bg-tertiary)] rounded-lg">
            <p className="text-secondary mb-6 text-base">
              No family members added yet
            </p>
            <button
              onClick={handleAddMember}
              className="px-8 py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-none rounded-md text-base font-bold cursor-pointer transition-all duration-200 shadow-sm hover:bg-[var(--btn-primary-hover)] hover:-translate-y-px hover:shadow-md"
            >
              Add Your First Family Member
            </button>
          </div>
        ) : (
          <>
            {/* Adults Section */}
            {members.filter((m) => m.member_type === "adult").length > 0 && (
              <div className="mb-8">
                <h3
                  className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-[var(--border-light)]"
                  style={{ color: "var(--color-secondary)" }}
                >
                  🌲 Adults (
                  {members.filter((m) => m.member_type === "adult").length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
                  {members
                    .filter((m) => m.member_type === "adult")
                    .map((member) => (
                      <FamilyMemberCard
                        key={member.id}
                        member={member}
                        onEdit={() => handleEditMember(member)}
                        onDelete={() => handleDeleteMember(member.id)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Youth/Scouts Section */}
            {members.filter((m) => m.member_type === "scout").length > 0 && (
              <div>
                <h3
                  className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-[var(--border-light)]"
                  style={{ color: "var(--color-primary)" }}
                >
                  🌱 Youth (
                  {members.filter((m) => m.member_type === "scout").length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
                  {members
                    .filter((m) => m.member_type === "scout")
                    .map((member) => (
                      <FamilyMemberCard
                        key={member.id}
                        member={member}
                        onEdit={() => handleEditMember(member)}
                        onDelete={() => handleDeleteMember(member.id)}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {showAddForm && (
          <FamilyMemberForm
            member={editingMember}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </>
  );
};

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit: () => void;
  onDelete: () => void;
}

const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onEdit,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const age = calculateAge(member.date_of_birth || undefined);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showActions]);

  return (
    <div className="glass-card p-8 flex flex-col h-full cursor-default group relative overflow-hidden">
      {/* Header with name and actions */}
      <div
        className="flex justify-between items-start mb-4 pb-3 border-b"
        style={{ borderColor: "var(--border-light)" }}
      >
        <div className="flex-1">
          <h3
            className="text-xl font-bold font-heading mb-2 leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {member.name}
          </h3>
          <span
            className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm border"
            style={{
              backgroundColor:
                member.member_type === "scout"
                  ? "var(--badge-scout-bg)"
                  : "var(--badge-adult-bg)",
              color:
                member.member_type === "scout"
                  ? "var(--badge-scout-text)"
                  : "var(--badge-adult-text)",
              borderColor:
                member.member_type === "scout"
                  ? "var(--badge-scout-border)"
                  : "var(--badge-adult-border)",
            }}
          >
            {member.member_type === "scout" ? "🌱 Scout" : "🌲 Adult"}
          </span>
        </div>

        {/* Actions Dropdown - All Widths */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-md transition-colors border"
            style={{
              color: "var(--text-primary)",
              backgroundColor: "var(--card-bg-alpha)",
              borderColor: "var(--border-light)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--card-bg-alpha)")
            }
            title="Actions"
            aria-label={`Actions for ${member.name}`}
            aria-haspopup="true"
            aria-expanded={showActions}
          >
            ⋮
          </button>

          {showActions && (
            <div
              className="absolute right-0 top-full mt-1 bg-[var(--card-bg)] border border-[var(--border-light)] rounded-md shadow-lg z-10 min-w-[160px]"
              style={{ backgroundColor: "var(--card-bg)" }}
            >
              <button
                onClick={() => {
                  onEdit();
                  setShowActions(false);
                }}
                className="w-full px-4 py-3 text-left flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: "var(--color-info)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                ✏️ Edit
              </button>
              <div className="h-px bg-[var(--border-light)]"></div>
              <button
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
                className="w-full px-4 py-3 text-left flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: "var(--color-error)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--card-error-bg)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div
        className="flex flex-col gap-3 text-sm flex-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {age && (
          <div className="flex items-center gap-2">
            <span
              className="font-semibold min-w-[80px]"
              style={{ color: "var(--text-primary)" }}
            >
              Age:
            </span>
            <span className="font-medium">{age} years old</span>
          </div>
        )}
        {member.troop_number && (
          <div className="flex items-center gap-2">
            <span
              className="font-semibold min-w-[80px]"
              style={{ color: "var(--text-primary)" }}
            >
              Troop:
            </span>
            <span className="font-medium">{member.troop_number}</span>
          </div>
        )}
        {member.patrol_name && (
          <div className="flex items-center gap-2">
            <span
              className="font-semibold min-w-[80px]"
              style={{ color: "var(--text-primary)" }}
            >
              Patrol:
            </span>
            <span className="font-medium">{member.patrol_name}</span>
          </div>
        )}

        {member.member_type === "adult" && (
          <>
            <div
              className="flex flex-col gap-1 px-4 py-3 rounded-lg mt-2 border"
              style={{
                backgroundColor:
                  !member.has_youth_protection ||
                  (member.youth_protection_expiration &&
                    new Date(member.youth_protection_expiration) < new Date())
                    ? "var(--card-error-bg)"
                    : "var(--card-success-bg)",
                borderColor:
                  !member.has_youth_protection ||
                  (member.youth_protection_expiration &&
                    new Date(member.youth_protection_expiration) < new Date())
                    ? "var(--border-error)"
                    : "var(--border-success)",
              }}
            >
              <div
                className="flex items-center gap-2 font-bold text-sm"
                style={{
                  color:
                    !member.has_youth_protection ||
                    (member.youth_protection_expiration &&
                      new Date(member.youth_protection_expiration) < new Date())
                      ? "var(--color-error)"
                      : "var(--color-success)",
                }}
              >
                {!member.has_youth_protection
                  ? "⚠️ Youth Protection: Not Trained"
                  : member.youth_protection_expiration &&
                    new Date(member.youth_protection_expiration) < new Date()
                  ? "⚠️ Youth Protection: Expired"
                  : "✓ Youth Protection: Valid"}
              </div>
              <div
                className="text-xs font-medium"
                style={{
                  color:
                    !member.has_youth_protection ||
                    (member.youth_protection_expiration &&
                      new Date(member.youth_protection_expiration) < new Date())
                      ? "var(--color-error)"
                      : "var(--color-success)",
                }}
              >
                Expiration:{" "}
                {member.youth_protection_expiration
                  ? new Date(
                      member.youth_protection_expiration
                    ).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
            {member.vehicle_capacity > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="font-semibold min-w-[80px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  Vehicle:
                </span>
                <span className="font-medium">
                  {member.vehicle_capacity} passengers
                </span>
              </div>
            )}
          </>
        )}

        {member.dietary_preferences.length > 0 && (
          <div className="mt-3">
            <div
              className="font-semibold mb-2 text-xs uppercase tracking-wider"
              style={{ color: "var(--text-primary)" }}
            >
              Dietary Preferences
            </div>
            <div className="flex flex-wrap gap-2">
              {member.dietary_preferences.map((p, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm border"
                  style={{
                    backgroundColor: "var(--badge-secondary-bg)",
                    color: "var(--badge-secondary-text)",
                    borderColor: "var(--badge-secondary-border)",
                  }}
                >
                  {p.preference}
                </span>
              ))}
            </div>
          </div>
        )}

        {member.allergies.length > 0 && (
          <div className="mt-3">
            <div
              className="font-semibold mb-2 text-xs uppercase tracking-wider flex items-center gap-1"
              style={{ color: "var(--color-error)" }}
            >
              <span>⚠️ Allergies</span>
            </div>
            <div className="flex flex-col gap-2">
              {member.allergies.map((a, idx) => (
                <span
                  key={idx}
                  className="px-3 py-2 rounded-lg text-xs font-bold border shadow-sm flex justify-between items-center"
                  style={{
                    backgroundColor: "var(--card-error-bg)",
                    color: "var(--color-error)",
                    borderColor: "var(--border-error)",
                  }}
                >
                  <span>{a.allergy}</span>
                  {a.severity && (
                    <span
                      className="text-[10px] uppercase px-1.5 py-0.5 rounded ml-2"
                      style={{ backgroundColor: "var(--card-bg-alpha)" }}
                    >
                      {a.severity}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface FamilyMemberFormProps {
  member: FamilyMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FamilyMemberForm: React.FC<FamilyMemberFormProps> = ({
  member,
  onClose,
  onSuccess,
}) => {
  // Common dietary preferences
  const commonDietaryPreferences = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut Allergy",
    "Kosher",
    "Halal",
    "Pescatarian",
    "Low-Sodium",
    "Diabetic",
  ];

  const [formData, setFormData] = useState<FamilyMemberCreate>({
    name: member?.name || "",
    member_type: member?.member_type || "scout",
    date_of_birth: member?.date_of_birth || "",
    troop_number: member?.troop_number || "",
    patrol_name: member?.patrol_name || "",
    has_youth_protection: member?.has_youth_protection || false,
    youth_protection_expiration: member?.youth_protection_expiration || "",
    vehicle_capacity: member?.vehicle_capacity || 0,
    medical_notes: member?.medical_notes || "",
    dietary_preferences:
      member?.dietary_preferences.map((p) => p.preference) || [],
    allergies:
      member?.allergies.map((a) => ({
        allergy: a.allergy,
        severity: a.severity,
      })) || [],
  });

  // Troop/patrol dropdown data
  const [troops, setTroops] = useState<Array<{ id: string; number: string }>>(
    []
  );
  const [patrols, setPatrols] = useState<
    Array<{ id: string; name: string; troop_id: string }>
  >([]);
  const [selectedTroopId, setSelectedTroopId] = useState<string>("");
  const [selectedPatrolId, setSelectedPatrolId] = useState<string>("");

  // Load troops on open
  useEffect(() => {
    const loadTroops = async () => {
      try {
        const data = await troopAPI.getAll();
        // Expect data.troops or array; normalize
        const list = Array.isArray((data as any).troops)
          ? (data as any).troops
          : (data as any);
        setTroops(list.map((t: any) => ({ id: t.id, number: t.number })));
        // Preselect based on existing member
        if (member && (member as any).troop_id) {
          setSelectedTroopId((member as any).troop_id);
        }
      } catch (e) {
        console.warn("Failed to load troops for dropdown", e);
      }
    };
    loadTroops();
    // If editing and troop_number is present but no troop_id, try match by number
    // This keeps backward compatibility with text-only field
  }, []);

  // Load patrols when troop selection changes
  useEffect(() => {
    const loadPatrols = async () => {
      if (!selectedTroopId) {
        setPatrols([]);
        setSelectedPatrolId("");
        return;
      }
      try {
        const data = await patrolAPI.getByTroop(selectedTroopId);
        const list = Array.isArray((data as any).patrols)
          ? (data as any).patrols
          : (data as any);
        setPatrols(
          list.map((p: any) => ({
            id: p.id,
            name: p.name,
            troop_id: p.troop_id,
          }))
        );
        // Preselect patrol if editing
        if (member && (member as any).patrol_id) {
          setSelectedPatrolId((member as any).patrol_id);
        }
      } catch (e) {
        console.warn("Failed to load patrols for dropdown", e);
      }
    };
    loadPatrols();
  }, [selectedTroopId]);

  const [newAllergy, setNewAllergy] = useState({ allergy: "", severity: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);

  // Update DOB related state and inferred member type
  const handleDobChange = (isoDate: string) => {
    setFormData((prev) => ({ ...prev, date_of_birth: isoDate }));
    const result = validateMemberForm({
      date_of_birth: isoDate,
      has_youth_protection: !!formData.has_youth_protection,
      youth_protection_expiration: formData.youth_protection_expiration || null,
      member_type: formData.member_type as any,
    });
    // Show only DOB related error (age) inline; YPT errors appear on submit
    const dobRelatedError = result.errors.find((e) => e.toLowerCase().includes("scout"));
    setDobError(dobRelatedError || null);
    if (result.inferredType && result.inferredType !== formData.member_type) {
      setFormData((prev) => ({ ...prev, member_type: result.inferredType! }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Perform validation/inference using shared util
    const validation = validateMemberForm({
      date_of_birth: formData.date_of_birth || "",
      has_youth_protection: !!formData.has_youth_protection,
      youth_protection_expiration: formData.youth_protection_expiration || null,
      member_type: formData.member_type as any,
    });
    if (validation.inferredType && validation.inferredType !== formData.member_type) {
      setFormData((prev) => ({ ...prev, member_type: validation.inferredType! }));
    }
    // Collect blocking errors (age or YPT)
    const blockingErrors = validation.errors;
    if (blockingErrors.length) {
      setError(blockingErrors.join(" \n"));
      setSubmitting(false);
      return;
    }

    try {
      // Prefer relational IDs if selected; otherwise fall back to text fields
      const payload: any = { ...formData };
      if (selectedTroopId) payload.troop_id = selectedTroopId;
      if (selectedPatrolId) payload.patrol_id = selectedPatrolId;

      // Normalize date fields: send null instead of empty strings to satisfy Pydantic validators
      if (!payload.date_of_birth) payload.date_of_birth = null;
      if (!payload.has_youth_protection) {
        // If not trained, ensure expiration is null
        payload.youth_protection_expiration = null;
      } else if (!payload.youth_protection_expiration) {
        payload.youth_protection_expiration = null;
      }

      if (member) {
        await familyAPI.update(member.id, payload);
      } else {
        await familyAPI.create(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save family member");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDietaryPreference = (preference: string) => {
    const current = formData.dietary_preferences || [];
    if (current.includes(preference)) {
      setFormData({
        ...formData,
        dietary_preferences: current.filter((p) => p !== preference),
      });
    } else {
      setFormData({
        ...formData,
        dietary_preferences: [...current, preference],
      });
    }
  };

  const addAllergy = () => {
    if (newAllergy.allergy.trim()) {
      setFormData({
        ...formData,
        allergies: [...(formData.allergies || []), newAllergy],
      });
      setNewAllergy({ allergy: "", severity: "" });
    }
  };

  const removeAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-[1000]"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-[var(--card-bg)] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <h3
            id="modal-title"
            className="text-3xl font-bold mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            {member ? "Edit Family Member" : "Add Family Member"}
          </h3>

          {error && (
            <div className="p-3 bg-[var(--alert-error-bg)] text-[var(--alert-error-text)] rounded-md mb-5 text-sm border border-[var(--alert-error-border)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="member-name"
                className="block mb-2 font-semibold text-primary text-[15px]"
              >
                Name *
              </label>
              <input
                id="member-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full py-3 px-4 border border-[var(--input-border)] rounded-md text-[15px] bg-[var(--input-bg)] text-[var(--input-text)] box-border"
                placeholder="Enter full name"
              />
            </div>

            {/* Member type is inferred from DOB; display-only badge */}
            <div>
              <label className="block mb-2 font-semibold text-primary text-[15px]">
                Member Type (auto)
              </label>
              <div
                className="px-3 py-2 rounded-md border inline-flex items-center gap-2"
                style={{
                  backgroundColor:
                    formData.member_type === "scout"
                      ? "var(--badge-scout-bg)"
                      : "var(--badge-adult-bg)",
                  color:
                    formData.member_type === "scout"
                      ? "var(--badge-scout-text)"
                      : "var(--badge-adult-text)",
                  borderColor:
                    formData.member_type === "scout"
                      ? "var(--badge-scout-border)"
                      : "var(--badge-adult-border)",
                }}
              >
                {formData.member_type === "scout" ? "🌱 Scout" : "🌲 Adult"}
              </div>
              <p className="text-[13px] text-secondary mt-1.5">
                Based on Date of Birth: under 18 is Scout; 18+ is Adult.
              </p>
            </div>

            <div>
              <label
                htmlFor="member-dob"
                className="block mb-2 font-semibold text-primary text-[15px]"
              >
                Date of Birth *
              </label>
              <input
                id="member-dob"
                type="date"
                required
                value={formData.date_of_birth}
                onChange={(e) => {
                  handleDobChange(e.target.value);
                }}
                className="w-full p-3 border border-[var(--input-border)] rounded-md text-[15px] bg-[var(--input-bg)] text-[var(--input-text)] box-border"
              />
              {dobError && (
                <div
                  className="mt-2 text-sm"
                  style={{ color: "var(--color-error)" }}
                >
                  {dobError}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="member-troop"
                className="block mb-2 font-semibold text-primary text-[15px]"
              >
                Troop
              </label>
              <select
                id="member-troop"
                value={selectedTroopId}
                onChange={(e) => {
                  setSelectedTroopId(e.target.value);
                  // Also mirror troop_number for display/backwards compatibility
                  const troop = troops.find((t) => t.id === e.target.value);
                  setFormData({
                    ...formData,
                    troop_number: troop?.number || "",
                  });
                }}
                className="w-full py-3 px-4 border border-[var(--input-border)] rounded-md text-[15px] bg-[var(--input-bg)] text-[var(--input-text)] box-border"
              >
                <option value="">Select a troop</option>
                {troops.map((t) => (
                  <option key={t.id} value={t.id}>
                    Troop {t.number}
                  </option>
                ))}
              </select>
              <p className="text-[13px] text-secondary mt-1.5">
                If your troop isn’t listed, ask an admin to add it under Troop
                Admin.
              </p>
            </div>

            {formData.member_type === "scout" && (
              <div>
                <label
                  htmlFor="member-patrol"
                  className="block mb-2 font-semibold text-primary text-[15px]"
                >
                  Patrol
                </label>
                <select
                  id="member-patrol"
                  value={selectedPatrolId}
                  onChange={(e) => {
                    setSelectedPatrolId(e.target.value);
                    const patrol = patrols.find((p) => p.id === e.target.value);
                    setFormData({
                      ...formData,
                      patrol_name: patrol?.name || "",
                    });
                  }}
                  className="w-full py-3 px-4 border border-[var(--input-border)] rounded-md text-[15px] bg-[var(--input-bg)] text-[var(--input-text)] box-border"
                  disabled={!selectedTroopId}
                >
                  <option value="">
                    {selectedTroopId
                      ? "Select a patrol"
                      : "Select a troop first"}
                  </option>
                  {patrols.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.member_type === "adult" && (
              <>
                <label
                  htmlFor="youth_protection"
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id="youth_protection"
                    checked={formData.has_youth_protection}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        has_youth_protection: e.target.checked,
                      })
                    }
                    className="w-[18px] h-[18px] cursor-pointer flex-shrink-0"
                  />
                  <span className="text-[15px] text-primary">
                    Youth Protection Trained (SAFE Youth Training)
                  </span>
                </label>

                {formData.has_youth_protection && (
                  <div>
                    <label
                      htmlFor="yp-expiration"
                      className="block mb-2 font-semibold text-primary text-[15px]"
                    >
                      Youth Protection Certificate Expiration Date *
                    </label>
                    <input
                      id="yp-expiration"
                      type="date"
                      required={formData.has_youth_protection}
                      value={formData.youth_protection_expiration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          youth_protection_expiration: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-[var(--input-border)] rounded-md text-[15px] bg-[var(--input-bg)] text-[var(--input-text)] box-border"
                    />
                    <p className="text-[13px] text-secondary mt-1.5 leading-relaxed">
                      SAFE Youth Training certificates are typically valid for 2
                      years
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="vehicle-capacity"
                    className="block mb-2 font-semibold text-primary text-[15px]"
                  >
                    Vehicle Capacity (passengers)
                  </label>
                  <input
                    id="vehicle-capacity"
                    type="number"
                    min="0"
                    value={formData.vehicle_capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicle_capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-3 border border-[var(--input-border)] rounded-md text-[15px] bg-[var(--input-bg)] text-[var(--input-text)] box-border"
                    placeholder="0"
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="medical-notes"
                className="block mb-2 font-semibold text-primary text-[15px]"
              >
                Medical Notes
              </label>
              <textarea
                id="medical-notes"
                value={formData.medical_notes}
                onChange={(e) =>
                  setFormData({ ...formData, medical_notes: e.target.value })
                }
                rows={3}
                className="w-full p-3 border border-[var(--input-border)] rounded-md text-[15px] bg-[var(--input-bg)] text-[var(--input-text)] box-border font-inherit resize-y"
                placeholder="Any medical conditions or notes..."
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-primary text-[15px]">
                Dietary Preferences
              </label>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 p-4 bg-[var(--bg-tertiary)] rounded-md">
                {commonDietaryPreferences.map((preference) => (
                  <label
                    key={preference}
                    className={`
                                            flex items-center gap-4 cursor-pointer p-2 rounded transition-all duration-200 border
                                            ${
                                              formData.dietary_preferences?.includes(
                                                preference
                                              )
                                                ? "bg-[var(--badge-scout-bg)] border-sa-dark-blue"
                                                : "bg-[var(--input-bg)] border-[var(--input-border)]"
                                            }
                                        `}
                  >
                    <input
                      type="checkbox"
                      checked={
                        formData.dietary_preferences?.includes(preference) ||
                        false
                      }
                      onChange={() => toggleDietaryPreference(preference)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-primary">{preference}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-primary text-[15px]">
                Allergies
              </label>
              <div className="flex gap-2 mb-3 flex-wrap">
                <input
                  aria-label="New allergy type"
                  type="text"
                  value={newAllergy.allergy}
                  onChange={(e) =>
                    setNewAllergy({ ...newAllergy, allergy: e.target.value })
                  }
                  placeholder="Allergy type (e.g., Peanuts)"
                  className="flex-1 min-w-[200px] p-3 border border-[var(--input-border)] rounded-md text-[15px] bg-[var(--input-bg)] text-[var(--input-text)] box-border"
                />
                <select
                  aria-label="Allergy severity"
                  value={newAllergy.severity}
                  onChange={(e) =>
                    setNewAllergy({ ...newAllergy, severity: e.target.value })
                  }
                  className="p-3 border border-[var(--input-border)] rounded-md text-[15px] bg-[var(--input-bg)] text-[var(--input-text)] min-w-[150px]"
                >
                  <option value="">Severity</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="life-threatening">Life-threatening</option>
                </select>
                <button
                  type="button"
                  onClick={addAllergy}
                  className="px-6 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-none rounded-md text-[15px] font-bold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-[var(--btn-primary-hover)]"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {formData.allergies?.map((allergy, index) => (
                  <div
                    key={index}
                    className="bg-[var(--alert-error-bg)] border border-[var(--alert-error-border)] px-4 py-3 rounded-md flex justify-between items-center"
                  >
                    <span className="text-sm text-[var(--alert-error-text)] font-medium">
                      {allergy.allergy}
                      {allergy.severity && ` (${allergy.severity})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAllergy(index)}
                      className="text-[var(--alert-error-text)] bg-none border-none text-xl cursor-pointer px-2 font-bold"
                      aria-label={`Remove allergy: ${allergy.allergy}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className={`
                                    flex-1 p-3.5 border-none rounded-md text-base font-bold cursor-pointer transition-colors duration-200
                                    ${
                                      submitting
                                        ? "bg-[var(--btn-disabled-bg)] text-[var(--btn-disabled-text)] cursor-not-allowed"
                                        : "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
                                    }
                                `}
              >
                {submitting ? "Saving..." : member ? "Update" : "Add"} Family
                Member
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 p-3.5 bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] border-none rounded-md text-base font-bold cursor-pointer transition-colors duration-200 hover:bg-[var(--btn-secondary-hover)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
