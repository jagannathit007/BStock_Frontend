import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faSpinner,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { PRIMARY_COLOR, PRIMARY_COLOR_DARK, PRIMARY_COLOR_LIGHT } from "../utils/colors";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[120] p-4" style={{ background: `linear-gradient(to bottom right, #f9fafb, ${PRIMARY_COLOR_LIGHT})` }}>
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg mb-3 sm:mb-4" style={{ background: `linear-gradient(to bottom right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
            Reset your password
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Modal Box */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-xl border border-white/20 p-3 sm:p-4 lg:p-5 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>

          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              {isSubmitted
                ? "We've sent a password reset link to your email. Please check your inbox."
                : "Enter your email address and we'll send you a link to reset your password."}
            </p>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-5">
                <div className="space-y-1 sm:space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-semibold text-gray-800"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        style={{ color: 'inherit' }}
                        className="text-gray-400 transition-colors text-sm"
                        onFocus={(e) => e.target.style.color = PRIMARY_COLOR}
                        onBlur={(e) => e.target.style.color = ''}
                      />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-1.5 sm:py-2 border-2 rounded-lg transition-all duration-300 bg-gray-50/50 text-gray-900 placeholder-gray-500 focus:bg-white text-sm sm:text-sm border-gray-200"
                      onFocus={(e) => { e.target.style.borderColor = PRIMARY_COLOR; e.target.style.boxShadow = `0 0 0 4px ${PRIMARY_COLOR}33`; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white cursor-pointer py-1 sm:py-2 px-6 rounded-lg font-semibold text-sm sm:text-sm flex items-center justify-center disabled:opacity-70 shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ background: `linear-gradient(to right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}
                  onMouseEnter={(e) => e.target.style.background = `linear-gradient(to right, ${PRIMARY_COLOR_DARK}, ${PRIMARY_COLOR_DARK})`}
                  onMouseLeave={(e) => e.target.style.background = `linear-gradient(to right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})`}
                  onFocus={(e) => e.target.style.boxShadow = `0 0 0 4px ${PRIMARY_COLOR}33`}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin h-5 w-5 text-white"
                      />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                  <p className="font-medium">Email sent successfully!</p>
                  <p className="mt-1 text-xs">Check your inbox for the password reset link.</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full text-white py-1 sm:py-2 px-6 rounded-lg font-semibold text-sm sm:text-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                  style={{ background: `linear-gradient(to right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}
                  onMouseEnter={(e) => e.target.style.background = `linear-gradient(to right, ${PRIMARY_COLOR_DARK}, ${PRIMARY_COLOR_DARK})`}
                  onMouseLeave={(e) => e.target.style.background = `linear-gradient(to right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})`}
                  onFocus={(e) => e.target.style.boxShadow = `0 0 0 4px ${PRIMARY_COLOR}33`}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
