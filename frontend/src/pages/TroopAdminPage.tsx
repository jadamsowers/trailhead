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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Troop Administration</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="flex gap-8">
        <div className="w-1/3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Troops</h2>
            <button className="btn btn-primary" onClick={handleAddTroop}>
              Add Troop
            </button>
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <ul className="border rounded divide-y">
              {troops.map((troop) => (
                <li
                  key={troop.id}
                  className={`p-2 cursor-pointer hover:bg-gray-100 ${
                    selectedTroop?.id === troop.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleSelectTroop(troop)}
                >
                  <div className="flex justify-between items-center">
                    <span>Troop {troop.number}</span>
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTroop(troop);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1">
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
              <h2 className="text-xl font-semibold mb-2">
                Troop {selectedTroop.number}
              </h2>
              <div className="mb-2">
                <button
                  className="btn btn-secondary mr-2"
                  onClick={handleAddPatrol}
                >
                  Add Patrol
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteTroop(selectedTroop.id)}
                >
                  Delete Troop
                </button>
              </div>
              <div className="mb-4">
                <strong>Charter Org:</strong>{" "}
                {selectedTroop.charter_org || <em>None</em>}
                <br />
                <strong>Meeting Location:</strong>{" "}
                {selectedTroop.meeting_location || <em>None</em>}
                <br />
                <strong>Meeting Day:</strong>{" "}
                {selectedTroop.meeting_day || <em>None</em>}
                <br />
                <strong>Notes:</strong> {selectedTroop.notes || <em>None</em>}
              </div>
              <h3 className="font-semibold mb-1">Patrols</h3>
              <ul className="border rounded divide-y mb-2">
                {selectedTroop.patrols.map((patrol) => (
                  <li
                    key={patrol.id}
                    className="p-2 flex justify-between items-center"
                  >
                    <span>
                      {patrol.name}{" "}
                      {patrol.is_active ? "" : <em>(inactive)</em>}
                    </span>
                    <span>
                      <button
                        className="btn btn-xs btn-secondary mr-2"
                        onClick={() => handleEditPatrol(patrol)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-xs btn-danger"
                        onClick={() => handleDeletePatrol(patrol.id)}
                      >
                        Delete
                      </button>
                    </span>
                  </li>
                ))}
                {selectedTroop.patrols.length === 0 && (
                  <li className="p-2 text-gray-500">No patrols</li>
                )}
              </ul>
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
  const [form, setForm] = useState<TroopCreate | TroopUpdate>({
    number: troop?.number || "",
    charter_org: troop?.charter_org || "",
    meeting_location: troop?.meeting_location || "",
    meeting_day: troop?.meeting_day || "",
    notes: troop?.notes || "",
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
        await troopAPI.create(form as TroopCreate);
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to save troop");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="border rounded p-4 mb-4 bg-white" onSubmit={handleSubmit}>
      <h3 className="font-semibold mb-2">
        {troop ? "Edit Troop" : "Add Troop"}
      </h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="mb-2">
        <label className="block font-medium">Troop Number</label>
        <input
          className="input input-bordered w-full"
          value={form.number}
          onChange={(e) => setForm({ ...form, number: e.target.value })}
          required
          disabled={!!troop}
        />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Charter Org</label>
        <input
          className="input input-bordered w-full"
          value={form.charter_org || ""}
          onChange={(e) => setForm({ ...form, charter_org: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Meeting Location</label>
        <input
          className="input input-bordered w-full"
          value={form.meeting_location || ""}
          onChange={(e) =>
            setForm({ ...form, meeting_location: e.target.value })
          }
        />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Meeting Day</label>
        <input
          className="input input-bordered w-full"
          value={form.meeting_day || ""}
          onChange={(e) => setForm({ ...form, meeting_day: e.target.value })}
        />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Notes</label>
        <textarea
          className="textarea textarea-bordered w-full"
          value={form.notes || ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
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
    <form className="border rounded p-4 mb-4 bg-white" onSubmit={handleSubmit}>
      <h3 className="font-semibold mb-2">
        {patrol ? "Edit Patrol" : "Add Patrol"}
      </h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="mb-2">
        <label className="block font-medium">Patrol Name</label>
        <input
          className="input input-bordered w-full"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="mb-2">
        <label className="block font-medium">Active</label>
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TroopAdminPage;
