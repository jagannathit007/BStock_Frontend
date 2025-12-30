import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const WTBPanel = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalDocs: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchSkus = async (searchValue = search, page = pagination.page, limit = pagination.limit) => {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
      // Use new API endpoint that returns all unique sub-SKU families (even without products)
      const res = await axios.post(
        `${baseUrl}/api/customer/wtb/get-all-sub-sku-families`,
        {
          page: page,
          limit: limit,
          search: searchValue || '',
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token")
              ? `Bearer ${localStorage.getItem("token")}`
              : "",
          },
        }
      );
      const data = res.data?.data || {};
      const docs = data.docs || [];
      
      // Debug: Log pagination data
      console.log('[WTB] API Response:', {
        docsCount: docs.length,
        page: data.page,
        limit: data.limit,
        totalDocs: data.totalDocs,
        totalPages: data.totalPages,
        hasNextPage: data.hasNextPage,
        hasPrevPage: data.hasPrevPage,
      });
      
      // Map the response to the expected format
      setRows(
        docs.map((p) => {
          return {
            id: p.subSkuFamilyId || p._id || p.skuFamilyId, // Use sub-SKU family ID as primary identifier
            phoneName: p.phoneName || 'Product',
            brand: p.brand || '-',
            brandId: p.brandId || null,
            skuFamilyId: p.skuFamilyId || null,
            subSkuFamilyId: p.subSkuFamilyId || null,
          };
        })
      );
      
      // Update pagination state - ensure all values are numbers
      setPagination({
        page: Number(data.page) || Number(page) || 1,
        limit: Number(data.limit) || Number(limit) || 20,
        totalDocs: Number(data.totalDocs) || 0,
        totalPages: Number(data.totalPages) || 0,
        hasNextPage: Boolean(data.hasNextPage),
        hasPrevPage: Boolean(data.hasPrevPage),
      });
    } catch (e) {
      console.error("WTB fetch error", e);
      setRows([]);
      setPagination({
        page: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      // Reset to first page when opening
      const defaultLimit = 10;
      setPagination(prev => ({ ...prev, page: 1, limit: defaultLimit }));
      fetchSkus(search, 1, defaultLimit);
    }
  }, [open]);

  const handleSearch = async (e) => {
    e.preventDefault();
    // Reset to first page on search
    setPagination(prev => ({ ...prev, page: 1 }));
    await fetchSkus(search, 1, pagination.limit);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchSkus(search, newPage, pagination.limit);
    }
  };

  const handleSubmitWtb = async (row) => {
    const { value: qty } = await Swal.fire({
      title: "Enter quantity",
      input: "number",
      inputAttributes: { min: 1 },
      inputValue: 1,
      showCancelButton: true,
      confirmButtonText: "Submit",
    });

    if (!qty || Number(qty) <= 0) return;

    try {
      const token = localStorage.getItem("token");
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!token || !isLoggedIn) {
        const returnTo = encodeURIComponent(
          window.location.hash?.slice(1) || "/home"
        );
        window.location.href = `/#/login?returnTo=${returnTo}`;
        return;
      }

      const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
      // Send subSkuFamilyId and skuFamilyId (no productId needed)
      await axios.post(
        `${baseUrl}/api/customer/wtb/create`,
        {
          subSkuFamilyId: row.subSkuFamilyId || row.id, // Use sub-SKU family ID
          skuFamilyId: row.skuFamilyId || null,
          quantity: Number(qty),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Request submitted",
        text: "Your WTB request has been submitted.",
      });
    } catch (err) {
      console.error("WTB submit error", err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to submit request",
      });
    }
  };

  if (!open) {
    return (
      <button
        className="fixed bottom-4 right-4 z-40 px-4 py-3 rounded-full shadow-lg bg-[#0071E0] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#005bb5]"
        onClick={() => setOpen(true)}
      >
        WTB
      </button>
    );
  }

  return (
    <>
      <button
        className="fixed bottom-4 right-4 z-40 px-4 py-3 rounded-full shadow-lg bg-gray-700 text-white text-sm font-semibold flex items-center gap-2 hover:bg-gray-800"
        onClick={() => setOpen(false)}
      >
        Close WTB
      </button>

      <div className="fixed inset-0 z-90 bg-black/40 flex items-end md:items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-5xl h-[95vh] md:h-[85vh] flex flex-col overflow-hidden">
          {/* Header - Fixed with proper spacing and no overlap */}
          <div className="flex-shrink-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 border-b border-gray-200 bg-white flex items-center justify-between min-h-[60px]">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate pr-2 flex-1 min-w-0">
              Want To Buy (WTB)
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors ml-2"
              aria-label="Close modal"
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-600 text-sm sm:text-base md:text-lg" />
            </button>
          </div>

          {/* Search Form - Fixed */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E0] focus:border-transparent"
                placeholder="Search phone name or brand…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 bg-[#0071E0] text-white rounded-lg text-sm font-semibold hover:bg-[#005bb5] transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </form>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">No SKUs found.</div>
            ) : (
              <>
                {/* Table - Responsive */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm bg-white">
                    <thead className="bg-gray-50 border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Phone Name
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Brand
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-4 py-3 font-medium text-gray-900">
                            {r.phoneName}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-gray-600">
                            {r.brand || "-"}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right">
                            <button
                              type="button"
                              className="px-3 sm:px-4 py-1.5 rounded-full bg-[#0071E0] text-white text-xs font-semibold hover:bg-[#005bb5] transition-colors whitespace-nowrap"
                              onClick={() => handleSubmitWtb(r)}
                            >
                              Submit WTB
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination - Always visible when there's data, fixed at bottom */}
          {!loading && rows.length > 0 && pagination.totalDocs > 0 && (
            <div className="flex-shrink-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.totalDocs)}
                </span>{" "}
                of <span className="font-medium">{pagination.totalDocs}</span> results
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      pagination.hasPrevPage
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                            pagination.page === pageNum
                              ? "bg-[#0071E0] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      pagination.hasNextPage
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WTBPanel;



