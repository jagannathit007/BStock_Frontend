import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  faFileArrowDown,
  faEye,
  faGavel,
} from "@fortawesome/free-solid-svg-icons";
import iphoneImage from "../../assets/iphone.png";
import { convertPrice } from "../../utils/currencyUtils";
import { BiddingService } from "../../services/bidding/bidding.services";
import { AuthService } from "../../services/auth/auth.services";
import { useSocket } from "../../context/SocketContext";
import { PRIMARY_COLOR, PRIMARY_COLOR_LIGHT, PRIMARY_COLOR_DARK } from "../../utils/colors";
import axios from "axios";
import Swal from "sweetalert2";
import toastHelper from "../../utils/toastHelper";

const BidProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [myMaxBidInput, setMyMaxBidInput] = useState("");
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  useEffect(() => {
    const fetchBidProduct = async () => {
      setLoading(true);
      try {
        const data = await BiddingService.getBidProductById(id);
        setProduct(data);
      } catch (error) {
        console.error("Failed to fetch bid product:", error);
        navigate("/bidding", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBidProduct();
    }
  }, [id, navigate]);

  // Socket integration for real-time updates
  useEffect(() => {
    if (!socketService || !id) return;

    // Join bid room for this product
    socketService.joinBid(id);

    // Listen for bid updates
    const handleBidUpdate = (data) => {
      console.log('BidProductDetails: Received bid update:', data);
      if (data.productId === id) {
        setProduct((prevProduct) => {
          if (!prevProduct) return prevProduct;
          return {
            ...prevProduct,
            currentPrice: data.currentPrice || prevProduct.currentPrice,
            currentBid: data.currentPrice || prevProduct.currentBid,
            highestBidder: data.highestBidder || prevProduct.highestBidder,
          };
        });
      }
    };

    // Listen for bid notifications
    const handleBidNotification = (data) => {
      console.log('BidProductDetails: Received bid notification:', data);
      const productId = data.bidData?.productId || data.productId;
      if (productId === id || productId?.toString() === id) {
        // Refresh product data
        BiddingService.getBidProductById(id)
          .then((data) => setProduct(data))
          .catch((error) => console.error('Failed to refresh product:', error));
      }
    };

    socketService.onBidUpdate(handleBidUpdate);
    socketService.onBidNotification(handleBidNotification);

    // Cleanup
    return () => {
      socketService.leaveBid(id);
      socketService.removeBidListeners();
    };
  }, [socketService, id]);

  const handleImageError = () => setImageError(true);

  const productImages = useMemo(() => {
    if (!product) return [iphoneImage];
    const images = product.images || [];
    return images.length > 0 ? images : [iphoneImage];
  }, [product]);

  const timeLeft = useMemo(() => {
    if (!product?.biddingEndsAt) return null;
    const end = new Date(product.biddingEndsAt).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds };
  }, [product?.biddingEndsAt]);

  const downloadManifestCsv = () => {
    if (!product?.manifest) return;
    const header = ["SKU", "Condition", "Quantity", "IMEI (masked)"];
    const rows = product.manifest.map((m) => [m.sku, m.condition, String(m.qty), m.imei || ""]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${product.lotNumber || "bid-lot"}-manifest.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate myMaxBid similar to BiddingContent
  const myMaxBid = useMemo(() => {
    const myMaxBidRaw = product?.maxBidPrice;
    if (myMaxBidRaw == null) return "-";
    const myMaxBidStr = String(myMaxBidRaw);
    if (myMaxBidStr.includes("-") || isNaN(Number(myMaxBidStr))) return "-";
    const numValue = Number(myMaxBidStr);
    return numValue > 0 ? `$${numValue.toFixed(2)}` : "-";
  }, [product?.maxBidPrice]);

  // Calculate current bid from currentPrice or currentBid
  const currentBid = useMemo(() => {
    const bidValue = product?.currentPrice || product?.currentBid || product?.price || 0;
    return convertPrice(typeof bidValue === 'string' ? parseFloat(bidValue.replace(/[$,]/g, '')) : bidValue);
  }, [product?.currentPrice, product?.currentBid, product?.price]);

  // Calculate starting price
  const startingPrice = useMemo(() => {
    const startValue = product?.startingBidPrice || product?.price || 0;
    return convertPrice(typeof startValue === 'string' ? parseFloat(startValue.replace(/[$,]/g, '')) : startValue);
  }, [product?.startingBidPrice, product?.price]);

  // Calculate unit price
  const unitPrice = useMemo(() => {
    if (!product?.price) return "-";
    return convertPrice(typeof product.price === 'string' ? parseFloat(product.price.replace(/[$,]/g, '')) : product.price);
  }, [product?.price]);

  // Calculate next minimum bid
  const nextMinBid = useMemo(() => {
    if (product?.minNextBid !== undefined && product?.minNextBid !== null) {
      const minBid = typeof product.minNextBid === 'string'
        ? parseFloat(product.minNextBid.replace(/[$,]/g, ''))
        : product.minNextBid;
      if (!isNaN(minBid) && minBid > 0) {
        return convertPrice(minBid);
      }
    }
    // Fallback: calculate from current bid + increment
    const currentBidNum = typeof (product?.currentPrice || product?.currentBid) === 'string'
      ? parseFloat((product.currentPrice || product.currentBid).replace(/[$,]/g, ''))
      : (product?.currentPrice || product?.currentBid || 0);
    return convertPrice(currentBidNum + 1);
  }, [product?.minNextBid, product?.currentPrice, product?.currentBid]);

  // Get total bids count
  const totalBids = product?.bids?.length || product?.bids || 0;

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
      return { isValid: null, message: '', showMaxWarning: false };
    }
    
    const amountNum = Number(String(myMaxBidInput).replace(/[,]/g, ""));
    if (isNaN(amountNum) || amountNum <= 0) {
      return { isValid: false, message: 'Enter a valid amount', showMaxWarning: false };
    }
    
    const { minBid, maxBid } = getBidRange();
    
    if (minBid !== null && !isNaN(minBid) && amountNum < minBid) {
      return { isValid: false, message: `Minimum bid is $${minBid.toFixed(2)}`, showMaxWarning: false };
    }
    
    // Show max warning if amount exceeds max (but still allow validation to be false)
    if (maxBid !== null && !isNaN(maxBid) && amountNum > maxBid) {
      return { isValid: false, message: '', showMaxWarning: true, maxBid: maxBid };
    }
    
    return { isValid: true, message: '', showMaxWarning: false };
  };

  // Helper function to get min bid placeholder text
  const getMinBidPlaceholder = () => {
    const minBid = product?.minBid ? (typeof product.minBid === 'number' ? product.minBid : Number(product.minBid)) : null;
    const minNextBid = product?.minNextBid ? (typeof product.minNextBid === 'string' 
      ? parseFloat(product.minNextBid.replace(/[$,]/g, '')) 
      : product.minNextBid) : null;
    
    const effectiveMinBid = minBid || minNextBid;
    
    if (effectiveMinBid !== null && !isNaN(effectiveMinBid) && effectiveMinBid > 0) {
      return `Your next bid : $${effectiveMinBid.toFixed(2)}`;
    }
    
    return "Enter bid amount";
  };

  const bidValidation = getBidValidation();

  // Check if auction has ended
  const isAuctionEnded = () => {
    if (['ended', 'closed', 'expired'].includes(product?.status)) return true;
    if (!product?.biddingEndsAt) return false;
    return new Date() >= new Date(product.biddingEndsAt);
  };

  const auctionEnded = isAuctionEnded();

  // Handle bid submission
  const handleBidButtonClick = async (e) => {
    e.stopPropagation();
    if (auctionEnded || isSubmittingBid) return;

    // Check if profile is complete
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const isProfileComplete = AuthService.isProfileComplete(userData);
        if (!isProfileComplete) {
          navigate('/profile', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    }

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
        { productId: id, amount: amountNum },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      console.log('Bid response:', res);
      const responseData = res?.data?.data;
      const responseMessage = res?.data?.message || "Bid placed successfully";

      if (responseData === null || responseData === undefined) {
        Swal.fire({
          icon: "warning",
          title: "Warning",
          text: responseMessage || "Unable to place bid. Please try again.",
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#0071E0",
        });
      } else {
        // Join bid room for this product to receive real-time updates
        if (socketService && id) {
          socketService.joinBid(id);
        }
        
        // Show toast notification
        toastHelper.showTost(responseMessage, "success");
        
        // Clear input
        setMyMaxBidInput("");
        
        // Refresh product data
        const data = await BiddingService.getBidProductById(id);
        setProduct(data);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to place bid";
      Swal.fire({ icon: "error", title: msg });
    } finally {
      setIsSubmittingBid(false);
    }
  };

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


  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto" style={{ borderTopColor: PRIMARY_COLOR, borderBottomColor: PRIMARY_COLOR }}></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="relative group max-w-lg mx-auto">
            <div className="aspect-[4/3.5] relative rounded-lg overflow-hidden bg-gray-100 p-4">
              <div className="h-full w-full">
                <div className="relative h-full">
                  <img
                    className="w-full h-full rounded-xl"
                    alt={`${product.name || "Product"}`}
                    src={imageError ? iphoneImage : productImages[selectedImageIndex]}
                    onError={handleImageError}
                  />
                </div>
              </div>
              {timeLeft && (
                <div className="absolute top-3 left-3 z-20 inline-flex items-center bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm border border-amber-200">
                  <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 mr-1.5" />
                  Ends in {timeLeft.days}d {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
                </div>
              )}
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
                      selectedImageIndex === index ? "" : "bg-white/50 hover:bg-white/70"
                    }`}
                    style={selectedImageIndex === index ? { backgroundColor: PRIMARY_COLOR } : {}}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="max-w-lg mx-auto">
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
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-contain"
                    src={image}
                    onError={handleImageError}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-3">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {product.description || `${product.oem} ${product.model}` || "Bid Product"}
            </h1>
            <p className="mt-1 text-base text-gray-600 font-medium">
              {product.oem} • {product.model || "N/A"}
            </p>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3 flex-wrap">
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-semibold text-blue-600">
                  {currentBid}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">Current Bid</span>
              </div>
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
                Starting: {startingPrice}
              </span>
            </div>
            {product.lotNumber && (
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Lot:</span> {product.lotNumber}
              </div>
            )}
          </div>

          {/* Bid Input Section */}
          <div className="bg-gray-50 from-blue-50 to-indigo-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Place Your Bid</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    className={`w-full pl-3 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      bidValidation.isValid === false 
                        ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                        : bidValidation.isValid === true 
                        ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                        : 'border-gray-300 focus:ring-[#0071E0]'
                    }`}
                    placeholder={getMinBidPlaceholder()}
                    value={myMaxBidInput}
                    disabled={auctionEnded || isSubmittingBid || product?.status === 'pending' || product?.status === 'closed'}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, "");
                      setMyMaxBidInput(val);
                    }}
                  />
                  {bidValidation.showMaxWarning && bidValidation.maxBid && (
                    <span className="text-xs text-red-600 mt-1 block">
                      Max bid limit: ${bidValidation.maxBid.toFixed(2)}
                    </span>
                  )}
                  {bidValidation.message && !bidValidation.showMaxWarning && (
                    <span className={`text-xs mt-1 block ${bidValidation.isValid === false ? 'text-red-600' : 'text-green-600'}`}>
                      {bidValidation.message}
                    </span>
                  )}
                </div>
                <button
                  className={`py-2.5 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    auctionEnded || isSubmittingBid || product?.status === 'pending' || product?.status === 'closed' || bidValidation.isValid === false || bidValidation.showMaxWarning
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : bidValidation.isValid === true
                      ? "bg-[#0071E0] hover:bg-blue-600 text-white cursor-pointer"
                      : "bg-[#0071E0] hover:bg-blue-600 text-white cursor-pointer opacity-75"
                  }`}
                  onClick={handleBidButtonClick}
                  disabled={auctionEnded || isSubmittingBid || product?.status === 'pending' || product?.status === 'closed' || bidValidation.isValid === false || bidValidation.showMaxWarning}
                  title={product?.status === 'pending' ? 'Bid not yet started' : product?.status === 'closed' ? 'Auction closed' : (bidValidation.showMaxWarning ? `Maximum bid is $${bidValidation.maxBid?.toFixed(2) || ''}` : (bidValidation.isValid === false ? bidValidation.message : ''))}
                >
                  {isSubmittingBid ? (
                    <>
                      <Spinner />
                      <span>Placing…</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faGavel} className="mr-1" />
                      Add Bid
                    </>
                  )}
                </button>
              </div>
              {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-500 block font-medium mb-1">Total Bids</span>
                  <span className="text-lg font-bold text-gray-900">{totalBids}</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-500 block font-medium mb-1">Your Bid</span>
                  <span className="text-lg font-bold text-gray-900">{myMaxBid}</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-500 block font-medium mb-1">Next Min Bid</span>
                  <span className="text-lg font-bold text-blue-600">{nextMinBid}</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs text-gray-500 block font-medium mb-1">Unit Price</span>
                  <span className="text-lg font-bold text-gray-900">{unitPrice}</span>
                </div>
              </div> */}
              {(product?.maxBid != null && product.maxBid !== undefined) && (
                <span className="text-xs text-gray-600 pl-1">
                  Max bid limit: ${typeof product.maxBid === 'number' ? product.maxBid.toFixed(2) : product.maxBid}
                </span>
              )}
              {(product?.minBid != null && product.minBid !== undefined) && (
                <span className="text-xs text-gray-500 pl-1">
                  Min bid: ${typeof product.minBid === 'number' ? product.minBid.toFixed(2) : product.minBid}
                </span>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Key Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {product.grade && (
                <div className="flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center mr-2" style={{ backgroundColor: PRIMARY_COLOR_LIGHT }}>
                    <FontAwesomeIcon icon={faShield} className="text-xs" style={{ color: PRIMARY_COLOR }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500 font-medium">Grade</span>
                    <div className="text-xs font-bold text-gray-900 capitalize truncate">{product.grade}</div>
                  </div>
                </div>
              )}
              {product.capacity && (
                <div className="flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                  <div className="w-6 h-6 bg-green-50 rounded-md flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faDatabase} className="text-green-600 text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500 font-medium">Capacity</span>
                    <div className="text-xs font-bold text-gray-900 truncate">{product.capacity}</div>
                  </div>
                </div>
              )}
              {product.color && (
                <div className="flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                  <div className="w-6 h-6 bg-purple-50 rounded-md flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faPalette} className="text-purple-600 text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500 font-medium">Color</span>
                    <div className="text-xs font-bold text-gray-900 truncate">{product.color}</div>
                  </div>
                </div>
              )}
              {product.packageType && (
                <div className="flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                  <div className="w-6 h-6 bg-orange-50 rounded-md flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faTag} className="text-orange-600 text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500 font-medium">Package</span>
                    <div className="text-xs font-bold text-gray-900 truncate">{product.packageType}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <span className="text-xs text-gray-500 block font-medium mb-1">Quantity</span>
              <span className="text-lg font-bold text-gray-900">{product.qty} units</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <span className="text-xs text-gray-500 block font-medium mb-1">Category</span>
              <span className="text-lg font-bold text-gray-900">{product.category}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <span className="text-xs text-gray-500 block font-medium mb-1">Status</span>
              <span 
                className={`text-lg font-bold capitalize ${
                  product.status === 'pending' ? 'text-yellow-600' :
                  product.status === 'approved' ? 'text-green-600' :
                  'text-gray-600'
                }`}
                style={product.status === 'active' ? { color: PRIMARY_COLOR } : {}}
              >{product.status}</span>
            </div>
            {product.oem && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-xs text-gray-500 block font-medium mb-1">OEM</span>
                <span className="text-lg font-bold text-gray-900">{product.oem}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Product Specifications Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 font-apple">Product Specifications</h2>
          <p className="text-sm text-gray-600 mt-1">Detailed product information</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-3 md:gap-4 lg:gap-4" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {/* Row 1: OEM and Model */}
            {product.oem && (
              <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group min-w-0 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 transition-colors duration-200" style={{ backgroundColor: PRIMARY_COLOR_LIGHT }}>
                  <FontAwesomeIcon icon={faTag} className="text-xs sm:text-sm" style={{ color: PRIMARY_COLOR }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">OEM</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.oem}</p>
                </div>
              </div>
            )}
            {product.model && (
              <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group min-w-0 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 group-hover:bg-indigo-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faMicrochip} className="text-xs sm:text-sm text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Model</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.model}</p>
                </div>
              </div>
            )}
            
            {/* Row 2: Grade and Capacity */}
            {product.grade && (
              <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group min-w-0 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 group-hover:bg-purple-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faShield} className="text-xs sm:text-sm text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Grade</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.grade}</p>
                </div>
              </div>
            )}
            {product.capacity && (
              <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group min-w-0 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 group-hover:bg-orange-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faDatabase} className="text-xs sm:text-sm text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Capacity</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.capacity}</p>
                </div>
              </div>
            )}
            
            {/* Row 3: Color and Carrier */}
            {product.color && (
              <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group min-w-0 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-50 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 group-hover:bg-pink-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faPalette} className="text-xs sm:text-sm text-pink-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Color</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.color}</p>
                </div>
              </div>
            )}
            {product.carrier && (
              <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group min-w-0 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-50 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 group-hover:bg-cyan-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faGlobe} className="text-xs sm:text-sm text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Carrier</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.carrier || 'N/A'}</p>
                </div>
              </div>
            )}
            
            {/* Row 4: Package Type (if exists, will show in first column) */}
            {product.packageType && (
              <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group min-w-0 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-50 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 group-hover:bg-teal-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faTag} className="text-xs sm:text-sm text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Package Type</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.packageType}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manifest Section */}
      {product.manifest && product.manifest.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 font-apple">Manifest</h2>
              <p className="text-sm text-gray-600 mt-1">Download and review the lot manifest</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                style={{ backgroundColor: PRIMARY_COLOR }}
                onMouseEnter={(e) => e.target.style.backgroundColor = PRIMARY_COLOR_DARK}
                onMouseLeave={(e) => e.target.style.backgroundColor = PRIMARY_COLOR}
                onClick={downloadManifestCsv}
              >
                <FontAwesomeIcon icon={faFileArrowDown} className="w-4 h-4 mr-2" />
                Download CSV
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-3 text-sm text-gray-600">
              <FontAwesomeIcon icon={faEye} className="w-4 h-4 mr-2" />
              Preview
            </div>
            <div className="overflow-auto border border-gray-100 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">SKU</th>
                    <th className="text-left px-4 py-2 font-semibold">Condition</th>
                    <th className="text-left px-4 py-2 font-semibold">Quantity</th>
                    {product.manifest.some((m) => m.imei) && (
                      <th className="text-left px-4 py-2 font-semibold">IMEI (masked)</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {product.manifest.map((row, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-900">{row.sku}</td>
                      <td className="px-4 py-2 text-gray-700">{row.condition}</td>
                      <td className="px-4 py-2 text-gray-700">{row.qty}</td>
                      {product.manifest.some((m) => m.imei) && (
                        <td className="px-4 py-2 text-gray-700">{row.imei || ""}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidProductDetails;

