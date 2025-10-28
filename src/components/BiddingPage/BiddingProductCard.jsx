import React, { useState } from "react";
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

const BiddingProductCard = ({
  product,
  viewMode = "grid",
  onOpenBiddingForm,
  renderBidValue,
}) => {
  const [imageError, setImageError] = useState(false);

  // Extract bidding-specific properties
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
    // Navigate to product details or show bidding form
    if (onOpenBiddingForm) {
      onOpenBiddingForm(product);
    }
  };

  const handleBidButtonClick = async (e) => {
    e.stopPropagation();
    if (onOpenBiddingForm) {
      await onOpenBiddingForm(product);
    }
  };

  const handleEyeButtonClick = (e) => {
    e.stopPropagation();
    // Eye button click - no action needed since bid values are always shown
    console.log("Eye button clicked");
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Check if auction has ended
  const isAuctionEnded = () => {
    // First check if API explicitly says it's ended
    if (product.status === 'ended' || product.status === 'closed' || product.status === 'expired') {
      return true;
    }
    
    if (!product.expiryTime) return false;
    const now = new Date();
    const endDate = new Date(product.expiryTime);
    return now >= endDate;
  };

  const auctionEnded = isAuctionEnded();

  if (viewMode === "list") {
    return (
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={handleProductClick}
      >
        {/* MODEL / UNIT / MEMORY / CARRIER */}
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

        {/* GRADE */}
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap text-center">
          {product.grade}
        </td>

        {/* CLOSES IN */}
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

        {/* BIDS */}
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap text-center">
          {product.bids}
        </td>

        {/* UNIT PRICE (hidden on <md) */}
        <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-900 whitespace-nowrap text-center">
          {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
        </td>

        {/* CUR. BID */}
        <td className="px-4 py-3 text-sm font-medium text-[#0071E0] whitespace-nowrap text-center">
          {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
        </td>

        {/* MY MAX BID (hidden on <lg) */}
        <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
            <input
              type="text"
              className="w-24 pl-5 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0071E0] disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="0.00"
              defaultValue={
                typeof product.myMaxBid === "string"
                  ? product.myMaxBid.replace(/[^0-9.,]/g, "") || ""
                  : product.myMaxBid ?? ""
              }
              disabled={auctionEnded}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, "");
                // Handle input change if needed
              }}
            />
          </div>
        </td>

        {/* BID NOW */}
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <button
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${auctionEnded
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : product.isLeading
              ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
              : "bg-[#0071E0] text-white hover:bg-blue-600 cursor-pointer"
              }`}
            onClick={auctionEnded ? undefined : handleBidButtonClick}
            disabled={auctionEnded}
          >
            <FontAwesomeIcon
              icon={auctionEnded ? faClock : (product.isLeading ? faCrown : faGavel)}
              className="mr-1"
            />
            {auctionEnded ? "Ended" : (product.isLeading ? "Leading" : "Bid")}
          </button>
        </td>
      </tr>
    );
  }

  // ----- inside BiddingProductCard.jsx -----
  if (viewMode === "grid") {
    return (
      <div
        className="rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 h-full flex flex-col bg-white overflow-hidden"
        onClick={handleProductClick}
      >
        {/* ---------- IMAGE ---------- */}
        <div className="relative bg-gray-100 h-48 sm:h-56">
          <img
            className="w-full h-full object-contain"
            src={imageError ? iphoneImage : imageUrl}
            alt={product.modelFull}
            onError={handleImageError}
          />
          {/* Badges */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-600 text-white">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></span>
              In Stock
            </span>
          </div>
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Handle bookmark
            }}
          >
            <FontAwesomeIcon icon={faBookmark} className="text-gray-600 text-sm" />
          </button>
        </div>

        {/* ---------- CARD BODY ---------- */}
        <div className="p-4 flex-1 flex flex-col">

          {/* ---- Product Name ---- */}
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
            {product.modelFull}
          </h3>

          {/* ---- Price and Grade ---- */}
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

          {/* ---- Specifications Grid ---- */}
          <div className="grid grid-cols-2 gap-2.5 w-full mb-3">
            <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">
                Units
              </div>
              <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {product.units || "-"}
              </div>
            </div>
            <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">
                Closes In
              </div>
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
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">
                Bids
              </div>
              <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {product.bids}
              </div>
            </div>
            <div className="w-full h-[54px] rounded border border-gray-100 bg-white py-1 px-2 flex flex-col justify-center items-center box-border">
              <div className="text-xs text-gray-900 font-normal leading-5 tracking-normal text-center align-middle">
                Unit Price
              </div>
              <div className="text-sm text-gray-500 font-medium leading-5 tracking-normal text-center align-middle mt-0.5">
                {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
              </div>
            </div>
          </div>

          {/* ---- My Max Bid Input ---- */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">My Max Bid</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="text"
                className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter max bid"
                defaultValue={
                  typeof product.myMaxBid === "string"
                    ? product.myMaxBid.replace(/[^0-9.,]/g, "") || ""
                    : product.myMaxBid ?? ""
                }
                disabled={auctionEnded}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, "");
                  // Handle input change if needed
                }}
              />
            </div>
          </div>

          {/* ---- Action buttons ---- */}
          <div className="flex mt-auto w-full h-[46px] gap-4">
            <button
              className={`flex-1 border ${
                auctionEnded
                  ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
              } py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center`}
              disabled={auctionEnded}
            >
              <FontAwesomeIcon icon={faShoppingCart} className="mr-1" />
              Add to Cart
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm ${
                auctionEnded
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : product.isLeading
                  ? "hover:shadow-md bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  : "hover:shadow-md bg-[#0071E3] hover:bg-[#005bb5] text-white cursor-pointer"
              }`}
              onClick={auctionEnded ? undefined : handleBidButtonClick}
              disabled={auctionEnded}
            >
              <FontAwesomeIcon
                icon={auctionEnded ? faClock : (product.isLeading ? faCrown : faGavel)}
                className="mr-1"
              />
              {auctionEnded ? "Auction Ended" : (product.isLeading ? "Leading" : "Make Offer")}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`rounded-[18px] shadow-[2px_4px_12px_#00000014] hover:shadow-[6px_8px_24px_#00000026] transition-shadow duration-200 h-full flex flex-col cursor-pointer bg-white`}
      onClick={handleProductClick}
    >
      <div className="relative flex-1">
        <img
          className="w-full h-40 sm:h-48 object-cover rounded-t-[18px]"
          src={
            imageError
              ? iphoneImage
              : imageUrl
          }
          alt={name}
          onError={handleImageError}
        />

        {/* Live Badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Live
          </span>
        </div>

        {/* Crown for Leading Bid */}
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
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 truncate">
          {name}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">
          {description}
          {grade && " • "}
          {color && <span>{grade}</span>}
        </p>

        {/* Grade and Color Info */}
        {/* {(grade || color) && (
          <div className="text-xs text-gray-500 mb-2">
            {grade && <span>Grade: {grade}</span>}
            {grade && color && " • "}
            {color && <span>Color: {color}</span>}
          </div>
        )} */}

        {/* Bidding Information */}
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

          {/* {lastReference && (
            <div className="text-xs text-gray-500">
              Reference: {lastReference}
            </div>
          )} */}
        </div>

        {/* Timer */}
        <div className="mb-3 flex justify-center">
          <div className="inline-flex items-center bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-shadow duration-200 w-full justify-center">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-2" />
            {product.expiryTime ? (
              <Countdown
                date={product.expiryTime}
                renderer={({ days, hours, minutes, seconds, completed }) => {
                  if (completed) {
                    return <span className="font-semibold">Auction Ended</span>;
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
            ) : (
              <span className="font-semibold">{timer}</span>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {(lastInfo || lotInfo) && (
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            {lastInfo && <span>{lastInfo}</span>}
            {lotInfo && <span>{lotInfo}</span>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            className={`flex-1 px-3 py-2 rounded-3xl text-xs sm:text-sm font-medium cursor-pointer flex items-center justify-center ${isLeading
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-[#0071E0] text-white hover:bg-blue-600"
              }`}
            onClick={handleBidButtonClick}
          >
            <FontAwesomeIcon
              icon={isLeading ? faCrown : faGavel}
              className="mr-1 sm:mr-2"
            />
            {isLeading ? "Leading Bid" : "Place Bid"}
          </button>

          <button
            className="border border-gray-300 rounded-lg hover:bg-gray-50 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center cursor-pointer"
            onClick={handleEyeButtonClick}
          >
            <FontAwesomeIcon
              icon={faEye}
              className="text-gray-600 text-sm"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BiddingProductCard;
