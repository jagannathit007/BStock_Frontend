import React, { useState } from "react";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState(
    "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
  );
  const [isHovered, setIsHovered] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    whatsapp: "+1 (555) 987-6543",
    bio: "Passionate software developer with expertise in modern web technologies",
  });
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

  // Profile Picture Upload Handler
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Profile Details Handler
  const handleProfileChange = (field, value) => {
    setProfileFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Password Change Handler
  const handlePasswordChange = (field, value) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Profile Header Component
  const ProfileHeader = () => (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#0071E0] to-[#0054A8] text-white">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold">
          Account Settings
        </h1>
        <p className="text-base text-white/90 mt-2 max-w-xl mx-auto">
          Manage your profile information and security settings
        </p>
      </div>
    </div>
  );

  // Profile Picture Upload Component
  const ProfilePictureUpload = () => (
    <div className="flex flex-col items-center">
      <div
        className="relative group cursor-pointer mb-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative bg-white p-1 rounded-full shadow-md">
          <img
            src={profileImage}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover ring-2 ring-gray-200"
          />
        </div>
        <div
          className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <label
            className="cursor-pointer p-3 rounded-full hover:bg-white/20 transition-colors duration-200"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <i className="fas fa-camera text-white text-xl"></i>
          </label>
        </div>
        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">John Doe</h3>
        <p className="text-sm text-gray-500 mt-1">Premium Member</p>
      </div>
      
      <label className="mt-4 px-4 py-2 text-sm text-[#0071E0] hover:text-[#005BB5] cursor-pointer transition-colors duration-200">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <i className="fas fa-edit mr-2"></i>
        Change Photo
      </label>
    </div>
  );

  // Navigation Component
  const ProfileNavigation = () => {
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
                <i className={`${icon} w-4 h-4 mr-3`} style={{ color: activeTab === id ? "white" : "#0071E0" }}></i>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    );
  };

  // Profile Details Component
  const ProfileDetails = () => {
    const inputFields = [
      { key: "firstName", label: "First Name", icon: "fas fa-user", type: "text", width: "half" },
      { key: "lastName", label: "Last Name", icon: "fas fa-user", type: "text", width: "half" },
      { key: "email", label: "Email Address", icon: "fas fa-envelope", type: "email", width: "full" },
      { key: "phone", label: "Phone Number", icon: "fas fa-phone", type: "tel", width: "half" },
      { key: "whatsapp", label: "WhatsApp Number", icon: "fab fa-whatsapp", type: "tel", width: "half" },
      { key: "bio", label: "Bio", icon: "fas fa-user-edit", type: "textarea", width: "full" },
    ];

    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
          <p className="text-sm text-gray-500 mt-1">Update your personal details and how others see you on the platform</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {inputFields.map(({ key, label, icon, type, width }) => (
            <div
              key={key}
              className={`space-y-2 ${width === "full" ? "md:col-span-2" : ""}`}
            >
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <i className={`${icon} w-4 h-4 mr-2`} style={{ color: "#0071E0" }}></i>
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  value={profileFormData[key]}
                  onChange={(e) => handleProfileChange(key, e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20 transition-colors duration-200"
                  placeholder={`Enter your ${label.toLowerCase()}`}
                />
              ) : (
                <input
                  type={type}
                  value={profileFormData[key]}
                  onChange={(e) => handleProfileChange(key, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20 transition-colors duration-200"
                  placeholder={`Enter your ${label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            className="px-6 py-3 bg-[#0071E0] text-white rounded-lg flex items-center space-x-2 hover:bg-[#005BB5] transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <i className="fas fa-save"></i>
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    );
  };

  // Change Password Component
  const ChangePassword = () => {
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
                <i className="fas fa-lock w-4 h-4 mr-2" style={{ color: "#0071E0" }}></i>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar with profile picture and navigation */}
          <div className="w-full lg:w-1/4 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <ProfilePictureUpload />
            </div>
            
            <ProfileNavigation />
          </div>
          
          {/* Right content area */}
          <div className="w-full lg:w-3/4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {activeTab === "profile" && <ProfileDetails />}
              {activeTab === "password" && <ChangePassword />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;