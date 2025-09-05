import React, { useState } from "react";
import ProfileHeader from "../components/ProfilePage/ProfileHeader";
import ProfileNavigation from "../components/ProfilePage/ProfileNavigation";
import ProfilePictureUpload from "../components/ProfilePage/ProfilePictureUpload";
import ProfileDetails from "../components/ProfilePage/ProfileDetails";
import ChangePassword from "../components/ProfilePage/ChangePassword";


const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <ProfileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeTab === "profile" && (
                <>
                  <ProfilePictureUpload />
                  <ProfileDetails />
                </>
              )}
              {activeTab === "password" && <ChangePassword />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;