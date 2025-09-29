import React, { useState, useEffect } from "react";
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

const SignUpForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "", // Changed from phone to mobileNumber
    phoneCode: "+91", // Temporary field for phone code selection
    whatsapp: "",
    whatsappCode: "+91",
    password: "",
    confirmPassword: "",
  });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobileNumber") {
      // Combine phoneCode with mobileNumber when updating
      setFormData((prev) => ({
        ...prev,
        [name]: `${prev.phoneCode}${value.replace(/[^0-9]/g, "")}`, // Ensure only digits are appended
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    if (error) setError(null); // Clear error on input change
  };

  const handlePhoneCodeChange = (code) => {
    setFormData((prev) => ({
      ...prev,
      phoneCode: code,
      mobileNumber: `${code}${prev.mobileNumber.replace(/^\+\d+/, "") || ""}`, // Update mobileNumber with new code
    }));
    setShowPhoneDropdown(false);
    setPhoneSearchTerm(""); // Clear search when selection is made
  };

  const handleWhatsappCodeChange = (code) => {
    setFormData((prev) => ({ ...prev, whatsappCode: code }));
    setShowWhatsappDropdown(false);
    setWhatsappSearchTerm(""); // Clear search when selection is made
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    const registerData = {
      name: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      mobileNumber: formData.mobileNumber,
      mobileCountryCode: formData.phoneCode,
      whatsappNumber: `${formData.whatsappCode}${(
        formData.whatsapp || ""
      ).replace(/[^0-9]/g, "")}`,
      whatsappCountryCode: formData.whatsappCode,
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
    <div className="relative w-full h-full bg-indigo-600 flex items-center justify-center">
      {/* Background Image */}
      <img
        src={loginImage}
        alt="Premium GSM Bidding Platform"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Text Overlay */}
      <div className="relative z-10 text-center text-white px-6 max-w-2xl">
        <h2 className="text-2xl md:text-4xl font-bold mb-4">
          Join the xGSM Bidding community
        </h2>
        <p className="text-lg text-indigo-100">
          Create your account to access exclusive deals, trusted sellers, and
          unbeatable prices on mobile devices.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white fixed inset-0 overflow-auto">
      {/* Left Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-4 lg:px-6 bg-white overflow-y-auto py-4">
        <motion.div
          className="w-full max-w-xl space-y-8 px-4 sm:px-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div className="text-left" variants={childVariants}>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create your account !
            </h1>
            <p className="text-gray-600">
              Join us to access the best deals in the mobile industry.
            </p>
            {error && (
              <p className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
          </motion.div>
          {/* Signup Form */}
          <motion.form
            className="space-y-6"
            onSubmit={handleSubmit}
            variants={childVariants}
          >
            {/* Name and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-indigo-400 text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg  transition-colors bg-white text-sm"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-indigo-400 text-sm"
                    />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg  transition-colors bg-white text-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
            </div>
            {/* Phone and WhatsApp Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex">
                  {/* Country Code Selector */}
                  <div className="relative w-24 mr-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhoneDropdown(!showPhoneDropdown);
                        if (showPhoneDropdown) setPhoneSearchTerm(""); // Clear search when closing
                      }}
                      className="flex items-center justify-between cursor-pointer w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black-500 text-gray-700 text-sm hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        {countries.find(
                          (c) => c.phone_code === formData.phoneCode
                        )?.flag && (
                          <img
                            src={
                              countries.find(
                                (c) => c.phone_code === formData.phoneCode
                              ).flag
                            }
                            alt="flag"
                            className="w-4 h-4 mr-1"
                          />
                        )}
                        <span>{formData.phoneCode}</span>
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
                      id="mobileNumber"
                      name="mobileNumber"
                      value={
                        formData.mobileNumber.replace(formData.phoneCode, "") ||
                        ""
                      }
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, ""); // Only numbers
                        handleChange({
                          target: { name: "mobileNumber", value: numericValue },
                        });
                      }}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg  transition-colors bg-white"
                      placeholder="Phone number"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  WhatsApp Number
                </label>
                <div className="relative flex">
                  {/* Country Code Selector */}
                  <div className="relative w-24 mr-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowWhatsappDropdown(!showWhatsappDropdown);
                        if (showWhatsappDropdown) setWhatsappSearchTerm(""); // Clear search when closing
                      }}
                      className="flex items-center justify-between cursor-pointer w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-gray-700 text-sm hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        {countries.find(
                          (c) => c.phone_code === formData.whatsappCode
                        )?.flag && (
                          <img
                            src={
                              countries.find(
                                (c) => c.phone_code === formData.whatsappCode
                              ).flag
                            }
                            alt="flag"
                            className="w-4 h-4 mr-1"
                          />
                        )}
                        <span>{formData.whatsappCode}</span>
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
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, ""); // Only numbers
                        handleChange({
                          target: { name: "whatsapp", value: numericValue },
                        });
                      }}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg  transition-colors bg-white"
                      placeholder="WhatsApp number"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Password and Confirm Password Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="text-indigo-400 text-sm"
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg  transition-colors bg-white"
                    placeholder="Create password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEye : faEyeSlash}
                      className="text-gray-400 hover:text-indigo-600 transition-colors text-sm"
                    />
                  </button>
                </div>
              </div>
              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="text-indigo-400 text-sm"
                    />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg  transition-colors bg-white"
                    placeholder="Confirm password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <FontAwesomeIcon
                      icon={showConfirmPassword ? faEye : faEyeSlash}
                      className="text-gray-400 hover:text-indigo-600 transition-colors text-sm"
                    />
                  </button>
                </div>
              </div>
            </div>
            {/* Terms Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 cursor-pointer text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                />
              </div>
              <label
                htmlFor="terms"
                className="ml-3 block text-sm text-gray-700"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
            {/* Create Account Button */}
            <motion.button
              type="submit"
              className="w-full bg-[#0071E0] text-white py-2 px-4 rounded-lg font-medium focus:ring-4 cursor-pointer transition-colors flex items-center justify-center disabled:opacity-70"
              disabled={isLoading}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              {isLoading ? (
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
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">
                  Or, Sign up with
                </span>
              </div>
            </div>
            {/* Google Sign-In */}
            <div className="w-full">
              {googleLoading ? (
                <div className="flex justify-center items-center py-3 bg-gray-50 rounded-lg border">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin text-indigo-600 mr-2"
                  />
                  <span className="text-gray-700">
                    Signing up with Google...
                  </span>
                </div>
              ) : (
                <div
                  id="googleSignInDiv"
                  className="w-fit mx-auto [&>div]:rounded-lg [&>div>div]:rounded-lg [&>div>div>div]:rounded-lg"
                ></div>
              )}
            </div>
          </motion.form>
          {/* Login Link */}
          <motion.div className="text-center" variants={childVariants}>
            <p className="text-gray-600 text-sm font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
          {/* Security Notice */}
          <motion.div className="text-center" variants={childVariants}>
            <p className="text-xs text-gray-500 flex items-center justify-center font-medium">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="mr-2 text-indigo-500"
              />
              Your business data is protected with enterprise-grade security
            </p>
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
