import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductService } from "../../services/products/products.services";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faHeart,
  faBell,
  faShoppingCart,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import ProductCard from "../ReadyStockPage/ProductCard";
import AddToCartPopup from "../ReadyStockPage/AddToCartPopup";
import CartService from "../../services/cart/cart.services";
import iphoneImage from "../../assets/iphone.png";
import Swal from "sweetalert2";

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
    return `${baseClasses} bg-green-100 text-green-700`;
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (product.isOutOfStock || product.isExpired) return;

    try {
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
        return navigate("/signin");
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
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[80vh] flex flex-col relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faHeart} className="text-xl text-red-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                My Wishlist
              </h2>
              <p className="text-sm text-gray-600">
                {totalProductsCount}{" "}
                {totalProductsCount === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 p-2"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
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
                <FontAwesomeIcon
                  icon={faHeart}
                  className="text-4xl text-gray-300 mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Your wishlist is empty
                </h3>
                <p className="text-gray-500">
                  Start adding products to keep track of them!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={
                            imageErrors[product.id]
                              ? iphoneImage
                              : product.imageUrl
                          }
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-100"
                          onError={() => handleImageError(product.id)}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          {/* 👆 aa jagya e items-center add karyu */}

                          {/* Product Details */}
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>MOQ: {product.moq} units</span>
                              <span
                                className={getStockBadge(
                                  product.stockStatus,
                                  product.stockCount
                                )}
                              >
                                {product.stockStatus}
                                {product.stockCount > 0 &&
                                  ` (${product.stockCount})`}
                              </span>
                              {product.isExpired && (
                                <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                                  Expired
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price & Buttons - Center Aligned */}
                          <div className="flex items-center gap-4 ml-4">
                            <div className="text-xl font-semibold text-gray-900">
                              ${product.price}
                            </div>

                            {product.notify && (
                              <button className="px-3 py-2 text-sm border cursor-pointer border-orange-300 text-orange-700 bg-orange-50 rounded hover:bg-orange-100 transition-colors flex items-center gap-2">
                                <FontAwesomeIcon icon={faBell} />
                                Notify
                              </button>
                            )}
                            {!product.isOutOfStock && !product.isExpired && (
                              <button className="px-3 py-2 text-sm bg-[#0071E0] cursor-pointer text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2" onClick={(e) => handleAddToCart(e, product)}>
                                <FontAwesomeIcon icon={faShoppingCart} />
                                Add to Cart
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleWishlistChange(product.id, false)
                              }
                              className="p-2 text-red-500 hover:text-red-700 cursor-pointer rounded transition-colors"
                              title="Remove from wishlist"
                            >
                              <FontAwesomeIcon icon={faHeart} />
                            </button>
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
          <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded ${
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
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded ${
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
