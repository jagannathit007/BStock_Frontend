import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as solidHeart,
  faHeart as regularHeart,
  faCartShopping,
  faHandshake,
  faBell,
  faXmark,
  faCalendarXmark,
} from "@fortawesome/free-solid-svg-icons";
import AddToCartPopup from "./AddToCartPopup";
import { ProductService } from "../../services/products/products.services";
import CartService from "../../services/cart/cart.services";

const ProductCard = ({ product, viewMode = "grid" }) => {
  const navigate = useNavigate();
  const [isAddToCartPopupOpen, setIsAddToCartPopupOpen] = useState(false);

  const {
    id,
    name,
    description,
    price,
    originalPrice,
    discount,
    moq,
    stockStatus,
    stockCount,
    imageUrl,
    isFavorite,
    isOutOfStock,
    // expiryTime,
    isExpired,
  } = product;

  // Check if product can accept notifications (out of stock but not expired)
  const canNotify = isOutOfStock && !isExpired;

  const getStatusBadgeClass = () => {
    if (isExpired) {
      return "bg-gray-100 text-gray-800";
    }
    switch (stockStatus) {
      case "In Stock":
        return "bg-green-100 text-green-800";
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800";
      case "Out of Stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDisplayStatus = () => {
    if (isExpired) {
      return "Expired";
    }
    return stockStatus;
  };

  const handleProductClick = (e) => {
    if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
      return;
    }
    navigate(`/product/${id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isOutOfStock && !isExpired) {
      setIsAddToCartPopupOpen(true);
    }
  };

  const handleNotifyMe = async (e) => {
    e.stopPropagation();
    if (!canNotify) return;
    try {
      await ProductService.createNotification({ productId: id, notifyType: 'stock_alert', notify: true });
    } catch (err) {
      // errors are toasted in service
    }
  };

  // Handle popup close and refresh cart count
  const handlePopupClose = async () => {
    setIsAddToCartPopupOpen(false);
    try {
      const count = await CartService.count();
      console.log(`Cart count updated: ${count}`);
    } catch (error) {
      console.error("Refresh cart count error:", error);
    }
  };

  if (viewMode === "list") {
    return (
      <>
        <tr
          className="hover:bg-gray-50 cursor-pointer"
          onClick={handleProductClick}
        >
          <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="flex items-center min-w-[200px]">
              <img
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg mr-4"
                src={imageUrl}
                alt={name}
              />
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {name}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {description.split("•")[1]?.trim()}
                </div>
                <div className="flex items-center mt-1 sm:mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}
                  >
                    {isExpired && (
                      <FontAwesomeIcon icon={faCalendarXmark} className="w-3 h-3 mr-1" />
                    )}
                    {getDisplayStatus()}
                  </span>
                </div>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900 font-medium truncate">
              {description.split("•")[0]?.trim()}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 truncate">
              Grade A+
            </div>
            <div className="text-xs sm:text-sm text-gray-500 truncate">
              Unlocked
            </div>
          </td>
          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="text-base sm:text-lg font-bold text-gray-900">
              ${price}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 line-through">
              ${originalPrice}
            </div>
            <span className="text-xs text-green-600 font-medium">
              Save ${discount}
            </span>
          </td>
          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div
              className={`text-sm font-medium ${
                stockStatus === "In Stock"
                  ? "text-green-600"
                  : stockStatus === "Low Stock"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {stockCount} units
            </div>
            <div className="text-xs text-gray-500">
              {isExpired ? "Expired" : stockStatus === "Low Stock" ? "Low stock" : "Available"}
            </div>
          </td>
          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{moq} units</div>
            <div className="text-xs text-gray-500">Minimum</div>
          </td>
          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="flex space-x-1 sm:space-x-2">
              {isExpired ? (
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 p-1 sm:p-2 rounded-lg cursor-not-allowed"
                >
                  <FontAwesomeIcon
                    icon={faCalendarXmark}
                    className="text-sm sm:text-base"
                  />
                </button>
              ) : isOutOfStock ? (
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 p-1 sm:p-2 rounded-lg cursor-not-allowed"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="text-sm sm:text-base"
                  />
                </button>
              ) : (
                <button
                  className="bg-[#0071E0] text-white p-1 sm:p-2 rounded-lg hover:bg-blue-600"
                  onClick={handleAddToCart}
                >
                  <FontAwesomeIcon
                    icon={faCartShopping}
                    className="text-sm sm:text-base"
                  />
                </button>
              )}
              
              {canNotify ? (
                <button 
                  className="border border-gray-300 text-gray-700 p-1 sm:p-2 rounded-lg hover:bg-gray-50"
                  onClick={handleNotifyMe}
                >
                  <FontAwesomeIcon
                    icon={faBell}
                    className="text-sm sm:text-base"
                  />
                </button>
              ) : !isExpired && !isOutOfStock ? (
                <button className="border border-gray-300 text-gray-700 p-1 sm:p-2 rounded-lg hover:bg-gray-50">
                  <FontAwesomeIcon
                    icon={faHandshake}
                    className="text-sm sm:text-base"
                  />
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-200 text-gray-400 p-1 sm:p-2 rounded-lg cursor-not-allowed"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="text-sm sm:text-base"
                  />
                </button>
              )}
            </div>
          </td>
        </tr>
        {isAddToCartPopupOpen && (
          <AddToCartPopup
            product={product}
            onClose={handlePopupClose}
          />
        )}
      </>
    );
  }

  return (
    <div
      className="bg-white rounded-[18px] shadow-[2px_4px_12px_#00000014] hover:shadow-[6px_8px_24px_#00000026] transition-shadow duration-200 h-full flex flex-col cursor-pointer"
      onClick={handleProductClick}
    >
      <div className="relative flex-1">
        <img
          className="w-full h-40 sm:h-48 object-cover rounded-t-[18px]"
          src={imageUrl}
          alt={name}
        />
        <div className="absolute top-2 right-2">
          <button
            className="p-2 bg-white rounded-full cursor-pointer shadow-md text-gray-400 hover:text-red-500 w-10 h-10 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              // Handle favorite toggle here
            }}
          >
            <FontAwesomeIcon
              icon={isFavorite ? solidHeart : regularHeart}
              className="text-sm sm:text-base"
            />
          </button>
        </div>
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}
          >
            {isExpired && (
              <FontAwesomeIcon icon={faCalendarXmark} className="w-3 h-3 mr-1" />
            )}
            {getDisplayStatus()}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 truncate">
          {name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">
          {description}
        </p>

        <div className="flex items-center mb-2">
          <span className="text-base sm:text-lg font-bold text-gray-900">
            ${price}
          </span>
          <span className="ml-2 text-xs sm:text-sm text-gray-500 line-through">
            ${originalPrice}
          </span>
          <span className="ml-2 text-xs text-green-600 font-medium">
            Save ${discount}
          </span>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          MOQ: {moq} units • {stockCount} available
          {isExpired && (
            <span className="ml-2 text-red-500">• Expired</span>
          )}
        </div>

        <div className="flex space-x-2">
          {isExpired ? (
            <>
              <button
                className="flex-1 bg-gray-300 text-gray-500 py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium cursor-not-allowed"
                onClick={(e) => e.stopPropagation()}
              >
                <FontAwesomeIcon icon={faCalendarXmark} className="mr-1" />
                Expired
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-400 py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium cursor-not-allowed"
                onClick={(e) => e.stopPropagation()}
              >
                Unavailable
              </button>
            </>
          ) : isOutOfStock ? (
            <>
              <button
                className="flex-1 bg-gray-300 text-gray-500 py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium cursor-not-allowed"
                onClick={(e) => e.stopPropagation()}
              >
                Out of Stock
              </button>
              <button
                className="flex-1 border border-gray-300 text-gray-700 py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium hover:bg-gray-50 cursor-pointer"
                onClick={handleNotifyMe}
              >
                <FontAwesomeIcon icon={faBell} className="mr-1" />
                Notify Me
              </button>
            </>
          ) : (
            <>
              <button
                className="flex-1 border border-gray-300 text-gray-700 py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium hover:bg-gray-50 cursor-pointer"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
              <button
                className="flex-1 bg-[#0071E0] text-white py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium hover:bg-blue-600 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                Offer
              </button>
            </>
          )}
        </div>
      </div>
      {isAddToCartPopupOpen && (
        <AddToCartPopup
          product={product}
          onClose={handlePopupClose}
        />
      )}
      {/* NotifyMePopup removed - direct API call on button click */}
    </div>
  );
};

export default ProductCard;
