import React, { useState, useEffect } from "react";
import {
  DollarSign,
  MessageSquare,
  Send,
  X,
  Clock,
  CheckCircle,
  User,
  Package,
  History,
} from "lucide-react";
import NegotiationService from "../../services/negotiation/negotiation.services";
import iphoneImage from "../../assets/iphone.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandshake } from "@fortawesome/free-solid-svg-icons";
import { convertPrice } from "../../utils/currencyUtils";

const BiddingForm = ({ product, isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("history");
  const [formData, setFormData] = useState({
    offerPrice: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [productBids, setProductBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseData, setResponseData] = useState({
    action: "counter",
    offerPrice: "",
    message: "",
  });

  const handleImageError = () => {
    setImageError(true);
  };

  useEffect(() => {
    if (isOpen && product?.id) {
      fetchProductBids();
    }
  }, [isOpen, product?.id]);

  const fetchProductBids = async () => {
    setBidsLoading(true);
    try {
      const response = await NegotiationService.getProductBids(
        product.id,
        1,
        50
      );
      setProductBids(response.negotiations || []);
    } catch (error) {
      console.error("Error fetching product bids:", error);
      setProductBids([]);
    } finally {
      setBidsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.offerPrice || parseFloat(formData.offerPrice) <= 0) {
      alert("Please enter a valid offer price");
      return;
    }

    setLoading(true);
    try {
      await NegotiationService.createBid({
        productId: product.id,
        offerPrice: parseFloat(formData.offerPrice),
        message: formData.message,
      });

      setFormData({ offerPrice: "", message: "" });
      await fetchProductBids();
      onSuccess && onSuccess();
      setActiveTab("history");
    } catch (error) {
      console.error("Error creating bid:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ offerPrice: "", message: "" });
    setActiveTab("history");
    setSelectedNegotiation(null);
    setShowResponseForm(false);
    setResponseData({ action: "counter", offerPrice: "", message: "" });
    onClose();
  };

  const handleRespond = async () => {
    if (!selectedNegotiation) return;

    try {
      const data = {
        negotiationId: selectedNegotiation._id,
        action: responseData.action,
        offerPrice:
          responseData.action === "counter"
            ? parseFloat(responseData.offerPrice)
            : undefined,
        message: responseData.message,
      };

      await NegotiationService.respondToNegotiation(data);

      setShowResponseForm(false);
      setSelectedNegotiation(null);
      setResponseData({ action: "counter", offerPrice: "", message: "" });
      await fetchProductBids();
    } catch (error) {
      console.error("Error responding to negotiation:", error);
    }
  };

  const hasNewerNegotiation = (currentNegotiation, bidGroup) => {
    if (!bidGroup.bids || bidGroup.bids.length === 0) return false;

    return bidGroup.bids.some((bid) => {
      return (
        bid.bidId === currentNegotiation.bidId &&
        bid._id !== currentNegotiation._id &&
        new Date(bid.createdAt) > new Date(currentNegotiation.createdAt) &&
        bid.status === "negotiation"
      );
    });
  };

  const hasAcceptedNegotiation = (bidGroup) => {
    return bidGroup.status === "accepted";
  };

  const canMakeCounterForBid = (bidGroup) => {
    if (hasAcceptedNegotiation(bidGroup)) {
      return false;
    }

    const hasAdminCounter = bidGroup.bids.some(
      (bid) => bid.FromUserType === "Admin"
    );
    return hasAdminCounter;
  };

  const canAccept = (negotiation, bidGroup) => {
    if (hasAcceptedNegotiation(bidGroup)) {
      return false;
    }

    if (hasNewerNegotiation(negotiation, bidGroup)) {
      return false;
    }

    return (
      negotiation.FromUserType === "Admin" &&
      negotiation.status === "negotiation"
    );
  };

  const formatPrice = (price) => {
    return convertPrice(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProductImage = (productId) => {
    if (typeof productId === "string") return "/images/placeholder.jpg";
    return productId?.skuFamilyId?.images?.[0]
      ? `${import.meta.env.VITE_BASE_URL}/${productId?.skuFamilyId?.images[0]}`
      : "";
  };

  const getProductName = (productId) => {
    if (typeof productId === "string") return "Product";
    return productId?.name || productId?.skuFamilyId?.name || "Product";
  };

  const getUserName = (userId) => {
    if (typeof userId === "string") return "User";
    return (
      `${userId?.firstName || ""} ${userId?.lastName || ""}`.trim() || "User"
    );
  };

  const groupBidsByBidId = (bids) => {
    const grouped = bids.reduce((acc, bid) => {
      const bidId = bid.bidId;

      if (!acc[bidId]) {
        acc[bidId] = {
          bidId,
          productId: bid.productId,
          bids: [],
          status: "negotiation",
          acceptedBy: undefined,
          acceptedAt: undefined,
        };
      }

      acc[bidId].bids.push(bid);

      if (bid.status === "accepted") {
        acc[bidId].status = "accepted";
        acc[bidId].acceptedBy = bid.toUserType || "Admin";
        acc[bidId].acceptedAt = bid.updatedAt;
      }

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => {
      const aLatest = Math.max(
        ...a.bids.map((bid) => new Date(bid.createdAt).getTime())
      );
      const bLatest = Math.max(
        ...b.bids.map((bid) => new Date(bid.createdAt).getTime())
      );
      return bLatest - aLatest;
    });
  };

  if (!isOpen) return null;

  const groupedBids = groupBidsByBidId(productBids);

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Negotiation Center</h2>
              <p className="text-xs text-gray-500">Place your offer and negotiate</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Product Info Card */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={
                  imageError ? iphoneImage : product.mainImage || product.imageUrl
                }
                alt={product.name}
                className="w-14 h-14 object-cover rounded-lg border-2 border-white shadow-md"
                onError={handleImageError}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">{product.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-600">Listed Price:</span>
                <span className="text-lg font-bold text-green-600">
                  {convertPrice(product.price)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b-2 border-gray-100 flex-shrink-0">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-4 py-3 cursor-pointer font-semibold text-sm transition-all flex items-center justify-center space-x-2 relative ${
              activeTab === "history"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 px-4 py-3 cursor-pointer font-semibold text-sm transition-all flex items-center justify-center space-x-2 relative ${
              activeTab === "new"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>New Offer</span>
            {activeTab === "new" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-b-2xl">
          {activeTab === "history" ? (
            <div className="p-6 space-y-4">
              {bidsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                  <p className="text-gray-500 mt-4">Loading negotiations...</p>
                </div>
              ) : groupedBids.length > 0 ? (
                groupedBids.map((bidGroup) => (
                  <div
                    key={bidGroup.bidId}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all"
                  >
                    
                    {/* Group Header */}
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-semibold text-gray-700">
                              ID: {bidGroup.bidId?.slice(0, 12)}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                bidGroup.status === "accepted"
                                  ? "bg-green-100 text-green-700 border border-green-300"
                                  : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                              }`}
                            >
                              {bidGroup.status === "accepted"
                                ? "✓ Accepted"
                                : "⏳ In Progress"}
                            </span>
                          </div>
                          {bidGroup.status === "accepted" && bidGroup.acceptedBy && (
                            <span className="text-xs text-gray-500 mt-1 block">
                              Accepted by {bidGroup.acceptedBy}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Counter Button */}
                      {canMakeCounterForBid(bidGroup) && (
                        <button
                          onClick={() => {
                            const latestAdminNegotiation = bidGroup.bids
                              .filter((bid) => bid.FromUserType === "Admin")
                              .sort(
                                (a, b) =>
                                  new Date(b.createdAt).getTime() -
                                  new Date(a.createdAt).getTime()
                              )[0];

                            if (latestAdminNegotiation) {
                              setSelectedNegotiation(latestAdminNegotiation);
                              setResponseData({
                                action: "counter",
                                offerPrice: "",
                                message: "",
                              });
                              setShowResponseForm(true);
                            }
                          }}
                          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-md"
                        >
                          <Send className="w-4 h-4" />
                          <span>Counter Offer</span>
                        </button>
                      )}
                    </div>

                    {/* Bid Flow */}
                    <div className="space-y-4">
                      {bidGroup.bids
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                        )
                        .map((bid, index) => (
                          <div
                            key={bid._id}
                            className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500 relative"
                          >
                            {/* Connector Line */}
                            {index < bidGroup.bids.length - 1 && (
                              <div className="absolute left-6 top-full w-0.5 h-4 bg-gray-300"></div>
                            )}
                            
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-3">
                                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                    bid.FromUserType === "Admin" 
                                      ? "bg-purple-100 text-purple-700" 
                                      : "bg-blue-100 text-blue-700"
                                  }`}>
                                    {bid.FromUserType}
                                  </div>
                                  <div className="flex items-center space-x-1 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                                    {/* <DollarSign className="w-4 h-4 text-green-600" /> */}
                                    <span className="font-bold text-green-600 text-base">
                                      {formatPrice(bid.offerPrice)}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-gray-500 text-xs">
                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                    {formatDate(bid.createdAt)}
                                  </div>
                                  <span
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                                      bid.status === "accepted"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {bid.status === "accepted"
                                      ? "Accepted"
                                      : hasAcceptedNegotiation(bidGroup)
                                      ? "Superseded"
                                      : "Pending"}
                                  </span>
                                </div>
                                {bid.message && (
                                  <div className="bg-white p-3 rounded-lg mt-2 border border-gray-200">
                                    <p className="text-sm text-gray-700">{bid.message}</p>
                                  </div>
                                )}
                              </div>

                              {/* Accept Button */}
                              {bid.status === "negotiation" && canAccept(bid, bidGroup) && (
                                <button
                                  onClick={() => {
                                    setSelectedNegotiation(bid);
                                    setResponseData({
                                      action: "accept",
                                      offerPrice: "",
                                      message: "",
                                    });
                                    setShowResponseForm(true);
                                  }}
                                  className="ml-4 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all flex items-center space-x-2 shadow-md"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Accept</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                    <History className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Negotiations Yet
                  </h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    Start the conversation by making your first offer on this product
                  </p>
                  <button
                    onClick={() => setActiveTab("new")}
                    className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Make First Offer
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* New Bid Form */
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Your Offer Price *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faHandshake} className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={formData.offerPrice}
                        onChange={(e) =>
                          setFormData({ ...formData, offerPrice: e.target.value })
                        }
                        className="w-full pl-12 pr-4 py-2 text-base font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter amount"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <span className="mr-1">💡</span>
                      Enter your best competitive offer for this product
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Add Message (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                      </div>
                      <textarea
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        className="w-full pl-11 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        rows={4}
                        placeholder="Explain why your offer is fair..."
                        maxLength={500}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      {formData.message.length}/500 characters
                    </p>
                  </div>
                </form>
              </div>

              {/* Fixed Footer with Action Buttons */}
              <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6">
                <div className="flex space-x-4 max-w-lg mx-auto">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading || !formData.offerPrice}
                    className="flex-1 px-6 py-3 bg-blue-600 cursor-pointer text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
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
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Offer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Response Form Modal */}
      {showResponseForm && selectedNegotiation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    responseData.action === "accept" ? "bg-green-100" : "bg-blue-100"
                  }`}>
                    {responseData.action === "accept" ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Send className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {responseData.action === "accept"
                      ? "Accept Offer"
                      : "Counter Offer"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowResponseForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRespond();
              }}
              className="p-8 space-y-5"
            >
              {responseData.action === "counter" && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Your Counter Price *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      {/* <DollarSign className="w-5 h-5 text-gray-400" /> */}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={responseData.offerPrice}
                      onChange={(e) =>
                        setResponseData({
                          ...responseData,
                          offerPrice: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter counter amount"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Message (Optional)
                </label>
                <textarea
                  value={responseData.message}
                  onChange={(e) =>
                    setResponseData({
                      ...responseData,
                      message: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows={3}
                  placeholder="Add your message..."
                />
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResponseForm(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-all shadow-lg ${
                    responseData.action === "accept"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {responseData.action === "accept" ? "Accept Offer" : "Send Counter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiddingForm;