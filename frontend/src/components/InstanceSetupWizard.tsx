import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { troopAPI, patrolAPI, api, organizationAPI } from "../services/api";

interface TroopSetupData {
  number: string;
  charter_org: string;
  meeting_location: string;
  meeting_day: string;
  notes: string;
  patrols: PatrolSetupData[];
}

interface PatrolSetupData {
  name: string;
  tempId: string; // for tracking in UI before creation
}

interface RosterFileData {
  troopNumber: string;
  file: File | null;
}

/**
 * InstanceSetupWizard
 * Multi-step wizard for setting up a new Trailhead instance
 *
 * Steps:
 * 1. Organization name/description
 * 2. Add troops with patrol configuration
 * 3. Import rosters per troop (optional)
 * 4. Complete setup
 */
const InstanceSetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Organization setup
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Step 2: Troop setup
  const [troops, setTroops] = useState<TroopSetupData[]>([
    {
      number: "",
      charter_org: "",
      meeting_location: "",
      meeting_day: "",
      notes: "",
      patrols: [],
    },
  ]);
  const [createdTroops, setCreatedTroops] = useState<
    Array<{ id: string; number: string }>
  >([]);

  // Step 3: Roster import
  const [rosterFiles, setRosterFiles] = useState<RosterFileData[]>([]);

  useEffect(() => {
    // Initialize roster file slots based on created troops
    if (createdTroops.length > 0 && rosterFiles.length === 0) {
      setRosterFiles(
        createdTroops.map((troop) => ({
          troopNumber: troop.number,
          file: null,
        }))
      );
    }
  }, [createdTroops]);

  const handleOrgNext = async () => {
    if (!orgName.trim()) {
      setError("Organization name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const organization = await organizationAPI.create({
        name: orgName.trim(),
        description: orgDescription.trim() || null,
      });

      setOrganizationId(organization.id);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  const handleTroopChange = (
    index: number,
    field: keyof TroopSetupData,
    value: string
  ) => {
    const newTroops = [...troops];
    if (field === "patrols") return; // Handle patrols separately
    (newTroops[index] as any)[field] = value;
    setTroops(newTroops);
  };

  const addTroop = () => {
    setTroops([
      ...troops,
      {
        number: "",
        charter_org: "",
        meeting_location: "",
        meeting_day: "",
        notes: "",
        patrols: [],
      },
    ]);
  };

  const removeTroop = (index: number) => {
    if (troops.length > 1) {
      setTroops(troops.filter((_, i) => i !== index));
    }
  };

  const addPatrol = (troopIndex: number) => {
    const newTroops = [...troops];
    newTroops[troopIndex].patrols.push({
      name: "",
      tempId: `patrol-${Date.now()}-${Math.random()}`,
    });
    setTroops(newTroops);
  };

  const removePatrol = (troopIndex: number, patrolIndex: number) => {
    const newTroops = [...troops];
    newTroops[troopIndex].patrols.splice(patrolIndex, 1);
    setTroops(newTroops);
  };

  const handlePatrolChange = (
    troopIndex: number,
    patrolIndex: number,
    value: string
  ) => {
    const newTroops = [...troops];
    newTroops[troopIndex].patrols[patrolIndex].name = value;
    setTroops(newTroops);
  };

  const handleTroopsNext = async () => {
    // Validate troops
    if (troops.some((t) => !t.number.trim())) {
      setError("All troops must have a troop number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created: Array<{ id: string; number: string }> = [];

      for (const troop of troops) {
        // Create troop
        const troopResponse = await troopAPI.create({
          number: troop.number.trim(),
          charter_org: troop.charter_org.trim() || null,
          meeting_location: troop.meeting_location.trim() || null,
          meeting_day: troop.meeting_day.trim() || null,
          notes: troop.notes.trim() || null,
          treasurer_email: null,
        } as any); // TODO: Update TroopCreate type to include organization_id

        created.push({ id: troopResponse.id, number: troopResponse.number });

        // Create patrols for this troop
        for (const patrol of troop.patrols) {
          if (patrol.name.trim()) {
            await patrolAPI.create({
              troop_id: troopResponse.id,
              name: patrol.name.trim(),
              is_active: true,
            });
          }
        }
      }

      setCreatedTroops(created);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create troops");
    } finally {
      setLoading(false);
    }
  };

  const handleRosterFileChange = (troopNumber: string, file: File | null) => {
    setRosterFiles((prev) =>
      prev.map((rf) => (rf.troopNumber === troopNumber ? { ...rf, file } : rf))
    );
  };

  const handleRosterImport = async (troopNumber: string) => {
    const rosterData = rosterFiles.find((rf) => rf.troopNumber === troopNumber);
    if (!rosterData?.file) return;

    setLoading(true);
    setError(null);

    try {
      await api.importRoster(rosterData.file);
      alert(`Roster imported successfully for Troop ${troopNumber}`);
    } catch (err: any) {
      console.error(err);
      setError(
        `Failed to import roster for Troop ${troopNumber}: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      // Mark organization setup as complete
      await organizationAPI.completeSetup(organizationId);

      // Navigate to family setup
      navigate("/family-setup");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      "Organization Info",
      "Troop Setup",
      "Import Rosters",
      "Complete",
    ];
    return (
      <div className="flex justify-between mb-8">
        {steps.map((label, idx) => (
          <div
            key={idx}
            className="flex-1 flex items-center"
            style={{ opacity: idx + 1 <= step ? 1 : 0.4 }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
              style={{
                backgroundColor:
                  idx + 1 === step
                    ? "var(--btn-primary-bg)"
                    : idx + 1 < step
                    ? "var(--color-primary)"
                    : "var(--bg-tertiary)",
                color:
                  idx + 1 <= step
                    ? "var(--btn-primary-text)"
                    : "var(--text-secondary)",
              }}
            >
              {idx + 1}
            </div>
            <div
              className="ml-2 text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {label}
            </div>
            {idx < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-4"
                style={{
                  backgroundColor:
                    idx + 1 < step
                      ? "var(--color-primary)"
                      : "var(--border-light)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="max-w-4xl mx-auto mt-10 p-6 rounded shadow"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-light)",
      }}
    >
      <h2
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Instance Setup
      </h2>

      {renderStepIndicator()}

      {error && (
        <div
          className="mb-4 p-3 rounded"
          style={{
            backgroundColor: "var(--alert-error-bg)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--alert-error-border)",
            color: "var(--alert-error-text)",
          }}
        >
          {error}
        </div>
      )}

      {/* Step 1: Organization Info */}
      {step === 1 && (
        <div className="space-y-4">
          <p
            className="text-sm mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Name your organization. This could be a single troop (e.g., "Troop
            123") or a group of troops (e.g., "Ivy Scouts" or "District 5").
          </p>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Organization Name{" "}
              <span style={{ color: "var(--alert-error-text)" }}>*</span>
            </label>
            <input
              type="text"
              required
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-light)",
                outlineColor: "var(--btn-primary-bg)",
              }}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g., Troop 123, Ivy Scouts, District 5"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Description (Optional)
            </label>
            <textarea
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-light)",
                outlineColor: "var(--btn-primary-bg)",
              }}
              rows={3}
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              placeholder="A brief description of your organization"
            />
          </div>

          <button
            onClick={handleOrgNext}
            disabled={loading}
            className="w-full py-2 px-4 rounded mt-4"
            style={{
              backgroundColor: loading
                ? "var(--btn-disabled-bg)"
                : "var(--btn-primary-bg)",
              color: loading
                ? "var(--btn-disabled-text)"
                : "var(--btn-primary-text)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating..." : "Next: Add Troops"}
          </button>
        </div>
      )}

      {/* Step 2: Troop Setup */}
      {step === 2 && (
        <div className="space-y-6">
          <p
            className="text-sm mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Add one or more troops and configure patrols for each.
          </p>

          {troops.map((troop, troopIdx) => (
            <div
              key={troopIdx}
              className="p-4 rounded"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-light)",
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Troop {troopIdx + 1}
                </h3>
                {troops.length > 1 && (
                  <button
                    onClick={() => removeTroop(troopIdx)}
                    className="text-sm px-2 py-1 rounded"
                    style={{
                      backgroundColor: "var(--alert-error-bg)",
                      color: "var(--alert-error-text)",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Troop Number{" "}
                    <span style={{ color: "var(--alert-error-text)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded px-3 py-2"
                    style={{
                      background: "var(--input-bg)",
                      color: "var(--text-primary)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "var(--border-light)",
                    }}
                    value={troop.number}
                    onChange={(e) =>
                      handleTroopChange(troopIdx, "number", e.target.value)
                    }
                    placeholder="e.g., 123"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Charter Organization
                  </label>
                  <input
                    type="text"
                    className="w-full rounded px-3 py-2"
                    style={{
                      background: "var(--input-bg)",
                      color: "var(--text-primary)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "var(--border-light)",
                    }}
                    value={troop.charter_org}
                    onChange={(e) =>
                      handleTroopChange(troopIdx, "charter_org", e.target.value)
                    }
                    placeholder="e.g., First United Methodist Church"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Meeting Location
                  </label>
                  <input
                    type="text"
                    className="w-full rounded px-3 py-2"
                    style={{
                      background: "var(--input-bg)",
                      color: "var(--text-primary)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "var(--border-light)",
                    }}
                    value={troop.meeting_location}
                    onChange={(e) =>
                      handleTroopChange(
                        troopIdx,
                        "meeting_location",
                        e.target.value
                      )
                    }
                    placeholder="e.g., Scout Hut, 123 Main St"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Meeting Day
                  </label>
                  <input
                    type="text"
                    className="w-full rounded px-3 py-2"
                    style={{
                      background: "var(--input-bg)",
                      color: "var(--text-primary)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "var(--border-light)",
                    }}
                    value={troop.meeting_day}
                    onChange={(e) =>
                      handleTroopChange(troopIdx, "meeting_day", e.target.value)
                    }
                    placeholder="e.g., Tuesday"
                  />
                </div>

                {/* Patrols */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label
                      className="block text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Patrols
                    </label>
                    <button
                      onClick={() => addPatrol(troopIdx)}
                      className="text-sm px-3 py-1 rounded"
                      style={{
                        backgroundColor: "var(--btn-secondary-bg)",
                        color: "var(--btn-secondary-text)",
                      }}
                    >
                      + Add Patrol
                    </button>
                  </div>

                  {troop.patrols.length === 0 && (
                    <p
                      className="text-sm italic"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      No patrols yet. Click "Add Patrol" to create one.
                    </p>
                  )}

                  {troop.patrols.map((patrol, patrolIdx) => (
                    <div
                      key={patrol.tempId}
                      className="flex items-center gap-2 mb-2"
                    >
                      <input
                        type="text"
                        className="flex-1 rounded px-3 py-2"
                        style={{
                          background: "var(--input-bg)",
                          color: "var(--text-primary)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: "var(--border-light)",
                        }}
                        value={patrol.name}
                        onChange={(e) =>
                          handlePatrolChange(
                            troopIdx,
                            patrolIdx,
                            e.target.value
                          )
                        }
                        placeholder="Patrol name (e.g., Eagle Patrol)"
                      />
                      <button
                        onClick={() => removePatrol(troopIdx, patrolIdx)}
                        className="text-sm px-2 py-1 rounded"
                        style={{
                          backgroundColor: "var(--alert-error-bg)",
                          color: "var(--alert-error-text)",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addTroop}
            className="w-full py-2 px-4 rounded"
            style={{
              backgroundColor: "var(--btn-secondary-bg)",
              color: "var(--btn-secondary-text)",
            }}
          >
            + Add Another Troop
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-2 px-4 rounded"
              style={{
                backgroundColor: "var(--btn-secondary-bg)",
                color: "var(--btn-secondary-text)",
              }}
            >
              Back
            </button>
            <button
              onClick={handleTroopsNext}
              disabled={loading}
              className="flex-1 py-2 px-4 rounded"
              style={{
                backgroundColor: loading
                  ? "var(--btn-disabled-bg)"
                  : "var(--btn-primary-bg)",
                color: loading
                  ? "var(--btn-disabled-text)"
                  : "var(--btn-primary-text)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating..." : "Next: Import Rosters"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Roster Import */}
      {step === 3 && (
        <div className="space-y-4">
          <p
            className="text-sm mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Optionally import rosters from my.scouting.org for each troop. You
            can skip this and add members manually later.
          </p>

          {rosterFiles.map((rosterData, idx) => (
            <div
              key={idx}
              className="p-4 rounded"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-light)",
              }}
            >
              <h3
                className="font-semibold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Troop {rosterData.troopNumber}
              </h3>

              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) =>
                    handleRosterFileChange(
                      rosterData.troopNumber,
                      e.target.files?.[0] || null
                    )
                  }
                  className="flex-1"
                  style={{ color: "var(--text-primary)" }}
                />
                <button
                  onClick={() => handleRosterImport(rosterData.troopNumber)}
                  disabled={!rosterData.file || loading}
                  className="px-4 py-2 rounded text-sm"
                  style={{
                    backgroundColor:
                      !rosterData.file || loading
                        ? "var(--btn-disabled-bg)"
                        : "var(--btn-primary-bg)",
                    color:
                      !rosterData.file || loading
                        ? "var(--btn-disabled-text)"
                        : "var(--btn-primary-text)",
                    cursor:
                      !rosterData.file || loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Importing..." : "Import"}
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-2 px-4 rounded"
              style={{
                backgroundColor: "var(--btn-secondary-bg)",
                color: "var(--btn-secondary-text)",
              }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 py-2 px-4 rounded"
              style={{
                backgroundColor: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
              }}
            >
              Skip / Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <div className="space-y-4 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Setup Complete!
          </h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Your Trailhead instance is ready. You can now add family members and
            start managing outings.
          </p>

          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full py-2 px-4 rounded mt-4"
            style={{
              backgroundColor: loading
                ? "var(--btn-disabled-bg)"
                : "var(--btn-primary-bg)",
              color: loading
                ? "var(--btn-disabled-text)"
                : "var(--btn-primary-text)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Completing..." : "Continue to Family Setup"}
          </button>
        </div>
      )}
    </div>
  );
};

export default InstanceSetupWizard;
