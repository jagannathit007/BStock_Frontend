import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import BiddingProductDetails from "./BiddingProductDetails";
import BiddingSideFilter from "./BiddingSideFilter";
import BusinessDetailsPopup from "./BusinessDetailsPopup";
import BiddingProductCard from "./BiddingProductCard";
import ViewControls from "./ViewControls";
import Loader from "../Loader"; // Import Loader
import { convertPrice } from "../../utils/currencyUtils";

const BiddingContent = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [myMaxBidInput, setMyMaxBidInput] = useState("");
  const [showBusinessPopup, setShowBusinessPopup] = useState(false);

  // Real product data state management
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({});
  const [refreshTick] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');

  const mapApiProductToUi = (p) => {
    const id = p._id || "";
    const qty = Number(p.qty) || 0;
    const currentPriceNum = Number(p.currentPrice) || Number(p.startingBidPrice) || 0;
    const unitPrice = p.price;

    const modelFull = `${p.oem || ""} ${p.model || ""}`.trim();
    const memory = p.capacity || "";
    const carrier = p.carrier || "";
    const units = qty;
    const grade = p.grade || "";
    const cityState = p.city && p.state ? `${p.city}, ${p.state}` : "";

    // ----- TIMER -----
    let timer = "";
    if (p.endDatetime) {
      const now = new Date();
      const end = new Date(p.endDatetime);
      const diff = end - now;
      if (diff > 0) {
        const h = Math.floor(diff / 36e5);
        const m = Math.floor((diff % 36e5) / 6e4);
        const s = Math.floor((diff % 6e4) / 1e3);
        timer = `${h}h ${m}m ${s}s`;
      } else {
        timer = "Ended";
      }
    }

    // ----- NEW: Use maxBidPrice as My Max Bid -----
    const myMaxBidRaw = p.maxBidPrice;
    const myMaxBid = myMaxBidRaw && !myMaxBidRaw.includes("-")
      ? `$${Number(myMaxBidRaw).toFixed(2)}`
      : "-";

    return {
      id,
      modelFull,
      memory,
      carrier,
      units,
      grade,
      cityState,
      currentBid: `$${currentPriceNum.toFixed(2)}`,
      unitPrice: `$${unitPrice}`,
      bids: p.bids?.length ?? 0,
      timer,
      expiryTime: p.endDatetime,
      status: p.status || 'active', // Add status from API
      imageUrl: "https://via.placeholder.com/400x300.png?text=Product",
      highestBidder: p.highestBidder,
      minNextBid: p.minNextBid,
      currentPrice: p.currentPrice,

      // This is the field the card will read
      myMaxBid,                     // <-- NOW USING maxBidPrice
    };
  };

  const getSortObject = (option) => {
    switch (option) {
      case 'price_asc':
        return { price: 1 };
      case 'price_desc':
        return { price: -1 };
      case 'ending_soon':
        return { expiryTime: 1 };
      case 'bids_desc':
        return { bids: -1 };
      case 'bids_asc':
        return { bids: 1 };
      case 'newest':
        return { createdAt: -1 };
      default:
        return {};
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
        const response = await axios.post(
          `${baseUrl}/api/customer/get-bid-products`,
          {
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery,
            ...filters,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
            },
            signal: controller.signal,
          }
        );

        console.log("API Response:", response.data);

        if (response.data.status === 200) {
          const payload = response.data.data;
          const docs = payload?.docs || [];
          const totalDocs = Number(payload?.totalDocs) || 0;
          console.log(`Fetched ${docs.length} bid products out of ${totalDocs} total`);
          const mapped = docs.map(mapApiProductToUi);
          setFetchedProducts(mapped);
          setTotalProductsCount(totalDocs);
        } else {
          console.error("API returned non-200 status:", response.data);
          setErrorMessage("Failed to fetch products.");
          setFetchedProducts([]);
          setTotalProductsCount(0);
        }
      } catch (e) {
        if (!axios.isCancel(e)) {
          setFetchedProducts([]);
          setTotalProductsCount(0);
          console.error("Fetch products error:", e);
          console.error("Error details:", e.response?.data || e.message);
          setErrorMessage(e.response?.data?.message || "Failed to fetch products.");
        }
      } finally {
        setIsLoading(false);
        setHasInitiallyLoaded(true);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [currentPage, itemsPerPage, filters, refreshTick, searchQuery, sortOption]);


  useEffect(() => {
    const interval = setInterval(() => {
      setFetchedProducts((prevProducts) =>
        prevProducts.map((product) => {
          if (product.expiryTime) {
            const now = new Date();
            const expiry = new Date(product.expiryTime);
            const timeDiff = expiry.getTime() - now.getTime();

            if (timeDiff > 0) {
              const hours = Math.floor(timeDiff / (1000 * 60 * 60));
              const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
              const timer = `${hours}h ${minutes}m ${seconds}s`;

              return { ...product, timer };
            } else {
              // Timer expired
              return { ...product, timer: "Expired" };
            }
          }
          return product;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // const indexOfLastProduct = useMemo(() => currentPage * itemsPerPage, [currentPage, itemsPerPage]);
  const totalPages = useMemo(() => Math.max(Math.ceil(totalProductsCount / itemsPerPage), 1), [totalProductsCount, itemsPerPage]);
  const currentProducts = useMemo(() => fetchedProducts, [fetchedProducts]);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };


  const handleBackToList = () => {
    setSelectedProduct(null);
  };

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  // Handler for opening bidding form from BiddingProductCard
  const handleOpenBiddingForm = async (product) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const { businessProfile } = user;

      if (!businessProfile?.businessName || businessProfile.businessName.trim() === "") {
        setShowBusinessPopup(true);
        return;
      }

      if (businessProfile?.status === "pending" || businessProfile?.status === "rejected") {
        setShowBusinessPopup(true);
        return;
      }

      const customerId = user._id || "";
      if (!customerId) {
        const hashPath = window.location.hash?.slice(1) || "/home";
        const returnTo = encodeURIComponent(hashPath);
        window.location.href = `/#/login?returnTo=${returnTo}`;
        return;
      }

      setSelectedProduct(product);
    } catch (error) {
      console.error("Error in opening bidding form:", error);
      setShowBusinessPopup(true);
    }
  };


  // const handleRefresh = () => {
  //   setRefreshTick((prev) => !prev);
  // };

  const renderBidValue = (value) => {
    // Check if the value is a price (contains $ or is a number)
    if (typeof value === 'string' && value.includes('$')) {
      // Extract numeric value from string like "$1,245"
      const numericValue = parseFloat(value.replace(/[$,]/g, ''));
      if (!isNaN(numericValue)) {
        return convertPrice(numericValue);
      }
    } else if (typeof value === 'number') {
      return convertPrice(value);
    }

    return value;
  };

  if (selectedProduct) {
    return (
      <BiddingProductDetails
        product={selectedProduct}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 min-h-screen">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center cursor-pointer hover:bg-gray-50"
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

        {/* Mobile Filters Overlay */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-opacity-30 backdrop-blur-[1.5px] cursor-pointer"
              onClick={() => setShowMobileFilters(false)}
            ></div>
            <div className="absolute left-0 top-0 h-full w-72 bg-white z-50 overflow-y-auto">
              <BiddingSideFilter
                onClose={() => setShowMobileFilters(false)}
                onFilterChange={handleFilterChange}
                appliedFilters={filters}
              />
              <button
                className="w-full bg-[#0071E0] text-white py-3 px-4 text-sm font-medium lg:hidden sticky bottom-0 cursor-pointer hover:bg-blue-800"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Filters - Desktop */}
        <aside className="lg:w-72 hidden lg:block">
          <BiddingSideFilter onFilterChange={handleFilterChange} appliedFilters={filters} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* View Controls */}
          <ViewControls
            viewMode={viewMode}
            setViewMode={setViewMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOption={sortOption}
            setSortOption={setSortOption}
            setCurrentPage={setCurrentPage}
          />

          {/* Grid View */}
          {viewMode === "grid" ? (
            <>
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                  {errorMessage}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {(isLoading || !hasInitiallyLoaded) && currentProducts.length === 0 && (
                  <div className="col-span-3 flex justify-center py-12">
                    <Loader size="lg" />
                  </div>
                )}
                {!isLoading && hasInitiallyLoaded && currentProducts.length === 0 && (
                  <div className="col-span-3 text-center text-2xl text-gray-500 font-bold">
                    No products found.
                  </div>
                )}
                {currentProducts.map((product, index) => (
                  <div key={product.id} className="animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
                    <BiddingProductCard
                      product={product}
                      viewMode={viewMode}
                      onOpenBiddingForm={handleOpenBiddingForm}
                      renderBidValue={renderBidValue}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${currentPage === 1
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
                        className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${currentPage === number
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
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${currentPage === totalPages
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
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                  {errorMessage}
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full" style={{ minWidth: 'max-content' }}>
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          MODEL / UNIT
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          GRADE
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          CLOSES IN
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          BIDS
                        </th>
                        <th className="hidden md:table-cell px-4 py-3 sm:px-6 sm:py-4 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          UNIT PRICE
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          CUR. BID
                        </th>
                        <th className="hidden lg:table-cell px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          NEXT MIN BID
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          BID NOW
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(isLoading || !hasInitiallyLoaded) && currentProducts.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-12 text-center"
                          >
                            <div className="flex justify-center">
                              <Loader size="lg" />
                            </div>
                          </td>
                        </tr>
                      )}
                      {!isLoading && hasInitiallyLoaded && currentProducts.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-6 text-center text-2xl text-gray-500 font-bold"
                          >
                            No products found.
                          </td>
                        </tr>
                      )}
                      {currentProducts.map((product, index) => (
                        <BiddingProductCard
                          key={product.id}
                          product={product}
                          viewMode={viewMode}
                          onOpenBiddingForm={handleOpenBiddingForm}
                          renderBidValue={renderBidValue}
                          index={index}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${currentPage === 1
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
                        className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${currentPage === number
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
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${currentPage === totalPages
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
        </main>
      </div>

      {/* Business Details Popup */}
      {showBusinessPopup && (
        <BusinessDetailsPopup
          onClose={() => setShowBusinessPopup(false)}
          onContinue={() => {
            setShowBusinessPopup(false);
            // Continue with normal flow
          }}
        />
      )}
    </>
  );
};

export default BiddingContent;
