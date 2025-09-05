import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faSpinner,
  faShieldHalved,
  faMobileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);

  useEffect(() => {
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

        // Optional: Show One Tap UI
        google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkipped()) {
            // Try next time or use fallback
          }
        });
      }
    }
  };

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setError("");
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
        console.log("Google login successful", userData);
        setGoogleLoading(false);
        // Redirect or update state as needed
      }, 1500);
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Google login failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    console.log({ email, password, rememberMe });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle successful login or show error
    }, 2000);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleForgotPassword = () => {
    setShowLoginForm(false);
    setShowForgotPasswordModal(true);
  };

  const handleCloseModal = () => {
    setShowForgotPasswordModal(false);
    setShowLoginForm(true);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, staggerChildren: 0.2 },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {showLoginForm && (
          <motion.div
            className="max-w-md w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo */}
            <motion.div className="text-center mb-8" variants={childVariants}>
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4 shadow-lg"
                variants={logoVariants}
              >
                <FontAwesomeIcon
                  icon={faMobileAlt}
                  className="text-white text-3xl"
                />
              </motion.div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                GSM Bidding
              </h1>
              <p className="text-gray-600 mt-2 font-medium">
                Unlock the best deals on premium phones
              </p>
            </motion.div>

            {/* Card */}
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100"
              variants={childVariants}
            >
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email */}
                <motion.div className="space-y-2" variants={childVariants}>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div className="space-y-2" variants={childVariants}>
                  <label className="block text-sm font-medium text-gray-700">
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        className="text-gray-400 hover:text-blue-600"
                      />
                    </button>
                  </div>
                </motion.div>

                {/* Remember & Forgot */}
                <motion.div
                  className="flex items-center justify-between"
                  variants={childVariants}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <span
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    Forgot password?
                  </span>
                </motion.div>

                {/* Sign In Button */}
                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium focus:ring-4 focus:ring-blue-300 flex items-center justify-center shadow-md"
                  disabled={isLoading}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <span className={isLoading ? "mr-2" : ""}>Sign In</span>
                  {isLoading && (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                  )}
                </motion.button>

                {/* Divider */}
                <motion.div className="relative my-6" variants={childVariants}>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500 font-medium">
                      Or continue with
                    </span>
                  </div>
                </motion.div>

                {/* Google Sign-In */}
                <div id="googleSignInDiv" className="w-full">
                  {googleLoading && (
                    <div className="flex justify-center items-center py-3">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin text-blue-600 mr-2"
                      />
                      <span>Signing in with Google...</span>
                    </div>
                  )}
                </div>
              </form>

              {/* Sign Up */}
              <motion.div className="mt-8 text-center" variants={childVariants}>
                <p className="text-gray-600 font-medium">
                  Don't have an account?
                  <Link
                    to="/signup"
                    className="text-blue-600 hover:text-blue-800 font-semibold ml-1"
                  >
                    Create business account
                  </Link>
                </p>
              </motion.div>
            </motion.div>

            {/* Security */}
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
        )}

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={showForgotPasswordModal}
          onClose={handleCloseModal}
          onEmailSubmit={(email) => {
            console.log("Password reset requested for:", email);
            handleCloseModal();
          }}
        />
      </div>

      {/* Blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
};

export default LoginForm;
