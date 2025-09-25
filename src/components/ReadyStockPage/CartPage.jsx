import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faPlus, faMinus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import CartService from "../../services/cart/cart.services";
import OrderService from "../../services/order/order.services";
import iphoneImage from "../../assets/iphone.png";

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
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
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  // Map backend cart item to frontend format
  const mapCartItemToUi = (item) => {
    const id = item.productId;
    const skuFamilyId = item.skuFamilyId?._id || item.productId; // Fallback to productId if skuFamilyId is missing
    const name = item.skuFamilyId?.name || "Product";
    const imageUrl = item.skuFamilyId?.images?.[0] || "https://via.placeholder.com/400x300.png?text=Product";
    const storage = item.storage || "";
    const color = item.color || "";
    const description = [storage, color].filter(Boolean).join(" • ") || (item.specification || "");
    const price = Number(item.price) || 0;
    const stockCount = Number(item.stock) || 0;
    const moq = Number(item.moq) || 1;
    const stockStatus = stockCount <= 0 ? "Out of Stock" : stockCount <= 10 ? "Low Stock" : "In Stock";

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
      setError(error.response?.data?.message || error.message || "An error occurred while fetching cart");
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
      const clampedQty = Math.min(Math.max(Number(newQuantity) || minQty, minQty), maxQty);

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
      setError(error.response?.data?.message || error.message || "An error occurred while updating quantity");
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
      setError(error.response?.data?.message || error.message || "An error occurred while removing item");
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
      setError(error.response?.data?.message || error.message || "An error occurred while clearing cart");
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

  // Handle checkout
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validateAddresses()) {
      setError("Please fill in all address fields");
      return;
    }
    if (cartItems.length === 0) {
      setError("Cannot place an order with an empty cart");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const orderData = {
        cartItems: cartItems.map((item) => ({
          productId: item.id,
          skuFamilyId: item.skuFamilyId,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
        billingAddress,
        shippingAddress,
      };

      console.log("Order data being sent:", orderData);

      const response = await OrderService.createOrder(orderData);

      if (response?.success || response?.status === 200) {
        setCartItems([]);
        navigate("/order", { state: { order: response.data } });
      } else {
        setError(response?.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Create order error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.errors?.map((e) => e.message).join(', ') || error.response?.data?.message || "An error occurred while creating order";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setShowCheckoutForm(false);
    }
  };

  // Calculate total price
  const totalPrice = cartItems
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faCartShopping} className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Your Cart</h1>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading cart...</div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faCartShopping} className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600">Your cart is empty.</p>
            <button
              className="mt-4 bg-[#0071E0] text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200"
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Product
                      </th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Price
                      </th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Quantity
                      </th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Total
                      </th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center min-w-[200px]">
                            <img
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg mr-4"
                              src={imageErrors[item.id] ? iphoneImage : item.imageUrl}
                              alt={item.name}
                              onError={() => handleImageError(item.id)}
                            />
                            <div className="min-w-0">
                              <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                                {item.name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="text-base sm:text-lg font-bold text-gray-900">
                            ${item.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FontAwesomeIcon icon={faMinus} className="w-4 h-4 text-gray-600" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(item.id, parseInt(e.target.value, 10) || item.moq)
                              }
                              min={1}
                              max={item.stockCount}
                              step={1}
                              className="w-16 text-center text-lg font-semibold py-1 px-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stockCount}
                              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FontAwesomeIcon icon={faPlus} className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="text-base sm:text-lg font-bold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {showCheckoutForm ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Checkout</h2>
                <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Billing Address</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Address (e.g., 123 Main St, Apt 4B)"
                        value={billingAddress.address}
                        onChange={(e) => handleAddressChange("billing", "address", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={billingAddress.city}
                        onChange={(e) => handleAddressChange("billing", "city", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={billingAddress.postalCode}
                        onChange={(e) => handleAddressChange("billing", "postalCode", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={billingAddress.country}
                        onChange={(e) => handleAddressChange("billing", "country", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Shipping Address</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Address (e.g., 123 Main St, Apt 4B)"
                        value={shippingAddress.address}
                        onChange={(e) => handleAddressChange("shipping", "address", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={shippingAddress.city}
                        onChange={(e) => handleAddressChange("shipping", "city", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={shippingAddress.postalCode}
                        onChange={(e) => handleAddressChange("shipping", "postalCode", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={shippingAddress.country}
                        onChange={(e) => handleAddressChange("shipping", "country", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3">
                    <button
                      type="button"
                      className="bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-all duration-200"
                      onClick={() => setShowCheckoutForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#0071E0] text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Place Order"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
                <div>
                  <div className="text-lg font-medium text-gray-700">Total:</div>
                  <div className="text-2xl font-bold text-gray-900">${totalPrice}</div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-all duration-200"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </button>
                  <button
                    className="bg-[#0071E0] text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200"
                    onClick={() => setShowCheckoutForm(true)}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default CartPage;