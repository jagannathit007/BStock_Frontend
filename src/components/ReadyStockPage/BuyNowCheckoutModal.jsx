import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";
import OrderService from "../../services/order/order.services";
import PaymentService from "../../services/payment/payment.services";
import PaymentPopup from "../PaymentPopup";
import iphoneImage from "../../assets/iphone.png";
import { convertPrice } from "../../utils/currencyUtils";

const BuyNowCheckoutModal = ({
  isOpen,
  onClose,
  product,
  quantity,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [billingAddress, setBillingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  // Handle address input changes
  const handleAddressChange = (type, field, value) => {
    if (type === "billing") {
      setBillingAddress((prev) => ({ ...prev, [field]: value }));
    } else {
      setShippingAddress((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Validate addresses
  const validateAddresses = () => {
    const requiredFields = ["address", "city", "postalCode", "country"];
    for (const field of requiredFields) {
      if (!billingAddress[field] || !shippingAddress[field]) {
        return false;
      }
    }
    return true;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Handle address validation and show payment popup
  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!validateAddresses()) {
      setError("Please fill in all address fields");
      return;
    }

    // Prepare order data for payment popup (without creating order yet)
    setCurrentOrder({
      orderId: null, // Will be created after payment
      totalAmount: totalPrice,
      orderNumber: null,
      cartItems: [
        {
          productId: product.id,
          skuFamilyId: product.id, // Using product ID as skuFamilyId fallback
          quantity: Number(quantity),
          price: Number(product.price),
        },
      ],
      billingAddress,
      shippingAddress,
    });
    
    // Close checkout modal and show payment popup
    onClose();
    setShowPaymentPopup(true);
  };

  // Handle final order creation after payment
  const handleFinalOrderCreation = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Create order with payment details included
      const orderData = {
        cartItems: currentOrder.cartItems,
        billingAddress: currentOrder.billingAddress,
        shippingAddress: currentOrder.shippingAddress,
        paymentDetails: currentOrder.paymentDetails,
      };

      const response = await OrderService.createOrder(orderData);

      if (response?.success || response?.status === 200) {
        setShowPaymentPopup(false);
        setCurrentOrder(null);
        onSuccess && onSuccess();
      } else {
        setError(response?.message || "Failed to create order");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.map((e) => e.message).join(", ") ||
        error.response?.data?.message ||
        "An error occurred while creating order";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle final order creation with data directly (to avoid state timing issues)
  const handleFinalOrderCreationWithData = async (orderDataWithPayment) => {
    try {
      setError(null);
      setIsLoading(true);

      // Create order with payment details included
      const orderData = {
        cartItems: orderDataWithPayment.cartItems,
        billingAddress: orderDataWithPayment.billingAddress,
        shippingAddress: orderDataWithPayment.shippingAddress,
        paymentDetails: orderDataWithPayment.paymentDetails,
      };

      const response = await OrderService.createOrder(orderData);

      if (response?.success || response?.status === 200) {
        setShowPaymentPopup(false);
        setCurrentOrder(null);
        onSuccess && onSuccess();
      } else {
        setError(response?.message || "Failed to create order");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.map((e) => e.message).join(", ") ||
        error.response?.data?.message ||
        "An error occurred while creating order";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment success - now creates the actual order
  const handlePaymentSuccess = (updatedOrderData) => {
    if (updatedOrderData) {
      // Update current order with payment details
      setCurrentOrder(updatedOrderData);
      
      // Call final order creation with the updated data directly
      handleFinalOrderCreationWithData(updatedOrderData);
    }
  };

  // Calculate total price
  const totalPrice = product.price * quantity;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 transition-opacity duration-300 p-4">
      {" "}
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Buy Now - Checkout
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Order Summary
            </h3>
            <div className="flex items-center space-x-4">
              <img
                className="w-16 h-16 object-cover rounded-lg"
                src={
                  imageError
                    ? iphoneImage
                    : product.imageUrl || product.mainImage || iphoneImage
                }
                alt={product.name}
                onError={handleImageError}
              />
              <div className="flex-1">
                <h4 className="text-base font-medium text-gray-900">
                  {product.name}
                </h4>
                <p className="text-sm text-gray-600">{product.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-600">
                    Quantity: {quantity}
                  </span>
                  <span className="text-sm text-gray-600">
                    Price: {convertPrice(product.price)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {convertPrice(totalPrice)}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Checkout Form */}
          <form
            onSubmit={handleAddPayment}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Billing Address
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Address (e.g., 123 Main St, Apt 4B)"
                  value={billingAddress.address}
                  onChange={(e) =>
                    handleAddressChange("billing", "address", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={billingAddress.city}
                  onChange={(e) =>
                    handleAddressChange("billing", "city", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={billingAddress.postalCode}
                  onChange={(e) =>
                    handleAddressChange("billing", "postalCode", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={billingAddress.country}
                  onChange={(e) =>
                    handleAddressChange("billing", "country", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Shipping Address
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Address (e.g., 123 Main St, Apt 4B)"
                  value={shippingAddress.address}
                  onChange={(e) =>
                    handleAddressChange("shipping", "address", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={shippingAddress.city}
                  onChange={(e) =>
                    handleAddressChange("shipping", "city", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={shippingAddress.postalCode}
                  onChange={(e) =>
                    handleAddressChange(
                      "shipping",
                      "postalCode",
                      e.target.value
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={shippingAddress.country}
                  onChange={(e) =>
                    handleAddressChange("shipping", "country", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            className="bg-gray-500 cursor-pointer text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-all duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-w-[160px] bg-[#0071E0] cursor-pointer text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 
           0 5.373 0 12h4zm2 5.291A7.962 
           7.962 0 014 12H0c0 3.042 1.135 
           5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Add Payment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payment Popup */}
      {showPaymentPopup && currentOrder && (
        <PaymentPopup
          isOpen={showPaymentPopup}
          onClose={() => setShowPaymentPopup(false)}
          orderData={currentOrder}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default BuyNowCheckoutModal;
