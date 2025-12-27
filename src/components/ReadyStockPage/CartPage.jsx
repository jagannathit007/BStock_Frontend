import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faPlus,
  faMinus,
  faTrash,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons"; // Corrected import
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CartService from "../../services/cart/cart.services";
import OrderService from "../../services/order/order.services";
import iphoneImage from "../../assets/iphone.png";
import { getCurrencySymbol } from "../../utils/currencyUtils";
import { getSubSkuFamily, getProductName, getProductImages, getSubSkuFamilyId } from "../../utils/productUtils";
import { useCurrency } from "../../context/CurrencyContext";

const CartPage = () => {
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();

  // ✅ Format price using currency from cart item (or fallback to context)
  const formatPriceInCurrency = (priceValue, itemCurrency = null) => {
    const numericPrice = parseFloat(priceValue) || 0;
    // ✅ Use currency from cart item if available, otherwise use context
    const currency = itemCurrency || selectedCurrency || 'USD';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${numericPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [itemCountries, setItemCountries] = useState({}); // Track country selection per item (deprecated - use addresses)
  const [groupCountries, setGroupCountries] = useState({}); // Track country selection per group (deprecated - use addresses)
  // ✅ Track billing and shipping addresses per item
  const [itemBillingAddresses, setItemBillingAddresses] = useState({}); // { itemId: { address, city, country } }
  const [itemShippingAddresses, setItemShippingAddresses] = useState({}); // { itemId: { address, city, country } }
  // ✅ Track billing and shipping addresses per group
  const [groupBillingAddresses, setGroupBillingAddresses] = useState({}); // { groupCode: { address, city, country } }
  const [groupShippingAddresses, setGroupShippingAddresses] = useState({}); // { groupCode: { address, city, country } }
  const [itemLoading, setItemLoading] = useState({}); // Track loading state per item
  const [groupLoading, setGroupLoading] = useState({}); // Track loading state per group
  const [successMessage, setSuccessMessage] = useState(null); // Track success messages

  const handleImageError = (itemId) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  // Map backend cart item to frontend format
  const mapCartItemToUi = (item) => {
    const id = item.productId;
    const skuFamily = item.skuFamilyId && typeof item.skuFamilyId === 'object' ? item.skuFamilyId : null;
    const skuFamilyId = skuFamily?._id || item.skuFamilyId || item.productId; // Fallback to productId if skuFamilyId is missing
    const name = getProductName(item);
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
    
    // Use utility function to get images
    const productImages = getProductImages(item);
    let imageUrl = null;
    if (productImages.length > 0) {
      imageUrl = `${baseUrl}/${productImages[0]}`;
    } else {
      imageUrl = iphoneImage; // Use dummy image if no image available
    }
    
    const storage = item.storage || "";
    const color = item.color || "";
    const description =
      [storage, color].filter(Boolean).join(" • ") || item.specification || "";
    const price = Number(item.price) || 0;
    // ✅ Get currency from cart item (stored when adding to cart)
    const currency = item.currency || selectedCurrency || 'USD';
    const stockCount = Number(item.stock) || 0;
    const moq = Number(item.moq) || 1;
    const stockStatus =
      stockCount <= 0
        ? "Out of Stock"
        : stockCount <= 10
        ? "Low Stock"
        : "In Stock";

    const subSkuFamilyId = getSubSkuFamilyId(item);
    return {
      id,
      skuFamilyId,
      subSkuFamilyId,
      name,
      description,
      price,
      currency, // ✅ Include currency from cart item
      moq,
      groupCode: item.groupCode || null,
      totalMoq: item.totalMoq || null,
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

  // Calculate group MOQ status for items with groupCode
  const getGroupMOQStatus = (item) => {
    if (!item.groupCode || !item.totalMoq) return null;
    
    const itemsInGroup = cartItems.filter(ci => ci.groupCode === item.groupCode);
    const totalGroupQuantity = itemsInGroup.reduce((sum, ci) => sum + ci.quantity, 0);
    const remaining = item.totalMoq - totalGroupQuantity;
    
    return {
      groupCode: item.groupCode,
      totalMoq: item.totalMoq,
      currentTotal: totalGroupQuantity,
      remaining: remaining,
      isValid: remaining <= 0,
      itemsInGroup: itemsInGroup.length
    };
  };

  // Group cart items by groupCode
  const groupCartItemsByGroupCode = () => {
    const grouped = {};
    const ungrouped = [];

    cartItems.forEach(item => {
      if (item.groupCode) {
        if (!grouped[item.groupCode]) {
          grouped[item.groupCode] = {
            groupCode: item.groupCode,
            totalMoq: item.totalMoq,
            items: []
          };
        }
        grouped[item.groupCode].items.push(item);
      } else {
        ungrouped.push(item);
      }
    });

    return { grouped, ungrouped };
  };

  // Handle country change for a group
  const handleGroupCountryChange = (groupCode, country) => {
    setGroupCountries((prev) => ({ ...prev, [groupCode]: country }));
    // Also set country for all items in the group
    const itemsInGroup = cartItems.filter(ci => ci.groupCode === groupCode);
    const updatedCountries = { ...itemCountries };
    itemsInGroup.forEach(item => {
      updatedCountries[item.id] = country;
    });
    setItemCountries(updatedCountries);
    // ✅ Also update shipping address country for the group
    handleGroupShippingAddressChange(groupCode, 'country', country);
  };

  // Handle place order for all items in a group
  const handlePlaceOrderForGroup = async (groupCode) => {
    // ✅ Get full billing and shipping addresses for the group
    const billingAddress = groupBillingAddresses[groupCode];
    const shippingAddress = groupShippingAddresses[groupCode];
    
    // Validate addresses
    if (!billingAddress || !billingAddress.address || !billingAddress.city || !billingAddress.country) {
      setError("Please fill in all billing address fields for this group");
      return;
    }
    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.country) {
      setError("Please fill in all shipping address fields for this group");
      return;
    }

    const itemsInGroup = cartItems.filter(ci => ci.groupCode === groupCode);
    
    if (itemsInGroup.length === 0) {
      setError("No items found in this group");
      return;
    }

    try {
      setError(null);
      setGroupLoading((prev) => ({ ...prev, [groupCode]: true }));

      // Normalize country to location code
      const normalizeCountry = (countryStr) => {
        if (!countryStr) return 'HK';
        const upper = countryStr.toUpperCase();
        if (upper === 'HONG KONG' || upper === 'HONGKONG' || upper === 'HK') return 'HK';
        if (upper === 'DUBAI' || upper === 'DBI' || upper === 'D') return 'D';
        return 'HK';
      };

      const currentLocation = 'HK';
      const deliveryLocation = normalizeCountry(shippingAddress.country);
      // ✅ Use currency from cart items (stored when adding to cart) - use first item's currency
      let currency = itemsInGroup[0]?.currency || selectedCurrency;
      if (!currency) {
        const countryUpper = shippingAddress.country?.toUpperCase() || '';
        if (countryUpper.includes('DUBAI') || countryUpper.includes('D')) {
          currency = 'AED';
        } else if (countryUpper.includes('HONG') || countryUpper.includes('HK')) {
          currency = 'HKD';
        } else {
          currency = 'USD';
        }
      }

      // ✅ Create order with full billing and shipping addresses
      // Since itemsInGroup are filtered by groupCode, this is a grouped order
      const orderData = {
        cartItems: itemsInGroup.map(item => ({
          productId: item.id,
          skuFamilyId: item.skuFamilyId || null,
          subSkuFamilyId: item.subSkuFamilyId || null,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
        billingAddress: {
          address: billingAddress.address,
          city: billingAddress.city,
          country: billingAddress.country.toLowerCase(),
        },
        shippingAddress: {
          address: shippingAddress.address,
          city: shippingAddress.city,
          country: shippingAddress.country.toLowerCase(),
        },
        currentLocation: currentLocation,
        deliveryLocation: deliveryLocation,
        currency: currency,
        isGroupedOrder: true, // This order contains groupCode products
      };

      const response = await OrderService.createOrder(orderData);

      if (response?.success || response?.status === 200) {
        // Remove all items in the group from cart
        for (const item of itemsInGroup) {
          await CartService.remove(item.id);
        }
        
        // Remove from local state
        const remainingItems = cartItems.filter((cartItem) => !itemsInGroup.find(gi => gi.id === cartItem.id));
        setCartItems(remainingItems);
        
        // Clear country selections and addresses for the group
        setGroupCountries((prev) => {
          const updated = { ...prev };
          delete updated[groupCode];
          return updated;
        });
        setItemCountries((prev) => {
          const updated = { ...prev };
          itemsInGroup.forEach(item => {
            delete updated[item.id];
          });
          return updated;
        });
        setGroupBillingAddresses((prev) => {
          const updated = { ...prev };
          delete updated[groupCode];
          return updated;
        });
        setGroupShippingAddresses((prev) => {
          const updated = { ...prev };
          delete updated[groupCode];
          return updated;
        });
        setItemBillingAddresses((prev) => {
          const updated = { ...prev };
          itemsInGroup.forEach(item => {
            delete updated[item.id];
          });
          return updated;
        });
        setItemShippingAddresses((prev) => {
          const updated = { ...prev };
          itemsInGroup.forEach(item => {
            delete updated[item.id];
          });
          return updated;
        });
        
        // Trigger cart count update event
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cartUpdated', Date.now().toString());
        
        // Show success message
        setSuccessMessage(`Order placed successfully for group ${groupCode} (${itemsInGroup.length} items)!`);
        setTimeout(() => setSuccessMessage(null), 5000);
        
        // If cart is now empty, navigate to order page
        if (remainingItems.length === 0) {
          navigate("/order", { state: { order: response.data } });
        }
      } else {
        const errorMessage = response?.message || response?.data?.message || "Failed to create order";
        // Check if error is about delivery location and currency combination
        if (errorMessage.includes("does not support the selected delivery location") || 
            errorMessage.includes("delivery location") && errorMessage.includes("currency")) {
          // Show as confirmation box instead of error
          await Swal.fire({
            icon: "info",
            title: "Location & Currency Mismatch",
            html: `<p style="text-align: left; margin: 10px 0;">does not support the selected delivery location</p>`,
            confirmButtonText: "OK",
            confirmButtonColor: "#0071E0",
            width: "500px",
          });
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.map((e) => e.message).join(", ") ||
        error.response?.data?.message ||
        "An error occurred while creating order";
      
      // Check if error is about delivery location and currency combination
      if (errorMessage.includes("does not support the selected delivery location") || 
          (errorMessage.includes("delivery location") && errorMessage.includes("currency"))) {
        // Show as confirmation box instead of error
        await Swal.fire({
          icon: "info",
          title: "Location & Currency Mismatch",
          html: `<p style="text-align: left; margin: 10px 0;">${errorMessage}</p>`,
          confirmButtonText: "OK",
          confirmButtonColor: "#0071E0",
          width: "500px",
        });
      } else {
        setError(errorMessage);
      }
    } finally {
      setGroupLoading((prev) => ({ ...prev, [groupCode]: false }));
    }
  };

  // Handle quantity change
  const handleQuantityChange = async (id, newQuantity) => {
    try {
      setError(null);
      const item = cartItems.find((item) => item.id === id);
      if (!item) return;

      const minQty = Math.max(item.moq, 1);
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
        // Show MOQ validation error if present
        const errorMessage = response?.message || response?.data?.message || "Failed to update quantity";
        setError(errorMessage);
        // Refresh cart to get updated data
        fetchCart();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while updating quantity";
      setError(errorMessage);
      // Refresh cart to get updated data
      fetchCart();
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
    // ✅ Also update shipping address country when country changes
    setItemShippingAddresses((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), country: country }
    }));
  };

  // ✅ Handle billing address field changes for individual items
  const handleBillingAddressChange = (itemId, field, value) => {
    setItemBillingAddresses((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [field]: value }
    }));
  };

  // ✅ Handle shipping address field changes for individual items
  const handleShippingAddressChange = (itemId, field, value) => {
    setItemShippingAddresses((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [field]: value }
    }));
  };

  // ✅ Handle billing address field changes for groups
  const handleGroupBillingAddressChange = (groupCode, field, value) => {
    setGroupBillingAddresses((prev) => ({
      ...prev,
      [groupCode]: { ...(prev[groupCode] || {}), [field]: value }
    }));
    // Also update billing addresses for all items in the group
    const itemsInGroup = cartItems.filter(ci => ci.groupCode === groupCode);
    const updatedAddresses = { ...itemBillingAddresses };
    itemsInGroup.forEach(item => {
      updatedAddresses[item.id] = { ...(updatedAddresses[item.id] || {}), [field]: value };
    });
    setItemBillingAddresses(updatedAddresses);
  };

  // ✅ Handle shipping address field changes for groups
  const handleGroupShippingAddressChange = (groupCode, field, value) => {
    setGroupShippingAddresses((prev) => ({
      ...prev,
      [groupCode]: { ...(prev[groupCode] || {}), [field]: value }
    }));
    // Also update shipping addresses for all items in the group
    const itemsInGroup = cartItems.filter(ci => ci.groupCode === groupCode);
    const updatedAddresses = { ...itemShippingAddresses };
    itemsInGroup.forEach(item => {
      updatedAddresses[item.id] = { ...(updatedAddresses[item.id] || {}), [field]: value };
    });
    setItemShippingAddresses(updatedAddresses);
  };

  // Render a single cart item (reusable component)
  const renderCartItem = (item) => (
    <>
      <div className="flex gap-4">
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
        
        {/* Product Details */}
        <div className="flex-1 min-w-0">
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
                {formatPriceInCurrency(item.price, item.currency)}
                <div className="text-xs text-gray-500 ms-2">Stock: {item.stockCount}</div>
              </div>
              {item.groupCode && (
                <div className="text-xs text-gray-600 mt-1">
                  Group: {item.groupCode}
                </div>
              )}
            </div>
          </div>
          
          {/* Group MOQ Status (only show if not already shown in group header) */}
          {!item.groupCode && (() => {
            const groupStatus = getGroupMOQStatus(item);
            if (!groupStatus) return null;
            return (
              <div className={`mb-2 p-2 rounded-md text-xs ${
                groupStatus.isValid 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              }`}>
                {groupStatus.isValid ? (
                  <span>✓ Group MOQ met ({groupStatus.currentTotal}/{groupStatus.totalMoq})</span>
                ) : (
                  <span>⚠ Need {groupStatus.remaining} more item(s) to meet group MOQ ({groupStatus.currentTotal}/{groupStatus.totalMoq})</span>
                )}
              </div>
            );
          })()}
          
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
                {formatPriceInCurrency(item.price * item.quantity, item.currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Billing and Shipping Address Forms and Place Order (only for ungrouped items) */}
      {!item.groupCode && (
        <div className="pt-4 border-t border-gray-200 mt-4 space-y-4">
          {/* Billing Address */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Billing Address</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemBillingAddresses[item.id]?.address || ""}
                  onChange={(e) => handleBillingAddressChange(item.id, 'address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter billing address"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemBillingAddresses[item.id]?.city || ""}
                  onChange={(e) => handleBillingAddressChange(item.id, 'city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={itemBillingAddresses[item.id]?.country || itemCountries[item.id] || ""}
                  onChange={(e) => {
                    handleBillingAddressChange(item.id, 'country', e.target.value);
                    handleCountryChange(item.id, e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">Select country</option>
                  <option value="hongkong">Hong Kong</option>
                  <option value="dubai">Dubai</option>
                </select>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Shipping Address</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemShippingAddresses[item.id]?.address || ""}
                  onChange={(e) => handleShippingAddressChange(item.id, 'address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter shipping address"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemShippingAddresses[item.id]?.city || ""}
                  onChange={(e) => handleShippingAddressChange(item.id, 'city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={itemShippingAddresses[item.id]?.country || itemCountries[item.id] || ""}
                  onChange={(e) => {
                    handleShippingAddressChange(item.id, 'country', e.target.value);
                    handleCountryChange(item.id, e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">Select country</option>
                  <option value="hongkong">Hong Kong</option>
                  <option value="dubai">Dubai</option>
                </select>
              </div>
            </div>
          </div>

          {/* Place Order Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => handlePlaceOrderForItem(item)}
              disabled={
                !itemBillingAddresses[item.id]?.address ||
                !itemBillingAddresses[item.id]?.city ||
                !itemBillingAddresses[item.id]?.country ||
                !itemShippingAddresses[item.id]?.address ||
                !itemShippingAddresses[item.id]?.city ||
                !itemShippingAddresses[item.id]?.country ||
                itemLoading[item.id]
              }
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
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
      )}
    </>
  );

  // Handle place order for a single product
  const handlePlaceOrderForItem = async (item) => {
    // ✅ Get full billing and shipping addresses
    const billingAddress = itemBillingAddresses[item.id];
    const shippingAddress = itemShippingAddresses[item.id];
    
    // Validate addresses
    if (!billingAddress || !billingAddress.address || !billingAddress.city || !billingAddress.country) {
      setError("Please fill in all billing address fields");
      return;
    }
    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.country) {
      setError("Please fill in all shipping address fields");
      return;
    }

    try {
      setError(null);
      setItemLoading((prev) => ({ ...prev, [item.id]: true }));

      // Normalize country to location code
      const normalizeCountry = (countryStr) => {
        if (!countryStr) return 'HK'; // Default to HK
        const upper = countryStr.toUpperCase();
        if (upper === 'HONG KONG' || upper === 'HONGKONG' || upper === 'HK') return 'HK';
        if (upper === 'DUBAI' || upper === 'DBI' || upper === 'D') return 'D';
        return 'HK'; // Default
      };

      // Get current location (default to HK, can be from product or user profile)
      const currentLocation = 'HK'; // Default, can be enhanced to get from product
      const deliveryLocation = normalizeCountry(shippingAddress.country);
      // Use selectedCurrency from global context - ensure it's explicitly set
      let currency = selectedCurrency;
      if (!currency) {
        // Infer currency from country as fallback
        const countryUpper = shippingAddress.country?.toUpperCase() || '';
        if (countryUpper.includes('DUBAI') || countryUpper.includes('D')) {
          currency = 'AED';
        } else if (countryUpper.includes('HONG') || countryUpper.includes('HK')) {
          currency = 'HKD';
        } else {
          currency = 'USD'; // Last resort default
        }
      }
      console.log('Creating order from cart page with currency:', currency, 'from context:', selectedCurrency);

      // ✅ Create order with full billing and shipping addresses
      // Check if this item has a groupCode to determine if it's a grouped order
      const isGroupedOrder = item.groupCode && item.groupCode.trim() !== '';
      const orderData = {
        cartItems: [{
          productId: item.id,
          skuFamilyId: item.skuFamilyId || null,
          subSkuFamilyId: item.subSkuFamilyId || null,
          quantity: Number(item.quantity),
          price: Number(item.price),
        }],
        billingAddress: {
          address: billingAddress.address,
          city: billingAddress.city,
          country: billingAddress.country.toLowerCase(),
        },
        shippingAddress: {
          address: shippingAddress.address,
          city: shippingAddress.city,
          country: shippingAddress.country.toLowerCase(),
        },
        currentLocation: currentLocation,
        deliveryLocation: deliveryLocation,
        currency: currency,
        isGroupedOrder: isGroupedOrder, // Set flag if product has groupCode
      };

      const response = await OrderService.createOrder(orderData);

      if (response?.success || response?.status === 200) {
        // Remove this item from cart
        await CartService.remove(item.id);
        // Check if this was the last item before removing from state
        const remainingItems = cartItems.filter((cartItem) => cartItem.id !== item.id);
        // Remove from local state
        setCartItems((prevItems) => prevItems.filter((cartItem) => cartItem.id !== item.id));
        // Clear country selection and addresses for this item
        setItemCountries((prev) => {
          const updated = { ...prev };
          delete updated[item.id];
          return updated;
        });
        setItemBillingAddresses((prev) => {
          const updated = { ...prev };
          delete updated[item.id];
          return updated;
        });
        setItemShippingAddresses((prev) => {
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
        // Show detailed error including MOQ validation
        const errorMessage = response?.message || response?.data?.message || "Failed to create order";
        setError(errorMessage);
      }
    } catch (error) {
      // Show detailed error including MOQ validation
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
          <div className="space-y-6">
            {/* Group items by groupCode */}
            {(() => {
              const { grouped, ungrouped } = groupCartItemsByGroupCode();
              const groups = Object.values(grouped);
              
              return (
                <>
                  {/* Render grouped items */}
                  {groups.map((group) => {
                    const groupStatus = getGroupMOQStatus(group.items[0]);
                    const groupTotalPrice = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const groupCountry = groupCountries[group.groupCode] || itemCountries[group.items[0]?.id] || "";
                    // ✅ Get currency from first item in group (all items in group should have same currency)
                    const groupCurrency = group.items[0]?.currency || selectedCurrency || 'USD';
                    
                    return (
                      <div key={group.groupCode} className="bg-white rounded-lg shadow-sm border-2 border-blue-200">
                        {/* Group Header */}
                        <div className="p-4 bg-blue-50 border-b border-blue-200 rounded-t-lg">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <FontAwesomeIcon icon={faLayerGroup} className="w-5 h-5 text-blue-600" />
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">Group: {group.groupCode}</h3>
                                <p className="text-sm text-gray-600">
                                  {group.items.length} product{group.items.length > 1 ? 's' : ''} in this group
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600 mb-1">Group Total</div>
                              <div className="text-xl font-bold text-gray-900">
                                {formatPriceInCurrency(groupTotalPrice, groupCurrency)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Group MOQ Status */}
                          {groupStatus && (
                            <div className={`mt-3 p-2 rounded-md text-sm ${
                              groupStatus.isValid 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            }`}>
                              {groupStatus.isValid ? (
                                <span>✓ Group MOQ met ({groupStatus.currentTotal}/{groupStatus.totalMoq})</span>
                              ) : (
                                <span>⚠ Need {groupStatus.remaining} more item(s) to meet group MOQ ({groupStatus.currentTotal}/{groupStatus.totalMoq})</span>
                              )}
                            </div>
                          )}
                          
                          {/* ✅ Group Billing and Shipping Address Forms and Place Order Button */}
                          <div className="mt-4 space-y-4">
                            {/* Billing Address */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Billing Address</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Address <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={groupBillingAddresses[group.groupCode]?.address || ""}
                                    onChange={(e) => handleGroupBillingAddressChange(group.groupCode, 'address', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter billing address"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    City <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={groupBillingAddresses[group.groupCode]?.city || ""}
                                    onChange={(e) => handleGroupBillingAddressChange(group.groupCode, 'city', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter city"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Country <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={groupBillingAddresses[group.groupCode]?.country || groupCountry || ""}
                                    onChange={(e) => {
                                      handleGroupBillingAddressChange(group.groupCode, 'country', e.target.value);
                                      handleGroupCountryChange(group.groupCode, e.target.value);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    required
                                  >
                                    <option value="">Select country</option>
                                    <option value="hongkong">Hong Kong</option>
                                    <option value="dubai">Dubai</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Shipping Address</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Address <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={groupShippingAddresses[group.groupCode]?.address || ""}
                                    onChange={(e) => handleGroupShippingAddressChange(group.groupCode, 'address', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter shipping address"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    City <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={groupShippingAddresses[group.groupCode]?.city || ""}
                                    onChange={(e) => handleGroupShippingAddressChange(group.groupCode, 'city', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter city"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Country <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={groupShippingAddresses[group.groupCode]?.country || groupCountry || ""}
                                    onChange={(e) => {
                                      handleGroupShippingAddressChange(group.groupCode, 'country', e.target.value);
                                      handleGroupCountryChange(group.groupCode, e.target.value);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    required
                                  >
                                    <option value="">Select country</option>
                                    <option value="hongkong">Hong Kong</option>
                                    <option value="dubai">Dubai</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Place Order Button */}
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => handlePlaceOrderForGroup(group.groupCode)}
                                disabled={
                                  !groupBillingAddresses[group.groupCode]?.address ||
                                  !groupBillingAddresses[group.groupCode]?.city ||
                                  !groupBillingAddresses[group.groupCode]?.country ||
                                  !groupShippingAddresses[group.groupCode]?.address ||
                                  !groupShippingAddresses[group.groupCode]?.city ||
                                  !groupShippingAddresses[group.groupCode]?.country ||
                                  groupLoading[group.groupCode]
                                }
                                className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600 flex items-center justify-center gap-2"
                              >
                                {groupLoading[group.groupCode] ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4" />
                                    Place Order for Group
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Group Items */}
                        <div className="p-4 space-y-4">
                          {group.items.map((item) => (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              {renderCartItem(item)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Render ungrouped items */}
                  {ungrouped.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="p-4 sm:p-5">
                        {renderCartItem(item)}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
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
