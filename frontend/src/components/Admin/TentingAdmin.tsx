import React, { useState, useEffect } from "react";
import {
  TentingGroup,
  TentingSummaryResponse,
  TentingSummaryParticipant,
  TentingValidationIssue,
} from "../../types";
import { tentingAPI } from "../../services/api";

interface TentingAdminProps {
  outingId: string;
  outingName: string;
  onClose: () => void;
}

const TentingAdmin: React.FC<TentingAdminProps> = ({
  outingId,
  outingName,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TentingSummaryResponse | null>(null);
  const [validationIssues, setValidationIssues] = useState<
    TentingValidationIssue[]
  >([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );

  // Auto-assign settings
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [autoAssignSettings, setAutoAssignSettings] = useState({
    tent_size_min: 2,
    tent_size_max: 3,
    keep_patrols_together: true,
    max_age_difference: 2,
  });

  useEffect(() => {
    loadSummary();
  }, [outingId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tentingAPI.getSummary(outingId);
      setSummary(data);

      // Also validate
      const issues = await tentingAPI.validateTenting(outingId);
      setValidationIssues(issues);
    } catch (err) {
      console.error("Error loading tenting summary:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load tenting data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      setLoading(true);
      await tentingAPI.createTentingGroup(outingId, {
        outing_id: outingId,
        name: newGroupName.trim(),
        member_ids:
          selectedParticipants.length > 0 ? selectedParticipants : undefined,
      });
      setNewGroupName("");
      setSelectedParticipants([]);
      setShowCreateGroup(false);
      await loadSummary();
    } catch (err) {
      console.error("Error creating tenting group:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create tenting group"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (tentingGroupId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this tenting group?")
    ) {
      return;
    }

    try {
      setLoading(true);
      await tentingAPI.deleteTentingGroup(outingId, tentingGroupId);
      await loadSummary();
    } catch (err) {
      console.error("Error deleting tenting group:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete tenting group"
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
      await tentingAPI.moveParticipant(outingId, {
        participant_id: participantId,
        target_tenting_group_id: targetGroupId ?? undefined,
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

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      await tentingAPI.autoAssign(outingId, autoAssignSettings);
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

  const unassignedParticipants =
    summary?.participants.filter((p) => !p.tenting_group_id && !p.is_adult) ||
    [];

  const errorIssues = validationIssues.filter((i) => i.severity === "error");
  const warningIssues = validationIssues.filter(
    (i) => i.severity === "warning"
  );

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
              ⛺ Tenting Manager
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
              {/* Info Box */}
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
                  📋 Tenting Rules
                </h3>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                  }}
                >
                  <li>
                    Scouts must be within 2 years of age of each other when
                    tenting
                  </li>
                  <li>Scouts of different genders cannot share a tent</li>
                  <li>Prefer scouts in the same patrol to tent together</li>
                  <li>2-3 scouts per tent (2 preferred, 3 if odd numbers)</li>
                </ul>
              </div>

              {/* Validation Issues */}
              {validationIssues.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  {errorIssues.length > 0 && (
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: "var(--alert-error-bg)",
                        border: "1px solid var(--alert-error-border)",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 8px 0",
                          color: "var(--alert-error-text)",
                          fontSize: "1.1rem",
                        }}
                      >
                        🚫 Policy Violations ({errorIssues.length})
                      </h3>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "20px",
                          color: "var(--alert-error-text)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {errorIssues.map((issue, idx) => (
                          <li key={idx}>
                            <strong>{issue.tenting_group_name}:</strong>{" "}
                            {issue.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {warningIssues.length > 0 && (
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
                          margin: "0 0 8px 0",
                          color: "var(--alert-warning-text)",
                          fontSize: "1.1rem",
                        }}
                      >
                        ⚠️ Warnings ({warningIssues.length})
                      </h3>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "20px",
                          color: "var(--alert-warning-text)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {warningIssues.map((issue, idx) => (
                          <li key={idx}>
                            <strong>{issue.tenting_group_name}:</strong>{" "}
                            {issue.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Summary Stats */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "var(--bg-tertiary)",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Total Scouts:{" "}
                  </span>
                  <strong style={{ color: "var(--text-primary)" }}>
                    {summary.scout_count}
                  </strong>
                </div>
                <div
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "var(--bg-tertiary)",
                    borderRadius: "8px",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Tents Created:{" "}
                  </span>
                  <strong style={{ color: "var(--text-primary)" }}>
                    {summary.tenting_groups.length}
                  </strong>
                </div>
                <div
                  style={{
                    padding: "12px 20px",
                    backgroundColor:
                      summary.unassigned_count > 0
                        ? "var(--alert-warning-bg)"
                        : "var(--alert-success-bg)",
                    borderRadius: "8px",
                    border: `1px solid ${
                      summary.unassigned_count > 0
                        ? "var(--alert-warning-border)"
                        : "var(--alert-success-border)"
                    }`,
                  }}
                >
                  <span
                    style={{
                      color:
                        summary.unassigned_count > 0
                          ? "var(--alert-warning-text)"
                          : "var(--alert-success-text)",
                    }}
                  >
                    Unassigned:{" "}
                  </span>
                  <strong
                    style={{
                      color:
                        summary.unassigned_count > 0
                          ? "var(--alert-warning-text)"
                          : "var(--alert-success-text)",
                    }}
                  >
                    {summary.unassigned_count}
                  </strong>
                </div>
              </div>

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
                  ➕ Create Tent
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
                      ? "All scouts are assigned"
                      : "Auto-assign unassigned scouts"
                  }
                >
                  🪄 Auto-Assign Tents
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

              {/* Tenting Groups */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {summary.tenting_groups.map((group) => (
                  <TentingGroupCard
                    key={group.id}
                    group={group}
                    allGroups={summary.tenting_groups}
                    issues={validationIssues.filter(
                      (i) => i.tenting_group_id === group.id
                    )}
                    onDelete={() => handleDeleteGroup(group.id)}
                    onMoveParticipant={handleMoveParticipant}
                    loading={loading}
                  />
                ))}
              </div>

              {/* Unassigned Scouts */}
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
                    ⚠️ Unassigned Scouts ({unassignedParticipants.length})
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {unassignedParticipants.map((p) => (
                      <UnassignedScoutCard
                        key={p.participant_id}
                        participant={p}
                        groups={summary.tenting_groups}
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
                Create Tent
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
                  Tent Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Boys Tent 1, Girls Tent A"
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
                    Add Scouts (optional)
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
                          {p.age && (
                            <span style={{ color: "var(--text-secondary)" }}>
                              {" "}
                              (Age {p.age})
                            </span>
                          )}
                          {p.gender && (
                            <span style={{ color: "var(--text-secondary)" }}>
                              {" "}
                              {p.gender === "male" ? "♂️" : "♀️"}
                            </span>
                          )}
                          {p.patrol_name && (
                            <span style={{ color: "var(--text-secondary)" }}>
                              {" "}
                              • {p.patrol_name}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
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
                    cursor:
                      !newGroupName.trim() || loading
                        ? "not-allowed"
                        : "pointer",
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
                Auto-Assign Tenting Settings
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
                  Tent Size
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    min={2}
                    max={4}
                    value={autoAssignSettings.tent_size_min}
                    onChange={(e) =>
                      setAutoAssignSettings({
                        ...autoAssignSettings,
                        tent_size_min: parseInt(e.target.value) || 2,
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
                    max={4}
                    value={autoAssignSettings.tent_size_max}
                    onChange={(e) =>
                      setAutoAssignSettings({
                        ...autoAssignSettings,
                        tent_size_max: parseInt(e.target.value) || 3,
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
                  <span style={{ color: "var(--text-secondary)" }}>scouts</span>
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "bold",
                    color: "var(--text-primary)",
                  }}
                >
                  Maximum Age Difference
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={autoAssignSettings.max_age_difference}
                    onChange={(e) =>
                      setAutoAssignSettings({
                        ...autoAssignSettings,
                        max_age_difference: parseInt(e.target.value) || 2,
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
                  <span style={{ color: "var(--text-secondary)" }}>years</span>
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
                  Keep patrol members together when possible
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
                ℹ️ This will create new tents for {unassignedParticipants.length}{" "}
                unassigned scouts, grouping by gender and age compatibility.
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
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

// Sub-component: Tenting Group Card
interface TentingGroupCardProps {
  group: TentingGroup;
  allGroups: TentingGroup[];
  issues: TentingValidationIssue[];
  onDelete: () => void;
  onMoveParticipant: (participantId: string, groupId: string | null) => void;
  loading: boolean;
}

const TentingGroupCard: React.FC<TentingGroupCardProps> = ({
  group,
  allGroups,
  issues,
  onDelete,
  onMoveParticipant,
  loading,
}) => {
  const hasErrors = issues.some((i) => i.severity === "error");

  return (
    <div
      style={{
        border: `2px solid ${
          hasErrors ? "var(--alert-error-border)" : "var(--card-border)"
        }`,
        borderRadius: "8px",
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: hasErrors
            ? "var(--alert-error-bg)"
            : "var(--bg-tertiary)",
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
            ⛺ {group.name}
            {hasErrors && " 🚫"}
          </h4>
          <p
            style={{
              margin: "4px 0 0 0",
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
            }}
          >
            {group.member_count} scout{group.member_count !== 1 ? "s" : ""}
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
          title="Delete tent"
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
            No scouts yet
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
                  backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "4px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "var(--text-primary)",
                    }}
                  >
                    {member.participant_name}
                  </span>
                  {member.age && (
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {" "}
                      (Age {member.age})
                    </span>
                  )}
                  {member.gender && (
                    <span style={{ marginLeft: "4px" }}>
                      {member.gender === "male" ? "♂️" : "♀️"}
                    </span>
                  )}
                  {member.patrol_name && (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {member.patrol_name}
                    </div>
                  )}
                </div>
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
                  <option value="remove">Remove from tent</option>
                  {allGroups
                    .filter((g) => g.id !== group.id)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        → {g.name}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component: Unassigned Scout Card
interface UnassignedScoutCardProps {
  participant: TentingSummaryParticipant;
  groups: TentingGroup[];
  onAssign: (groupId: string) => void;
  loading: boolean;
}

const UnassignedScoutCard: React.FC<UnassignedScoutCardProps> = ({
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
        {participant.age && (
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {" "}
            (Age {participant.age})
          </span>
        )}
        {participant.gender && (
          <span style={{ marginLeft: "4px" }}>
            {participant.gender === "male" ? "♂️" : "♀️"}
          </span>
        )}
        {participant.patrol_name && (
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {" "}
            • {participant.patrol_name}
          </span>
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

export default TentingAdmin;
