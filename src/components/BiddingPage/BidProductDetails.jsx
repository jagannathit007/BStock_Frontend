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
  faCalendarXmark,
} from "@fortawesome/free-solid-svg-icons";
import iphoneImage from "../../assets/iphone.png";
import { convertPrice } from "../../utils/currencyUtils";
import { BiddingService } from "../../services/bidding/bidding.services";
import { useSocket } from "../../context/SocketContext";

const BidProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

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

  const handleMakeOffer = () => {
    // TODO: Open bidding form modal
    console.log("Make offer clicked");
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
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
                      selectedImageIndex === index ? "bg-blue-500" : "bg-white/50 hover:bg-white/70"
                    }`}
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

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-semibold text-gray-900">
                {convertPrice(product.currentPrice || product.price || 0)}
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
                Starting Price
              </span>
            </div>
            {product.lotNumber && (
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Lot:</span> {product.lotNumber}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Key Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {product.grade && (
                <div className="flex items-center bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                  <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faShield} className="text-blue-600 text-xs" />
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
              <span className={`text-lg font-bold capitalize ${
                product.status === 'pending' ? 'text-yellow-600' :
                product.status === 'approved' ? 'text-green-600' :
                product.status === 'active' ? 'text-blue-600' :
                'text-gray-600'
              }`}>{product.status}</span>
            </div>
            {product.oem && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-xs text-gray-500 block font-medium mb-1">OEM</span>
                <span className="text-lg font-bold text-gray-900">{product.oem}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleMakeOffer}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
            >
              Make an Offer
            </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.oem && (
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faTag} className="text-blue-600 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">OEM</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.oem}</p>
                </div>
              </div>
            )}
            {product.model && (
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faMicrochip} className="text-indigo-600 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Model</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.model}</p>
                </div>
              </div>
            )}
            {product.grade && (
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faShield} className="text-purple-600 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Grade</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.grade}</p>
                </div>
              </div>
            )}
            {product.capacity && (
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-orange-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faDatabase} className="text-orange-600 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Capacity</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.capacity}</p>
                </div>
              </div>
            )}
            {product.color && (
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-pink-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faPalette} className="text-pink-600 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Color</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.color}</p>
                </div>
              </div>
            )}
            {product.carrier && (
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-cyan-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faGlobe} className="text-cyan-600 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Carrier</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.carrier || 'N/A'}</p>
                </div>
              </div>
            )}
            {product.packageType && (
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 group">
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-teal-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faTag} className="text-teal-600 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Package Type</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.packageType}</p>
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
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm"
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

