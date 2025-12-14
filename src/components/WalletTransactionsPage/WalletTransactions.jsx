import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import WalletService from "../../services/wallet/wallet.services";
import { formatPriceUSD } from "../../utils/currencyUtils";

const WalletModal = ({ isOpen, onClose }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  // Get customer category from localStorage
  const customerCategory = useMemo(() => {
    try {
      const categoryStr = localStorage.getItem("customerCategory");
      return categoryStr ? JSON.parse(categoryStr) : null;
    } catch (error) {
      console.error("Error parsing customer category:", error);
      return null;
    }
  }, []);

  // Calculate leverage amounts
  const leverageAmounts = useMemo(() => {
    const walletBalance = parseFloat(wallet?.balance || 0);
    const blockedAmount = parseFloat(wallet?.blockedAmount || 0);
    const readyStockAllowance = customerCategory?.readyStockAllowancePer || 0;
    const bidWalletAllowance = customerCategory?.bidWalletAllowancePer || 0;

    // Calculate remaining wallet balance (wallet balance minus blocked amount)
    const remainingWalletBalance = Math.max(0, walletBalance - blockedAmount);

    // Calculate total leverage amounts (for display purposes)
    const readyStockLeverage = readyStockAllowance > 0 
      ? walletBalance * readyStockAllowance 
      : 0;
    
    const bidLeverage = bidWalletAllowance > 0 
      ? walletBalance * bidWalletAllowance 
      : 0;

    // Calculate available leverage: (wallet balance - blocked amount) * leverage
    // This is the remaining amount available for new orders/bids
    const availableReadyStockLeverage = readyStockAllowance > 0
      ? remainingWalletBalance * readyStockAllowance
      : 0;
    
    const availableBidLeverage = bidWalletAllowance > 0
      ? remainingWalletBalance * bidWalletAllowance
      : 0;

    return {
      readyStockLeverage,
      bidLeverage,
      availableReadyStockLeverage,
      availableBidLeverage,
      blockedAmount,
      readyStockAllowance,
      bidWalletAllowance,
      isSame: readyStockAllowance === bidWalletAllowance
    };
  }, [wallet, customerCategory]);

  // Fetch wallet and transaction data
  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      // Fetch wallet balance
      const walletResponse = await WalletService.getWallet();
      if (walletResponse.status === 200 && walletResponse.data) {
        console.log('Wallet data received:', walletResponse.data);
        setWallet(walletResponse.data);
      } else {
        setWallet(null);
      }

      // Fetch transactions
      const transactionResponse = await WalletService.listTransactions(currentPage, limit);
      if (transactionResponse.status === 200 && transactionResponse.data) {
        setTransactions(transactionResponse.data.docs);
        setTotalPages(parseInt(transactionResponse.data.totalPages) || 1);
      } else {
        setTransactions([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setWallet(null);
      setTransactions([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWalletData();
    }
  }, [isOpen, currentPage]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Close modal on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <svg
              className="h-6 w-6 text-[#0071E0]"
              fill="currentColor"
              viewBox="0 0 512 512"
            >
              <path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64H80c-8.8 0-16-7.2-16-16s7.2-16 16-16H448c17.7 0 32-14.3 32-32s-14.3-32-32-32H64zM416 272a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">My Wallet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 cursor-pointer hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Wallet Balance */}
          <div className="mb-6 p-4 bg-[#0071E0] rounded-lg text-white">
            <h3 className="text-lg font-medium">Wallet Balance</h3>
            <p className="text-3xl font-bold">
              {formatPriceUSD(parseFloat(wallet ? wallet.balance : "0"))}
            </p>
          </div>

          {/* Blocked Amount */}
          {wallet && parseFloat(wallet.blockedAmount || 0) > 0 && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Blocked Amount
              </h3>
              <p className="text-2xl font-bold text-orange-700">
                {formatPriceUSD(parseFloat(wallet.blockedAmount || 0))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Amount currently blocked for pending orders/bids
              </p>
            </div>
          )}

          {/* Leverage Amounts */}
          {customerCategory && (customerCategory.readyStockAllowancePer || customerCategory.bidWalletAllowancePer) && (
            <div className="mb-6 space-y-3">
              {leverageAmounts.isSame ? (
                // Show single leverage if both allowances are the same
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Remaining Amount (Leverage)
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {formatPriceUSD(leverageAmounts.availableReadyStockLeverage)}
                  </p>
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-xs text-gray-500 mt-1">
                      {customerCategory.readyStockAllowancePer}% leverage on wallet balance
                    </p>
                  </div>
                </div>
              ) : (
                // Show separate leverages if different
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customerCategory.readyStockAllowancePer > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-700">
                          Ready Stock Remaining Amount
                        </h3>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatPriceUSD(leverageAmounts.availableReadyStockLeverage)}
                      </p>
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-xs text-gray-500 mt-1">
                          {customerCategory.readyStockAllowancePer}% leverage
                        </p>
                      </div>
                    </div>
                  )}
                  {customerCategory.bidWalletAllowancePer > 0 && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-700">
                          Bid Remaining Amount
                        </h3>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatPriceUSD(leverageAmounts.availableBidLeverage)}
                      </p>
                      <div className="mt-2 pt-2 border-t border-purple-200">
                        <p className="text-xs text-gray-500 mt-1">
                          {customerCategory.bidWalletAllowancePer}% leverage
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transaction History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transaction History
            </h3>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0071E0] border-r-transparent" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-6">
                No transactions found.
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const creatorName = 
                    !transaction.createdBy 
                      ? 'System' 
                      : typeof transaction.createdBy === 'string' 
                        ? 'Admin' 
                        : transaction.createdBy?.name || 'Admin';
                  return (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.remark}
                        </p>
                        <p className="text-xs text-gray-500">
                          By {creatorName} on{" "}
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            transaction.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatPriceUSD(parseFloat(transaction.amount))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#0071E0] text-white hover:bg-[#005BB5]"
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#0071E0] text-white hover:bg-[#005BB5]"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;