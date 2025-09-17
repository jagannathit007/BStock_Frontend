// ChangePassword.jsx - Updated UI
import React, { useState } from "react";

const ChangePassword = () => {
  const primaryColor = "#0071E0";
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handlePasswordChange = (field, value) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const passwordFields = [
    { key: "current", label: "Current Password" },
    { key: "new", label: "New Password" },
    { key: "confirm", label: "Confirm New Password" },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Security Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your password and account security</p>
      </div>
      
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h3 className="font-medium mb-3 flex items-center text-[#0071E0] text-sm">
          <i className="fas fa-shield-alt mr-2"></i>
          Password Security Tips
        </h3>
        <ul className="text-sm space-y-2 list-disc list-inside text-gray-600">
          <li>Use at least 8 characters with mixed case letters, numbers, and symbols</li>
          <li>Avoid personal information and common dictionary words</li>
          <li>Consider using a password manager for stronger security</li>
        </ul>
      </div>
      
      <div className="space-y-5">
        {passwordFields.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <i className="fas fa-lock w-4 h-4 mr-2" style={{ color: primaryColor }}></i>
              {label}
            </label>
            <div className="relative">
              <input
                type={showPasswords[key] ? "text" : "password"}
                value={passwords[key]}
                onChange={(e) => handlePasswordChange(key, e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20 transition-colors duration-200 pr-12"
                placeholder={`Enter your ${label.toLowerCase()}`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility(key)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#0071E0] transition-colors duration-200"
              >
                <i className={showPasswords[key] ? "fas fa-eye" : "fas fa-eye-slash"}></i>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end pt-4">
        <button
          className="px-6 py-3 bg-[#0071E0] text-white rounded-lg flex items-center space-x-2 hover:bg-[#005BB5] transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <i className="fas fa-lock"></i>
          <span>Update Password</span>
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;