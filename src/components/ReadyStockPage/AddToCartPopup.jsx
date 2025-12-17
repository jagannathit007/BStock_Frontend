import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faTimes,
  faPlus,
  faMinus,
  faBox,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";
import CartService from "../../services/cart/cart.services";
import { AuthService } from "../../services/auth/auth.services";
import iphoneImage from "../../assets/iphone.png";
import { getCurrencySymbol } from "../../utils/currencyUtils";
import { getSubSkuFamilyId } from "../../utils/productUtils";

const AddToCartPopup = ({ product, onClose }) => {
  const navigate = useNavigate();
  const { id, name, price, imageUrl, moq, stockCount, description, selectedCountry, selectedCurrency } = product;
  const purchaseType = (product?.purchaseType || '').toLowerCase();
  const isFullPurchase = purchaseType === 'full';

  // Ensure moq and stockCount are valid numbers, default to 1 and Infinity if invalid
  const validMoq = isNaN(parseInt(moq)) ? 1 : parseInt(moq);
  const validStockCount = isNaN(parseInt(stockCount)) ? Infinity : parseInt(stockCount);
  const [quantity, setQuantity] = useState(isFullPurchase ? validStockCount : validMoq);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      setMounted(false);
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleImageError = () => {
    setImageError(true);
  };

  // Get price from product - use the passed price (which should be country/currency-specific)
  // If price is not available, try to get it from countryDeliverables
  let validPrice = 0;
  
  // First, try to use the passed price (should be derived price from parent component)
  if (price != null && !isNaN(parseFloat(price)) && parseFloat(price) > 0) {
    validPrice = parseFloat(price);
  }
  // If price is 0 or not available, try to get from countryDeliverables
  else if (product?.countryDeliverables && selectedCountry && selectedCurrency) {
    const normalize = (val) => (typeof val === "string" ? val.trim().toLowerCase() : "");
    const deliverables = Array.isArray(product.countryDeliverables) ? product.countryDeliverables : [];
    const selectedDeliverable = deliverables.find(
      (d) =>
        normalize(d.country) === normalize(selectedCountry) &&
        normalize(d.currency) === normalize(selectedCurrency)
    );
    const derivedPrice = selectedDeliverable?.calculatedPrice ?? selectedDeliverable?.basePrice ?? null;
    if (derivedPrice != null && !isNaN(parseFloat(derivedPrice)) && parseFloat(derivedPrice) > 0) {
      validPrice = parseFloat(derivedPrice);
    }
  }
  
  // Final fallback to product base price if still 0
  if (validPrice === 0 && product?.price && !isNaN(parseFloat(product.price)) && parseFloat(product.price) > 0) {
    validPrice = parseFloat(product.price);
  }
  
  // Ensure validPrice is a number
  validPrice = isNaN(validPrice) ? 0 : validPrice;

  // Format price in original currency (no conversion - price is already in selected currency)
  const formatPriceInCurrency = (priceValue) => {
    const numericPrice = parseFloat(priceValue) || 0;
    const currency = selectedCurrency || 'USD';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${numericPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleQuantityChange = (value) => {
    if (isFullPurchase) {
      // Lock quantity for full purchase
      setQuantity(validStockCount);
      return;
    }
    const newValue = isNaN(parseInt(value)) ? validMoq : parseInt(value);
    if (newValue >= validMoq && newValue <= validStockCount) {
      setQuantity(newValue);
    }
  };

  const handleInputChange = (e) => {
    if (isFullPurchase) {
      // Ignore manual edits for full purchase
      setQuantity(validStockCount);
      return;
    }
    const value = e.target.value;
    if (value === "") {
      setQuantity(validMoq);
      return;
    }
    const parsedValue = parseInt(value, 10);
    handleQuantityChange(parsedValue);
  };

  const handleConfirm = async () => {
    try {
      setError(null);
      
      // Check if profile is complete
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          const isProfileComplete = AuthService.isProfileComplete(userData);
          if (!isProfileComplete) {
            onClose();
            navigate('/profile', { replace: true });
            return;
          }
        } catch (error) {
          console.error('Error checking profile completion:', error);
        }
      }
      
      // Extract subSkuFamilyId from product using utility function
      // This handles the new structure where subSkuFamily is inside skuFamily.subSkuFamilies array
      const rawProduct = product?._product || product;
      const subSkuFamilyId = getSubSkuFamilyId(rawProduct);
      
      // Validate price before sending
      if (!validPrice || validPrice <= 0) {
        setError("Product price is not available. Please select a valid country and currency.");
        return;
      }
      
      // Get the calculated price (should be set from parent component)
      const priceToSend = validPrice;
      const countryToSend = product?.selectedCountry || null;
      const currencyToSend = product?.selectedCurrency || null;
      
      const res = await CartService.add(id, quantity, subSkuFamilyId, priceToSend, countryToSend, currencyToSend);
      const ok = res?.success === true || res?.status === 200;
      if (ok) {
        // Trigger cart count update event
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cartUpdated', Date.now().toString());
        onClose();
      } else {
        // Show detailed error including MOQ validation
        const errorMessage = res?.message || res?.data?.message || "Failed to add to cart";
        setError(errorMessage);
      }
    } catch (error) {
      // Show detailed error including MOQ validation
      const errorMessage = error.response?.data?.message || error.message || "An error occurred";
      setError(errorMessage);
      console.error("Add to cart error:", error);
    }
  };

  const totalPrice = validPrice * quantity;

  if (!mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-[9999] transition-opacity duration-300 p-4 animate-fadeIn"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all duration-300 scale-100 border border-gray-200 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Order Now
          </h2>
          <button
            className="w-10 h-10 flex items-center cursor-pointer justify-center rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <img
                className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm"
                src={imageError ? iphoneImage : `${import.meta.env.VITE_BASE_URL}/${imageUrl}`}
                alt={name || "Product"}
                onError={handleImageError}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {name || "Unnamed Product"}
              </h3>
              {purchaseType && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${isFullPurchase ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                  Purchase: {isFullPurchase ? 'Full' : 'Partial'}
                </div>
              )}
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 mt-1">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  className="w-4 h-4 text-green-600"
                />
                {formatPriceInCurrency(validPrice)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <FontAwesomeIcon icon={faBox} className="w-3 h-3" />
                <span>{validStockCount === Infinity ? "Unlimited" : validStockCount} in stock</span>
                <span className="mx-1">•</span>
                <span>MOQ: {validMoq}</span>
              </div>
              {product?.groupCode && (
                <div className="text-xs text-gray-600 mt-1">
                  Group: {product.groupCode}
                  {product?.totalMoq && (
                    <span className="ml-2 text-yellow-700">
                      (Group MOQ: {product.totalMoq})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 font-apple">
              {isFullPurchase ? 'Quantity (locked to full stock)' : 'Select Quantity'}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={isFullPurchase || quantity <= validMoq}
                className="w-10 h-10 flex items-center justify-center cursor-pointer rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
              >
                <FontAwesomeIcon
                  icon={faMinus}
                  className="w-4 h-4 text-gray-600"
                />
              </button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  value={quantity}
                  onChange={handleInputChange}
                  min={isFullPurchase ? validStockCount : validMoq}
                  max={validStockCount}
                  readOnly={isFullPurchase}
                  disabled={isFullPurchase}
                  className={`w-full text-center text-lg font-semibold py-3 px-4 border border-gray-200 rounded-lg focus:outline-none transition-all duration-200 font-apple focus:border-primary focus:ring-2 focus:ring-primary/20 ${isFullPurchase ? 'bg-gray-50 text-gray-500' : ''}`}
                />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 px-2 bg-white rounded shadow-sm">
                  {isFullPurchase
                    ? 'Full purchase'
                    : `Min: ${validMoq} | Max: ${validStockCount === Infinity ? 'Unlimited' : validStockCount}`}
                </div>
              </div>

              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={isFullPurchase || quantity >= validStockCount}
                className="w-10 h-10 flex items-center justify-center cursor-pointer rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  className="w-4 h-4 text-gray-600"
                />
              </button>
            </div>
          </div>

          {/* Total Price */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-800 font-apple">
                Total Price:
              </span>
              <div className="flex items-center gap-1 text-xl font-bold text-gray-900">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  className="w-4 h-4 text-green-600"
                />
                {formatPriceInCurrency(totalPrice)}
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-1 font-apple">
              {quantity} × {formatPriceInCurrency(validPrice)} per unit
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 p-6 pt-0">
          <button
            className="flex-1 bg-[#0071e3] hover:bg-[#0056B3] cursor-pointer text-white py-4 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={handleConfirm}
          >
            <FontAwesomeIcon icon={faCartShopping} className="w-5 h-5" />
            Order Now
          </button>

          <button
            className="px-6 py-4 border border-gray-200 text-gray-700 cursor-pointer rounded-xl font-semibold text-base hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-105"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddToCartPopup;