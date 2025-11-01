import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCheckCircle, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { AuthService } from "../services/auth/auth.services";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError("Invalid verification link");
        setIsLoading(false);
        return;
      }

      try {
        // Clear any existing auth data FIRST before verification to prevent auto-login
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        
        const res = await AuthService.verifyEmail(token);
        // Check if verification was successful (response structure: res.data.data)
        const responseData = res?.data?.data || res?.data;
        if (res?.data?.status === 200 || responseData) {
          setSuccess(true);
          // Ensure localStorage is completely cleared (do it again to be safe)
          localStorage.clear();
          // Dispatch event to reset login state globally
          window.dispatchEvent(new Event('loginStateChanged'));
          // Redirect to login page after 2 seconds - use replace to prevent back navigation
          setTimeout(() => {
            // Use window.location for a hard redirect to ensure clean state
            window.location.href = window.location.origin + window.location.pathname + '#/login';
          }, 2000);
        } else {
          setError("Verification failed. Please try again.");
        }
      } catch (err) {
        // Even on error, ensure we're not logged in
        localStorage.clear();
        window.dispatchEvent(new Event('loginStateChanged'));
        setError(err.message || "Verification failed. The link may be invalid or expired.");
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [token, navigate]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-600 text-4xl mb-4" />
          <p className="text-gray-700 text-lg">Verifying your email...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div
        className="text-center max-w-md p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {success ? (
          <>
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-6xl mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified Successfully!</h1>
            <p className="text-gray-600 mb-6">Your account is now active. Redirecting to login page...</p>
            <Link
              to="/login"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-6xl mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-4">
              <Link
                to="/login"
                className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium text-center hover:bg-indigo-700 transition-colors"
              >
                Back to Login
              </Link>
              <p className="text-sm text-gray-500">
                Didn't receive the email?{" "}
                <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Resend Verification
                </Link>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;