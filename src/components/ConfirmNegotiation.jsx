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
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Address form state
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    country: '',
    city: ''
  });
  const [billingAddress, setBillingAddress] = useState({
    address: '',
    country: '',
    city: ''
  });
  const [useSameAddress, setUseSameAddress] = useState(true);
  
  const countries = ['Hong Kong', 'Dubai'];

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

    // Just validate token and show address form
    setIsLoading(false);
    setShowAddressForm(true);
  }, [token, location]);

  const handleGoToHome = () => {
    navigate('/home', { replace: true });
  };

  const handleAddressChange = (type, field, value) => {
    if (type === 'shipping') {
      setShippingAddress(prev => ({ ...prev, [field]: value }));
      if (useSameAddress) {
        setBillingAddress(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleUseSameAddressChange = (checked) => {
    setUseSameAddress(checked);
    if (checked) {
      setBillingAddress({ ...shippingAddress });
    }
  };

  const validateAddress = (address) => {
    return address.address && address.country && address.city;
  };

  const handleSubmitAddresses = async () => {
    // Validate shipping address
    if (!validateAddress(shippingAddress)) {
      toastHelper.showTost('Please fill in all shipping address fields', 'error');
      return;
    }

    // Validate billing address
    if (!validateAddress(billingAddress)) {
      toastHelper.showTost('Please fill in all billing address fields', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Extract token
      let actualToken = token;
      if (!actualToken || actualToken === 'undefined') {
        if (window.location.hash) {
          const hashPath = window.location.hash.replace('#', '');
          const hashMatch = hashPath.match(/\/confirm-negotiation\/(.+)$/);
          if (hashMatch && hashMatch[1]) {
            actualToken = hashMatch[1];
          }
        }
        if ((!actualToken || actualToken === 'undefined') && window.location.pathname) {
          const pathMatch = window.location.pathname.match(/\/confirm-negotiation\/(.+)$/);
          if (pathMatch && pathMatch[1]) {
            actualToken = pathMatch[1];
          }
        }
      }
      
      if (!actualToken || actualToken === 'undefined') {
        throw new Error('No confirmation token provided');
      }

      actualToken = actualToken.split('?')[0].split('#')[0];
      try {
        actualToken = decodeURIComponent(actualToken);
      } catch (e) {
        // Token might not be encoded, use as-is
      }

      console.log('Calling confirmNegotiation with token and addresses:', actualToken);
      const result = await NegotiationService.confirmNegotiation(actualToken, shippingAddress, billingAddress);
      setIsConfirmed(true);
      setShowAddressForm(false);
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
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-600 text-4xl mb-4" />
          <p className="text-gray-700 text-lg">Loading confirmation page...</p>
        </div>
      </div>
    );
  }

  if (showAddressForm && !isConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirm Negotiation</h1>
            <p className="text-gray-600 mb-6">
              Please provide your shipping and billing addresses to complete the order confirmation.
            </p>

            {/* Shipping Address */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    value={shippingAddress.address}
                    onChange={(e) => handleAddressChange('shipping', 'address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <select
                    value={shippingAddress.country}
                    onChange={(e) => handleAddressChange('shipping', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Use Same Address Checkbox */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useSameAddress}
                  onChange={(e) => handleUseSameAddressChange(e.target.checked)}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Use same address for billing</span>
              </label>
            </div>

            {/* Billing Address */}
            {!useSameAddress && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Billing Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input
                      type="text"
                      value={billingAddress.address}
                      onChange={(e) => handleAddressChange('billing', 'address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <select
                      value={billingAddress.country}
                      onChange={(e) => handleAddressChange('billing', 'country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={billingAddress.city}
                      onChange={(e) => handleAddressChange('billing', 'city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleGoToHome}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAddresses}
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Confirming...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </button>
            </div>
          </div>
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


