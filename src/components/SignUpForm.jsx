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
} from "@fortawesome/free-solid-svg-icons";
import countriesData from "../data/countries.json";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    phoneCode: "+1",
    whatsapp: "",
    whatsappCode: "+1",
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
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      google.accounts.id.initialize({
        client_id:
          "695873248784-k6f8fjsvj0u76e82u40qu8ishcbnrabd.apps.googleusercontent.com",
        callback: handleGoogleResponse,
        auto_select: false,
      });

      const googleSignInDiv = document.getElementById("googleSignInDiv");
      if (googleSignInDiv) {
        google.accounts.id.renderButton(googleSignInDiv, {
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
    try {
      const userData = jwtDecode(response.credential);
      console.log("Google User:", userData);

      // Here you would typically send the credential to your backend
      // const res = await fetch('/api/auth/google', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ credential: response.credential })
      // });
      // const data = await res.json();

      // For demo, we'll just log and simulate success
      setTimeout(() => {
        console.log("Google sign up successful", userData);
        setGoogleLoading(false);
        // Redirect or update state as needed
      }, 1500);
    } catch (err) {
      console.error("Google sign up failed:", err);
      setGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneCodeChange = (code) => {
    setFormData((prev) => ({ ...prev, phoneCode: code }));
    setShowPhoneDropdown(false);
  };

  const handleWhatsappCodeChange = (code) => {
    setFormData((prev) => ({ ...prev, whatsappCode: code }));
    setShowWhatsappDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Form submitted:", {
      ...formData,
      fullPhone: `${formData.phoneCode}${formData.phone}`,
      fullWhatsapp: `${formData.whatsappCode}${formData.whatsapp}`,
    });
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
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
      scale: 1.05,
      boxShadow: "0px 4px 20px rgba(59, 130, 246, 0.3)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95 },
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
        {/* Subtle background animation for tech theme */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <motion.div
          className="w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto my-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo Section */}
          <motion.div
            className="text-center mb-6 md:mb-8"
            variants={childVariants}
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4 shadow-lg"
              variants={logoVariants}
            >
              <FontAwesomeIcon icon={faStore} className="text-white text-3xl" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              GSM Bidding
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">
              Create business account
            </p>
          </motion.div>

          {/* Signup Form Card */}
          <motion.div
            className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-6 sm:p-8 border border-blue-100"
            variants={childVariants}
          >
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <motion.div className="space-y-2" variants={childVariants}>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="text-blue-400"
                      />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 text-sm sm:text-base"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div className="space-y-2" variants={childVariants}>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-blue-400"
                      />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 text-sm sm:text-base"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </motion.div>
              </div>

              {/* Phone and WhatsApp Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone Number */}
                <motion.div className="space-y-2" variants={childVariants}>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <div className="relative flex">
                    {/* Country Code Selector */}
                    <div className="relative w-24 mr-2">
                      <button
                        type="button"
                        onClick={() => setShowPhoneDropdown(!showPhoneDropdown)}
                        className="flex items-center justify-between w-full px-2 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 text-xs sm:text-sm hover:bg-gray-100 transition-all duration-300"
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
                        <div className="absolute top-full left-0 mt-1 w-64 h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                          {countries.map((country) => (
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
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Phone Number Input */}
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 text-sm sm:text-base"
                        placeholder="Phone number"
                        required
                      />
                    </div>
                  </div>
                </motion.div>

                {/* WhatsApp Number */}
                <motion.div className="space-y-2" variants={childVariants}>
                  <label
                    htmlFor="whatsapp"
                    className="block text-sm font-medium text-gray-700"
                  >
                    WhatsApp Number
                  </label>
                  <div className="relative flex">
                    {/* Country Code Selector */}
                    <div className="relative w-24 mr-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShowWhatsappDropdown(!showWhatsappDropdown)
                        }
                        className="flex items-center justify-between w-full px-2 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 text-xs sm:text-sm hover:bg-gray-100 transition-all duration-300"
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
                        <div className="absolute top-full left-0 mt-1 w-64 h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                          {countries.map((country) => (
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
                          ))}
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
                        onChange={handleChange}
                        className="block w-full px-3 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 text-sm sm:text-base"
                        placeholder="WhatsApp number"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Password and Confirm Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <motion.div className="space-y-2" variants={childVariants}>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="text-blue-400"
                      />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 text-sm sm:text-base"
                      placeholder="Create password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      />
                    </button>
                  </div>
                </motion.div>

                {/* Confirm Password */}
                <motion.div className="space-y-2" variants={childVariants}>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="text-blue-400"
                      />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 text-sm sm:text-base"
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FontAwesomeIcon
                        icon={showConfirmPassword ? faEyeSlash : faEye}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      />
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Terms Checkbox */}
              <motion.div className="flex items-start" variants={childVariants}>
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded transition-all duration-200"
                  />
                </div>
                <label
                  htmlFor="terms"
                  className="ml-3 block text-xs sm:text-sm text-gray-700"
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                  >
                    Privacy Policy
                  </a>
                </label>
              </motion.div>

              {/* Centered Buttons Container */}
              <div className="flex flex-col items-center space-y-4">
                {/* Create Account Button */}
                <motion.button
                  type="submit"
                  className="w-full max-w-xs sm:max-w-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 sm:py-3 px-4 rounded-lg font-medium focus:ring-4 focus:ring-blue-300 transition-all duration-300 flex items-center justify-center shadow-md text-sm sm:text-base"
                  disabled={isLoading}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <span className={isLoading ? "mr-2" : ""}>
                    Create Account
                  </span>
                  {isLoading && (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                  )}
                </motion.button>

                {/* Divider */}
                <motion.div
                  className="relative my-4 w-full max-w-xs sm:max-w-sm"
                  variants={childVariants}
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 bg-white text-gray-500 font-medium">
                      Or continue with
                    </span>
                  </div>
                </motion.div>

                {/* Google Sign-In */}
                <div
                  id="googleSignInDiv"
                  className="w-full max-w-xs sm:max-w-sm"
                >
                  {googleLoading && (
                    <div className="flex justify-center items-center py-2 sm:py-3 text-xs sm:text-sm">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin text-blue-600 mr-2"
                      />
                      <span>Signing up with Google...</span>
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Login Link */}
            <motion.div className="mt-6 text-center" variants={childVariants}>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.div>

          {/* Security Notice */}
          <motion.div className="mt-6 text-center" variants={childVariants}>
            <p className="text-xs text-gray-500 flex items-center justify-center font-medium">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="mr-2 text-blue-500 animate-pulse"
              />
              Your business data is protected with enterprise-grade security
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpForm;
