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
import iphoneImage from "../../assets/iphone.png";
import { convertPrice } from "../../utils/currencyUtils";

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [itemCountries, setItemCountries] = useState({}); // Track country selection per item
  const [itemLoading, setItemLoading] = useState({}); // Track loading state per item
  const [successMessage, setSuccessMessage] = useState(null); // Track success messages

  const handleImageError = (itemId) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  // Map backend cart item to frontend format
  const mapCartItemToUi = (item) => {
    const id = item.productId;
    const skuFamilyId = item.skuFamilyId?._id || item.productId; // Fallback to productId if skuFamilyId is missing
    const name = item.subSkuFamilyId?.name || item.skuFamilyId?.name || "Product";
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
    
    // Prioritize subSkuFamilyId image, then skuFamilyId image, then dummy image
    let imageUrl = null;
    if (item.subSkuFamilyId?.images?.[0]) {
      imageUrl = `${baseUrl}/${item.subSkuFamilyId.images[0]}`;
    } else if (item.skuFamilyId?.images?.[0]) {
      imageUrl = `${baseUrl}/${item.skuFamilyId.images[0]}`;
    } else {
      imageUrl = iphoneImage; // Use dummy image if no image available
    }
    
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

    const subSkuFamilyId = item.subSkuFamilyId?._id || item.subSkuFamilyId || null;
    return {
      id,
      skuFamilyId,
      subSkuFamilyId,
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
        // Trigger cart count update event (quantity change doesn't change count, but refresh anyway)
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cartUpdated', Date.now().toString());
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
        // Trigger cart count update event
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cartUpdated', Date.now().toString());
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
        // Trigger cart count update event
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cartUpdated', Date.now().toString());
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

  // Handle country change for a specific item
  const handleCountryChange = (itemId, country) => {
    setItemCountries((prev) => ({ ...prev, [itemId]: country }));
  };

  // Handle place order for a single product
  const handlePlaceOrderForItem = async (item) => {
    const country = itemCountries[item.id];
    
    if (!country) {
      setError("Please select a billing country for this product");
      return;
    }

    try {
      setError(null);
      setItemLoading((prev) => ({ ...prev, [item.id]: true }));

      // Create order with only this single product
      const orderData = {
        cartItems: [{
          productId: item.id,
          skuFamilyId: item.skuFamilyId || null,
          subSkuFamilyId: item.subSkuFamilyId || null,
          quantity: Number(item.quantity),
          price: Number(item.price),
        }],
        billingAddress: {
          country: country
        },
        shippingAddress: null,
      };

      const response = await OrderService.createOrder(orderData);

      if (response?.success || response?.status === 200) {
        // Remove this item from cart
        await CartService.remove(item.id);
        // Check if this was the last item before removing from state
        const remainingItems = cartItems.filter((cartItem) => cartItem.id !== item.id);
        // Remove from local state
        setCartItems((prevItems) => prevItems.filter((cartItem) => cartItem.id !== item.id));
        // Clear country selection for this item
        setItemCountries((prev) => {
          const updated = { ...prev };
          delete updated[item.id];
          return updated;
        });
        // Trigger cart count update event
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cartUpdated', Date.now().toString());
        // Show success message
        setSuccessMessage(`Order placed successfully for ${item.name}!`);
        setTimeout(() => setSuccessMessage(null), 5000);
        // If cart is now empty, navigate to order page
        if (remainingItems.length === 0) {
          navigate("/order", { state: { order: response.data } });
        }
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
      setItemLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Shopping Cart</h1>
          <p className="text-sm text-gray-600">Review your items and place orders</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-base font-medium text-gray-700">Loading cart...</p>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FontAwesomeIcon
              icon={faCartShopping}
              className="w-20 h-20 text-gray-300 mb-4 mx-auto"
            />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-sm text-gray-600 mb-6">Add items to your cart to get started</p>
            <button
              className="bg-blue-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              onClick={() => navigate("/ready-stock")}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="lg:flex justify-between gap-6">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 lg:w-[50%] mb-4 lg:mb-0">
                <div className="p-4 sm:p-5">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    {/* <div className="flex-shrink-0">
                      <img
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-gray-200"
                        src={
                          imageErrors[item.id]
                            ? iphoneImage
                            : item.imageUrl
                        }
                        alt={item.name}
                        onError={() => handleImageError(item.id)}
                      />
                    </div> */}

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      {/* Product Name and Remove */}
                      <div className="flex">
                                            {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        className="w-20 h-20 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-200"
                        src={
                          imageErrors[item.id]
                            ? iphoneImage
                            : item.imageUrl
                        }
                        alt={item.name}
                        onError={() => handleImageError(item.id)}
                      />
                    </div>
                      <div className="w-[100%] ps-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors duration-200 flex-shrink-0"
                            title="Remove item"
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="w-4 h-4"
                            />
                          </button>
                        </div>

                        {/* Price, Stock, Quantity and Total */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-1">
                          <div>
                            <div className="text-base flex items-center font-semibold text-gray-900">
                              {convertPrice(item.price)}
                            <div className="text-xs text-gray-500 ms-2">Stock: {item.stockCount}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-1">
                                                  <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= item.moq}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:border-blue-600 hover:bg-blue-50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Decrease"
                            >
                              <FontAwesomeIcon
                                icon={faMinus}
                                className="w-3 h-3 text-gray-700"
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
                              className="w-14 text-center text-sm font-semibold py-1.5 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                              disabled={item.quantity >= item.stockCount}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:border-blue-600 hover:bg-blue-50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Increase"
                            >
                              <FontAwesomeIcon
                                icon={faPlus}
                                className="w-3 h-3 text-gray-700"
                              />
                            </button>
                          </div>

                          <div className="ml-auto text-right">
                            <div className="text-xs text-gray-500 mb-0.5">Total</div>
                            <div className="text-lg font-bold text-gray-900">
                              {convertPrice(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>

                      {/* Country Selection and Place Order */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <label 
                              htmlFor={`billingCountry-${item.id}`} 
                              className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                              Billing Country <span className="text-red-500">*</span>
                            </label>
                            <select
                              id={`billingCountry-${item.id}`}
                              value={itemCountries[item.id] || ""}
                              onChange={(e) => handleCountryChange(item.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              required
                            >
                              <option value="">Select country</option>
                              <option value="hongkong">Hong Kong</option>
                              <option value="dubai">Dubai</option>
                            </select>
                          </div>
                          <div className="flex items-end w-full sm:w-[50%]">
                            <button
                              type="button"
                              onClick={() => handlePlaceOrderForItem(item)}
                              disabled={!itemCountries[item.id] || itemLoading[item.id]}
                              className="w-full sm:min-w-[140px] px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                            >
                              {itemLoading[item.id] ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Processing...
                                </span>
                              ) : (
                                'Place Order'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            

          </div>
        )}
            {/* Clear Cart Button */}
            {cartItems.length > 0 && (
              <div className="flex justify-end pt-2 mt-2">
                <button
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
                  onClick={handleClearCart}
                >
                  Clear All Cart
                </button>
              </div>
            )}
        </div>
    </main>
  );
};

export default CartPage;
