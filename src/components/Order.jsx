import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import OrderService from "../services/order/order.services";
import { convertPrice } from "../utils/currencyUtils";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const itemsPerPage = 10;

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

  return (
    <div>
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
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-4 flex-1">
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
                <option value="request">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancel">Cancelled</option>
              </select>
            </div>
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
                    <td className="px-6 py-5 text-sm text-gray-600">
                      <div className="space-y-1">
                        {order.cartItems.map((item, index) => (
                          <div key={item.productId?._id || item._id || index} className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {index + 1}
                            </span>
                            <span className="font-medium">
                              {item.skuFamilyId?.name || item.productId?.name || 'Unknown Product'}
                            </span>
                            <span className="text-gray-500">(x{item.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-gray-900">
                      <span className="text-lg">{convertPrice(order.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : order.status === 'cancel' || order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : order.status === 'accepted'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-center">
                      {['request', 'accepted'].includes(order.status) && (
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
    </div>
  );
};

export default Order;