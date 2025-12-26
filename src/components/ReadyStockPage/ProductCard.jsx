import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStopwatch,
  faCartShopping,
  faHandshake,
  faBell,
  faXmark,
  faCalendarXmark,
  faBellSlash,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import AddToCartPopup from "./AddToCartPopup";
import CartService from "../../services/cart/cart.services";
import { ProductService } from "../../services/products/products.services";
import { AuthService } from "../../services/auth/auth.services";
import iphoneImage from "../../assets/iphone.png";
import Swal from "sweetalert2";
import Countdown from "react-countdown";
import { convertPrice } from "../../utils/currencyUtils";
import { getSubSkuFamilyId } from "../../utils/productUtils";
import { useCurrency } from "../../context/CurrencyContext";

const ProductCard = ({
  product,
  viewMode = "grid",
  onRefresh,
  onWishlistChange,
  isInModal = false,
  onOpenBiddingForm,
  isFlashDeal = false,
  onGroupCodeClick,
}) => {
  const navigate = useNavigate();
  const [isAddToCartPopupOpen, setIsAddToCartPopupOpen] = useState(false);
  const [isNotifyMePopupOpen, setIsNotifyMePopupOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false);
  const [notify, setNotify] = useState(Boolean(product?.notify));
  const [imageError, setImageError] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product?.color || "");
  const [selectedPrice, setSelectedPrice] = useState(product?.price || 0);
  const [selectedCountry, setSelectedCountry] = useState("Hongkong");
  // Use local state for currency per product card to avoid affecting other cards
  const { selectedCurrency: globalSelectedCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    // Initialize from global context or default to USD
    return globalSelectedCurrency || "USD";
  });

  // === LIST VIEW: QUANTITY STATE ===
  const [quantity, setQuantity] = useState(1);

  const deliverables = useMemo(() => {
    const direct = product?.countryDeliverables;
    const nested = product?._product?.countryDeliverables;
    if (Array.isArray(direct) && direct.length) return direct;
    if (Array.isArray(nested) && nested.length) return nested;
    return [];
  }, [product]);
  const countryOptions = ["Hongkong", "Dubai"];
  const currencyOptionsByCountry = {
    Hongkong: ["USD", "HKD"],
    Dubai: ["USD", "AED"],
  };

  useEffect(() => {
    // Reset country and currency selection when product changes
    const firstDeliverable = deliverables[0];
    if (firstDeliverable) {
      const countryToSet = firstDeliverable.country || "Hongkong";
      setSelectedCountry(countryToSet);
      
      // Set currency from deliverable, or use a valid currency for the country
      const validCurrencies = currencyOptionsByCountry[countryToSet] || [];
      if (firstDeliverable.currency && validCurrencies.includes(firstDeliverable.currency)) {
        setSelectedCurrency(firstDeliverable.currency);
      } else if (validCurrencies.length > 0) {
        // If deliverable currency is not valid, use first valid currency for the country
        setSelectedCurrency(validCurrencies[0]);
      } else {
        // Fallback to USD if no valid currencies
        setSelectedCurrency("USD");
      }
    } else {
      setSelectedCountry("Hongkong");
      setSelectedCurrency("USD");
    }
  }, [product, deliverables]);

  useEffect(() => {
    // Ensure currency stays valid for the chosen country
    const validCurrencies = currencyOptionsByCountry[selectedCountry] || [];
    if (!validCurrencies.includes(selectedCurrency) && validCurrencies.length) {
      // If current currency is not valid for selected country, switch to first valid currency
      setSelectedCurrency(validCurrencies[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  const normalize = (val) => (typeof val === "string" ? val.trim().toLowerCase() : "");
  const selectedDeliverable = deliverables.find(
    (d) =>
      normalize(d.country) === normalize(selectedCountry) &&
      normalize(d.currency) === normalize(selectedCurrency)
  );
  const derivedPrice =
    selectedDeliverable?.calculatedPrice ??
    selectedDeliverable?.basePrice ??
    product?.price ??
    null;
  const displayPriceText =
    derivedPrice != null
      ? `${selectedCurrency} ${Number(derivedPrice).toLocaleString()}`
      : "Price unavailable";

  useEffect(() => {
    setNotify(Boolean(product?.notify));
  }, [product?.notify]);

  useEffect(() => {
    setIsFavorite(product.isFavorite || false);
  }, [product.isFavorite]);

  useEffect(() => {
    setSelectedColor(product?.color || "");
    setSelectedPrice(product?.price || 0);
  }, [product]);

  // Remove global currency change listener since we're using local state now
  // Each product card manages its own currency independently

  useEffect(() => {
    const handleWishlistUpdate = (event) => {
      if (
        event.detail &&
        event.detail.productId === (product.id || product._id)
      ) {
        setIsFavorite(event.detail.isWishlisted);
      }
    };
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, [product.id, product._id]);

  const {
    id,
    name,
    description,
    price,
    moq,
    stockStatus,
    stockCount,
    imageUrl,
    isOutOfStock,
    isExpired,
    customerListingNumber
  } = product;
  const shouldShowTimer = Boolean(product?.isShowTimer);
  const purchaseType = product?.purchaseType;
  const purchaseTypeLabel = purchaseType
    ? purchaseType.toLowerCase() === "partial"
      ? "Partial"
      : purchaseType.toLowerCase() === "full"
      ? "Full"
      : purchaseType
    : null;

  const derivedOutOfStock =
    typeof isOutOfStock === "boolean"
      ? isOutOfStock
      : Number(product?.stockCount ?? product?.stock ?? 0) <= 0;
  const statusOutOfStock =
    typeof stockStatus === "string" &&
    stockStatus.toLowerCase() === "out of stock";
  const effectiveOutOfStock =
    !isExpired && (derivedOutOfStock || statusOutOfStock);
  const isCardOutOfStock = effectiveOutOfStock;
  const outOfStockVisualStyle = effectiveOutOfStock
    ? { filter: "grayscale(1)", opacity: 0.55 }
    : undefined;
  const canNotify = effectiveOutOfStock && !isExpired;

  const getStatusBadgeClass = () => {
    if (isExpired) return "bg-gray-100 text-gray-800";
    switch (stockStatus) {
      case "In Stock": return "bg-green-100 text-green-800";
      case "Low Stock": return "bg-yellow-100 text-yellow-800";
      case "Out of Stock": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCardBackgroundClass = () => {
    if (isExpired) return "bg-gray-200";
    switch (stockStatus) {
      case "In Stock": return "bg-white-25";
      case "Low Stock": return "bg-white-25";
      case "Out of Stock": return "bg-gray-100";
      default: return "bg-white-25";
    }
  };

  const getDisplayStatus = () => {
    if (isExpired) return "Expired";
    return stockStatus;
  };

  const handleProductClick = (e) => {
    if (e.target.tagName === "BUTTON" || e.target.closest("button")) return;
    if (isCardOutOfStock) return;
    navigate(`/product/${id}`);
  };

  // === LIST VIEW: QUANTITY SETUP ===
  const purchaseTypeLower = (product?.purchaseType || "").toLowerCase();
  const isFullPurchase = purchaseTypeLower === "full";
  const validMoq = isNaN(parseInt(moq)) ? 1 : parseInt(moq);
  const validStock = isNaN(parseInt(stockCount)) ? Infinity : parseInt(stockCount);

  useEffect(() => {
    if (isFullPurchase) {
      setQuantity(validStock);
    } else {
      setQuantity(validMoq);
    }
  }, [isFullPurchase, validMoq, validStock]);

  const handleQuantityChange = (newValue) => {
    if (isFullPurchase) return;
    if (newValue >= validMoq && (validStock === Infinity || newValue <= validStock)) {
      setQuantity(newValue);
    }
  };

  const incQty = () => handleQuantityChange(quantity + 1);
  const decQty = () => handleQuantityChange(quantity - 1);
  const onQtyInput = (e) => {
    const val = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    if (Number.isNaN(val)) {
      setQuantity(validMoq);
    } else {
      handleQuantityChange(val);
    }
  };

  // === DIRECT ADD TO CART (LIST VIEW) ===
  const handleDirectAddToCart = async (e) => {
    e.stopPropagation();
    if (effectiveOutOfStock || isExpired) return;

    // If product has groupCode, show bulk add modal instead
    if (product?.groupCode && onGroupCodeClick) {
      onGroupCodeClick(product.groupCode, product);
      return;
    }

    try {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn) {
        localStorage.setItem(
          "postLoginAction",
          JSON.stringify({
            type: "add_to_cart",
            productId: id || product?._id,
          })
        );
        const returnTo = encodeURIComponent(window.location.hash?.slice(1) || "/home");
        return navigate(`/login?returnTo=${returnTo}`);
      }

      // Check if profile is complete
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          const isProfileComplete = AuthService.isProfileComplete(userData);
          if (!isProfileComplete) {
            navigate('/profile', { replace: true });
            return;
          }
        } catch (error) {
          console.error('Error checking profile completion:', error);
        }
      }

      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const { businessProfile } = userData;

      if (!businessProfile?.businessName?.trim()) {
        const confirm = await Swal.fire({
          icon: "warning",
          title: "Business Details Required",
          text: "Please add your business details before adding products to the cart.",
          confirmButtonText: "Go to Settings",
          confirmButtonColor: "#0071E0",
        });
        if (confirm.isConfirmed) navigate("/profile?tab=business");
        return;
      }

      if (["pending", "rejected"].includes(businessProfile?.status)) {
        await Swal.fire({
          icon: "info",
          title: "Pending Approval",
          text: "Your business profile is not approved. Please wait for approval.",
          confirmButtonText: "OK",
          confirmButtonColor: "#0071E0",
        });
        return;
      }

      const productId = id || product?._id;
      // Extract subSkuFamilyId from product using utility function
      // This handles the new structure where subSkuFamily is inside skuFamily.subSkuFamilies array
      const rawProduct = product?._product || product;
      const subSkuFamilyId = getSubSkuFamilyId(rawProduct);
      
      // Get the calculated price based on selected country and currency
      const priceToSend = (derivedPrice != null && derivedPrice > 0) ? derivedPrice : (product?.price ?? null);
      const countryToSend = selectedCountry || null;
      const currencyToSend = selectedCurrency || null;
      
      const res = await CartService.add(productId, quantity, subSkuFamilyId, priceToSend, countryToSend, currencyToSend);
      const ok = res?.success === true || res?.status === 200;

      if (ok) {
        await Swal.fire({
          icon: "success",
          title: "Added!",
          text: `${quantity} × ${name} added to cart`,
          timer: 1500,
          showConfirmButton: false,
        });
        const count = await CartService.count();
        console.log(`Cart count updated: ${count}`);
        onRefresh?.();
      } else {
        throw new Error(res?.message || "Failed to add");
      }
    } catch (error) {
      console.error("Error in add to cart:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || error.message || "Failed to add to cart",
        confirmButtonText: "OK",
        confirmButtonColor: "#0071E0",
      });
    }
  };

  // === ORIGINAL ADD TO CART (GRID VIEW) ===
  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (effectiveOutOfStock || isExpired) return;

    // If product has groupCode, show bulk add modal instead
    if (product?.groupCode && onGroupCodeClick) {
      onGroupCodeClick(product.groupCode, product);
      return;
    }

    try {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn) {
        localStorage.setItem(
          "postLoginAction",
          JSON.stringify({
            type: "add_to_cart",
            productId: id || product?._id,
          })
        );
        const returnTo = encodeURIComponent(window.location.hash?.slice(1) || "/home");
        return navigate(`/login?returnTo=${returnTo}`);
      }

      // Check if profile is complete
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          const isProfileComplete = AuthService.isProfileComplete(userData);
          if (!isProfileComplete) {
            navigate('/profile', { replace: true });
            return;
          }
        } catch (error) {
          console.error('Error checking profile completion:', error);
        }
      }

      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const { businessProfile } = userData;

      if (!businessProfile?.businessName?.trim()) {
        const confirm = await Swal.fire({
          icon: "warning",
          title: "Business Details Required",
          text: "Please add your business details before adding products to the cart.",
          confirmButtonText: "Go to Settings",
          confirmButtonColor: "#0071E0",
        });
        if (confirm.isConfirmed) navigate("/profile?tab=business");
        return;
      }

      if (["pending", "rejected"].includes(businessProfile?.status)) {
        await Swal.fire({
          icon: "info",
          title: "Pending Approval",
          text: "Your business profile is not approved. Please wait for approval.",
          confirmButtonText: "OK",
          confirmButtonColor: "#0071E0",
        });
        return;
      }

      setIsAddToCartPopupOpen(true);
    } catch (error) {
      console.error("Error in add to cart:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while adding to cart. Please try again.",
        confirmButtonText: "OK",
        confirmButtonColor: "#0071E0",
      });
    }
  };

  const handleNotifyToggle = async (e, nextValue) => {
    e.stopPropagation();
    if (!canNotify) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const { businessProfile } = user;

    if (!businessProfile?.businessName?.trim()) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Business Details Required",
        text: "Please add your business details before adding products to the cart.",
        confirmButtonText: "Go to Settings",
        confirmButtonColor: "#0071E0",
      });
      if (confirm.isConfirmed) navigate("/profile?tab=business");
      return;
    }

    if (["pending", "rejected"].includes(businessProfile?.status)) {
      await Swal.fire({
        icon: "info",
        title: "Pending Approval",
        text: "Your business profile is not approved. Please wait for approval.",
        confirmButtonText: "OK",
        confirmButtonColor: "#0071E0",
      });
      return;
    }

    const productId = id || product?._id;
    try {
      await ProductService.createNotification({
        productId,
        notifyType: "stock_alert",
        notify: nextValue,
      });
      setNotify(nextValue);
    } catch (err) {
      console.error("Notification toggle error:", err);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    
    // Check for token before making API call
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!token || !isLoggedIn) {
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      return navigate(`/login?returnTo=${returnTo}`);
    }
    
    // Check if profile is complete
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const isProfileComplete = AuthService.isProfileComplete(userData);
        if (!isProfileComplete) {
          navigate('/profile', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    }
    
    const productId = id || product._id;
    const newWishlistStatus = !isFavorite;
    setIsFavorite(newWishlistStatus);

    try {
      await ProductService.toggleWishlist({
        productId,
        wishlist: newWishlistStatus,
      });
      onWishlistChange?.(productId, newWishlistStatus);
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
      setIsFavorite(!newWishlistStatus);
    }
  };

  const handlePopupClose = async () => {
    setIsAddToCartPopupOpen(false);
    try {
      const count = await CartService.count();
      console.log(`Cart count updated: ${count}`);
    } catch (error) {
      console.error("Refresh cart count error:", error);
    }
  };

  const handleImageError = () => setImageError(true);

  // Get available colors from product and related products
  const getAvailableColors = () => {
    const colors = new Set();
    
    // Add current product color
    if (product?.color) {
      colors.add(product.color);
    }
    
    // Add colors from related products
    if (product?.relatedProducts && Array.isArray(product.relatedProducts)) {
      product.relatedProducts.forEach((rp) => {
        if (rp.color) {
          colors.add(rp.color);
        }
      });
    }
    
    return Array.from(colors).map(color => ({
      name: color,
      value: color.toLowerCase(),
    }));
  };

  const availableColors = getAvailableColors();

  // Helper function to get display value for group products
  const getDisplayValue = (value, fieldName) => {
    if (product?.groupCode) {
      return "Mixed";
    }
    return value || "-";
  };

  // Handle color selection and update price
  const handleColorSelect = (e, colorValue) => {
    e.stopPropagation();
    setSelectedColor(colorValue);
    
    // Find the variant with the selected color from related products
    if (product?.relatedProducts && Array.isArray(product.relatedProducts)) {
      const matchingVariant = product.relatedProducts.find(
        (rp) => rp.color && rp.color.toLowerCase() === colorValue.toLowerCase()
      );
      
      if (matchingVariant && matchingVariant._id) {
        // Navigate to the matching variant
        navigate(`/product/${matchingVariant._id}`);
      } else {
        // No matching variant found, use current product price
        setSelectedPrice(parseFloat(product?.price || 0));
      }
    } else {
      setSelectedPrice(parseFloat(product?.price || 0));
    }
  };

if (viewMode === "table") {
    return (
      <tr 
        className={`bg-white border-b border-gray-200 transition-colors ${isCardOutOfStock ? "cursor-default" : "hover:bg-gray-50 cursor-pointer"}`}
        onClick={!isCardOutOfStock ? handleProductClick : undefined}
        style={outOfStockVisualStyle}
      >
        {/* Image */}
        <td className="px-4 py-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
            <img
              className="w-full h-full object-contain"
              src={
                imageError
                  ? iphoneImage
                  : `${import.meta.env.VITE_BASE_URL}/${imageUrl}`
              }
              
              alt={name}
              onError={handleImageError}
            />
          </div>
        </td>

        {/* Product Name & Description */}
        <td className="px-4 py-3 max-w-[280px]">
          <div className="font-semibold text-sm text-gray-900 hover:text-[#0071e3] transition-colors">{customerListingNumber}</div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-sm text-gray-900 hover:text-[#0071e3] transition-colors">
              {name}
            </h3>
            {product?.groupCode && (
              <p 
                className="text-xs text-blue-600 mt-0.5 font-medium cursor-pointer hover:text-blue-800 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onGroupCodeClick) {
                    onGroupCodeClick(product.groupCode, product);
                  }
                }}
                title="Click to view all products in this group"
              >
                Group: {product.groupCode} (Click to view all)
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {[
                getDisplayValue(product?.storage, 'storage'),
                getDisplayValue(product?.ram, 'ram'),
                getDisplayValue(product?.color, 'color'),
                product?.simType,
                product?.countryName
              ].filter(Boolean).join(' • ') || '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {description}
            </p>
          </div>
        </td>

        {/* Price */}
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-green-600">
              {convertPrice(price)}
            </span>
            {!isExpired && !effectiveOutOfStock && shouldShowTimer && product.expiryTime && (
              <div className="mt-1">
                <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-2 py-0.5 rounded text-[9px] font-semibold border border-red-200">
                  <FontAwesomeIcon icon={faClock} className="w-2 h-2 mr-1" />
                  <Countdown
                    date={product.expiryTime}
                    renderer={({ days, hours, minutes, seconds, completed }) => {
                      if (completed) return <span>Ended</span>;
                      return (
                        <span>
                          {days > 0 ? `${days}d ` : ""}
                          {String(hours).padStart(2, "0")}:
                          {String(minutes).padStart(2, "0")}:
                          {String(seconds).padStart(2, "0")}
                        </span>
                      );
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </td>

        {/* Stock Status */}
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusBadgeClass()}`}>
            {isExpired ? (
              <FontAwesomeIcon icon={faCalendarXmark} className="w-2.5 h-2.5 mr-0.5" />
            ) : (
              <svg className="w-2.5 h-2.5 mr-0.5" viewBox="0 0 512 512" fill="currentColor">
                <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z" />
              </svg>
            )}
            {getDisplayStatus()}
          </span>
        </td>

        {/* MOQ / Stock */}
        <td className="px-4 py-3">
          <div className="text-sm text-gray-900">
            <div className="font-medium">{moq} / {stockCount}</div>
          </div>
        </td>

        {/* Condition */}
        <td className="px-4 py-3">
          <span className="text-sm text-gray-900">{product?.condition || "-"}</span>
        </td>

        {/* Warehouse */}
        {/* <td className="px-4 py-3">
          <div className="flex items-center text-sm text-gray-900">
            <span className="w-2 h-2 bg-red-500 rounded-sm mr-1"></span>
            {product?.countryName || product?.country || '—'}
          </div>
        </td> */}

        {/* Quantity & Actions */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-2">
            {/* Quantity Selector */}
            {!isExpired && !effectiveOutOfStock && (
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button
                  onClick={(e) => { e.stopPropagation(); decQty(); }}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  disabled={isFullPurchase || quantity <= validMoq}
                >
                  -
                </button>
                <input
                  type="text"
                  value={quantity}
                  onChange={onQtyInput}
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 px-1 py-1 text-center text-xs font-medium bg-transparent outline-none"
                  readOnly={isFullPurchase}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); incQty(); }}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  disabled={isFullPurchase || quantity >= validStock}
                >
                  +
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-1.5">
              {/* Wishlist */}
              <button
                className={`p-1.5 rounded transition-all ${
                  isFavorite ? "text-[#FB2C36]" : "text-gray-400 hover:text-[#FB2C36]"
                }`}
                onClick={handleToggleWishlist}
                title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
              </button>

              {/* Order Now / Notify / Make Offer */}
              {isExpired ? (
                <button 
                  className="px-2 py-1 bg-gray-300 text-gray-500 rounded text-[10px] font-semibold cursor-not-allowed"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FontAwesomeIcon icon={faCalendarXmark} className="w-3 h-3" />
                </button>
              ) : effectiveOutOfStock ? (
                canNotify ? (
                  notify ? (
                    <button
                      className="px-2 py-1 border border-red-300 text-red-700 bg-white rounded text-[10px] font-semibold hover:bg-red-50 transition-all"
                      onClick={(ev) => handleNotifyToggle(ev, false)}
                      title="Turn off notifications"
                    >
                      <FontAwesomeIcon icon={faBellSlash} className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      className="px-2 py-1 border border-[#0071E3] text-[#0071E3] bg-white rounded text-[10px] font-semibold hover:bg-blue-50 transition-all"
                      onClick={(ev) => handleNotifyToggle(ev, true)}
                      title="Notify me when back in stock"
                    >
                      <FontAwesomeIcon icon={faBell} className="w-3 h-3" />
                    </button>
                  )
                ) : (
                  <button 
                    className="px-2 py-1 bg-gray-300 text-gray-500 rounded text-[10px] font-semibold cursor-not-allowed"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                  </button>
                )
              ) : (
                <>
                  <button
                    className="px-2 py-1 border border-gray-200 text-gray-700 bg-white rounded text-[10px] font-semibold hover:bg-gray-50 transition-all"
                    onClick={handleDirectAddToCart}
                    title="Order Now"
                  >
                    <FontAwesomeIcon icon={faCartShopping} className="w-3 h-3" />
                  </button>
                  <button
                    className="px-2 py-1 text-white rounded text-[10px] font-semibold bg-[#0071E3] hover:bg-[#005bb5] transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
                      if (!isLoggedIn) {
                        localStorage.setItem(
                          "postLoginAction",
                          JSON.stringify({ type: "make_offer", productId: id || product?._id })
                        );
                        const returnTo = encodeURIComponent(window.location.hash?.slice(1) || "/home");
                        return navigate(`/login?returnTo=${returnTo}`);
                      }
                      // Pass product with selected country, currency, and calculated price
                      onOpenBiddingForm({
                        ...product,
                        selectedCountry,
                        selectedCurrency,
                        calculatedPrice: (derivedPrice != null && derivedPrice > 0) ? derivedPrice : (product?.price ?? 0),
                      });
                    }}
                    title="Make offer"
                  >
                    <FontAwesomeIcon icon={faHandshake} className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  }

if (viewMode === "list") {
    return (
      <>
        <div
          className="w-full rounded-lg p-0 sm:p-3 bg-[#FBFBFB] border-gray-200"
        >
        <div
          className={`w-full bg-white rounded-lg shadow-sm transition-all duration-300 group border border-gray-100 overflow-hidden ${!isCardOutOfStock && !isInModal ? "cursor-pointer hover:shadow-md" : "cursor-default"}`}
          onClick={!isInModal && !isCardOutOfStock ? handleProductClick : undefined}
        >
            <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
              <div style={outOfStockVisualStyle} className="flex flex-col gap-2 sm:gap-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 hover:text-[#0071e3] transition-colors">{customerListingNumber}</div>
                  <h3 className="text-sm sm:text-base flex font-semibold text-gray-900 group-hover:text-[#0071e3] transition-colors duration-200 mb-1 leading-tight">
                    {name} <span className="hidden sm:flex text-xs font-normal text-gray-500"> - {description}</span>
                  </h3>
                  {product?.groupCode && (
                    <p 
                      className="text-xs text-blue-600 mt-0.5 font-medium cursor-pointer hover:text-blue-800 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onGroupCodeClick) {
                          onGroupCodeClick(product.groupCode, product);
                        }
                      }}
                      title="Click to view all products in this group"
                    >
                      Group: {product.groupCode} (Click to view all)
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 ml-3">
                  {/* <button
                    className="rounded-full transition-all duration-200 flex items-center justify-center"
                    title="Information"
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "90px",
                      padding: "6px",
                      background: "#FFFFFF",
                      boxShadow: "0px 2px 4px -2px #0000001A, 0px 4px 8px -2px #0000001A",
                      backdropFilter: "blur(8px)",
                      opacity: 1,
                    }}
                  >
                    <FiAlertCircle className="w-3.5 h-3.5" style={{ color: "#1F2937" }} />
                  </button> */}

                  <button
                    className={`rounded-full transition-all duration-200 flex items-center justify-center ${
                       isFavorite ? "text-[#FB2C36]" : "text-[#1F2937] hover:text-[#FB2C36]"
                    }`}
                    title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
                    onClick={handleToggleWishlist}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "90px",
                      background: "#FFFFFF",
                      boxShadow: "0px 2px 4px -2px #0000001A, 0px 4px 8px -2px #0000001A",
                      backdropFilter: "blur(8px)",
                      opacity: 1,
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                    </svg>
                  </button>

                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusBadgeClass()}`}>
                    {isExpired ? (
                      <FontAwesomeIcon icon={faCalendarXmark} className="w-2.5 h-2.5 mr-0.5" />
                    ) : (
                      <svg className="w-2.5 h-2.5 mr-0.5" viewBox="0 0 512 512" fill="currentColor">
                        <path d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z" />
                      </svg>
                    )}
                    {getDisplayStatus()}
                  </span>
                </div>
              </div>

              {/* Price, Colors, Quantity */}
              <div className="flex flex-wrap justify-between sm:justify-start items-center gap-2 sm:gap-3 mt-1 sm:mt-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] sm:text-xs text-gray-500">Start from</span>
                  <span className="text-base sm:text-lg font-semibold text-green-600">{convertPrice(selectedPrice || price)}</span>
                </div>
                <div className="hidden sm:block w-px h-3 bg-gray-300" />
                  <div className="hidden sm:block text-xs flex font-medium text-gray-900">
                    {[
                      getDisplayValue(product?.storage, 'storage'),
                      getDisplayValue(product?.ram, 'ram'),
                      getDisplayValue(product?.color, 'color'),
                      product?.simType,
                    ].filter(Boolean).join(' • ') || '-'}
                  </div>
                <div className="hidden sm:block w-px h-3 bg-gray-300" />
                
                {/* QUANTITY SELECTOR */}
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={(e) => { e.stopPropagation(); decQty(); }}
                    className="px-2 py-1 text-[11px] sm:text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    disabled={isFullPurchase || quantity <= validMoq}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    onChange={onQtyInput}
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 sm:w-12 px-1 py-1 text-center text-xs sm:text-sm font-medium bg-transparent outline-none"
                    readOnly={isFullPurchase}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); incQty(); }}
                    className="px-2 py-1 text-[11px] sm:text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    disabled={isFullPurchase || quantity >= validStock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="sm:hidden text-xs flex font-medium text-gray-900">
                    {[
                      getDisplayValue(product?.storage, 'storage'),
                      getDisplayValue(product?.ram, 'ram'),
                      getDisplayValue(product?.color, 'color'),
                      product?.simType,
                    ].filter(Boolean).join(' • ') || '-'}
                  </div>

              {/* Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2 w-full">
                <div className="hidden sm:block rounded-lg p-1.5 text-center flex-1 flex flex-col justify-center" style={{ background: "#FAFDFF", border: "1px solid #E3F4FF", borderRadius: "6px" }}>
                  <div className="text-[10px] text-gray-600 mb-0.5">Condition</div>
                  <div className="text-xs font-semibold text-gray-900">{product?.condition || "-"}</div>
                </div>
                
                <div className="hidden sm:block rounded-lg p-1.5 text-center flex-1 flex flex-col justify-center" style={{ background: "#FAFDFF", border: "1px solid #E3F4FF", borderRadius: "6px" }}>
                  <div className="text-[10px] text-gray-600 mb-0.5">Warehouse</div>
                  <div className="text-xs font-semibold text-gray-900 flex items-center justify-center">
                    <span className="w-2 h-2 bg-red-500 rounded-sm mr-1"></span>
                    {product?.countryName || product?.country || '—'}
                  </div>
                </div>
                <div className="hidden sm:block rounded-lg p-1.5 text-center flex-1 flex flex-col justify-center" style={{ background: "#FAFDFF", border: "1px solid #E3F4FF", borderRadius: "6px" }}>
                  <div className="text-[10px] text-gray-600 mb-0.5">MOQ / Stock</div>
                  <div className="text-xs font-semibold text-gray-900">{moq} / {stockCount}</div>
                </div>
                <div className="hidden md:block rounded-lg p-1.5 text-center flex-1 flex flex-col justify-center" style={{ background: "#FAFDFF", border: "1px solid #E3F4FF", borderRadius: "6px" }}>
                  <div className="text-[10px] text-gray-600 mb-0.5">Delivery EST</div>
                  <div className="text-xs font-semibold text-gray-900">3-5 Days</div>
                </div>
                <div className="hidden sm:block rounded-lg p-1.5 text-center flex-1 flex flex-col justify-center" style={{ background: "#FAFDFF", border: "1px solid #E3F4FF", borderRadius: "6px" }}>
                  <div className="text-[10px] text-gray-600 mb-0.5">Partial Purchase</div>
                  <div className="text-xs font-semibold text-gray-900">{(product?.purchaseType || '').toLowerCase() === 'partial' ? 'Allowed' : 'Not Allowed'}</div>
                </div>
              </div>

              <div className="sm:hidden flex flex-wrap gap-1">
                <button className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-medium">{product?.condition}</button>
                <button className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-medium">{product?.countryName}</button>
                <button className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-medium">MOQ: {moq}</button>
                <button className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-medium">Stock: {stockCount}</button>
              </div>

              {!isExpired && !effectiveOutOfStock && shouldShowTimer && product.expiryTime && (
                <div className="mb-2 flex justify-center">
                  <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-3 py-1.5 rounded-full text-[10px] font-semibold shadow-sm border border-red-200 w-full justify-center">
                    <FontAwesomeIcon icon={faClock} className="w-2.5 h-2.5 mr-1.5" />
                    <Countdown
                      date={product.expiryTime}
                      renderer={({ days, hours, minutes, seconds, completed }) => {
                        if (completed) {
                          return (
                            <span className="font-semibold">Ended</span>
                          );
                        }
                        return (
                          <span className="font-semibold">
                            {days > 0 ? `${days}d ` : ""}
                            {String(hours).padStart(2, "0")}:
                            {String(minutes).padStart(2, "0")}:
                            {String(seconds).padStart(2, "0")}
                          </span>
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              </div>
              {/* Action Buttons */}
              <div className="flex flex-row gap-2 sm:gap-3 sm:mt-3 mt-2">
                {isExpired ? (
                  <button className="w-full sm:flex-1 bg-gray-300 text-gray-500 py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold cursor-not-allowed flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <FontAwesomeIcon icon={faCalendarXmark} className="w-3 h-3 mr-1.5" />
                    Expired
                  </button>
                ) : effectiveOutOfStock ? (
                  canNotify ? (
                    notify ? (
                      <button
                        className="w-full sm:flex-1 border border-red-300 text-red-700 bg-white py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold hover:bg-red-50 cursor-pointer transition-all duration-200 flex items-center justify-center"
                        onClick={(ev) => handleNotifyToggle(ev, false)}
                      >
                        <FontAwesomeIcon icon={faBellSlash} className="w-3 h-3 mr-1.5" />
                        Turn Off
                      </button>
                    ) : (
                      <button
                        className="w-full sm:flex-1 border border-[#0071E3] text-[#0071E3] bg-white py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold hover:bg-blue-50 cursor-pointer transition-all duration-200 flex items-center justify-center"
                        onClick={(ev) => handleNotifyToggle(ev, true)}
                      >
                        <FontAwesomeIcon icon={faBell} className="w-3 h-3 mr-1.5" />
                        Notify Me
                      </button>
                    )
                  ) : (
                    <button className="w-full sm:flex-1 bg-gray-300 text-gray-500 py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold cursor-not-allowed flex items-center justify-center">
                      <FontAwesomeIcon icon={faXmark} className="w-3 h-3 mr-1.5" />
                      Out of Stock
                    </button>
                  )
                ) : (
                  <>
                    <button
                      className="w-full sm:flex-1 border border-gray-200 text-gray-700 bg-white py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all duration-200 flex items-center justify-center"
                      onClick={handleDirectAddToCart}
                    >
                      <FontAwesomeIcon icon={faCartShopping} className="w-3 h-3 mr-1.5" />
                      Order Now
                    </button>
                    <button
                      className="w-full sm:flex-1 text-white py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md bg-[#0071E3] hover:bg-[#005bb5] flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
                        if (!isLoggedIn) {
                          localStorage.setItem(
                            "postLoginAction",
                            JSON.stringify({ type: "make_offer", productId: id || product?._id })
                          );
                          const returnTo = encodeURIComponent(window.location.hash?.slice(1) || "/home");
                          return navigate(`/login?returnTo=${returnTo}`);
                        }
                        // Pass product with selected country, currency, and calculated price
                        onOpenBiddingForm({
                          ...product,
                          selectedCountry,
                          selectedCurrency,
                          calculatedPrice: (derivedPrice != null && derivedPrice > 0) ? derivedPrice : (product?.price ?? 0),
                        });
                      }}
                    >
                      Make Offer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-sm transition-all duration-300 group overflow-hidden flex flex-col w-full h-full p-3 pb-3 box-border ${getCardBackgroundClass()} ${!isCardOutOfStock && !isInModal ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed"}`}
      onClick={!isInModal && !isCardOutOfStock ? handleProductClick : undefined}
    >
      <div style={outOfStockVisualStyle} className="flex flex-col flex-1 w-full h-full">
        {/* Image Container */}
        <div className="relative overflow-hidden mb-3 flex-shrink-0 w-full h-[200px] rounded-lg bg-gray-50">
          <img
            className="w-full h-full object-contain"
            src={
              imageError
                ? iphoneImage
                : `${import.meta.env.VITE_BASE_URL}/${imageUrl}`
            }
            alt={name}
            onError={handleImageError}
          />
          
          {/* In Stock Badge */}
          <div className="flex absolute top-2 left-2">
            <span
              className={`inline-flex items-center px-1.5 py-1 rounded-full text-[10px] font-semibold ${getStatusBadgeClass()}`}
            >
              
              {isExpired ? (
                <FontAwesomeIcon
                  icon={faCalendarXmark}
                  className="w-2.5 h-2.5 mr-0.5"
                />
              ) : (
                <svg
                  data-prefix="fas"
                  data-icon="circle-check"
                  className="w-2.5 h-2.5 mr-1.5"
                  role="img"
                  viewBox="0 0 512 512"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z"
                  ></path>
                </svg>
              )}
              {getDisplayStatus()}
              
              
            </span>
          </div>
          
          {/* Bookmark/Wishlist Icon */}
          <div className="absolute top-2 right-2">
            <button
              className={`p-1.5 bg-white rounded-full cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 ${
                isFavorite ? "text-[#FB2C36]" : "text-gray-400 hover:text-[#FB2C36]"
              } w-[32px] h-[32px] flex items-center justify-center border border-gray-200`}
              onClick={handleToggleWishlist}
            >
              <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 w-full gap-2 min-h-0">
          <div className="font-semibold text-sm text-gray-900 hover:text-[#0071e3] transition-colors">{customerListingNumber}</div>

          {/* Product Title */}
          <h3 className="font-semibold text-sm leading-tight tracking-normal text-[#364153] line-clamp-2">
            {name} <span className="text-xs font-normal text-gray-500"> - {description}</span>
          </h3>
          {product?.groupCode && (
            <p 
              className="text-xs text-blue-600 font-medium cursor-pointer hover:text-blue-800 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                if (onGroupCodeClick) {
                  onGroupCodeClick(product.groupCode, product);
                }
              }}
              title="Click to view all products in this group"
            >
              Group: {product.groupCode} (Click to view all)
            </p>
          )}

          {/* Country Selector */}
          <div className="flex items-center gap-2">
            {countryOptions.map((country) => (
              <button
                key={country}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCountry(country);
                }}
                className={`px-3 py-2 w-[50%] rounded-md text-[11px] font-semibold border transition ${
                  selectedCountry === country
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {country}
              </button>
            ))}
          </div>

          {/* Currency Selector (depends on country) */}
          <div className="flex items-center gap-2">
            {(currencyOptionsByCountry[selectedCountry] || []).map((currency) => (
              <button
                key={currency}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCurrency(currency);
                }}
                className={`px-3 py-2 w-[50%] rounded-md text-[11px] font-semibold border transition ${
                  selectedCurrency === currency
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {currency}
              </button>
            ))}
          </div>

          {/* Price Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500">Price</span>
              <span className="text-base font-semibold text-gray-900">
                {displayPriceText}
              </span>
            </div>
            <div>
              {/* product color  */}
              <div className="text-xs flex font-medium text-gray-900 bg-gray-100 px-1 py-0.5 rounded-md">
                {getDisplayValue(product?.color, 'color')}
              </div>
            </div>
          </div>

        {/* Color Options and SKU */}
        {/* <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
            <div className="flex space-x-1">
              {availableColors.length > 0 ? (
                availableColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={(e) => handleColorSelect(e, color.value)}
                    className={`w-3 h-3 rounded-full border transition-all ${
                      selectedColor.toLowerCase() === color.value
                        ? 'border-blue-500 scale-110 border-2'
                        : 'border-gray-300 hover:border-gray-400 border'
                    } ${
                      color.value === 'black' ? 'bg-black' :
                      color.value === 'white' ? 'bg-white' :
                      color.value === 'gold' ? 'bg-gradient-to-br from-yellow-300 to-yellow-600' :
                      color.value === 'silver' ? 'bg-gray-400' :
                      color.value === 'blue' ? 'bg-blue-500' :
                      color.value === 'red' ? 'bg-red-500' :
                      color.value === 'green' ? 'bg-green-500' :
                      color.value === 'purple' ? 'bg-purple-500' :
                      'bg-gray-600'
                    } flex items-center justify-center`}
                    title={color.name}
                  >
                    {selectedColor.toLowerCase() === color.value && (
                      <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                // Fallback to static colors if no variants available
                <>
                  <div className="w-3 h-3 bg-gray-600 rounded-full border border-gray-300"></div>
                  <div className="w-3 h-3 bg-white rounded-full border border-gray-300"></div>
                  <div className="w-3 h-3 bg-orange-500 rounded-full border border-gray-300 flex items-center justify-center">
                    <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="w-3 h-3 bg-black rounded-full border border-gray-300"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full border border-gray-300"></div>
                </>
              )}
            </div>
          </div>
        </div> */}

          {!isExpired && !effectiveOutOfStock && shouldShowTimer && product.expiryTime && (
            <div className="mb-2 flex justify-center">
              <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-3 py-1.5 rounded-full text-[10px] font-semibold shadow-sm border border-red-200 w-full justify-center">
                <FontAwesomeIcon icon={faClock} className="w-2.5 h-2.5 mr-1.5" />
                <Countdown
                  date={product.expiryTime}
                  renderer={({ days, hours, minutes, seconds, completed }) => {
                    if (completed) {
                      return (
                        <span className="font-semibold">Ended</span>
                      );
                    }
                    return (
                      <span className="font-semibold">
                        {days > 0 ? `${days}d ` : ""}
                        {String(hours).padStart(2, "0")}:
                        {String(minutes).padStart(2, "0")}:
                        {String(seconds).padStart(2, "0")}
                      </span>
                    );
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Button Container */}
      <div className="flex mt-auto w-full gap-2">
        {isExpired ? (
          <>
            <button
              className="flex-1 bg-gray-300 text-gray-500 py-1.5 px-2 rounded-lg text-[11px] font-semibold cursor-not-allowed flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <FontAwesomeIcon icon={faCalendarXmark} className="w-3 h-3 mr-1" />
              Expired
            </button>
          </>
        ) : effectiveOutOfStock ? (
          <>
            {notify ? (
              <button
                className="flex-1 border border-red-300 text-red-700 bg-white py-1.5 px-2 rounded-lg text-[11px] font-semibold hover:bg-red-50 cursor-pointer transition-all duration-200 flex items-center justify-center"
                onClick={(ev) => handleNotifyToggle(ev, false)}
                title="Turn off notifications for notifying me when back in stock"
              >
                <FontAwesomeIcon icon={faBellSlash} className="w-3 h-3 mr-1" />
                Turn Off
              </button>
            ) : (
              <button
                className="flex-1 border border-[#0071E3] text-[#0071E3] bg-white py-1.5 px-2 rounded-lg text-[11px] font-semibold hover:bg-blue-50 cursor-pointer transition-all duration-200 flex items-center justify-center"
                onClick={(ev) => handleNotifyToggle(ev, true)}
                title="Notify me when back in stock"
              >
                <FontAwesomeIcon icon={faBell} className="w-3 h-3 mr-1" />
                Notify Me
              </button>
            )}
          </>
        ) : (
          <>
            <button
              className="flex-1 border border-gray-200 text-gray-700 bg-white py-1.5 px-2 rounded-lg text-[11px] font-semibold hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all duration-200 flex items-center justify-center"
              onClick={handleAddToCart}
            >
              <FontAwesomeIcon icon={faCartShopping} className="w-3 h-3 mr-1" />
              Order Now
            </button>
            <button
              className="flex-1 text-white py-1.5 px-2 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md bg-[#0071E3] hover:bg-[#005bb5] flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                const isLoggedIn =
                  localStorage.getItem("isLoggedIn") === "true";
                if (!isLoggedIn) {
                  const hashPath = window.location.hash?.slice(1) || "/home";
                  const returnTo = encodeURIComponent(hashPath);
                  return navigate(`/login?returnTo=${returnTo}`);
                }
                // Pass product with selected country, currency, and calculated price
                onOpenBiddingForm({
                  ...product,
                  selectedCountry,
                  selectedCurrency,
                  calculatedPrice: (derivedPrice != null && derivedPrice > 0) ? derivedPrice : (product?.price ?? 0),
                });
              }}
            >
              Make Offer
            </button>
          </>
        )}
      </div>
      {isAddToCartPopupOpen && (
        <AddToCartPopup 
          product={{
            ...product,
            price: (derivedPrice != null && derivedPrice > 0) ? derivedPrice : (product?.price ?? 0),
            selectedCountry,
            selectedCurrency,
            countryDeliverables: deliverables, // Pass deliverables for fallback price calculation
          }} 
          onClose={handlePopupClose} 
        />
      )}
    </div>
  );
};

export default ProductCard;
