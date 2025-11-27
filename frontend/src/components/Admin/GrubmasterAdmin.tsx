import React, { useState, useEffect } from "react";
import {
  EatingGroup,
  GrubmasterSummaryResponse,
  GrubmasterSummaryParticipant,
  GRUBMASTER_REASONS,
} from "../../types";
import { grubmasterAPI } from "../../services/api";

interface GrubmasterAdminProps {
  outingId: string;
  outingName: string;
  onClose: () => void;
}

const GrubmasterAdmin: React.FC<GrubmasterAdminProps> = ({
  outingId,
  outingName,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<GrubmasterSummaryResponse | null>(
    null
  );
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );

  // Auto-assign settings
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignSettings, setAutoAssignSettings] = useState({
    group_size_min: 4,
    group_size_max: 6,
    keep_patrols_together: true,
    group_by_dietary: true,
  });

  useEffect(() => {
    loadSummary();
  }, [outingId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await grubmasterAPI.getSummary(outingId);
      setSummary(data);
    } catch (err) {
      console.error("Error loading grubmaster summary:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load grubmaster data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      setLoading(true);
      await grubmasterAPI.createEatingGroup(outingId, {
        outing_id: outingId,
        name: newGroupName.trim(),
        member_ids: selectedParticipants.length > 0 ? selectedParticipants : undefined,
      });
      setNewGroupName("");
      setSelectedParticipants([]);
      setShowCreateGroup(false);
      await loadSummary();
    } catch (err) {
      console.error("Error creating eating group:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create eating group"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (eatingGroupId: string) => {
    if (!window.confirm("Are you sure you want to delete this eating group?")) {
      return;
    }

    try {
      setLoading(true);
      await grubmasterAPI.deleteEatingGroup(outingId, eatingGroupId);
      await loadSummary();
    } catch (err) {
      console.error("Error deleting eating group:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete eating group"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMoveParticipant = async (
    participantId: string,
    targetGroupId: string | null
  ) => {
    try {
      setLoading(true);
      await grubmasterAPI.moveParticipant(outingId, {
        participant_id: participantId,
        target_eating_group_id: targetGroupId ?? undefined,
      });
      await loadSummary();
    } catch (err) {
      console.error("Error moving participant:", err);
      setError(
        err instanceof Error ? err.message : "Failed to move participant"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGrubmaster = async (
    participantId: string,
    currentStatus: boolean
  ) => {
    try {
      setLoading(true);
      await grubmasterAPI.setGrubmaster(outingId, participantId, !currentStatus);
      await loadSummary();
    } catch (err) {
      console.error("Error toggling grubmaster status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update grubmaster status"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      await grubmasterAPI.autoAssign(outingId, autoAssignSettings);
      setShowAutoAssign(false);
      await loadSummary();
    } catch (err) {
      console.error("Error auto-assigning groups:", err);
      setError(
        err instanceof Error ? err.message : "Failed to auto-assign groups"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async () => {
    try {
      setLoading(true);
      const result = await grubmasterAPI.sendEatingGroupEmails(outingId, {
        include_budget_info: true,
        include_dietary_info: true,
      });

      // Open mailto links for each group
      for (const group of result.groups) {
        if (group.grubmaster_emails.length > 0) {
          const mailtoLink = `mailto:${group.grubmaster_emails.join(
            ","
          )}?subject=${encodeURIComponent(
            group.subject
          )}&body=${encodeURIComponent(group.body)}`;
          window.open(mailtoLink, "_blank");
        }
      }

      alert(
        `Email data prepared for ${result.groups.length} groups. Check your email client.`
      );
    } catch (err) {
      console.error("Error sending emails:", err);
      setError(err instanceof Error ? err.message : "Failed to generate emails");
    } finally {
      setLoading(false);
    }
  };

  const getGrubmasterReasonLabel = (reason: string | undefined) => {
    if (!reason) return "";
    const found = GRUBMASTER_REASONS.find((r) => r.value === reason);
    return found ? found.label : reason;
  };

  const unassignedParticipants = summary?.participants.filter(
    (p) => !p.eating_group_id
  ) || [];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--modal-overlay-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--card-border)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--card-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "var(--text-primary)",
                fontSize: "1.5rem",
              }}
            >
              🍳 Grubmaster Management
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              {outingName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "8px",
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px",
          }}
        >
          {loading && !summary && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "var(--alert-error-bg)",
                border: "1px solid var(--alert-error-border)",
                borderRadius: "4px",
                color: "var(--alert-error-text)",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {summary && (
            <>
              {/* Budget Summary */}
              {summary.food_budget_per_person && (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--alert-info-bg)",
                    border: "1px solid var(--alert-info-border)",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "var(--text-primary)",
                      fontSize: "1.1rem",
                    }}
                  >
                    💰 Food Budget
                  </h3>
                  <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                    <strong>${summary.food_budget_per_person.toFixed(2)}</strong>{" "}
                    per person
                    {summary.budget_type === "per_meal" && summary.meal_count && (
                      <> × {summary.meal_count} meals</>
                    )}
                    {summary.total_budget && (
                      <> = <strong>${summary.total_budget.toFixed(2)}</strong> total budget per person</>
                    )}
                  </p>
                  {summary.treasurer_email && (
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        color: "var(--text-secondary)",
                        fontSize: "0.9rem",
                      }}
                    >
                      📧 Send receipts to:{" "}
                      <a
                        href={`mailto:${summary.treasurer_email}`}
                        style={{ color: "var(--color-primary)" }}
                      >
                        {summary.treasurer_email}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {/* Grubmaster Requests Summary */}
              {summary.grubmaster_requests_count > 0 && (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--alert-success-bg)",
                    border: "1px solid var(--alert-success-border)",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "var(--text-primary)",
                      fontSize: "1.1rem",
                    }}
                  >
                    ✋ Grubmaster Volunteers ({summary.grubmaster_requests_count})
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {summary.participants
                      .filter((p) => p.grubmaster_interest)
                      .map((p) => (
                        <span
                          key={p.participant_id}
                          style={{
                            padding: "4px 12px",
                            backgroundColor: "var(--badge-success-bg)",
                            color: "var(--badge-success-text)",
                            borderRadius: "16px",
                            fontSize: "0.9rem",
                          }}
                        >
                          {p.name}
                          {p.grubmaster_reason && (
                            <span style={{ opacity: 0.8 }}>
                              {" "}
                              - {getGrubmasterReasonLabel(p.grubmaster_reason)}
                            </span>
                          )}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <button
                  onClick={() => setShowCreateGroup(true)}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "var(--btn-primary-bg)",
                    color: "var(--btn-primary-text)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ➕ Create Group
                </button>
                <button
                  onClick={() => setShowAutoAssign(true)}
                  disabled={loading || unassignedParticipants.length === 0}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "var(--btn-secondary-bg)",
                    color: "var(--btn-secondary-text)",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      loading || unassignedParticipants.length === 0
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: "bold",
                  }}
                  title={
                    unassignedParticipants.length === 0
                      ? "All participants are assigned"
                      : "Auto-assign unassigned participants"
                  }
                >
                  🪄 Auto-Assign Groups
                </button>
                <button
                  onClick={handleSendEmails}
                  disabled={loading || summary.eating_groups.length === 0}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      summary.eating_groups.length === 0
                        ? "var(--btn-disabled-bg)"
                        : "var(--btn-success-bg)",
                    color:
                      summary.eating_groups.length === 0
                        ? "var(--btn-disabled-text)"
                        : "var(--btn-success-text)",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      loading || summary.eating_groups.length === 0
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  📧 Email Grubmasters
                </button>
                <button
                  onClick={loadSummary}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "var(--btn-secondary-bg)",
                    color: "var(--btn-secondary-text)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  🔄 Refresh
                </button>
              </div>

              {/* Eating Groups */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {summary.eating_groups.map((group) => (
                  <EatingGroupCard
                    key={group.id}
                    group={group}
                    allGroups={summary.eating_groups}
                    onDelete={() => handleDeleteGroup(group.id)}
                    onMoveParticipant={handleMoveParticipant}
                    onToggleGrubmaster={handleToggleGrubmaster}
                    loading={loading}
                  />
                ))}
              </div>

              {/* Unassigned Participants */}
              {unassignedParticipants.length > 0 && (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "var(--alert-warning-bg)",
                    border: "1px solid var(--alert-warning-border)",
                    borderRadius: "8px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 12px 0",
                      color: "var(--text-primary)",
                      fontSize: "1.1rem",
                    }}
                  >
                    ⚠️ Unassigned Participants ({unassignedParticipants.length})
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {unassignedParticipants.map((p) => (
                      <UnassignedParticipantCard
                        key={p.participant_id}
                        participant={p}
                        groups={summary.eating_groups}
                        onAssign={(groupId) =>
                          handleMoveParticipant(p.participant_id, groupId)
                        }
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--card-bg)",
                borderRadius: "8px",
                padding: "24px",
                maxWidth: "500px",
                width: "90%",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", color: "var(--text-primary)" }}>
                Create Eating Group
              </h3>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "bold",
                    color: "var(--text-primary)",
                  }}
                >
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Patrol A Group, Weekend Crew"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--input-border)",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: "var(--input-bg)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              {unassignedParticipants.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "bold",
                      color: "var(--text-primary)",
                    }}
                  >
                    Add Members (optional)
                  </label>
                  <div
                    style={{
                      maxHeight: "200px",
                      overflow: "auto",
                      border: "1px solid var(--input-border)",
                      borderRadius: "4px",
                      padding: "8px",
                    }}
                  >
                    {unassignedParticipants.map((p) => (
                      <label
                        key={p.participant_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(
                            p.participant_id
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants([
                                ...selectedParticipants,
                                p.participant_id,
                              ]);
                            } else {
                              setSelectedParticipants(
                                selectedParticipants.filter(
                                  (id) => id !== p.participant_id
                                )
                              );
                            }
                          }}
                        />
                        <span style={{ color: "var(--text-primary)" }}>
                          {p.name}
                          {p.patrol_name && (
                            <span style={{ color: "var(--text-secondary)" }}>
                              {" "}
                              ({p.patrol_name})
                            </span>
                          )}
                          {p.grubmaster_interest && (
                            <span style={{ color: "var(--color-success)" }}>
                              {" "}
                              ⭐
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName("");
                    setSelectedParticipants([]);
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "var(--btn-secondary-bg)",
                    color: "var(--btn-secondary-text)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || loading}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: !newGroupName.trim()
                      ? "var(--btn-disabled-bg)"
                      : "var(--btn-primary-bg)",
                    color: !newGroupName.trim()
                      ? "var(--btn-disabled-text)"
                      : "var(--btn-primary-text)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: !newGroupName.trim() || loading ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Assign Modal */}
        {showAutoAssign && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--card-bg)",
                borderRadius: "8px",
                padding: "24px",
                maxWidth: "500px",
                width: "90%",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", color: "var(--text-primary)" }}>
                Auto-Assign Settings
              </h3>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "bold",
                    color: "var(--text-primary)",
                  }}
                >
                  Group Size
                </label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={autoAssignSettings.group_size_min}
                    onChange={(e) =>
                      setAutoAssignSettings({
                        ...autoAssignSettings,
                        group_size_min: parseInt(e.target.value) || 4,
                      })
                    }
                    style={{
                      width: "60px",
                      padding: "8px",
                      border: "1px solid var(--input-border)",
                      borderRadius: "4px",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <span style={{ color: "var(--text-secondary)" }}>to</span>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={autoAssignSettings.group_size_max}
                    onChange={(e) =>
                      setAutoAssignSettings({
                        ...autoAssignSettings,
                        group_size_max: parseInt(e.target.value) || 6,
                      })
                    }
                    style={{
                      width: "60px",
                      padding: "8px",
                      border: "1px solid var(--input-border)",
                      borderRadius: "4px",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <span style={{ color: "var(--text-secondary)" }}>people</span>
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoAssignSettings.keep_patrols_together}
                    onChange={(e) =>
                      setAutoAssignSettings({
                        ...autoAssignSettings,
                        keep_patrols_together: e.target.checked,
                      })
                    }
                  />
                  Keep patrol members together
                </label>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoAssignSettings.group_by_dietary}
                    onChange={(e) =>
                      setAutoAssignSettings({
                        ...autoAssignSettings,
                        group_by_dietary: e.target.checked,
                      })
                    }
                  />
                  Group by dietary preferences
                </label>
              </div>
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "var(--alert-info-bg)",
                  borderRadius: "4px",
                  marginBottom: "16px",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                }}
              >
                ℹ️ This will create new groups for {unassignedParticipants.length}{" "}
                unassigned participants. Scouts who volunteered to be grubmaster
                will be assigned that role.
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowAutoAssign(false)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "var(--btn-secondary-bg)",
                    color: "var(--btn-secondary-text)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAutoAssign}
                  disabled={loading}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "var(--btn-primary-bg)",
                    color: "var(--btn-primary-text)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {loading ? "Assigning..." : "Auto-Assign"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component: Eating Group Card
interface EatingGroupCardProps {
  group: EatingGroup;
  allGroups: EatingGroup[];
  onDelete: () => void;
  onMoveParticipant: (participantId: string, groupId: string | null) => void;
  onToggleGrubmaster: (participantId: string, currentStatus: boolean) => void;
  loading: boolean;
}

const EatingGroupCard: React.FC<EatingGroupCardProps> = ({
  group,
  allGroups,
  onDelete,
  onMoveParticipant,
  onToggleGrubmaster,
  loading,
}) => {
  const grubmasters = group.members.filter((m) => m.is_grubmaster);

  return (
    <div
      style={{
        border: "1px solid var(--card-border)",
        borderRadius: "8px",
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "var(--bg-tertiary)",
          borderBottom: "1px solid var(--card-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              color: "var(--text-primary)",
              fontSize: "1rem",
            }}
          >
            {group.name}
          </h4>
          <p
            style={{
              margin: "4px 0 0 0",
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
            }}
          >
            {group.member_count} members
            {grubmasters.length > 0 && (
              <span style={{ color: "var(--color-success)" }}>
                {" "}
                • {grubmasters.length} grubmaster
                {grubmasters.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onDelete}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            color: "var(--color-error)",
            fontSize: "18px",
            padding: "4px",
          }}
          title="Delete group"
        >
          🗑️
        </button>
      </div>
      <div style={{ padding: "12px 16px" }}>
        {group.members.length === 0 ? (
          <p
            style={{
              color: "var(--text-secondary)",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            No members yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {group.members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  backgroundColor: member.is_grubmaster
                    ? "var(--alert-success-bg)"
                    : "var(--bg-tertiary)",
                  borderRadius: "4px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>
                    {member.participant_name}
                    {member.is_grubmaster && " 👨‍🍳"}
                  </span>
                  {member.patrol_name && (
                    <span
                      style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}
                    >
                      {" "}
                      • {member.patrol_name}
                    </span>
                  )}
                  {(member.dietary_restrictions.length > 0 ||
                    member.allergies.length > 0) && (
                    <div
                      style={{
                        marginTop: "4px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                      }}
                    >
                      {member.dietary_restrictions.map((d) => (
                        <span
                          key={d}
                          style={{
                            padding: "2px 6px",
                            backgroundColor: "var(--badge-secondary-bg)",
                            borderRadius: "3px",
                            fontSize: "11px",
                            color: "var(--badge-secondary-text)",
                          }}
                        >
                          {d}
                        </span>
                      ))}
                      {member.allergies.map((a) => (
                        <span
                          key={a}
                          style={{
                            padding: "2px 6px",
                            backgroundColor: "var(--card-error-bg)",
                            borderRadius: "3px",
                            fontSize: "11px",
                            color: "var(--color-error)",
                          }}
                        >
                          ⚠️ {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() =>
                      onToggleGrubmaster(member.participant_id, member.is_grubmaster)
                    }
                    disabled={loading}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: member.is_grubmaster
                        ? "var(--btn-secondary-bg)"
                        : "var(--btn-success-bg)",
                      color: member.is_grubmaster
                        ? "var(--btn-secondary-text)"
                        : "var(--btn-success-text)",
                      border: "none",
                      borderRadius: "4px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "12px",
                    }}
                    title={
                      member.is_grubmaster ? "Remove grubmaster" : "Make grubmaster"
                    }
                  >
                    {member.is_grubmaster ? "✓ GM" : "→ GM"}
                  </button>
                  <select
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "remove") {
                        onMoveParticipant(member.participant_id, null);
                      } else if (value) {
                        onMoveParticipant(member.participant_id, value);
                      }
                    }}
                    disabled={loading}
                    style={{
                      padding: "4px",
                      border: "1px solid var(--input-border)",
                      borderRadius: "4px",
                      fontSize: "12px",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--text-primary)",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="">Move...</option>
                    <option value="remove">Remove from group</option>
                    {allGroups
                      .filter((g) => g.id !== group.id)
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          → {g.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component: Unassigned Participant Card
interface UnassignedParticipantCardProps {
  participant: GrubmasterSummaryParticipant;
  groups: EatingGroup[];
  onAssign: (groupId: string) => void;
  loading: boolean;
}

const UnassignedParticipantCard: React.FC<UnassignedParticipantCardProps> = ({
  participant,
  groups,
  onAssign,
  loading,
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "4px",
      }}
    >
      <span style={{ color: "var(--text-primary)" }}>
        {participant.name}
        {participant.patrol_name && (
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {" "}
            ({participant.patrol_name})
          </span>
        )}
        {participant.grubmaster_interest && (
          <span style={{ color: "var(--color-success)" }}> ⭐</span>
        )}
      </span>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) {
            onAssign(e.target.value);
          }
        }}
        disabled={loading || groups.length === 0}
        style={{
          padding: "4px 8px",
          border: "1px solid var(--input-border)",
          borderRadius: "4px",
          fontSize: "12px",
          backgroundColor: "var(--input-bg)",
          color: "var(--text-primary)",
          cursor: loading || groups.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        <option value="">Assign to...</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name} ({g.member_count})
          </option>
        ))}
      </select>
    </div>
  );
};

export default GrubmasterAdmin;
