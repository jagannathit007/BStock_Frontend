import React from "react";

const ProfileNavigation = ({ activeTab, setActiveTab }) => {
  const primaryColor = "#0071E0";
  const navItems = [
    { id: "profile", label: "Profile Information", icon: "fas fa-user" },
    { id: "password", label: "Security Settings", icon: "fas fa-lock" },
  ];

  return (
    <div className="w-full md:w-60 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Settings Menu
        </h3>
        <nav className="space-y-1">
          {navItems.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full px-3 py-2 text-left rounded-md flex items-center text-sm font-medium ${
                activeTab === id
                  ? "text-white bg-[#0071E0]"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <i className={`${icon} w-4 h-4 mr-2`} style={{ color: activeTab === id ? "white" : "#6b7280" }}></i>
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ProfileNavigation;