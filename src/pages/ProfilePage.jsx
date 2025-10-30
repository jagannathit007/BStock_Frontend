import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { AuthService } from "../services/auth/auth.services";
import { env } from "../utils/env";
import toastHelper from "../utils/toastHelper";
import CountrySelector from "../components/CountrySelector";
import WatchlistContent from "../components/WishListPage/WatchlistContent";

// Validation schemas
const profileSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .trim(),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .trim(),
  mobileNumber: yup
    .string()
    .required("Mobile number is required")
    .min(7, "Mobile number must be at least 7 digits"),
  mobileCountryCode: yup.string().required("Country code is required"),
  whatsappNumber: yup.string().optional(),
  whatsappCountryCode: yup.string().optional(),
});

const businessSchema = yup.object({
  businessName: yup
    .string()
    .required("Business name is required")
    .min(2, "Business name must be at least 2 characters")
    .trim(),
  country: yup.string().required("Country is required"),
  address: yup.string().optional(),
  currency: yup.string().required("Currency is required"),
  currencyCode: yup.string().optional(),
});

const passwordSchema = yup.object({
  current: yup.string().required("Current password is required"),
  new: yup
    .string()
    .required("New password is required")
    .min(6, "New password must be at least 6 characters")
    .notOneOf(
      [yup.ref("current")],
      "New password must be different from current password"
    ),
  confirm: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("new")], "Passwords do not match"),
});

// Top-level, stable components to prevent remounts (focus loss)
const ProfilePictureUpload = ({ profileImage, displayName, onChangeImage }) => {
  const [imageError, setImageError] = useState(false);

  const hasImage = useMemo(() => {
    return (
      (typeof profileImage === "string" && profileImage.trim() !== "") ||
      profileImage instanceof File
    );
  }, [profileImage]);

  const previewSrc = useMemo(() => {
    if (typeof profileImage === "string" && profileImage.trim() !== "")
      return profileImage;
    if (profileImage instanceof File) return URL.createObjectURL(profileImage);
    return null;
  }, [profileImage]);

  const getInitials = useMemo(() => {
    if (!displayName) return "U";
    const words = displayName.trim().split(" ");
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
      <div className="relative group cursor-pointer mb-6">
        <div className="relative">
          {hasImage ? (
            <img
              src={imageError ? "/images/avtar.jpg" : previewSrc}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover ring-1 ring-gray-200/50"
              onError={handleImageError}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0071E0] to-[#005BB5] flex items-center justify-center ring-1 ring-gray-200/50">
              <span className="text-white text-xl font-semibold">
                {getInitials}
              </span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <label className="cursor-pointer p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-200 shadow-lg">
            <input
              type="file"
              accept="image/*"
              onChange={onChangeImage}
              className="hidden"
            />
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </label>
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
          {displayName || "User"}
        </h3>
        <p className="text-sm text-gray-500 mt-1">Account Settings</p>
      </div>
      <label className="mt-6 px-6 py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors duration-200 border border-gray-200 rounded-full hover:border-gray-300">
        <input
          type="file"
          accept="image/*"
          onChange={onChangeImage}
          className="hidden"
        />
        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        Change Photo
      </label>
    </div>
  );
};

const ProfileNavigation = ({ activeTab }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const navItems = [
    { id: "profile", label: "Profile Information", icon: "fas fa-user" },
    { id: "business", label: "Business Profile", icon: "fas fa-building" },
    { id: "watchlist", label: "My Watchlist", icon: "fas fa-clock" },
    { id: "password", label: "Security Settings", icon: "fas fa-lock" },
  ];

  const handleTabChange = (tabId) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("tab", tabId);
    navigate({ search: newSearchParams.toString() });
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="w-full">
          <nav className="space-y-1">
            {navItems.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`w-full px-4 py-3 text-left rounded-xl flex items-center text-sm font-medium transition-all duration-200 group ${
                  activeTab === id
                    ? "bg-[#0071E0] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={`mr-3 transition-colors duration-200 ${
                  activeTab === id ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {id === "profile" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    )}
                    {id === "business" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    )}
                    {id === "watchlist" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"></path>
                    )}
                    {id === "password" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    )}
                  </svg>
                </span>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

const ProfileDetails = ({ formData, onChange, onSave }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: formData,
    mode: "onBlur",
  });

  const watchedWhatsappNumber = watch("whatsappNumber");
  const watchedWhatsappCountryCode = watch("whatsappCountryCode");

  // Update form values when formData changes
  useEffect(() => {
    Object.keys(formData).forEach((key) => {
      setValue(key, formData[key]);
    });
  }, [formData, setValue]);

  // Validate WhatsApp country code when WhatsApp number changes
  useEffect(() => {
    if (watchedWhatsappNumber && watchedWhatsappNumber.trim().length > 0) {
      // WhatsApp number is provided, country code becomes required
      if (
        !watchedWhatsappCountryCode ||
        watchedWhatsappCountryCode.trim().length === 0
      ) {
        setError("whatsappCountryCode", {
          type: "manual",
          message: "Country code is required when WhatsApp number is provided",
        });
      } else {
        clearErrors("whatsappCountryCode");
      }
    } else {
      // WhatsApp number is empty, clear country code error
      clearErrors("whatsappCountryCode");
    }
  }, [
    watchedWhatsappNumber,
    watchedWhatsappCountryCode,
    setError,
    clearErrors,
  ]);

  const onSubmit = async (data) => {
    try {
      // Additional validation: WhatsApp country code required if WhatsApp number provided
      if (data.whatsappNumber && data.whatsappNumber.trim().length > 0) {
        if (
          !data.whatsappCountryCode ||
          data.whatsappCountryCode.trim().length === 0
        ) {
          setError("whatsappCountryCode", {
            type: "manual",
            message:
              "Country code is required when WhatsApp number is provided",
          });
          toastHelper.showTost("Please provide WhatsApp country code", "error");
          return;
        }
      }

      await onSave(data);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  // Helper function to filter only digits
  const filterDigitsOnly = (value) => {
    return value.replace(/[^0-9]/g, "");
  };

  const handleFieldChange = (field, value) => {
    // Filter non-digit characters for mobile and WhatsApp numbers
    let filteredValue = value;
    if (field === "mobileNumber" || field === "whatsappNumber") {
      filteredValue = filterDigitsOnly(value);
    }

    setValue(field, filteredValue);
    onChange(field, filteredValue);

    // Custom validation for WhatsApp fields
    if (
      field === "whatsappNumber" &&
      filteredValue &&
      filteredValue.trim().length > 0
    ) {
      // Validate WhatsApp number format
      if (filteredValue.length < 7) {
        setError("whatsappNumber", {
          type: "manual",
          message: "WhatsApp number must be at least 7 digits",
        });
      } else {
        clearErrors("whatsappNumber");
      }

      // If WhatsApp number is provided, country code becomes required
      if (!watchedWhatsappCountryCode) {
        setError("whatsappCountryCode", {
          type: "manual",
          message: "Country code is required when WhatsApp number is provided",
        });
      }
    } else if (field === "whatsappCountryCode") {
      // Clear WhatsApp country code error if country code is provided
      if (watchedWhatsappNumber && watchedWhatsappNumber.trim().length > 0) {
        clearErrors("whatsappCountryCode");
      }
    } else if (
      field === "whatsappNumber" &&
      (!filteredValue || filteredValue.trim().length === 0)
    ) {
      // Clear errors if WhatsApp number is empty
      clearErrors("whatsappNumber");
      clearErrors("whatsappCountryCode");
    }

    // Trigger validation for the field
    trigger(field);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Personal Information
        </h2>
        <p className="text-gray-600">
          Update your personal details and how others see you on the platform
        </p>
      </div>
      <div className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("name", {
              onChange: (e) => handleFieldChange("name", e.target.value),
            })}
            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 text-base focus:ring-2 focus:ring-[#0071E0]/20 focus:border-[#0071E0] border-gray-200 hover:border-gray-300 ${
              errors.name
                ? "border-red-500 focus:border-red-500"
                : ""
            }`}
            placeholder="Enter your name"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            {...register("email", {
              onChange: (e) => handleFieldChange("email", e.target.value),
            })}
            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 text-base focus:ring-2 focus:ring-[#0071E0]/20 focus:border-[#0071E0] border-gray-200 hover:border-gray-300 ${
              errors.email
                ? "border-red-500 focus:border-red-500"
                : ""
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Mobile Number with Country Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <div className="w-32">
              <CountrySelector
                value={formData.mobileCountryCode}
                onChange={(code) =>
                  handleFieldChange("mobileCountryCode", code)
                }
                placeholder="Code"
                error={!!errors.mobileCountryCode}
              />
            </div>
            <div className="flex-1">
              <input
                type="tel"
                {...register("mobileNumber", {
                  onChange: (e) =>
                    handleFieldChange("mobileNumber", e.target.value),
                })}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 text-base focus:ring-2 focus:ring-[#0071E0]/20 focus:border-[#0071E0] border-gray-200 hover:border-gray-300 ${
                  errors.mobileNumber
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }`}
                placeholder="Enter mobile number"
              />
            </div>
          </div>
          {(errors.mobileNumber || errors.mobileCountryCode) && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.mobileNumber?.message ||
                errors.mobileCountryCode?.message}
            </p>
          )}
        </div>

        {/* WhatsApp Number with Country Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            WhatsApp Number{" "}
            <span className="text-gray-500 font-normal">(Optional)</span>
          </label>
          <div className="flex gap-3">
            <div className="w-32">
              <CountrySelector
                value={formData.whatsappCountryCode}
                onChange={(code) =>
                  handleFieldChange("whatsappCountryCode", code)
                }
                placeholder="Code"
                error={!!errors.whatsappCountryCode}
              />
            </div>
            <div className="flex-1">
              <input
                type="tel"
                {...register("whatsappNumber", {
                  onChange: (e) =>
                    handleFieldChange("whatsappNumber", e.target.value),
                })}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 text-base focus:ring-2 focus:ring-[#0071E0]/20 focus:border-[#0071E0] border-gray-200 hover:border-gray-300 ${
                  errors.whatsappNumber
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }`}
                placeholder="Enter WhatsApp number"
              />
            </div>
          </div>
          {(errors.whatsappNumber || errors.whatsappCountryCode) && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.whatsappNumber?.message ||
                errors.whatsappCountryCode?.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end pt-6">
        <button
          type="submit"
          className="px-8 py-3 bg-[#0071E0] text-white rounded-xl font-medium hover:bg-[#0056B3] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 
             0 5.373 0 12h4zm2 5.291A7.962 
             7.962 0 014 12H0c0 3.042 1.135 
             5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </form>
  );
};

const BusinessProfile = ({
  formData,
  previews,
  onChangeField,
  onChangeFile,
  onSave,
  status,
}) => {
  const [logoImageError, setLogoImageError] = useState(false);
  const [certificateImageError, setCertificateImageError] = useState(false);

  const isInitial = useRef(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    trigger,
    watch,
    control,
  } = useForm({
    resolver: yupResolver(businessSchema),
    defaultValues: formData,
    mode: "onBlur",
  });

  const watchedCountry = watch("country");
  const watchedCurrency = watch("currency");

  // Currency auto-selection map
  const countryToCurrency = {
    Hongkong: "HKD",
    Dubai: "AED",
    Singapore: "SGD",
    India: "INR",
  };

  // Auto-set currency when country changes
  useEffect(() => {
    if (!watchedCountry) return;

    const curr = countryToCurrency[watchedCountry];
    if (!curr) return;

    if (isInitial.current) {
      if (!watchedCurrency) {
        setValue("currency", curr);
        setValue("currencyCode", curr);
        onChangeField("currency", curr);
        onChangeField("currencyCode", curr);
        trigger("currency");
        trigger("currencyCode");
      }
      isInitial.current = false;
      return;
    }

    // For subsequent changes, always set to default
    setValue("currency", curr);
    setValue("currencyCode", curr);
    onChangeField("currency", curr);
    onChangeField("currencyCode", curr);
    trigger("currency");
    trigger("currencyCode");
  }, [watchedCountry, watchedCurrency, setValue, onChangeField, trigger]);

  // Update form values when formData changes
  useEffect(() => {
    Object.keys(formData).forEach((key) => {
      setValue(key, formData[key]);
    });
  }, [formData, setValue]);

  const onSubmit = async (data) => {
    try {
      await onSave(data);
    } catch (error) {
      console.error("Error saving business profile:", error);
    }
  };

  const handleFieldChange = (field, value) => {
    setValue(field, value);
    onChangeField(field, value);
    // Trigger validation for the field
    trigger(field);
  };

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

  const countries = ["Hongkong", "Dubai", "Singapore", "India"];
  const currencies = ["HKD", "AED", "SGD", "INR"];
  const logoFileName = formData.businessLogo
    ? typeof formData.businessLogo === "string"
      ? formData.businessLogo.split("/").pop()
      : formData.businessLogo.name
    : "";
  const certificateExt = formData.certificate
    ? typeof formData.certificate === "string"
      ? (formData.certificate.split(".").pop() || "").toUpperCase()
      : (formData.certificate.name.split(".").pop() || "").toUpperCase()
    : "";
  const certificateIsImage =
    typeof formData.certificate === "object" &&
    formData.certificate?.type?.startsWith("image/");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Business Information
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your business details and credentials
        </p>
      </div>
      {status &&
        (status === "Approved" ? (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            <i className="fas fa-check-circle"></i>
            <span className="text-sm font-medium">
              Business account verified
            </span>
          </div>
        ) : status === "Rejected" ? (
          <div className="flex items-center space-x-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <i className="fas fa-times-circle"></i>
            <span className="text-sm font-medium">
              Business verification rejected. Please update details and
              resubmit.
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <i className="fas fa-clock"></i>
            <span className="text-sm font-medium">
              Business verification pending. We will notify you once reviewed.
            </span>
          </div>
        ))}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i
              className="fas fa-building w-4 h-4 mr-2"
              style={{ color: "#0071E0" }}
            ></i>
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("businessName")}
            value={watch("businessName")}
            onChange={(e) => handleFieldChange("businessName", e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border transition-colors duration-200 text-sm focus:ring-2 focus:ring-[#0071E0]/20 ${
              errors.businessName
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-[#0071E0]"
            }`}
            placeholder="Enter your business name"
          />
          {errors.businessName && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.businessName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i
              className="fas fa-globe w-4 h-4 mr-2"
              style={{ color: "#0071E0" }}
            ></i>
            Country <span className="text-red-500">*</span>
          </label>
          <select
            {...register("country")}
            value={watch("country")}
            onChange={(e) => {
              const selectedCountry = e.target.value;
              handleFieldChange("country", selectedCountry);
            }}
            className={`w-full px-4 py-2 rounded-lg border transition-colors duration-200 text-sm focus:ring-2 focus:ring-[#0071E0]/20 ${
              errors.country
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-[#0071E0]"
            }`}
          >
            <option value="">Select your country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.country.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i
              className="fas fa-money-bill w-4 h-4 mr-2"
              style={{ color: "#0071E0" }}
            ></i>
            Currency <span className="text-red-500">*</span>
          </label>
          <select
            {...register("currency")}
            value={watch("currency")}
            onChange={(e) => {
              const selectedCurrency = e.target.value;
              handleFieldChange("currency", selectedCurrency);
              setValue("currencyCode", selectedCurrency);
              onChangeField("currencyCode", selectedCurrency);
            }}
            className={`w-full px-4 py-2 rounded-lg border transition-colors duration-200 text-sm focus:ring-2 focus:ring-[#0071E0]/20 ${
              errors.currency
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-[#0071E0]"
            }`}
          >
            <option value="">Select currency</option>
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
          {errors.currency && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errors.currency.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i
              className="fas fa-map-marker-alt w-4 h-4 mr-2"
              style={{ color: "#0071E0" }}
            ></i>
            Business Address{" "}
            <span className="text-gray-400 ml-1">(Optional)</span>
          </label>
          <textarea
            {...register("address")}
            value={watch("address")}
            onChange={(e) => handleFieldChange("address", e.target.value)}
            rows="3"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20 transition-colors duration-200 text-sm"
            placeholder="Enter your business address"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <i
              className="fas fa-image w-4 h-4 mr-2"
              style={{ color: "#0071E0" }}
            ></i>
            Business Logo <span className="text-gray-400 ml-1">(Optional)</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    onChangeFile("businessLogo", e.target.files[0])
                  }
                  className="hidden"
                />
                <i className="fas fa-upload mr-2"></i>
                Choose Logo
              </label>
              {formData.businessLogo && (
                <span className="text-sm text-gray-600">{logoFileName}</span>
              )}
            </div>
            {previews.businessLogo && (
              <div className="mt-3">
                <div className="relative inline-block">
                  <img
                    src={
                      logoImageError
                        ? "/images/avtar.jpg"
                        : previews.businessLogo
                    }
                    alt="Business Logo Preview"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                    onError={handleLogoImageError}
                  />
                  <button
                    onClick={() => {
                      onChangeField("businessLogo", null);
                      onChangeFile("businessLogo", null);
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
            <i
              className="fas fa-certificate w-4 h-4 mr-2"
              style={{ color: "#0071E0" }}
            ></i>
            Business Certificate{" "}
            <span className="text-gray-400 ml-1">(Optional)</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    onChangeFile("certificate", e.target.files[0])
                  }
                  className="hidden"
                />
                <i className="fas fa-upload mr-2"></i>
                Choose Certificate
              </label>
              {formData.certificate && (
                <span className="text-sm text-gray-600">
                  {certificateExt || "File selected"}
                </span>
              )}
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
                        src={
                          certificateImageError
                            ? "/images/avtar.jpg"
                            : previews.certificate
                        }
                        alt="Certificate Preview"
                        className="w-32 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                        onError={handleCertificateImageError}
                      />
                    ) : (
                      <div className="w-32 h-24 bg-gray-100 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                        <i className="fas fa-file-alt text-2xl text-gray-400 mb-1"></i>
                        <span className="text-xs text-gray-500 text-center px-1">
                          {certificateExt}
                        </span>
                      </div>
                    )}
                  </a>
                  <button
                    onClick={() => {
                      onChangeField("certificate", null);
                      onChangeFile("certificate", null);
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
          type="submit"
          disabled={isSubmitting}
          className={`min-w-[200px] px-6 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 shadow-sm hover:shadow-md ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#0071E0] text-white cursor-pointer hover:bg-[#005BB5]"
          }`}
        >
          {isSubmitting ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 
           0 5.373 0 12h4zm2 5.291A7.962 
           7.962 0 014 12H0c0 3.042 1.135 
           5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <>
              <i className="fas fa-save"></i>
              <span>Save Business Profile</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const ChangePassword = ({
  passwords,
  showPasswords,
  onChange,
  onToggle,
  onSubmit,
  userEmail,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
    reset,
  } = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      current: "",
      new: "",
      confirm: "",
    },
    mode: "onChange",
  });

  const watchedCurrent = watch("current");
  const watchedNew = watch("new");

  // Update form values when passwords change
  useEffect(() => {
    reset(passwords);
  }, [passwords, reset]);

  // Debug: Log current form values
  useEffect(() => {}, [watchedCurrent, watchedNew, watch]);

  const onFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error changing password:", error);
    }
  };

  const handleFieldChange = (field, value) => {
    setValue(field, value);
    onChange(field, value);
    // Trigger validation for all fields to clear errors from other fields
    trigger();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Security Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your password and account security
        </p>
      </div>
      {/* Hidden username to help browser autofill associate account */}
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={userEmail || ""}
        readOnly
        style={{ display: "none" }}
      />
      <div className="space-y-5">
        {[
          { key: "current", label: "Current Password" },
          { key: "new", label: "New Password" },
          { key: "confirm", label: "Confirm New Password" },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <i
                className="fas fa-lock w-4 h-4 mr-2"
                style={{ color: "#0071E0" }}
              ></i>
              {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords[key] ? "text" : "password"}
                {...register(key)}
                onChange={(e) => {
                  handleFieldChange(key, e.target.value);
                }}
                name={
                  key === "current"
                    ? "current-password"
                    : key === "new"
                    ? "new-password"
                    : "new-password-confirm"
                }
                autoComplete={
                  key === "current" ? "current-password" : "new-password"
                }
                className={`w-full px-4 py-2 rounded-lg border transition-colors duration-200 pr-12 text-sm focus:ring-2 focus:ring-[#0071E0]/20 ${
                  errors[key]
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-[#0071E0]"
                }`}
                placeholder={`Enter your ${label.toLowerCase()}`}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => onToggle(key)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#0071E0] transition-colors duration-200 text-sm"
              >
                <i
                  className={
                    showPasswords[key] ? "fas fa-eye" : "fas fa-eye-slash"
                  }
                ></i>
              </button>
            </div>
            {errors[key] && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {errors[key].message}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`min-w-[200px] px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 shadow-sm hover:shadow-md ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#0071E0] text-white cursor-pointer hover:bg-[#005BB5]"
          }`}
        >
          {isSubmitting ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 
           0 5.373 0 12h4zm2 5.291A7.962 
           7.962 0 014 12H0c0 3.042 1.135 
           5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <>
              <i className="fas fa-lock"></i>
              <span>Update Password</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get active tab from query params, default to "profile" if not specified
  const activeTab = searchParams.get("tab") || "profile";


  // Set default tab in URL if no tab parameter is present
  useEffect(() => {
    if (!searchParams.get("tab")) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("tab", "profile");
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

  const [profileImage, setProfileImage] = useState(null);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    mobileCountryCode: "",
    whatsappNumber: "",
    whatsappCountryCode: "",
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
    currency: "",
    currencyCode: "",
  });
  const [businessPreviews, setBusinessPreviews] = useState({
    businessLogo: null,
    certificate: null,
  });
  const [businessStatus, setBusinessStatus] = useState(null);

  // Profile Picture Upload Handler
  const handleImageChange = useCallback(async (e) => {
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
          const container = root?.data?.customer ?? root?.data ?? root;
          const pimg = container?.profileImage ?? container?.avatar;
          if (typeof pimg === "string") {
            const normalized = pimg.replace(/\\/g, "/");
            const absolute = /^https?:\/\//i.test(normalized)
              ? normalized
              : `${env.baseUrl}/${normalized.replace(/^\//, "")}`;
            setProfileImage(absolute);
            try {
              localStorage.setItem("profileImageUrl", absolute);
            } catch {}
          }
          toastHelper.showTost("Profile image updated successfully", "success");
        } catch (refreshError) {
          console.error("Error refreshing profile data:", refreshError);
          setProfileImage(previousImage); // Revert to previous image
          toastHelper.showTost("Failed to refresh profile data", "error");
        }
      } catch (e) {
        console.error("Error updating profile image:", e);
        setProfileImage(previousImage); // Revert to previous image on error
        // Error already handled via toast in AuthService
      }
    }
  }, [profileImage]);


  // Load profile on mount
  useEffect(() => {
    const toAbsoluteUrl = (p) => {
      if (!p || typeof p !== "string") return null;
      const normalized = p.replace(/\\/g, "/");
      if (/^https?:\/\//i.test(normalized)) return normalized;
      return `${env.baseUrl}/${normalized.replace(/^\//, "")}`;
    };
    const normalize = (raw) => {
      const root = raw ?? {};
      const container = root?.data?.customer ?? root?.data ?? root;
      const business = container?.businessProfile ?? container?.business ?? {};
      const name = container?.name ?? "";
      const email = container?.email ?? "";
      const mobileNumber = container?.mobileNumber ?? container?.phone ?? "";
      const mobileCountryCode = container?.mobileCountryCode ?? "";
      const whatsappNumber = container?.whatsappNumber ?? "";
      const whatsappCountryCode = container?.whatsappCountryCode ?? "";
      const profileImage = toAbsoluteUrl(
        container?.profileImage ?? container?.avatar ?? null
      );
      const businessName =
        business?.businessName ?? business?.companyName ?? "";
      const country = business?.country ?? business?.businessCountry ?? "";
      const address = business?.address ?? business?.businessAddress ?? "";
      const logo = toAbsoluteUrl(
        business?.logo ?? business?.businessLogo ?? null
      );
      const certificate = toAbsoluteUrl(
        business?.certificate ?? business?.businessCertificate ?? null
      );
      const currency = business?.currency ?? "";
      const currencyCode = business?.currencyCode ?? "";
      const status = business?.status ?? null;
      return {
        name,
        email,
        mobileNumber,
        mobileCountryCode,
        whatsappNumber,
        whatsappCountryCode,
        profileImage,
        business: {
          businessName,
          country,
          address,
          logo,
          certificate,
          currency,
          currencyCode,
          status,
        },
      };
    };
    const loadProfile = async () => {
      try {
        const res = await AuthService.getProfile();
        const normalized = normalize(res);
        setProfileFormData({
          name: normalized.name,
          email: normalized.email,
          mobileNumber: normalized.mobileNumber,
          mobileCountryCode: normalized.mobileCountryCode,
          whatsappNumber: normalized.whatsappNumber,
          whatsappCountryCode: normalized.whatsappCountryCode,
        });
        setBusinessFormData({
          businessName: normalized.business.businessName,
          country: normalized.business.country,
          address: normalized.business.address,
          businessLogo: normalized.business.logo,
          certificate: normalized.business.certificate,
          currency: normalized.business.currency,
          currencyCode: normalized.business.currencyCode,
        });
        setBusinessPreviews({
          businessLogo:
            typeof normalized.business.logo === "string"
              ? normalized.business.logo
              : null,
          certificate:
            typeof normalized.business.certificate === "string"
              ? normalized.business.certificate
              : null,
        });
        setBusinessStatus(
          normalized.business.status
            ? normalized.business.status.charAt(0).toUpperCase() +
                normalized.business.status.slice(1).toLowerCase()
            : null
        );
        if (typeof normalized.profileImage === "string") {
          setProfileImage(normalized.profileImage);
          try {
            localStorage.setItem("profileImageUrl", normalized.profileImage);
          } catch {}
        }
      } catch (e) {
        // Already toasted in service
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        mobileCountryCode: formData.mobileCountryCode,
        whatsappNumber: formData.whatsappNumber || "",
        whatsappCountryCode: formData.whatsappCountryCode || "",
      };

      await AuthService.updateProfile(payload);

      // refresh data to reflect persisted values
      try {
        const res = await AuthService.getProfile();
        const root = res ?? {};
        const container = root?.data?.customer ?? root?.data ?? root;

        setProfileFormData({
          name: container?.name || "",
          email: container?.email || "",
          mobileNumber: (container?.mobileNumber ?? container?.phone) || "",
          mobileCountryCode: container?.mobileCountryCode || "",
          whatsappNumber: container?.whatsappNumber || "",
          whatsappCountryCode: container?.whatsappCountryCode || "",
        });


        toastHelper.showTost("Profile updated successfully", "success");
      } catch (refreshError) {
        console.error("Error refreshing profile data:", refreshError);
        toastHelper.showTost("Failed to refresh profile data", "error");
      }
    } catch (e) {
      console.error("Error updating profile:", e);
      // Error is already handled by AuthService with toast message
      // No need to show additional error messages here
    }
  };

  const handleSaveBusiness = async (formData) => {
    try {
      // Store the current status before update
      const currentStatus = businessStatus;
      
      await AuthService.updateProfile({
        businessName: formData.businessName,
        country: formData.country,
        address: formData.address,
        logo: businessFormData.businessLogo,
        certificate: businessFormData.certificate,
        currency: formData.currency,
        currencyCode: formData.currencyCode,
        resetBusinessStatus: true, // Signal to backend to reset status to pending
      });
      // refresh data to reflect persisted values
      try {
        const res = await AuthService.getProfile();
        const normalized = normalize(res);
        setBusinessFormData({
          businessName: normalized.business.businessName,
          country: normalized.business.country,
          address: normalized.business.address,
          businessLogo: normalized.business.logo,
          certificate: normalized.business.certificate,
          currency: normalized.business.currency,
          currencyCode: normalized.business.currencyCode,
        });
        setBusinessPreviews({
          businessLogo:
            typeof normalized.business.logo === "string"
              ? normalized.business.logo
              : null,
          certificate:
            typeof normalized.business.certificate === "string"
              ? normalized.business.certificate
              : null,
        });
        
        // Update business status from the API response
        const newStatus = normalized.business.status
          ? normalized.business.status.charAt(0).toUpperCase() +
              normalized.business.status.slice(1).toLowerCase()
          : null;
        setBusinessStatus(newStatus);


        // Show appropriate success message based on status change
        if (currentStatus === "Approved" && newStatus === "Pending") {
          toastHelper.showTost(
            "Business profile updated successfully. Your profile status has been reset to Pending for re-verification.",
            "success"
          );
        } else {
          toastHelper.showTost(
            "Business profile updated successfully",
            "success"
          );
        }
      } catch (refreshError) {
        console.error("Error refreshing business profile data:", refreshError);
        // toastHelper.showTost('Failed to refresh business profile data', 'error');
      }
    } catch (e) {
      console.error("Error updating business profile:", e);
      // Error already handled via toast in AuthService
    }
  };

  const normalize = (raw) => {
    const root = raw ?? {};
    const container = root?.data?.customer ?? root?.data ?? root;
    const business = container?.businessProfile ?? container?.business ?? {};
    const name = container?.name ?? "";
    const email = container?.email ?? "";
    const mobileNumber = container?.mobileNumber ?? container?.phone ?? "";
    const mobileCountryCode = container?.mobileCountryCode ?? "";
    const whatsappNumber = container?.whatsappNumber ?? "";
    const whatsappCountryCode = container?.whatsappCountryCode ?? "";
    const profileImage = toAbsoluteUrl(
      container?.profileImage ?? container?.avatar ?? null
    );
    const businessName = business?.businessName ?? business?.companyName ?? "";
    const country = business?.country ?? business?.businessCountry ?? "";
    const address = business?.address ?? business?.businessAddress ?? "";
    const logo = toAbsoluteUrl(
      business?.logo ?? business?.businessLogo ?? null
    );
    const certificate = toAbsoluteUrl(
      business?.certificate ?? business?.businessCertificate ?? null
    );
    const currency = business?.currency ?? "";
    const currencyCode = business?.currencyCode ?? "";
    const status = business?.status ?? null;
    return {
      name,
      email,
      mobileNumber,
      mobileCountryCode,
      whatsappNumber,
      whatsappCountryCode,
      profileImage,
      business: {
        businessName,
        country,
        address,
        logo,
        certificate,
        currency,
        currencyCode,
        status,
      },
    };
  };

  const toAbsoluteUrl = (p) => {
    if (!p || typeof p !== "string") return null;
    const normalized = p.replace(/\\/g, "/");
    if (/^https?:\/\//i.test(normalized)) return normalized;
    return `${env.baseUrl}/${normalized.replace(/^\//, "")}`;
  };

  // Profile Details Handler
  const handleProfileChange = useCallback((field, value) => {
    setProfileFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Password Change Handler
  const handlePasswordChange = useCallback((field, value) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Business Profile Handler
  const handleBusinessChange = useCallback((field, value) => {
    setBusinessFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Business File Upload Handler
  const handleBusinessFileChange = useCallback((field, file) => {
    setBusinessFormData((prev) => ({ ...prev, [field]: file }));

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        setBusinessPreviews((prev) => ({
          ...prev,
          [field]: event.target.result,
        }));
      };
    } else {
      setBusinessPreviews((prev) => ({ ...prev, [field]: null }));
    }
  }, []);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleChangePassword = async (formData) => {
    const currentPassword = formData.current?.trim();
    const newPassword = formData.new?.trim();

    try {
      await AuthService.changePassword({ currentPassword, newPassword });
      setPasswords({ current: "", new: "", confirm: "" });
      toastHelper.showTost("Password updated successfully", "success");
    } catch (e) {
      // Error already handled via toast in service
    }
  };

  const onChangeProfileField = useCallback((key, value) => handleProfileChange(key, value), [handleProfileChange]);
  const onChangeBusinessField = useCallback((key, value) =>
    handleBusinessChange(key, value), [handleBusinessChange]);
  const onChangeBusinessFile = useCallback((key, file) =>
    handleBusinessFileChange(key, file), [handleBusinessFileChange]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left sidebar with profile picture and navigation */}
          <div className="w-full lg:w-80 flex flex-col gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <ProfilePictureUpload
                profileImage={profileImage}
                displayName={profileFormData.name}
                onChangeImage={handleImageChange}
              />
            </div>

            <ProfileNavigation activeTab={activeTab} />
          </div>

          {/* Right content area */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              {activeTab === "profile" && (
                <ProfileDetails
                  formData={profileFormData}
                  onChange={onChangeProfileField}
                  onSave={handleSaveProfile}
                />
              )}
              {activeTab === "business" && (
                <BusinessProfile
                  formData={businessFormData}
                  previews={businessPreviews}
                  onChangeField={onChangeBusinessField}
                  onChangeFile={onChangeBusinessFile}
                  onSave={handleSaveBusiness}
                  status={businessStatus}
                />
              )}
              {activeTab === "watchlist" && (
                <WatchlistContent />
              )}
              {activeTab === "password" && (
                <ChangePassword
                  passwords={passwords}
                  showPasswords={showPasswords}
                  onChange={handlePasswordChange}
                  onToggle={togglePasswordVisibility}
                  onSubmit={handleChangePassword}
                  userEmail={profileFormData.email}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;