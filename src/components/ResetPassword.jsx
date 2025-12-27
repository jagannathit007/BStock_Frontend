import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faSpinner, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { AuthService } from "../services/auth/auth.services";
import { PRIMARY_COLOR, PRIMARY_COLOR_DARK } from "../utils/colors";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.resetPassword(token, newPassword);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md p-6">
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-6xl mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successfully!</h1>
          <p className="text-gray-600 mb-6">Your password has been reset. Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl shadow-lg mb-4" style={{ background: `linear-gradient(to bottom right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}>
            <FontAwesomeIcon icon={faLock} className="text-white text-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
          <p className="text-sm text-gray-600">Enter your new password below</p>
        </div>

        {/* Form Box */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-800 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400 text-sm" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border-2 rounded-lg transition-all duration-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-white text-sm border-gray-200 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors z-20 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  <FontAwesomeIcon 
                    icon={showPassword ? faEyeSlash : faEye} 
                    className="text-sm" 
                  />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400 text-sm" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border-2 rounded-lg transition-all duration-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-white text-sm border-gray-200 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors z-20 cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  <FontAwesomeIcon 
                    icon={showConfirmPassword ? faEyeSlash : faEye} 
                    className="text-sm" 
                  />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white py-2 px-6 rounded-lg font-semibold text-sm flex items-center justify-center disabled:opacity-70 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ background: `linear-gradient(to right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin h-5 w-5 text-white" />
                  <span>Resetting Password...</span>
                </div>
              ) : (
                <span>Set New Password</span>
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleGoToLogin}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

