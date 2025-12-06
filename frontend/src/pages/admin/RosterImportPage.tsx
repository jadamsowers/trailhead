import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import RosterImportForm from "../../components/RosterImportForm";

export const RosterImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const troopId = searchParams.get("troop_id");

  // Page-level success/error state is managed by the form component; keep minimal state here
  const [success, setSuccess] = useState<any | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button
        onClick={() => navigate("/admin")}
        className="flex items-center mb-6 transition-colors"
        style={{
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--text-primary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-secondary)")
        }
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
        <div
          className="p-6"
          style={{
            borderBottom: "1px solid var(--border-light)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <h1
            className="text-2xl font-bold flex items-center"
            style={{ color: "var(--text-primary)" }}
          >
            <i
              className="bi bi-file-earmark-text mr-3"
              style={{ color: "var(--color-primary)" }}
            ></i>
            Import Roster
          </h1>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
            Upload the <code>roster_Report.csv</code> file exported from
            my.scouting.org to update the unit roster.
          </p>
        </div>

        <div className="p-8">
          <RosterImportForm troopId={troopId} onSuccess={(s) => setSuccess(s)} onCancel={() => navigate('/admin')} />

          {success && (
            <div
              className="mt-6 p-4 rounded-lg flex items-start"
              style={{
                backgroundColor: "var(--alert-success-bg)",
                border: "1px solid var(--alert-success-border)",
                color: "var(--alert-success-text)",
              }}
            >
              <i className="bi bi-check-circle mr-3 mt-0.5 flex-shrink-0"></i>
              <div>
                <h3 className="font-medium">Import Successful</h3>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>Processed: {success.processed} rows</li>
                  <li>Added: {success.added} members</li>
                  <li>Updated: {success.updated} members</li>
                </ul>
              </div>
            </div>
          )}

          {/* Button is provided by the RosterImportForm when used standalone; kept here for backward compatibility if needed */}
        </div>
      </div>
    </div>
  );
};
