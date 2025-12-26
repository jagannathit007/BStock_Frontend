import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import SideFilter from "../SideFilter";
import ViewControls from "./ViewControls";
import BiddingForm from "../negotiation/BiddingForm"; // Import BiddingForm
import BulkAddToCartModal from "./BulkAddToCartModal"; // Import BulkAddToCartModal
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/auth/auth.services";
import { useCurrency } from "../../context/CurrencyContext";
import { getSubSkuFamily, getProductName, getProductCode, getProductImages, getProductVideos, getSubSkuFamilyId } from "../../utils/productUtils";
// import HeroSlider from "./HeroSlider";

const MainContent = () => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Initialize viewMode from localStorage if available
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = localStorage.getItem("preferredViewMode");
    return savedViewMode === "grid" || savedViewMode === "list" || savedViewMode === "table" 
      ? savedViewMode 
      : "grid";
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate itemsPerPage based on viewMode using useMemo to prevent unnecessary re-renders
  const itemsPerPage = useMemo(() => {
    if (viewMode === "grid") return 12;
    if (viewMode === "list") return 10;
    if (viewMode === "table") return 15;
    return 12;
  }, [viewMode]);
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({});
  const [refreshTick, setRefreshTick] = useState(false);
  const [isBiddingFormOpen, setIsBiddingFormOpen] = useState(false); // State for BiddingForm
  const [selectedProduct, setSelectedProduct] = useState(null); // Track selected product for bidding
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [selectedGroupCode, setSelectedGroupCode] = useState(null); // Filter by groupCode
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false); // Bulk add modal state
  const [groupProducts, setGroupProducts] = useState([]); // Products in the selected group
  const { selectedCurrency } = useCurrency();
  const previousViewModeRef = useRef(viewMode);
  const previousItemsPerPageRef = useRef(itemsPerPage);
  const isViewModeChangingRef = useRef(false);
  const isInitialMountRef = useRef(true);
  
  // Initialize refs on mount
  useEffect(() => {
    previousViewModeRef.current = viewMode;
    previousItemsPerPageRef.current = itemsPerPage;
    // Mark initial mount as complete after first render
    setTimeout(() => {
      isInitialMountRef.current = false;
    }, 0);
  }, []); // Only run on mount

  const navigate = useNavigate();
  const mapApiProductToUi = (p) => {
    const id = p._id || p.id || "";
    const subSkuFamily = getSubSkuFamily(p);
    const skuFamily = p.skuFamilyId && typeof p.skuFamilyId === 'object' ? p.skuFamilyId : null;
    
    const productImages = getProductImages(p);
    // Use first product image, or subSkuFamily first image, or skuFamily first image, or dummy image
    const imageUrl = productImages.length > 0 
      ? productImages[0] 
      : "https://via.placeholder.com/400x300.png?text=Product";
    
    const storage = p.storage || "";
    const color = p.color || "";
    const ram = p.ram || "";
    const condition = p.condition || "";
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
    const customerListingNumber = p?.customerListingNumber;
    return {
      id,
      name: getProductName(p),
      description: subSkuFamily?.subName || skuFamily?.description || description,
      // expose raw specs for card overlay
      storage,
      color,
      ram,
      condition,
      simType: p.simType || "",
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
      isShowTimer: Boolean(p.isShowTimer),
      notify: Boolean(p.notify),
      purchaseType: p.purchaseType || null,
      // Include related products data for variant selection
      relatedProducts: p.relatedProducts || [],
      // Additional fields for list view display
      sku: getProductCode(p) || p.sku || "",
      modelCode: getProductName(p),
      countryName: p.country || subSkuFamily?.country || (Array.isArray(skuFamily?.country) ? skuFamily.country[0] : ""),
      // Preserve subSkuFamilyId for cart operations (as string ID)
      subSkuFamilyId: getSubSkuFamilyId(p),
      // Preserve full product object for reference
      _product: p,
      // Include groupCode if available
      groupCode: p.groupCode || null,
      customerListingNumber:customerListingNumber,
      // Include videos for product details
      videos: getProductVideos(p),
    };
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      // Don't skip fetch on initial mount
      if (isInitialMountRef.current) {
        // Update refs for initial mount
        previousViewModeRef.current = viewMode;
        previousItemsPerPageRef.current = itemsPerPage;
        // Proceed with fetch
      } else {
        // Check if this fetch is triggered by a viewMode change (after initial mount)
        const viewModeChanged = previousViewModeRef.current !== viewMode;
        const itemsPerPageChanged = previousItemsPerPageRef.current !== itemsPerPage;
        
        // If viewMode changed and itemsPerPage also changed, this is the first fetch from viewMode change
        // Skip it and let the viewMode useEffect handle the fetch
        if (viewModeChanged && itemsPerPageChanged) {
          // Update refs to prevent this check from passing again
          previousViewModeRef.current = viewMode;
          previousItemsPerPageRef.current = itemsPerPage;
          isViewModeChangingRef.current = true;
          return;
        }
        
        // Update refs for normal operation
        previousViewModeRef.current = viewMode;
        previousItemsPerPageRef.current = itemsPerPage;
        isViewModeChangingRef.current = false;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setFetchedProducts([]); // Clear products while loading
      setTotalProductsCount(0); // Clear count while loading
      try {
        const baseUrl =
          import.meta.env.VITE_BASE_URL || "http://localhost:3200";
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const custId = user?._id || null;
        const response = await axios.post(
          `${baseUrl}/api/customer/get-product-list`,
          {
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery,
            sort: getSortObject(sortOption),
            custId: custId,
            groupCode: selectedGroupCode,
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
          console.log(mapped);
          setFetchedProducts(mapped);
          setTotalProductsCount(totalDocs);
        } else {
          setErrorMessage("Failed to fetch products.");
          setFetchedProducts([]);
          setTotalProductsCount(0);
        }
      } catch (e) {
        if (!axios.isCancel(e)) {
          setFetchedProducts([]);
          setTotalProductsCount(0);
          console.error("Fetch products error:", e);
        }
      } finally {
        setIsLoading(false);
        setHasInitiallyLoaded(true);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [currentPage, itemsPerPage, filters, refreshTick, searchQuery, sortOption, selectedGroupCode]);

  // Reset to page 1 when view mode changes and trigger fetch
  useEffect(() => {
    if (previousViewModeRef.current !== viewMode) {
      // Mark that we're changing view mode
      isViewModeChangingRef.current = true;
      
      if (currentPage !== 1) {
        // Setting currentPage to 1 will trigger the fetch
        // The fetch useEffect will handle it properly
        setCurrentPage(1);
      } else {
        // If already on page 1, trigger fetch via refreshTick
        // Use a small delay to ensure the skipped fetch has been processed
        setTimeout(() => {
          isViewModeChangingRef.current = false;
          setRefreshTick(prev => !prev);
        }, 10);
      }
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch currency rates on component mount (for non-logged-in users)
  useEffect(() => {
    const fetchCurrencyRates = async () => {
      // Check if currency rates already exist in localStorage
      const existingRates = localStorage.getItem('currencyRates');
      if (!existingRates) {
        // Fetch currency rates if not logged in or if rates don't exist
        try {
          await AuthService.getPublicCurrencyRates();
        } catch (error) {
          console.error('Failed to fetch currency rates:', error);
        }
      }
    };
    fetchCurrencyRates();
  }, []);

  // Listen for wishlist updates from other components
  useEffect(() => {
    const handleWishlistUpdate = (event) => {
      if (event.detail && event.detail.productId) {
        // Update the specific product in the list
        setFetchedProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === event.detail.productId ||
            product._id === event.detail.productId
              ? { ...product, isFavorite: event.detail.isWishlisted }
              : product
          )
        );
      } else {
        // Fallback: refresh all products if no specific productId
        setRefreshTick((prev) => !prev);
      }
    };
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);


  const handleRefresh = () => {
    setRefreshTick((prev) => !prev);
  };

  // Handle opening BiddingForm
  const handleOpenBiddingForm = async (product) => {
    try {
      // If not logged in, store intention and redirect to login
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (!isLoggedIn) {
        try { localStorage.setItem('postLoginAction', JSON.stringify({ type: 'make_offer', productId: product.id || product._id })); } catch {}
        const hashPath = window.location.hash?.slice(1) || '/home';
        const returnTo = encodeURIComponent(hashPath);
        window.location.href = `/#/login?returnTo=${returnTo}`;
        return;
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const { businessProfile } = user;

      if (!businessProfile?.businessName || businessProfile.businessName.trim() === "") {
        
        const confirm = await Swal.fire({
          icon: "warning",
          title: "Business Details Required",
          text: "Please add your business details before making an offer.",
          confirmButtonText: "Go to Settings",
          confirmButtonColor: "#0071E0",
        });
        if(confirm.isConfirmed) navigate("/profile?tab=business");

        return;
      }

      if (businessProfile?.status === "pending" ||
        businessProfile?.status === "rejected") {
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
        const hashPath = window.location.hash?.slice(1) || "/home";
        const returnTo = encodeURIComponent(hashPath);
        window.location.href = `/#/login?returnTo=${returnTo}`;
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

  // Derived collections and pagination helpers (declare BEFORE effects that use them)
  const totalPages = useMemo(
    () => Math.max(Math.ceil(totalProductsCount / itemsPerPage), 1),
    [totalProductsCount, itemsPerPage]
  );
  const currentProducts = useMemo(() => fetchedProducts, [fetchedProducts]);
  const indexOfFirstProduct = useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );
  const indexOfLastProduct = useMemo(
    () => Math.min(currentPage * itemsPerPage, totalProductsCount),
    [currentPage, itemsPerPage, totalProductsCount]
  );
  const showingProducts = useMemo(() => {
    if (totalProductsCount === 0) return "0-0";
    const start = Math.min(indexOfFirstProduct + 1, totalProductsCount);
    const end = Math.min(indexOfLastProduct, totalProductsCount);
    return `${start}-${end}`;
  }, [indexOfFirstProduct, indexOfLastProduct, totalProductsCount]);

  // After login, auto-open requested action captured pre-login
  useEffect(() => {
    try {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const raw = localStorage.getItem('postLoginAction');
      if (!isLoggedIn || !raw) return;
      const { type, productId } = JSON.parse(raw);
      if (type === 'make_offer' && productId) {
        const product = currentProducts.find(p => (p.id || p._id) === productId);
        if (product) {
          setSelectedProduct(product);
          setIsBiddingFormOpen(true);
          localStorage.removeItem('postLoginAction');
        }
      }
      if (type === 'add_to_cart' && productId) {
        // We can't auto-open the AddToCartPopup here reliably for cards not mounted yet.
        // Instead, just clear the intent; the user can click again after returning.
        localStorage.removeItem('postLoginAction');
      }
    } catch {}
  }, [currentProducts]);

  const handleWishlistChange = (productId, newStatus) => {
    // Update local state immediately
    setFetchedProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId || product._id === productId
          ? { ...product, isFavorite: newStatus }
          : product
      )
    );
  };

  // Handle groupCode filter - when clicking on a product with groupCode
  const handleGroupCodeFilter = async (groupCode, product) => {
    if (!groupCode) return;
    
    setSelectedGroupCode(groupCode);
    setCurrentPage(1);
    
    // Fetch all products with this groupCode for bulk add modal
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const custId = user?._id || null;
      
      const response = await axios.post(
        `${baseUrl}/api/customer/get-product-list`,
        {
          page: 1,
          limit: 100, // Get all products in the group
          groupCode: groupCode,
          custId: custId,
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

      if (response.data.status === 200) {
        const payload = response.data.data;
        const docs = payload?.docs || [];
        const mapped = docs.map(mapApiProductToUi);
        setGroupProducts(mapped);
        setIsBulkAddModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching group products:", error);
    }
  };

  // Clear groupCode filter
  const handleClearGroupCodeFilter = () => {
    setSelectedGroupCode(null);
    setCurrentPage(1);
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

  const getSortObject = (option) => {
    switch (option) {
      case 'price_asc':
        return { price: 1 };
      case 'price_desc':
        return { price: -1 };
      case 'newest':
        return { createdAt: -1 };
      default:
        return {};
    }
  };

  // (moved derived helpers above)

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      {/* hero section */}
      {/* <HeroSlider/> */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto">
        {showMobileFilters && (
          <div className="fixed inset-0 z-[99] lg:hidden">
            <div
              className="absolute inset-0 bg-opacity-30 backdrop-blur-[1.5px]"
              onClick={() => setShowMobileFilters(false)}
            ></div>
            <div className="absolute left-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto shadow-2xl">
              <SideFilter
                key="mobile-filter"
                onClose={() => setShowMobileFilters(false)}
                onFilterChange={handleFilterChange}
                currentFilters={filters}
              />
            </div>
          </div>
        )}

        <aside className="hidden lg:block lg:w-72">
          <SideFilter 
            onFilterChange={handleFilterChange} 
            currentFilters={filters}
          />
        </aside>

        <div className="flex-1 min-w-0">
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Group Code Filter Badge */}
          {selectedGroupCode && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-gray-700">Filtered by Group:</span>
              <span className="text-sm font-semibold text-blue-700">{selectedGroupCode}</span>
              <button
                onClick={handleClearGroupCodeFilter}
                className="ml-auto text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear Filter
              </button>
            </div>
          )}

          <ViewControls
            viewMode={viewMode}
            setViewMode={setViewMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOption={sortOption}
            setSortOption={setSortOption}
            setCurrentPage={setCurrentPage}
            onFilterClick={() => setShowMobileFilters(true)}
          />

          {viewMode === "table" ? (
            <>
              {/* Currency Reference Message - Small */}
              {(selectedCurrency === 'AED' || selectedCurrency === 'HKD') && (
                <div className="mb-3 px-3 py-2 bg-blue-50 border-l-4 border-blue-400 rounded text-xs text-blue-700">
                  <span className="font-medium">Note:</span> Prices shown are for view reference only. Actual transactions are processed in USD only.
                </div>
              )}
              <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">MOQ / Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Condition</th>
                      {/* <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Warehouse</th> */}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <>
                        {Array.from({ length: itemsPerPage }).map((_, index) => (
                          <ProductCardSkeleton key={`skeleton-${index}`} viewMode="table" delay={index * 25} />
                        ))}
                      </>
                    ) : !isLoading && hasInitiallyLoaded && currentProducts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-16 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                          <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
                        </td>
                      </tr>
                    ) : (
                      currentProducts.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          viewMode="table"
                          onRefresh={handleRefresh}
                          onWishlistChange={handleWishlistChange}
                          onOpenBiddingForm={handleOpenBiddingForm}
                          onGroupCodeClick={handleGroupCodeFilter}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="text-sm text-gray-600 mt-4 mb-2">
                  Showing {showingProducts} of {totalProductsCount} products
                </div>
              )}
              {totalPages > 1 && (
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
              )}
            </>
          ) : viewMode === "grid" ? (
            <>
              {/* Currency Reference Message - Small */}
              {(selectedCurrency === 'AED' || selectedCurrency === 'HKD') && (
                <div className="mb-3 px-3 py-2 bg-red-50 border-l-4 border-red-400 rounded text-xs text-red-700">
                  <span className="font-medium">Note:</span> Prices shown are for view reference only. Actual transactions are processed in USD only.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-4 md:gap-6">
                {isLoading ? (
                  <>
                    {Array.from({ length: itemsPerPage }).map((_, index) => (
                      <div 
                        key={`skeleton-${index}`}
                        style={{
                          animationName: "fadeInUp",
                          animationDuration: "0.5s",
                          animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                          animationFillMode: "forwards",
                          animationDelay: `${index * 40}ms`,
                          opacity: 0,
                        }}
                      >
                        <ProductCardSkeleton viewMode="grid" delay={index * 25} />
                      </div>
                    ))}
                  </>
                ) : !isLoading && hasInitiallyLoaded && currentProducts.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
                  </div>
                ) : (
                  currentProducts.map((product, index) => (
                    <div 
                      key={product.id}
                      style={{
                        animationName: "productFadeIn",
                        animationDuration: "0.6s",
                        animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                        animationFillMode: "forwards",
                        animationDelay: `${index * 40}ms`,
                        opacity: 0,
                      }}
                    >
                      <ProductCard
                        product={product}
                        viewMode={viewMode}
                        onRefresh={handleRefresh}
                        onOpenBiddingForm={handleOpenBiddingForm} // Pass handler
                        onWishlistChange={handleWishlistChange}
                        onGroupCodeClick={handleGroupCodeFilter}
                      />
                    </div>
                  ))
                )}
              </div>
              {totalPages > 1 && (
                <div className="text-sm text-gray-600 mt-4 mb-2">
                  Showing {showingProducts} of {totalProductsCount} products
                </div>
              )}
              {totalPages > 1 && (
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
              )}
            </>
          ) : (
            <>
              {/* Currency Reference Message - Small */}
              {(selectedCurrency === 'AED' || selectedCurrency === 'HKD') && (
                <div className="mb-3 px-3 py-2 bg-blue-50 border-l-4 border-blue-400 rounded text-xs text-blue-700">
                  <span className="font-medium">Note:</span> Prices shown are for view reference only. Actual transactions are processed in USD only.
                </div>
              )}
              <div className="flex flex-col gap-4">
                {isLoading ? (
                  <>
                    {Array.from({ length: itemsPerPage }).map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        style={{
                          animationName: "fadeInUp",
                          animationDuration: "0.5s",
                          animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                          animationFillMode: "forwards",
                          animationDelay: `${index * 40}ms`,
                          opacity: 0,
                        }}
                      >
                        <ProductCardSkeleton viewMode="list" delay={index * 25} />
                      </div>
                    ))}
                  </>
                ) : !isLoading && hasInitiallyLoaded && currentProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
                  </div>
                ) : (
                  currentProducts.map((product, index) => (
                    <div 
                      key={product.id}
                      style={{
                        animationName: "productFadeIn",
                        animationDuration: "0.6s",
                        animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                        animationFillMode: "forwards",
                        animationDelay: `${index * 35}ms`,
                        opacity: 0,
                      }}
                    >
                      <ProductCard
                        product={product}
                        viewMode={viewMode}
                        onRefresh={handleRefresh}
                        onWishlistChange={handleWishlistChange}
                        onOpenBiddingForm={handleOpenBiddingForm} // Pass handler
                        onGroupCodeClick={handleGroupCodeFilter}
                      />
                    </div>
                  ))
                )}
              </div>
              {totalPages > 1 && (
                <div className="text-sm text-gray-600 mt-4 mb-2">
                  Showing {showingProducts} of {totalProductsCount} products
                </div>
              )}
              {totalPages > 1 && (
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
              )}
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

      {isBulkAddModalOpen && groupProducts.length > 0 && (
        <BulkAddToCartModal
          products={groupProducts}
          groupCode={selectedGroupCode}
          totalMoq={groupProducts[0]?._product?.totalMoq || groupProducts[0]?.totalMoq || null}
          onClose={() => setIsBulkAddModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default MainContent;