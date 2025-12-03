import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAccessToken } from "../auth/client";
import { getApiBase } from "../utils/apiBase";
import {
  formatPhoneNumber,
  validatePhoneWithMessage,
} from "../utils/phoneUtils";

interface TroopData {
  number: string;
  charter_org: string;
  meeting_location: string;
  meeting_day: string;
  notes: string;
}

/**
 * InitialSignInWizard
 * Multi-step wizard for first-time sign-in.
 * Steps:
 * 1. Collect phone, emergency contact, optional YPT date
 * 2. (Admins only) Configure troops/patrols
 * 3. Redirect to Family Setup page
 */
const InitialSignInWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    yptDate: "",
  });
  const [troops, setTroops] = useState<TroopData[]>([
    {
      number: "",
      charter_org: "",
      meeting_location: "",
      meeting_day: "",
      notes: "",
    },
  ]);
  const [yptWarning, setYptWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    phone?: string;
    emergencyContactPhone?: string;
  }>({});
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;

  // Check if user is admin - will be verified server-side
  const isAdmin = false; // Default to false, admin status is determined server-side

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Apply phone formatting for phone fields
    const formattedValue =
      name === "phone" || name === "emergencyContactPhone"
        ? formatPhoneNumber(value)
        : value;

    setForm({ ...form, [name]: formattedValue });

    // Clear field-level errors as user edits
    if (name === "phone") {
      setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    } else if (name === "emergencyContactPhone") {
      setFieldErrors((prev) => ({ ...prev, emergencyContactPhone: undefined }));
    }
  };

  const handleTroopChange = (
    index: number,
    field: keyof TroopData,
    value: string
  ) => {
    const newTroops = [...troops];
    newTroops[index][field] = value;
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
      },
    ]);
  };

  const removeTroop = (index: number) => {
    if (troops.length > 1) {
      setTroops(troops.filter((_, i) => i !== index));
    }
  };

  const handleNext = async () => {
    setError(null);
    setLoading(true);

    try {
      if (step === 1) {
        const newFieldErrors: {
          phone?: string;
          emergencyContactPhone?: string;
        } = {};

        // Validate name
        if (!form.name.trim()) {
          setError("Please fill out all required fields.");
          setLoading(false);
          return;
        }

        // Validate phone number
        const phoneError = validatePhoneWithMessage(form.phone, "Phone number");
        if (phoneError) {
          newFieldErrors.phone = phoneError;
        }

        // Validate emergency contact name
        if (!form.emergencyContactName) {
          setError("Please fill out all required fields.");
        }

        // Validate emergency contact phone
        const emergencyPhoneError = validatePhoneWithMessage(
          form.emergencyContactPhone,
          "Emergency contact phone"
        );
        if (emergencyPhoneError) {
          newFieldErrors.emergencyContactPhone = emergencyPhoneError;
        }

        if (
          Object.keys(newFieldErrors).length > 0 ||
          !form.emergencyContactName
        ) {
          setFieldErrors(newFieldErrors);
          if (!error) setError("Please fix the errors below and try again.");
          setLoading(false);
          return;
        }

        if (!form.yptDate) {
          setYptWarning(true);
        } else {
          setYptWarning(false);
        }

        // Build contact payload
        const contactData = {
          full_name: form.name,
          phone: form.phone,
          emergency_contact_name: form.emergencyContactName,
          emergency_contact_phone: form.emergencyContactPhone,
          youth_protection_expiration: form.yptDate || null,
        };

        // Get access token
        const token = await getAccessToken();
        if (!token) throw new Error("Not authenticated");

        // Update user contact information via Authentik-backed endpoint
        const updateResponse = await fetch(`${getApiBase()}/auth/me/contact`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(contactData),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to save contact information");
        }

        // Mark initial setup complete immediately after saving contact info
        const completeResponse = await fetch(
          `${getApiBase()}/auth/me/initial-setup/complete`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!completeResponse.ok) {
          console.warn("Failed to mark initial setup complete");
        }

        if (isAdmin) {
          setStep(2);
        } else {
          navigate("/family-setup");
        }
      } else if (step === 2 && isAdmin) {
        // Save troops and patrols
        for (const troop of troops) {
          if (troop.number) {
            const token = await getAccessToken();
            const troopResponse = await fetch(`${getApiBase()}/troops`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
              },
              body: JSON.stringify(troop),
            });

            if (!troopResponse.ok) {
              throw new Error(`Failed to create troop ${troop.number}`);
            }
          }
        }

        navigate("/family-setup");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-w-2xl mx-auto mt-10 p-6 rounded shadow"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-light)",
      }}
    >
      <h2
        className="text-2xl font-bold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Initial Sign-In Setup
      </h2>

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

      {step === 1 && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="name"
              style={{ color: "var(--text-primary)" }}
            >
              Your Name{" "}
              <span style={{ color: "var(--alert-error-text)" }}>*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g., Adam Sowers"
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-light)",
                outlineColor: "var(--btn-primary-bg)",
              }}
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="phone"
              style={{ color: "var(--text-primary)" }}
            >
              Phone Number{" "}
              <span style={{ color: "var(--alert-error-text)" }}>*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              inputMode="tel"
              placeholder="(555) 123-4567"
              aria-invalid={!!fieldErrors.phone}
              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: fieldErrors.phone
                  ? "var(--alert-error-border)"
                  : "var(--border-light)",
                outlineColor: "var(--btn-primary-bg)",
              }}
              value={form.phone}
              onChange={handleChange}
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Format: (XXX) XXX-XXXX
            </p>
            {fieldErrors.phone && (
              <p
                id="phone-error"
                role="alert"
                className="mt-1 text-sm text-[var(--alert-error-text)]"
              >
                {fieldErrors.phone}
              </p>
            )}
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="emergencyContactName"
              style={{ color: "var(--text-primary)" }}
            >
              Emergency Contact Name{" "}
              <span style={{ color: "var(--alert-error-text)" }}>*</span>
            </label>
            <input
              id="emergencyContactName"
              name="emergencyContactName"
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
              value={form.emergencyContactName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="emergencyContactPhone"
              style={{ color: "var(--text-primary)" }}
            >
              Emergency Contact Phone{" "}
              <span style={{ color: "var(--alert-error-text)" }}>*</span>
            </label>
            <input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              required
              inputMode="tel"
              placeholder="(555) 123-4567"
              aria-invalid={!!fieldErrors.emergencyContactPhone}
              aria-describedby={
                fieldErrors.emergencyContactPhone
                  ? "emergency-phone-error"
                  : undefined
              }
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: fieldErrors.emergencyContactPhone
                  ? "var(--alert-error-border)"
                  : "var(--border-light)",
                outlineColor: "var(--btn-primary-bg)",
              }}
              value={form.emergencyContactPhone}
              onChange={handleChange}
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Format: (XXX) XXX-XXXX
            </p>
            {fieldErrors.emergencyContactPhone && (
              <p
                id="emergency-phone-error"
                role="alert"
                className="mt-1 text-sm text-[var(--alert-error-text)]"
              >
                {fieldErrors.emergencyContactPhone}
              </p>
            )}
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="yptDate"
              style={{ color: "var(--text-primary)" }}
            >
              Youth Protection Training Date (optional)
            </label>
            <input
              id="yptDate"
              name="yptDate"
              type="date"
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-light)",
                outlineColor: "var(--btn-primary-bg)",
              }}
              value={form.yptDate}
              onChange={handleChange}
            />
            <label
              className="block text-xs font-medium mb-1"
              htmlFor="yptDate"
              style={{ color: "var(--text-primary)" }}
            >
              <a
                href="https://my.scouting.org/home"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--link-color)" }}
              >
                Find your YPT/SYT training expiration date here.
              </a>
              <br />
              <br />
              <em>
                You will need a valid youth protection training certificate to
                attend outings. If you do not have one, please let us know.
              </em>
            </label>
            {yptWarning && (
              <div
                className="mt-2 p-2 rounded"
                style={{
                  backgroundColor: "var(--alert-warning-bg)",
                  borderLeftWidth: "4px",
                  borderLeftStyle: "solid",
                  borderLeftColor: "var(--alert-warning-border)",
                  color: "var(--alert-warning-text)",
                }}
              >
                <strong>Warning:</strong> You must complete Youth Protection
                Training (YPT) before attending outings. Visit{" "}
                <a
                  href="https://my.scouting.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "var(--link-color)" }}
                >
                  my.scouting.org
                </a>{" "}
                to complete YPT.
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-2 px-4 rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-bg-hover)] focus:outline-none focus:ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Saving..."
              : isAdmin
              ? "Next: Configure Troops"
              : "Continue"}
          </button>
        </form>
      )}

      {step === 2 && isAdmin && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          <p
            className="text-sm mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Configure troops for your organization. You can add more troops
            later from the admin panel.
          </p>

          {troops.map((troop, index) => (
            <div
              key={index}
              className="p-4 border rounded space-y-3"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex justify-between items-center mb-2">
                <h3
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Troop {index + 1}
                </h3>
                {troops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTroop(index)}
                    className="text-sm transition-colors"
                    style={{ color: "var(--alert-error-text)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

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
                  className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
                  style={{
                    background: "var(--input-bg)",
                    color: "var(--text-primary)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--border-light)",
                    outlineColor: "var(--btn-primary-bg)",
                  }}
                  value={troop.number}
                  onChange={(e) =>
                    handleTroopChange(index, "number", e.target.value)
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
                  className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
                  style={{
                    background: "var(--input-bg)",
                    color: "var(--text-primary)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--border-light)",
                    outlineColor: "var(--btn-primary-bg)",
                  }}
                  value={troop.charter_org}
                  onChange={(e) =>
                    handleTroopChange(index, "charter_org", e.target.value)
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
                  className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
                  style={{
                    background: "var(--input-bg)",
                    color: "var(--text-primary)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--border-light)",
                    outlineColor: "var(--btn-primary-bg)",
                  }}
                  value={troop.meeting_location}
                  onChange={(e) =>
                    handleTroopChange(index, "meeting_location", e.target.value)
                  }
                  placeholder="e.g., Church Fellowship Hall"
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
                  className="w-full rounded px-3 py-2 focus:outline-none focus:ring"
                  style={{
                    background: "var(--input-bg)",
                    color: "var(--text-primary)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--border-light)",
                    outlineColor: "var(--btn-primary-bg)",
                  }}
                  value={troop.meeting_day}
                  onChange={(e) =>
                    handleTroopChange(index, "meeting_day", e.target.value)
                  }
                  placeholder="e.g., Tuesday"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addTroop}
            className="w-full py-2 px-4 rounded border-2 border-dashed text-[var(--text-secondary)] hover:border-[var(--btn-primary-bg)] hover:text-[var(--btn-primary-bg)] transition-colors"
            style={{ borderColor: "var(--border-color)" }}
          >
            + Add Another Troop
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2 px-4 rounded border text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              style={{ borderColor: "var(--border-color)" }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-bg-hover)] focus:outline-none focus:ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Continue to Family Setup"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InitialSignInWizard;
