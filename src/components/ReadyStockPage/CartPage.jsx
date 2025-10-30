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
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900">Cart</span>
            <span>›</span>
            <span>Checkout</span>
            <span>›</span>
            <span>Payment</span>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">Review your items and proceed to checkout</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-[#0071E0] rounded-full animate-spin"></div>
              <span className="text-base sm:text-lg font-medium">Loading cart...</span>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-24">
            <FontAwesomeIcon
              icon={faCartShopping}
              className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-6"
            />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items to get started</p>
            <button
              className="bg-[#0071E0] cursor-pointer text-white py-3 px-6 sm:px-8 rounded-lg font-medium hover:bg-[#005bb5] transition-all duration-200 shadow-sm hover:shadow-md"
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <img
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
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
                      <div className="flex justify-between items-start">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-all duration-200"
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="w-4 h-4"
                          />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="cartpageMedia flex items-center justify-between">
                        <div>
                          <div className="text-base sm:text-lg font-semibold text-gray-900">
                            {convertPrice(item.price)}
                          </div>
                          <div className="text-xs text-gray-500">Stock: {item.stockCount}</div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= item.moq}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:border-[#0071E0] hover:bg-[#0071E0]/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              if (!/^\d*$/.test(value)) return;
                              if (value === "") {
                                handleQuantityChange(item.id, "");
                                return;
                              }
                              let num = parseInt(value, 10);
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
                            className="w-16 text-center text-sm sm:text-base font-semibold py-2 px-2 border border-gray-200 rounded-md focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20"
                          />
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stockCount}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:border-[#0071E0] hover:bg-[#0071E0]/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FontAwesomeIcon
                              icon={faPlus}
                              className="w-3 h-3 text-gray-600"
                            />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Line total</span>
                          <span className="text-lg sm:text-xl font-bold text-gray-900">
                            {convertPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-max bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium text-gray-900">{convertPrice(totalPrice)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-medium text-gray-900">Free</span></div>
                <div className="pt-3 mt-1 border-t border-gray-100 flex justify-between text-base"><span className="font-semibold text-gray-900">Total</span><span className="font-bold text-gray-900">{convertPrice(totalPrice)}</span></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  className="flex-1 px-4 max-w-full sm:max-w-[110px] py-3 text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  onClick={handleClearCart}
                >
                  Clear Cart
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-[#0071E0] text-white rounded-lg font-medium hover:bg-[#0056B3] transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
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
    </main>
  );
};

export default CartPage;
