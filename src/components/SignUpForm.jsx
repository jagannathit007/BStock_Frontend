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
        src="./images/login.png"
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
  <div className="flex-1 flex items-start justify-center px-4 sm:px-4 lg:px-6 bg-white overflow-y-auto py-4">
    <motion.div
      className="w-full max-w-xl space-y-8 px-4 sm:px-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo */}
      <motion.div className="text-left" variants={childVariants}>
        {/* <motion.div
          className="inline-flex items-center space-x-3 mb-6"
          variants={logoVariants}
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon
              icon={faStore}
              className="text-white text-lg"
            />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            GSM Bidding
          </span>
        </motion.div> */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create your account !
        </h1>
        <p className="text-gray-600">
          Join us to access the best deals in the mobile industry.
        </p>
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-sm"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-sm"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
        </div>
        {/* Phone and WhatsApp Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative flex">
              {/* Country Code Selector */}
              <div className="relative w-24 mr-2">
                <button
                  type="button"
                  onClick={() => setShowPhoneDropdown(!showPhoneDropdown)}
                  className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-700 text-sm hover:bg-gray-100 transition-colors"
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
                  <div className="absolute top-full left-0 mt-1 w-64 h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg z-10">
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
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>
          </div>
          {/* WhatsApp Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
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
                  className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-700 text-sm hover:bg-gray-100 transition-colors"
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
                  <div className="absolute top-full left-0 mt-1 w-64 h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg z-10">
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
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
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
                className="block w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
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
                className="block w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FontAwesomeIcon
                  icon={showConfirmPassword ? faEyeSlash : faEye}
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
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
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium focus:ring-4 focus:ring-indigo-300 transition-colors flex items-center justify-center disabled:opacity-70"
          disabled={isLoading}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <span className={isLoading ? "mr-2" : ""}>Create Account</span>
          {isLoading && (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
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
            <div id="googleSignInDiv" className="w-full"></div>
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
