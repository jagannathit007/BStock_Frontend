import React, { useEffect, useState } from "react";
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
import iphoneImage from "../../assets/iphone.png";
import Swal from "sweetalert2";
import Countdown from "react-countdown";
import { convertPrice } from "../../utils/currencyUtils";

const ProductCard = ({
  product,
  viewMode = "grid",
  onRefresh,
  onWishlistChange,
  isInModal = false,
  onOpenBiddingForm, // New prop for opening BiddingForm
  isFlashDeal = false, // New prop to indicate flash deal context
}) => {
  const navigate = useNavigate();
  const [isAddToCartPopupOpen, setIsAddToCartPopupOpen] = useState(false);
  const [isNotifyMePopupOpen, setIsNotifyMePopupOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false); // Initialize with product's isFavorite
  const [notify, setNotify] = useState(Boolean(product?.notify));
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setNotify(Boolean(product?.notify));
  }, [product?.notify]);

  useEffect(() => {
    setIsFavorite(product.isFavorite || false);
  }, [product.isFavorite]);

  // Listen for wishlist updates from other components
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
  } = product;

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
  const canNotify = derivedOutOfStock && !isExpired;

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

  const getCardBackgroundClass = () => {
    if (isExpired) {
      return "bg-gray-200";
    }
    switch (stockStatus) {
      case "In Stock":
        return "bg-white-25";
      case "Low Stock":
        return "bg-white-25";
      case "Out of Stock":
        return "bg-gray-100";
      default:
        return "bg-white-25";
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

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isOutOfStock || isExpired) return;

    try {
      // Redirect unauthenticated users to login before any business checks
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn) {
        try {
          localStorage.setItem(
            "postLoginAction",
            JSON.stringify({
              type: "add_to_cart",
              productId: id || product?._id,
            })
          );
        } catch {}
        const hashPath = window.location.hash?.slice(1) || "/home";
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
          text: "Please add your business details before adding products to the cart.",
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

      const customerId = user._id || "";
      if (!customerId) {
        const hashPath = window.location.hash?.slice(1) || "/home";
        const returnTo = encodeURIComponent(hashPath);
        return navigate(`/login?returnTo=${returnTo}`);
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

    if (
      !businessProfile?.businessName ||
      businessProfile.businessName.trim() === ""
    ) {
      console.log("asdas");
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

    const productId = id || product?._id;

    try {
      await ProductService.createNotification({
        productId: productId,
        notifyType: "stock_alert",
        notify: nextValue,
      });
      setNotify(nextValue);
      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error("Notification toggle error:", err);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    const productId = id || product._id;

    try {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn) {
        const hashPath = window.location.hash?.slice(1) || "/home";
        const returnTo = encodeURIComponent(hashPath);
        return navigate(`/login?returnTo=${returnTo}`);
      }
      const newWishlistStatus = !isFavorite;
      setIsFavorite(newWishlistStatus); // Optimistic update

      await ProductService.toggleWishlist({
        productId: productId,
        wishlist: newWishlistStatus,
      });

      if (onWishlistChange) {
        onWishlistChange(productId, newWishlistStatus);
      }
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
      // Revert optimistic update on error
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

  const handleImageError = () => {
    setImageError(true);
  };

  if (viewMode === "list") {
    return (
      <>
        <div
          className="bg-white-25 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group border border-gray-100 overflow-hidden mb-3"
          onClick={!isInModal ? handleProductClick : undefined}
        >
          <div className="p-3">
            <div className="flex items-center space-x-3">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 flex items-center justify-center rounded-lg overflow-hidden bg-gray-50">
                  <img
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    alt={name}
                    src={
                      imageError
                        ? iphoneImage
                        : `${import.meta.env.VITE_BASE_URL}/${imageUrl}`
                    }
                    onError={handleImageError}
                  />
                </div>

                {/* ✅ status badge */}
                <div className="absolute -top-1 -right-1">
                  <span
                    className={`inline-flex items-center px-0.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}
                  >
                    {isExpired ? (
                      <FontAwesomeIcon
                        icon={faCalendarXmark}
                        className="w-2.5 h-2.5"
                      />
                    ) : (
                      <svg
                        data-prefix="fas"
                        data-icon="circle-check"
                        className="svg-inline--fa fa-circle-check w-2.5 h-2.5"
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
                  </span>
                </div>
              </div>

              {/* ✅ right content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#0071e3] transition-colors duration-200 truncate">
                      {name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs text-gray-500"></span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="text-xs text-gray-500">
                        {purchaseTypeLabel || "Partial"}
                      </span>
                      {!isExpired && !isOutOfStock && !isFlashDeal && (
                        <>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-xs bg-blue-50 text-[#0071e3] px-1.5 py-0.5 rounded-md font-medium">
                            Negotiable
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-base font-semibold text-gray-900 group-hover:text-[#0071e3] transition-colors duration-200">
                      {convertPrice(price)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {isExpired
                        ? "Expired"
                        : isOutOfStock
                        ? "Out of stock"
                        : "Starting price"}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {description.split(" • ").map((part, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-1.5 py-0.5 bg-gray-50 text-gray-600 text-xs rounded font-medium"
                    >
                      {part.trim()}
                    </span>
                  ))}
                  {product?.simType && (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-50 text-gray-600 text-xs rounded font-medium">
                      SIM: {product.simType}
                    </span>
                  )}
                </div>

                {!isExpired && !isOutOfStock && isFlashDeal && (
                  <div className="mt-3 flex justify-center">
                    <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-4 py-2 rounded-full text-xs font-semibold shadow-sm border border-red-200">
                      <FontAwesomeIcon
                        icon={faClock}
                        className="w-3 h-3 mr-2"
                      />
                      <Countdown
                        date={product.expiryTime}
                        renderer={({
                          days,
                          hours,
                          minutes,
                          seconds,
                          completed,
                        }) => {
                          if (completed) {
                            return (
                              <span className="font-semibold">
                                Flash Deal Ended
                              </span>
                            );
                          }
                          return (
                            <span className="font-semibold">
                              {days > 0 ? `${days} days ` : ""}
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

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div
                    className={`text-xs font-semibold ${
                      stockStatus === "In Stock"
                        ? "text-green-600"
                        : stockStatus === "Low Stock"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {stockCount} units
                  </div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-900">
                    {moq}
                  </div>
                  <div className="text-xs text-gray-500">Min Order</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isFavorite
                      ? "text-red-500 bg-red-50 hover:bg-red-100"
                      : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title={
                    isFavorite ? "Remove from wishlist" : "Add to wishlist"
                  }
                  onClick={handleToggleWishlist}
                >
                  <FontAwesomeIcon icon={faClock} className="text-sm" />
                </button>
                {isExpired ? (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-500 p-2 rounded-xl cursor-not-allowed"
                    title="Expired"
                  >
                    <FontAwesomeIcon
                      icon={faCalendarXmark}
                      className="text-sm"
                    />
                  </button>
                ) : isOutOfStock ? (
                  canNotify ? (
                    notify ? (
                      <button
                        className="border border-red-300 text-red-700 bg-red-50 p-2 rounded-xl hover:bg-red-100 transition-all duration-200"
                        onClick={(ev) => handleNotifyToggle(ev, false)}
                        title="Turn off notifications"
                      >
                        <FontAwesomeIcon
                          icon={faBellSlash}
                          className="text-sm"
                        />
                      </button>
                    ) : (
                      <button
                        className="border border-blue-300 text-blue-700 bg-blue-50 p-2 rounded-xl hover:bg-blue-100 transition-all duration-200"
                        onClick={(ev) => handleNotifyToggle(ev, true)}
                        title="Notify me when back in stock"
                      >
                        <FontAwesomeIcon icon={faBell} className="text-sm" />
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="bg-gray-300 text-gray-500 p-2 rounded-xl cursor-not-allowed"
                      title="Out of stock"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-sm" />
                    </button>
                  )
                ) : (
                  <>
                    <button
                      className="p-2 rounded-xl bg-[#0071e3] text-white hover:bg-[#005bb5] transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      title="Add to cart"
                      onClick={handleAddToCart}
                    >
                      <FontAwesomeIcon
                        icon={faCartShopping}
                        className="text-sm"
                      />
                    </button>
                    <button
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 hover:scale-105"
                      title="Make an offer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isLoggedIn =
                          localStorage.getItem("isLoggedIn") === "true";
                        if (!isLoggedIn) {
                          try {
                            localStorage.setItem(
                              "postLoginAction",
                              JSON.stringify({
                                type: "make_offer",
                                productId: id || product?._id,
                              })
                            );
                          } catch {}
                          const hashPath =
                            window.location.hash?.slice(1) || "/home";
                          const returnTo = encodeURIComponent(hashPath);
                          return navigate(`/login?returnTo=${returnTo}`);
                        }
                        onOpenBiddingForm(product);
                      }}
                    >
                      <FontAwesomeIcon icon={faHandshake} className="text-sm" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {isAddToCartPopupOpen && (
          <AddToCartPopup product={product} onClose={handlePopupClose} />
        )}
      </>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group overflow-hidden flex flex-col w-[406.67px] h-[691px] p-4 pb-5 max-w-full box-border ${getCardBackgroundClass()}`}
      onClick={!isInModal ? handleProductClick : undefined}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden mb-5 flex-shrink-0 w-full h-[300px] rounded-t-xl max-w-[375px]">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          src={
            imageError
              ? iphoneImage
              : `${import.meta.env.VITE_BASE_URL}/${imageUrl}`
          }
          alt={name}
          onError={handleImageError}
        />
        
        {/* In Stock Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass()}`}
          >
            {isExpired ? (
              <FontAwesomeIcon
                icon={faCalendarXmark}
                className="w-3 h-3 mr-1"
              />
            ) : (
              <svg
                data-prefix="fas"
                data-icon="circle-check"
                className="w-3 h-3 mr-1"
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
        <div className="absolute top-3 right-3">
          <button
            className={`p-2 bg-white rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 ${
              isFavorite ? "text-[#FB2C36]" : "text-gray-400 hover:text-[#FB2C36]"
            } w-8 h-8 flex items-center justify-center border border-gray-200`}
            onClick={handleToggleWishlist}
          >
            <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 w-full gap-5 min-h-0">
        {/* Product Title */}
        <h3 className="font-bold text-lg leading-none tracking-normal align-middle text-[#364153]">
          {name}
        </h3>

        {/* Price Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-1">From</span>
            <span className="text-lg font-semibold text-gray-900">
              {convertPrice(price)}
            </span>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full p-2.5 bg-white shadow-lg backdrop-blur-sm opacity-100">
            <span className="text-sm font-medium text-gray-700 font-sans">
              i
            </span>
          </div>
        </div>

        {/* Color Options and SKU */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Color Swatches */}
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-600 rounded-full border border-gray-300"></div>
              <div className="w-4 h-4 bg-white rounded-full border border-gray-300"></div>
              <div className="w-4 h-4 bg-orange-500 rounded-full border border-gray-300 flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="w-4 h-4 bg-black rounded-full border border-gray-300"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full border border-gray-300"></div>
            </div>
          </div>
          <span className="text-xs text-gray-500">SKU: {product?.sku || 'IP17PM512SLV'}</span>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
            <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">
              MOQ
            </div>
            <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
              {moq} Units
            </div>
          </div>
          <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
            <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">
              Model Code
            </div>
            <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
              {product?.modelCode || 'A2321'}
            </div>
          </div>
          <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
            <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">
              Delivery Time (EST)
            </div>
            <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
              3-5 Days
            </div>
          </div>
          <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
            <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">
              SIM Type
            </div>
            <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
              {product?.simType || 'E-SIM'}
            </div>
          </div>
        </div>

        {!isExpired && !isOutOfStock && isFlashDeal && (
          <div className="mb-3 flex justify-center">
            <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-4 py-2 rounded-full text-xs font-semibold shadow-sm border border-red-200 w-full justify-center">
              <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-2" />
              <Countdown
                date={product.expiryTime}
                renderer={({ days, hours, minutes, seconds, completed }) => {
                  if (completed) {
                    return (
                      <span className="font-semibold">Flash Deal Ended</span>
                    );
                  }
                  return (
                    <span className="font-semibold">
                      {days > 0 ? `${days} days ` : ""}
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

      {/* Button Container */}
      <div className="flex mt-auto w-full h-[46px] gap-4">
        {isExpired ? (
          <>
            <button
              className="flex-1 bg-gray-300 text-gray-500 py-2 px-3 rounded-lg text-xs font-semibold cursor-not-allowed"
              onClick={(e) => e.stopPropagation()}
            >
              <FontAwesomeIcon icon={faCalendarXmark} className="mr-1" />
              Expired
            </button>
          </>
        ) : isOutOfStock ? (
          <>
            {notify ? (
              <button
                className="flex-1 border border-red-300 text-red-700 bg-white py-2 px-3 rounded-lg text-xs font-semibold hover:bg-red-50 cursor-pointer transition-all duration-200 flex items-center justify-center"
                onClick={(ev) => handleNotifyToggle(ev, false)}
                title="Turn off notifications for notifying me when back in stock"
              >
                <FontAwesomeIcon icon={faBellSlash} className="mr-1" />
                Turn Off
              </button>
            ) : (
              <button
                className="flex-1 border border-[#0071E3] text-[#0071E3] bg-white py-2 px-3 rounded-lg text-xs font-semibold hover:bg-blue-50 cursor-pointer transition-all duration-200 flex items-center justify-center"
                onClick={(ev) => handleNotifyToggle(ev, true)}
                title="Notify me when back in stock"
              >
                <FontAwesomeIcon icon={faBell} className="mr-1" />
                Notify Me
              </button>
            )}
          </>
        ) : (
          <>
            <button
              className="flex-1 border border-gray-200 text-gray-700 bg-white py-2 px-3 rounded-lg text-xs font-semibold hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all duration-200 flex items-center justify-center"
              onClick={handleAddToCart}
            >
              <FontAwesomeIcon icon={faCartShopping} className="mr-1" />
              Add to Cart
            </button>
            <button
              className="flex-1 text-white py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md bg-[#0071E3] hover:bg-[#005bb5]"
              onClick={(e) => {
                e.stopPropagation();
                const isLoggedIn =
                  localStorage.getItem("isLoggedIn") === "true";
                if (!isLoggedIn) {
                  const hashPath = window.location.hash?.slice(1) || "/home";
                  const returnTo = encodeURIComponent(hashPath);
                  return navigate(`/login?returnTo=${returnTo}`);
                }
                onOpenBiddingForm(product); // Call handler with product
              }}
            >
              Make Offer
            </button>
          </>
        )}
      </div>
      {isAddToCartPopupOpen && (
        <AddToCartPopup product={product} onClose={handlePopupClose} />
      )}
    </div>
  );
};

export default ProductCard;
