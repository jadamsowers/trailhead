import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export const RosterImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const response = await api.importRoster(file);
      setSuccess(response.stats);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to upload roster");
    } finally {
      setUploading(false);
    }
  };

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
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer relative"
            style={{
              borderColor: "var(--border-medium)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-secondary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <i
                className="bi bi-cloud-upload text-4xl mb-4"
                style={{ color: "var(--text-muted)" }}
              ></i>
              <p
                className="text-lg font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                CSV files only
              </p>
            </div>
          </div>

          {error && (
            <div
              className="mt-6 p-4 rounded-lg flex items-start"
              style={{
                backgroundColor: "var(--alert-error-bg)",
                border: "1px solid var(--alert-error-border)",
                color: "var(--alert-error-text)",
              }}
            >
              <i className="bi bi-exclamation-circle mr-3 mt-0.5 flex-shrink-0"></i>
              <div>
                <h3 className="font-medium">Import Failed</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

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
                  <li>Added/Updated: {success.processed} members</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 rounded-lg font-medium transition-all flex items-center"
              style={{
                backgroundColor:
                  !file || uploading
                    ? "var(--btn-disabled-bg)"
                    : "var(--btn-primary-bg)",
                color:
                  !file || uploading
                    ? "var(--btn-disabled-text)"
                    : "var(--btn-primary-text)",
                cursor: !file || uploading ? "not-allowed" : "pointer",
                opacity: !file || uploading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!(!file || uploading)) {
                  e.currentTarget.style.backgroundColor =
                    "var(--btn-primary-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!(!file || uploading)) {
                  e.currentTarget.style.backgroundColor =
                    "var(--btn-primary-bg)";
                }
              }}
            >
              {uploading ? (
                <>
                  <div
                    className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent mr-2"
                    style={{
                      borderColor: "var(--btn-primary-text)",
                      borderTopColor: "transparent",
                    }}
                  ></div>
                  Importing...
                </>
              ) : (
                <>
                  <i className="bi bi-upload mr-2"></i>
                  Import Roster
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
