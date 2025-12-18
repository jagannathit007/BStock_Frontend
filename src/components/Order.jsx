import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faTimes, faSearch, faCreditCard, faEye, faMapMarkerAlt, faFileAlt, faDownload } from "@fortawesome/free-solid-svg-icons";
import OrderService from "../services/order/order.services";
import { getCurrencySymbol } from "../utils/currencyUtils";
import PaymentPopup from "./PaymentPopup";
import { getProductName } from "../utils/productUtils";

const Order = () => {
  // Format price in original currency (no conversion - price is already in order's currency)
  const formatPriceInCurrency = (priceValue, currency = 'USD') => {
    const numericPrice = parseFloat(priceValue) || 0;
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${numericPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allOrdersForTotals, setAllOrdersForTotals] = useState([]);
  const [paymentPendingOrders, setPaymentPendingOrders] = useState([]);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [showReceiverDetailsModal, setShowReceiverDetailsModal] = useState(false);
  const [selectedOrderForReceiver, setSelectedOrderForReceiver] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [submittingReceiverDetails, setSubmittingReceiverDetails] = useState(false);
  const [deliveryChargeModal, setDeliveryChargeModal] = useState({
    open: false,
    order: null,
    preview: null,
  });
  const itemsPerPage = 10;

  // Fetch all orders for totals calculation (when status filter changes)
  const fetchAllOrdersForTotals = useCallback(async () => {
    if (!statusFilter) {
      setAllOrdersForTotals([]);
      return;
    }
    try {
      // Fetch orders for the selected status with max allowed limit (100)
      // If there are more orders, we'll calculate totals from what we can fetch
      const response = await OrderService.listOrders(1, 100, statusFilter || undefined, searchQuery || undefined);
      if (response.status === 200) {
        setAllOrdersForTotals(response.data?.docs || []);
      }
    } catch (error) {
      console.error("Error fetching orders for totals:", error);
      setAllOrdersForTotals([]);
    }
  }, [statusFilter, searchQuery]);

  // Calculate currency-wise totals for current status from all orders
  const currencyTotals = useMemo(() => {
    const totals = {};
    const ordersToUse = allOrdersForTotals.length > 0 ? allOrdersForTotals : orders;
    ordersToUse.forEach((order) => {
      const currency = order.currency || 'USD';
      const amount = parseFloat(order.totalAmount) || 0;
      if (!totals[currency]) {
        totals[currency] = 0;
      }
      totals[currency] += amount;
    });
    return totals;
  }, [allOrdersForTotals, orders]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await OrderService.listOrders(page, itemsPerPage, statusFilter || undefined, searchQuery || undefined);
      if (response.status === 200) {
        setOrders(response.data?.docs || []);
        setTotalPages(response.data?.totalPages || 1);
      } else {
        setError(response.message || "Failed to fetch orders");
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || "An error occurred while fetching orders");
      console.error("Fetch orders error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  // Handle order cancellation
  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        setCancellingOrderId(orderId);
        await OrderService.cancelOrder(orderId);
        await fetchOrders(); // Refresh orders after cancellation
      } catch (error) {
        console.error("Cancel order error:", error);
      } finally {
        setCancellingOrderId(null);
      }
    }
  };

  // Load orders on mount and when page, status, or search changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch all orders for totals when status filter or search changes
  useEffect(() => {
    fetchAllOrdersForTotals();
  }, [fetchAllOrdersForTotals]);

  // Fetch payment pending orders (confirm status without payment)
  const fetchPaymentPendingOrders = useCallback(async () => {
    try {
      // Fetch all orders with confirm status
      const response = await OrderService.listOrders(1, 100, 'confirm', undefined);
      if (response.status === 200) {
        const allConfirmOrders = response.data?.docs || [];
        // Filter orders that don't have paymentDetails
        const pendingOrders = allConfirmOrders.filter(order => !order.paymentDetails);
        setPaymentPendingOrders(pendingOrders);
      }
    } catch (error) {
      console.error("Error fetching payment pending orders:", error);
      setPaymentPendingOrders([]);
    }
  }, []);

  // Calculate currency-wise totals for payment pending orders
  const paymentPendingTotals = useMemo(() => {
    const totals = {};
    paymentPendingOrders.forEach((order) => {
      const currency = order.currency || 'USD';
      const amount = parseFloat(order.totalAmount) || 0;
      if (!totals[currency]) {
        totals[currency] = 0;
      }
      totals[currency] += amount;
    });
    return totals;
  }, [paymentPendingOrders]);

  // Fetch payment pending orders on mount
  useEffect(() => {
    fetchPaymentPendingOrders();
  }, [fetchPaymentPendingOrders]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setIsLoading(true);
      setPage(newPage);
    }
  };

  // Handle status filter change
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
    setIsLoading(true);
  };

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPage(1); // Reset to first page when search changes
    setIsLoading(true);
  };

  // Handle view order details
  const handleViewOrderDetails = async (order) => {
    try {
      setLoadingOrderDetails(true);
      setSelectedOrderDetails(order);
      setShowOrderDetailsModal(true);
      
      // Fetch payment details if available
      try {
        const paymentResponse = await OrderService.getOrderWithPaymentDetails(order._id);
        if (paymentResponse?.data) {
          setSelectedOrderDetails(prev => ({
            ...prev,
            paymentDetails: paymentResponse.data.paymentDetails,
            billingAddress: paymentResponse.data.billingAddress || prev.billingAddress,
            shippingAddress: paymentResponse.data.shippingAddress || prev.shippingAddress,
          }));
        }
      } catch (paymentError) {
        console.log("Payment details not available or error fetching:", paymentError);
        // Continue showing order details even if payment details fail
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  return (
    <div>
      {/* Payment Pending Totals Header */}
      {Object.keys(paymentPendingTotals).length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Payment Pending</h2>
                <p className="text-sm text-gray-600">Orders awaiting payment</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {Object.entries(paymentPendingTotals)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([currency, total]) => (
                  <div key={currency} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-orange-200 shadow-sm">
                    <span className="text-xs font-medium text-gray-600 uppercase">{currency}:</span>
                    <span className="text-base font-bold text-orange-700">
                      {formatPriceInCurrency(total, currency)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <FontAwesomeIcon icon={faShoppingBag} className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 text-sm mt-1">Track and manage your orders</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        {/* Table Header with Controls */}
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-4 flex-1 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by Date, or Items"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <label htmlFor="statusFilter" className="text-sm font-semibold text-gray-700">
                Filter by Status:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={handleStatusChange}
                className="pl-4 pr-8 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
              >
                <option value="">All Orders</option>
                <option value="requested">Requested</option>
                <option value="rejected">Rejected</option>
                <option value="confirm">Confirm</option>
                <option value="waiting_for_payment">Waiting for Payment</option>
                <option value="payment_received">Payment Received</option>
                <option value="packing">Packing</option>
                <option value="ready_to_ship">Ready to Ship</option>
                <option value="on_the_way">On the Way</option>
                <option value="ready_to_pick">Ready to Pick</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Currency-wise Totals */}
            {Object.keys(currencyTotals).length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm flex-wrap">
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide whitespace-nowrap">
                  {statusFilter ? `${statusFilter.replace(/_/g, ' ').toUpperCase()} Total:` : 'TOTAL:'}
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  {Object.entries(currencyTotals)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([currency, total]) => (
                      <div key={currency} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-700 uppercase">{currency}:</span>
                        <span className="text-sm font-bold text-blue-900">
                          {formatPriceInCurrency(total, currency)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 m-6 rounded-r-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                {/* <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 border-b-2 border-gray-200 align-middle tracking-wide">
                  Order ID
                </th> */}
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 border-b-2 border-gray-200 align-middle tracking-wide">
                  Date
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 border-b-2 border-gray-200 align-middle tracking-wide">
                  Items
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 border-b-2 border-gray-200 align-middle tracking-wide">
                  Total Amount
                </th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-800 border-b-2 border-gray-200 align-middle tracking-wide">
                  Status
                </th>
                <th className="px-6 py-5 text-center text-sm font-bold text-gray-800 border-b-2 border-gray-200 align-middle tracking-wide">
                  View Details
                </th>
                <th className="px-6 py-5 text-end pe-10 text-sm font-bold text-gray-800 border-b-2 border-gray-200 align-middle tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="text-gray-500 text-lg">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="font-medium">Loading Orders...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="text-gray-500 text-lg">
                      <FontAwesomeIcon icon={faShoppingBag} className="w-20 h-20 text-gray-300 mb-4" />
                      <p className="font-medium text-gray-600">No orders found</p>
                      <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-blue-50 transition-all duration-200 border-b border-gray-100"
                  >
                    {/* <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {order._id}
                      </span>
                    </td> */}
                    <td className="px-6 py-5 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    {/* <td className="px-6 py-5 text-sm text-gray-600">
                      <div className="space-y-1">
                        {order.cartItems.map((item, index) => (
                          <div key={item.productId?._id || item._id || index} className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {index + 1}
                            </span>
                            <span className="font-medium">
                              {getProductName(item) || item.productId?.name || 'Unknown Product'}
                            </span>
                            <span className="text-gray-500">(x{item.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </td> */}
                    <td className="px-6 py-5 text-sm font-medium text-gray-900">
                      <span>{order.cartItems?.length}</span>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-gray-900">
                      <span className="text-lg">{formatPriceInCurrency(order.totalAmount, order.currency)}</span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      {(() => {
                        // Filter out internal stages that shouldn't be shown to customers
                        const internalStages = ['verify', 'approved'];
                        const displayStatus = internalStages.includes(order.status?.toLowerCase()) 
                          ? (order.status === 'verify' ? 'requested' : 'confirm')
                          : order.status;
                        
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                              displayStatus === 'delivered'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : displayStatus === 'cancelled'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : displayStatus === 'on_the_way'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : displayStatus === 'ready_to_pick'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : displayStatus === 'confirm'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : displayStatus === 'waiting_for_payment'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : displayStatus === 'payment_received'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : displayStatus === 'packing'
                                ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                : displayStatus === 'ready_to_ship'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : displayStatus === 'rejected'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {displayStatus?.replace(/_/g, ' ')}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-5 text-center">
                                                <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium"
                          title="View Order Details"
                        >
                          <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    <td className="px-6 py-5 text-sm text-center">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {order.status === 'requested' && (!order.deliveryChargeOption || order.deliveryChargeOption === 'standard') && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const option = order.currentLocation !== order.deliveryLocation ? 'express' : 'same_location';
                                const preview = await OrderService.getDeliveryChargePreview(order._id, option);
                                const data = preview.data || {};
                                setDeliveryChargeModal({
                                  open: true,
                                  order,
                                  preview: {
                                    option,
                                    extraCharge: data.extraCharge || 0,
                                    currency: data.currency || order.currency || 'USD',
                                    messages: Array.isArray(data.messages) ? data.messages : [],
                                  },
                                });
                              } catch (e) {
                                console.error('Delivery charge preview error:', e);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline bg-transparent"
                          >
                            {order.currentLocation !== order.deliveryLocation ? 'View express delivery charge' : 'View same-location charge'}
                          </button>
                        )}
                        {(order.status === 'confirm') && order.adminSelectedPaymentMethod && !order.paymentDetails && (
                          <button
                            onClick={() => {
                              setSelectedOrderForPayment(order);
                              setShowPaymentPopup(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 font-medium"
                            title="Submit Payment"
                          >
                            <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4" />
                            Payment
                          </button>
                        )}
                        {(order.status === 'ready_to_pick' || order.status === 'ready_to_ship') && !order.receiverDetails?.name && (
                          <button
                            onClick={() => {
                              setSelectedOrderForReceiver(order);
                              setReceiverName('');
                              setReceiverMobile('');
                              setShowReceiverDetailsModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all duration-200 font-medium"
                            title="Add Receiver Details"
                          >
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4" />
                            Add Receiver Details
                          </button>
                        )}
                        {['requested', 'confirm'].includes(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={cancellingOrderId === order._id}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                              cancellingOrderId === order._id ? 'animate-pulse' : ''
                            }`}
                            title="Cancel Order"
                          >
                            {cancellingOrderId === order._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-red-600"></div>
                            ) : (
                              <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                            )}
                            Cancel
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="text-sm text-gray-600 mb-4 sm:mb-0 font-medium">
              Showing {orders.length} of {orders.length} orders
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || isLoading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm transition-all duration-200 font-medium shadow-sm"
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        page === pageNum
                          ? "bg-blue-600 text-white border border-blue-600 shadow-md"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || isLoading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm transition-all duration-200 font-medium shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Popup */}
      {showPaymentPopup && selectedOrderForPayment && (
        <PaymentPopup
          isOpen={showPaymentPopup}
          onClose={() => {
            setShowPaymentPopup(false);
            setSelectedOrderForPayment(null);
          }}
          orderData={{
            orderId: selectedOrderForPayment._id,
            totalAmount: selectedOrderForPayment.totalAmount,
            currency: selectedOrderForPayment.currency,
            adminSelectedPaymentMethod: selectedOrderForPayment.adminSelectedPaymentMethod,
            cartItems: selectedOrderForPayment.cartItems,
          }}
          onSuccess={async (paymentData) => {
            try {
              await OrderService.submitPayment(
                selectedOrderForPayment._id,
                paymentData.billingAddress,
                paymentData.shippingAddress,
                paymentData.paymentDetails,
                paymentData.files
              );
              setShowPaymentPopup(false);
              setSelectedOrderForPayment(null);
              await fetchOrders();
              await fetchPaymentPendingOrders(); // Refresh payment pending totals
            } catch (error) {
              console.error('Payment submission error:', error);
            }
          }}
          adminSelectedPaymentMethod={selectedOrderForPayment.adminSelectedPaymentMethod}
        />
      )}

      {/* Delivery Charge Modal */}
      {deliveryChargeModal.open && deliveryChargeModal.preview && deliveryChargeModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {deliveryChargeModal.preview.option === 'express'
                  ? 'Express Delivery Charge'
                  : 'Same-Location Delivery Charge'}
              </h3>
              <button
                onClick={() =>
                  setDeliveryChargeModal({ open: false, order: null, preview: null })
                }
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {deliveryChargeModal.preview.messages?.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-900 whitespace-pre-line">
                  {deliveryChargeModal.preview.messages.join('\n')}
                </div>
              )}
              <p className="text-sm text-gray-700">
                This will add{' '}
                <span className="font-semibold">
                  {formatPriceInCurrency(
                    deliveryChargeModal.preview.extraCharge,
                    deliveryChargeModal.preview.currency
                  )}
                </span>{' '}
                to your order total for order placed on{' '}
                {new Date(deliveryChargeModal.order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
                .
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeliveryChargeModal({ open: false, order: null, preview: null })
                }
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await OrderService.applyDeliveryCharge(
                      deliveryChargeModal.order._id,
                      deliveryChargeModal.preview.option
                    );
                    setDeliveryChargeModal({ open: false, order: null, preview: null });
                    await fetchOrders();
                  } catch (e) {
                    console.error('Apply delivery charge error:', e);
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700"
              >
                Apply Charge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowOrderDetailsModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Order Details</h2>
                <p className="text-blue-100 text-sm mt-1">Order ID: {selectedOrderDetails._id}</p>
              </div>
              <button
                onClick={() => {
                  setShowOrderDetailsModal(false);
                  setSelectedOrderDetails(null);
                }}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-blue-800 rounded-lg"
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingOrderDetails ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading order details...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Order Status & Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">Order Status</p>
                      {(() => {
                        // Filter out internal stages for customer view
                        const internalStages = ['verify', 'approved'];
                        const displayStatus = internalStages.includes(selectedOrderDetails.status?.toLowerCase()) 
                          ? (selectedOrderDetails.status === 'verify' ? 'requested' : 'confirm')
                          : selectedOrderDetails.status;
                        
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                              displayStatus === 'delivered'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : displayStatus === 'cancelled'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : displayStatus === 'on_the_way'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : displayStatus === 'ready_to_pick'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : displayStatus === 'confirm'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : displayStatus === 'waiting_for_payment'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : displayStatus === 'payment_received'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : displayStatus === 'packing'
                                ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                : displayStatus === 'ready_to_ship'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : displayStatus === 'rejected'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {displayStatus?.replace(/_/g, ' ')}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">Order Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedOrderDetails.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Location & Currency */}
                  {(selectedOrderDetails.currentLocation || selectedOrderDetails.deliveryLocation || selectedOrderDetails.currency) && (
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600" />
                        Location & Currency
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedOrderDetails.currentLocation && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">Current Location</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedOrderDetails.currentLocation === 'HK' ? 'Hong Kong' : 'Dubai'}
                            </p>
                          </div>
                        )}
                        {selectedOrderDetails.deliveryLocation && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">Delivery Location</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedOrderDetails.deliveryLocation === 'HK' ? 'Hong Kong' : 'Dubai'}
                            </p>
                          </div>
                        )}
                        {selectedOrderDetails.currency && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">Currency</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedOrderDetails.currency}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faShoppingBag} className="text-blue-600" />
                      Order Items ({selectedOrderDetails.cartItems?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {selectedOrderDetails.cartItems?.map((item, index) => (
                        <div key={item.productId?._id || item._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {getProductName(item) || item.productId?.name || 'Unknown Product'}
                              </p>
                              <p className="text-xs text-gray-500">Quantity: {item.quantity} × {formatPriceInCurrency(item.price || item.productId?.price || 0, selectedOrderDetails.currency)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {formatPriceInCurrency((item.price || item.productId?.price || 0) * item.quantity, selectedOrderDetails.currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                      {selectedOrderDetails.otherCharges && selectedOrderDetails.otherCharges > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Other Charges:</span>
                          <span className="font-semibold text-gray-900">{formatPriceInCurrency(selectedOrderDetails.otherCharges, selectedOrderDetails.currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-blue-600">{formatPriceInCurrency(selectedOrderDetails.totalAmount, selectedOrderDetails.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing Address */}
                  {selectedOrderDetails.billingAddress && (
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600" />
                        Billing Address
                      </h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Address:</span> {selectedOrderDetails.billingAddress.address}</p>
                        <p><span className="font-medium">City:</span> {selectedOrderDetails.billingAddress.city}</p>
                        <p><span className="font-medium">Postal Code:</span> {selectedOrderDetails.billingAddress.postalCode}</p>
                        <p><span className="font-medium">Country:</span> {selectedOrderDetails.billingAddress.country}</p>
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  {selectedOrderDetails.shippingAddress && (
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-600" />
                        Shipping Address
                      </h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Address:</span> {selectedOrderDetails.shippingAddress.address}</p>
                        <p><span className="font-medium">City:</span> {selectedOrderDetails.shippingAddress.city}</p>
                        <p><span className="font-medium">Postal Code:</span> {selectedOrderDetails.shippingAddress.postalCode}</p>
                        <p><span className="font-medium">Country:</span> {selectedOrderDetails.shippingAddress.country}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Details */}
                  {selectedOrderDetails.paymentDetails && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCreditCard} className="text-green-600" />
                        Payment Details
                      </h3>
                      <div className="space-y-3">
                        {selectedOrderDetails.paymentDetails.module && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Payment Method:</span>
                            <span className="text-sm font-semibold text-gray-900 capitalize">{selectedOrderDetails.paymentDetails.module}</span>
                          </div>
                        )}
                        {selectedOrderDetails.paymentDetails.currency && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Currency:</span>
                            <span className="text-sm font-semibold text-gray-900">{selectedOrderDetails.paymentDetails.currency}</span>
                          </div>
                        )}
                        {selectedOrderDetails.paymentDetails.transactionRef && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Transaction Reference:</span>
                            <span className="text-sm font-mono font-semibold text-gray-900">{selectedOrderDetails.paymentDetails.transactionRef}</span>
                          </div>
                        )}
                        {selectedOrderDetails.paymentDetails.fields && Object.keys(selectedOrderDetails.paymentDetails.fields).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Additional Payment Information:</p>
                            <div className="space-y-2">
                              {Object.entries(selectedOrderDetails.paymentDetails.fields).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="font-medium text-gray-900">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedOrderDetails.paymentDetails.uploadedFiles && selectedOrderDetails.paymentDetails.uploadedFiles.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <FontAwesomeIcon icon={faFileAlt} />
                              Payment Documents:
                            </p>
                            <div className="space-y-2">
                              {selectedOrderDetails.paymentDetails.uploadedFiles.map((file, index) => {
                                const baseUrl = import.meta.env.VITE_BASE_URL || '';
                                const fileUrl = file.startsWith('http') ? file : `${baseUrl}/${file.replace(/^\/+/, '')}`;
                                return (
                                  <a
                                    key={index}
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                                    <span>Document {index + 1}</span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedOrderDetails.paymentDetails && (
                    <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                      <p className="text-sm text-yellow-800">
                        <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                        Payment details not available for this order.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receiver Details Modal */}
      {showReceiverDetailsModal && selectedOrderForReceiver && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Receiver Details</h2>
              <button
                onClick={() => {
                  setShowReceiverDetailsModal(false);
                  setSelectedOrderForReceiver(null);
                  setReceiverName('');
                  setReceiverMobile('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receiver Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Enter receiver name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receiver Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={receiverMobile}
                  onChange={(e) => setReceiverMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter mobile number (10-15 digits)"
                  maxLength={15}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Required for delivery verification</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    if (!receiverName.trim() || !receiverMobile.trim()) {
                      alert('Please fill in all required fields');
                      return;
                    }

                    if (receiverMobile.length < 10 || receiverMobile.length > 15) {
                      alert('Mobile number must be 10-15 digits');
                      return;
                    }

                    try {
                      setSubmittingReceiverDetails(true);
                      await OrderService.addReceiverDetails(
                        selectedOrderForReceiver._id,
                        receiverName.trim(),
                        receiverMobile.trim()
                      );
                      setShowReceiverDetailsModal(false);
                      setSelectedOrderForReceiver(null);
                      setReceiverName('');
                      setReceiverMobile('');
                      fetchOrders();
                    } catch (error) {
                      console.error('Error adding receiver details:', error);
                    } finally {
                      setSubmittingReceiverDetails(false);
                    }
                  }}
                  disabled={submittingReceiverDetails}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submittingReceiverDetails ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={() => {
                    setShowReceiverDetailsModal(false);
                    setSelectedOrderForReceiver(null);
                    setReceiverName('');
                    setReceiverMobile('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;