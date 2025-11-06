import React, { useState, useEffect } from 'react';
import { X, MessageSquare, DollarSign, Clock, CheckCircle, User, Package, Send, Inbox, FileX, Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import NegotiationService from '../../services/negotiation/negotiation.services';
import { useSocket } from '../../context/SocketContext';
import toastHelper from '../../utils/toastHelper';

const NegotiationModal = ({ isOpen, onClose, userType = 'customer' }) => {
  const navigate = useNavigate();
  const { socketService } = useSocket();
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
  const [notifications, setNotifications] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const imageBaseUrl = import.meta.env.VITE_BASE_URL;

  // Group negotiations by bidId to show complete bid flow
  const groupNegotiationsByBidId = (allNegotiations) => {
    const grouped = allNegotiations.reduce((acc, negotiation) => {
      const bidId = negotiation.bidId;
      
      if (!acc[bidId]) {
        acc[bidId] = {
          bidId,
          productId: negotiation.productId,
          negotiations: [],
          status: 'negotiation',
          acceptedBy: undefined,
          acceptedAt: undefined
        };
      }
      
      acc[bidId].negotiations.push(negotiation);
      
      // If any negotiation in the group is accepted, mark the group as accepted
      if (negotiation.status === 'accepted') {
        acc[bidId].status = 'accepted';
        acc[bidId].acceptedBy = negotiation.toUserType || 'Admin';
        acc[bidId].acceptedAt = negotiation.updatedAt;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by creation date (most recent first)
    return Object.values(grouped).sort((a, b) => {
      const aLatest = Math.max(...a.negotiations.map(n => new Date(n.createdAt).getTime()));
      const bLatest = Math.max(...b.negotiations.map(n => new Date(n.createdAt).getTime()));
      return bLatest - aLatest;
    });
  };

  useEffect(() => {
    if (isOpen) {
      // Check for token before making API calls
      const token = localStorage.getItem('token');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (!token || !isLoggedIn) {
        // Close modal and redirect to login
        onClose();
        const hashPath = window.location.hash?.slice(1) || '/home';
        const returnTo = encodeURIComponent(hashPath);
        navigate(`/login?returnTo=${returnTo}`);
        return;
      }
      
      fetchNegotiations();
      fetchAcceptedNegotiations();
      setupSocketListeners();
    }

    return () => {
      // Cleanup socket listeners when modal closes
      if (socketService) {
        socketService.removeNegotiationListeners();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab, socketService]);

  // Setup socket listeners for real-time updates
  const setupSocketListeners = () => {
    if (!socketService) {
      console.warn('User panel: socketService not available for setupSocketListeners');
      return;
    }

    console.log('User panel: Setting up socket listeners');

    // Listen for negotiation notifications
    socketService.onNegotiationNotification((data) => {
      console.log('Received negotiation notification:', data);
      setNotifications(prev => [...prev, data]);
      
      // Show toast notification
      toastHelper.showTost(data.message || 'New negotiation update', 'info');
      
      // Refresh negotiations if it's a relevant update
      if (data.type === 'new_bid' || data.type === 'counter_offer' || data.type === 'bid_accepted') {
        fetchNegotiations();
        fetchAcceptedNegotiations();
      }
    });

    // Listen for negotiation broadcasts
    socketService.onNegotiationBroadcast((data) => {
      console.log('Received negotiation broadcast:', data);
      setNotifications(prev => [...prev, data]);
      
      // Show toast notification
      toastHelper.showTost(data.message || 'New negotiation activity', 'info');
      
      // Refresh negotiations
      fetchNegotiations();
      fetchAcceptedNegotiations();
    });

    // Listen for negotiation updates
    socketService.onNegotiationUpdate((data) => {
      console.log('Received negotiation update:', data);
      setNotifications(prev => [...prev, data]);
      
      // Refresh negotiations
      fetchNegotiations();
      fetchAcceptedNegotiations();
    });

    // Listen for user typing indicators
    socketService.onUserTyping((data) => {
      console.log('User typing:', data);
      if (data.isTyping) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    // Listen for users joining/leaving negotiations
    socketService.onUserJoinedNegotiation((data) => {
      console.log('User joined negotiation:', data);
      toastHelper.showTost(`${data.userType} joined the negotiation`, 'info');
    });

    socketService.onUserLeftNegotiation((data) => {
      console.log('User left negotiation:', data);
    });
  };

  const fetchNegotiations = async () => {
    // Check token before making API call
    const token = localStorage.getItem('token');
    if (!token) {
      onClose();
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    
    setLoading(true);
    try {
      // Fetch both active and accepted negotiations to show complete bid flow
      const [activeResponse, acceptedResponse] = await Promise.all([
        userType === 'admin' 
          ? NegotiationService.getAllNegotiations(1, 50, 'negotiation')
          : NegotiationService.getCustomerNegotiations(1, 50, 'negotiation'),
        userType === 'admin' 
          ? NegotiationService.getAcceptedNegotiationsAdmin(1, 50)
          : NegotiationService.getAcceptedNegotiations(1, 50)
      ]);
      
      // Combine all negotiations and group by bidId
      const allNegotiations = [
        ...(activeResponse.negotiations || []),
        ...(acceptedResponse.negotiations || [])
      ];
      
      // Group negotiations by bidId to show complete flow
      const groupedNegotiations = groupNegotiationsByBidId(allNegotiations);
      setNegotiations(groupedNegotiations);
    } catch (error) {
      console.error('Error fetching negotiations:', error);
      // If error is due to unauthorized, redirect to login
      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        onClose();
        const hashPath = window.location.hash?.slice(1) || '/home';
        const returnTo = encodeURIComponent(hashPath);
        navigate(`/login?returnTo=${returnTo}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedNegotiations = async () => {
    // Check token before making API call
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    
    try {
      const response = userType === 'admin' 
        ? await NegotiationService.getAcceptedNegotiationsAdmin(1, 50)
        : await NegotiationService.getAcceptedNegotiations(1, 50);
      
      setAcceptedNegotiations(response.negotiations || []);
    } catch (error) {
      console.error('Error fetching accepted negotiations:', error);
      // If error is due to unauthorized, redirect to login
      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        onClose();
        const hashPath = window.location.hash?.slice(1) || '/home';
        const returnTo = encodeURIComponent(hashPath);
        navigate(`/login?returnTo=${returnTo}`);
      }
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

      // Join negotiation room for real-time updates
      if (socketService && selectedNegotiation._id) {
        socketService.joinNegotiation(selectedNegotiation._id);
      }

      setShowResponseForm(false);
      setSelectedNegotiation(null);
      setResponseData({ action: 'counter', offerPrice: '', message: '' });
      fetchNegotiations();
    } catch (error) {
      console.error('Error responding to negotiation:', error);
    }
  };

  // Check if there's a newer negotiation for the same bid
  const hasNewerNegotiation = (currentNegotiation, negotiationGroup) => {
    if (!negotiationGroup.negotiations || negotiationGroup.negotiations.length === 0) return false;
    
    return negotiationGroup.negotiations.some(negotiation => {
      // Same bid, different negotiation, newer timestamp
      return negotiation.bidId === currentNegotiation.bidId &&
             negotiation._id !== currentNegotiation._id &&
             new Date(negotiation.createdAt) > new Date(currentNegotiation.createdAt) &&
             negotiation.status === 'negotiation';
    });
  };

  // Check if any negotiation for the same bid has been accepted
  const hasAcceptedNegotiation = (negotiationGroup) => {
    return negotiationGroup.status === 'accepted';
  };

  // Check if customer can make a counter offer for the entire bid group
  const canMakeCounterForBid = (negotiationGroup) => {
    // If any negotiation for the same bid has been accepted, don't allow counter
    if (hasAcceptedNegotiation(negotiationGroup)) {
      return false;
    }

    if (userType === 'admin') {
      // Admin can always make counter offers until bid is accepted
      return true;
    } else {
      // Customer can only make counter offers if admin has already made a counter
      const hasAdminCounter = negotiationGroup.negotiations.some(n => n.FromUserType === 'Admin');
      return hasAdminCounter;
    }
  };

  const canAccept = (negotiation, negotiationGroup) => {
    // If any negotiation for the same bid has been accepted, don't allow accepting
    if (hasAcceptedNegotiation(negotiationGroup)) {
      return false;
    }

    // If there's a newer negotiation for the same bid, don't allow accepting old ones
    if (hasNewerNegotiation(negotiation, negotiationGroup)) {
      return false;
    }

    if (userType === 'admin') {
      // Admin can accept customer's offers (when admin is the receiver)
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

  const getProductImage = (productId) => {
    if (typeof productId === 'string') return '/images/iphone15.png';
    const images = productId?.skuFamilyId?.images;
    if (images && Array.isArray(images) && images.length > 0) {
      return `${imageBaseUrl}/${images[0]}`;
    }
    // Fallback to mainImage if available
    if (productId?.mainImage) {
      return `${imageBaseUrl}/${productId.mainImage}`;
    }
    return '/images/iphone15.png';
  };

  const getProductName = (productId) => {
    if (typeof productId === 'string') return 'Product';
    return productId?.name || productId?.skuFamilyId?.name || 'Product';
  };

  const getUserName = (userId) => {
    if (typeof userId === 'string') return 'User';
    return `${userId?.firstName || ''} ${userId?.lastName || ''}`.trim() || 'User';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200 bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {userType === 'admin' ? 'Admin' : 'My'} Negotiations
              </h2>
              <p className="text-xs text-gray-500">Manage your bidding conversations</p>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center space-x-2">
                <BellRing className="w-5 h-5 text-orange-500" />
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  {notifications.length} new
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {typingUsers.size > 0 && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{typingUsers.size} user{typingUsers.size > 1 ? 's' : ''} typing...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b-2 border-gray-100 flex-shrink-0">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-4 py-3 cursor-pointer font-semibold text-sm transition-all flex items-center justify-center space-x-2 relative ${
              activeTab === 'active'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>All Negotiations</span>
            {activeTab === 'active' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 px-4 py-3 cursor-pointer font-semibold text-sm transition-all flex items-center justify-center space-x-2 relative ${
              activeTab === 'accepted'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Accepted Negotiations</span>
            {activeTab === 'accepted' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-b-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-500 mt-4">Loading negotiations...</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Empty State for Active Negotiations */}
              {activeTab === 'active' && negotiations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                    <MessageSquare className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Negotiations</h3>
                  <p className="text-gray-500 max-w-md">
                    {userType === 'admin' 
                      ? "There are no active negotiations at the moment. New customer bids will appear here."
                      : "You don't have any active negotiations. Start bidding on products to see your negotiations here."
                    }
                  </p>
                </div>
              )}

              {/* Empty State for Accepted Negotiations */}
              {activeTab === 'accepted' && acceptedNegotiations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                    <CheckCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Accepted Orders</h3>
                  <p className="text-gray-500 max-w-md">
                    {userType === 'admin' 
                      ? "No negotiations have been accepted yet. Accepted orders will appear here."
                      : "You don't have any accepted orders yet. Once a negotiation is accepted, it will appear here."
                    }
                  </p>
                </div>
              )}

              {/* Negotiations List */}
              {(activeTab === 'active' ? negotiations : acceptedNegotiations).length > 0 && (activeTab === 'active' ? negotiations : acceptedNegotiations).map((item) => {
                // Handle both grouped negotiations and individual accepted negotiations
                const negotiationGroup = activeTab === 'active' ? item : null;
                const individualNegotiation = activeTab === 'accepted' ? item : null;
                
                if (negotiationGroup) {
                  return (
                    <div key={negotiationGroup.bidId} className="bg-white border-2 border-gray-200 rounded-xl p-2.5 hover:shadow-xl transition-all">
                      {/* Group Header */}
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                          {/* <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                          </div> */}
                          <div className="flex items-center space-x-3">
                            <img
                              src={getProductImage(negotiationGroup.productId)}
                              alt={getProductName(negotiationGroup.productId)}
                              onError={(e) => {
                                e.target.src = '/images/iphone15.png';
                              }}
                              className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-md"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {getProductName(negotiationGroup.productId)}
                              </h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className="text-xs font-semibold text-gray-700">
                                  ID: {negotiationGroup?.bidId?.slice(0, 12)}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  negotiationGroup.status === 'accepted' 
                                    ? 'bg-green-100 text-green-700 border border-green-300' 
                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                }`}>
                                  {negotiationGroup.status === 'accepted' ? '✓ Accepted' : '⏳ In Progress'}
                                </span>
                              </div>
                              {negotiationGroup.status === 'accepted' && negotiationGroup.acceptedBy && (
                                <span className="text-xs text-gray-500 mt-1 block">
                                  Accepted by {negotiationGroup.acceptedBy == 'Admin' ? 'Admin' : 'You'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bid-level Counter Button */}
                        <div className="flex flex-col space-y-2">
                          {canMakeCounterForBid(negotiationGroup) && (
                            <button
                              onClick={() => {
                                // Use the latest negotiation for counter based on user type
                                let latestNegotiation;
                                if (userType === 'admin') {
                                  // Admin counters the latest customer negotiation
                                  latestNegotiation = negotiationGroup.negotiations
                                    .filter(n => n.FromUserType === 'Customer')
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                                } else {
                                  // Customer counters the latest admin negotiation
                                  latestNegotiation = negotiationGroup.negotiations
                                    .filter(n => n.FromUserType === 'Admin')
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                                }
                                
                                if (latestNegotiation) {
                                  setSelectedNegotiation(latestNegotiation);
                                  setResponseData({ action: 'counter', offerPrice: '', message: '' });
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
                      </div>

                      {/* Negotiation Flow */}
                      <div className="space-y-4">
                        {negotiationGroup.negotiations
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((negotiation, index) => (
                            <div key={negotiation._id} className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500 relative">
                              {/* Connector Line */}
                              {index < negotiationGroup.negotiations.length - 1 && (
                                <div className="absolute left-6 top-full w-0.5 h-4 bg-gray-300"></div>
                              )}
                              
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-4 mb-3">
                                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                      negotiation.FromUserType === 'Admin' 
                                        ? 'bg-purple-100 text-purple-700' 
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {negotiation.FromUserType}
                                    </div>
                                    <div className="flex items-center space-x-1 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                                      <span className="font-bold text-green-600 text-base">
                                        {formatPrice(negotiation.offerPrice)}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-gray-500 text-xs">
                                      <Clock className="w-3.5 h-3.5 mr-1" />
                                      {formatDate(negotiation.createdAt)}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                                      negotiation.status === 'accepted'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {negotiation.status === 'accepted'
                                        ? 'Accepted'
                                        : hasAcceptedNegotiation(negotiationGroup)
                                        ? 'Superseded'
                                        : 'Pending'}
                                    </span>
                                  </div>
                                  {negotiation.message && (
                                    <div className="bg-white p-3 rounded-lg mt-2 border border-gray-200">
                                      <p className="text-sm text-gray-700">{negotiation.message}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex flex-col space-y-2 ml-4">
                                  {negotiation.status === 'negotiation' && (
                                    <>
                                      {canAccept(negotiation, negotiationGroup) && (
                                        <button
                                          onClick={() => {
                                            setSelectedNegotiation(negotiation);
                                            setResponseData({ action: 'accept', offerPrice: '', message: '' });
                                            setShowResponseForm(true);
                                          }}
                                          className="ml-4 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all flex items-center space-x-2 shadow-md"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                          <span>Accept</span>
                                        </button>
                                      )}
                                      {hasAcceptedNegotiation(negotiationGroup) && (
                                        <div className="text-xs text-gray-500 text-center">
                                          Other bid accepted
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                } else if (individualNegotiation) {
                  // Handle individual accepted negotiations for the accepted tab
                  return (
                    <div key={individualNegotiation._id} className="bg-white border-2 border-gray-200 rounded-xl p-2.5 hover:shadow-xl transition-all">
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex items-center space-x-3">
                            <img
                              src={getProductImage(individualNegotiation.productId)}
                              alt={getProductName(individualNegotiation.productId)}
                              onError={(e) => {
                                e.target.src = '/images/iphone15.png';
                              }}
                              className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-md"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {getProductName(individualNegotiation.productId)}
                              </h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className="text-xs text-gray-500">
                                  {getUserName(individualNegotiation.fromUserId)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(individualNegotiation.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                         {/* Action Button for Accepted Orders */}
                         {/* <div className="flex flex-col space-y-2">
                           <button
                             onClick={() => {
                               // Close the modal first
                               onClose();
                               // Navigate to product details page using React Router
                               const productId = typeof individualNegotiation.productId === 'string' 
                                 ? individualNegotiation.productId 
                                 : individualNegotiation.productId._id;
                               navigate(`/product/${productId}`);
                             }}
                             className="px-5 py-2.5 cursor-pointer text-black rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                           >
                             <FontAwesomeIcon icon={faBolt} className="w-4 h-4 mr-2" />
                             Buy Now
                           </button>
                         </div> */}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">Offer Price:</span>
                          <span className="font-bold text-green-600">
                            {formatPrice(individualNegotiation.offerPrice)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                            ✓ Accepted
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600">Accepted By:</span>
                          <span className="font-semibold text-gray-900">
                            {individualNegotiation.toUserType === 'Admin' ? 'Admin' : 'You'}
                          </span>
                        </div>
                      </div>

                      {individualNegotiation.message && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-700">{individualNegotiation.message}</p>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Response Form Modal */}
        {showResponseForm && selectedNegotiation && (
          <div className="fixed inset-0 bg-[#00000057] bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      responseData.action === 'accept' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {responseData.action === 'accept' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Send className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {responseData.action === 'accept' ? 'Accept Offer' : 'Counter Offer'}
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
                {responseData.action === 'counter' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Your Counter Price *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="w-5 h-5 text-gray-400" />
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
                    onChange={(e) => {
                      setResponseData({
                        ...responseData,
                        message: e.target.value,
                      });
                      // Send typing indicator
                      if (socketService && selectedNegotiation._id) {
                        socketService.sendNegotiationTyping(selectedNegotiation._id, e.target.value.length > 0);
                      }
                    }}
                    onBlur={() => {
                      // Stop typing indicator when user stops typing
                      if (socketService && selectedNegotiation._id) {
                        socketService.sendNegotiationTyping(selectedNegotiation._id, false);
                      }
                    }}
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
                      responseData.action === 'accept'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {responseData.action === 'accept' ? 'Accept Offer' : 'Send Counter'}
                  </button>
                </div>
              </form>
             </div>
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default NegotiationModal;
