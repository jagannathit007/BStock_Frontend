import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { AuthService } from "../services/auth/auth.services";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    console.log('VerifyEmail component mounted, token from params:', token);
    
    if (!token) {
      console.log('No token found, stopping verification');
      setIsLoading(false);
      return;
    }

    const verifyEmail = async () => {
      console.log('Starting verification for token:', token);
      try {
        console.log('Calling AuthService.verifyEmail...');
        await AuthService.verifyEmail(token);
        console.log('Verification successful');
        setIsVerified(true);
      } catch (error) {
        console.error("Verification error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-600 text-4xl mb-4" />
          <p className="text-gray-700 text-lg">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md p-6">
        <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-6xl mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified Successfully!</h1>
        <p className="text-gray-600 mb-6">Your email has been verified. You can now log in to your account.</p>
        <button
          onClick={handleGoToLogin}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
