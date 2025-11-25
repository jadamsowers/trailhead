import React from "react";
import TroopAdminPage from "../../pages/TroopAdminPage";

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <TroopAdminPage />
    </div>
  );
};

export default AdminDashboard;
