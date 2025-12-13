import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faSpinner, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { OrderService } from "../services/order/order.services";
import toastHelper from "../utils/toastHelper";

const ConfirmOrderModification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ConfirmOrderModification component mounted');
    console.log('Token from params:', token);
    console.log('Location:', location);
    console.log('Current URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    console.log('Pathname:', window.location.pathname);
    
    // Extract token from params or hash (fallback for HashRouter)
    let actualToken = token;
    if (!actualToken) {
      // Try to extract from hash
      if (window.location.hash) {
        const hashMatch = window.location.hash.match(/\/confirm-order-modification\/([^\/\?]+)/);
        if (hashMatch && hashMatch[1]) {
          actualToken = hashMatch[1];
          console.log('Extracted token from hash:', actualToken);
        }
      }
      // Try to extract from pathname
      if (!actualToken && window.location.pathname) {
        const pathMatch = window.location.pathname.match(/\/confirm-order-modification\/([^\/\?]+)/);
        if (pathMatch && pathMatch[1]) {
          actualToken = pathMatch[1];
          console.log('Extracted token from pathname:', actualToken);
        }
      }
    }
    
    if (!actualToken) {
      console.error('No token found in params, hash, or pathname');
      setError('No confirmation token provided');
      setIsLoading(false);
      return;
    }

    const confirmModification = async () => {
      try {
        console.log('Calling confirmOrderModification with token:', actualToken);
        await OrderService.confirmOrderModification(actualToken);
        setIsConfirmed(true);
        toastHelper.showTost('Order modification confirmed successfully!', 'success');
      } catch (err) {
        console.error('Error confirming order modification:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to confirm order modification';
        setError(errorMessage);
        toastHelper.showTost(errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    confirmModification();
  }, [token, location]);

  const handleGoToOrders = () => {
    navigate('/order', { replace: true });
  };

  const handleGoToHome = () => {
    navigate('/home', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-600 text-4xl mb-4" />
          <p className="text-gray-700 text-lg">Confirming order modification...</p>
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
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleGoToHome}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={handleGoToOrders}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-6xl mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Modification Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your order modification has been confirmed successfully. The admin will now proceed with verifying your order.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleGoToHome}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={handleGoToOrders}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              View Orders
            </button>
          </div>
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

export default ConfirmOrderModification;

