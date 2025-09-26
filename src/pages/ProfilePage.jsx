import React, { useEffect, useState, useMemo } from "react";
import { AuthService } from "../services/auth/auth.services";
import { env } from "../utils/env";
import toastHelper from "../utils/toastHelper";

// Top-level, stable components to prevent remounts (focus loss)
const ProfilePictureUpload = ({ profileImage, displayName, onChangeImage }) => {
  const [imageError, setImageError] = useState(false);

  const hasImage = useMemo(() => {
    return (typeof profileImage === 'string' && profileImage.trim() !== '') || 
           (profileImage instanceof File);
  }, [profileImage]);

  const previewSrc = useMemo(() => {
    if (typeof profileImage === 'string' && profileImage.trim() !== '') return profileImage;
    if (profileImage instanceof File) return URL.createObjectURL(profileImage);
    return null;
  }, [profileImage]);

  const getInitials = useMemo(() => {
    if (!displayName) return 'U';
    const words = displayName.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }, [displayName]);

  const handleImageError = () => {
    setImageError(true);
  };

  // Reset image error when profileImage changes
  useEffect(() => {
    setImageError(false);
  }, [profileImage]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative group cursor-pointer mb-4">
        <div className="relative bg-white p-1 rounded-full shadow-md">
          {hasImage ? (
            <img
              src={imageError ? "/images/avtar.jpg" : previewSrc}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover ring-2 ring-gray-200"
              onError={handleImageError}
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#0071E0] to-[#005BB5] flex items-center justify-center ring-2 ring-gray-200">
              <span className="text-white text-2xl font-semibold">
                {getInitials}
              </span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <label className="cursor-pointer p-3 rounded-full hover:bg-white/20 transition-colors duration-200" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
            <input type="file" accept="image/*" onChange={onChangeImage} className="hidden" />
            <i className="fas fa-camera text-white text-xl"></i>
          </label>
        </div>
        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">{displayName || 'User'}</h3>
        <p className="text-sm text-gray-500 mt-1">&nbsp;</p>
      </div>
      <label className="mt-4 px-4 py-2 text-sm text-[#0071E0] hover:text-[#005BB5] cursor-pointer transition-colors duration-200">
        <input type="file" accept="image/*" onChange={onChangeImage} className="hidden" />
        <i className="fas fa-edit mr-2"></i>
        Change Photo
      </label>
    </div>
  );
};

const ProfileNavigation = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "profile", label: "Profile Information", icon: "fas fa-user" },
    { id: "business", label: "Business Profile", icon: "fas fa-building" },
    { id: "password", label: "Security Settings", icon: "fas fa-lock" },
  ];
  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Account Settings</h3>
        <nav className="space-y-2">
          {navItems.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full px-4 py-3 cursor-pointer text-left rounded-lg flex items-center text-sm font-medium transition-colors duration-200 ${activeTab === id ? "text-white bg-[#0071E0] shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
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

const ProfileDetails = ({ formData, onChange, onSave }) => {
  const inputFields = [
    { key: "name", label: "Name", icon: "fas fa-user", type: "text", width: "full" },
    { key: "email", label: "Email Address", icon: "fas fa-envelope", type: "email", width: "full" },
    { key: "mobileNumber", label: "Mobile Number", icon: "fas fa-phone", type: "tel", width: "full" },
    { key: "whatsappNumber", label: "WhatsApp Number", icon: "fab fa-whatsapp", type: "tel", width: "full" },
  ];
  
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
        <p className="text-sm text-gray-500 mt-1">Update your personal details and how others see you on the platform</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {inputFields.map(({ key, label, icon, type, width }) => (
          <div key={key} className={`space-y-2 ${width === "full" ? "md:col-span-2" : ""}`}>
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <i className={`${icon} w-4 h-4 mr-2`} style={{ color: "#0071E0" }}></i>
              {label}
            </label>
            <input
              type={type}
              value={formData[key] ?? ""}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20 transition-colors duration-200 text-sm"
              placeholder={`Enter your ${label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={onSave} className="px-6 py-2 cursor-pointer bg-[#0071E0] text-white rounded-lg flex items-center space-x-2 hover:bg-[#005BB5] transition-colors duration-200 shadow-sm hover:shadow-md">
          <i className="fas fa-save"></i>
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};

const BusinessProfile = ({ formData, previews, onChangeField, onChangeFile, onSave, status }) => {
  const [logoImageError, setLogoImageError] = useState(false);
  const [certificateImageError, setCertificateImageError] = useState(false);

  const handleLogoImageError = () => {
    setLogoImageError(true);
  };

  const handleCertificateImageError = () => {
    setCertificateImageError(true);
  };

  // Reset image errors when images change
  useEffect(() => {
    setLogoImageError(false);
  }, [formData.businessLogo]);

  useEffect(() => {
    setCertificateImageError(false);
  }, [formData.certificate]);

  const countries = ["Hongkong" , "Dubai" , "Singapore" , "India"];
  const logoFileName = formData.businessLogo ? (typeof formData.businessLogo === 'string' ? formData.businessLogo.split('/').pop() : formData.businessLogo.name) : '';
  const certificateExt = formData.certificate ? (typeof formData.certificate === 'string' ? (formData.certificate.split('.').pop() || '').toUpperCase() : (formData.certificate.name.split('.').pop() || '').toUpperCase()) : '';
  const certificateIsImage = typeof formData.certificate === 'object' && formData.certificate?.type?.startsWith('image/');

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Business Information</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your business details and credentials</p>
      </div>
      {status && (
        status === 'Approved' ? (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            <i className="fas fa-check-circle"></i>
            <span className="text-sm font-medium">Business account verified</span>
          </div>
        ) : status === 'Rejected' ? (
          <div className="flex items-center space-x-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <i className="fas fa-times-circle"></i>
            <span className="text-sm font-medium">Business verification rejected. Please update details and resubmit.</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <i className="fas fa-clock"></i>
            <span className="text-sm font-medium">Business verification pending. We will notify you once reviewed.</span>
          </div>
        )
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i className="fas fa-building w-4 h-4 mr-2" style={{ color: "#0071E0" }}></i>
            Business Name
          </label>
          <input
            type="text"
            value={formData.businessName ?? ""}
            onChange={(e) => onChangeField("businessName", e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20 transition-colors duration-200 text-sm"
            placeholder="Enter your business name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i className="fas fa-globe w-4 h-4 mr-2" style={{ color: "#0071E0" }}></i>
            Country
          </label>
          <select
            value={formData.country ?? ""}
            onChange={(e) => onChangeField("country", e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20 transition-colors duration-200 text-sm"
          >
            <option value="">Select your country</option>
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i className="fas fa-map-marker-alt w-4 h-4 mr-2" style={{ color: "#0071E0" }}></i>
            Business Address <span className="text-gray-400 ml-1">(Optional)</span>
          </label>
          <textarea
            value={formData.address ?? ""}
            onChange={(e) => onChangeField("address", e.target.value)}
            rows="3"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20 transition-colors duration-200 text-sm"
            placeholder="Enter your business address"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i className="fas fa-image w-4 h-4 mr-2" style={{ color: "#0071E0" }}></i>
            Business Logo <span className="text-gray-400 ml-1">(Optional)</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onChangeFile("businessLogo", e.target.files[0])}
                  className="hidden"
                />
                <i className="fas fa-upload mr-2"></i>
                Choose Logo
              </label>
              {formData.businessLogo && <span className="text-sm text-gray-600">{logoFileName}</span>}
            </div>
            {previews.businessLogo && (
              <div className="mt-3">
                <div className="relative inline-block">
                  <img
                    src={logoImageError ? "/images/avtar.jpg" : previews.businessLogo}
                    alt="Business Logo Preview"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                    onError={handleLogoImageError}
                  />
                  <button
                    onClick={() => {
                      onChangeField('businessLogo', null);
                      onChangeFile('businessLogo', null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 text-xs"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i className="fas fa-certificate w-4 h-4 mr-2" style={{ color: "#0071E0" }}></i>
            Business Certificate <span className="text-gray-400 ml-1">(Optional)</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => onChangeFile("certificate", e.target.files[0])}
                  className="hidden"
                />
                <i className="fas fa-upload mr-2"></i>
                Choose Certificate
              </label>
              {formData.certificate && <span className="text-sm text-gray-600">{certificateExt || 'File selected'}</span>}
            </div>
            {previews.certificate && formData.certificate && (
              <div className="mt-3">
                <div className="relative inline-block">
                  <a
                    href={previews.certificate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {certificateIsImage ? (
                      <img
                        src={certificateImageError ? "/images/avtar.jpg" : previews.certificate}
                        alt="Certificate Preview"
                        className="w-32 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                        onError={handleCertificateImageError}
                      />
                    ) : (
                      <div className="w-32 h-24 bg-gray-100 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                        <i className="fas fa-file-alt text-2xl text-gray-400 mb-1"></i>
                        <span className="text-xs text-gray-500 text-center px-1">{certificateExt}</span>
                      </div>
                    )}
                  </a>
                  <button
                    onClick={() => {
                      onChangeField('certificate', null);
                      onChangeFile('certificate', null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 text-xs"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button
          onClick={onSave}
          className="px-6 py-2 bg-[#0071E0] text-white cursor-pointer rounded-lg flex items-center space-x-2 hover:bg-[#005BB5] transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <i className="fas fa-save"></i>
          <span>Save Business Profile</span>
        </button>
      </div>
    </div>
  );
};

const ChangePassword = ({ passwords, showPasswords, onChange, onToggle, onSubmit, userEmail }) => (
  <div className="space-y-6">
    <div className="pb-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800">Security Settings</h2>
      <p className="text-sm text-gray-500 mt-1">Manage your password and account security</p>
    </div>
    {/* Hidden username to help browser autofill associate account */}
    <input type="email" name="username" autoComplete="username" value={userEmail || ''} readOnly style={{ display: 'none' }} />
    <div className="space-y-5">
      {[{ key: "current", label: "Current Password" }, { key: "new", label: "New Password" }, { key: "confirm", label: "Confirm New Password" }].map(({ key, label }) => (
        <div key={key} className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i className="fas fa-lock w-4 h-4 mr-2" style={{ color: "#0071E0" }}></i>
            {label}
          </label>
          <div className="relative">
            <input
              type={showPasswords[key] ? "text" : "password"}
              name={key === 'current' ? 'current-password' : key === 'new' ? 'new-password' : 'new-password-confirm'}
              autoComplete={key === 'current' ? 'current-password' : 'new-password'}
              value={passwords[key]}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20 transition-colors duration-200 pr-12 text-sm"
              placeholder={`Enter your ${label.toLowerCase()}`}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button type="button" onClick={() => onToggle(key)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#0071E0] transition-colors duration-200 text-sm">
              <i className={showPasswords[key] ? "fas fa-eye" : "fas fa-eye-slash"}></i>
            </button>
          </div>
        </div>
      ))}
    </div>
    <div className="flex justify-end pt-4">
      <button onClick={onSubmit} className="px-6 py-3 bg-[#0071E0] cursor-pointer text-white rounded-lg flex items-center space-x-2 hover:bg-[#005BB5] transition-colors duration-200 shadow-sm hover:shadow-md">
        <i className="fas fa-lock"></i>
        <span>Update Password</span>
      </button>
    </div>
  </div>
);

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState(null);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    whatsappNumber: "",
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
  
  // Business Profile State
  const [businessFormData, setBusinessFormData] = useState({
    businessName: "",
    country: "",
    address: "",
    businessLogo: null,
    certificate: null,
  });
  const [businessPreviews, setBusinessPreviews] = useState({
    businessLogo: null,
    certificate: null,
  });
  const [businessStatus, setBusinessStatus] = useState(null);

  // Profile Picture Upload Handler
  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previousImage = profileImage; // Store previous image for rollback
      setProfileImage(file); // Update local state for immediate preview

      // Immediately update profile image via API
      try {
        const payload = { profileImage: file };
        await AuthService.updateProfile(payload);

        // Refresh profile image from server to ensure consistency
        try {
          const res = await AuthService.getProfile();
          const root = res ?? {};
          const container = (root?.data?.customer ?? root?.data) ?? root;
          const pimg = container?.profileImage ?? container?.avatar;
          if (typeof pimg === 'string') {
            const normalized = pimg.replace(/\\/g, '/');
            const absolute = /^https?:\/\//i.test(normalized) ? normalized : `${env.baseUrl}/${normalized.replace(/^\//, '')}`;
            setProfileImage(absolute);
            try { localStorage.setItem('profileImageUrl', absolute); } catch {}
          }
          toastHelper.showTost('Profile image updated successfully', 'success');
        } catch (refreshError) {
          console.error('Error refreshing profile data:', refreshError);
          setProfileImage(previousImage); // Revert to previous image
          toastHelper.showTost('Failed to refresh profile data', 'error');
        }
      } catch (e) {
        console.error('Error updating profile image:', e);
        setProfileImage(previousImage); // Revert to previous image on error
        // Error already handled via toast in AuthService
      }
    }
  };

  // Load profile on mount
  useEffect(() => {
    const toAbsoluteUrl = (p) => {
      if (!p || typeof p !== 'string') return null;
      const normalized = p.replace(/\\/g, '/');
      if (/^https?:\/\//i.test(normalized)) return normalized;
      return `${env.baseUrl}/${normalized.replace(/^\//, '')}`;
    };
    const normalize = (raw) => {
      const root = raw ?? {};
      const container = (root?.data?.customer ?? root?.data) ?? root;
      const business = container?.businessProfile ?? container?.business ?? {};
      const name = container?.name ?? '';
      const email = container?.email ?? '';
      const mobileNumber = container?.mobileNumber ?? container?.phone ?? '';
      const whatsappNumber = container?.whatsappNumber ?? '';
      const profileImage = toAbsoluteUrl(container?.profileImage ?? container?.avatar ?? null);
      const businessName = business?.businessName ?? business?.companyName ?? '';
      const country = business?.country ?? business?.businessCountry ?? '';
      const address = business?.address ?? business?.businessAddress ?? '';
      const logo = toAbsoluteUrl(business?.logo ?? business?.businessLogo ?? null);
      const certificate = toAbsoluteUrl(business?.certificate ?? business?.businessCertificate ?? null);
      const status = business?.status ?? null;
      return { name, email, mobileNumber, whatsappNumber, profileImage, business: { businessName, country, address, logo, certificate, status } };
    };
    const loadProfile = async () => {
      try {
        const res = await AuthService.getProfile();
        const normalized = normalize(res);
        setProfileFormData({
          name: normalized.name,
          email: normalized.email,
          mobileNumber: normalized.mobileNumber,
          whatsappNumber: normalized.whatsappNumber,
        });
        setBusinessFormData((prev) => ({
          ...prev,
          businessName: normalized.business.businessName,
          country: normalized.business.country,
          address: normalized.business.address,
          businessLogo: normalized.business.logo,
          certificate: normalized.business.certificate,
        }));
        setBusinessPreviews({
          businessLogo: typeof normalized.business.logo === 'string' ? normalized.business.logo : null,
          certificate: typeof normalized.business.certificate === 'string' ? normalized.business.certificate : null,
        });
        setBusinessStatus(normalized.business.status ? normalized.business.status.charAt(0).toUpperCase() + normalized.business.status.slice(1).toLowerCase() : null);
        if (typeof normalized.profileImage === 'string') {
          setProfileImage(normalized.profileImage);
          try { localStorage.setItem('profileImageUrl', normalized.profileImage); } catch {}
        }
      } catch (e) {
        // Already toasted in service
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const payload = {
        name: profileFormData.name,
        email: profileFormData.email,
        mobileNumber: profileFormData.mobileNumber,
        whatsappNumber: profileFormData.whatsappNumber || "",
      };
      
      await AuthService.updateProfile(payload);
      
      // refresh data to reflect persisted values
      try {
        const res = await AuthService.getProfile();
        const root = res ?? {};
        const container = (root?.data?.customer ?? root?.data) ?? root;
        
        setProfileFormData({
          name: container?.name || "",
          email: container?.email || "",
          mobileNumber: (container?.mobileNumber ?? container?.phone) || "",
          whatsappNumber: container?.whatsappNumber || "",
        });
        toastHelper.showTost('Profile updated successfully', 'success');
      } catch (refreshError) {
        console.error('Error refreshing profile data:', refreshError);
        toastHelper.showTost('Failed to refresh profile data', 'error');
      }
    } catch (e) {
      console.error('Error updating profile:', e);
      // Error already handled via toast in AuthService
    }
  };

  const handleSaveBusiness = async () => {
    try {
      await AuthService.updateProfile({
        businessName: businessFormData.businessName,
        country: businessFormData.country,
        address: businessFormData.address,
        logo: businessFormData.businessLogo,
        certificate: businessFormData.certificate,
      });
      // refresh data to reflect persisted values
      try {
        const res = await AuthService.getProfile();
        const normalized = normalize(res);
        setBusinessFormData((prev) => ({
          ...prev,
          businessName: normalized.business.businessName || prev.businessName,
          country: normalized.business.country || prev.country,
          address: normalized.business.address || prev.address,
          businessLogo: normalized.business.logo ?? prev.businessLogo,
          certificate: normalized.business.certificate ?? prev.certificate,
        }));
        setBusinessPreviews((prev) => ({
          businessLogo: typeof normalized.business.logo === 'string'
            ? normalized.business.logo
            : prev.businessLogo,
          certificate: typeof normalized.business.certificate === 'string'
            ? normalized.business.certificate
            : prev.certificate,
        }));
        setBusinessStatus( normalized.business.status ? normalized.business.status.charAt(0).toUpperCase() + normalized.business.status.slice(1).toLowerCase() : null );
        toastHelper.showTost('Business profile updated successfully', 'success');
      } catch (refreshError) {
        console.error('Error refreshing business profile data:', refreshError);
        // toastHelper.showTost('Failed to refresh business profile data', 'error');
      }
    } catch (e) {
      console.error('Error updating business profile:', e);
      // Error already handled via toast in AuthService
    }
  };

  const normalize = (raw) => {
    const root = raw ?? {};
    const container = (root?.data?.customer ?? root?.data) ?? root;
    const business = container?.businessProfile ?? container?.business ?? {};
    const name = container?.name ?? '';
    const email = container?.email ?? '';
    const mobileNumber = container?.mobileNumber ?? container?.phone ?? '';
    const whatsappNumber = container?.whatsappNumber ?? '';
    const profileImage = toAbsoluteUrl(container?.profileImage ?? container?.avatar ?? null);
    const businessName = business?.businessName ?? business?.companyName ?? '';
    const country = business?.country ?? business?.businessCountry ?? '';
    const address = business?.address ?? business?.businessAddress ?? '';
    const logo = toAbsoluteUrl(business?.logo ?? business?.businessLogo ?? null);
    const certificate = toAbsoluteUrl(business?.certificate ?? business?.businessCertificate ?? null);
    const status = business?.status ?? null;
    return { name, email, mobileNumber, whatsappNumber, profileImage, business: { businessName, country, address, logo, certificate, status } };
  };

  const toAbsoluteUrl = (p) => {
    if (!p || typeof p !== 'string') return null;
    const normalized = p.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalized)) return normalized;
    return `${env.baseUrl}/${normalized.replace(/^\//, '')}`;
  };

  // Profile Details Handler
  const handleProfileChange = (field, value) => {
    setProfileFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Password Change Handler
  const handlePasswordChange = (field, value) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  // Business Profile Handler
  const handleBusinessChange = (field, value) => {
    setBusinessFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Business File Upload Handler
  const handleBusinessFileChange = (field, file) => {
    setBusinessFormData((prev) => ({ ...prev, [field]: file }));
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBusinessPreviews((prev) => ({ ...prev, [field]: event.target.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setBusinessPreviews((prev) => ({ ...prev, [field]: null }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChangePassword = async () => {
    const currentPassword = passwords.current?.trim();
    const newPassword = passwords.new?.trim();
    const confirmPassword = passwords.confirm?.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toastHelper.showTost('Please fill all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastHelper.showTost('New password and confirm password do not match', 'error');
      return;
    }
    if (currentPassword === newPassword) {
      toastHelper.showTost('New password must be different from current password', 'error');
      return;
    }

    try {
      await AuthService.changePassword({ currentPassword, newPassword });
      setPasswords({ current: '', new: '', confirm: '' });
      toastHelper.showTost('Password updated successfully', 'success');
    } catch (e) {
      // Error already handled via toast in service
    }
  };

  const onChangeProfileField = (key, value) => handleProfileChange(key, value);
  const onChangeBusinessField = (key, value) => handleBusinessChange(key, value);
  const onChangeBusinessFile = (key, file) => handleBusinessFileChange(key, file);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar with profile picture and navigation */}
          <div className="w-full lg:w-1/4 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <ProfilePictureUpload profileImage={profileImage} displayName={profileFormData.name} onChangeImage={handleImageChange} />
            </div>
            
            <ProfileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          {/* Right content area */}
          <div className="w-full lg:w-3/4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {activeTab === "profile" && (
                <ProfileDetails formData={profileFormData} onChange={onChangeProfileField} onSave={handleSaveProfile} />
              )}
              {activeTab === "business" && (
                <BusinessProfile formData={businessFormData} previews={businessPreviews} onChangeField={onChangeBusinessField} onChangeFile={onChangeBusinessFile} onSave={handleSaveBusiness} status={businessStatus} />
              )}
              {activeTab === "password" && (
                <ChangePassword passwords={passwords} showPasswords={showPasswords} onChange={handlePasswordChange} onToggle={togglePasswordVisibility} onSubmit={handleChangePassword} userEmail={profileFormData.email} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;