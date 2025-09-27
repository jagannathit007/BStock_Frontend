import React, { useEffect, useState } from "react";
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
  faBellSlash,
} from "@fortawesome/free-solid-svg-icons";
import AddToCartPopup from "./AddToCartPopup";
import CartService from "../../services/cart/cart.services";
import { ProductService } from "../../services/products/products.services";
import iphoneImage from "../../assets/iphone.png";
import Swal from "sweetalert2";

const ProductCard = ({
  product,
  viewMode = "grid",
  onRefresh,
  onWishlistChange,
  isInModal = false,
  onOpenBiddingForm, // New prop for opening BiddingForm
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
        return "bg-white-50";
      case "Low Stock":
        return "bg-white-50";
      case "Out of Stock":
        return "bg-gray-100";
      default:
        return "bg-white-50";
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
        if(confirm.isConfirmed) navigate("/profile?tab=business");
        
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
        return navigate("/signin");
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
        console.log('asdas')
        const confirm = await Swal.fire({
          icon: "warning",
          title: "Business Details Required",
          text: "Please add your business details before adding products to the cart.",
          confirmButtonText: "Go to Settings",
          confirmButtonColor: "#0071E0",
        });
        if(confirm.isConfirmed) navigate("/profile?tab=business");
        
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
        <tr
          className="hover:bg-gray-50 cursor-pointer"
          onClick={!isInModal ? handleProductClick : undefined}
        >
          <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="flex items-center min-w-[200px]">
              <img
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg mr-4"
                src={
                  imageError
                    ? iphoneImage
                    : `${import.meta.env.VITE_BASE_URL}/${imageUrl}`
                }
                alt={name}
                onError={handleImageError}
              />
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {name}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {description.split("•")[1]?.trim()}
                </div>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="flex items-center mt-1 sm:mt-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}
              >
                {isExpired && (
                  <FontAwesomeIcon
                    icon={faCalendarXmark}
                    className="w-3 h-3 mr-1"
                  />
                )}
                {getDisplayStatus()}
              </span>
            </div>
          </td>
          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="text-base sm:text-lg font-bold text-gray-900">
              ${price}
            </div>
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
              {isExpired
                ? "Expired"
                : stockStatus === "Low Stock"
                ? "Low stock"
                : "Available"}
            </div>
          </td>
          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{moq} units</div>
            <div className="text-xs text-gray-500">Minimum</div>
          </td>
          <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
            <div className="flex space-x-1 sm:space-x-2">
              <button
                className={`p-1 sm:p-2 cursor-pointer rounded-lg ${
                  isFavorite ? "text-red-500" : "text-gray-400"
                } `}
                onClick={handleToggleWishlist}
              >
                <FontAwesomeIcon
                  icon={isFavorite ? solidHeart : regularHeart}
                  className="text-sm sm:text-base"
                />
              </button>
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
                  className="bg-[#0071E0] cursor-pointer text-white p-1 sm:p-2 rounded-lg hover:bg-blue-600"
                  onClick={handleAddToCart}
                >
                  <FontAwesomeIcon
                    icon={faCartShopping}
                    className="text-sm sm:text-base"
                  />
                </button>
              )}

              {canNotify ? (
                notify ? (
                  <button
                    className="border border-red-300 cursor-pointer text-red-700 bg-red-50 p-1 sm:p-2 rounded-lg hover:bg-red-100 transition-colors duration-200"
                    onClick={(ev) => handleNotifyToggle(ev, false)}
                    title="Turn off notifications"
                  >
                    <FontAwesomeIcon
                      icon={faBellSlash}
                      className="text-sm sm:text-base mr-1"
                    />
                    <span className="hidden sm:inline text-xs font-medium">
                      Off
                    </span>
                  </button>
                ) : (
                  <button
                    className="flex items-center justify-center 
             border border-blue-300 text-blue-700 bg-blue-50 cursor-pointer
             w-8 h-8 sm:w-9 sm:h-10 
             rounded-lg hover:bg-blue-100 transition-colors duration-200"
                    onClick={(ev) => handleNotifyToggle(ev, true)}
                    title="Notify me when back in stock"
                  >
                    <FontAwesomeIcon
                      icon={faBell}
                      className="text-sm sm:text-base"
                    />
                  </button>
                )
              ) : !isExpired && !isOutOfStock ? (
                <button
                  className="border border-gray-300 cursor-pointer text-gray-700 p-1 sm:p-2 rounded-lg hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBiddingForm(product);
                  }}
                >
                  <FontAwesomeIcon
                    icon={faHandshake}
                    className="text-sm sm:text-base"
                  />
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-200 cursor-pointer text-gray-400 p-1 sm:p-2 rounded-lg cursor-not-allowed"
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
          <AddToCartPopup product={product} onClose={handlePopupClose} />
        )}
      </>
    );
  }

  return (
    <div
      className={`rounded-[18px] shadow-[2px_4px_12px_#00000014] hover:shadow-[6px_8px_24px_#00000026] transition-shadow duration-200 h-full flex flex-col cursor-pointer ${getCardBackgroundClass()}`}
      onClick={!isInModal ? handleProductClick : undefined}
    >
      <div className="relative flex-1">
        <img
          className="w-full h-40 sm:h-48 object-cover rounded-t-[18px]"
          src={
            imageError
              ? iphoneImage
              : `${import.meta.env.VITE_BASE_URL}/${imageUrl}`
          }
          alt={name}
          onError={handleImageError}
        />
        <div className="absolute top-2 right-2">
          <button
            className={`p-2 bg-white rounded-full cursor-pointer shadow-md ${
              isFavorite ? "text-red-500" : "text-gray-400"
            } w-10 h-10 flex items-center justify-center`}
            onClick={handleToggleWishlist}
          >
            <FontAwesomeIcon
              icon={isFavorite ? solidHeart : regularHeart}
              className="text-sm sm:text-base"
            />
          </button>
        </div>
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}
          >
            {isExpired && (
              <FontAwesomeIcon
                icon={faCalendarXmark}
                className="w-3 h-3 mr-1"
              />
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
        </div>

        <div className="text-xs text-gray-500 mb-3">
          • MOQ: {moq} units • {stockCount} available
          <br />
          {purchaseTypeLabel && (
            <span className="">• Purchase: {purchaseTypeLabel}</span>
          )}
        </div>

        <div className="flex space-x-2">
          {isExpired ? (
            <>
              <button
                className="flex-1 bg-gray-300  text-gray-500 py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium cursor-not-allowed"
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
                  className="flex-1 border border-red-300  text-red-700 bg-red-50 py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium hover:bg-red-100 cursor-pointer transition-colors duration-200 flex items-center justify-center"
                  onClick={(ev) => handleNotifyToggle(ev, false)}
                  title="Turn off notifications for notifying me when back in stock"
                >
                  <FontAwesomeIcon icon={faBellSlash} className="mr-1" />
                  Turn Off
                </button>
              ) : (
                <button
                  className="flex-1 border border-blue-300 text-blue-700 bg-blue-50 py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium hover:bg-blue-100 cursor-pointer transition-colors duration-200 flex items-center justify-center"
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
                className="flex-1 border border-gray-300  text-gray-700 py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium hover:bg-gray-50 cursor-pointer"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
              <button
                className="flex-1 bg-[#0071E0] text-white  py-1 sm:py-2 px-2 sm:px-3 rounded-3xl text-xs sm:text-sm font-medium hover:bg-blue-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBiddingForm(product); // Call handler with product
                }}
              >
                Offer
              </button>
            </>
          )}
        </div>
      </div>
      {isAddToCartPopupOpen && (
        <AddToCartPopup product={product} onClose={handlePopupClose} />
      )}
    </div>
  );
};

export default ProductCard;
