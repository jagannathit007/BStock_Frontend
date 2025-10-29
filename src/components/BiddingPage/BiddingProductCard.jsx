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
} from "@fortawesome/free-solid-svg-icons";
import iphoneImage from "../../assets/iphone.png";
import Countdown from "react-countdown";
import Swal from "sweetalert2";

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

      if (res?.data?.data) {
        Swal.fire({
          icon: "success",
          title: res?.data?.message,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        if (onBidSuccess) onBidSuccess();
      } else {
        const msg = res?.data?.message || "Failed to place bid";
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

  // LIST VIEW
  if (viewMode === "list") {
    return (
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={handleProductClick}>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          <div className="flex flex-col">
            <span className="font-medium">{product.modelFull}</span>
            <div className="flex items-center text-xs text-gray-500 mt-1 gap-1.5">
              <span>{product.units || "-"} UNIT{product.units !== 1 ? 'S' : ''}</span>
              {product.memory && (
                <>
                  <span>•</span>
                  <span>{product.memory}</span>
                </>
              )}
              {product.carrier && (
                <>
                  <span>•</span>
                  <span>{product.carrier}</span>
                </>
              )}
            </div>
          </div>
        </td>

        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap text-center">
          {product.grade}
        </td>

        <td className="px-4 py-3 text-sm font-medium text-red-600 whitespace-nowrap text-center">
          {product.expiryTime ? (
            <Countdown
              date={product.expiryTime}
              renderer={({ days, hours, minutes, seconds, completed }) => {
                if (completed) return <span>Ended</span>;
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
          ) : product.status === 'pending' ? (
            <span className="text-gray-500">Pending</span>
          ) : (
            product.timer || "-"
          )}
        </td>

        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap text-center">
          {product.bids}
        </td>

        <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-900 whitespace-nowrap text-center">
          {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
        </td>

        <td className="px-4 py-3 text-sm font-medium text-[#0071E0] whitespace-nowrap text-center">
          {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
        </td>

        <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
            <input
              type="text"
              className="w-24 pl-5 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0071E0] disabled:bg-gray-100 disabled:cursor-not-allowed"
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

        <td className="px-4 py-3 text-center whitespace-nowrap">
          <button
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
              auctionEnded || isCurrentUserBidder || isSubmittingBid
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : product.isLeading
                ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
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
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-600 text-white">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></span>
              In Stock
            </span>
          </div>
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FontAwesomeIcon icon={faBookmark} className="text-gray-600 text-sm" />
          </button>
        </div>

        {/* CARD BODY */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
            {product.modelFull}
          </h3>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-1">From</span>
              <span className="text-xl font-bold text-gray-900">
                {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
              </span>
              <button className="ml-2 text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faCircleInfo} className="text-sm" />
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
              <span className="text-xs text-gray-600">Grade: </span>
              <span className="text-sm font-medium text-gray-900">{product.grade}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full mb-3">
            <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">Units</div>
              <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {product.units || "-"}
              </div>
            </div>
            <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">Closes In</div>
              <div className="text-sm text-red-600 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {product.expiryTime ? (
                  <Countdown
                    date={product.expiryTime}
                    renderer={({ days, hours, minutes, seconds, completed }) => {
                      if (completed) return <span className="text-xs">Ended</span>;
                      return (
                        <span className="text-sm">
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
            <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">Bids</div>
              <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {product.bids}
              </div>
            </div>
            <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">Unit Price</div>
              <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
              </div>
            </div>
          </div>

          {/* MY MAX BID */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">My Max Bid</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="text"
                className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter max bid"
                value={myMaxBidInput}
                disabled={auctionEnded || isSubmittingBid}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, "");
                  setMyMaxBidInput(val);
                }}
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex mt-auto w-full h-[46px] gap-4">
            <button
              className={`flex-1 border ${
                auctionEnded || isCurrentUserBidder
                  ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
              } py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center`}
              disabled={auctionEnded || isCurrentUserBidder}
            >
              <FontAwesomeIcon icon={faShoppingCart} className="mr-1" />
              Add to Cart
            </button>

            <button
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm ${
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
                  {auctionEnded ? "Auction Ended" : isCurrentUserBidder ? "Leading" : (product.isLeading ? "Leading" : "Make Offer")}
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
          <div className="inline-flex items-center bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-shadow duration-200 w-full justify-center">
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
