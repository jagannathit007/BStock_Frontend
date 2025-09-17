// ProfilePictureUpload.jsx - Updated UI
import React, { useState } from "react";

const ProfilePictureUpload = () => {
  const primaryColor = "#0071E0";
  const [profileImage, setProfileImage] = useState(
    "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
  );
  const [isHovered, setIsHovered] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
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
};

export default ProfilePictureUpload;