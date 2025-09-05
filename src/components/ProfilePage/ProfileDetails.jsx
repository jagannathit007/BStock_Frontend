import React, { useState } from "react";

const ProfileDetails = () => {
  const primaryColor = "#0071E0";
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    whatsapp: "+1 (555) 987-6543",
    bio: "Passionate software developer with expertise in modern web technologies",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const inputFields = [
    { key: "firstName", label: "First Name", icon: "fas fa-user", type: "text", width: "half" },
    { key: "lastName", label: "Last Name", icon: "fas fa-user", type: "text", width: "half" },
    { key: "email", label: "Email Address", icon: "fas fa-envelope", type: "email", width: "full" },
    { key: "phone", label: "Phone Number", icon: "fas fa-phone", type: "tel", width: "half" },
    { key: "whatsapp", label: "WhatsApp Number", icon: "fab fa-whatsapp", type: "tel", width: "half" },
    { key: "bio", label: "Bio", icon: "fas fa-user", type: "textarea", width: "full" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inputFields.map(({ key, label, icon, type, width }) => (
          <div
            key={key}
            className={`space-y-1 ${width === "full" ? "md:col-span-2" : ""}`}
          >
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <i className={`${icon} w-4 h-4 mr-2`} style={{ color: primaryColor }}></i>
              {label}
            </label>
            {type === "textarea" ? (
              <textarea
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                rows="4"
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-[#0071E0] focus:ring-1 focus:ring-[#0071E0]/30"
                placeholder={`Enter your ${label.toLowerCase()}`}
              />
            ) : (
              <input
                type={type}
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-[#0071E0] focus:ring-1 focus:ring-[#0071E0]/30"
                placeholder={`Enter your ${label.toLowerCase()}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          className="px-5 py-2 bg-[#0071E0] text-white rounded-md flex items-center space-x-1 hover:bg-[#005BB5] text-sm"
        >
          <i className="fas fa-save"></i>
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDetails;