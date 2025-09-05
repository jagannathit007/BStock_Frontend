import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faFilePdf,
  faDownload,
  faGavel,
  faArrowLeft,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

const BiddingProductDetails = ({ product, onBack }) => {
  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  py-4 ">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center text-sm text-gray-600 mb-5 cursor-pointer">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-[#0071E0] cursor-pointer"
        >
          Bidding
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Product Images */}
            <div className="relative w-full">
              <div className="w-full h-auto aspect-w-16 aspect-h-9 bg-gray-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: "500px" }}
                />
              </div>
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                <span className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  Live Auction
                </span>
              </div>
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                <button className="bg-white/90 backdrop-blur rounded-full p-1.5 sm:p-2 hover:bg-white">
                  <FontAwesomeIcon
                    icon={faHeart}
                    className="text-red-500 text-base sm:text-lg"
                  />
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 sm:p-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4">
                {product.description}
              </p>

              {/* Specifications */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                    Storage
                  </h3>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    256GB
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                    Color
                  </h3>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    Natural Titanium
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                    Grade
                  </h3>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    A+
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                    Quantity
                  </h3>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    1 Unit
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                  Description
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Excellent condition {product.name} with original box and
                  accessories. Device has been thoroughly tested and certified
                  Grade A+. No visible scratches or damage.
                </p>
              </div>

              {/* Manifest Download */}
              <div className="border-t pt-4 sm:pt-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Product Manifest
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center">
                      <FontAwesomeIcon
                        icon={faFilePdf}
                        className="text-red-500 text-lg sm:text-xl mr-2 sm:mr-3"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                          Product_Manifest_{product.name.replace(/\s+/g, "")}
                          .pdf
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Complete product specifications and certification
                        </p>
                      </div>
                    </div>
                    <button className="bg-[#0071E0] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-800 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faDownload}
                        className="mr-1 sm:mr-2"
                      />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bidding Panel */}
        <div className="space-y-4 sm:space-y-6">
          {/* Current Bid Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                Current Highest Bid
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-[#0071E0] mb-1">
                {product.currentBid}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Starting bid: {product.startingPrice}
              </p>
            </div>

            {/* Timer */}
            <div className="text-center mb-4 sm:mb-6">
              <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                Time Remaining
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  {product.timer}
                </div>
              </div>
            </div>

            {/* Bid Input */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Your Bid Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  id="bid-amount"
                  className="w-full pl-8 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-base sm:text-lg font-semibold focus:ring-2 focus:ring-[#0071E0] focus:border-[#0071E0]"
                  placeholder="1,246"
                  min="1246"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum bid: $1,246</p>
            </div>

            {/* Place Bid Button */}
            <button
              id="place-bid-btn"
              className="w-full bg-[#0071E0] text-white py-2 sm:py-3 px-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faGavel} className="mr-2" />
              Place Bid
            </button>

            {/* Bid Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {product.bids}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Total Bids
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  8
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Bidders</div>
              </div>
            </div>
          </div>

          {/* Bid History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Recent Bids
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between py-1 sm:py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <img
                    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3"
                    alt="Bidder"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm sm:text-base">
                      User***45
                    </div>
                    <div className="text-xs text-gray-500">2 min ago</div>
                  </div>
                </div>
                <div className="font-semibold text-[#0071E0] text-sm sm:text-base">
                  $1,245
                </div>
              </div>
              <div className="flex items-center justify-between py-1 sm:py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <img
                    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3"
                    alt="Bidder"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm sm:text-base">
                      User***23
                    </div>
                    <div className="text-xs text-gray-500">5 min ago</div>
                  </div>
                </div>
                <div className="font-semibold text-gray-600 text-sm sm:text-base">
                  $1,230
                </div>
              </div>
              <div className="flex items-center justify-between py-1 sm:py-2">
                <div className="flex items-center">
                  <img
                    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-9.jpg"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3"
                    alt="Bidder"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm sm:text-base">
                      User***78
                    </div>
                    <div className="text-xs text-gray-500">8 min ago</div>
                  </div>
                </div>
                <div className="font-semibold text-gray-600 text-sm sm:text-base">
                  $1,215
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base mb-1 sm:mb-2">
              Bidding Terms
            </h4>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              <li>• All bids are binding and non-refundable</li>
              <li>• Payment due within 24 hours of winning</li>
              <li>• Shipping calculated at checkout</li>
              <li>• 7-day return policy applies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiddingProductDetails;
