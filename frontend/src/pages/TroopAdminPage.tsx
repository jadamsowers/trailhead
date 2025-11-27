import React, { useEffect, useState } from "react";
import {
  troopAPI,
  patrolAPI,
  TroopResponse,
  TroopCreate,
  TroopUpdate,
  PatrolResponse,
  PatrolCreate,
  PatrolUpdate,
} from "../services/api";

export const TroopAdminPage: React.FC = () => {
  const [troops, setTroops] = useState<TroopResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTroop, setSelectedTroop] = useState<TroopResponse | null>(
    null
  );
  const [showTroopForm, setShowTroopForm] = useState(false);
  const [showPatrolForm, setShowPatrolForm] = useState(false);
  const [editingPatrol, setEditingPatrol] = useState<PatrolResponse | null>(
    null
  );

  useEffect(() => {
    fetchTroops();
  }, []);

  async function fetchTroops() {
    setLoading(true);
    setError(null);
    try {
      const data = await troopAPI.getAll();
      setTroops(data);
      // If a troop is currently selected, update it with fresh data
      if (selectedTroop) {
        const updatedTroop = data.find((t) => t.id === selectedTroop.id);
        if (updatedTroop) {
          setSelectedTroop(updatedTroop);
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to load troops");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTroop(troop: TroopResponse) {
    setSelectedTroop(troop);
    setShowTroopForm(false);
    setShowPatrolForm(false);
    setEditingPatrol(null);
  }

  function handleAddTroop() {
    setSelectedTroop(null);
    setShowTroopForm(true);
    setShowPatrolForm(false);
    setEditingPatrol(null);
  }

  function handleEditTroop(troop: TroopResponse) {
    setSelectedTroop(troop);
    setShowTroopForm(true);
    setShowPatrolForm(false);
    setEditingPatrol(null);
  }

  function handleAddPatrol() {
    setShowPatrolForm(true);
    setEditingPatrol(null);
  }

  function handleEditPatrol(patrol: PatrolResponse) {
    setShowPatrolForm(true);
    setEditingPatrol(patrol);
  }

  async function handleDeleteTroop(id: string) {
    if (!window.confirm("Delete this troop?")) return;
    try {
      await troopAPI.delete(id);
      fetchTroops();
      setSelectedTroop(null);
    } catch (e: any) {
      alert(e.message || "Failed to delete troop");
    }
  }

  async function handleDeletePatrol(id: string) {
    if (!window.confirm("Delete this patrol?")) return;
    try {
      await patrolAPI.delete(id);
      fetchTroops();
    } catch (e: any) {
      alert(e.message || "Failed to delete patrol");
    }
  }

  return (
    <div>
      {error && (
        <div
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: "var(--alert-error-bg)",
            border: "1px solid var(--alert-error-border)",
          }}
        >
          <p
            className="text-sm"
            style={{
              color: "var(--alert-error-text)",
            }}
          >
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Troops List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Troops
            </h3>
            <button
              type="button"
              className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-lg"
              style={{
                backgroundColor: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
              }}
              onClick={handleAddTroop}
            >
              Add Troop
            </button>
          </div>
          {loading ? (
            <div
              className="text-center py-8"
              style={{ color: "var(--text-secondary)" }}
            >
              Loading...
            </div>
          ) : (
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border-light)",
              }}
            >
              {troops.map((troop, idx) => (
                <div
                  key={troop.id}
                  className="p-4 cursor-pointer transition-colors"
                  style={{
                    borderBottom:
                      idx < troops.length - 1
                        ? "1px solid var(--border-light)"
                        : "none",
                    backgroundColor:
                      selectedTroop?.id === troop.id
                        ? "rgba(var(--bsa-olive-rgb), 0.1)"
                        : "transparent",
                  }}
                  onClick={() => handleSelectTroop(troop)}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="font-medium"
                      style={{
                        color:
                          selectedTroop?.id === troop.id
                            ? "var(--color-primary)"
                            : "var(--text-primary)",
                      }}
                    >
                      Troop {troop.number}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm rounded transition-colors"
                        style={{
                          backgroundColor: "var(--btn-secondary-bg)",
                          color: "var(--btn-secondary-text)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTroop(troop);
                        }}
                        aria-label={`Edit troop ${troop.number}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm rounded transition-colors"
                        style={{
                          backgroundColor: "#dc2626",
                          color: "white",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTroop(troop.id);
                        }}
                        aria-label={`Delete troop ${troop.number}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {troops.length === 0 && (
                <div
                  className="p-8 text-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No troops yet. Click "Add Troop" to get started.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Details/Forms */}
        <div className="lg:col-span-2">
          {showTroopForm && (
            <TroopForm
              troop={selectedTroop}
              onSuccess={() => {
                setShowTroopForm(false);
                fetchTroops();
              }}
              onCancel={() => setShowTroopForm(false)}
            />
          )}
          {selectedTroop && !showTroopForm && (
            <div>
              <div className="mb-6">
                <h3
                  className="text-base font-semibold mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  Troop {selectedTroop.number}
                </h3>
                <div
                  className="p-6 rounded-lg space-y-3"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Charter Org:
                    </strong>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      {selectedTroop.charter_org || <em>None</em>}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Meeting Location:
                    </strong>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      {selectedTroop.meeting_location || <em>None</em>}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Meeting Day:
                    </strong>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      {selectedTroop.meeting_day || <em>None</em>}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Treasurer Email:
                    </strong>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      {selectedTroop.treasurer_email ? (
                        <a href={`mailto:${selectedTroop.treasurer_email}`} style={{ color: "var(--color-primary)" }}>
                          {selectedTroop.treasurer_email}
                        </a>
                      ) : (
                        <em>None</em>
                      )}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Notes:
                    </strong>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      {selectedTroop.notes || <em>None</em>}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Patrols
                  </h3>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-lg"
                    style={{
                      backgroundColor: "var(--btn-primary-bg)",
                      color: "var(--btn-primary-text)",
                    }}
                    onClick={handleAddPatrol}
                  >
                    Add Patrol
                  </button>
                </div>
                <div
                  className="rounded-lg overflow-hidden mb-6"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  {selectedTroop.patrols.map((patrol, idx) => (
                    <div
                      key={patrol.id}
                      className="p-4 flex justify-between items-center"
                      style={{
                        borderBottom:
                          idx < selectedTroop.patrols.length - 1
                            ? "1px solid var(--border-light)"
                            : "none",
                      }}
                    >
                      <span style={{ color: "var(--text-primary)" }}>
                        {patrol.name}{" "}
                        {!patrol.is_active && (
                          <em style={{ color: "var(--text-secondary)" }}>
                            (inactive)
                          </em>
                        )}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-sm rounded transition-colors"
                          style={{
                            backgroundColor: "var(--btn-secondary-bg)",
                            color: "var(--btn-secondary-text)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPatrol(patrol);
                          }}
                          aria-label={`Edit patrol ${patrol.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm rounded transition-colors"
                          style={{
                            backgroundColor: "#dc2626",
                            color: "white",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePatrol(patrol.id);
                          }}
                          aria-label={`Delete patrol ${patrol.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedTroop.patrols.length === 0 && (
                    <div
                      className="p-8 text-center"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      No patrols yet. Click "Add Patrol" to get started.
                    </div>
                  )}
                </div>
                {showPatrolForm && (
                  <PatrolForm
                    troopId={selectedTroop.id}
                    patrol={editingPatrol}
                    onSuccess={() => {
                      setShowPatrolForm(false);
                      fetchTroops();
                    }}
                    onCancel={() => setShowPatrolForm(false)}
                  />
                )}
              </div>
            </div>
          )}
          {!selectedTroop && !showTroopForm && (
            <div
              className="p-12 text-center rounded-lg"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border-light)",
              }}
            >
              <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
                Select a troop from the list to view details, or click "Add
                Troop" to create a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TroopFormProps {
  troop?: TroopResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TroopForm: React.FC<TroopFormProps> = ({
  troop,
  onSuccess,
  onCancel,
}) => {
  const [number, setNumber] = useState(troop?.number || "");
  const [form, setForm] = useState<Omit<TroopCreate, "number">>({
    charter_org: troop?.charter_org || "",
    meeting_location: troop?.meeting_location || "",
    meeting_day: troop?.meeting_day || "",
    notes: troop?.notes || "",
    treasurer_email: troop?.treasurer_email || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (troop) {
        await troopAPI.update(troop.id, form as TroopUpdate);
      } else {
        await troopAPI.create({ ...form, number } as TroopCreate);
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to save troop");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-light)",
      }}
      onSubmit={handleSubmit}
    >
      <h3
        className="text-xl font-semibold font-heading mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        {troop ? "Edit Troop" : "Add Troop"}
      </h3>
      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--alert-error-bg)",
            border: "1px solid var(--alert-error-border)",
            color: "var(--alert-error-text)",
          }}
        >
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label
            className="block font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Troop Number
          </label>
          <input
            className="w-full px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            disabled={!!troop}
          />
        </div>
        <div>
          <label
            className="block font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Charter Org
          </label>
          <input
            className="w-full px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            value={form.charter_org || ""}
            onChange={(e) => setForm({ ...form, charter_org: e.target.value })}
          />
        </div>
        <div>
          <label
            className="block font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Meeting Location
          </label>
          <input
            className="w-full px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            value={form.meeting_location || ""}
            onChange={(e) =>
              setForm({ ...form, meeting_location: e.target.value })
            }
          />
        </div>
        <div>
          <label
            className="block font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Meeting Day
          </label>
          <input
            className="w-full px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            value={form.meeting_day || ""}
            onChange={(e) => setForm({ ...form, meeting_day: e.target.value })}
          />
        </div>
        <div>
          <label
            className="block font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Treasurer Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            value={form.treasurer_email || ""}
            onChange={(e) =>
              setForm({ ...form, treasurer_email: e.target.value })
            }
            placeholder="treasurer@example.com"
          />
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Email for grubmasters to send food receipts for reimbursement
          </p>
        </div>
        <div>
          <label
            className="block font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Notes
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            rows={4}
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          className="px-6 py-2 rounded-lg font-medium transition-all hover:shadow-lg"
          style={{
            backgroundColor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
          }}
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          className="px-6 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: "var(--btn-secondary-bg)",
            color: "var(--btn-secondary-text)",
          }}
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

interface PatrolFormProps {
  troopId: string;
  patrol?: PatrolResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PatrolForm: React.FC<PatrolFormProps> = ({
  troopId,
  patrol,
  onSuccess,
  onCancel,
}) => {
  const [form, setForm] = useState<PatrolCreate | PatrolUpdate>({
    troop_id: troopId,
    name: patrol?.name || "",
    is_active: patrol?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (patrol) {
        await patrolAPI.update(patrol.id, form as PatrolUpdate);
      } else {
        await patrolAPI.create(form as PatrolCreate);
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to save patrol");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-light)",
      }}
      onSubmit={handleSubmit}
    >
      <h3
        className="text-xl font-semibold font-heading mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        {patrol ? "Edit Patrol" : "Add Patrol"}
      </h3>
      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--alert-error-bg)",
            border: "1px solid var(--alert-error-border)",
            color: "var(--alert-error-text)",
          }}
        >
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label
            className="block font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Patrol Name
          </label>
          <input
            className="w-full px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="patrol-active"
            className="w-4 h-4 rounded"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <label
            htmlFor="patrol-active"
            className="font-medium cursor-pointer"
            style={{ color: "var(--text-primary)" }}
          >
            Active
          </label>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          className="px-6 py-2 rounded-lg font-medium transition-all hover:shadow-lg"
          style={{
            backgroundColor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
          }}
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          className="px-6 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: "var(--btn-secondary-bg)",
            color: "var(--btn-secondary-text)",
          }}
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TroopAdminPage;
