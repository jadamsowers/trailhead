import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { rosterAPI } from "../../services/api";
import type { RosterMemberLookup } from "../../services/api";

const RosterListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const troopId = searchParams.get("troop_id");
  const navigate = useNavigate();

  const [q, setQ] = useState<string>("");
  const [members, setMembers] = useState<RosterMemberLookup[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rosterAPI.list(q || undefined, 200, 0);
      setMembers(res.members || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load roster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <button
        onClick={() => navigate("/admin")}
        className="flex items-center mb-6 transition-colors"
        style={{
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        <i className="bi bi-arrow-left mr-2"></i>
        Back to Admin Dashboard
      </button>

      <div
        className="rounded-xl shadow-sm overflow-hidden"
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div className="p-6" style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-secondary)" }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Roster Members
          </h1>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
            {troopId ? `Showing roster for troop ${troopId}` : "Showing all roster members"}
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email"
              className="px-3 py-2 rounded-lg w-full"
              style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-light)" }}
            />
            <button
              onClick={() => fetchMembers()}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: "var(--alert-error-bg)", border: "1px solid var(--alert-error-border)", color: "var(--alert-error-text)" }}>
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--text-primary)" }}>
                  <th className="text-left p-2">BSA ID</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Position</th>
                  <th className="text-left p-2">YPT Expiration</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.bsa_member_id} className="border-t" style={{ color: "var(--text-secondary)" }}>
                    <td className="p-2">{m.bsa_member_id}</td>
                    <td className="p-2">{m.full_name}</td>
                    <td className="p-2">{m.email}</td>
                    <td className="p-2">{m.mobile_phone}</td>
                    <td className="p-2">{m.position}</td>
                    <td className="p-2">{m.ypt_expiration || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            Showing {members.length} of {total} members
          </div>
        </div>
      </div>
    </div>
  );
};

export default RosterListPage;
