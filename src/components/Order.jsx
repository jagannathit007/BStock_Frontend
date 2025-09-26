import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag, faTimes } from "@fortawesome/free-solid-svg-icons";
import OrderService from "../services/order/order.services";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await OrderService.listOrders(page, 10, statusFilter || undefined);
      if (response.status === 200) {
        setOrders(response.data?.docs || []);
        setTotalPages(Math.ceil((response.data?.totalDocs || 0) / (response.data?.limit || 10)));
      } else {
        setError(response.message || "Failed to fetch orders");
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || "An error occurred while fetching orders");
      console.error("Fetch orders error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

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

  // Load orders on mount and when page or status changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Handle status filter change
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faShoppingBag} className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Your Orders</h1>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3">
          <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={handleStatusChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="request">Request</option>
            <option value="accepted">Accepted</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faShoppingBag} className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600">You have no orders.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Order ID
                      </th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Date
                      </th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Items
                      </th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Total
                      </th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order._id}</div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {order.cartItems.map((item) => (
                              <div key={item.productId._id}>
                                {item.skuFamilyId?.name || item.productId.name} (x{item.quantity})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            ${order.totalAmount}
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="text-sm capitalize text-gray-600">{order.status}</div>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          {['request', 'accepted'].includes(order.status) && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              disabled={cancellingOrderId === order._id}
                              className={`text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
                                cancellingOrderId === order._id ? 'animate-pulse' : ''
                              }`}
                            >
                              <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Order;