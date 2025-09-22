import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
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
        setError("No verification token provided");
        setIsLoading(false);
        return;
      }
      try {
        const res = await AuthService.verifyEmail(token);
        if (res.data && res.data.token) {
          localStorage.setItem("token", res.data.token);
          setSuccess(true);
          setTimeout(() => navigate("/dashboard"), 2000);
        } else {
          setError("Verification failed. Please try again.");
        }
      } catch (err) {
        setError(err.message || "Email verification failed. The link may be invalid or expired.");
      } finally {
        setIsLoading(false);
      }
    };
    verify();
  }, [token, navigate]);

  // Animation variants to match SignUpForm and LoginForm
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

  return (
    <div className="min-h-screen flex bg-white items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full space-y-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {isLoading ? (
          <motion.div variants={childVariants}>
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin text-indigo-600 text-4xl mb-4"
            />
            <p className="text-gray-700 text-lg">Verifying your email...</p>
          </motion.div>
        ) : success ? (
          <motion.div variants={childVariants}>
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="text-green-600 text-4xl mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified Successfully!
            </h1>
            <p className="text-gray-600 text-sm">
              Your account is now active. Redirecting to dashboard...
            </p>
            <Link
              to="/dashboard"
              className="mt-4 inline-block bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </motion.div>
        ) : (
          <motion.div variants={childVariants}>
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="text-red-600 text-4xl mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <div className="space-y-4">
              <Link
                to="/login"
                className="inline-block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Back to Login
              </Link>
              <p className="text-sm text-gray-600">
                Need a new verification link?{" "}
                <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Sign Up Again
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;