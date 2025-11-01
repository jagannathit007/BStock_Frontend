import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { useSocket } from "../../context/SocketContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const BiddingContent = ({ isLoggedIn: isLoggedInProp }) => {
  const navigate = useNavigate();
  const isLoggedIn = isLoggedInProp ?? (localStorage.getItem('isLoggedIn') === 'true');
  const { socketService } = useSocket();
  const [viewMode, setViewMode] = useState("list");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Reduced to 8 items per page to prevent scrolling
  const [showBusinessPopup, setShowBusinessPopup] = useState(false);

  // Real product data state management
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({});
  const [refreshTick, setRefreshTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const isInitialMount = useRef(true);

  // Debounce search query with 1000ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when debounced search query changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

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
    const color = p.color || "";
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
      oem: p.oem || "",
      model: p.model || "",
      modelFull,
      memory,
      carrier,
      units,
      grade,
      color,
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
        return { sortBy: 'price', sortOrder: 1 };
      case 'price_desc':
        return { sortBy: 'price', sortOrder: -1 };
      case 'ending_soon':
        return { sortBy: 'endDatetime', sortOrder: 1 };
      case 'bids_desc':
        return { sortBy: 'bids', sortOrder: -1 };
      case 'bids_asc':
        return { sortBy: 'bids', sortOrder: 1 };
      case 'newest':
        return { sortBy: 'createdAt', sortOrder: -1 };
      default:
        return {};
    }
  };

  useEffect(() => {
    console.log('useEffect triggered - fetching products. Dependencies:', {
      currentPage,
      itemsPerPage,
      filters,
      refreshTick,
      debouncedSearchQuery,
      sortOption
    });
    
    const controller = new AbortController();
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
        const sortParams = getSortObject(sortOption);
        // Ensure search is included and not overridden by filters
        const requestBody = {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchQuery || '',
          ...filters,
          ...sortParams,
        };
        // Re-apply search after filters to ensure it's not overridden
        if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
          requestBody.search = debouncedSearchQuery.trim();
        }
        console.log('Fetching products with request body:', requestBody);
        const response = await axios.post(
          `${baseUrl}/api/customer/get-bid-products`,
          requestBody,
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
  }, [currentPage, itemsPerPage, filters, refreshTick, debouncedSearchQuery, sortOption, isLoggedIn]);


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

  // Socket integration for real-time bid updates
  useEffect(() => {
    if (!isLoggedIn || !socketService) {
      if (!socketService) {
        console.warn('BiddingContent: socketService not available');
      }
      return;
    }

    // Join bid rooms for all visible products
    const joinBidRooms = () => {
      fetchedProducts.forEach((product) => {
        if (product.id && product.status !== 'closed') {
          socketService.joinBid(product.id);
        }
      });
    };

    // Join rooms when products are loaded
    if (fetchedProducts.length > 0) {
      joinBidRooms();
    }

    // Listen for bid notifications (outbid, winning_bid, etc.)
    const handleBidNotification = (data) => {
      console.log('BiddingContent: Received bid notification:', data);
      
      const { type, bidData, message } = data;
      
      // Show notification to user
      if (type === 'outbid') {
        Swal.fire({
          icon: 'info',
          title: 'You\'ve been outbid!',
          text: message || `Someone placed a higher bid on ${bidData?.lotNumber || 'this product'}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });
      } else if (type === 'winning_bid') {
        Swal.fire({
          icon: 'success',
          title: 'Congratulations!',
          text: message || 'You are now the highest bidder!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });
      } else if (type === 'bid_placed') {
        Swal.fire({
          icon: 'info',
          title: 'New Bid Placed',
          text: message || `A new bid has been placed on ${bidData?.lotNumber || 'this product'}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
        });
      }

      // Refresh products to get updated bid data
      setRefreshTick((prev) => prev + 1);
    };

    // Listen for bid updates (when someone places a bid on any product)
    const handleBidUpdate = (data) => {
      console.log('BiddingContent: Received bid update:', data);
      
      // Update the specific product in the list
      if (data.productId) {
        setFetchedProducts((prevProducts) =>
          prevProducts.map((product) => {
            if (product.id === data.productId) {
              // Update product with new bid data
              return {
                ...product,
                currentBid: data.currentPrice || product.currentBid,
                currentPrice: data.currentPrice || product.currentPrice,
                highestBidder: data.highestBidder || product.highestBidder,
              };
            }
            return product;
          })
        );
      } else {
        // If no productId, refresh all products
        setRefreshTick((prev) => prev + 1);
      }
    };

    // Setup socket listeners
    socketService.onBidNotification(handleBidNotification);
    socketService.onBidUpdate(handleBidUpdate);

    // Cleanup: Leave all bid rooms and remove listeners
    return () => {
      fetchedProducts.forEach((product) => {
        if (product.id) {
          socketService.leaveBid(product.id);
        }
      });
      socketService.removeBidListeners();
    };
  }, [socketService, fetchedProducts, isLoggedIn]);

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


  const handleRefresh = useCallback(() => {
    console.log('handleRefresh called - incrementing refreshTick to trigger refetch');
    setRefreshTick((prev) => {
      const newValue = prev + 1;
      console.log('refreshTick incremented from', prev, 'to', newValue);
      return newValue;
    });
  }, []);

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

  // Generate dummy data for non-logged in users
  const dummyProducts = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => ({
      id: `dummy-${i + 1}`,
      oem: ["Apple", "Samsung", "Google"][i % 3],
      model: ["iPhone 15 Pro", "Galaxy S24", "Pixel 8"][i % 3],
      modelFull: ["Apple iPhone 15 Pro", "Samsung Galaxy S24", "Google Pixel 8"][i % 3],
      memory: ["128GB", "256GB", "512GB"][i % 3],
      carrier: ["Unlocked", "AT&T", "Verizon"][i % 3],
      units: Math.floor(Math.random() * 100) + 10,
      grade: ["A", "A+", "B"][i % 3],
      color: ["Black", "White", "Blue"][i % 3],
      cityState: "New York, NY",
      currentBid: `$${(Math.random() * 500 + 200).toFixed(2)}`,
      unitPrice: `$${(Math.random() * 1000 + 500).toFixed(2)}`,
      bids: Math.floor(Math.random() * 20),
      timer: `${Math.floor(Math.random() * 48)}h ${Math.floor(Math.random() * 60)}m`,
      expiryTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      imageUrl: "https://via.placeholder.com/400x300.png?text=Product",
      highestBidder: null,
      minNextBid: null,
      currentPrice: null,
      myMaxBid: "-",
    }));
  }, []);

  const handleLoginClick = () => {
    const hashPath = window.location.hash?.slice(1) || '/home';
    const returnTo = encodeURIComponent(hashPath);
    navigate(`/login?returnTo=${returnTo}`);
  };

  if (selectedProduct) {
    return (
      <BiddingProductDetails
        product={selectedProduct}
        onBack={handleBackToList}
      />
    );
  }

  // Show blurred dummy data with login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <>
        <div className="relative h-[calc(100vh-200px)] overflow-hidden">
          {/* Blurred Background Content */}
          <div className="blur-md pointer-events-none select-none h-full">
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Sidebar Filters - Desktop */}
              <aside className="lg:w-72 hidden lg:block">
                <div className="bg-white rounded-lg shadow-md p-4 h-full overflow-hidden">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* View Controls */}
                <div className="mb-4 p-4 bg-white rounded-lg shadow-md flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/6"></div>
                  </div>
                </div>

                {/* Grid View */}
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-y-auto flex-1 pr-2">
                    {dummyProducts.slice(0, 6).map((product) => (
                      <div key={product.id} className="bg-white rounded-lg shadow-md p-4">
                        <div className="h-32 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="hidden md:block bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden flex-1">
                    <div className="w-full h-full overflow-auto">
                      <table className="w-full border border-gray-200">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600">BRAND</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600">MODEL</th>
                            <th className="px-4 py-4 text-right text-xs font-semibold text-gray-600">PRICE</th>
                            <th className="px-4 py-4 text-right text-xs font-semibold text-gray-600">CUR. BID</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600">NEXT MIN BID</th>
                            <th className="px-5 py-4 text-center text-xs font-semibold text-gray-600">BID NOW</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dummyProducts.slice(0, 3).map((product) => (
                            <tr key={product.id} className="border-b border-gray-100">
                              <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                              <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                              <td className="px-4 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                              <td className="px-4 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                              <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                              <td className="px-5 py-4 text-center"><div className="h-8 bg-gray-200 rounded w-20 mx-auto"></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>

          {/* Login Prompt Overlay - Centered */}
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div 
              onClick={handleLoginClick}
              className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 max-w-md w-full mx-4 cursor-pointer transform transition-all hover:scale-105 hover:shadow-3xl"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  Login Required
                </h2>
                <p className="text-gray-600 mb-6 text-base md:text-lg">
                  Please login to access the bidding platform and start placing bids on exclusive deals.
                </p>
                <button
                  onClick={handleLoginClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-base md:text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Login to Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Filters Overlay */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-opacity-30 backdrop-blur-[1.5px] cursor-pointer"
              onClick={() => setShowMobileFilters(false)}
            ></div>
            <div className="absolute left-0 top-28 bottom-0 w-72 bg-white z-[60] overflow-y-auto">
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
        <main className="flex-1 flex flex-col min-h-0">
          {/* View Controls */}
          <ViewControls
            viewMode={viewMode}
            setViewMode={setViewMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOption={sortOption}
            setSortOption={setSortOption}
            setCurrentPage={setCurrentPage}
            onFiltersClick={() => setShowMobileFilters(true)}
            filters={filters}
          />

          {/* Grid View */}
          {viewMode === "grid" ? (
            <>
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {(isLoading || !hasInitiallyLoaded) && currentProducts.length === 0 && (
                  <div className="col-span-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="h-8 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!isLoading && hasInitiallyLoaded && currentProducts.length === 0 && (
                  <div className="col-span-full text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 font-apple">No products found</h3>
                    <p className="text-sm text-gray-500 font-apple">Try adjusting your filters or search query</p>
                  </div>
                )}
                {currentProducts.map((product, index) => (
                  <div key={product.id} className="animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
                    <BiddingProductCard
                      product={product}
                      viewMode={viewMode}
                      onOpenBiddingForm={handleOpenBiddingForm}
                      renderBidValue={renderBidValue}
                      onBidSuccess={handleRefresh}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors font-apple ${currentPage === 1
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
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-apple ${currentPage === number
                              ? "bg-[#0071E0] text-white"
                              : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                          {number}
                        </button>
                      )
                    )}
                  </div>

                  <div className="md:hidden text-sm text-gray-700 font-apple">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors font-apple ${currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    Next
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                </div>
              )}
              
              {/* Mobile Card View - Shown on mobile devices when in list mode */}
              <div className="md:hidden mb-6">
                {(isLoading || !hasInitiallyLoaded) && currentProducts.length === 0 && (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="h-8 bg-gray-200 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                )}
                {!isLoading && hasInitiallyLoaded && currentProducts.length === 0 && (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 font-apple">No products found</h3>
                    <p className="text-sm text-gray-500 font-apple">Try adjusting your filters or search query</p>
                  </div>
                )}
                {currentProducts.map((product, index) => (
                  <div key={product.id} className="animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
                    <BiddingProductCard
                      product={product}
                      viewMode="mobile"
                      onOpenBiddingForm={handleOpenBiddingForm}
                      renderBidValue={renderBidValue}
                      onBidSuccess={handleRefresh}
                    />
                  </div>
                ))}
              </div>

              {/* Desktop Table View - Shown on medium and larger screens */}
              <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="w-full overflow-x-auto relative" style={{ overflowY: 'visible', maxHeight: 'none' }}>
                  <table className="w-full" style={{ minWidth: 'max-content' }}>
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 sticky top-0 z-10 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap border-r border-gray-200/60">
                          Brand
                        </th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest border-r border-gray-200/60">
                          Product Details
                        </th>
                        <th className="hidden md:table-cell px-3 py-2.5 text-right text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap border-r border-gray-200/60">
                          Unit Price
                        </th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap border-r border-gray-200/60">
                          Current Bid
                        </th>
                        <th className="hidden lg:table-cell px-4 py-2.5 text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap border-r border-gray-200/60">
                          Your Bid
                        </th>
                        <th className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {(isLoading || !hasInitiallyLoaded) && currentProducts.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12"
                          >
                            <div className="space-y-3">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="flex items-center space-x-4 animate-pulse">
                                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      {!isLoading && hasInitiallyLoaded && currentProducts.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-16 text-center"
                          >
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 font-apple">No products found</h3>
                            <p className="text-sm text-gray-500 font-apple">Try adjusting your filters or search query</p>
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
                        onBidSuccess={handleRefresh}
                          index={index}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors font-apple ${currentPage === 1
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
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors font-apple ${currentPage === number
                              ? "bg-[#0071E0] text-white"
                              : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                          {number}
                        </button>
                      )
                    )}
                  </div>

                  <div className="md:hidden text-sm text-gray-700 font-apple">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors font-apple ${currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    Next
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                  </button>
                </div>
              )}
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
