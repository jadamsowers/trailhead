import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { User } from "../../types";
import { getApiBase } from "../../utils/apiBase";

const UserManagement: React.FC = () => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Helper function to get auth headers
  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Try to get Clerk session token first
    try {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        return headers;
      }
    } catch (error) {
      console.warn("Failed to get Clerk token:", error);
    }

    // Fall back to localStorage token for legacy admin accounts
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${getApiBase()}/clerk/users`, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      setError(null);
      const response = await fetch(
        `${getApiBase()}/clerk/users/${userId}/role`,
        {
          method: "PATCH",
          headers: await getAuthHeaders(),
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update user role");
      }

      const updatedUser = await response.json();

      // Update the user in the list
      setUsers(users.map((user) => (user.id === userId ? updatedUser : user)));
    } catch (err: any) {
      setError(err.message || "Failed to update user role");
      console.error("Error updating user role:", err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "3rem 0",
        }}
      >
        <div
          style={{
            animation: "spin 1s linear infinite",
            borderRadius: "50%",
            height: "3rem",
            width: "3rem",
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor:
              "var(--sa-dark-blue) transparent transparent transparent",
          }}
        ></div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        boxShadow: "var(--card-shadow)",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--card-border)",
      }}
    >
      <div
        style={{
          padding: "1.5rem",
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "var(--text-primary)",
          }}
        >
          User Management
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            marginTop: "0.25rem",
          }}
        >
          Manage user roles and permissions
        </p>
      </div>

      {error && (
        <div
          style={{
            margin: "1rem 1.5rem 0",
            padding: "1rem",
            backgroundColor: "var(--alert-error-bg)",
            border: "1px solid var(--alert-error-border)",
            borderRadius: "4px",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "var(--alert-error-text)" }}>
            {error}
          </p>
        </div>
      )}

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden md:block" style={{ overflowX: "auto" }}>
        <table style={{ minWidth: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "var(--bg-tertiary)" }}>
            <tr>
              <th
                style={{
                  padding: "0.75rem 1.5rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                User
              </th>
              <th
                style={{
                  padding: "0.75rem 1.5rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                Email
              </th>
              <th
                style={{
                  padding: "0.75rem 1.5rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                Current Role
              </th>
              <th
                style={{
                  padding: "0.75rem 1.5rem",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: "var(--card-bg)" }}>
            {users.map((user, index) => (
              <tr
                key={user.id}
                style={{
                  borderBottom:
                    index < users.length - 1
                      ? "1px solid var(--card-border)"
                      : "none",
                }}
              >
                <td style={{ padding: "1rem 1.5rem", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "var(--text-primary)",
                        }}
                      >
                        {user.full_name}
                      </div>
                      {user.is_initial_admin && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Initial Admin
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "1rem 1.5rem", whiteSpace: "nowrap" }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {user.email}
                  </div>
                </td>
                <td style={{ padding: "1rem 1.5rem", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      display: "inline-flex",
                      fontSize: "0.75rem",
                      lineHeight: "1.25rem",
                      fontWeight: "600",
                      borderRadius: "9999px",
                      backgroundColor:
                        user.role === "admin"
                          ? "var(--alert-error-bg)"
                          : user.role === "adult"
                          ? "var(--badge-info-bg)"
                          : "var(--bg-tertiary)",
                      color:
                        user.role === "admin"
                          ? "var(--alert-error-text)"
                          : user.role === "adult"
                          ? "var(--badge-info-text)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td
                  style={{
                    padding: "1rem 1.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "0.875rem",
                  }}
                >
                  {user.is_initial_admin ? (
                    <span
                      style={{
                        color: "var(--text-tertiary)",
                        fontStyle: "italic",
                      }}
                    >
                      Cannot modify
                    </span>
                  ) : (
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      disabled={updatingUserId === user.id}
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.875rem",
                        borderRadius: "4px",
                        border: "1px solid var(--card-border)",
                        background: "var(--input-bg)",
                        color: "var(--text-primary)",
                        minWidth: 100,
                        cursor:
                          updatingUserId === user.id
                            ? "not-allowed"
                            : "pointer",
                        opacity: updatingUserId === user.id ? 0.5 : 1,
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="adult">Adult</option>
                      <option value="user">User</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible on Mobile Only */}
      <div className="md:hidden">
        {users.map((user, index) => (
          <div
            key={user.id}
            style={{
              padding: "1rem",
              borderBottom:
                index < users.length - 1
                  ? "1px solid var(--card-border)"
                  : "none",
              backgroundColor: "var(--card-bg)",
            }}
          >
            <div style={{ marginBottom: "0.75rem" }}>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                {user.full_name}
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  marginBottom: "0.5rem",
                }}
              >
                {user.email}
              </div>
              {user.is_initial_admin && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    marginBottom: "0.5rem",
                  }}
                >
                  Initial Admin
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Current Role
                </div>
                <span
                  style={{
                    padding: "0.25rem 0.5rem",
                    display: "inline-flex",
                    fontSize: "0.75rem",
                    lineHeight: "1.25rem",
                    fontWeight: "600",
                    borderRadius: "9999px",
                    backgroundColor:
                      user.role === "admin"
                        ? "var(--alert-error-bg)"
                        : user.role === "adult"
                        ? "var(--badge-info-bg)"
                        : "var(--bg-tertiary)",
                    color:
                      user.role === "admin"
                        ? "var(--alert-error-text)"
                        : user.role === "adult"
                        ? "var(--badge-info-text)"
                        : "var(--text-secondary)",
                  }}
                >
                  {user.role}
                </span>
              </div>

              <div style={{ flex: "0 0 auto" }}>
                {user.is_initial_admin ? (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-tertiary)",
                      fontStyle: "italic",
                      textAlign: "right",
                    }}
                  >
                    Cannot modify
                  </div>
                ) : (
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={updatingUserId === user.id}
                    style={{
                      padding: "0.5rem",
                      fontSize: "0.875rem",
                      borderRadius: "4px",
                      border: "1px solid var(--card-border)",
                      background: "var(--input-bg)",
                      color: "var(--text-primary)",
                      width: "100%",
                      minWidth: "100px",
                      cursor:
                        updatingUserId === user.id ? "not-allowed" : "pointer",
                      opacity: updatingUserId === user.id ? 0.5 : 1,
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="adult">Adult</option>
                    <option value="user">User</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <p style={{ color: "var(--text-secondary)" }}>No users found</p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
