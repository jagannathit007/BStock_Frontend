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
  // faShieldCheck,
  // faTruck,
  // faRotateLeft,
  // faStar,
  // faMapMarkerAlt,
  // faPhone,
  // faEnvelope,
  // faStore,
} from "@fortawesome/free-solid-svg-icons";
import { ProductService } from "../../../services/products/products.services";
import NotifyMePopup from "../NotifyMePopup";
import BiddingForm from "../../negotiation/BiddingForm";
import AddToCartPopup from "../AddToCartPopup";
import BuyNowCheckoutModal from "../BuyNowCheckoutModal";
import iphoneImage from "../../../assets/iphone.png";

const ProductInfo = ({ product: initialProduct, navigate, onRefresh }) => {
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(initialProduct.moq || 5);
  // const [isFavorite, setIsFavorite] = useState(initialProduct.wishList || false);
  // const [notify, setNotify] = useState(Boolean(initialProduct.notify));
  // const [isNotifyMePopupOpen, setIsNotifyMePopupOpen] = useState(false);
  // const [isBiddingFormOpen, setIsBiddingFormOpen] = useState(false);
  const [isAddToCartPopupOpen, setIsAddToCartPopupOpen] = useState(false);
  const [isBuyNowCheckoutOpen, setIsBuyNowCheckoutOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

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

  // const [selectedColor, setSelectedColor] = useState("Natural Titanium");
  // const [selectedStorage, setSelectedStorage] = useState("256GB");
  // const [selectedGrade, setSelectedGrade] = useState("A+");
  // const [quantity, setQuantity] = useState(5);
  // Initialize with proper fallback checking
  const [isFavorite, setIsFavorite] = useState(() => {
    const initialWishlistStatus =
      initialProduct?.WishList ||
      initialProduct?.wishList ||
      initialProduct?.isFavorite ||
      false;
    console.log("ProductInfo - Initial state setup:", {
      WishList: initialProduct?.WishList,
      wishList: initialProduct?.wishList,
      isFavorite: initialProduct?.isFavorite,
      finalStatus: initialWishlistStatus,
    });
    return initialWishlistStatus;
  });
  const [notify, setNotify] = useState(Boolean(currentProduct?.notify));
  const [isNotifyMePopupOpen, setIsNotifyMePopupOpen] = useState(false);
  const [isBiddingFormOpen, setIsBiddingFormOpen] = useState(false);

  // const colors = [
  //   { name: "Natural Titanium", class: "bg-gray-200" },
  //   { name: "Blue", class: "bg-blue-600" },
  //   { name: "Black", class: "bg-black" },
  //   { name: "White", class: "bg-white border-2 border-gray-300" },
  // ];

  // const storageOptions = ["128GB", "256GB", "512GB", "1TB"];
  // const gradeOptions = ["A+", "A", "B", "C"];

  // Check if product can accept notifications (out of stock but not expired)
  const canNotify =
    processedProduct.isOutOfStock && !processedProduct.isExpired;

  useEffect(() => {
    const fetchFreshProductData = async () => {
      try {
        const productId = initialProduct._id || initialProduct.id;
        if (productId) {
          console.log(
            "ProductInfo - Fetching fresh product data for ID:",
            productId
          );
          const freshProduct = await ProductService.getProductById(productId);
          console.log("ProductInfo - Fresh product from API:", freshProduct);
          let productToSet = initialProduct;
          if (freshProduct && typeof freshProduct === 'object' && freshProduct.name) {
            productToSet = freshProduct;
          }
          setCurrentProduct(productToSet);

          // Set wishlist status from fresh API data
          const wishlistStatus =
            productToSet.WishList || productToSet.wishList || false;
          console.log(
            "ProductInfo - Setting wishlist status from fresh data:",
            wishlistStatus
          );
          setIsFavorite(wishlistStatus);
        } else {
          // Fallback to initial product data
          setCurrentProduct(initialProduct);
          const wishlistStatus =
            initialProduct.WishList ||
            initialProduct.wishList ||
            initialProduct.isFavorite ||
            false;
          console.log("ProductInfo - Using initial product data:", {
            WishList: initialProduct.WishList,
            wishList: initialProduct.wishList,
            isFavorite: initialProduct.isFavorite,
            finalWishlistStatus: wishlistStatus,
            productId: initialProduct._id || initialProduct.id,
            fullProductKeys: Object.keys(initialProduct),
          });
          setIsFavorite(wishlistStatus);
        }
      } catch (error) {
        console.error("ProductInfo - Error fetching fresh product:", error);
        // Fallback to initial product data
        setCurrentProduct(initialProduct);
        const wishlistStatus =
          initialProduct.WishList ||
          initialProduct.wishList ||
          initialProduct.isFavorite ||
          false;
        setIsFavorite(wishlistStatus);
      }
    };

    fetchFreshProductData();
  }, [initialProduct]);

  useEffect(() => {
    setNotify(Boolean(currentProduct?.notify));
    // Check all possible wishlist fields from the backend
    const wishlistStatus =
      currentProduct.WishList ||
      currentProduct.wishList ||
      currentProduct.isFavorite ||
      false;
    console.log("ProductInfo - Current product updated:", {
      WishList: currentProduct.WishList,
      wishList: currentProduct.wishList,
      isFavorite: currentProduct.isFavorite,
      finalWishlistStatus: wishlistStatus,
      productId: currentProduct._id || currentProduct.id,
    });
    setIsFavorite(wishlistStatus);
  }, [currentProduct]);

  // Listen for wishlist updates from other components
  useEffect(() => {
    const handleWishlistUpdate = async (event) => {
      const productId = processedProduct.id || processedProduct._id;

      if (event.detail && event.detail.productId === productId) {
        // Update from event detail
        setIsFavorite(event.detail.isWishlisted);
      } else if (!event.detail || !event.detail.productId) {
        // General wishlist update - refresh product data
        try {
          const refreshed = await ProductService.getProductById(productId);
          setCurrentProduct(refreshed);
        } catch (error) {
          console.error("Failed to refresh product:", error);
        }
      }

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    };

    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, [processedProduct.id, processedProduct._id, onRefresh]);

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

      // Refresh from backend
      try {
        const refreshed = await ProductService.getProductById(productId);
        setCurrentProduct(refreshed);
        if (typeof onRefresh === "function") {
          onRefresh();
        }
      } catch (refreshErr) {
        // ignore refresh error
      }

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error("Notification toggle error:", err);
      // errors are toasted in service
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    const productId = processedProduct._id || processedProduct.id;
    const newWishlistStatus = !isFavorite;

    // Optimistic update
    setIsFavorite(newWishlistStatus);

    try {
      await ProductService.toggleWishlist({
        productId: productId,
        wishlist: newWishlistStatus,
      });
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
      // Revert optimistic update on error
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

  const handleBuyNowClick = (e) => {
    e.stopPropagation();
    if (processedProduct.isOutOfStock || processedProduct.isExpired) return;
    const customerId = localStorage.getItem('userId') || '';
    if (!customerId) {
      return navigate('/signin');
    }
    setIsBuyNowCheckoutOpen(true);
  };

  const handleBuyNowSuccess = () => {
    console.log("Order placed successfully!");
    // The modal will show success message and close automatically
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Enhanced Left Column - Image */}
          <div className="xl:col-span-6">
            <div className="relative group">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 overflow-hidden">
               <img
                  className="w-full h-96 lg:h-[500px] object-cover rounded-xl hover:scale-105 transition-transform duration-500"
                  src={imageError ? iphoneImage : processedProduct.mainImage}
                  alt={processedProduct.name}
                  onError={handleImageError}
                />
                
                {/* Enhanced Status Badges */}
                <div className="absolute top-8 left-8 flex flex-col space-y-3">
                  <div
                    className={`${
                      processedProduct.isExpired
                        ? "bg-gradient-to-r from-gray-400 to-gray-500"
                        : processedProduct.stockStatus === "In Stock"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : processedProduct.stockStatus === "Low Stock"
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-red-500 to-pink-500"
                    } text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center`}
                  >
                    {processedProduct.isExpired && (
                      <FontAwesomeIcon icon={faCalendarXmark} className="mr-2 text-xs" />
                    )}
                    {processedProduct.isExpired ? "Expired" : processedProduct.stockStatus}
                  </div>
                </div>

                {/* Enhanced Wishlist Button */}
                <button
                  className="absolute top-8 right-8 p-3 cursor-pointer bg-white rounded-full shadow-xl hover:shadow-2xl border border-gray-100 hover:scale-110 transition-all duration-300 group"
                  onClick={handleToggleWishlist}
                >
                  <FontAwesomeIcon
                    icon={isFavorite ? solidHeart : regularHeart}
                    className={`text-lg transition-all cursor-pointer duration-300 ${
                      isFavorite ? "text-red-500 " : "text-gray-400 "
                    }`}
                  />
                </button>
              </div>

            {/* Enhanced Product Details */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 my-6">
              <div className="border-l-4 border-purple-500 pl-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Product Specifications</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {[
                  { label: "Brand", value: processedProduct.brand },
                  { label: "Product Code", value: processedProduct.code },
                  { label: "Color", value: processedProduct.color },
                  { label: "Color Variants", value: processedProduct.colorVariant },
                  { label: "Storage", value: processedProduct.storage },
                  { label: "RAM", value: processedProduct.ram },
                  { label: "Condition", value: processedProduct.condition },
                  { label: "SIM Type", value: processedProduct.simType },
                  { label: "Country", value: processedProduct.country },
                  { label: "Country Variant", value: processedProduct.countryVariant },
                  { label: "Network Bands", value: processedProduct.networkBands },
                  { label: "Negotiable", value: processedProduct.isNegotiable ? "Yes" : "No" },
                  { label: "Purchase Type", value: processedProduct.purchaseType },
                  { label: "Status", value: processedProduct.status },
                ].filter(item => item.value).map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-medium text-gray-600 mb-1">{item.label}</p>
                    <p className="text-base font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>

          {/* Enhanced Right Column */}
          <div className="xl:col-span-6">
            {/* Enhanced Header */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                    {processedProduct.name}
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {processedProduct.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Price Section */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-6">
              <div className="border-l-4 border-blue-500 pl-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing Details</h2>
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                <div className="mb-4 lg:mb-0">
                  <span className="text-4xl font-bold text-gray-900 mr-3">
                    ${processedProduct.price}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Minimum Order</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {processedProduct.moq} units
                    </span>
                  </div>
                </div>
                <div
                  className={`${
                    processedProduct.isExpired
                      ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                      : processedProduct.stockCount > 10
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                      : processedProduct.stockCount > 0
                      ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                      : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
                  } rounded-xl p-4 border`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Available Stock</span>
                    <span
                      className={`font-bold text-lg ${
                        processedProduct.isExpired
                          ? "text-gray-500"
                          : processedProduct.stockCount > 10
                          ? "text-green-600"
                          : processedProduct.stockCount > 0
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {processedProduct.stockCount} units
                    </span>
                  </div>
                </div>
              </div>

              {processedProduct.expiryTime && (
                <div
                  className={`p-4 rounded-xl mb-6 border ${
                    processedProduct.isExpired
                      ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
                      : "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon
                      icon={faCalendarXmark}
                      className={`mr-3 text-lg ${
                        processedProduct.isExpired ? "text-red-600" : "text-yellow-600"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        processedProduct.isExpired ? "text-red-700" : "text-yellow-700"
                      }`}
                    >
                      {processedProduct.isExpired
                        ? `Expired on ${new Date(processedProduct.expiryTime).toLocaleDateString()}`
                        : `Expires on ${new Date(processedProduct.expiryTime).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900">Quantity</span>
                  <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200">
                    <button
                      className="p-3 hover:bg-gray-100 cursor-pointer  rounded-l-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={
                        quantity <= processedProduct.moq ||
                        processedProduct.isOutOfStock ||
                        processedProduct.isExpired
                      }
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-gray-600" />
                    </button>
                    <span className="px-6 py-3 font-bold text-lg bg-white border-x border-gray-200">
                      {quantity}
                    </span>
                    <button
                      className="p-3 hover:bg-gray-100 cursor-pointer  rounded-r-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={() => handleQuantityChange(1)}
                      disabled={processedProduct.isOutOfStock || processedProduct.isExpired}
                    >
                      <FontAwesomeIcon icon={faCheck} className="text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">${totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Features Section */}
            {processedProduct.features && processedProduct.features.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-6">
                <div className="border-l-4 border-green-500 pl-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Key Features</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {processedProduct.features.map((feature, index) => (
                    <div key={index} className="flex items-center bg-green-50 p-3 rounded-lg border border-green-100">
                      <FontAwesomeIcon
                        icon={feature.icon}
                        className={`mr-3 text-lg ${feature.color}`}
                      />
                      <span className="font-medium text-gray-900">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Action Buttons */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <div className="space-y-4">
                {processedProduct.isExpired ? (
                  <>
                    <button
                      className="w-full bg-gradient-to-r from-gray-400  to-gray-500 text-white py-4 px-6 rounded-xl text-lg font-semibold cursor-not-allowed flex items-center justify-center"
                      disabled
                    >
                      <FontAwesomeIcon icon={faCalendarXmark} className="mr-3 text-xl" />
                      Product Expired
                    </button>
                    <button
                      className="w-full bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 py-4 px-6 rounded-xl text-lg font-semibold cursor-not-allowed flex items-center justify-center"
                      disabled
                    >
                      <FontAwesomeIcon icon={faXmark} className="mr-3 text-xl" />
                      Currently Unavailable
                    </button>
                  </>
                ) : processedProduct.isOutOfStock ? (
                  <>
                    <button
                      className="w-full bg-gradient-to-r from-gray-400  to-gray-500 text-white py-4 px-6 rounded-xl text-lg font-semibold cursor-not-allowed flex items-center justify-center"
                      disabled
                    >
                      <FontAwesomeIcon icon={faXmark} className="mr-3 text-xl" />
                      Out of Stock
                    </button>
                    {notify ? (
                      <button
                        className="w-full bg-gradient-to-r from-red-500 cursor-pointer to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center transform hover:scale-105 shadow-lg"
                        onClick={(ev) => handleNotifyToggle(ev, false)}
                        title="Turn off notifications"
                      >
                        <FontAwesomeIcon icon={faBellSlash} className="mr-3 text-xl" />
                        Turn Off Notifications
                      </button>
                    ) : (
                      <button
                        className="w-full bg-gradient-to-r from-blue-500 cursor-pointer to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center transform hover:scale-105 shadow-lg"
                        onClick={(ev) => handleNotifyToggle(ev, true)}
                        title="Notify me when back in stock"
                      >
                        <FontAwesomeIcon icon={faBell} className="mr-3 text-xl" />
                        Notify When Available
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleAddToCartClick} 
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 cursor-pointer hover:from-orange-600 hover:to-red-600 text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <FontAwesomeIcon icon={faCartShopping} className="mr-3 text-xl" />
                      Add to Cart
                    </button>
                    <button 
                      onClick={handleBuyNowClick}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 cursor-pointer hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <FontAwesomeIcon icon={faBolt} className="mr-3 text-xl" />
                      Buy Now
                    </button>
                    {processedProduct.isNegotiable && (
                      <button
                        onClick={handleBiddingClick}
                        className="w-full bg-gradient-to-r from-purple-600 cursor-pointer to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <FontAwesomeIcon icon={faHandshake} className="mr-3 text-xl" />
                        Make an Offer
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All existing modals remain unchanged */}
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

      {isBuyNowCheckoutOpen && (
        <BuyNowCheckoutModal
          isOpen={isBuyNowCheckoutOpen}
          onClose={() => setIsBuyNowCheckoutOpen(false)}
          product={popupProduct}
          quantity={quantity}
          onSuccess={handleBuyNowSuccess}
        />
      )}
    </div>
  );
};

export default ProductInfo;