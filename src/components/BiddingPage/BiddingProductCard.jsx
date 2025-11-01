import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGavel,
  faCrown,
  faEye,
  faClock,
  faBookmark,
  faSimCard,
} from "@fortawesome/free-solid-svg-icons";
import iphoneImage from "../../assets/iphone.png";
import Countdown from "react-countdown";
import Swal from "sweetalert2";
import { useSocket } from "../../context/SocketContext";

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
  index = 0,
}) => {
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const [imageError, setImageError] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [myMaxBidInput, setMyMaxBidInput] = useState(() => {
    if (product?.minNextBid) {
      return product.minNextBid.toString();
    }
    const initial = typeof product?.myMaxBid === "string"
      ? product.myMaxBid.replace(/[^0-9.,]/g, "")
      : product?.myMaxBid || "";
    return initial?.toString() || "";
  });

  // Update input when currentPrice, minNextBid, or currentBid changes (on refresh or socket update)
  useEffect(() => {
    // Calculate the latest bid value
    let latestBidValue = null;
    
    // Priority: minNextBid > currentPrice > currentBid
    if (product?.minNextBid !== undefined && product?.minNextBid !== null) {
      latestBidValue = product.minNextBid;
    } else if (product?.currentPrice !== undefined && product?.currentPrice !== null) {
      // Extract numeric value from currentPrice if it's a string
      const currentPriceNum = typeof product.currentPrice === 'string'
        ? parseFloat(product.currentPrice.replace(/[$,]/g, ''))
        : product.currentPrice;
      latestBidValue = currentPriceNum;
    } else if (product?.currentBid !== undefined && product?.currentBid !== null) {
      // Extract numeric value from currentBid if it's a string
      const currentBidNum = typeof product.currentBid === 'string'
        ? parseFloat(product.currentBid.replace(/[$,]/g, ''))
        : product.currentBid;
      latestBidValue = currentBidNum;
    }
    
    // Only update if we have a valid value
    if (latestBidValue !== null && !isNaN(latestBidValue) && latestBidValue > 0) {
      const formattedValue = latestBidValue.toString();
      setMyMaxBidInput(formattedValue);
    }
  }, [product?.minNextBid, product?.currentPrice, product?.currentBid]);

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

      // Check for success: HTTP status 200-299, or response status 200, or message contains "success"
      const httpStatusOk = res?.status >= 200 && res?.status < 300;
      const responseStatusOk = res?.data?.status === 200;
      const hasData = res?.data?.data !== null && res?.data?.data !== undefined;
      const successMessage = res?.data?.message?.toLowerCase().includes('success');
      
      const isSuccess = httpStatusOk || responseStatusOk || hasData || successMessage;
      
      console.log('Is success:', isSuccess, { httpStatusOk, responseStatusOk, hasData, successMessage });

      if (isSuccess) {
        const successMsg = res?.data?.message || "Bid placed successfully";
        console.log('Bid successful, showing success message and refreshing...');
        
        // Join bid room for this product to receive real-time updates
        if (socketService && product.id) {
          console.log('Joining bid room for product:', product.id);
          socketService.joinBid(product.id);
        }
        
        Swal.fire({
          icon: "success",
          title: successMsg,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        
        // Refresh the table immediately after successful bid
        console.log('Calling onBidSuccess callback...');
        if (onBidSuccess) {
          onBidSuccess();
          console.log('onBidSuccess callback called');
        } else {
          console.warn('onBidSuccess callback is not provided');
        }
      } else {
        const msg = res?.data?.message || "Failed to place bid";
        console.log('Bid failed:', msg);
        Swal.fire({
          icon: "error",
          title: msg,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
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

  // MOBILE CARD VIEW - Minimal and professional design
  if (viewMode === "mobile") {
    const statusText = auctionEnded || product.status === 'ended' || product.status === 'closed' 
      ? "Ended" 
      : "Active";
    const statusColor = auctionEnded || product.status === 'ended' || product.status === 'closed' 
      ? "bg-red-600" 
      : "bg-green-600";

    return (
      <div
        className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3 transition-all duration-200 hover:shadow-md hover:border-gray-300"
        onClick={handleProductClick}
      >
        {/* Top Section with Brand and Status */}
        <div className="px-3 pt-3 pb-2.5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2 mb-2">
            {/* Brand */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-semibold text-sm text-gray-900">{product.oem || 'Brand'}</span>
                {product.units && (
                  <span className="text-xs text-gray-500">({product.units})</span>
                )}
              </div>
              <h3 className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
                {product.model || product.modelFull}
              </h3>
            </div>
            {/* Status Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-semibold text-white flex-shrink-0 ${statusColor}`}>
              {statusText}
            </span>
          </div>

          {/* Price Section */}
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-[10px] text-gray-500 font-medium mb-0.5">Current Bid</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-blue-600">
                  {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
                </span>
                {product.unitPrice && (
                  <span className="text-xs text-gray-500">
                    / {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
                  </span>
                )}
              </div>
            </div>
            {product.grade && (
              <div className="bg-gray-50 border border-gray-300 rounded-lg px-2 py-1">
                <div className="text-[9px] text-gray-500 font-medium">Grade</div>
                <div className="text-xs font-bold text-gray-900">{product.grade}</div>
              </div>
            )}
          </div>

          {/* Specs Badges */}
          {(product.memory || product.color || product.carrier) && (
            <div className="flex items-center gap-1 flex-wrap">
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
                  <FontAwesomeIcon icon={faSimCard} className="mr-0.5 text-[8px]" />
                  {product.carrier}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section with Timer and Bid Controls */}
        <div className="px-3 py-2.5">
          {product.status === 'closed' ? (
            <div className="flex items-center justify-center py-2">
              <span className="text-sm font-semibold text-gray-600">Auction Closed</span>
            </div>
          ) : (
            <>
              {/* Timer */}
              {product.expiryTime && !auctionEnded && (
                <div className="mb-2">
                  <div className="bg-red-50 border border-red-200 rounded-lg py-1.5 px-2">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px] text-red-600 font-medium">Time Remaining</span>
                    </div>
                    <div className="text-sm text-red-600 font-bold text-center tabular-nums">
                      {product.status === 'pending' ? (
                        <span className="text-xs text-gray-500">Starting Soon</span>
                      ) : (
                        <Countdown
                          date={product.expiryTime}
                          renderer={({ days, hours, minutes, seconds, completed }) => {
                            if (completed) return <span className="text-gray-500">Ended</span>;
                            return (
                              <span>
                                {days > 0 && <span>{days}d </span>}
                                {String(hours).padStart(2, "0")}:
                                {String(minutes).padStart(2, "0")}:
                                {String(seconds).padStart(2, "0")}
                              </span>
                            );
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bid Input and Button */}
              <div className="space-y-1.5">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">$</span>
                  <input
                    type="text"
                    className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
                    placeholder="Bid amount"
                    value={myMaxBidInput}
                    disabled={auctionEnded || isSubmittingBid || product.status === 'pending'}
                    title={product.status === 'pending' ? 'Bid not yet started' : ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, "");
                      setMyMaxBidInput(val);
                    }}
                  />
                </div>
                <button
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    auctionEnded || isCurrentUserBidder || isSubmittingBid || product.status === 'pending'
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : product.isLeading || isCurrentUserBidder
                      ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  }`}
                  onClick={handleBidButtonClick}
                  disabled={auctionEnded || isCurrentUserBidder || isSubmittingBid || product.status === 'pending'}
                  title={product.status === 'pending' ? 'Bid not yet started' : ''}
                >
                  {isSubmittingBid ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Spinner />
                      <span>Placing…</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <FontAwesomeIcon
                        icon={auctionEnded ? faClock : isCurrentUserBidder ? faCrown : (product.isLeading ? faCrown : faGavel)}
                        className={isCurrentUserBidder || product.isLeading ? "text-yellow-300" : ""}
                      />
                      <span>
                        {auctionEnded ? "Ended" : isCurrentUserBidder ? "Leading" : (product.isLeading ? "Leading" : "Place Bid")}
                      </span>
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // LIST VIEW
  if (viewMode === "list") {
    const rowStyle = {
      animationDelay: `${(index || 0) * 30}ms`,
      animation: "productFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      opacity: 0,
    };

    return (
      <tr 
        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 border-b border-gray-100 last:border-b-0 hover:shadow-sm"
        style={rowStyle}
      >
        {/* BRAND */}
        <td className="px-4 py-3 align-middle border-r border-gray-100" onClick={handleProductClick}>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-gray-900 leading-tight">{product.oem || '-'}</span>
            {product.units && (
              <span className="text-xs text-gray-500 mt-0.5">{product.units} {product.units === 1 ? 'unit' : 'units'}</span>
            )}
          </div>
        </td>

        {/* MODEL + DETAILS */}
        <td className="px-5 py-3 align-middle border-r border-gray-100" onClick={handleProductClick}>
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
          <td className="px-4 py-3 text-center align-middle" colSpan={4}>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
              Auction Closed
            </span>
          </td>
        ) : product.status === 'pending' ? (
          <>
            {/* UNIT PRICE */}
            <td className="hidden md:table-cell px-4 py-3 text-right align-middle border-r border-gray-100">
              <span className="text-xs text-gray-400">-</span>
            </td>

            {/* CURRENT BID */}
            <td className="px-4 py-3 text-right align-middle border-r border-gray-100">
              <span className="text-xs text-gray-400">-</span>
            </td>

            {/* NEXT MIN BID INPUT */}
            <td className="hidden lg:table-cell px-5 py-3 align-middle border-r border-gray-100">
              <span className="text-xs text-gray-400">-</span>
            </td>

            {/* ACTION */}
            <td className="px-4 py-3 text-center align-middle">
              <button
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
                disabled
              >
                Starting Soon
              </button>
            </td>
          </>
        ) : (
          <>
            {/* UNIT PRICE */}
            <td className="hidden md:table-cell px-4 py-3 text-right align-middle border-r border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 font-medium leading-tight">Unit</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums mt-0.5">
                  {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
                </span>
              </div>
            </td>

            {/* CURRENT BID */}
            <td className="px-4 py-3 text-right align-middle border-r border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 font-medium leading-tight">Current</span>
                <span className="text-base font-bold text-blue-600 tabular-nums mt-0.5">
                  {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
                </span>
              </div>
            </td>

            {/* NEXT MIN BID INPUT */}
            <td className="hidden lg:table-cell px-5 py-3 align-middle border-r border-gray-100">
              <div className="relative max-w-[130px]">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">$</span>
                <input
                  type="text"
                  className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  placeholder="0.00"
                  value={myMaxBidInput}
                  disabled={auctionEnded || isSubmittingBid}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                    setMyMaxBidInput(val);
                  }}
                />
              </div>
            </td>

            {/* ACTION */}
            <td className="px-4 py-3 text-center align-middle">
              <button
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 min-w-[100px] shadow-sm hover:shadow-md ${
                  auctionEnded
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : isCurrentUserBidder
                    ? "bg-green-100 text-green-700 border border-green-300 cursor-not-allowed"
                    : isSubmittingBid
                    ? "bg-blue-200 text-blue-700 cursor-not-allowed"
                    : product.isLeading
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 cursor-pointer"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 cursor-pointer"
                }`}
                onClick={handleBidButtonClick}
                disabled={auctionEnded || isCurrentUserBidder || isSubmittingBid}
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
    const statusText = auctionEnded || product.status === 'ended' || product.status === 'closed' 
      ? "Ended" 
      : "Active";

    return (
      <div
        className="rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-md hover:border-gray-300"
        onClick={handleProductClick}
        style={{
          animationDelay: `${(index || 0) * 40}ms`,
          animation: "productFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          opacity: 0,
        }}
      >
        {/* IMAGE */}
        <div className="relative bg-gray-50 h-40 overflow-hidden">
          <img
            className="w-full h-full object-contain p-2"
            src={imageError ? iphoneImage : imageUrl}
            alt={product.modelFull}
            onError={handleImageError}
          />
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-semibold bg-gray-900 text-white">
              {statusText}
            </span>
          </div>
          {/* Bookmark */}
          <button
            className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <FontAwesomeIcon icon={faBookmark} className="text-gray-600 text-xs" />
          </button>
        </div>

        {/* CARD BODY */}
        <div className="flex-1 flex flex-col p-2.5">
          {/* Brand & Model */}
          <div className="mb-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-gray-900">{product.oem || 'Brand'}</span>
              {product.grade && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-300 text-gray-700 bg-white">
                  {product.grade}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight">
              {product.model || product.modelFull}
            </h3>
          </div>

          {/* Price Section */}
          <div className="mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-gray-500 font-medium">Current Bid</span>
              <span className="text-lg font-bold text-gray-900">
                {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
              </span>
            </div>
            {product.unitPrice && (
              <div className="text-xs text-gray-500 mt-0.5">
                {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice} / unit
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-1.5 flex flex-col justify-center items-center">
              <div className="text-[9px] text-gray-600 font-medium leading-tight">Units</div>
              <div className="text-xs text-gray-900 font-semibold leading-tight mt-0.5">
                {product.units || "-"}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-1.5 flex flex-col justify-center items-center">
              <div className="text-[9px] text-gray-600 font-medium leading-tight">Memory</div>
              <div className="text-xs text-gray-900 font-semibold leading-tight mt-0.5">
                {product.memory || "-"}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-1.5 flex flex-col justify-center items-center">
              <div className="text-[9px] text-gray-600 font-medium leading-tight">Bids</div>
              <div className="text-xs text-gray-900 font-semibold leading-tight mt-0.5">
                {product.bids || 0}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-1.5 flex flex-col justify-center items-center">
              <div className="text-[9px] text-gray-600 font-medium leading-tight">Time</div>
              <div className="text-[10px] text-gray-900 font-semibold leading-tight mt-0.5 tabular-nums">
                {product.expiryTime ? (
                  <Countdown
                    date={product.expiryTime}
                    renderer={({ hours, minutes, seconds, completed }) => {
                      if (completed) return <span>End</span>;
                      return (
                        <span>
                          {String(hours).padStart(2, "0")}:
                          {String(minutes).padStart(2, "0")}
                        </span>
                      );
                    }}
                  />
                ) : product.status === 'pending' ? (
                  <span className="text-gray-500">Soon</span>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>

          {/* Specs Badges */}
          {(product.color || product.carrier) && (
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {product.color && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  {product.color}
                </span>
              )}
              {product.carrier && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  <FontAwesomeIcon icon={faSimCard} className="mr-0.5 text-[8px]" />
                  {product.carrier}
                </span>
              )}
            </div>
          )}

          {/* Bid Input + Action Button */}
          <div className="mt-auto space-y-1.5">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">$</span>
              <input
                type="text"
                className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
                placeholder="Bid amount"
                value={myMaxBidInput}
                disabled={auctionEnded || isSubmittingBid || product.status === 'pending'}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, "");
                  setMyMaxBidInput(val);
                }}
              />
            </div>
            <button
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                auctionEnded || isCurrentUserBidder || isSubmittingBid || product.status === 'pending'
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-gray-800 text-white cursor-pointer"
              }`}
              onClick={handleBidButtonClick}
              disabled={auctionEnded || isCurrentUserBidder || isSubmittingBid || product.status === 'pending'}
            >
              {isSubmittingBid ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Spinner />
                  <span>Placing…</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <FontAwesomeIcon
                    icon={auctionEnded ? faClock : isCurrentUserBidder ? faCrown : (product.isLeading ? faCrown : faGavel)}
                    className="text-[10px]"
                  />
                  <span>
                    {auctionEnded ? "Ended" : isCurrentUserBidder ? "Leading" : (product.isLeading ? "Leading" : "Place Bid")}
                  </span>
                </span>
              )}
            </button>
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
              isSubmittingBid
                ? "bg-gray-400 cursor-not-allowed"
                : isLeading
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-[#0071E0] text-white hover:bg-blue-600"
            }`}
            onClick={handleBidButtonClick}
            disabled={isSubmittingBid}
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
