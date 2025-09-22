import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faTimes,
  faEnvelope,
  faPhone,
  faCheck,
  faExclamationTriangle,
  faSpinner,
  faCalendarXmark,
} from "@fortawesome/free-solid-svg-icons";
import { ProductService } from "../../services/products/products.services";

const NotifyMePopup = ({ product, onClose }) => {
  const { id, name, imageUrl, expiryTime, isExpired } = product;

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  // Check if product is expired to prevent notification creation
  const productExpired = isExpired || (expiryTime && new Date(expiryTime) < new Date());

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phone.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if product is expired
    if (productExpired) {
      setError("Cannot create notification for expired products");
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const notificationData = {
        productId: id,
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
      };

      await ProductService.createNotification(notificationData);
      setIsSuccess(true);

      // Auto close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || "Failed to set up notification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show success state
  if (isSuccess) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon
                icon={faCheck}
                className="w-8 h-8 text-green-600"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Notification Set!
            </h2>
            <p className="text-gray-600 mb-6">
              We'll notify you as soon as <span className="font-medium">{name}</span> is back in stock.
            </p>
            <button
              className="w-full bg-[#0071E0] hover:bg-[#005bb5] text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              onClick={onClose}
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show expired product warning
  if (productExpired) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon
                icon={faCalendarXmark}
                className="w-8 h-8 text-red-600"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Product Expired
            </h2>
            <p className="text-gray-600 mb-6">
              Sorry, <span className="font-medium">{name}</span> has expired and is no longer available for notifications.
            </p>
            <button
              className="w-full bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 hover:scale-[1.01]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
              <FontAwesomeIcon
                icon={faBell}
                className="w-5 h-5 text-yellow-600"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Notify Me
            </h2>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-shrink-0">
              <img
                className="w-20 h-20 object-cover rounded-xl shadow-sm border border-gray-100"
                src={imageUrl || "https://via.placeholder.com/80"}
                alt={name || "Product"}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
                {name || "Unnamed Product"}
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm w-fit">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3" />
                Currently Out of Stock
              </div>
              {expiryTime && (
                <div className="text-xs text-gray-500 mt-2">
                  Expires: {new Date(expiryTime).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <FontAwesomeIcon icon={faBell} className="mr-2" />
              We'll send you an email and SMS (if provided) as soon as this product is back in stock.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all duration-200 ${
                    errors.email
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all duration-200 ${
                    errors.phone
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading || productExpired}
                className="flex-1 bg-[#0071E0] hover:bg-[#005bb5] disabled:bg-gray-300 text-white py-3 px-5 rounded-lg font-medium text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faBell} />
                    Notify Me
                  </>
                )}
              </button>

              <button
                type="button"
                className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium text-base hover:bg-gray-100 transition-all duration-200"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotifyMePopup;