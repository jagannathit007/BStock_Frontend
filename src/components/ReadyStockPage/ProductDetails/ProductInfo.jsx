import { useEffect, useState } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { ProductService } from "../../../services/products/products.services";
import NotifyMePopup from "../NotifyMePopup";
import BiddingForm from "../../negotiation/BiddingForm";
import AddToCartPopup from "../AddToCartPopup";
import BuyNowCheckoutModal from "../BuyNowCheckoutModal";
import iphoneImage from "../../../assets/iphone.png";
import Swal from "sweetalert2";

const ProductInfo = ({ product: initialProduct, navigate, onRefresh }) => {
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(initialProduct.moq || 5);
  const [isAddToCartPopupOpen, setIsAddToCartPopupOpen] = useState(false);
  const [isBuyNowCheckoutOpen, setIsBuyNowCheckoutOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
      return navigate("/signin");
    }
    setIsAddToCartPopupOpen(true);
  };

  const handleBuyNowClick = (e) => {
    e.stopPropagation();
    if (processedProduct.isOutOfStock || processedProduct.isExpired) return;
    const customerId = localStorage.getItem("userId") || "";
    if (!customerId) {
      return navigate("/signin");
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

  const totalAmount = (
    parseInt(processedProduct.price.toString().replace(/,/g, "")) * quantity
  ).toLocaleString();

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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute top-6 left-6 z-20">
                <span
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium backdrop-blur-md shadow-lg ${
                    processedProduct.isExpired
                      ? "bg-gray-800/90 text-white"
                      : processedProduct.stockStatus === "In Stock"
                      ? "bg-green-600/90 text-white"
                      : processedProduct.stockStatus === "Low Stock"
                      ? "bg-yellow-600/90 text-white"
                      : "bg-red-600/90 text-white"
                  }`}
                >
                  {processedProduct.isExpired
                    ? "Expired"
                    : processedProduct.stockStatus}
                </span>
              </div>

              <button
                className="absolute flex justify-center cursor-pointer top-6 right-6 z-20 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all transform hover:scale-110"
                onClick={handleToggleWishlist}
              >
                <FontAwesomeIcon
                  icon={isFavorite ? solidHeart : regularHeart}
                  className={`text-xl ${
                    isFavorite
                      ? "text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  }`}
                />
              </button>
              <div className="aspect-square relative rounded-xl overflow-hidden shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  src={
                    imageError ? iphoneImage : productImages[selectedImageIndex]
                  }
                  alt={processedProduct.name}
                  onError={handleImageError}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {productImages.slice(1, 5).map((image, index) => (
                <button
                  key={index + 1}
                  onClick={() => handleThumbnailClick(index + 1)}
                  className={`aspect-square rounded-lg overflow-hidden transition-all ${
                    selectedImageIndex === index + 1
                      ? "border-blue-500 ring-2 ring-blue-200 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${processedProduct.name} ${index + 2}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </button>
              ))}
            </div>

            <div className="flex justify-center space-x-2">
              {productImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    selectedImageIndex === index
                      ? "bg-blue-500"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {processedProduct.name}
              </h1>
              <p className="mt-1 text-lg text-gray-600 font-medium">
                by {processedProduct.brand}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-4xl font-bold text-gray-900">
                ${processedProduct.price}
              </span>
              {processedProduct.isNegotiable && (
                <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                  Negotiable
                </span>
              )}
            </div>

            {(processedProduct.storage ||
              processedProduct.ram ||
              processedProduct.color ||
              processedProduct.condition) && (
              <div className="mt-6 bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Features
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {processedProduct.condition && (
                    <div className="flex flex-col items-center bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <FontAwesomeIcon
                        icon={faShield}
                        className="text-blue-900 text-xl mb-2"
                      />
                      <span className="text-sm text-gray-500">Condition</span>
                      <span className="text-base font-medium text-gray-900 capitalize">
                        <strong>{processedProduct.condition}</strong>
                      </span>
                    </div>
                  )}
                  {processedProduct.color && (
                    <div className="flex flex-col items-center bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <FontAwesomeIcon
                        icon={faCircleDot}
                        className="text-blue-900 text-xl mb-2"
                      />
                      <span className="text-sm text-gray-500">Color</span>
                      <span className="text-base font-medium text-gray-900 capitalize">
                        <strong>{processedProduct.color}</strong>
                      </span>
                    </div>
                  )}
                  {processedProduct.ram && (
                    <div className="flex flex-col items-center bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <FontAwesomeIcon
                        icon={faMicrochip}
                        className="text-blue-900 text-xl mb-2"
                      />
                      <span className="text-sm text-gray-500">RAM</span>
                      <span className="text-base font-medium text-gray-900">
                        <strong>{processedProduct.ram}</strong>
                      </span>
                    </div>
                  )}
                  {processedProduct.storage && (
                    <div className="flex flex-col items-center bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <FontAwesomeIcon
                        icon={faDatabase}
                        className="text-blue-900 text-xl mb-2"
                      />
                      <span className="text-sm text-gray-500">Storage</span>
                      <span className="text-base font-medium text-gray-900">
                        <strong>{processedProduct.storage}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {processedProduct.description && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  {processedProduct.description}
                </p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <span className="text-sm text-gray-500 block">
                  Minimum Order Quantity
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {processedProduct.moq} units
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <span className="text-sm text-gray-500 block">
                  Available Stock
                </span>
                <span className={`text-lg font-semibold ${getStockColor()}`}>
                  <FontAwesomeIcon icon={getStockIcon()} className="mr-2" />
                  {processedProduct.stockCount} units
                </span>
              </div>
            </div>

            {processedProduct.expiryTime && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm font-medium ${
                  processedProduct.isExpired
                    ? "bg-red-50 text-red-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                <FontAwesomeIcon icon={faCalendarXmark} className="mr-2" />
                {processedProduct.isExpired
                  ? `Expired on ${new Date(
                      processedProduct.expiryTime
                    ).toLocaleDateString()}`
                  : `Expires on ${new Date(
                      processedProduct.expiryTime
                    ).toLocaleDateString()}`}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Quantity
                </label>
                <div className="flex items-center">
                  {/* Minus Button */}
                  <button
                    className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-default transition"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={
                      quantity <= processedProduct.moq ||
                      processedProduct.isOutOfStock ||
                      processedProduct.isExpired
                    }
                  >
                    <FontAwesomeIcon
                      icon={faMinus}
                      className="cursor-pointer"
                    />
                  </button>

                  {/* Quantity Display */}
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const newValue =
                        parseInt(e.target.value) || processedProduct.moq;
                      if (
                        newValue >= processedProduct.moq &&
                        newValue <= processedProduct.stockCount
                      ) {
                        setQuantity(newValue);
                      }
                    }}
                    className="mx-3 w-20 text-center font-semibold text-gray-900 border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min={processedProduct.moq}
                    max={processedProduct.stockCount}
                    disabled={
                      processedProduct.isOutOfStock ||
                      processedProduct.isExpired
                    }
                  />

                  {/* Plus Button */}
                  <button
                    className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-default transition"
                    onClick={() => handleQuantityChange(1)}
                    disabled={
                      quantity >= processedProduct.stockCount ||
                      processedProduct.isOutOfStock ||
                      processedProduct.isExpired
                    }
                  >
                    <FontAwesomeIcon icon={faPlus} className="cursor-pointer" />
                  </button>
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-600 mb-2">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  ${totalAmount}
                </span>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              {processedProduct.isExpired ? (
                <button
                  className="w-full bg-gray-200 text-gray-600 py-4 rounded-lg text-base font-semibold cursor-not-allowed shadow-sm"
                  disabled
                >
                  Product Expired
                </button>
              ) : processedProduct.isOutOfStock ? (
                <>
                  <button
                    className="w-full bg-gray-200 text-gray-600 py-4 rounded-lg text-base font-semibold cursor-not-allowed shadow-sm"
                    disabled
                  >
                    Out of Stock
                  </button>
                  {notify ? (
                    <button
                      className="w-full bg-red-600 cursor-pointer text-white py-4 rounded-lg text-base font-semibold hover:bg-red-700 shadow-md transition-all"
                      onClick={(ev) => handleNotifyToggle(ev, false)}
                    >
                      <FontAwesomeIcon icon={faBellSlash} className="mr-2" />
                      Turn Off Notifications
                    </button>
                  ) : (
                    <button
                      className="w-full bg-[#0071E0] cursor-pointer text-white py-4 rounded-lg text-base font-semibold hover:bg-blue-700 shadow-md transition-all"
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
                    className="w-full cursor-pointer text-black py-4 rounded-lg text-base font-semibold border border-black hover:bg-gray-100 shadow-md transition-all flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faBolt} className="mr-2" />
                    Buy Now
                  </button>
                  <button
                    onClick={handleAddToCartClick}
                    className="w-full cursor-pointer text-black py-4 rounded-lg text-base font-semibold border border-black hover:bg-gray-100 shadow-md transition-all flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faCartShopping} className="mr-2" />
                    Add to Cart
                  </button>
                  {processedProduct.isNegotiable && (
                    <button
                      onClick={handleBiddingClick}
                      className="w-full bg-[#0071E0] cursor-pointer text-white py-4 rounded-lg text-base font-semibold hover:bg-blue-700 shadow-md transition-all flex items-center justify-center"
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
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Product Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: "Brand", value: processedProduct.brand, icon: faTag },
              {
                label: "Product Code",
                value: processedProduct.code,
                icon: faBarcode,
              },
              {
                label: "Color",
                value: processedProduct.color,
                icon: faPalette,
              },
              {
                label: "Color Variants",
                value: processedProduct.colorVariant,
                icon: faPalette,
              },
              {
                label: "Storage",
                value: processedProduct.storage,
                icon: faHdd,
              },
              { label: "RAM", value: processedProduct.ram, icon: faMicrochip },
              {
                label: "Condition",
                value: processedProduct.condition,
                icon: faShield,
              },
              {
                label: "SIM Type",
                value: processedProduct.simType,
                icon: faSimCard,
              },
              {
                label: "Country",
                value: processedProduct.country,
                icon: faGlobe,
              },
              {
                label: "Country Variant",
                value: processedProduct.countryVariant,
                icon: faGlobe,
              },
              {
                label: "Network Bands",
                value: processedProduct.networkBands,
                icon: faWifi,
              },
              {
                label: "Negotiable",
                value: processedProduct.isNegotiable ? "Yes" : "No",
                icon: faHandshake,
              },
              {
                label: "Purchase Type",
                value: processedProduct.purchaseType,
                icon: faTruck,
              },
              {
                label: "Status",
                value: processedProduct.status,
                icon: faCheckCircle,
              },
            ]
              .filter((item) => item.value)
              .map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon
                      icon={item.icon}
                      className="text-blue-900 mr-2"
                    />
                    <h3 className="text-sm font-medium text-gray-700">
                      {item.label}
                    </h3>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {item.value}
                  </p>
                </div>
              ))}
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