import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faSpinner, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { NegotiationService } from "../services/negotiation/negotiation.services";
import toastHelper from "../utils/toastHelper";

const ConfirmNegotiation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ConfirmNegotiation component mounted');
    console.log('Token from params:', token);
    
    // Extract token from params or hash (fallback for HashRouter)
    let actualToken = token;
    
    // If token from params is undefined or empty, try to extract from hash
    if (!actualToken || actualToken === 'undefined') {
      // Try to extract from hash (HashRouter stores route in hash)
      if (window.location.hash) {
        // Remove # and extract token
        const hashPath = window.location.hash.replace('#', '');
        const hashMatch = hashPath.match(/\/confirm-negotiation\/(.+)$/);
        if (hashMatch && hashMatch[1]) {
          actualToken = hashMatch[1];
          console.log('Extracted token from hash:', actualToken);
        }
      }
      // Try to extract from pathname (fallback)
      if ((!actualToken || actualToken === 'undefined') && window.location.pathname) {
        const pathMatch = window.location.pathname.match(/\/confirm-negotiation\/(.+)$/);
        if (pathMatch && pathMatch[1]) {
          actualToken = pathMatch[1];
          console.log('Extracted token from pathname:', actualToken);
        }
      }
    }
    
    if (!actualToken || actualToken === 'undefined') {
      console.error('No token found in params, hash, or pathname');
      setError('No confirmation token provided');
      setIsLoading(false);
      return;
    }
    
    // Clean token (remove any query params or fragments)
    actualToken = actualToken.split('?')[0].split('#')[0];
    
    // Decode token if it's URL encoded (it might be double-encoded)
    try {
      actualToken = decodeURIComponent(actualToken);
    } catch (e) {
      // Token might not be encoded, use as-is
      console.log('Token is not URL encoded, using as-is');
    }

    const confirmNegotiation = async () => {
      try {
        console.log('Calling confirmNegotiation with token:', actualToken);
        const result = await NegotiationService.confirmNegotiation(actualToken);
        setIsConfirmed(true);
        if (result.order) {
          toastHelper.showTost('Negotiation confirmed successfully! Your order has been placed automatically.', 'success');
        } else {
          toastHelper.showTost('Negotiation confirmed successfully! Admin will proceed to place your order.', 'success');
        }
      } catch (err) {
        console.error('Error confirming negotiation:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to confirm negotiation';
        setError(errorMessage);
        toastHelper.showTost(errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    confirmNegotiation();
  }, [token, location]);

  const handleGoToHome = () => {
    navigate('/home', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-600 text-4xl mb-4" />
          <p className="text-gray-700 text-lg">Confirming negotiation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600 text-6xl mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmation Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleGoToHome}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-6xl mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Negotiation Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your negotiation has been confirmed successfully. Your order has been placed automatically and is now being processed.
          </p>
          <button
            onClick={handleGoToHome}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading state if component renders but token is still being extracted
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-600 text-4xl mb-4" />
        <p className="text-gray-700 text-lg">Loading confirmation page...</p>
      </div>
    </div>
  );
};

export default ConfirmNegotiation;

