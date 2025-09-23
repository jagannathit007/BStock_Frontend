import React, { useState, useEffect } from 'react';
import { X, MessageSquare, DollarSign, Clock, CheckCircle, User, Package, Send, Eye } from 'lucide-react';
import NegotiationService from '../../services/negotiation/negotiation.services';

const NegotiationModal = ({ isOpen, onClose, userType = 'customer' }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [negotiations, setNegotiations] = useState([]);
  const [acceptedNegotiations, setAcceptedNegotiations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseData, setResponseData] = useState({
    action: 'counter',
    offerPrice: '',
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchNegotiations();
      fetchAcceptedNegotiations();
    }
  }, [isOpen, activeTab]);

  const fetchNegotiations = async () => {
    setLoading(true);
    try {
      const response = userType === 'admin' 
        ? await NegotiationService.getAllNegotiations(1, 50, 'negotiation')
        : await NegotiationService.getCustomerNegotiations(1, 50, 'negotiation');
      
      setNegotiations(response.negotiations || []);
    } catch (error) {
      console.error('Error fetching negotiations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedNegotiations = async () => {
    try {
      const response = userType === 'admin' 
        ? await NegotiationService.getAcceptedNegotiationsAdmin(1, 50)
        : await NegotiationService.getAcceptedNegotiations(1, 50);
      
      setAcceptedNegotiations(response.negotiations || []);
    } catch (error) {
      console.error('Error fetching accepted negotiations:', error);
    }
  };

  const handleRespond = async () => {
    if (!selectedNegotiation) return;

    try {
      const data = {
        negotiationId: selectedNegotiation._id,
        action: responseData.action,
        offerPrice: responseData.action === 'counter' ? parseFloat(responseData.offerPrice) : undefined,
        message: responseData.message
      };

      if (userType === 'admin') {
        await NegotiationService.respondToNegotiationAdmin(data);
      } else {
        await NegotiationService.respondToNegotiation(data);
      }

      setShowResponseForm(false);
      setSelectedNegotiation(null);
      setResponseData({ action: 'counter', offerPrice: '', message: '' });
      fetchNegotiations();
    } catch (error) {
      console.error('Error responding to negotiation:', error);
    }
  };

  // Check if there's a newer negotiation for the same product
  const hasNewerNegotiation = (currentNegotiation) => {
    if (!negotiations || negotiations.length === 0) return false;
    
    return negotiations.some(negotiation => {
      // Same product, different negotiation, newer timestamp
      return negotiation.productId._id === currentNegotiation.productId._id &&
             negotiation._id !== currentNegotiation._id &&
             new Date(negotiation.createdAt) > new Date(currentNegotiation.createdAt) &&
             negotiation.status === 'negotiation';
    });
  };

  // Check if any negotiation for the same product has been accepted
  const hasAcceptedNegotiation = (currentNegotiation) => {
    // Check in active negotiations
    const hasAcceptedInActive = negotiations && negotiations.some(negotiation => {
      return negotiation.productId._id === currentNegotiation.productId._id &&
             negotiation._id !== currentNegotiation._id &&
             negotiation.status === 'accepted';
    });

    // Check in accepted negotiations
    const hasAcceptedInAccepted = acceptedNegotiations && acceptedNegotiations.some(negotiation => {
      return negotiation.productId._id === currentNegotiation.productId._id &&
             negotiation._id !== currentNegotiation._id &&
             negotiation.status === 'accepted';
    });

    return hasAcceptedInActive || hasAcceptedInAccepted;
  };

  const canRespond = (negotiation) => {
    // If any negotiation for the same product has been accepted, don't allow responding
    if (hasAcceptedNegotiation(negotiation)) {
      return false;
    }

    if (userType === 'admin') {
      return negotiation.FromUserType === 'Customer' && negotiation.status === 'negotiation';
    } else {
      // Customer can respond to admin's offers (when customer is the receiver)
      return negotiation.FromUserType === 'Admin' && negotiation.status === 'negotiation';
    }
  };

  const canAccept = (negotiation) => {
    // If any negotiation for the same product has been accepted, don't allow accepting
    if (hasAcceptedNegotiation(negotiation)) {
      return false;
    }

    // If there's a newer negotiation for the same product, don't allow accepting old ones
    if (hasNewerNegotiation(negotiation)) {
      return false;
    }

    if (userType === 'admin') {
      return negotiation.FromUserType === 'Customer' && negotiation.status === 'negotiation';
    } else {
      // Customer can accept admin's offers (when customer is the receiver)
      return negotiation.FromUserType === 'Admin' && negotiation.status === 'negotiation';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProductImage = (product) => {
    if (typeof product === 'object' && product.mainImage) {
      return product.mainImage;
    }
    return '/images/placeholder-product.jpg';
  };

  const getProductName = (product) => {
    if (typeof product === 'object' && product.skuFamilyId && product.skuFamilyId.name) {
      return product.skuFamilyId.name;
    }
    return 'Product';
  };

  const getUserName = (user) => {
    if (typeof user === 'object' && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'User';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {userType === 'admin' ? 'Admin' : 'My'} Negotiations
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'active'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Negotiations
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'accepted'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Accepted Orders
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {(activeTab === 'active' ? negotiations : acceptedNegotiations).map((negotiation) => (
                <div
                  key={negotiation._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <img
                          src={getProductImage(negotiation.productId)}
                          alt={getProductName(negotiation.productId)}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {getProductName(negotiation.productId)}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {getUserName(negotiation.fromUserId)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDate(negotiation.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">Offer Price:</span>
                          <span className="font-medium text-green-600">
                            {formatPrice(negotiation.offerPrice)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            negotiation.status === 'accepted' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {negotiation.status === 'accepted' ? 'Accepted' : 'Negotiating'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">From:</span>
                          <span className="font-medium text-gray-900">
                            {negotiation.FromUserType === 'Admin' ? 'Admin' : 'You'}
                          </span>
                        </div>
                      </div>

                      {negotiation.message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700">{negotiation.message}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {activeTab === 'active' && (
                        <>
                          {canRespond(negotiation) ? (
                            <>
                              {canAccept(negotiation) && (
                                <button
                                  onClick={() => {
                                    setSelectedNegotiation(negotiation);
                                    setResponseData({ action: 'accept', offerPrice: '', message: '' });
                                    setShowResponseForm(true);
                                  }}
                                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Accept</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedNegotiation(negotiation);
                                  setResponseData({ action: 'counter', offerPrice: '', message: '' });
                                  setShowResponseForm(true);
                                }}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>Counter</span>
                              </button>
                            </>
                          ) : hasAcceptedNegotiation(negotiation) ? (
                            <div className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>Other bid accepted</span>
                            </div>
                          ) : null}
                        </>
                      )}
                      {activeTab === 'accepted' && userType === 'customer' && (
                        <button
                          onClick={() => {
                            // Navigate to product details page
                            window.location.href = `/#/product/${negotiation.productId._id}`;
                          }}
                          className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Buy Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(activeTab === 'active' ? negotiations : acceptedNegotiations).length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No {activeTab === 'active' ? 'active' : 'accepted'} negotiations
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'active' 
                      ? 'You don\'t have any active negotiations at the moment.'
                      : 'You don\'t have any accepted orders yet.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Response Form Modal */}
      {showResponseForm && selectedNegotiation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {responseData.action === 'accept' ? 'Accept Offer' : 'Make Counter Offer'}
              </h3>

              {responseData.action === 'counter' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Counter Offer Price
                  </label>
                  <input
                    type="number"
                    value={responseData.offerPrice}
                    onChange={(e) => setResponseData({ ...responseData, offerPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your counter offer"
                    required
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={responseData.message}
                  onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add a message..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResponseForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRespond}
                  disabled={responseData.action === 'counter' && !responseData.offerPrice}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NegotiationModal;
