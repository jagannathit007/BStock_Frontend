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
        const res = await AuthService.verifyEmail(token);
        if (res.data && res.data.token) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("isLoggedIn", "true");
          setSuccess(true);
          // Redirect after 2 seconds
          setTimeout(() => navigate("/"), 1500);
        } else {
          setError("Verification failed. Please try again.");
        }
      } catch (err) {
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
            <p className="text-gray-600 mb-6">Your account is now active. Redirecting to home...</p>
            <Link
              to="/"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Go to Home
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