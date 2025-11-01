import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGavel,
  faCrown,
  faEye,
  faClock,
  faBookmark,
  faShoppingCart,
  faCircleInfo,
  faSimCard,
} from "@fortawesome/free-solid-svg-icons";
import iphoneImage from "../../assets/iphone.png";
import Countdown from "react-countdown";
import Swal from "sweetalert2";
import { useSocket } from "../../context/SocketContext";
import toastHelper from "../../utils/toastHelper";
import { PRIMARY_COLOR, PRIMARY_COLOR_DARK } from "../../utils/colors";

// Reusable Spinner Component
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
 
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v8z"
    />
  </svg>
);

const BiddingProductCard = ({
  product,
  viewMode = "grid",
  onOpenBiddingForm,
  renderBidValue,
  onBidSuccess,
}) => {
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const [imageError, setImageError] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [myMaxBidInput, setMyMaxBidInput] = useState("");
  
  // Helper function to get min and max bid values
  const getBidRange = () => {
    const minBid = product?.minBid ? (typeof product.minBid === 'number' ? product.minBid : Number(product.minBid)) : null;
    const maxBid = product?.maxBid ? (typeof product.maxBid === 'number' ? product.maxBid : Number(product.maxBid)) : null;
    const maxBidPrice = product?.maxBidPrice ? (typeof product.maxBidPrice === 'number' ? product.maxBidPrice : Number(product.maxBidPrice)) : null;
    const minNextBid = product?.minNextBid ? (typeof product.minNextBid === 'string' 
      ? parseFloat(product.minNextBid.replace(/[$,]/g, '')) 
      : product.minNextBid) : null;
    
    return {
      minBid: minBid || minNextBid,
      maxBid: maxBid || maxBidPrice
    };
  };

  // Helper function to validate bid amount and get validation state
  const getBidValidation = () => {
    if (!myMaxBidInput || myMaxBidInput.trim() === '') {
      return { isValid: null, message: '' };
    }
    
    const amountNum = Number(String(myMaxBidInput).replace(/[,]/g, ""));
    if (isNaN(amountNum) || amountNum <= 0) {
      return { isValid: false, message: 'Enter a valid amount' };
    }
    
    const { minBid, maxBid } = getBidRange();
    
    if (minBid !== null && !isNaN(minBid) && amountNum < minBid) {
      return { isValid: false, message: `Minimum bid is $${minBid.toFixed(2)}` };
    }
    
    if (maxBid !== null && !isNaN(maxBid) && amountNum > maxBid) {
      return { isValid: false, message: `Maximum bid is $${maxBid.toFixed(2)}` };
    }
    
    return { isValid: true, message: '' };
  };
  
  const bidValidation = getBidValidation();
  const bidRange = getBidRange();

  // Helper function to get min and max bid placeholder text
  const getMinBidPlaceholder = () => {
    // Try to get minBid and maxBid from product
    const minBid = product?.minBid ? (typeof product.minBid === 'number' ? product.minBid : Number(product.minBid)) : null;
    const maxBid = product?.maxBid ? (typeof product.maxBid === 'number' ? product.maxBid : Number(product.maxBid)) : null;
    
    // Also check for maxBidPrice in case API is still sending it
    const maxBidPrice = product?.maxBidPrice ? (typeof product.maxBidPrice === 'number' ? product.maxBidPrice : Number(product.maxBidPrice)) : null;
    const effectiveMaxBid = maxBid || maxBidPrice;
    
    // Get minNextBid as fallback for minimum
    const minNextBid = product?.minNextBid ? (typeof product.minNextBid === 'string' 
      ? parseFloat(product.minNextBid.replace(/[$,]/g, '')) 
      : product.minNextBid) : null;
    
    const effectiveMinBid = minBid || minNextBid;
    
    // Show both min and max if available
    if (effectiveMinBid !== null && !isNaN(effectiveMinBid) && effectiveMinBid > 0) {
      if (effectiveMaxBid !== null && !isNaN(effectiveMaxBid) && effectiveMaxBid > 0) {
        return `Min: $${effectiveMinBid.toFixed(2)} | Max: $${effectiveMaxBid.toFixed(2)}`;
      }
      return `Min: $${effectiveMinBid.toFixed(2)}`;
    }
    
    return "Enter bid amount";
  };

  const {
    name,
    description,
    currentBid,
    startingPrice,
    lastInfo,
    lotInfo,
    bids,
    timer,
    imageUrl,
    isLeading,
    grade,
    color,
  } = product;

  const handleProductClick = (e) => {
    if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
      return;
    }
    const pid = product?.id || product?._id;
    if (pid) {
      navigate(`/bidding/product/${pid}`);
      return;
    }
    if (onOpenBiddingForm) {
      onOpenBiddingForm(product);
    }
  };

  const handleBidButtonClick = async (e) => {
    e.stopPropagation();
    if (auctionEnded || isSubmittingBid) return;

    try {
      const amountNum = Number(String(myMaxBidInput).replace(/[,]/g, ""));
      if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
        return Swal.fire({ icon: "warning", title: "Enter a valid amount" });
      }

      // Validate bid amount is within minBid and maxBid range
      const { minBid, maxBid } = getBidRange();

      if (minBid !== null && !isNaN(minBid) && amountNum < minBid) {
        return Swal.fire({
          icon: "warning",
          title: "Bid Too Low",
          text: `Your bid must be at least $${minBid.toFixed(2)}. Minimum bid for this product is $${minBid.toFixed(2)}.`,
        });
      }

      if (maxBid !== null && !isNaN(maxBid) && amountNum > maxBid) {
        return Swal.fire({
          icon: "warning",
          title: "Bid Too High",
          text: `Your bid cannot exceed $${maxBid.toFixed(2)}. Maximum bid for this product is $${maxBid.toFixed(2)}.`,
        });
      }

      setIsSubmittingBid(true);
      const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${baseUrl}/api/customer/bid/place`,
        { productId: product.id, amount: amountNum },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      console.log('Bid response:', res);
      console.log('Response data:', res?.data);
      console.log('Response status:', res?.status);
      console.log('Response data status:', res?.data?.status);

      // Check if response data is null
      const responseData = res?.data?.data;
      const responseMessage = res?.data?.message || "Bid placed successfully";

      if (responseData === null || responseData === undefined) {
        // Show Swal warning when data is null
        console.log('Bid response data is null, showing warning');
        Swal.fire({
          icon: "warning",
          title: "Warning",
          text: responseMessage || "Unable to place bid. Please try again.",
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#0071E0",
        });
      } else {
        // Show toast notification when data is not null
        console.log('Bid successful, showing toast notification and refreshing...');
        
        // Join bid room for this product to receive real-time updates
        if (socketService && product.id) {
          console.log('Joining bid room for product:', product.id);
          socketService.joinBid(product.id);
        }
        
        // Show toast at top right
        toastHelper.showTost(responseMessage, "success");
        
        // Refresh the table immediately after successful bid
        console.log('Calling onBidSuccess callback...');
        if (onBidSuccess) {
          onBidSuccess();
          console.log('onBidSuccess callback called');
        } else {
          console.warn('onBidSuccess callback is not provided');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to place bid";
      Swal.fire({ icon: "error", title: msg });
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleEyeButtonClick = (e) => {
    e.stopPropagation();
    console.log("Eye button clicked");
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const isAuctionEnded = () => {
    if (['ended', 'closed', 'expired'].includes(product.status)) return true;
    if (!product.expiryTime) return false;
    return new Date() >= new Date(product.expiryTime);
  };

  const auctionEnded = isAuctionEnded();

  const isCurrentUserHighestBidder = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = user._id || user.id;
    const highestBidderId = product.highestBidder?._id || product.highestBidder?.id;
    return currentUserId && highestBidderId && currentUserId === highestBidderId;
  };

  const isCurrentUserBidder = isCurrentUserHighestBidder();

  // MOBILE CARD VIEW - Matches the image style for mobile devices
  if (viewMode === "mobile") {
    const statusColor = auctionEnded || product.status === 'ended' || product.status === 'closed' 
      ? "bg-red-600" 
      : "bg-green-600";
    const statusText = auctionEnded || product.status === 'ended' || product.status === 'closed' 
      ? "Out of Stock" 
      : "In Stock";

    return (
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4"
        onClick={handleProductClick}
      >
        {/* Header with Status Badge and Icons */}
        <div className="relative px-3 pt-3 pb-2">
          {/* Product Name with In Stock Badge */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <h3 className="font-bold text-base text-gray-900 line-clamp-2">
                {product.modelFull}
              </h3>
              {product.grade && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 flex-shrink-0">
                  {product.grade}
                </span>
              )}
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusColor} text-white flex-shrink-0`}>
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></span>
              {statusText}
            </span>
          </div>

          {/* Price - Start from */}
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600">Start from</span>
              <span className="text-2xl font-bold text-green-600">
                {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
              </span>
            </div>
          </div>

          {/* Badges: Capacity • Color • Carrier */}
          <div className="mb-2">
            <div className="flex items-center gap-1 text-xs text-gray-700">
              {product.memory && (
                <>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 whitespace-nowrap">
                    {product.memory}
                  </span>
                  {(product.color || product.units || (typeof product.carrier === 'string' && product.carrier.trim() !== '')) && (
                    <span className="text-gray-400 mx-1">•</span>
                  )}
                </>
              )}
              {product.color && (
                <>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 whitespace-nowrap">
                    {product.color}
                  </span>
                  {(product.units || (typeof product.carrier === 'string' && product.carrier.trim() !== '')) && (
                    <span className="text-gray-400 mx-1">•</span>
                  )}
                </>
              )}
              {product.units && (
                <>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 whitespace-nowrap">
                    {product.units} UNIT{product.units !== 1 ? 'S' : ''}
                  </span>
                  {typeof product.carrier === 'string' && product.carrier.trim() !== '' && (
                    <span className="text-gray-400 mx-1">•</span>
                  )}
                </>
              )}
              {typeof product.carrier === 'string' && product.carrier.trim() !== '' && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 whitespace-nowrap cursor-pointer"
                  title={`Carrier: ${product.carrier}`}
                >
                  <FontAwesomeIcon icon={faSimCard} className="mr-1" />
                  {product.carrier}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="px-3 pb-3">
          {product.status === 'closed' ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-lg font-semibold text-gray-600">Closed</span>
            </div>
          ) : (
            <>
              {product.expiryTime && !auctionEnded && (
                <div className="grid grid-cols-1 gap-2.5 mb-2">
                  <div className="w-full rounded-xl border border-red-200 bg-red-50 py-1 px-2 flex flex-col justify-center shadow-sm">
                    
                    <div className="text-sm text-red-600 font-bold text-center mt-0.5">
                      <Countdown
                        date={product.expiryTime}
                        renderer={({ hours, minutes, seconds, completed }) => {
                          if (completed) return <span className="text-xs"></span>;
                          return (
                            <span className="text-sm font-bold">
                              {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                            </span>
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Next Min Bid input + Buttons in one row */}
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="text"
                      className={`w-full pl-5 pr-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        bidValidation.isValid === false 
                          ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                          : bidValidation.isValid === true 
                          ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                          : 'border-gray-300 focus:ring-[#0071E0]'
                      }`}
                      placeholder={getMinBidPlaceholder()}
                      value={myMaxBidInput}
                      disabled={auctionEnded || isSubmittingBid || product.status === 'pending'}
                      title={product.status === 'pending' ? 'Bid not yet started' : (bidRange.minBid && bidRange.maxBid ? `Bid range: $${bidRange.minBid.toFixed(2)} - $${bidRange.maxBid.toFixed(2)}` : '')}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, "");
                        setMyMaxBidInput(val);
                      }}
                    />
                    {bidValidation.message && (
                      <span className={`text-xs pl-1 ${bidValidation.isValid === false ? 'text-red-600' : 'text-green-600'}`}>
                        {bidValidation.message}
                      </span>
                    )}
                  </div>
                  <button
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      auctionEnded || isCurrentUserBidder || isSubmittingBid || product.status === 'pending' || bidValidation.isValid === false
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : product.isLeading
                        ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                        : bidValidation.isValid === true
                        ? "bg-[#0071E0] hover:bg-blue-600 text-white cursor-pointer"
                        : "bg-[#0071E0] hover:bg-blue-600 text-white cursor-pointer opacity-75"
                    }`}
                    onClick={handleBidButtonClick}
                    disabled={auctionEnded || isCurrentUserBidder || isSubmittingBid || product.status === 'pending' || bidValidation.isValid === false}
                    title={product.status === 'pending' ? 'Bid not yet started' : (bidValidation.isValid === false ? bidValidation.message : '')}
                  >
                    {isSubmittingBid ? (
                      <>
                        <Spinner />
                        <span className="ml-1">Placing…</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon
                          icon={auctionEnded || isCurrentUserBidder ? faClock : (product.isLeading ? faCrown : faGavel)}
                          className="mr-2"
                        />
                        {auctionEnded ? "Ended" : isCurrentUserBidder ? "Leading" : (product.isLeading ? "Leading" : "Bid")}
                      </>
                    )}
                  </button>
                </div>
                {product.maxBid != null && product.maxBid !== undefined && (
                  <span className="text-xs text-gray-600 pl-1">
                    Max bid limit: ${typeof product.maxBid === 'number' ? product.maxBid.toFixed(2) : product.maxBid}
                  </span>
                )}
                {product.minBid != null && product.minBid !== undefined && (
                  <span className="text-xs text-gray-500 pl-1">
                    Min bid: ${typeof product.minBid === 'number' ? product.minBid.toFixed(2) : product.minBid}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // LIST VIEW
  if (viewMode === "list") {
    return (
      <tr className="group hover:bg-blue-50/30 transition-all duration-150 border-b border-gray-100 last:border-b-0">
        {/* BRAND */}
        <td className="px-3 py-2.5 align-middle border-r border-gray-100" onClick={handleProductClick}>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-gray-900 leading-tight">{product.oem || '-'}</span>
            {product.units && (
              <span className="text-xs text-gray-500 mt-0.5">{product.units} {product.units === 1 ? 'unit' : 'units'}</span>
            )}
          </div>
        </td>

        {/* MODEL + DETAILS */}
        <td className="px-4 py-2.5 align-middle border-r border-gray-100" onClick={handleProductClick}>
          <div className="space-y-1.5">
            {/* Model Name with Grade */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900 leading-tight">{product.model || product.modelFull}</span>
              {product.grade && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-300 text-gray-700 bg-white">
                  {product.grade}
                </span>
              )}
            </div>
            
            {/* Specs Row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.memory && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  {product.memory}
                </span>
              )}
              {product.color && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  {product.color}
                </span>
              )}
              {product.carrier && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  <FontAwesomeIcon icon={faSimCard} className="mr-0.5 text-[9px]" />
                  {product.carrier}
                </span>
              )}
            </div>

            {/* Timer */}
            {product.status !== 'closed' && product.expiryTime && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {product.status === 'pending' ? (
                  <span className="text-xs text-gray-500 font-medium">Starting soon</span>
                ) : (
                  <div className="text-xs font-bold text-red-600 tabular-nums">
                    <Countdown
                      date={product.expiryTime}
                      renderer={({ days, hours, minutes, seconds, completed }) => {
                        if (completed) return <span className="text-gray-500">Ended</span>;
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
                )}
              </div>
            )}
          </div>
        </td>

        {product.status === 'closed' ? (
          <td className="px-3 py-2.5 text-center align-middle" colSpan={4}>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">
              Auction Closed
            </span>
          </td>
        ) : product.status === 'pending' ? (
          <>
            {/* UNIT PRICE */}
            <td className="hidden md:table-cell px-3 py-2.5 text-right align-middle border-r border-gray-100">
              <span className="text-xs text-gray-400">-</span>
            </td>

            {/* CURRENT BID */}
            <td className="px-3 py-2.5 text-right align-middle border-r border-gray-100">
              <span className="text-xs text-gray-400">-</span>
            </td>

            {/* NEXT MIN BID INPUT */}
            <td className="hidden lg:table-cell px-4 py-2.5 align-middle border-r border-gray-100">
              <span className="text-xs text-gray-400">-</span>
            </td>

            {/* ACTION */}
            <td className="px-3 py-2.5 text-center align-middle">
              <button
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                disabled
              >
                Starting Soon
              </button>
            </td>
          </>
        ) : (
          <>
            {/* UNIT PRICE */}
            <td className="hidden md:table-cell px-3 py-2.5 text-right align-middle border-r border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 font-medium leading-tight">Unit</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums mt-0.5">
                  {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
                </span>
              </div>
            </td>

            {/* CURRENT BID */}
            <td className="px-3 py-2.5 text-right align-middle border-r border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 font-medium leading-tight">Current</span>
                <span className="text-base font-bold text-blue-600 tabular-nums mt-0.5">
                  {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
                </span>
              </div>
            </td>

            {/* NEXT MIN BID INPUT */}
            <td className="hidden lg:table-cell px-4 py-2.5 align-middle border-r border-gray-100">
              <div className="flex flex-col gap-1">
                <div className="relative min-w-[180px] max-w-[220px]">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">$</span>
                  <input
                    type="text"
                    className={`w-full pl-5 pr-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed transition-all ${
                      bidValidation.isValid === false 
                        ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                        : bidValidation.isValid === true 
                        ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder={getMinBidPlaceholder()}
                    value={myMaxBidInput}
                    disabled={auctionEnded || isSubmittingBid}
                    title={bidRange.minBid && bidRange.maxBid ? `Bid range: $${bidRange.minBid.toFixed(2)} - $${bidRange.maxBid.toFixed(2)}` : ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, "");
                      setMyMaxBidInput(val);
                    }}
                  />
                  {bidValidation.message && (
                    <span className={`text-xs ${bidValidation.isValid === false ? 'text-red-600' : 'text-green-600'}`}>
                      {bidValidation.message}
                    </span>
                  )}
                </div>
                {product.maxBid != null && product.maxBid !== undefined && (
                  <span className="text-xs text-gray-600">
                    Max bid limit: ${typeof product.maxBid === 'number' ? product.maxBid.toFixed(2) : product.maxBid}
                  </span>
                )}
                {product.minBid != null && product.minBid !== undefined && (
                  <span className="text-xs text-gray-500">
                    Min bid: ${typeof product.minBid === 'number' ? product.minBid.toFixed(2) : product.minBid}
                  </span>
                )}
              </div>
            </td>

            {/* ACTION */}
            <td className="px-3 py-2.5 text-center align-middle">
              <button
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[90px] ${
                  auctionEnded
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : isCurrentUserBidder
                    ? "bg-green-100 text-green-700 border border-green-300 cursor-not-allowed"
                    : isSubmittingBid || bidValidation.isValid === false
                    ? "bg-blue-200 text-blue-700 cursor-not-allowed"
                    : product.isLeading
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow cursor-pointer"
                    : bidValidation.isValid === true
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow cursor-pointer"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow cursor-pointer opacity-75"
                }`}
                style={!auctionEnded && !isCurrentUserBidder && !isSubmittingBid && !product.isLeading ? { background: `linear-gradient(to right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` } : {}}
                onMouseEnter={(e) => { if (!auctionEnded && !isCurrentUserBidder && !isSubmittingBid && !product.isLeading) e.target.style.background = `linear-gradient(to right, ${PRIMARY_COLOR_DARK}, ${PRIMARY_COLOR_DARK})`; }}
                onMouseLeave={(e) => { if (!auctionEnded && !isCurrentUserBidder && !isSubmittingBid && !product.isLeading) e.target.style.background = `linear-gradient(to right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})`; }}
                onClick={handleBidButtonClick}
                disabled={auctionEnded || isCurrentUserBidder || isSubmittingBid || bidValidation.isValid === false}
                title={bidValidation.isValid === false ? bidValidation.message : ''}
              >
                {isSubmittingBid ? (
                  <>
                    <Spinner />
                    <span>Placing…</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={auctionEnded ? faClock : isCurrentUserBidder ? faCrown : (product.isLeading ? faCrown : faGavel)}
                      className={isCurrentUserBidder ? "text-green-600" : ""}
                    />
                    <span>
                      {auctionEnded ? "Ended" : isCurrentUserBidder ? "Leading" : (product.isLeading ? "Leading" : "Place Bid")}
                    </span>
                  </>
                )}
              </button>
            </td>
          </>
        )}
      </tr>
    );
  }

  // GRID VIEW
  if (viewMode === "grid") {
    return (
      <div
        className="rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 h-full flex flex-col bg-white overflow-hidden"
        onClick={handleProductClick}
      >
        {/* IMAGE */}
        <div className="relative bg-gray-100 h-48 sm:h-56">
          <img
            className="w-full h-full object-contain"
            src={imageError ? iphoneImage : imageUrl}
            alt={product.modelFull}
            onError={handleImageError}
          />
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FontAwesomeIcon icon={faBookmark} className="text-gray-600 text-sm" />
          </button>
        </div>

        {/* CARD BODY */}
        <div className="p-3 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base text-gray-900 line-clamp-2 flex-1">
              {product.modelFull}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-600 text-white flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></span>
              In Stock
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-1">From</span>
              <span className="text-xl font-bold text-gray-900">
                {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
              </span>
              <button className="ml-2 text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faCircleInfo} className="text-sm" />
              </button>
            </div>
            {product.grade && (
              <div className="bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                <span className="text-xs text-gray-600">Grade: </span>
                <span className="text-sm font-medium text-gray-900">{product.grade}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 w-full mb-2">
            <div className="w-full h-[48px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">Units</div>
              <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {product.units || "-"}
              </div>
            </div>
            <div className="w-full h-[48px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">Spaces</div>
              <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {product.memory || "-" }
              </div>
            </div>
            <div className="w-full h-[48px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">Bids</div>
              <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {product.bids}
              </div>
            </div>
            <div className="w-full h-[48px] rounded bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">Closes In</div>
              <div className="text-sm text-red-600 font-bold leading-5 tracking-normal text-center align-middle mt-0.5">
                {product.expiryTime ? (
                  <Countdown
                    date={product.expiryTime}
                    renderer={({ hours, minutes, seconds, completed }) => {
                      if (completed) return <span className="text-xs font-bold">Ended</span>;
                      return (
                        <span className="text-sm font-bold">
                          {String(hours).padStart(2, "0")}:
                          {String(minutes).padStart(2, "0")}:
                          {String(seconds).padStart(2, "0")}
                        </span>
                      );
                    }}
                  />
                ) : product.status === 'pending' ? (
                  <span className="text-gray-500">Pending</span>
                ) : (
                  product.timer || "-"
                )}
              </div>
            </div>
          </div>

          {/* Input + Buttons in one row */}
          <div className="flex flex-col mt-auto w-full gap-1">
            <div className="flex w-full gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="text"
                  className={`w-full pl-5 pr-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    bidValidation.isValid === false 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                      : bidValidation.isValid === true 
                      ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                      : 'border-gray-300 focus:ring-[#0071E0]'
                  }`}
                  placeholder={getMinBidPlaceholder()}
                  value={myMaxBidInput}
                  disabled={auctionEnded || isSubmittingBid}
                  title={bidRange.minBid && bidRange.maxBid ? `Bid range: $${bidRange.minBid.toFixed(2)} - $${bidRange.maxBid.toFixed(2)}` : ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                    setMyMaxBidInput(val);
                  }}
                />
                {bidValidation.message && (
                  <span className={`text-xs pl-1 ${bidValidation.isValid === false ? 'text-red-600' : 'text-green-600'}`}>
                    {bidValidation.message}
                  </span>
                )}
              </div>
            <button
              className={`border ${
                auctionEnded || isCurrentUserBidder
                  ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
              } py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center`}
              disabled={auctionEnded || isCurrentUserBidder}
              onClick={(e) => {
                e.stopPropagation();
                // Handle add to cart
              }}
            >
              <FontAwesomeIcon icon={faShoppingCart} className="mr-1" />
              Add
            </button>
            <button
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm ${
                auctionEnded || isCurrentUserBidder || isSubmittingBid || bidValidation.isValid === false
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : product.isLeading
                  ? "hover:shadow-md bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  : bidValidation.isValid === true
                  ? "hover:shadow-md bg-[#0071E3] hover:bg-[#005bb5] text-white cursor-pointer"
                  : "hover:shadow-md bg-[#0071E3] hover:bg-[#005bb5] text-white cursor-pointer opacity-75"
              }`}
              onClick={handleBidButtonClick}
              disabled={auctionEnded || isCurrentUserBidder || isSubmittingBid || bidValidation.isValid === false}
              title={bidValidation.isValid === false ? bidValidation.message : ''}
            >
              {isSubmittingBid ? (
                <>
                  <Spinner />
                  <span className="ml-1">Placing…</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={auctionEnded || isCurrentUserBidder ? faClock : (product.isLeading ? faCrown : faGavel)}
                    className="mr-1"
                  />
                  {auctionEnded ? "Auction Ended" : isCurrentUserBidder ? "Leading" : (product.isLeading ? "Leading" : "Bid")}
                </>
              )}
            </button>
            </div>
            {product.maxBid != null && product.maxBid !== undefined && (
              <span className="text-xs text-gray-600 pl-1">
                Max bid limit: ${typeof product.maxBid === 'number' ? product.maxBid.toFixed(2) : product.maxBid}
              </span>
            )}
            {product.minBid != null && product.minBid !== undefined && (
              <span className="text-xs text-gray-500 pl-1">
                Min bid: ${typeof product.minBid === 'number' ? product.minBid.toFixed(2) : product.minBid}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT / COMPACT CARD VIEW
  return (
    <div
      className="rounded-[18px] shadow-[2px_4px_12px_#00000014] hover:shadow-[6px_8px_24px_#00000026] transition-shadow duration-200 h-full flex flex-col cursor-pointer bg-white"
      onClick={handleProductClick}
    >
      <div className="relative flex-1">
        <img
          className="w-full h-40 sm:h-48 object-cover rounded-t-[18px]"
          src={imageError ? iphoneImage : imageUrl}
          alt={name}
          onError={handleImageError}
        />
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Live
          </span>
        </div>
        {isLeading && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <FontAwesomeIcon icon={faCrown} className="w-3 h-3 mr-1" />
              Leading
            </span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 truncate">{name}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">
          {description}
          {grade && " • "}
          {color && <span>{grade}</span>}
        </p>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Current Bid</span>
            <span className="text-xs text-gray-600">
              {renderBidValue ? renderBidValue(`${bids} bids`) : `${bids} bids`}
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#0071E0]">
            {renderBidValue ? renderBidValue(currentBid) : currentBid}
          </div>
          <div className="text-xs text-gray-500">
            Starting: {renderBidValue ? renderBidValue(startingPrice) : startingPrice}
          </div>
        </div>

        <div className="mb-3 flex justify-center">
          <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-4 py-2 rounded-full text-xs font-semibold shadow-sm border border-red-200 w-full justify-center">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-2" />
            {product.expiryTime ? (
              <Countdown
                date={product.expiryTime}
                renderer={({ days, hours, minutes, seconds, completed }) => {
                  if (completed) return <span className="font-semibold">Auction Ended</span>;
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
            ) : (
              <span className="font-semibold">{timer}</span>
            )}
          </div>
        </div>

        {(lastInfo || lotInfo) && (
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            {lastInfo && <span>{lastInfo}</span>}
            {lotInfo && <span>{lotInfo}</span>}
          </div>
        )}

        <div className="flex space-x-2">
          <button
            className={`flex-1 px-3 py-2 rounded-3xl text-xs sm:text-sm font-medium cursor-pointer flex items-center justify-center ${
              isSubmittingBid || bidValidation.isValid === false
                ? "bg-gray-400 cursor-not-allowed"
                : isLeading
                ? "bg-green-600 text-white hover:bg-green-700"
                : bidValidation.isValid === true
                ? "bg-[#0071E0] text-white hover:bg-blue-600"
                : "bg-[#0071E0] text-white hover:bg-blue-600 opacity-75"
            }`}
            style={!isSubmittingBid && !isLeading ? { backgroundColor: PRIMARY_COLOR } : {}}
            onMouseEnter={(e) => { if (!isSubmittingBid && !isLeading) e.target.style.backgroundColor = PRIMARY_COLOR_DARK; }}
            onMouseLeave={(e) => { if (!isSubmittingBid && !isLeading) e.target.style.backgroundColor = PRIMARY_COLOR; }}
            onClick={handleBidButtonClick}
            disabled={isSubmittingBid || bidValidation.isValid === false}
            title={bidValidation.isValid === false ? bidValidation.message : ''}
          >
            {isSubmittingBid ? (
              <>
                <Spinner />
                <span className="ml-1">Placing…</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={isLeading ? faCrown : faGavel} className="mr-1 sm:mr-2" />
                {isLeading ? "Leading Bid" : "Place Bid"}
              </>
            )}
          </button>

          <button
            className="border border-gray-300 rounded-lg hover:bg-gray-50 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center cursor-pointer"
            onClick={handleEyeButtonClick}
          >
            <FontAwesomeIcon icon={faEye} className="text-gray-600 text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BiddingProductCard;
