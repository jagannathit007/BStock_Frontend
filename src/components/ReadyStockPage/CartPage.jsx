import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faPlus,
  faMinus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons"; // Corrected import
import { useNavigate } from "react-router-dom";
import CartService from "../../services/cart/cart.services";
import OrderService from "../../services/order/order.services";
import PaymentService from "../../services/payment/payment.services";
import PaymentPopup from "../PaymentPopup";
import iphoneImage from "../../assets/iphone.png";
import { convertPrice } from "../../utils/currencyUtils";

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
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
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (itemId) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  // Map backend cart item to frontend format
  const mapCartItemToUi = (item) => {
    const id = item.productId;
    const skuFamilyId = item.skuFamilyId?._id || item.productId; // Fallback to productId if skuFamilyId is missing
    const name = item.skuFamilyId?.name || "Product";
    const imageUrl =
      item.skuFamilyId?.images?.[0] ||
      "https://via.placeholder.com/400x300.png?text=Product";
    const storage = item.storage || "";
    const color = item.color || "";
    const description =
      [storage, color].filter(Boolean).join(" • ") || item.specification || "";
    const price = Number(item.price) || 0;
    const stockCount = Number(item.stock) || 0;
    const moq = Number(item.moq) || 1;
    const stockStatus =
      stockCount <= 0
        ? "Out of Stock"
        : stockCount <= 10
        ? "Low Stock"
        : "In Stock";

    return {
      id,
      skuFamilyId,
      name,
      description,
      price,
      moq,
      stockCount,
      stockStatus,
      imageUrl,
      quantity: Number(item.quantity) || Math.max(moq, 1),
    };
  };

  // Fetch cart items
  const fetchCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await CartService.list(1, 10);
      if (response.status === 200) {
        const items = (response.data?.docs || []).map(mapCartItemToUi);
        setCartItems(items);
      } else {
        setError(response.message || "Failed to fetch cart");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while fetching cart"
      );
      console.error("Fetch cart error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Handle quantity change
  const handleQuantityChange = async (id, newQuantity) => {
    try {
      setError(null);
      const item = cartItems.find((item) => item.id === id);
      if (!item) return;

      const minQty = 1;
      const maxQty = Number(item.stockCount) || Infinity;
      const clampedQty = Math.min(
        Math.max(Number(newQuantity) || minQty, minQty),
        maxQty
      );

      if (clampedQty === item.quantity) return;

      const response = await CartService.updateQuantity(id, clampedQty);

      if (response?.success || response?.status === 200) {
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.id === id ? { ...item, quantity: clampedQty } : item
          )
        );
      } else {
        setError(response?.message || "Failed to update quantity");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while updating quantity"
      );
      console.error("Update quantity error:", error);
    }
  };

  // Remove item from cart
  const handleRemoveItem = async (id) => {
    try {
      setError(null);
      const response = await CartService.remove(id);
      if (response?.success || response?.status === 200) {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
      } else {
        setError(response?.message || "Failed to remove item");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while removing item"
      );
      console.error("Remove item error:", error);
    }
  };

  // Clear cart
  const handleClearCart = async () => {
    try {
      setError(null);
      const response = await CartService.clear();
      if (response?.success || response?.status === 200) {
        setCartItems([]);
      } else {
        setError(response?.message || "Failed to clear cart");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while clearing cart"
      );
      console.error("Clear cart error:", error);
    }
  };

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

  // Handle address validation and show payment popup
  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!validateAddresses()) {
      setError("Please fill in all address fields");
      return;
    }
    if (cartItems.length === 0) {
      setError("Cannot place an order with an empty cart");
      return;
    }

    // Prepare order data for payment popup (without creating order yet)
    setCurrentOrder({
      orderId: null, // Will be created after payment
      totalAmount: totalPrice,
      orderNumber: null,
      cartItems: cartItems.map((item) => ({
        productId: item.id,
        skuFamilyId: item.skuFamilyId,
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
      billingAddress,
      shippingAddress,
    });
    
    // Close checkout form and show payment popup
    setShowCheckoutForm(false);
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
        setCartItems([]);
        setShowPaymentPopup(false);
        setCurrentOrder(null);
        navigate("/order", { state: { order: response.data } });
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
        setCartItems([]);
        setShowPaymentPopup(false);
        setCurrentOrder(null);
        navigate("/order", { state: { order: response.data } });
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
  const totalPrice = cartItems
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="text-center py-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight animate-fadeIn">
              Shopping Cart
            </h1>
            <p className="text-xl text-gray-600 mt-4 animate-slideUp animate-stagger-1">Review your items and proceed to checkout</p>
          </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center space-x-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-lg font-medium">Loading cart...</span>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-20">
            <FontAwesomeIcon
              icon={faCartShopping}
              className="w-20 h-20 text-gray-400 mb-6 animate-float"
            />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-lg text-gray-600 mb-8">Add some items to get started</p>
            <button
              className="bg-[#0071E0] cursor-pointer text-white py-3 px-8 rounded-lg font-medium hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <img
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl"
                        src={
                          imageErrors[item.id]
                            ? iphoneImage
                            : item.imageUrl
                        }
                        alt={item.name}
                        onError={() => handleImageError(item.id)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="w-4 h-4"
                          />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-gray-900">
                          {convertPrice(item.price)}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= item.moq}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-[#0071E0] hover:bg-[#0071E0]/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FontAwesomeIcon
                              icon={faMinus}
                              className="w-3 h-3 text-gray-600"
                            />
                          </button>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = e.target.value;

                              // Allow only digits
                              if (!/^\d*$/.test(value)) return;

                              // If empty, don't update immediately (let user type)
                              if (value === "") {
                                handleQuantityChange(item.id, "");
                                return;
                              }

                              let num = parseInt(value, 10);

                              // Apply conditions
                              if (isNaN(num) || num < item.moq) {
                                num = item.moq;
                              } else if (num > item.stockCount) {
                                num = item.stockCount;
                              }

                              handleQuantityChange(item.id, num);
                            }}
                            onBlur={(e) => {
                              let num = parseInt(e.target.value, 10);
                              if (isNaN(num) || num < item.moq) num = item.moq;
                              if (num > item.stockCount) num = item.stockCount;
                              handleQuantityChange(item.id, num);
                            }}
                            className="w-16 text-center text-base font-semibold py-2 px-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20"
                          />
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stockCount}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-[#0071E0] hover:bg-[#0071E0]/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FontAwesomeIcon
                              icon={faPlus}
                              className="w-3 h-3 text-gray-600"
                            />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total</span>
                          <span className="text-xl font-bold text-gray-900">
                            {convertPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-4 border-b border-gray-100">
                  <span className="text-lg font-medium text-gray-900">Subtotal</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {convertPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-100">
                  <span className="text-lg font-medium text-gray-900">Shipping</span>
                  <span className="text-lg font-semibold text-gray-900">Free</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-xl font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {convertPrice(totalPrice)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  className="flex-1 px-6 py-3 text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  onClick={handleClearCart}
                >
                  Clear Cart
                </button>
                <button
                  className="flex-1 px-6 py-3 bg-[#0071E0] text-white rounded-xl font-medium hover:bg-[#0056B3] transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={() => setShowCheckoutForm(true)}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>

            {showCheckoutForm && (
              <div className="fixed inset-0 bg-[#00000057] bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Checkout
                    </h2>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setShowCheckoutForm(false)}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  {/* Order Summary Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-4">
                      Order Summary
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex items-center">
                            <img
                              className="w-12 h-12 object-cover rounded-lg mr-4"
                              src={
                                imageErrors[item.id]
                                  ? iphoneImage
                                  : item.imageUrl
                              }
                              alt={item.name}
                              onError={() => handleImageError(item.id)}
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {convertPrice(item.price * item.quantity)}
                            </p>
                            <p className="text-xs text-gray-600">
                              ({convertPrice(item.price)} x {item.quantity})
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                        <p className="text-lg font-medium text-gray-700">
                          Total:
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {convertPrice(totalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address Form */}
                  <form
                    onSubmit={handleAddPayment}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        Billing Address
                      </h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Address (e.g., 123 Main St, Apt 4B)"
                          value={billingAddress.address}
                          onChange={(e) =>
                            handleAddressChange(
                              "billing",
                              "address",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={billingAddress.city}
                          onChange={(e) =>
                            handleAddressChange(
                              "billing",
                              "city",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={billingAddress.postalCode}
                          onChange={(e) =>
                            handleAddressChange(
                              "billing",
                              "postalCode",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        />
                        <select
                          value={billingAddress.country}
                          onChange={(e) =>
                            handleAddressChange(
                              "billing",
                              "country",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value="">Select Country</option>
                          <option value="Hongkong">Hongkong</option>
                          <option value="Dubai">Dubai</option>
                          <option value="Singapore">Singapore</option>
                          <option value="India">India</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        Shipping Address
                      </h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Address (e.g., 123 Main St, Apt 4B)"
                          value={shippingAddress.address}
                          onChange={(e) =>
                            handleAddressChange(
                              "shipping",
                              "address",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={shippingAddress.city}
                          onChange={(e) =>
                            handleAddressChange(
                              "shipping",
                              "city",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
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
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        />
                        <select
                          value={shippingAddress.country}
                          onChange={(e) =>
                            handleAddressChange(
                              "shipping",
                              "country",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value="">Select Country</option>
                          <option value="Hongkong">Hongkong</option>
                          <option value="Dubai">Dubai</option>
                          <option value="Singapore">Singapore</option>
                          <option value="India">India</option>
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3">
                      <button
                        type="button"
                        className="bg-gray-500 cursor-pointer text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-all duration-200"
                        onClick={() => setShowCheckoutForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="min-w-[160px] bg-[#0071E0] cursor-pointer text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center"
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
                          "Add Payment"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

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
      </div>
    </main>
  );
};

export default CartPage;
