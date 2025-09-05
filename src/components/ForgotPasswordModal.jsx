import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faSpinner,
  faTimes,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const ForgotPasswordModal = ({ isOpen, onClose, onEmailSubmit }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      onEmailSubmit(email);
    }, 1500);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Subtle background animation for tech theme */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo and Title Section */}
        <motion.div className="text-center mb-8" variants={childVariants}>
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4 shadow-lg"
            variants={logoVariants}
          >
            <FontAwesomeIcon icon={faStore} className="text-white text-3xl" />
          </motion.div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            GSM Bidding
          </h2>
          <p className="text-gray-600 mt-2 font-medium">Reset your password</p>
        </motion.div>

        {/* Modal Box */}
        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 relative"
          variants={childVariants}
        >
          {/* Close Button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors duration-200"
            variants={childVariants}
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </motion.button>

          <div className="p-4">
            <motion.p
              className="text-gray-600 mb-6 text-center font-medium"
              variants={childVariants}
            >
              {isSubmitted
                ? "We've sent a password reset link to your email."
                : "Enter your email to receive a password reset link."}
            </motion.p>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div className="space-y-2" variants={childVariants}>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
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
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50/50"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium focus:ring-4 focus:ring-blue-300 transition-all duration-300 flex items-center justify-center shadow-md"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin mr-2"
                      />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </motion.button>
              </form>
            ) : (
              <motion.div className="text-center py-4" variants={childVariants}>
                <motion.button
                  onClick={onClose}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-md"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Close
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Add custom CSS for blob animation */}
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
    </div>
  );
};

export default ForgotPasswordModal;
