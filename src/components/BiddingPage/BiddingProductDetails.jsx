import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faClock,
  faDatabase,
  faMicrochip,
  faPalette,
  faShield,
  faGlobe,
  faTag,
  faBarcode,
  faSimCard,
  faWifi,
  faTruck,
  faCheckCircle,
  faGavel,
} from "@fortawesome/free-solid-svg-icons";
import iphoneImage from "../../assets/iphone.png";
import { convertPrice } from "../../utils/currencyUtils";
import { PRIMARY_COLOR, PRIMARY_COLOR_LIGHT, PRIMARY_COLOR_DARK } from "../../utils/colors";

const BiddingProductDetails = ({ product }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [thumbErrors, setThumbErrors] = useState({});
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);

  // Get product images
  const getProductImages = () => {
    if (!product) return [iphoneImage];
    const images = [];
    
    // Add main image if available
    if (product.imageUrl) images.push(product.imageUrl);
    
    // Add images array if available
    if (Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && !images.includes(img)) images.push(img);
      });
    }
    
    return images.length > 0 ? images : [iphoneImage];
  };

  const productImages = getProductImages();

  // Timer logic
  useEffect(() => {
    const updateTimers = () => {
      if (product?.expiryTime) {
        const expiryDate = new Date(product.expiryTime);
        const now = new Date();
        const difference = expiryDate - now;

        if (difference <= 0) {
          setTimeLeft(null);
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateTimers();
    const timer = setInterval(updateTimers, 1000);
    return () => clearInterval(timer);
  }, [product?.expiryTime]);

  const handleImageError = () => setImageError(true);
  const handleThumbnailError = (index) => {
    setThumbErrors((prev) => ({ ...prev, [index]: true }));
  };

  // Helper function to convert string to title case
  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toString()
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Color mapping helper
  const getSpecColor = (colorName) => {
    const colorMap = {
      primary: { bg: PRIMARY_COLOR_LIGHT, icon: PRIMARY_COLOR, hover: `${PRIMARY_COLOR}20` },
      green: { bg: '#dcfce7', icon: '#16a34a', hover: '#bbf7d0' },
      purple: { bg: '#f3e8ff', icon: '#9333ea', hover: '#e9d5ff' },
      orange: { bg: '#fed7aa', icon: '#ea580c', hover: '#fdba74' },
      indigo: { bg: '#e0e7ff', icon: '#4f46e5', hover: '#c7d2fe' },
      pink: { bg: '#fce7f3', icon: '#db2777', hover: '#fbcfe8' },
      cyan: { bg: '#cffafe', icon: '#0891b2', hover: '#a5f3fc' },
      teal: { bg: '#ccfbf1', icon: '#0d9488', hover: '#99f6e4' },
      amber: { bg: '#fef3c7', icon: '#d97706', hover: '#fde68a' },
      emerald: { bg: '#d1fae5', icon: '#10b981', hover: '#a7f3d0' },
    };
    return colorMap[colorName] || colorMap.primary;
  };

  // Storage & Variant label
  const storageVariantLabel = [
    product?.memory || product?.ram,
    product?.storage,
    product?.color,
  ]
    .filter(Boolean)
    .join(" • ");

  if (!product) return null;

  const minBidAmount = product?.minNextBid 
    ? (typeof product.minNextBid === 'string' 
        ? parseFloat(product.minNextBid.replace(/[$,]/g, '')) 
        : product.minNextBid)
    : parseFloat((product?.currentBid || "0").toString().replace(/[$,]/g, "")) + 1;

  return (
    <div className="min-h-screen bg-white">
      <style>
        {`
          .swiper-pagination-custom .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0.5);
            opacity: 1;
            margin: 0 4px;
          }
          .swiper-pagination-custom .swiper-pagination-bullet-active {
            background: ${PRIMARY_COLOR};
          }
        `}
      </style>
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <div className="relative group max-w-lg mx-auto">
              <div className="aspect-[4/3.5] relative rounded-lg overflow-hidden bg-gray-100 p-4">
                <div className="h-full w-full">
                  <div className="relative h-full">
                    <img
                      className="w-full h-full rounded-xl object-contain"
                      alt={`${product.name || product.modelFull} ${selectedImageIndex + 1}`}
                      src={imageError ? iphoneImage : productImages[selectedImageIndex]}
                      onError={handleImageError}
                    />
                  </div>
                </div>
                <div className="absolute top-3 left-3 z-20">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-600 text-white">
                    In Stock
                  </span>
                </div>
                <div className="hidden md:block absolute top-12 left-3 z-20">
                  <div className="px-3 py-3 bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg">
                    <div className="space-y-2">
                      {product?.grade && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-700">Condition:</span>
                          <span className="text-xs font-semibold text-gray-900 capitalize">{product.grade}</span>
                        </div>
                      )}
                      {product?.color && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-700">Color:</span>
                          <span className="text-xs font-semibold text-gray-900 capitalize">{product.color}</span>
                        </div>
                      )}
                      {(product?.memory || product?.ram) && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-700">RAM:</span>
                          <span className="text-xs font-semibold text-gray-900">{product.memory || product.ram}</span>
                        </div>
                      )}
                      {product?.storage && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-700">Storage:</span>
                          <span className="text-xs font-semibold text-gray-900">{product.storage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                  onClick={() => setSelectedImageIndex((prev) => prev === 0 ? productImages.length - 1 : prev - 1)}
                  disabled={productImages.length <= 1}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600 text-sm" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                  onClick={() => setSelectedImageIndex((prev) => (prev + 1) % productImages.length)}
                  disabled={productImages.length <= 1}
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-sm" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex space-x-1">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedImageIndex === index
                          ? "bg-blue-600"
                          : "bg-white/50 hover:bg-white/70"
                      }`}
                      style={selectedImageIndex === index ? { backgroundColor: PRIMARY_COLOR } : {}}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block max-w-lg mx-auto">
              <div className="grid grid-cols-5 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-[4/3] rounded-md overflow-hidden cursor-pointer transition-opacity duration-300 bg-gray-100 p-2 ${
                      selectedImageIndex === index ? "opacity-100" : "opacity-60"
                    }`}
                  >
                    <img
                      alt={`${product.name || product.modelFull} ${index + 1}`}
                      className="w-full h-full object-contain"
                      src={thumbErrors[index] ? iphoneImage : image}
                      onError={() => handleThumbnailError(index)}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-4 px-2 md:px-0">
            <div className="">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                {product.name || product.modelFull}
              </h1>
              <p className="mt-1 text-base text-gray-600 font-medium">
                by {product.oem || product.brand || "Unknown"}
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-semibold text-green-600">
                    {convertPrice(
                      parseFloat((product.currentBid || "0").toString().replace(/[$,]/g, ""))
                    )}
                  </span>
                </div>
                {product.expiryTime && timeLeft && (
                  <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm border border-red-200">
                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-2" />
                    <span className="font-bold">
                      {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
                      {String(timeLeft.hours).padStart(2, '0')}:
                      {String(timeLeft.minutes).padStart(2, '0')}:
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Key Features Section - 6 Cards Grid */}
            <div className="">
              <h3 className="text-base font-bold text-gray-900 mb-3">Key Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* SKU / Model ID */}
                {(product.code || product.model) && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">SKU / Model ID</p>
                    <p className="text-sm font-bold text-gray-900">{product.code || product.model}</p>
                  </div>
                )}

                {/* Storage & Variant */}
                {storageVariantLabel && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">Storage & Variant</p>
                    <p className="text-sm font-bold text-gray-900">{storageVariantLabel}</p>
                  </div>
                )}

                {/* Warehouse */}
                {product.country && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">Warehouse</p>
                    <p className="text-sm font-bold text-gray-900">{product.country}</p>
                  </div>
                )}

                {/* Delivery (EST) */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">Delivery (EST)</p>
                  <p className="text-sm font-bold text-gray-900">3-5 Business Days</p>
                </div>

                {/* Units */}
                {product.units && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">Units</p>
                    <p className="text-sm font-bold text-gray-900">{product.units} Units</p>
                  </div>
                )}

                {/* Status */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">Status</p>
                  <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                    In Stock
                  </p>
                </div>
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">About This Item</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Bid Input */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Bid Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="text"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 sm:text-sm"
                  placeholder={`Min: $${minBidAmount.toFixed(2)}`}
                  value={bidAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                    setBidAmount(val);
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = PRIMARY_COLOR;
                    e.target.style.boxShadow = `0 0 0 2px ${PRIMARY_COLOR}40`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '';
                    e.target.style.boxShadow = '';
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum bid: ${minBidAmount.toFixed(2)}
              </p>

              <button
                className="mt-4 w-full text-white font-semibold py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: PRIMARY_COLOR }}
                onMouseEnter={(e) => e.target.style.backgroundColor = PRIMARY_COLOR_DARK}
                onMouseLeave={(e) => e.target.style.backgroundColor = PRIMARY_COLOR}
              >
                <FontAwesomeIcon icon={faGavel} className="text-sm" />
                Place Bid
              </button>
            </div>

            {/* Bid Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200 shadow-sm">
                <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                  <FontAwesomeIcon icon={faGavel} className="text-sm" />
                  {product.bids || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Total Bids</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200 shadow-sm">
                <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                  {product.units || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Units Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Specifications Section */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Product Specifications</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Comprehensive product details</p>
          </div>

          <div className="p-3 sm:p-6 lg:p-8">
            {/* Basic Information */}
            <div className="mb-6 sm:mb-10">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 sm:mb-5 uppercase tracking-wide">Basic Information</h3>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3 md:gap-4 lg:gap-4" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {/* Row 1: OEM and Model */}
                {product.oem || product.brand ? (
                  <div className="group relative bg-gray-50 rounded-lg border border-gray-200 p-1.5 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getSpecColor('primary').bg }}
                      >
                        <FontAwesomeIcon
                          icon={faTag}
                          style={{ color: getSpecColor('primary').icon }}
                          className="text-[10px] sm:text-sm md:text-base"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">OEM</p>
                        <p className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                          {toTitleCase(product.oem || product.brand)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {product.code || product.model ? (
                  <div className="group relative bg-gray-50 rounded-lg border border-gray-200 p-1.5 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getSpecColor('green').bg }}
                      >
                        <FontAwesomeIcon
                          icon={faBarcode}
                          style={{ color: getSpecColor('green').icon }}
                          className="text-[10px] sm:text-sm md:text-base"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Model</p>
                        <p className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                          {toTitleCase(product.code || product.model)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                
                {/* Row 2: Grade and Capacity */}
                {product.grade || product.condition ? (
                  <div className="group relative bg-gray-50 rounded-lg border border-gray-200 p-1.5 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getSpecColor('purple').bg }}
                      >
                        <FontAwesomeIcon
                          icon={faShield}
                          style={{ color: getSpecColor('purple').icon }}
                          className="text-[10px] sm:text-sm md:text-base"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Grade</p>
                        <p className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                          {(product.grade || product.condition)?.toString().toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {product.storage ? (
                  <div className="group relative bg-gray-50 rounded-lg border border-gray-200 p-1.5 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getSpecColor('orange').bg }}
                      >
                        <FontAwesomeIcon
                          icon={faDatabase}
                          style={{ color: getSpecColor('orange').icon }}
                          className="text-[10px] sm:text-sm md:text-base"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Capacity</p>
                        <p className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                          {product.storage?.toString().toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                
                {/* Additional fields if any */}
                {product.status && (
                  <div className="group relative bg-gray-50 rounded-lg border border-gray-200 p-1.5 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getSpecColor('emerald').bg }}
                      >
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          style={{ color: getSpecColor('emerald').icon }}
                          className="text-[10px] sm:text-sm md:text-base"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Status</p>
                        <p className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                          Active
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="mb-6 sm:mb-10">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 sm:mb-5 uppercase tracking-wide">Technical Specifications</h3>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3 md:gap-4 lg:gap-4" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {/* RAM and Color pair */}
                {product.memory || product.ram ? (
                  <div className="group relative bg-gray-50 rounded-lg border border-gray-200 p-1.5 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getSpecColor('indigo').bg }}
                      >
                        <FontAwesomeIcon
                          icon={faMicrochip}
                          style={{ color: getSpecColor('indigo').icon }}
                          className="text-[10px] sm:text-sm md:text-base"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">RAM</p>
                        <p className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                          {(product.memory || product.ram)?.toString().toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {product.color ? (
                  <div className="group relative bg-gray-50 rounded-lg border border-gray-200 p-1.5 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getSpecColor('pink').bg }}
                      >
                        <FontAwesomeIcon
                          icon={faPalette}
                          style={{ color: getSpecColor('pink').icon }}
                          className="text-[10px] sm:text-sm md:text-base"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Color</p>
                        <p className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                          {toTitleCase(product.color)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                
                {/* SIM Type and Network Bands pair */}
                {product.simType || product.carrier ? (
                  <div className="group relative bg-gray-50 rounded-lg border border-gray-200 p-1.5 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getSpecColor('cyan').bg }}
                      >
                        <FontAwesomeIcon
                          icon={faSimCard}
                          style={{ color: getSpecColor('cyan').icon }}
                          className="text-[10px] sm:text-sm md:text-base"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">SIM Type</p>
                        <p className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                          {(product.simType || product.carrier)?.toString().toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {product.networkBands ? (
                  <div className="group relative bg-gray-50 rounded-lg border border-gray-200 p-1.5 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getSpecColor('teal').bg }}
                      >
                        <FontAwesomeIcon
                          icon={faWifi}
                          style={{ color: getSpecColor('teal').icon }}
                          className="text-[10px] sm:text-sm md:text-base"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Network Bands</p>
                        <p className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                          {toTitleCase(product.networkBands)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Location & Purchase */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 sm:mb-5 uppercase tracking-wide">Location & Purchase</h3>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3 md:gap-4 lg:gap-4" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {[
                  { icon: faGlobe, label: "Country", value: product.country, color: "primary" },
                  { icon: faTruck, label: "Purchase Type", value: "Auction", color: "amber" },
                ]
                  .filter((item) => item.value)
                  .map((item, index) => {
                    const colors = getSpecColor(item.color);
                    return (
                      <div
                        key={index}
                        className="group relative bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 min-w-0 w-full"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: colors.bg }}
                          >
                            <FontAwesomeIcon
                              icon={item.icon}
                              style={{ color: colors.icon }}
                              className="text-xs sm:text-sm md:text-base"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">{item.label}</p>
                            <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 break-words leading-tight">
                              {toTitleCase(item.value)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiddingProductDetails;
