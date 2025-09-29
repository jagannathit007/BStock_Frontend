import React, { useState } from "react";
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
import iphoneImage from "../../assets/iphone.png";

const AddToCartPopup = ({ product, onClose }) => {
  const { id, name, price, imageUrl, moq, stockCount, description } = product;
  const purchaseType = (product?.purchaseType || '').toLowerCase();
  const isFullPurchase = purchaseType === 'full';

  // Ensure moq and stockCount are valid numbers, default to 1 and Infinity if invalid
  const validMoq = isNaN(parseInt(moq)) ? 1 : parseInt(moq);
  const validStockCount = isNaN(parseInt(stockCount)) ? Infinity : parseInt(stockCount);
  const [quantity, setQuantity] = useState(isFullPurchase ? validStockCount : validMoq);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Ensure price is a valid number, default to 0 if invalid
  const validPrice = isNaN(parseFloat(price)) ? 0 : parseFloat(price);

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
      const res = await CartService.add(id, quantity);
      const ok = res?.success === true || res?.status === 200;
      if (ok) {
        onClose();
      } else {
        setError(res?.message || "Failed to add to cart");
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || "An error occurred");
      console.error("Add to cart error:", error);
    }
  };

  const totalPrice = (validPrice * quantity).toFixed(2);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-[70] transition-opacity duration-300 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 hover:scale-[1.01]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <FontAwesomeIcon
                icon={faCartShopping}
                className="w-5 h-5 text-blue-600"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Add to Cart
            </h2>
          </div>
          <button
            className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
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
                className="w-24 h-24 object-cover rounded-xl shadow-sm border border-gray-100"
                src={imageError ? iphoneImage : `${import.meta.env.VITE_BASE_URL}/${imageUrl}`}
                alt={name || "Product"}
                onError={handleImageError}
              />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                {name || "Unnamed Product"}
              </h3>
              {purchaseType && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isFullPurchase ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                  Purchase: {isFullPurchase ? 'Full' : 'Partial'}
                </div>
              )}
              <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  className="w-5 h-5 text-green-600"
                />
                {validPrice.toFixed(2)}
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                  <FontAwesomeIcon icon={faBox} className="w-3 h-3" />
                  {validStockCount === Infinity ? "Unlimited" : validStockCount} in stock
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  MOQ: {validMoq} units
                </div>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              {isFullPurchase ? 'Quantity (locked to full stock)' : 'Select Quantity'}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={isFullPurchase || quantity <= validMoq}
                className="w-10 h-10 flex items-center justify-center cursor-pointer rounded-full border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
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
                  className={`w-full text-center text-lg font-semibold py-3 px-4 border-2 rounded-xl focus:outline-none transition-all duration-200 ${isFullPurchase ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
                />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 px-1">
                  {isFullPurchase
                    ? 'Full purchase'
                    : `Min: ${validMoq} | Max: ${validStockCount === Infinity ? 'Unlimited' : validStockCount}`}
                </div>
              </div>

              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={isFullPurchase || quantity >= validStockCount}
                className="w-10 h-10 flex items-center justify-center cursor-pointer rounded-full border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  className="w-4 h-4 text-gray-600"
                />
              </button>
            </div>
          </div>

          {/* Total Price */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">
                Total Price:
              </span>
              <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  className="w-5 h-5 text-green-600"
                />
                {totalPrice}
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {quantity} × ${validPrice.toFixed(2)} per unit
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            className="flex-1 bg-[#0071E0] hover:bg-[#005bb5] cursor-pointer text-white py-3 px-5 rounded-lg font-medium text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            onClick={handleConfirm}
          >
            <FontAwesomeIcon icon={faCartShopping} />
            Add to Cart
          </button>

          <button
            className="px-5 py-3 border border-gray-300 text-gray-700 cursor-pointer rounded-lg font-medium text-base hover:bg-gray-100 transition-all duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCartPopup;