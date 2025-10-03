import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  FaApple,
  FaHeart,
  FaRegHeart,
  FaFilePdf,
  FaDownload,
  FaGavel,
  FaMemory,
  FaHdd,
  FaPalette,
  FaStar,
} from "react-icons/fa";
import { GiPriceTag } from "react-icons/gi";
import { IoTimeOutline, IoPeopleOutline } from "react-icons/io5";
import { RiAuctionLine } from "react-icons/ri";
import { convertPrice } from "../../utils/currencyUtils";

const BiddingProductDetails = ({ product, onBack }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [isLiked, setIsLiked] = useState(false);

  // Sample images array - you can replace this with actual product images
  const productImages = [
    product.imageUrl || "/images/iphone15.png",
    "/images/iphone15.png",
    "/images/iphone15.png",
    "/images/iphone15.png",
    "/images/iphone15.png",
  ];

  // Timer functionality - starts with 2 hours
  useEffect(() => {
    if (timeRemaining === 0) {
    
      setTimeRemaining(7200);
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time remaining
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Navigate images
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + productImages.length) % productImages.length
    );
  };

  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };

  if (!product) return null;

  return (
    <>
      <style>
        {`
          .thumbnail-container::-webkit-scrollbar {
            display: none;
          }
          
          /* Enhanced animations */
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out;
          }
          
          /* Smooth hover transitions */
          * {
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-600 mb-4 cursor-pointer">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-[#0071E0] cursor-pointer"
          >
            Bidding
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Product Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Product Images */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Main Image Display */}
              <div className="relative w-full h-auto bg-gray-100 rounded-t-lg">
                <div className="w-full h-80 lg:h-[500px] bg-gray-100 relative">
                  <img
                    src={productImages[currentImageIndex]}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain transition-all duration-500 ease-in-out"
                    style={{
                      filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.1))",
                    }}
                  />

                  {/* Status Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      In Stock
                    </span>
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      Live Auction
                    </span>
                  </div>

                  {/* Favorite Button */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className="bg-white/95 backdrop-blur-md rounded-full p-2 hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg"
                    >
                      <FontAwesomeIcon
                        icon={faHeart}
                        className={`${
                          isLiked ? "text-red-500 scale-110" : "text-gray-600"
                        } text-lg transition-all duration-300`}
                      />
                    </button>
                  </div>

                  {/* Navigation Arrows */}
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <button
                      onClick={prevImage}
                      className="bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors shadow-lg"
                    >
                      <FontAwesomeIcon
                        icon={faChevronLeft}
                        className="text-gray-700 text-lg"
                      />
                    </button>
                  </div>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button
                      onClick={nextImage}
                      className="bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors shadow-lg"
                    >
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-gray-700 text-lg"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="p-4 bg-gray-50 mt-2">
                <div className="flex justify-center gap-3">
                  {productImages.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => selectImage(index)}
                      className={`cursor-pointer transition-opacity ${
                        currentImageIndex === index
                          ? "opacity-100"
                          : "opacity-60 hover:opacity-80"
                      }}`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-16 h-16 lg:w-20 lg:h-20 object-contain bg-white rounded-lg border-2 transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                          currentImageIndex === index
                            ? "border-blue-500 scale-110 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Manifest Download */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                Product Manifest
              </h3>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <FaFilePdf className="text-red-500 text-lg" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        Product_Manifest_{product.name.replace(/\s+/g, "")}.pdf
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Complete product specifications
                      </p>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-red-600 hover:to-orange-600 transition-all flex items-center shadow-lg">
                    <FaDownload className="mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>
            {/* Bidding Terms */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <h4 className="font-bold text-gray-900 mb-2">Bidding Terms</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All bids are binding and non-refundable</li>
                <li>• Payment due within 24 hours of winning</li>
                <li>• Shipping calculated at checkout</li>
                <li>• 7-day return policy applies</li>
              </ul>
            </div>
          </div>

          {/* Product Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
              {/* Product Title and Brand */}
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">by Apple</p>
              </div>

              {/* Price + Negotiable + Timer */}
              <div className="flex items-center justify-between mb-6">
                {/* Left: Price + Negotiable */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {convertPrice(
                      parseFloat(product.currentBid.replace(/[$,]/g, ""))
                    )}
                  </span>
                </div>

                {/* Right: Timer */}
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-6 py-2">
                  <IoTimeOutline className="text-red-600 text-sm" />
                  <span className="text-sm font-mono font-semibold text-red-700">
                    {timeRemaining > 0 ? formatTime(timeRemaining) : "00:00:00"}
                  </span>
                </div>
              </div>

              {/* Key Features */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Key Features
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {/* Condition */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaStar className="text-blue-600 text-sm" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500">Condition</div>
                      <div className="text-xs font-semibold text-gray-900">
                        A+
                      </div>
                    </div>
                  </div>

                  {/* Color */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <FaPalette className="text-purple-600 text-sm" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500">Color</div>
                      <div className="text-xs font-semibold text-gray-900">
                        Silver
                      </div>
                    </div>
                  </div>

                  {/* RAM */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <FaMemory className="text-green-600 text-sm" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500">RAM</div>
                      <div className="text-xs font-semibold text-gray-900">
                        8GB
                      </div>
                    </div>
                  </div>

                  {/* Storage */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <FaHdd className="text-orange-600 text-sm" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500">Storage</div>
                      <div className="text-xs font-semibold text-gray-900">
                        256GB
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid Input */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Bid Amount
                </label>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="1,246"
                    min="1246"
                  />
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Minimum bid: $1,246
                </p>

                <button className="mt-4 w-full  bg-[#0071E0]  hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow flex items-center justify-center gap-2 transition-all">
                  <FaGavel className="text-sm" />
                  Place Bid
                </button>
              </div>

              {/* Bid Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white rounded-lg p-3 text-center border border-gray-200 shadow-sm">
                  <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                    <IoPeopleOutline />
                    {product.bids}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Total Bids</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-gray-200 shadow-sm">
                  <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                    <IoPeopleOutline />8
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Bidders</div>
                </div>
              </div>
            </div>

            {/* Recent Bids Section - Placed BELOW Product Manifest */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Recent Bids
              </h3>
              <div className="space-y-3">
                {[
                  {
                    user: "User***45",
                    time: "2 min ago",
                    amount: "$1,245",
                    avatar:
                      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg",
                  },
                  {
                    user: "User***23",
                    time: "5 min ago",
                    amount: "$1,230",
                    avatar:
                      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg",
                  },
                  {
                    user: "User***78",
                    time: "8 min ago",
                    amount: "$1,215",
                    avatar:
                      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-9.jpg",
                  },
                ].map((bid, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-gray-100"
                  >
                    <div className="flex items-center">
                      <img
                        src={bid.avatar}
                        className="w-8 h-8 rounded-full mr-3"
                        alt="Bidder"
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {bid.user}
                        </div>
                        <div className="text-xs text-gray-500">{bid.time}</div>
                      </div>
                    </div>
                    <div className="font-bold text-[#0071E0] text-lg">
                      {bid.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BiddingProductDetails;
