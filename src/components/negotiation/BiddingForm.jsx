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

const BiddingForm = ({ product, isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("history"); // Default to history tab
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

  // Fetch product-specific bids when component opens
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
      // Refresh bids after successful submission
      await fetchProductBids();
      onSuccess && onSuccess();
      // Switch to history tab to show the new bid
      setActiveTab("history");
    } catch (error) {
      console.error("Error creating bid:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ offerPrice: "", message: "" });
    setActiveTab("history"); // Reset to history tab
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
      // Refresh bids after successful response
      await fetchProductBids();
    } catch (error) {
      console.error("Error responding to negotiation:", error);
    }
  };

  // Check if there's a newer negotiation for the same bid
  const hasNewerNegotiation = (currentNegotiation, bidGroup) => {
    if (!bidGroup.bids || bidGroup.bids.length === 0) return false;

    return bidGroup.bids.some((bid) => {
      // Same bid, different negotiation, newer timestamp
      return (
        bid.bidId === currentNegotiation.bidId &&
        bid._id !== currentNegotiation._id &&
        new Date(bid.createdAt) > new Date(currentNegotiation.createdAt) &&
        bid.status === "negotiation"
      );
    });
  };

  // Check if any negotiation for the same bid has been accepted
  const hasAcceptedNegotiation = (bidGroup) => {
    return bidGroup.status === "accepted";
  };

  // Check if customer can make a counter offer for the entire bid group
  const canMakeCounterForBid = (bidGroup) => {
    // If any negotiation for the same bid has been accepted, don't allow counter
    if (hasAcceptedNegotiation(bidGroup)) {
      return false;
    }

    // Customer can only make counter offers if admin has already made a counter
    const hasAdminCounter = bidGroup.bids.some(
      (bid) => bid.FromUserType === "Admin"
    );
    return hasAdminCounter;
  };

  const canAccept = (negotiation, bidGroup) => {
    // If any negotiation for the same bid has been accepted, don't allow accepting
    if (hasAcceptedNegotiation(bidGroup)) {
      return false;
    }

    // If there's a newer negotiation for the same bid, don't allow accepting old ones
    if (hasNewerNegotiation(negotiation, bidGroup)) {
      return false;
    }

    // Customer can accept admin's offers (when customer is the receiver)
    return (
      negotiation.FromUserType === "Admin" &&
      negotiation.status === "negotiation"
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
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

  // Group bids by bidId to show complete bid flow
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

      // If any bid in the group is accepted, mark the group as accepted
      if (bid.status === "accepted") {
        acc[bidId].status = "accepted";
        acc[bidId].acceptedBy = bid.toUserType || "Admin";
        acc[bidId].acceptedAt = bid.updatedAt;
      }

      return acc;
    }, {});

    // Convert to array and sort by creation date (most recent first)
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
    <div className="fixed inset-0 bg-[#00000042] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Product Bidding
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 cursor-pointer rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              src={
                imageError ? iphoneImage : product.mainImage || product.imageUrl
              }
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              onError={handleImageError}
            />
            <div>
              <h3 className="font-medium text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">
                Current Price:{" "}
                <span className="font-medium text-green-600">
                  ${product.price}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 cursor-pointer font-medium text-sm transition-colors flex items-center space-x-2 ${
              activeTab === "history"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Bidding History</span>
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`px-6 py-3 cursor-pointer font-medium text-sm transition-colors flex items-center space-x-2 ${
              activeTab === "new"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Make New Bid</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "history" ? (
            <div className="space-y-4">
              {bidsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : groupedBids.length > 0 ? (
                groupedBids.map((bidGroup) => (
                  <div
                    key={bidGroup.bidId}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">
                          Bid ID: {bidGroup.bidId?.slice(0, 8)}...
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bidGroup.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {bidGroup.status === "accepted"
                            ? "Accepted"
                            : "Negotiating"}
                        </span>
                        {bidGroup.status === "accepted" &&
                          bidGroup.acceptedBy && (
                            <span className="text-xs text-gray-500">
                              Accepted by: {bidGroup.acceptedBy}
                            </span>
                          )}
                      </div>

                      {/* Bid-level Counter Button */}
                      <div className="flex flex-col space-y-2">
                        {canMakeCounterForBid(bidGroup) && (
                          <button
                            onClick={() => {
                              // Use the latest admin negotiation for counter
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
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <Send className="w-4 h-4" />
                            <span>Make Counter Offer</span>
                          </button>
                        )}
                        {hasAcceptedNegotiation(bidGroup) && (
                          <div className="text-xs text-gray-500 text-center">
                            Bid accepted
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bid Flow */}
                    <div className="space-y-2">
                      {bidGroup.bids
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                        )
                        .map((bid) => (
                          <div
                            key={bid._id}
                            className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="font-medium text-gray-900">
                                    {bid.FromUserType} Offer
                                  </span>
                                  <span className="flex items-center text-green-600">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {formatPrice(bid.offerPrice)}
                                  </span>
                                  <span className="flex items-center text-gray-500">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatDate(bid.createdAt)}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      bid.status === "accepted"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {bid.status === "accepted"
                                      ? "Accepted"
                                      : hasAcceptedNegotiation(bidGroup)
                                      ? "Other bid accepted"
                                      : "pending"}
                                    {/* {bid.status === 'accepted' ? 'Accepted' : 'Pending'} */}
                                  </span>
                                </div>
                                {bid.message && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    {bid.message}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col space-y-2 ml-4">
                                {bid.status === "negotiation" && (
                                  <>
                                    {canAccept(bid, bidGroup) && (
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
                                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Accept</span>
                                      </button>
                                    )}
                                    {/* {hasAcceptedNegotiation(bidGroup) && (
                                      <div className="text-xs text-gray-500 text-center">
                                        Other bid accepted
                                      </div>
                                    )} */}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Bidding History
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    There are no bids for this product yet. Be the first to make
                    an offer!
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* New Bid Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Offer Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={formData.offerPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, offerPrice: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your offer"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your best offer for this product
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add a message to your bid..."
                    maxLength={500}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.message.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border cursor-pointer border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.offerPrice}
                  className="flex-1 px-4 py-2 bg-[#0071E0] cursor-pointer text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 
           0 5.373 0 12h4zm2 5.291A7.962 
           7.962 0 014 12H0c0 3.042 1.135 
           5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Bid</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Response Form Modal */}
      {showResponseForm && selectedNegotiation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {responseData.action === "accept"
                    ? "Accept Offer"
                    : "Make Counter Offer"}
                </h3>
                <button
                  onClick={() => setShowResponseForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRespond();
                }}
                className="space-y-4"
              >
                {responseData.action === "counter" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Counter Offer Price
                    </label>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your counter offer"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={responseData.message}
                    onChange={(e) =>
                      setResponseData({
                        ...responseData,
                        message: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add a message..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowResponseForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                      responseData.action === "accept"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {responseData.action === "accept"
                      ? "Accept Offer"
                      : "Send Counter Offer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiddingForm;
