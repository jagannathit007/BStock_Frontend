import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faUser,
  faPhone,
  faShieldHalved,
  faSpinner,
  faChevronDown,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import countriesData from "../data/countries.json";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { AuthService } from "../services/auth/auth.services";
import loginImage from "../../public/images/login.png";

// Validation schema
const signupSchema = yup.object({
  fullName: yup
    .string()
    .required("Full name is required")
    .min(2, "Full name must be at least 2 characters")
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
  phoneCode: yup.string().required("Country code is required"),
  whatsapp: yup.string().optional(),
  whatsappCode: yup.string().optional(),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

const SignUpForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [showWhatsappDropdown, setShowWhatsappDropdown] = useState(false);
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState(null);
  const [phoneSearchTerm, setPhoneSearchTerm] = useState("");
  const [whatsappSearchTerm, setWhatsappSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
    setError: setFormError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      mobileNumber: "",
      phoneCode: "+91",
      whatsapp: "",
      whatsappCode: "+91",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const watchedWhatsapp = watch("whatsapp");
  const watchedWhatsappCode = watch("whatsappCode");
  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  useEffect(() => {
    // Sort countries alphabetically
    const sortedCountries = [...countriesData.countries].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setCountries(sortedCountries);

    // Initialize Google Sign-In
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id:
          "695873248784-k6f8fjsvj0u76e82u40qu8ishcbnrabd.apps.googleusercontent.com",
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const googleSignInDiv = document.getElementById("googleSignInDiv");
      if (googleSignInDiv) {
        window.google.accounts.id.renderButton(googleSignInDiv, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "pill",
        });
      }
    }
  };

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setError(null);
    try {
      const userData = jwtDecode(response.credential);
      console.log("Google User:", userData);

      const registerData = {
        name: userData.name || "",
        email: userData.email || "",
        socialId: userData.sub, // Google user ID
        platformName: "google",
      };

      const res = await AuthService.register(registerData);
      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);

        // Check if profile is complete for Google signup users
        if (res.data.customer && res.data.customer.platformName === "google") {
          const isProfileComplete = AuthService.isProfileComplete(
            res.data.customer
          );
          if (!isProfileComplete) {
            navigate("/profile");
            return;
          }
        }

        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Google sign up failed:", err);
      setError(err.message || "Google sign up failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    // Filter non-digit characters for mobile and WhatsApp numbers
    let filteredValue = value;
    if (field === "mobileNumber" || field === "whatsapp") {
      filteredValue = value.replace(/[^0-9]/g, "");
    }

    setValue(field, filteredValue);
    if (error) setError(null); // Clear error on input change

    // Custom validation for WhatsApp fields
    if (field === "whatsapp" && filteredValue && filteredValue.trim().length > 0) {
      // Validate WhatsApp number format
      if (filteredValue.length < 7) {
        setFormError("whatsapp", {
          type: "manual",
          message: "WhatsApp number must be at least 7 digits",
        });
      } else {
        clearErrors("whatsapp");
      }

      // If WhatsApp number is provided, country code becomes required
      if (!watchedWhatsappCode) {
        setFormError("whatsappCode", {
          type: "manual",
          message: "Country code is required when WhatsApp number is provided",
        });
      }
    } else if (field === "whatsappCode") {
      // Clear WhatsApp country code error if country code is provided
      if (watchedWhatsapp && watchedWhatsapp.trim().length > 0) {
        clearErrors("whatsappCode");
      }
    } else if (field === "whatsapp" && (!filteredValue || filteredValue.trim().length === 0)) {
      // Clear errors if WhatsApp number is empty
      clearErrors("whatsapp");
      clearErrors("whatsappCode");
    }

    // Trigger validation for the field
    trigger(field);
  };

  const handlePhoneCodeChange = (code) => {
    setValue("phoneCode", code);
    setShowPhoneDropdown(false);
    setPhoneSearchTerm(""); // Clear search when selection is made
    trigger("phoneCode");
  };

  const handleWhatsappCodeChange = (code) => {
    setValue("whatsappCode", code);
    setShowWhatsappDropdown(false);
    setWhatsappSearchTerm(""); // Clear search when selection is made
    trigger("whatsappCode");
  };

  // Filter countries based on search term
  const getFilteredCountries = (searchTerm) => {
    if (!searchTerm) return countries;
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.phone_code.includes(searchTerm)
    );
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    // Additional validation: WhatsApp country code required if WhatsApp number provided
    if (data.whatsapp && data.whatsapp.trim().length > 0) {
      if (!data.whatsappCode || data.whatsappCode.trim().length === 0) {
        setFormError("whatsappCode", {
          type: "manual",
          message: "Country code is required when WhatsApp number is provided",
        });
        setIsLoading(false);
        return;
      }
    }

    const registerData = {
      name: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      mobileNumber: `${data.phoneCode}${data.mobileNumber}`,
      mobileCountryCode: data.phoneCode,
      whatsappNumber: data.whatsapp ? `${data.whatsappCode}${data.whatsapp}` : "",
      whatsappCountryCode: data.whatsapp ? data.whatsappCode : "",
    };

    try {
      const res = await AuthService.register(registerData);
      // For regular sign-up, redirect to verification prompt page
      navigate("/verify-email");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0px 8px 25px rgba(79, 70, 229, 0.3)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.98 },
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 },
    },
  };

  // Right side image section
  const ImageSection = () => (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center overflow-hidden">
      <img
        src={loginImage}
        alt="Premium GSM Bidding Platform"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/80 to-indigo-800/90"></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-white/5 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 bg-white/10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 text-center text-white px-8 max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-8 backdrop-blur-sm">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          Join the xGSM community
        </h2>
        <p className="text-xl text-blue-100 leading-relaxed">
          Create your account to access exclusive deals, trusted sellers, and unbeatable prices on mobile devices.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-blue-50 fixed inset-0 overflow-auto">
      {/* Left Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-4 lg:px-6 bg-transparent overflow-y-auto py-8">
        <motion.div
          className="w-full max-w-2xl space-y-10 px-6 sm:px-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo and Header */}
          <motion.div className="text-center" variants={childVariants}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-6 animate-float">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Create your account
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Join the world's leading mobile trading platform
            </p>
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </motion.div>
          {/* Form Card */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8"
            variants={childVariants}
          >
            <motion.form
              className="space-y-6"
              onSubmit={handleSubmit(onSubmit)}
              variants={childVariants}
            >
            {/* Name and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    />
                  </div>
                  <input
                    type="text"
                    {...register("fullName", {
                      onChange: (e) => {
                        handleFieldChange("fullName", e.target.value);
                      },
                    })}
                    className={`block w-full pl-12 pr-4 py-4 border-2 rounded-xl transition-all duration-300 bg-gray-50/50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white ${
                      errors.fullName
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              {/* Email */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    />
                  </div>
                  <input
                    type="email"
                    {...register("email", {
                      onChange: (e) => {
                        handleFieldChange("email", e.target.value);
                      },
                    })}
                    className={`block w-full pl-12 pr-4 py-4 border-2 rounded-xl transition-all duration-300 bg-gray-50/50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white ${
                      errors.email
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
            {/* Phone and WhatsApp Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Phone Number
                </label>
                <div className="relative flex">
                  {/* Country Code Selector */}
                  <div className="relative w-28 mr-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhoneDropdown(!showPhoneDropdown);
                        if (showPhoneDropdown) setPhoneSearchTerm(""); // Clear search when closing
                      }}
                      className={`flex items-center justify-between cursor-pointer w-full px-4 py-4 bg-gray-50/50 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 text-gray-700 text-sm hover:bg-gray-100 transition-all duration-300 ${
                        errors.phoneCode
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                    >
                      <div className="flex items-center">
                        {countries.find(
                          (c) => c.phone_code === watch("phoneCode")
                        )?.flag && (
                          <img
                            src={
                              countries.find(
                                (c) => c.phone_code === watch("phoneCode")
                              ).flag
                            }
                            alt="flag"
                            className="w-4 h-4 mr-1"
                          />
                        )}
                        <span>{watch("phoneCode")}</span>
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="ml-1 text-xs text-gray-400"
                      />
                    </button>
                    {showPhoneDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-200">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FontAwesomeIcon
                                icon={faSearch}
                                className="text-gray-400 text-xs"
                              />
                            </div>
                            <input
                              type="text"
                              value={phoneSearchTerm}
                              onChange={(e) =>
                                setPhoneSearchTerm(e.target.value)
                              }
                              className="block w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md "
                              placeholder="Search countries..."
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {/* Countries List */}
                        <div className="max-h-48 overflow-y-auto">
                          {getFilteredCountries(phoneSearchTerm).map(
                            (country) => (
                              <div
                                key={country.code}
                                onClick={() =>
                                  handlePhoneCodeChange(country.phone_code)
                                }
                                className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              >
                                <img
                                  src={country.flag}
                                  alt={country.name}
                                  className="w-4 h-4 mr-2"
                                />
                                <span className="truncate">{country.name}</span>
                                <span className="ml-auto text-gray-500">
                                  {country.phone_code}
                                </span>
                              </div>
                            )
                          )}
                          {getFilteredCountries(phoneSearchTerm).length ===
                            0 && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Phone Number Input */}
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      {...register("mobileNumber", {
                        onChange: (e) => {
                          handleFieldChange("mobileNumber", e.target.value);
                        },
                      })}
                      className={`block w-full px-4 py-4 text-sm border-2 rounded-xl transition-all duration-300 bg-gray-50/50 focus:ring-4 focus:ring-blue-500/20 focus:bg-white ${
                        errors.mobileNumber
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                {(errors.mobileNumber || errors.phoneCode) && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.mobileNumber?.message || errors.phoneCode?.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  WhatsApp Number
                </label>
                <div className="relative flex">
                  {/* Country Code Selector */}
                  <div className="relative w-28 mr-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowWhatsappDropdown(!showWhatsappDropdown);
                        if (showWhatsappDropdown) setWhatsappSearchTerm(""); // Clear search when closing
                      }}
                      className={`flex items-center justify-between cursor-pointer w-full px-4 py-4 bg-gray-50/50 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 text-gray-700 text-sm hover:bg-gray-100 transition-all duration-300 ${
                        errors.whatsappCode
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                    >
                      <div className="flex items-center">
                        {countries.find(
                          (c) => c.phone_code === watch("whatsappCode")
                        )?.flag && (
                          <img
                            src={
                              countries.find(
                                (c) => c.phone_code === watch("whatsappCode")
                              ).flag
                            }
                            alt="flag"
                            className="w-4 h-4 mr-1"
                          />
                        )}
                        <span>{watch("whatsappCode")}</span>
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="ml-1 text-xs text-gray-400"
                      />
                    </button>
                    {showWhatsappDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-200">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FontAwesomeIcon
                                icon={faSearch}
                                className="text-gray-400 text-xs"
                              />
                            </div>
                            <input
                              type="text"
                              value={whatsappSearchTerm}
                              onChange={(e) =>
                                setWhatsappSearchTerm(e.target.value)
                              }
                              className="block w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md "
                              placeholder="Search countries..."
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {/* Countries List */}
                        <div className="max-h-48 overflow-y-auto">
                          {getFilteredCountries(whatsappSearchTerm).map(
                            (country) => (
                              <div
                                key={country.code}
                                onClick={() =>
                                  handleWhatsappCodeChange(country.phone_code)
                                }
                                className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              >
                                <img
                                  src={country.flag}
                                  alt={country.name}
                                  className="w-4 h-4 mr-2"
                                />
                                <span className="truncate">{country.name}</span>
                                <span className="ml-auto text-gray-500">
                                  {country.phone_code}
                                </span>
                              </div>
                            )
                          )}
                          {getFilteredCountries(whatsappSearchTerm).length ===
                            0 && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* WhatsApp Number Input */}
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      {...register("whatsapp", {
                        onChange: (e) => {
                          handleFieldChange("whatsapp", e.target.value);
                        },
                      })}
                      className={`block w-full px-4 py-4 text-sm border-2 rounded-xl transition-all duration-300 bg-gray-50/50 focus:ring-4 focus:ring-blue-500/20 focus:bg-white ${
                        errors.whatsapp
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                      placeholder="Enter WhatsApp number"
                    />
                  </div>
                </div>
                {(errors.whatsapp || errors.whatsappCode) && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.whatsapp?.message || errors.whatsappCode?.message}
                  </p>
                )}
              </div>
            </div>
            {/* Password and Confirm Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      onChange: (e) => {
                        handleFieldChange("password", e.target.value);
                      },
                    })}
                    className={`block w-full pl-12 pr-12 py-4 border-2 rounded-xl transition-all duration-300 bg-gray-50/50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white ${
                      errors.password
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEye : faEyeSlash}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    />
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.password.message}
                  </p>
                )}
              </div>
              {/* Confirm Password */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword", {
                      onChange: (e) => {
                        handleFieldChange("confirmPassword", e.target.value);
                      },
                    })}
                    className={`block w-full pl-12 pr-12 py-4 border-2 rounded-xl transition-all duration-300 bg-gray-50/50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white ${
                      errors.confirmPassword
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={showConfirmPassword ? faEye : faEyeSlash}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
            {/* Terms Checkbox */}
            <div className="flex items-start group">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-5 w-5 cursor-pointer text-blue-600 focus:ring-4 focus:ring-blue-500/20 border-2 border-gray-300 rounded-lg transition-all duration-200"
                />
              </div>
              <label
                htmlFor="terms"
                className="ml-3 block text-sm text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
            {/* Create Account Button */}
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg focus:ring-4 focus:ring-blue-500/30 cursor-pointer transition-all duration-300 flex items-center justify-center disabled:opacity-70 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              disabled={isLoading || isSubmitting}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              {isLoading || isSubmitting ? (
                <div className="flex items-center gap-2">
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
             5.291A7.962 7.962 0 014 12H0c0 
             3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : (
                <span>Create Account</span>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Or continue with
                </span>
              </div>
            </div>
            {/* Google Sign-In */}
            <div className="w-full">
              {googleLoading ? (
                <div className="flex justify-center items-center py-4 bg-gray-50/50 rounded-xl border-2 border-gray-200">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin text-blue-600 mr-3"
                  />
                  <span className="text-gray-700 font-medium">
                    Signing up with Google...
                  </span>
                </div>
              ) : (
                <div
                  id="googleSignInDiv"
                  className="w-full [&>div]:rounded-xl [&>div>div]:rounded-xl [&>div>div>div]:rounded-xl [&>div]:shadow-sm [&>div]:hover:shadow-md [&>div]:transition-all [&>div]:duration-300"
                ></div>
              )}
            </div>
            </motion.form>
          </motion.div>

          {/* Login Link */}
          <motion.div className="text-center" variants={childVariants}>
            <p className="text-gray-600 text-base font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </motion.div>

          {/* Security Notice */}
          <motion.div className="text-center" variants={childVariants}>
            <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="mr-2 text-green-600"
              />
              Enterprise-grade security
            </div>
          </motion.div>
        </motion.div>
      </div>
      {/* Right Side - Image Section */}
      <div className="hidden lg:flex flex-1 relative">
        <ImageSection />
      </div>
    </div>
  );
};

export default SignUpForm;
