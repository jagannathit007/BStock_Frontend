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
  faShoppingCart,
  faCircleInfo,
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
                        renderer={({ days, hours, minutes, seconds, completed }) => {
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
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="text"
                    className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter next min bid amount"
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
                  className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    auctionEnded || isCurrentUserBidder || isSubmittingBid || product.status === 'pending'
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : product.isLeading
                      ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                      : "bg-[#0071E0] hover:bg-blue-600 text-white cursor-pointer"
                  }`}
                  onClick={handleBidButtonClick}
                  disabled={auctionEnded || isCurrentUserBidder || isSubmittingBid || product.status === 'pending'}
                  title={product.status === 'pending' ? 'Bid not yet started' : ''}
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
            </>
          )}
        </div>
      </div>
    );
  }

  // LIST VIEW
  if (viewMode === "list") {
    return (
      <tr className="even:bg-gray-50 hover:bg-gray-100/60 cursor-pointer transition-colors border-b border-gray-200">
        {/* BRAND */}
        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 w-24" onClick={handleProductClick}>
          <span className="font-medium">{product.oem || '-'}</span>
          
        </td>

        {/* MODEL + DETAILS */}
        <td className="px-5 py-4 text-sm text-gray-900 border-r border-gray-200" onClick={handleProductClick}>
          <div className="flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2 flex-col">
                <div>
                {product.grade && (
                  <span 
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border border-gray-300 text-gray-700 bg-gray-100 cursor-pointer"
                    title={`Grade: ${product.grade}`}
                  >
                    {product.grade}
                  </span>
                )}
                <span className="font-medium tracking-tight">{product.model || product.modelFull}</span>
                </div>
                {/* Closes in row */}
            <div className="mt-1">
              <div className="text-xs font-semibold text-red-600 tabular-nums">
                {product.status === 'closed' ? (
                  <span className=""></span>
                ) : product.expiryTime ? (
                  <Countdown
                    date={product.expiryTime}
                    renderer={({ days, hours, minutes, seconds, completed }) => {
                      if (completed) return <span className="text-gray-500"></span>;
                      return (
                        <span className="text-red-600 font-semibold">
                          {days > 0 ? `${days}d ` : ""}
                          {String(hours).padStart(2, "0")}:
                          {String(minutes).padStart(2, "0")}:
                          {String(seconds).padStart(2, "0")}
                        </span>
                      );
                    }}
                  />
                ) : product.status === 'pending' ? (
                  <span className="text-gray-500"></span>
                ) : (
                  <span className="text-red-600 font-semibold">{product.timer || ''}</span>
                )}
              </div>
            </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {product.memory && (
                  <>
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 whitespace-nowrap cursor-pointer"
                      title={`Capacity: ${product.memory}`}
                    >
                      {product.memory}
                    </span>
                    {(product.color || product.carrier) && (
                      <span className="text-gray-400 mx-1">•</span>
                    )}
                  </>
                )}
                {product.color && (
                  <>
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 whitespace-nowrap cursor-pointer"
                      title={`Color: ${product.color}`}
                    >
                      {product.color}
                    </span>
                    {product.carrier && (
                      <span className="text-gray-400 mx-1">•</span>
                    )}
                  </>
                )}
                {product.carrier && (
                  <span 
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 whitespace-nowrap cursor-pointer"
                    title={`Carrier: ${product.carrier}`}
                  >
                    <FontAwesomeIcon icon={faSimCard} className="mr-1" />
                    SIM
                  </span>
                )}
              </div>
            </div>

            
          </div>
        </td>

        {product.status === 'closed' ? (
          <td className="px-4 py-3 text-sm text-gray-600 text-center" colSpan={4}>
            Closed
          </td>
        ) : product.status === 'pending' ? (
          <>
            {/* UNIT PRICE - Hide data */}
            <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-400 whitespace-nowrap text-right tabular-nums border-r border-gray-200 w-24">
              -
            </td>

            {/* CURRENT BID - Hide data */}
            <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap text-right tabular-nums border-r border-gray-200 w-24">
              -
            </td>

            {/* NEXT MIN BID INPUT - Hide data */}
            <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-400 whitespace-nowrap border-r border-gray-200 w-28">
              -
            </td>

            {/* ACTION - Hide data */}
            <td className="px-2 py-2 text-center whitespace-nowrap w-24">
              <button
                className="bg-gray-300 text-gray-500 cursor-not-allowed inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm"
                disabled
              >
                -
              </button>
            </td>
          </>
        ) : (
          <>
            {/* UNIT PRICE */}
            <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-900 whitespace-nowrap text-right tabular-nums border-r border-gray-200 w-24">
              {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
            </td>

            {/* CURRENT BID */}
            <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap text-right tabular-nums border-r border-gray-200 w-24">
              {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
            </td>

            {/* NEXT MIN BID INPUT */}
            <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600 whitespace-nowrap border-r border-gray-200 w-28">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                <input
                  type="text"
                  className="w-24 pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0071E0] disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            <td className="px-2 py-2 text-center whitespace-nowrap w-24">
              <button
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm ${
                  auctionEnded || isCurrentUserBidder || isSubmittingBid
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#0071E0] text-white hover:bg-blue-600 cursor-pointer"
                }`}
                onClick={handleBidButtonClick}
                disabled={auctionEnded || isCurrentUserBidder || isSubmittingBid}
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
                    {auctionEnded ? "Ended" : isCurrentUserBidder ? "Leading" : (product.isLeading ? "Leading" : "Bid")}
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
                    renderer={({ days, hours, minutes, seconds, completed }) => {
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
          <div className="flex mt-auto w-full gap-2 items-center">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="text"
                className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter next min bid amount"
                value={myMaxBidInput}
                disabled={auctionEnded || isSubmittingBid}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, "");
                  setMyMaxBidInput(val);
                }}
              />
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
                auctionEnded || isCurrentUserBidder || isSubmittingBid
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : product.isLeading
                  ? "hover:shadow-md bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  : "hover:shadow-md bg-[#0071E3] hover:bg-[#005bb5] text-white cursor-pointer"
              }`}
              onClick={handleBidButtonClick}
              disabled={auctionEnded || isCurrentUserBidder || isSubmittingBid}
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
