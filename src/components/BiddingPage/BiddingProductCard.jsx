import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGavel,
  faCrown,
  faEye,
  faClock,
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

  if (viewMode === "list") {
    return (
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={handleProductClick}
      >
        {/* MODEL */}
        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
          {product.modelFull}
        </td>

        {/* MEMORY */}
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {product.memory}
        </td>

        {/* GRADE */}
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {product.grade}
        </td>

        {/* UNITS */}
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {product.units || "-"}
        </td>

        {/* CARRIER */}
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {product.carrier || "-"}
        </td>

        {/* CLOSES IN */}
        <td className="px-4 py-3 text-sm font-medium text-red-600 whitespace-nowrap">
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
          ) : (
            product.timer
          )}
        </td>

        {/* BIDS */}
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {product.bids}
        </td>

        {/* UNIT PRICE (hidden on <md) */}
        <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
          {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
        </td>

        {/* CUR. BID */}
        <td className="px-4 py-3 text-sm font-medium text-[#0071E0] whitespace-nowrap">
          {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
        </td>

        {/* MY MAX BID (hidden on <lg) */}
        <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
            <input
              type="text"
              className="w-24 pl-5 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0071E0]"
              value={product.myMaxBid}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, "");
                setMyMaxBidInput(val);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </td>

        {/* BID NOW */}
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <button
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${product.isLeading
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-[#0071E0] text-white hover:bg-blue-600"
              }`}
            onClick={handleBidButtonClick}
          >
            <FontAwesomeIcon
              icon={product.isLeading ? faCrown : faGavel}
              className="mr-1"
            />
            {product.isLeading ? "Leading" : "Bid"}
          </button>
        </td>
      </tr>
    );
  }

  // ----- inside BiddingProductCard.jsx -----
  if (viewMode === "grid") {
    return (
      <div
        className="rounded-[18px] shadow-[2px_4px_12px_#00000014] hover:shadow-[6px_8px_24px_#00000026] transition-shadow duration-200 h-full flex flex-col cursor-pointer bg-white"
        onClick={handleProductClick}
      >
        {/* ---------- IMAGE ---------- */}
        <div className="relative flex-1">
          <img
            className="w-full h-40 sm:h-48 object-cover rounded-t-[18px]"
            src={imageError ? iphoneImage : imageUrl}
            alt={product.modelFull}
            onError={handleImageError}
          />
          {/* Live badge */}
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Live
            </span>
          </div>
        </div>

        {/* ---------- CARD BODY ---------- */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">

          {/* ---- Title line (same as screenshot) ---- */}
          <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
            {[
              product.modelFull,
              product.memory,
              product.carrier,
              product.units ? `${product.units} Units` : "",
              product.grade,
              product.cityState,
            ]
              .filter(Boolean)
              .join(", ")}
          </h3>

          {/* ---- Current bid ---- */}
          <div className="mt-2">
            <div className="text-xs text-gray-600">Current bid:</div>
            <div className="text-lg sm:text-xl font-bold text-[#0071E0]">
              {renderBidValue ? renderBidValue(product.currentBid) : product.currentBid}
            </div>
          </div>

          {/* ---- Avg. cost per unit ---- */}
          {product.unitPrice && (
            <div className="mt-1">
              <div className="text-xs text-gray-600">Avg. Cost Per Unit:</div>
              <div className="text-sm font-medium text-gray-900">
                {renderBidValue ? renderBidValue(product.unitPrice) : product.unitPrice}
              </div>
            </div>
          )}

          {/* ---- Bids ---- */}
          <div className="mt-1">
            <div className="text-xs text-gray-600">Bids:</div>
            <div className="text-sm font-medium text-gray-900">{product.bids}</div>
          </div>

          {/* ---- Timer ---- */}
          <div className="mt-2 flex justify-center">
            <div className="inline-flex items-center bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium w-full justify-center">
              <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-2" />
              {product.expiryTime ? (
                <Countdown
                  date={product.expiryTime}
                  renderer={({ days, hours, minutes, seconds, completed }) => {
                    if (completed) return <span className="font-semibold">Ended</span>;
                    return (
                      <span className="font-semibold">
                        {days > 0 ? `${days}d ` : ""}
                        {String(hours).padStart(2, "0")}:
                        {String(minutes).padStart(2, "0")}:
                        {String(seconds).padStart(2, "0")}
                      </span>
                    );
                  }}
                />
              ) : (
                <span className="font-semibold">{product.timer}</span>
              )}
            </div>
          </div>

          {/* ---- Action buttons ---- */}
          <div className="mt-3 flex space-x-2">
            <button
              className={`flex-1 px-3 py-2 rounded-3xl text-xs sm:text-sm font-medium cursor-pointer flex items-center justify-center ${product.isLeading
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-[#0071E0] text-white hover:bg-blue-600"
                }`}
              onClick={handleBidButtonClick}
            >
              <FontAwesomeIcon
                icon={product.isLeading ? faCrown : faGavel}
                className="mr-1 sm:mr-2"
              />
              {product.isLeading ? "Leading" : "Place Bid"}
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
