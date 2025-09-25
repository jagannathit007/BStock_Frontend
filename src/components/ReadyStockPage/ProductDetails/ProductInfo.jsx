import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as solidHeart,
  faHeart as regularHeart,
  faCartShopping,
  faBolt,
  faCalendarXmark,
  faHandshake,
  faBell,
  faBellSlash,
  faXmark,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { ProductService } from "../../../services/products/products.services";
import NotifyMePopup from "../NotifyMePopup";
import BiddingForm from "../../negotiation/BiddingForm";
import AddToCartPopup from "../AddToCartPopup";

const ProductInfo = ({ product: initialProduct, navigate, onRefresh }) => {
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(initialProduct.moq || 5);
  const [isFavorite, setIsFavorite] = useState(initialProduct.wishList || false);
  const [notify, setNotify] = useState(Boolean(initialProduct.notify));
  const [isNotifyMePopupOpen, setIsNotifyMePopupOpen] = useState(false);
  const [isBiddingFormOpen, setIsBiddingFormOpen] = useState(false);
  const [isAddToCartPopupOpen, setIsAddToCartPopupOpen] = useState(false);

  // Process product data
  const processedProduct = {
    ...currentProduct,
    stockCount: Number(currentProduct.stock || 0),
    isOutOfStock: Number(currentProduct.stock || 0) <= 0,
    isExpired: currentProduct.expiryTime
      ? new Date(currentProduct.expiryTime) < new Date()
      : false,
    stockStatus: (() => {
      const stock = Number(currentProduct.stock || 0);
      const isExpired = currentProduct.expiryTime
        ? new Date(currentProduct.expiryTime) < new Date()
        : false;
      if (isExpired) return "Expired";
      if (stock <= 0) return "Out of Stock";
      if (stock <= 10) return "Low Stock";
      return "In Stock";
    })(),
    colorVariant: Array.isArray(currentProduct.colorVariant)
      ? currentProduct.colorVariant.join(", ")
      : currentProduct.colorVariant || "",
    networkBands: Array.isArray(currentProduct.networkBands)
      ? currentProduct.networkBands.join(", ")
      : currentProduct.networkBands || "",
  };

  const canNotify = processedProduct.isOutOfStock && !processedProduct.isExpired;

  useEffect(() => {
    setCurrentProduct(initialProduct);
    setQuantity(initialProduct.moq || 5);
    setIsFavorite(initialProduct.wishList || false);
    setNotify(Boolean(initialProduct.notify));
  }, [initialProduct]);

  useEffect(() => {
    const handleWishlistUpdate = async () => {
      try {
        const refreshed = await ProductService.getProductById(processedProduct.id);
        setCurrentProduct(refreshed);
        if (typeof onRefresh === "function") {
          onRefresh();
        }
      } catch (error) {
        console.error("Failed to refresh product:", error);
      }
    };
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, [processedProduct.id, onRefresh]);

  const handleQuantityChange = (amount) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= processedProduct.moq) {
      setQuantity(newQuantity);
    }
  };

  const handleNotifyToggle = async (e, nextValue) => {
    e.stopPropagation();
    if (!canNotify) return;

    const productId = processedProduct.id || processedProduct._id;

    try {
      await ProductService.createNotification({
        productId: productId,
        notifyType: "stock_alert",
        notify: nextValue,
      });
      setNotify(nextValue);
      try {
        const refreshed = await ProductService.getProductById(productId);
        setCurrentProduct(refreshed);
        if (typeof onRefresh === "function") {
          onRefresh();
        }
      } catch (refreshErr) {
        // ignore
      }
    } catch (err) {
      // errors toasted
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    const newWishlistStatus = !isFavorite;
    setIsFavorite(newWishlistStatus);
    try {
      await ProductService.toggleWishlist({
        productId: processedProduct.id || processedProduct._id,
        wishlist: newWishlistStatus,
      });
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
      setIsFavorite(!newWishlistStatus);
    }
  };

  const handleBiddingClick = (e) => {
    e.stopPropagation();
    setIsBiddingFormOpen(true);
  };

  const handleBiddingSuccess = () => {
    console.log("Bid submitted successfully");
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (processedProduct.isOutOfStock || processedProduct.isExpired) return;
    const customerId = localStorage.getItem('userId') || '';
    if (!customerId) {
      return navigate('/signin');
    }
    setIsAddToCartPopupOpen(true);
  };

  const popupProduct = {
    id: processedProduct.id || processedProduct._id,
    name: processedProduct.name,
    price: processedProduct.price,
    imageUrl: processedProduct.imageUrl || processedProduct.mainImage || "",
    moq: processedProduct.moq,
    stockCount: processedProduct.stockCount,
    description: processedProduct.description || "",
    notify: processedProduct.notify,
    purchaseType: processedProduct.purchaseType,
  };

  const totalAmount = (
    parseInt(processedProduct.price.toString().replace(/,/g, "")) * quantity
  ).toLocaleString();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Breadcrumb */}
      <div className="mb-4 md:mb-6 flex items-center text-sm cursor-pointer mt-3">
        <button
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          Home
        </button>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 font-medium">
          {processedProduct.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column - Image */}
        <div className="lg:col-span-5">
          <div className="relative mb-4">
            <img
              className="w-full h-64 sm:h-[450px] object-cover rounded-xl bg-white border border-gray-200"
              src={processedProduct.mainImage}
              alt={processedProduct.name}
            />
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {processedProduct.isVerified && (
                <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                  Verified Seller
                </span>
              )}
              {processedProduct.isFlashDeal && (
                <span className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded">
                  Flash Deal
                </span>
              )}
              <span
                className={`${
                  processedProduct.isExpired
                    ? "bg-gray-100 text-gray-800"
                    : processedProduct.stockStatus === "In Stock"
                    ? "bg-green-100 text-green-800"
                    : processedProduct.stockStatus === "Low Stock"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                } text-xs font-medium px-2 py-1 rounded inline-flex items-center`}
              >
                {processedProduct.isExpired && (
                  <FontAwesomeIcon
                    icon={faCalendarXmark}
                    className="w-3 h-3 mr-1"
                  />
                )}
                {processedProduct.isExpired
                  ? "Expired"
                  : processedProduct.stockStatus}
              </span>
            </div>
            <button
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
              onClick={handleToggleWishlist}
            >
              <FontAwesomeIcon
                icon={isFavorite ? solidHeart : regularHeart}
                className={`text-sm ${
                  isFavorite ? "text-red-500" : "text-gray-600"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
              {processedProduct.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {processedProduct.description}
            </p>
          </div>

          {/* Price Section */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4">
              <div className="mb-2 sm:mb-0">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ${processedProduct.price}
                </span>
                {processedProduct.originalPrice && (
                  <>
                    <span className="text-base sm:text-lg text-gray-500 line-through ml-2 sm:ml-3">
                      ${processedProduct.originalPrice}
                    </span>
                    <span className="bg-green-500 text-white text-xs sm:text-sm font-medium px-2 py-1 rounded ml-2 sm:ml-3">
                      -{processedProduct.discountPercentage}
                    </span>
                  </>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-gray-600">Price per unit</p>
                <p className="text-xs text-gray-500">Bulk discounts available</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">MOQ</span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {processedProduct.moq} units
                  </span>
                </div>
              </div>
              <div
                className={`${
                  processedProduct.isExpired
                    ? "bg-gray-50"
                    : processedProduct.stockCount > 10
                    ? "bg-green-50"
                    : processedProduct.stockCount > 0
                    ? "bg-yellow-50"
                    : "bg-red-50"
                } rounded-lg p-2 sm:p-3`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">Available</span>
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      processedProduct.isExpired
                        ? "text-gray-500"
                        : processedProduct.stockCount > 10
                        ? "text-green-500"
                        : processedProduct.stockCount > 0
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {processedProduct.stockCount} units
                  </span>
                </div>
              </div>
            </div>

            {processedProduct.expiryTime && (
              <div
                className={`p-3 rounded-lg mb-3 ${
                  processedProduct.isExpired
                    ? "bg-red-50 border border-red-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faCalendarXmark}
                    className={`mr-2 ${
                      processedProduct.isExpired ? "text-red-600" : "text-yellow-600"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      processedProduct.isExpired ? "text-red-700" : "text-yellow-700"
                    }`}
                  >
                    {processedProduct.isExpired
                      ? `Expired on ${new Date(
                          processedProduct.expiryTime
                        ).toLocaleDateString()}`
                      : `Expires on ${new Date(
                          processedProduct.expiryTime
                        ).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
            )}

            <div className="border-t pt-3 sm:pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">Quantity</span>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={
                      quantity <= processedProduct.moq ||
                      processedProduct.isOutOfStock ||
                      processedProduct.isExpired
                    }
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                  </button>
                  <span className="w-10 sm:w-12 text-center font-medium text-sm sm:text-base">
                    {quantity}
                  </span>
                  <button
                    className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleQuantityChange(1)}
                    disabled={processedProduct.isOutOfStock || processedProduct.isExpired}
                  >
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-blue-600">${totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Product Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {processedProduct.brand && (
                <div>
                  <p className="text-sm text-gray-600">Brand</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.brand}</p>
                </div>
              )}
              {processedProduct.code && (
                <div>
                  <p className="text-sm text-gray-600">Product Code</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.code}</p>
                </div>
              )}
              {processedProduct.color && (
                <div>
                  <p className="text-sm text-gray-600">Color</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.color}</p>
                </div>
              )}
              {processedProduct.colorVariant && (
                <div>
                  <p className="text-sm text-gray-600">Color Variants</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.colorVariant}</p>
                </div>
              )}
              {processedProduct.storage && (
                <div>
                  <p className="text-sm text-gray-600">Storage</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.storage}</p>
                </div>
              )}
              {processedProduct.ram && (
                <div>
                  <p className="text-sm text-gray-600">RAM</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.ram}</p>
                </div>
              )}
              {processedProduct.condition && (
                <div>
                  <p className="text-sm text-gray-600">Condition</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.condition}</p>
                </div>
              )}
              {processedProduct.simType && (
                <div>
                  <p className="text-sm text-gray-600">SIM Type</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.simType}</p>
                </div>
              )}
              {processedProduct.country && (
                <div>
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.country}</p>
                </div>
              )}
              {processedProduct.countryVariant && (
                <div>
                  <p className="text-sm text-gray-600">Country Variant</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.countryVariant}</p>
                </div>
              )}
              {processedProduct.networkBands && (
                <div>
                  <p className="text-sm text-gray-600">Network Bands</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.networkBands}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Negotiable</p>
                <p className="text-base font-medium text-gray-900">
                  {processedProduct.isNegotiable ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Purchase Type</p>
                <p className="text-base font-medium text-gray-900">{processedProduct.purchaseType}</p>
              </div>
              {processedProduct.createdAt && (
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(processedProduct.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {processedProduct.updatedAt && (
                <div>
                  <p className="text-sm text-gray-600">Updated At</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(processedProduct.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {processedProduct.status && (
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-base font-medium text-gray-900">{processedProduct.status}</p>
                </div>
              )}
            </div>
          </div>

          {/* Features Section */}
          {processedProduct.features && processedProduct.features.length > 0 && (
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Key Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {processedProduct.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <FontAwesomeIcon
                      icon={feature.icon}
                      className={`mr-2 ${feature.color}`}
                    />
                    <span className="text-base text-gray-900">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 sm:space-y-3">
            {processedProduct.isExpired ? (
              <>
                <button
                  className="w-full bg-gray-300 text-gray-500 py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium cursor-not-allowed flex items-center justify-center"
                  disabled
                >
                  <FontAwesomeIcon icon={faCalendarXmark} className="mr-2" />
                  Expired
                </button>
                <button
                  className="w-full bg-gray-300 text-gray-500 py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium cursor-not-allowed flex items-center justify-center"
                  disabled
                >
                  <FontAwesomeIcon icon={faXmark} className="mr-2" />
                  Unavailable
                </button>
              </>
            ) : processedProduct.isOutOfStock ? (
              <>
                <button
                  className="w-full bg-gray-300 text-gray-500 py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium cursor-not-allowed flex items-center justify-center"
                  disabled
                >
                  <FontAwesomeIcon icon={faXmark} className="mr-2" />
                  Out of Stock
                </button>
                {notify ? (
                  <button
                    className="w-full border border-red-300 text-red-700 bg-red-50 py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium hover:bg-red-100 cursor-pointer flex items-center justify-center transition-colors duration-200"
                    onClick={(ev) => handleNotifyToggle(ev, false)}
                    title="Turn off notifications"
                  >
                    <FontAwesomeIcon icon={faBellSlash} className="mr-2" />
                    Turn Off Notifications
                  </button>
                ) : (
                  <button
                    className="w-full border border-blue-300 text-blue-700 bg-blue-50 py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium hover:bg-blue-100 cursor-pointer flex items-center justify-center transition-colors duration-200"
                    onClick={(ev) => handleNotifyToggle(ev, true)}
                    title="Notify me when back in stock"
                  >
                    <FontAwesomeIcon icon={faBell} className="mr-2" />
                    Notify Me When Available
                  </button>
                )}
              </>
            ) : (
              <>
                <button onClick={handleAddToCartClick} className="w-full bg-orange-500 text-white py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center">
                  <FontAwesomeIcon icon={faCartShopping} className="mr-2" />
                  Add to Cart
                </button>
                <button className="w-full bg-blue-600 text-white py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <FontAwesomeIcon icon={faBolt} className="mr-2" />
                  Buy Now
                </button>
                {processedProduct.isNegotiable && (
                  <button
                    onClick={handleBiddingClick}
                    className="w-full bg-purple-600 text-white py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faHandshake} className="mr-2" />
                    Make a Bid
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isNotifyMePopupOpen && (
        <NotifyMePopup
          product={processedProduct}
          onClose={() => setIsNotifyMePopupOpen(false)}
        />
      )}

      {isAddToCartPopupOpen && (
        <AddToCartPopup
          product={popupProduct}
          onClose={() => setIsAddToCartPopupOpen(false)}
        />
      )}

      {isBiddingFormOpen && (
        <BiddingForm
          product={processedProduct}
          isOpen={isBiddingFormOpen}
          onClose={() => setIsBiddingFormOpen(false)}
          onSuccess={handleBiddingSuccess}
        />
      )}
    </div>
  );
};

export default ProductInfo;