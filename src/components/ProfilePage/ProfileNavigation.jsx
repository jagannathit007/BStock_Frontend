// ProfileNavigation.jsx - Updated UI
import React from "react";

const ProfileNavigation = ({ activeTab, setActiveTab }) => {
  const primaryColor = "#0071E0";
  const navItems = [
    { id: "profile", label: "Profile Information", icon: "fas fa-user" },
    { id: "password", label: "Security Settings", icon: "fas fa-lock" },
  ];

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Account Settings
        </h3>
        <nav className="space-y-2">
          {navItems.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full px-4 py-3 text-left rounded-lg flex items-center text-sm font-medium transition-colors duration-200 ${
                activeTab === id
                  ? "text-white bg-[#0071E0] shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <i className={`${icon} w-4 h-4 mr-3`} style={{ color: activeTab === id ? "white" : primaryColor }}></i>
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ProfileNavigation;