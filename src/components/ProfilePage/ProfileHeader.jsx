import React from "react";

const ProfileHeader = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0071E0] text-white">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-semibold">
          Profile Dashboard
        </h1>
        <p className="text-base text-white/80 mt-2 max-w-xl mx-auto">
          Manage your professional identity with precision and style
        </p>
      </div>
    </div>
  );
};

export default ProfileHeader;