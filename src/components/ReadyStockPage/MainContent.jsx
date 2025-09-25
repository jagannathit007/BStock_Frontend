import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import SideFilter from "../SideFilter";
import ViewControls from "./ViewControls";
import BiddingForm from "../negotiation/BiddingForm"; // Import BiddingForm
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import Swal from "sweetalert2";

const MainContent = () => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({});
  const [refreshTick, setRefreshTick] = useState(false);
  const [isBiddingFormOpen, setIsBiddingFormOpen] = useState(false); // State for BiddingForm
  const [selectedProduct, setSelectedProduct] = useState(null); // Track selected product for bidding

  const mapApiProductToUi = (p) => {
    const id = p._id || p.id || "";
    const name = p.skuFamilyId?.name || p.specification || "Product";
    const imageUrl =
      p.skuFamilyId?.images?.[0] ||
      "https://via.placeholder.com/400x300.png?text=Product";
    const storage = p.storage || "";
    const color = p.color || "";
    const ram = p.ram || "";
    const description =
      [storage, color, ram].filter(Boolean).join(" • ") ||
      p.specification ||
      "";
    const priceNumber = Number(p.price) || 0;
    const price = priceNumber.toFixed(2);
    const originalPrice = (priceNumber > 0 ? priceNumber + 100 : 0).toFixed(2);
    const stock = Number(p.stock) || 0;
    const stockStatus =
      stock <= 0 ? "Out of Stock" : stock <= 10 ? "Low Stock" : "In Stock";
    const expiryTime = p.expiryTime;
    const isExpired = expiryTime ? new Date(expiryTime) < new Date() : false;

    return {
      id,
      name,
      description,
      price,
      originalPrice,
      discount: (Number(originalPrice) - Number(price)).toFixed(2),
      moq: Number(p.moq) || 1,
      stockStatus,
      stockCount: stock,
      imageUrl,
      isFavorite: p.WishList || false,
      isOutOfStock: stock <= 0,
      isExpired,
      expiryTime,
      notify: Boolean(p.notify),
      purchaseType: p.purchaseType || null,
    };
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const baseUrl =
          import.meta.env.VITE_BASE_URL || "http://localhost:3200";
        const response = await axios.post(
          `${baseUrl}/api/customer/get-product-list`,
          {
            page: currentPage,
            limit: itemsPerPage,
            search: filters.search || "",
            ...filters,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: localStorage.getItem("token")
                ? `Bearer ${localStorage.getItem("token")}`
                : "",
            },
            signal: controller.signal,
          }
        );

        if (response.data.status === 200) {
          const payload = response.data.data;
          const docs = payload?.docs || [];
          const totalDocs = Number(payload?.totalDocs) || 0;
          const mapped = docs.map(mapApiProductToUi);
          setFetchedProducts(mapped);
          setTotalProductsCount(totalDocs);
        } else {
          setErrorMessage("Failed to fetch products.");
          setFetchedProducts([]);
          setTotalProductsCount(0);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          setFetchedProducts([]);
          setTotalProductsCount(0);
          console.error("Fetch products error:", e);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [currentPage, itemsPerPage, filters, refreshTick]);

  useEffect(() => {
    setItemsPerPage(viewMode === "grid" ? 9 : 10);
    setCurrentPage(1);
  }, [viewMode]);

  useEffect(() => {
    const handleWishlistUpdate = () => {
      setRefreshTick((prev) => !prev);
    };
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setRefreshTick((prev) => !prev);
  };

  // Handle opening BiddingForm
  const handleOpenBiddingForm = async (product) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const { businessProfile } = user;

      if (!businessProfile?.businessName || businessProfile.businessName.trim() === "") {
        window.location.href = "/profile";
        await Swal.fire({
          icon: "warning",
          title: "Business Details Required",
          text: "Please add your business details before making an offer.",
          confirmButtonText: "Go to Settings",
          confirmButtonColor: "#0071E0",
        });
        return;
      }

      if (user?.isApproved === false) {
        await Swal.fire({
          icon: "info",
          title: "Pending Approval",
          text: "Your business profile is not approved. Please wait for approval.",
          confirmButtonText: "OK",
          confirmButtonColor: "#0071E0",
        });
        return;
      }

      const customerId = user._id || "";
      if (!customerId) {
        window.location.href = "/signin";
        return;
      }

      setSelectedProduct(product);
      setIsBiddingFormOpen(true);
    } catch (error) {
      console.error("Error in opening bidding form:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while opening the bidding form. Please try again.",
        confirmButtonText: "OK",
        confirmButtonColor: "#0071E0",
      });
    }
  };

  // Handle closing BiddingForm
  const handleBiddingFormClose = () => {
    setIsBiddingFormOpen(false);
    setSelectedProduct(null);
  };

  // Handle successful bid submission
  const handleBidSuccess = () => {
    Swal.fire({
      icon: "success",
      title: "Bid Submitted",
      text: "Your bid has been successfully submitted!",
      confirmButtonText: "OK",
      confirmButtonColor: "#0071E0",
    });
    setRefreshTick((prev) => !prev); // Refresh product list
  };

  const indexOfLastProduct = useMemo(() => currentPage * itemsPerPage, [currentPage, itemsPerPage]);
  const indexOfFirstProduct = useMemo(() => indexOfLastProduct - itemsPerPage, [indexOfLastProduct, itemsPerPage]);
  const totalPages = useMemo(() => Math.max(Math.ceil(totalProductsCount / itemsPerPage), 1), [totalProductsCount, itemsPerPage]);
  const currentProducts = useMemo(() => fetchedProducts, [fetchedProducts]);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {showMobileFilters && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-opacity-30 backdrop-blur-[1.5px]"
              onClick={() => setShowMobileFilters(false)}
            ></div>
            <div className="absolute left-0 top-0 h-full w-72 bg-white z-50 overflow-y-auto">
              <SideFilter
                onClose={() => setShowMobileFilters(false)}
                onFilterChange={handleFilterChange}
              />
              <button
                className="w-full bg-[#0071E0] text-white py-3 px-4 text-sm font-medium lg:hidden"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        <div className="lg:w-72 hidden lg:block">
          <SideFilter onFilterChange={handleFilterChange} />
        </div>

        <div className="flex-1 min-w-0">
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="lg:hidden mb-4">
            <button
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center"
              onClick={() => setShowMobileFilters(true)}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 512 512"
              >
                <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32H472c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9V448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6V320.9L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z" />
              </svg>
              Filters
            </button>
          </div>

          <ViewControls
            viewMode={viewMode}
            setViewMode={setViewMode}
            totalProducts={totalProductsCount}
            showingProducts={`${Math.min(
              indexOfFirstProduct + 1,
              totalProductsCount
            )}-${Math.min(indexOfLastProduct, totalProductsCount)}`}
          />

          {viewMode === "grid" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {isLoading && currentProducts.length === 0 && (
                  <div className="col-span-3 text-center text-sm text-gray-500">
                    Loading products...
                  </div>
                )}
                {!isLoading && currentProducts.length === 0 && (
                  <div className="col-span-3 text-center text-sm text-gray-500">
                    No products found.
                  </div>
                )}
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                    onRefresh={handleRefresh}
                    onOpenBiddingForm={handleOpenBiddingForm} // Pass handler
                  />
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                  Previous
                </button>

                <div className="hidden md:flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                          currentPage === number
                            ? "bg-[#0071E0] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {number}
                      </button>
                    )
                  )}
                </div>

                <div className="md:hidden text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Next
                  <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Product
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Price
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Stock
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          MOQ
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading && currentProducts.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-6 text-center text-sm text-gray-500"
                          >
                            Loading products...
                          </td>
                        </tr>
                      )}
                      {!isLoading && currentProducts.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-6 text-center text-sm text-gray-500"
                          >
                            No products found.
                          </td>
                        </tr>
                      )}
                      {currentProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          viewMode={viewMode}
                          onRefresh={handleRefresh}
                          onOpenBiddingForm={handleOpenBiddingForm} // Pass handler
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                  Previous
                </button>

                <div className="hidden md:flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                          currentPage === number
                            ? "bg-[#0071E0] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {number}
                      </button>
                    )
                  )}
                </div>

                <div className="md:hidden text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Next
                  <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isBiddingFormOpen && selectedProduct && (
        <BiddingForm
          product={selectedProduct}
          isOpen={isBiddingFormOpen}
          onClose={handleBiddingFormClose}
          onSuccess={handleBidSuccess}
        />
      )}
    </main>
  );
};

export default MainContent;