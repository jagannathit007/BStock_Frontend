import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductService } from "../../services/products/products.services";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faClock,
  faBell,
  faShoppingCart,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import ProductCard from "../ReadyStockPage/ProductCard";
import AddToCartPopup from "../ReadyStockPage/AddToCartPopup";
import CartService from "../../services/cart/cart.services";
import iphoneImage from "../../assets/iphone.png";
import Swal from "sweetalert2";
import { convertPrice } from "../../utils/currencyUtils";

const WishlistModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [isAddToCartPopupOpen, setIsAddToCartPopupOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleImageError = (productId) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };
  const itemsPerPage = 10;
  const totalPages = Math.max(Math.ceil(totalProductsCount / itemsPerPage), 1);

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
      isFavorite: true, // Always true in wishlist
      isOutOfStock: stock <= 0,
      isExpired,
      expiryTime,
      notify: Boolean(p.notify),
    };
  };

  const fetchWishlist = async (page) => {
    setIsLoading(true);
    try {
      const data = await ProductService.getWishlist(page, itemsPerPage);
      const wishlistDocs = data.docs || [];
      const allProducts = wishlistDocs.flatMap((doc) => doc.productIds || []);
      const populatedProducts = await Promise.all(
        allProducts.map((p) => ProductService.getProductById(p._id))
      );
      const mapped = populatedProducts.map(mapApiProductToUi);
      setProducts(mapped);
      setTotalProductsCount(data.totalDocs ? allProducts.length : 0);
    } catch (e) {
      console.error("Fetch wishlist error:", e);
      setProducts([]);
      setTotalProductsCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      fetchWishlist(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && currentPage > 1) {
      fetchWishlist(currentPage);
    }
  }, [currentPage]);

  // Listen for wishlist updates from other components
  useEffect(() => {
    const handleWishlistUpdate = (event) => {
      if (isOpen) {
        // If a product was removed from wishlist, remove it from the current view
        if (event.detail && !event.detail.isWishlisted) {
          setProducts((prev) =>
            prev.filter((p) => p.id !== event.detail.productId)
          );
          setTotalProductsCount((prev) => Math.max(0, prev - 1));
        } else {
          // If a product was added to wishlist, refresh the current page
          fetchWishlist(currentPage);
        }
      }
    };

    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, [isOpen, currentPage]);

  const handleWishlistChange = async (productId, newStatus) => {
    if (!newStatus) {
      try {
        // Optimistic update - remove from UI immediately
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setTotalProductsCount((prev) => Math.max(0, prev - 1));

        await ProductService.toggleWishlist({
          productId,
          wishlist: false,
        });
      } catch (error) {
        console.error("Failed to remove from wishlist:", error);
        // Revert optimistic update on error
        fetchWishlist(currentPage);
      }
    }
  };

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const getStockBadge = (status, count) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full font-medium";
    if (status === "Out of Stock") {
      return `${baseClasses} bg-red-100 text-red-700`;
    }
    if (status === "Low Stock") {
      return `${baseClasses} bg-orange-100 text-orange-700`;
    }
    return `${baseClasses} bg-green-50 text-green-600`;
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (product.isOutOfStock || product.isExpired) return;

    try {
      // Redirect unauthenticated users to login before any business checks
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (!isLoggedIn) {
        const hashPath = window.location.hash?.slice(1) || '/home';
        const returnTo = encodeURIComponent(hashPath);
        return navigate(`/login?returnTo=${returnTo}`);
      }
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const { businessProfile } = user;

      if (
        !businessProfile?.businessName ||
        businessProfile.businessName.trim() === ""
      ) {
        const confirm = await Swal.fire({
          icon: "warning",
          title: "Business Details Required",
          text: "Please add your business details before adding products to the cart.",
          confirmButtonText: "Go to Settings",
          confirmButtonColor: "#0071E0",
        });
        if (confirm.isConfirmed) navigate("/profile?tab=business");

        return;
      }

      if (
        businessProfile?.status === "pending" ||
        businessProfile?.status === "rejected"
      ) {
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
        return navigate(`/login?returnTo=${returnTo}`);
      }
      setSelectedProduct(product);
      setIsAddToCartPopupOpen(true);
    } catch (error) {
      console.error("Error in add to cart:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while adding to cart. Please try again.",
        confirmButtonText: "OK",
        confirmButtonColor: "#0071E0",
      });
    }
  };

  const handlePopupClose = async () => {
    setIsAddToCartPopupOpen(false);
    setSelectedProduct(null);
    try {
      const count = await CartService.count();
      console.log(`Cart count updated: ${count}`);
    } catch (error) {
      console.error("Refresh cart count error:", error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => !isAddToCartPopupOpen && onClose(e)}>
        <div className="bg-white rounded-2xl sm:rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[85vh] flex flex-col relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="currentColor" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 tracking-tight">
                Watch list
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                {totalProductsCount}{" "}
                {totalProductsCount === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 group"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm text-gray-600 group-hover:text-gray-800" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading wishlist...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                  <svg
                    className="w-10 h-10 text-gray-300 mb-4 mx-auto"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Your watch list is empty
                </h3>
                <p className="text-gray-500">
                  Start adding products to keep track of them!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-8">
              <div className="space-y-3 sm:space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group"
                  >
                    {/* Mobile Layout */}
                    <div className="block sm:hidden">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <img
                              src={
                                imageErrors[product.id]
                                  ? iphoneImage
                                  : product.imageUrl
                              }
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-100 group-hover:scale-105 transition-transform duration-300"
                              onError={() => handleImageError(product.id)}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                              {product.description}
                            </p>
                          )}
                          <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {convertPrice(product.price)}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleWishlistChange(product.id, false)
                          }
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center"
                          title="Remove from wishlist"
                        >
                          <svg className="w-3 h-3" fill="currentColor" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>MOQ: {product.moq}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>Stock: {product.stockCount}</span>
                        </div>
                        <span
                          className={getStockBadge(
                            product.stockStatus,
                            product.stockCount
                          )}
                        >
                          {product.stockStatus}
                        </span>
                        {product.isExpired && (
                          <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!product.isOutOfStock && !product.isExpired && (
                          <button 
                            className="flex-1 px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                            onClick={(e) => handleAddToCart(e, product)}
                          >
                            <FontAwesomeIcon icon={faShoppingCart} className="text-xs" />
                            Add to Cart
                          </button>
                        )}
                        {product.notify && (
                          <button className="px-3 py-2 text-sm border cursor-pointer border-orange-300 text-orange-700 bg-orange-50 rounded hover:bg-orange-100 transition-colors flex items-center gap-2">
                            <FontAwesomeIcon icon={faBell} />
                            Notify
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <img
                              src={
                                imageErrors[product.id]
                                  ? iphoneImage
                                  : product.imageUrl
                              }
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded-xl border border-gray-100 group-hover:scale-105 transition-transform duration-300"
                              onError={() => handleImageError(product.id)}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {product.name}
                              </h3>
                              {product.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                  <span>MOQ: {product.moq}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                  <span>Stock: {product.stockCount}</span>
                                </div>
                                <span
                                  className={getStockBadge(
                                    product.stockStatus,
                                    product.stockCount
                                  )}
                                >
                                  {product.stockStatus}
                                </span>
                                {product.isExpired && (
                                  <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                                    Expired
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-4 ml-6">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {convertPrice(product.price)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">per unit</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!product.isOutOfStock && !product.isExpired && (
                                  <button 
                                    className="px-6 py-2 text-sm font-semibold bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                                    onClick={(e) => handleAddToCart(e, product)}
                                  >
                                    <FontAwesomeIcon icon={faShoppingCart} className="text-xs" />
                                    Add to Cart
                                  </button>
                                )}
                                {product.notify && (
                                  <button className="px-3 py-2 text-sm border cursor-pointer border-orange-300 text-orange-700 bg-orange-50 rounded hover:bg-orange-100 transition-colors flex items-center gap-2">
                                    <FontAwesomeIcon icon={faBell} />
                                    Notify
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleWishlistChange(product.id, false)
                                  }
                                  className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center group/remove"
                                  title="Remove from wishlist"
                                >
                                  <svg className="w-4 h-4 group-hover/remove:scale-110 transition-transform" fill="currentColor" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {products.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-200 bg-white px-4 sm:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg ${
                currentPage === 1
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Previous
            </button>

            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg ${
                currentPage === totalPages
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
        </div>
      </div>
      {isAddToCartPopupOpen && selectedProduct && (
        <AddToCartPopup product={selectedProduct} onClose={handlePopupClose} />
      )}
    </>
  );
};

export default WishlistModal;
