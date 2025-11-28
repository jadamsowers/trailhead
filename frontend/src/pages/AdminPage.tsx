import React, { useState } from "react";
import { useUser } from "@stackframe/stack";
import OutingAdmin from "../components/Admin/OutingAdmin";
import UserManagement from "../components/Admin/UserManagement";
import TroopAdminTab from "../components/Admin/TroopAdminTab";
import DevDataSeeder from "../components/Admin/DevDataSeeder";

const AdminPage: React.FC = () => {
  const { isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<"outings" | "users" | "troops">(
    "outings"
  );

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="text-center" style={{ color: "var(--text-secondary)" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1
            className="font-bold font-heading mb-2"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(1.125rem, 5vw, 2.25rem)",
              lineHeight: "1.2",
            }}
          >
            Admin Dashboard
          </h1>
          <p
            className="mt-2 text-xs sm:text-sm md:text-base lg:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Manage outings, users, and system settings
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          className="border-b mb-8"
          style={{ borderColor: "var(--border-light)" }}
        >
          <nav
            className="-mb-px flex flex-wrap gap-2 sm:gap-0"
            aria-label="Tabs"
          >
            <button
              type="button"
              onClick={() => setActiveTab("outings")}
              className={`
                                flex-1 sm:flex-1 whitespace-nowrap py-3 sm:py-4 px-4 sm:px-1 border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 flex items-center justify-center gap-2
                            `}
              style={{
                borderColor:
                  activeTab === "outings"
                    ? "var(--color-primary)"
                    : "transparent",
                color:
                  activeTab === "outings"
                    ? "var(--color-primary)"
                    : "var(--text-secondary)",
                backgroundColor:
                  activeTab === "outings"
                    ? "rgba(var(--bsa-olive-rgb), 0.1)"
                    : "transparent",
              }}
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <span className="hidden sm:inline">Outing Management</span>
              <span className="sm:hidden">Outings</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("troops")}
              className={`
                                flex-1 sm:flex-1 whitespace-nowrap py-3 sm:py-4 px-4 sm:px-1 border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 flex items-center justify-center gap-2
                            `}
              style={{
                borderColor:
                  activeTab === "troops"
                    ? "var(--color-primary)"
                    : "transparent",
                color:
                  activeTab === "troops"
                    ? "var(--color-primary)"
                    : "var(--text-secondary)",
                backgroundColor:
                  activeTab === "troops"
                    ? "rgba(var(--bsa-olive-rgb), 0.1)"
                    : "transparent",
              }}
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7V6a4 4 0 10-8 0v1M5 20h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">Troop Management</span>
              <span className="sm:hidden">Troops</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`
                                flex-1 sm:flex-1 whitespace-nowrap py-3 sm:py-4 px-4 sm:px-1 border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 flex items-center justify-center gap-2
                            `}
              style={{
                borderColor:
                  activeTab === "users"
                    ? "var(--color-primary)"
                    : "transparent",
                color:
                  activeTab === "users"
                    ? "var(--color-primary)"
                    : "var(--text-secondary)",
                backgroundColor:
                  activeTab === "users"
                    ? "rgba(var(--bsa-olive-rgb), 0.1)"
                    : "transparent",
              }}
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "outings" && <OutingAdmin />}
          {activeTab === "troops" && <TroopAdminTab />}
          {activeTab === "users" && <UserManagement />}
        </div>

        {/* Development Data Seeder - Visible at bottom of all tabs */}
        <div className="mt-12">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Development Tools
          </h2>
          <DevDataSeeder />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
