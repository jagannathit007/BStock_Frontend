import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faBolt,
  faCalendarXmark,
  faHandshake,
  faBell,
  faBellSlash,
  faMicrochip,
  faHdd,
  faPalette,
  faShield,
  faGlobe,
  faTag,
  faSimCard,
  faWifi,
  faBarcode,
  faTruck,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faDatabase,
  faCircleDot,
  faMinus,
  faPlus,
  faClock,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { ProductService } from "../../../services/products/products.services";
import NotifyMePopup from "../NotifyMePopup";
import BiddingForm from "../../negotiation/BiddingForm";
import AddToCartPopup from "../AddToCartPopup";
import BuyNowCheckoutModal from "../BuyNowCheckoutModal";
import iphoneImage from "../../../assets/iphone.png";
import Swal from "sweetalert2";
import { convertPrice } from "../../../utils/currencyUtils";

const ProductInfo = ({ product: initialProduct, navigate, onRefresh }) => {
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(initialProduct.moq || 5);
  const [isAddToCartPopupOpen, setIsAddToCartPopupOpen] = useState(false);
  const [isBuyNowCheckoutOpen, setIsBuyNowCheckoutOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleImageError = () => {
    setImageError(true);
  };

  const getProductImages = () => {
    const images = [];

    if (currentProduct.mainImage) {
      images.push(currentProduct.mainImage);
    }

    if (
      currentProduct.skuFamilyId?.images &&
      Array.isArray(currentProduct.skuFamilyId.images)
    ) {
      currentProduct.skuFamilyId.images.forEach((img) => {
        if (!images.includes(img)) {
          images.push(img);
        }
      });
    }

    while (images.length < 5) {
      images.push(iphoneImage);
    }

    return images.slice(0, 5);
  };

  const productImages = getProductImages();

  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [productImages.length]);

  const processedProduct = {
    ...currentProduct,
    name: currentProduct.skuFamilyId?.name || currentProduct.name,
    brand: currentProduct.skuFamilyId?.brand || currentProduct.brand,
    code: currentProduct.skuFamilyId?.code || currentProduct.code,
    description:
      currentProduct.skuFamilyId?.description || currentProduct.description,
    colorVariant: Array.isArray(currentProduct.skuFamilyId?.colorVariant)
      ? currentProduct.skuFamilyId.colorVariant.join(", ")
      : currentProduct.skuFamilyId?.colorVariant ||
        currentProduct.colorVariant ||
        "",
    networkBands: Array.isArray(currentProduct.skuFamilyId?.networkBands)
      ? currentProduct.skuFamilyId.networkBands.join(", ")
      : currentProduct.skuFamilyId?.networkBands ||
        currentProduct.networkBands ||
        "",
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
  };

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
          if (
            freshProduct &&
            typeof freshProduct === "object" &&
            freshProduct.name
          ) {
            productToSet = freshProduct;
          }
          setCurrentProduct(productToSet);

          const wishlistStatus =
            productToSet.WishList || productToSet.wishList || false;
          console.log(
            "ProductInfo - Setting wishlist status from fresh data:",
            wishlistStatus
          );
          setIsFavorite(wishlistStatus);
        } else {
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

  useEffect(() => {
    const handleWishlistUpdate = async (event) => {
      const productId = processedProduct.id || processedProduct._id;

      if (event.detail && event.detail.productId === productId) {
        setIsFavorite(event.detail.isWishlisted);
      } else if (!event.detail || !event.detail.productId) {
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

  // Countdown timer and current time logic
  useEffect(() => {
    const updateTimers = () => {
      // Update current time
      setCurrentTime(new Date());

      // Update countdown timer for expiry
      if (processedProduct.expiryTime && !processedProduct.isExpired) {
        const expiryDate = new Date(processedProduct.expiryTime);
        const now = new Date();
        const difference = expiryDate - now;

        if (difference <= 0) {
          setTimeLeft(null);
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateTimers();
    const timer = setInterval(updateTimers, 1000);

    return () => clearInterval(timer);
  }, [processedProduct.expiryTime, processedProduct.isExpired]);

  const handleQuantityChange = (amount) => {
    const newQuantity = quantity + amount;
    if (
      newQuantity >= processedProduct.moq &&
      newQuantity <= processedProduct.stockCount
    ) {
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
        // ignore refresh error
      }

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error("Notification toggle error:", err);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    const productId = processedProduct._id || processedProduct.id;
    const newWishlistStatus = !isFavorite;

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      return navigate(`/login?returnTo=${returnTo}`);
    }

    setIsFavorite(newWishlistStatus);

    try {
      await ProductService.toggleWishlist({
        productId: productId,
        wishlist: newWishlistStatus,
      });
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
      setIsFavorite(!newWishlistStatus);
    }
  };

  const handleBiddingClick = async (e) => {
    e.stopPropagation();
    // Require auth for making an offer
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      return navigate(`/login?returnTo=${returnTo}`);
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const { businessProfile } = user;

    if (
      !businessProfile?.businessName ||
      businessProfile.businessName.trim() === ""
    ) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Business Details Required",
        text: "Please add your business details before making an offer.",
        confirmButtonText: "Go to Settings",
        confirmButtonColor: "#0071E0",
      });
      if (confirm.isConfirmed) navigate("/profile?tab=business");
      return;
    }

    if (
      businessProfile?.status === "pending" ||
      businessProfile?.status === "rejected"
    ) {
      await Swal.fire({
        icon: "info",
        title: "Pending Approval",
        text: "Your business profile is not approved. Please wait for approval.",
        confirmButtonText: "OK",
        confirmButtonColor: "#0071E0",
      });
      return;
    }

    setIsBiddingFormOpen(true);
  };

  const handleBiddingSuccess = () => {
    console.log("Bid submitted successfully");
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (processedProduct.isOutOfStock || processedProduct.isExpired) return;
    const customerId = localStorage.getItem("userId") || "";
    if (!customerId) {
      const hashPath = window.location.hash?.slice(1) || "/home";
      const returnTo = encodeURIComponent(hashPath);
      return navigate(`/login?returnTo=${returnTo}`);
    }
    setIsAddToCartPopupOpen(true);
  };

  const handleBuyNowClick = (e) => {
    e.stopPropagation();
    if (processedProduct.isOutOfStock || processedProduct.isExpired) return;
    const customerId = localStorage.getItem("userId") || "";
    if (!customerId) {
      const hashPath = window.location.hash?.slice(1) || "/home";
      const returnTo = encodeURIComponent(hashPath);
      return navigate(`/login?returnTo=${returnTo}`);
    }
    setIsBuyNowCheckoutOpen(true);
  };

  const handleBuyNowSuccess = () => {
    console.log("Order placed successfully!");
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

  const totalAmount =
    parseInt(processedProduct.price.toString().replace(/,/g, "")) * quantity;

  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
  };

  const professionalSpecs = [
    {
      icon: faShield,
      label: "Condition",
      value: processedProduct.condition,
      color: "text-green-600",
    },
    {
      icon: faCircleDot,
      label: "Color",
      value: processedProduct.color,
      color: "text-blue-600",
    },
    {
      icon: faMicrochip,
      label: "RAM",
      value: processedProduct.ram,
      color: "text-purple-600",
    },
    {
      icon: faDatabase,
      label: "Storage",
      value: processedProduct.storage,
      color: "text-orange-600",
    },
    {
      icon: faTag,
      label: "Brand",
      value: processedProduct.brand,
      color: "text-indigo-600",
    },
    {
      icon: faBarcode,
      label: "Product Code",
      value: processedProduct.code,
      color: "text-gray-600",
    },
    {
      icon: faSimCard,
      label: "SIM Type",
      value: processedProduct.simType,
      color: "text-red-600",
    },
    {
      icon: faGlobe,
      label: "Country",
      value: processedProduct.country,
      color: "text-teal-600",
    },
    {
      icon: faWifi,
      label: "Network Bands",
      value: processedProduct.networkBands,
      color: "text-cyan-600",
    },
    {
      icon: faTruck,
      label: "Purchase Type",
      value: processedProduct.purchaseType,
      color: "text-yellow-600",
    },
  ].filter((spec) => spec.value && spec.value !== "");

  const getStockIcon = () => {
    if (processedProduct.isExpired) return faTimesCircle;
    if (processedProduct.stockStatus === "In Stock") return faCheckCircle;
    if (processedProduct.stockStatus === "Low Stock")
      return faExclamationTriangle;
    return faTimesCircle;
  };

  const getStockColor = () => {
    if (processedProduct.isExpired) return "text-gray-600";
    if (processedProduct.stockStatus === "In Stock") return "text-green-600";
    if (processedProduct.stockStatus === "Low Stock") return "text-yellow-600";
    return "text-red-600";
  };

  // Format current time in hh:mm:ss
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format current date
  const formatCurrentDate = () => {
    return currentTime.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <style>
        {`
          .swiper-pagination-custom .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0.5);
            opacity: 1;
            margin: 0 4px;
          }
          .swiper-pagination-custom .swiper-pagination-bullet-active {
            background: #3b82f6;
          }
          .thumbs-swiper .swiper-slide-thumb-active {
            opacity: 1;
          }
          .thumbs-swiper .swiper-slide {
            opacity: 0.6;
            transition: opacity 0.3s;
          }
          .thumbs-swiper .swiper-slide:hover {
            opacity: 0.8;
          }
          /* Minimal slide-in-left animation for spec items under stock status */
          @keyframes slide-in-left {
            from { opacity: 0; transform: translateX(-12px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .slide-in-left {
            opacity: 0;
            animation: slide-in-left 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
                  `}
      </style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <div className="relative group max-w-lg mx-auto">
              <div className="aspect-[4/3.5] relative rounded-lg overflow-hidden bg-gray-50">
                <div className="h-full w-full">
                  <div className="relative h-full">
                    <img
                      className="w-full h-full object-cover"
                      alt={`${processedProduct.name} ${selectedImageIndex + 1}`}
                      src={
                        imageError ? iphoneImage : productImages[selectedImageIndex]
                      }
                      onError={handleImageError}
                    />
                  </div>
                </div>
                <div className="absolute top-3 left-3 z-20">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    processedProduct.isExpired
                      ? "bg-gray-600 text-white"
                      : processedProduct.stockStatus === "In Stock"
                      ? "bg-green-600 text-white"
                      : processedProduct.stockStatus === "Low Stock"
                      ? "bg-yellow-600 text-white"
                      : "bg-red-600 text-white"
                  }`}>
                    {processedProduct.isExpired
                      ? "Expired"
                      : processedProduct.stockStatus}
                  </span>
                </div>
                {/* Product Specifications under Stock Status (polished with subtle animation) */}
                <div className="absolute top-12 left-3 z-20">
                  <div className=" px-1 py-2">
                    <div className="space-y-2">
                      {processedProduct.condition && (
                        <div className="flex items-center gap-1 fade-in-up slide-in-left" style={{ animationDelay: '0ms' }}>
                          <span className="text-xs text-gray-600">Condition:</span>
                          <span className="text-xs font-semibold text-gray-900 capitalize">{processedProduct.condition}</span>
                        </div>
                      )}
                      {processedProduct.color && (
                        <div className="flex items-center gap-1 fade-in-up slide-in-left" style={{ animationDelay: '200ms' }}>
                          <span className="text-xs text-gray-600">Color:</span>
                          <span className="text-xs font-semibold text-gray-900 capitalize">{processedProduct.color}</span>
                        </div>
                      )}
                      {processedProduct.ram && (
                        <div className="flex items-center gap-1 fade-in-up slide-in-left" style={{ animationDelay: '400ms' }}>
                          <span className="text-xs text-gray-600">RAM:</span>
                          <span className="text-xs font-semibold text-gray-900">{processedProduct.ram}</span>
                        </div>
                      )}
                      {processedProduct.storage && (
                        <div className="flex items-center gap-1 fade-in-up slide-in-left" style={{ animationDelay: '600ms' }}>
                          <span className="text-xs text-gray-600">Storage:</span>
                          <span className="text-xs font-semibold text-gray-900">{processedProduct.storage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="absolute top-3 right-3 z-20 p-2 bg-white/80 rounded-md hover:bg-white transition-colors duration-200"
                  onClick={handleToggleWishlist}
                >
                  <FontAwesomeIcon
                    icon={faClock}
                    className={`text-sm ${
                      isFavorite ? "text-red-500" : "text-gray-600"
                    }`}
                  />
                </button>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                  onClick={() => setSelectedImageIndex((prev) => prev === 0 ? productImages.length - 1 : prev - 1)}
                  disabled={productImages.length <= 1}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600 text-sm" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                  onClick={() => setSelectedImageIndex((prev) => (prev + 1) % productImages.length)}
                  disabled={productImages.length <= 1}
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-sm" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex space-x-1">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedImageIndex === index
                          ? "bg-blue-500"
                          : "bg-white/50 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="max-w-lg mx-auto">
              <div className="grid grid-cols-5 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-[4/3] rounded-md overflow-hidden cursor-pointer transition-opacity duration-300 ${
                      selectedImageIndex === index ? "opacity-100" : "opacity-60"
                    }`}
                  >
                    <img
                      alt={`${processedProduct.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      src={image}
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                {processedProduct.name}
              </h1>
              <p className="mt-1 text-base text-gray-600 font-medium">
                by {processedProduct.brand}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-semibold text-gray-900">
                  {convertPrice(processedProduct.price)}
                </span>
                {processedProduct.isNegotiable && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg">
                    Negotiable
                  </span>
                )}
              </div>
              {processedProduct.expiryTime && !processedProduct.isExpired && timeLeft && (
                <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm border border-red-200">
                  <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-2" />
                  <span className="font-bold">
                    {timeLeft.days}d {timeLeft.hours}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
            {(processedProduct.storage ||
              processedProduct.ram ||
              processedProduct.color ||
              processedProduct.condition) && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Key Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {processedProduct.condition && (
                    <div className="flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                      <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center mr-2">
                        <FontAwesomeIcon icon={faShield} className="text-blue-600 text-xs" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500 font-medium">Condition</span>
                        <div className="text-xs font-bold text-gray-900 capitalize truncate">
                          {processedProduct.condition}
                        </div>
                      </div>
                    </div>
                  )}
                  {processedProduct.color && (
                    <div className="flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                      <div className="w-6 h-6 bg-purple-50 rounded-md flex items-center justify-center mr-2">
                        <FontAwesomeIcon icon={faCircleDot} className="text-purple-600 text-xs" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500 font-medium">Color</span>
                        <div className="text-xs font-bold text-gray-900 capitalize truncate">
                          {processedProduct.color}
                        </div>
                      </div>
                    </div>
                  )}
                  {processedProduct.ram && (
                    <div className="flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                      <div className="w-6 h-6 bg-green-50 rounded-md flex items-center justify-center mr-2">
                        <FontAwesomeIcon icon={faMicrochip} className="text-green-600 text-xs" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500 font-medium">RAM</span>
                        <div className="text-xs font-bold text-gray-900 truncate">
                          {processedProduct.ram}
                        </div>
                      </div>
                    </div>
                  )}
                  {processedProduct.storage && (
                    <div className="flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                      <div className="w-6 h-6 bg-orange-50 rounded-md flex items-center justify-center mr-2">
                        <FontAwesomeIcon icon={faDatabase} className="text-orange-600 text-xs" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500 font-medium">Storage</span>
                        <div className="text-xs font-bold text-gray-900 truncate">
                          {processedProduct.storage}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {processedProduct.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {processedProduct.description}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-xs text-gray-500 block font-medium mb-1">Minimum Order Quantity</span>
                <span className="text-lg font-bold text-gray-900">{processedProduct.moq} units</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-xs text-gray-500 block font-medium mb-1">Available Stock</span>
                <span className={`text-lg font-bold ${getStockColor()} flex items-center`}>
                  <FontAwesomeIcon icon={getStockIcon()} className="mr-2" />
                  {processedProduct.stockCount} units
                </span>
              </div>
            </div>
            {processedProduct.expiryTime && (
              <div
                className={`p-4 rounded-lg text-sm font-medium ${
                  processedProduct.isExpired
                    ? "bg-red-50 text-red-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                <FontAwesomeIcon icon={faCalendarXmark} className="mr-2" />
                {processedProduct.isExpired ? (
                  <span>
                    Expired on{" "}
                    {new Date(processedProduct.expiryTime).toLocaleDateString(
                      "en-US",
                      {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      }
                    )}
                  </span>
                ) : (
                  <span>
                    Expires on{" "}
                    {new Date(processedProduct.expiryTime).toLocaleDateString(
                      "en-US",
                      {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      }
                    )}
                  </span>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Quantity</label>
                <div className="flex items-center">
                  <button
                    className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-default transition-all duration-200"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={
                      quantity <= processedProduct.moq ||
                      processedProduct.isOutOfStock ||
                      processedProduct.isExpired
                    }
                  >
                    <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                  </button>
                  <input
                    className="mx-2 w-16 text-center text-base font-bold text-gray-900 border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    min={processedProduct.moq}
                    max={processedProduct.stockCount}
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || processedProduct.moq;
                      if (
                        newValue >= processedProduct.moq &&
                        newValue <= processedProduct.stockCount
                      ) {
                        setQuantity(newValue);
                      }
                    }}
                    disabled={
                      processedProduct.isOutOfStock ||
                      processedProduct.isExpired
                    }
                  />
                  <button
                    className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-default transition-all duration-200"
                    onClick={() => handleQuantityChange(1)}
                    disabled={
                      quantity >= processedProduct.stockCount ||
                      processedProduct.isOutOfStock ||
                      processedProduct.isExpired
                    }
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-600 mb-1">Total Amount</span>
                <span className="text-xl font-bold text-gray-900">
                  {convertPrice(totalAmount)}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              {processedProduct.isExpired ? (
                <button
                  className="flex-1 cursor-pointer text-black py-3 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                  disabled
                >
                  Product Expired
                </button>
              ) : processedProduct.isOutOfStock ? (
                <>
                  <button
                    className="flex-1 cursor-pointer text-black py-3 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                    disabled
                  >
                    Out of Stock
                  </button>
                  {notify ? (
                    <button
                      className="flex-1 bg-red-600 cursor-pointer text-white py-3 rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                      onClick={(ev) => handleNotifyToggle(ev, false)}
                    >
                      <FontAwesomeIcon icon={faBellSlash} className="mr-2" />
                      Turn Off Notifications
                    </button>
                  ) : (
                    <button
                      className="flex-1 bg-blue-600 cursor-pointer text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                      onClick={(ev) => handleNotifyToggle(ev, true)}
                    >
                      <FontAwesomeIcon icon={faBell} className="mr-2" />
                      Notify When Available
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleBuyNowClick}
                    className="flex-1 cursor-pointer text-black py-3 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faBolt} className="mr-2" />
                    Buy Now
                  </button>
                  <button
                    onClick={handleAddToCartClick}
                    className="flex-1 cursor-pointer text-black py-3 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faCartShopping} className="mr-2" />
                    Add to Cart
                  </button>
                  {processedProduct.isNegotiable && (
                    <button
                      onClick={handleBiddingClick}
                      className="flex-1 bg-blue-600 cursor-pointer text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faHandshake} className="mr-2" />
                      Make an Offer
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Specifications Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 font-apple">Product Specifications</h2>
            <p className="text-sm text-gray-600 mt-1">Detailed technical specifications and features</p>
          </div>
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: faTag, label: "Brand", value: processedProduct.brand, color: "blue" },
                  { icon: faBarcode, label: "Product Code", value: processedProduct.code, color: "green" },
                  { icon: faShield, label: "Condition", value: processedProduct.condition, color: "purple" },
                  { icon: faCheckCircle, label: "Status", value: processedProduct.status, color: "emerald" },
                ]
                  .filter((item) => item.value)
                  .map((item, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                      <div className={`w-10 h-10 bg-${item.color}-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-${item.color}-100 transition-colors duration-200`}>
                        <FontAwesomeIcon icon={item.icon} className={`text-${item.color}-600 text-sm`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Technical Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: faDatabase, label: "Storage", value: processedProduct.storage, color: "orange" },
                  { icon: faMicrochip, label: "RAM", value: processedProduct.ram, color: "indigo" },
                  { icon: faPalette, label: "Color", value: processedProduct.color, color: "pink" },
                  { icon: faPalette, label: "Color Variants", value: processedProduct.colorVariant, color: "pink" },
                  { icon: faSimCard, label: "SIM Type", value: processedProduct.simType, color: "cyan" },
                  { icon: faWifi, label: "Network Bands", value: processedProduct.networkBands, color: "teal" },
                ]
                  .filter((item) => item.value)
                  .map((item, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                      <div className={`w-10 h-10 bg-${item.color}-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-${item.color}-100 transition-colors duration-200`}>
                        <FontAwesomeIcon icon={item.icon} className={`text-${item.color}-600 text-sm`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Location & Purchase</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: faGlobe, label: "Country", value: processedProduct.country, color: "blue" },
                  { icon: faTruck, label: "Purchase Type", value: processedProduct.purchaseType, color: "amber" },
                  { icon: faHandshake, label: "Negotiable", value: processedProduct.isNegotiable ? "Yes" : "No", color: "green" },
                ]
                  .filter((item) => item.value)
                  .map((item, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                      <div className={`w-10 h-10 bg-${item.color}-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-${item.color}-100 transition-colors duration-200`}>
                        <FontAwesomeIcon icon={item.icon} className={`text-${item.color}-600 text-sm`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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