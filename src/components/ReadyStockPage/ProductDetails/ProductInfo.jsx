import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faBolt,
  faCalendarXmark,
  faHandshake,
  faBell,
  faBellSlash,
  faMicrochip,
  faHdd,
  faPalette,
  faShield,
  faGlobe,
  faTag,
  faSimCard,
  faWifi,
  faBarcode,
  faTruck,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faDatabase,
  faCircleDot,
  faMinus,
  faPlus,
  faClock,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { ProductService } from "../../../services/products/products.services";
import { AuthService } from "../../../services/auth/auth.services";
import OrderService from "../../../services/order/order.services";
import NotifyMePopup from "../NotifyMePopup";
import BiddingForm from "../../negotiation/BiddingForm";
import AddToCartPopup from "../AddToCartPopup";
import iphoneImage from "../../../assets/iphone.png";
import Swal from "sweetalert2";
import { convertPrice, getCurrencyRates, formatPriceForCurrency } from "../../../utils/currencyUtils";
import { useCurrency } from "../../../context/CurrencyContext";
import { PRIMARY_COLOR, PRIMARY_COLOR_LIGHT, PRIMARY_COLOR_DARK } from "../../../utils/colors";
import 'flag-icons/css/flag-icons.min.css';

const ProductInfo = ({ product: initialProduct, navigate, onRefresh }) => {
  const { customerCountryCurrency } = useCurrency();
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(initialProduct.moq || 5);
  const [isAddToCartPopupOpen, setIsAddToCartPopupOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [thumbErrors, setThumbErrors] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unavailableVariant, setUnavailableVariant] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState({
    color: initialProduct?.color || "",
    ram: initialProduct?.ram || "",
    storage: initialProduct?.storage || "",
    simType: initialProduct?.simType || "",
  });
  const [isVariantChanging, setIsVariantChanging] = useState(false);
  const [variantOptions, setVariantOptions] = useState({
    colors: [],
    rams: [],
    storages: [],
    simTypes: [],
  });
  const [currencyUpdateKey, setCurrencyUpdateKey] = useState(0);
  const [selectedCountryRate, setSelectedCountryRate] = useState('AED');
  const [isCountryRateDropdownOpen, setIsCountryRateDropdownOpen] = useState(false);

  // Listen for currency changes to force re-render
  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrencyUpdateKey(prev => prev + 1);
    };
    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCountryRateDropdownOpen && !event.target.closest('.country-rate-dropdown')) {
        setIsCountryRateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCountryRateDropdownOpen]);

  const handleImageError = () => {
    setImageError(true);
  };

  const getProductImages = () => {
    const images = [];
    const toAbsolute = (path) => {
      if (!path) return "";
      if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) return path;
      const base = import.meta.env.VITE_BASE_URL || "";
      if (!base) return path;
      return `${base}/${String(path).replace(/^\/+/, "")}`;
    };

    if (currentProduct.mainImage) {
      const abs = toAbsolute(currentProduct.mainImage);
      if (abs) images.push(abs);
    }

    if (
      currentProduct.skuFamilyId?.images &&
      Array.isArray(currentProduct.skuFamilyId.images)
    ) {
      currentProduct.skuFamilyId.images.forEach((img) => {
        const abs = toAbsolute(img);
        if (abs && !images.includes(abs)) images.push(abs);
      });
    }

    if (
      currentProduct.subSkuFamilyId?.images &&
      Array.isArray(currentProduct.subSkuFamilyId.images)
    ) {
      currentProduct.subSkuFamilyId.images.forEach((img) => {
        const abs = toAbsolute(img);
        if (abs && !images.includes(abs)) images.push(abs);
      });
    }

    // If no valid images, return one dummy image
    if (images.length === 0) return [iphoneImage];

    // Return only the available images (no padding)
    return images;
  };

  const productImages = getProductImages();

  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [productImages.length]);

  // Reset main image error when selected image changes
  useEffect(() => {
    setImageError(false);
  }, [selectedImageIndex]);

  const processedProduct = {
    ...currentProduct,
    name:
      currentProduct.subSkuFamilyId?.name ||
      currentProduct.skuFamilyId?.name ||
      currentProduct.name,
    brand: currentProduct.skuFamilyId?.name || currentProduct.brand,
    code: currentProduct.skuFamilyId?.code || currentProduct.code,
    description:
      currentProduct.skuFamilyId?.description || currentProduct.description,
    colorVariant: Array.isArray(currentProduct.skuFamilyId?.colorVariant)
      ? currentProduct.skuFamilyId.colorVariant.join(", ")
      : currentProduct.skuFamilyId?.colorVariant ||
        currentProduct.colorVariant ||
        "",
    networkBands: Array.isArray(currentProduct.skuFamilyId?.networkBands)
      ? currentProduct.skuFamilyId.networkBands.join(", ")
      : currentProduct.skuFamilyId?.networkBands ||
        currentProduct.networkBands ||
        "",
    stockCount: Number(currentProduct.stock || 0),
    isOutOfStock: Number(currentProduct.stock || 0) <= 0,
    isExpired: currentProduct.expiryTime
      ? new Date(currentProduct.expiryTime) < new Date()
      : false,
    stockStatus: (() => {
      const stock = Number(currentProduct.stock || 0);
      const isExpired = currentProduct.expiryTime
        ? new Date(currentProduct.expiryTime) < new Date()
        : false;
      
      // Handle stock status based on API response
      if (isExpired) return "Expired";
      if (stock === 0) return "Out of Stock";
      if (stock <= 10) return "Low Stock";
      return "In Stock";
    })(),
  };

  // Effective stock view combining real stock and unavailable variant selection
  const effectiveIsOutOfStock = processedProduct.isOutOfStock || unavailableVariant;
  const effectiveStockStatus = processedProduct.isExpired
    ? "Expired"
    : effectiveIsOutOfStock
    ? "Out of Stock"
    : processedProduct.stockStatus;
  const effectiveStockCount = effectiveIsOutOfStock ? 0 : processedProduct.stockCount;

  const [isFavorite, setIsFavorite] = useState(() => {
    const initialWishlistStatus =
      initialProduct?.WishList ||
      initialProduct?.wishList ||
      initialProduct?.isFavorite ||
      false;
    console.log("ProductInfo - Initial state setup:", {
      WishList: initialProduct?.WishList,
      wishList: initialProduct?.wishList,
      isFavorite: initialProduct?.isFavorite,
      finalStatus: initialWishlistStatus,
    });
    return initialWishlistStatus;
  });
  const [notify, setNotify] = useState(Boolean(currentProduct?.notify));
  const [isNotifyMePopupOpen, setIsNotifyMePopupOpen] = useState(false);
  const [isBiddingFormOpen, setIsBiddingFormOpen] = useState(false);
  const canNotify =
    processedProduct.isOutOfStock && !processedProduct.isExpired;

  useEffect(() => {
    const fetchFreshProductData = async () => {
      try {
        const productId = initialProduct._id || initialProduct.id;
        if (productId) {
          console.log(
            "ProductInfo - Fetching fresh product data for ID:",
            productId
          );
          const freshProduct = await ProductService.getProductById(productId);
          console.log("ProductInfo - Fresh product from API:", freshProduct);
          let productToSet = initialProduct;
          if (freshProduct && typeof freshProduct === "object") {
            productToSet = freshProduct;
          }
          setCurrentProduct(productToSet);
          setSelectedVariant({
            color: productToSet?.color || "",
            ram: productToSet?.ram || "",
            storage: productToSet?.storage || "",
            simType: productToSet?.simType || "",
          });
          setUnavailableVariant(false);

          const wishlistStatus =
            productToSet.WishList || productToSet.wishList || false;
          console.log(
            "ProductInfo - Setting wishlist status from fresh data:",
            wishlistStatus
          );
          setIsFavorite(wishlistStatus);
        } else {
          setCurrentProduct(initialProduct);
          setSelectedVariant({
            color: initialProduct?.color || "",
            ram: initialProduct?.ram || "",
            storage: initialProduct?.storage || "",
            simType: initialProduct?.simType || "",
          });
          setUnavailableVariant(false);
          const wishlistStatus =
            initialProduct.WishList ||
            initialProduct.wishList ||
            initialProduct.isFavorite ||
            false;
          console.log("ProductInfo - Using initial product data:", {
            WishList: initialProduct.WishList,
            wishList: initialProduct.wishList,
            isFavorite: initialProduct.isFavorite,
            finalWishlistStatus: wishlistStatus,
            productId: initialProduct._id || initialProduct.id,
            fullProductKeys: Object.keys(initialProduct),
          });
          setIsFavorite(wishlistStatus);
        }
      } catch (error) {
        console.error("ProductInfo - Error fetching fresh product:", error);
        setCurrentProduct(initialProduct);
        const wishlistStatus =
          initialProduct.WishList ||
          initialProduct.wishList ||
          initialProduct.isFavorite ||
          false;
        setIsFavorite(wishlistStatus);
      }
    };

    fetchFreshProductData();
  }, [initialProduct]);

  // Scroll to top when component mounts (only once)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setNotify(Boolean(currentProduct?.notify));
    const wishlistStatus =
      currentProduct.WishList ||
      currentProduct.wishList ||
      currentProduct.isFavorite ||
      false;
    console.log("ProductInfo - Current product updated:", {
      WishList: currentProduct.WishList,
      wishList: currentProduct.wishList,
      isFavorite: currentProduct.isFavorite,
      finalWishlistStatus: wishlistStatus,
      productId: currentProduct._id || currentProduct.id,
    });
    setIsFavorite(wishlistStatus);
    // Any change of the backing product should clear unavailable state and reset loading flag
    setUnavailableVariant(false);
    setIsVariantChanging(false);
  }, [currentProduct]);

  // Build variant options (Color, RAM, Storage, SIM Type) from current product and related products
  useEffect(() => {
    const pool = [];
    if (currentProduct && (currentProduct._id || currentProduct.id)) {
      pool.push({
        _id: currentProduct._id || currentProduct.id,
        color: currentProduct.color,
        ram: currentProduct.ram,
        storage: currentProduct.storage,
        simType: currentProduct.simType,
      });
    }
    if (Array.isArray(currentProduct?.relatedProducts)) {
      currentProduct.relatedProducts.forEach((p) => {
        pool.push({
          _id: p._id || p.id,
          color: p.color,
          ram: p.ram,
          storage: p.storage,
          simType: p.simType,
        });
      });
    }

    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
    
    // Colors: Only from current product, not from related products
    const currentProductColor = currentProduct?.color ? [currentProduct.color.toString()] : [];
    
    setVariantOptions({
      colors: uniq(currentProductColor),
      rams: uniq(pool.map((p) => (p.ram || "").toString())),
      storages: uniq(pool.map((p) => (p.storage || "").toString())),
      simTypes: uniq(pool.map((p) => (p.simType || "").toString())),
    });

    // Sync selected variant with current product
    setSelectedVariant({
      color: currentProduct?.color || "",
      ram: currentProduct?.ram || "",
      storage: currentProduct?.storage || "",
      simType: currentProduct?.simType || "",
    });
  }, [currentProduct]);

  const findMatchingVariant = (next) => {
    const pool = [];
    if (currentProduct && (currentProduct._id || currentProduct.id)) {
      pool.push({
        _id: currentProduct._id || currentProduct.id,
        color: currentProduct.color,
        ram: currentProduct.ram,
        storage: currentProduct.storage,
        simType: currentProduct.simType,
        stock: currentProduct.stock || 0,
        expiryTime: currentProduct.expiryTime,
      });
    }
    if (Array.isArray(currentProduct?.relatedProducts)) {
      currentProduct.relatedProducts.forEach((p) => {
        pool.push({
          _id: p._id || p.id,
          color: p.color,
          ram: p.ram,
          storage: p.storage,
          simType: p.simType,
          stock: p.stock || 0,
          expiryTime: p.expiryTime,
        });
      });
    }
    return (
      pool.find(
        (p) =>
          (next.color ? p.color === next.color : true) &&
          (next.ram ? p.ram === next.ram : true) &&
          (next.storage ? p.storage === next.storage : true) &&
          (next.simType ? p.simType === next.simType : true)
      ) || null
    );
  };

  // On hover: reflect the matching product id in the URL without full navigation
  const handleVariantHover = (key, value) => {
    const next = { ...selectedVariant, [key]: value };
    const match = findMatchingVariant(next);
    if (!match || !match._id) return;
    try {
      const { origin, pathname, search } = window.location;
      const newUrl = `${origin}${pathname}${search}#/product/${match._id}`;
      window.history.replaceState(null, "", newUrl);
    } catch {}
  };

  const handleVariantClick = async (key, value) => {
    // Prevent multiple simultaneous calls
    if (isVariantChanging) return;
    
    setIsVariantChanging(true);
    const next = { ...selectedVariant, [key]: value };
    setSelectedVariant(next);
    const match = findMatchingVariant(next);

    if (match) {
      // Valid combination found; clear any previous unavailable state
      setUnavailableVariant(false);

      // If the match is a different product, navigate/fetch it
      if (match._id && match._id !== (currentProduct._id || currentProduct.id)) {
        try {
          const fresh = await ProductService.getProductById(match._id);
          if (fresh && typeof fresh === "object") {
            setCurrentProduct(fresh);
            setSelectedImageIndex(0);
            // Update URL after product is loaded
            navigate(`/product/${match._id}`, { replace: true });
            // Reset loading flag after a short delay to ensure state updates
            setTimeout(() => setIsVariantChanging(false), 100);
          } else {
            setIsVariantChanging(false);
          }
        } catch (e) {
          console.error("Failed to fetch variant product", e);
          setIsVariantChanging(false);
        }
      } else {
        setIsVariantChanging(false);
      }
    } else {
      // No matching variant exists for the selected combination
      setUnavailableVariant(true);
      setIsVariantChanging(false);
    }
  };

  // Handle size (RAM + Storage) selection - update both at once
  const handleSizeClick = async (ram, storage) => {
    // Prevent multiple simultaneous calls
    if (isVariantChanging) return;
    
    setIsVariantChanging(true);
    const next = { ...selectedVariant, ram, storage };
    setSelectedVariant(next);
    const match = findMatchingVariant(next);

    if (match && match._id) {
      // Valid combination found; clear any previous unavailable state
      setUnavailableVariant(false);

      // Always fetch fresh product data from API, even if it's the same product ID
      // This ensures we get the latest stock status
      try {
        const fresh = await ProductService.getProductById(match._id);
        if (fresh && typeof fresh === "object") {
          // Check if the fetched product has stock
          const stock = Number(fresh.stock || 0);
          const isExpired = fresh.expiryTime ? new Date(fresh.expiryTime) < new Date() : false;
          
          if (stock <= 0 || isExpired) {
            // Product is out of stock or expired, mark as unavailable
            setUnavailableVariant(true);
            setIsVariantChanging(false);
            return;
          }

          // Product is available, update the current product
          setCurrentProduct(fresh);
          setSelectedImageIndex(0);
          
          // Update URL if it's a different product
          if (match._id !== (currentProduct._id || currentProduct.id)) {
            navigate(`/product/${match._id}`, { replace: true });
          }
          
          // Reset loading flag after a short delay to ensure state updates
          setTimeout(() => setIsVariantChanging(false), 100);
        } else {
          // Invalid response, mark as unavailable
          setUnavailableVariant(true);
          setIsVariantChanging(false);
        }
      } catch (e) {
        console.error("Failed to fetch variant product", e);
        setUnavailableVariant(true);
        setIsVariantChanging(false);
      }
    } else {
      // No matching variant exists for the selected combination
      setUnavailableVariant(true);
      setIsVariantChanging(false);
    }
  };

  useEffect(() => {
    const handleWishlistUpdate = async (event) => {
      const productId = processedProduct.id || processedProduct._id;

      if (event.detail && event.detail.productId === productId) {
        setIsFavorite(event.detail.isWishlisted);
      } else if (!event.detail || !event.detail.productId) {
        try {
          const refreshed = await ProductService.getProductById(productId);
          setCurrentProduct(refreshed);
        } catch (error) {
          console.error("Failed to refresh product:", error);
        }
      }

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    };

    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, [processedProduct.id, processedProduct._id, onRefresh]);

  // Countdown timer and current time logic
  useEffect(() => {
    const updateTimers = () => {
      // Update current time
      setCurrentTime(new Date());

      // Update countdown timer for expiry
      if (processedProduct.expiryTime && !processedProduct.isExpired) {
        const expiryDate = new Date(processedProduct.expiryTime);
        const now = new Date();
        const difference = expiryDate - now;

        if (difference <= 0) {
          setTimeLeft(null);
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateTimers();
    const timer = setInterval(updateTimers, 1000);

    return () => clearInterval(timer);
  }, [processedProduct.expiryTime, processedProduct.isExpired]);

  const handleQuantityChange = (amount) => {
    const newQuantity = quantity + amount;
    if (
      newQuantity >= processedProduct.moq &&
      newQuantity <= processedProduct.stockCount
    ) {
      setQuantity(newQuantity);
    }
  };

  const handleNotifyToggle = async (e, nextValue) => {
    e.stopPropagation();
    if (!canNotify) return;

    const productId = processedProduct.id || processedProduct._id;

    try {
      await ProductService.createNotification({
        productId: productId,
        notifyType: "stock_alert",
        notify: nextValue,
      });
      setNotify(nextValue);

      try {
        const refreshed = await ProductService.getProductById(productId);
        setCurrentProduct(refreshed);
        if (typeof onRefresh === "function") {
          onRefresh();
        }
      } catch (refreshErr) {
        // ignore refresh error
      }

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error("Notification toggle error:", err);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    
    // Check for token before making API call
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!token || !isLoggedIn) {
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      return navigate(`/login?returnTo=${returnTo}`);
    }

    // Check if profile is complete
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const isProfileComplete = AuthService.isProfileComplete(userData);
        if (!isProfileComplete) {
          navigate('/profile', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    }

    const productId = processedProduct._id || processedProduct.id;
    const newWishlistStatus = !isFavorite;
    setIsFavorite(!newWishlistStatus);

    try {
      await ProductService.toggleWishlist({
        productId: productId,
        wishlist: newWishlistStatus,
      });
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
      setIsFavorite(!newWishlistStatus);
    }
  };

  const handleBiddingClick = async (e) => {
    e.stopPropagation();
    // Require auth for making an offer
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      return navigate(`/login?returnTo=${returnTo}`);
    }

    // Check if profile is complete
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const isProfileComplete = AuthService.isProfileComplete(userData);
        if (!isProfileComplete) {
          navigate('/profile', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const { businessProfile } = userData;

    if (
      !businessProfile?.businessName ||
      businessProfile.businessName.trim() === ""
    ) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Business Details Required",
        text: "Please add your business details before making an offer.",
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

    setIsBiddingFormOpen(true);
  };

  const handleBiddingSuccess = () => {
    console.log("Bid submitted successfully");
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (processedProduct.isOutOfStock || processedProduct.isExpired) return;
    const customerId = localStorage.getItem("userId") || "";
    if (!customerId) {
      const hashPath = window.location.hash?.slice(1) || "/home";
      const returnTo = encodeURIComponent(hashPath);
      return navigate(`/login?returnTo=${returnTo}`);
    }

    // Check if profile is complete
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const isProfileComplete = AuthService.isProfileComplete(userData);
        if (!isProfileComplete) {
          navigate('/profile', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    }

    setIsAddToCartPopupOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.stopPropagation();
    if (processedProduct.isOutOfStock || processedProduct.isExpired) return;
    
    const customerId = localStorage.getItem("userId") || "";
    if (!customerId) {
      const hashPath = window.location.hash?.slice(1) || "/home";
      const returnTo = encodeURIComponent(hashPath);
      return navigate(`/login?returnTo=${returnTo}`);
    }

    // Check if profile is complete
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const isProfileComplete = AuthService.isProfileComplete(userData);
        if (!isProfileComplete) {
          navigate('/profile', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        cartItems: [
          {
            productId: processedProduct._id || processedProduct.id,
            skuFamilyId: processedProduct.skuFamilyId?._id || processedProduct.skuFamilyId || null,
            subSkuFamilyId: processedProduct.subSkuFamilyId?._id || processedProduct.subSkuFamilyId || null,
            quantity: quantity,
            price: parseFloat(processedProduct.price.toString().replace(/,/g, "")),
          },
        ],
        billingAddress: {
          address: "",
          city: "",
          postalCode: "",
          country: "",
        },
        shippingAddress: {
          address: "",
          city: "",
          postalCode: "",
          country: "",
        },
      };

      const response = await OrderService.createOrder(orderData);
      
      if (response?.success || response?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Order Placed Successfully!",
          text: `Your order has been placed. Order ID: ${response?.data?.orderNumber || response?.data?.orderId || 'N/A'}`,
          confirmButtonText: "OK",
          confirmButtonColor: PRIMARY_COLOR,
        });
        
        // Refresh product data if onRefresh is available
        if (typeof onRefresh === "function") {
          onRefresh();
        }
      }
    } catch (error) {
      console.error("Failed to place order:", error);
      // Error is already handled by OrderService with toast
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const popupProduct = {
    id: processedProduct.id || processedProduct._id,
    name: processedProduct.name,
    price: processedProduct.price,
    imageUrl: processedProduct.imageUrl || processedProduct.mainImage || "",
    moq: processedProduct.moq,
    stockCount: processedProduct.stockCount,
    description: processedProduct.description || "",
    notify: processedProduct.notify,
    purchaseType: processedProduct.purchaseType,
    skuFamilyId: processedProduct.skuFamilyId?._id || processedProduct.skuFamilyId || null,
    subSkuFamilyId: processedProduct.subSkuFamilyId?._id || processedProduct.subSkuFamilyId || null,
  };

  const totalAmount =
    parseInt(processedProduct.price.toString().replace(/,/g, "")) * quantity;

  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
  };

  const professionalSpecs = [
    {
      icon: faShield,
      label: "Condition",
      value: processedProduct.condition,
      color: "text-green-600",
    },
    {
      icon: faCircleDot,
      label: "Color",
      value: processedProduct.color,
      color: PRIMARY_COLOR,
    },
    {
      icon: faMicrochip,
      label: "RAM",
      value: processedProduct.ram,
      color: "text-purple-600",
    },
    {
      icon: faDatabase,
      label: "Storage",
      value: processedProduct.storage,
      color: "text-orange-600",
    },
    {
      icon: faTag,
      label: "Brand",
      value: processedProduct.brand,
      color: "text-indigo-600",
    },
    {
      icon: faBarcode,
      label: "Product Code",
      value: processedProduct.code,
      color: "text-gray-600",
    },
    {
      icon: faSimCard,
      label: "SIM Type",
      value: processedProduct.simType,
      color: "text-red-600",
    },
    {
      icon: faGlobe,
      label: "Country",
      value: processedProduct.country,
      color: "text-teal-600",
    },
    {
      icon: faWifi,
      label: "Network Bands",
      value: processedProduct.networkBands,
      color: "text-cyan-600",
    },
    {
      icon: faTruck,
      label: "Purchase Type",
      value: processedProduct.purchaseType,
      color: "text-yellow-600",
    },
  ].filter((spec) => spec.value && spec.value !== "");

  // Helper function to get country flag emoji
  const getCountryFlag = (countryName) => {
    if (!countryName) return "🌍";
    const country = countryName.toLowerCase();
    if (country.includes("hongkong") || country.includes("hong kong")) return "🇭🇰";
    if (country.includes("uae") || country.includes("united arab")) return "🇦🇪";
    if (country.includes("usa") || country.includes("united states")) return "🇺🇸";
    if (country.includes("uk") || country.includes("united kingdom")) return "🇬🇧";
    if (country.includes("india")) return "🇮🇳";
    if (country.includes("china")) return "🇨🇳";
    if (country.includes("japan")) return "🇯🇵";
    if (country.includes("korea")) return "🇰🇷";
    return "🌍";
  };

  // Storage & Variant label
  const storageVariantLabel = [
    processedProduct.storage,
    processedProduct.color,
    processedProduct.simType,
  ]
    .filter(Boolean)
    .join(" • ");

  // Helper function to convert string to title case
  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toString()
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Color mapping helper for specifications
  const getSpecColor = (colorName) => {
    const colorMap = {
      primary: { bg: PRIMARY_COLOR_LIGHT, icon: PRIMARY_COLOR, hover: `${PRIMARY_COLOR}20` },
      green: { bg: '#dcfce7', icon: '#16a34a', hover: '#bbf7d0' },
      purple: { bg: '#f3e8ff', icon: '#9333ea', hover: '#e9d5ff' },
      orange: { bg: '#fed7aa', icon: '#ea580c', hover: '#fdba74' },
      indigo: { bg: '#e0e7ff', icon: '#4f46e5', hover: '#c7d2fe' },
      pink: { bg: '#fce7f3', icon: '#db2777', hover: '#fbcfe8' },
      cyan: { bg: '#cffafe', icon: '#0891b2', hover: '#a5f3fc' },
      teal: { bg: '#ccfbf1', icon: '#0d9488', hover: '#99f6e4' },
      amber: { bg: '#fef3c7', icon: '#d97706', hover: '#fde68a' },
      emerald: { bg: '#d1fae5', icon: '#10b981', hover: '#a7f3d0' },
    };
    return colorMap[colorName] || colorMap.primary;
  };

  // Get color swatch style based on color name (for circular swatches)
  const getColorSwatchStyle = (colorName) => {
    if (!colorName) return { className: "bg-gray-400", style: {} };
    const color = colorName.toLowerCase();
    if (color.includes("orange")) return { className: "bg-orange-500", style: {} };
    if (color.includes("black")) return { className: "bg-gray-900", style: {} };
    if (color.includes("white")) return { className: "bg-white border border-gray-300", style: {} };
    if (color.includes("blue")) return { className: "", style: { backgroundColor: PRIMARY_COLOR } };
    if (color.includes("gold")) return { className: "bg-gradient-to-br from-yellow-300 to-yellow-600", style: {} };
    if (color.includes("silver")) return { className: "bg-gradient-to-br from-gray-300 to-gray-500", style: {} };
    if (color.includes("red")) return { className: "bg-red-500", style: {} };
    if (color.includes("green")) return { className: "bg-green-500", style: {} };
    if (color.includes("purple")) return { className: "bg-purple-500", style: {} };
    if (color.includes("gray") || color.includes("grey")) return { className: "bg-gray-500", style: {} };
    return { className: "bg-gray-400", style: {} };
  };

  // Build RAM + Storage combinations for size selection (current + related products)
  // Only show options that have available stock
  const getSizeOptions = () => {
    const combinations = [];
    const seen = new Set();

    // Helper function to check if a variant is available
    const isVariantAvailable = (ram, storage) => {
      const next = { ...selectedVariant, ram, storage };
      const match = findMatchingVariant(next);
      
      if (!match || !match._id) return false;
      
      // Check stock and expiry
      const stock = Number(match.stock || 0);
      const isExpired = match.expiryTime ? new Date(match.expiryTime) < new Date() : false;
      
      return stock > 0 && !isExpired;
    };

    const pushCombo = (ram, storage) => {
      if (!ram || !storage) return;
      
      // Only add if variant is available (has stock and not expired)
      if (!isVariantAvailable(ram, storage)) return;
      
      const key = `${ram}__${storage}`;
      if (seen.has(key)) return;
      seen.add(key);
      combinations.push({
        ram: String(ram),
        storage: String(storage),
        label: `${ram} + ${storage}`,
      });
    };

    // Current product
    pushCombo(processedProduct.ram, processedProduct.storage);

    // Related products
    if (Array.isArray(currentProduct?.relatedProducts)) {
      currentProduct.relatedProducts.forEach((p) => pushCombo(p.ram, p.storage));
    }

    // Helper function to extract numeric value from RAM/Storage string (e.g., "6GB" -> 6)
    const extractNumericValue = (str) => {
      if (!str) return 0;
      const match = String(str).match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Sort by RAM first (ascending), then by Storage (ascending)
    combinations.sort((a, b) => {
      const ramA = extractNumericValue(a.ram);
      const ramB = extractNumericValue(b.ram);
      
      if (ramA !== ramB) {
        return ramA - ramB; // Sort by RAM first
      }
      
      // If RAM is the same, sort by Storage
      const storageA = extractNumericValue(a.storage);
      const storageB = extractNumericValue(b.storage);
      return storageA - storageB;
    });

    return combinations.slice(0, 8);
  };

  const getStockIcon = () => {
    if (processedProduct.isExpired) return faTimesCircle;
    if (effectiveStockStatus === "In Stock") return faCheckCircle;
    if (effectiveStockStatus === "Low Stock") return faExclamationTriangle;
    return faTimesCircle;
  };

  const getStockColor = () => {
    if (processedProduct.isExpired) return "text-gray-600";
    if (effectiveStockStatus === "In Stock") return "text-green-600";
    if (effectiveStockStatus === "Low Stock") return "text-yellow-600";
    return "text-red-600";
  };

  // Format current time in hh:mm:ss
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format current date
  const formatCurrentDate = () => {
    return currentTime.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // No early return on unavailableVariant; we show a banner instead within the page

  return (
    <div className="min-h-screen bg-white">
      <style>
        {`
          .swiper-pagination-custom .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0.5);
            opacity: 1;
            margin: 0 4px;
          }
          .swiper-pagination-custom .swiper-pagination-bullet-active {
            background: ${PRIMARY_COLOR};
          }
          .thumbs-swiper .swiper-slide-thumb-active {
            opacity: 1;
          }
          .thumbs-swiper .swiper-slide {
            opacity: 0.6;
            transition: opacity 0.3s;
          }
          .thumbs-swiper .swiper-slide:hover {
            opacity: 0.8;
          }
          /* Minimal slide-in-left animation for spec items under stock status */
          @keyframes slide-in-left {
            from { opacity: 0; transform: translateX(-12px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .slide-in-left {
            opacity: 0;
            animation: slide-in-left 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
                  `}
      </style>
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <div className="relative group max-w-lg mx-auto">
              <div className="aspect-[4/3.5] relative rounded-lg overflow-hidden bg-gray-100 p-4">
                <div className="h-full w-full">
                  <div className="relative h-full">
                    <img
                      className="w-full h-full rounded-xl"
                      alt={`${processedProduct.name} ${selectedImageIndex + 1}`}
                      src={
                        imageError ? iphoneImage : productImages[selectedImageIndex]
                      }
                      onError={() => setImageError(true)}
                    />
                  </div>
                </div>
                <div className="absolute top-3 left-3 z-20">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    processedProduct.isExpired
                      ? "bg-gray-600 text-white"
                      : effectiveStockStatus === "In Stock"
                      ? "bg-green-600 text-white"
                      : effectiveStockStatus === "Low Stock"
                      ? "bg-yellow-600 text-white"
                      : "bg-red-600 text-white"
                  }`}>
                    {processedProduct.isExpired ? "Expired" : effectiveStockStatus}
                  </span>
                </div>
                {/* Product Specifications under Stock Status (polished with subtle animation and glass effect) */}
                <div className="hidden md:block absolute top-12 left-3 z-20">
                  <div className="px-3 py-3 product-info-glasseffects border border-white/50 rounded-xl shadow-lg">
                    <div className="space-y-2">
                      {processedProduct.condition && (
                        <div className="flex items-center gap-1 fade-in-up slide-in-left" style={{ animationDelay: '0ms' }}>
                          <span className="text-xs text-gray-700">Condition:</span>
                          <span className="text-xs font-semibold text-gray-900 capitalize">{processedProduct.condition}</span>
                        </div>
                      )}
                      {processedProduct.color && (
                        <div className="flex items-center gap-1 fade-in-up slide-in-left" style={{ animationDelay: '200ms' }}>
                          <span className="text-xs text-gray-700">Color:</span>
                          <span className="text-xs font-semibold text-gray-900 capitalize">{processedProduct.color}</span>
                        </div>
                      )}
                      {processedProduct.ram && (
                        <div className="flex items-center gap-1 fade-in-up slide-in-left" style={{ animationDelay: '400ms' }}>
                          <span className="text-xs text-gray-700">RAM:</span>
                          <span className="text-xs font-semibold text-gray-900">{processedProduct.ram}</span>
                        </div>
                      )}
                      {processedProduct.storage && (
                        <div className="flex items-center gap-1 fade-in-up slide-in-left" style={{ animationDelay: '600ms' }}>
                          <span className="text-xs text-gray-700">Storage:</span>
                          <span className="text-xs font-semibold text-gray-900">{processedProduct.storage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="absolute top-3 right-3 w-[40px] h-[40px] z-20 p-2 bg-white/80 rounded-md hover:bg-white transition-colors duration-200"
                  onClick={handleToggleWishlist}
                >
                  <svg
                    className={`w-[24px] h-[24px] ${isFavorite ? "text-[#FB2C36]" : "text-gray-400"} hover:text-[#FB2C36] transition-colors duration-200 cursor-pointer`}
                    fill={isFavorite ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                </button>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                  onClick={() => setSelectedImageIndex((prev) => prev === 0 ? productImages.length - 1 : prev - 1)}
                  disabled={productImages.length <= 1}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600 text-sm" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                  onClick={() => setSelectedImageIndex((prev) => (prev + 1) % productImages.length)}
                  disabled={productImages.length <= 1}
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-sm" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex space-x-1">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedImageIndex === index
                          ? PRIMARY_COLOR
                          : "bg-white/50 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block max-w-lg mx-auto">
              <div className="grid grid-cols-5 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-[4/3] rounded-md overflow-hidden cursor-pointer transition-opacity duration-300 bg-gray-100 p-2 ${
                      selectedImageIndex === index ? "opacity-100" : "opacity-60"
                    }`}
                  >
                    <img
                      alt={`${processedProduct.name} ${index + 1}`}
                      className="w-full h-full object-contain"
                      src={thumbErrors[index] ? iphoneImage : image}
                      onError={() => setThumbErrors((prev) => ({ ...prev, [index]: true }))}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-4 px-2 md:px-0">
            <div className="">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                {processedProduct.name}
              </h1>
              <p className="mt-1 text-base text-gray-600 font-medium">
                by {processedProduct.brand}
              </p>
            </div>
              <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-3">
                {/* USD Price - Always shown */}
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-semibold text-green-600">
                    ${parseFloat(processedProduct.price || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  {processedProduct.isNegotiable && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border"
                      style={{ color: PRIMARY_COLOR, backgroundColor: PRIMARY_COLOR_LIGHT, borderColor: `${PRIMARY_COLOR}40` }}>
                      Negotiable
                    </span>
                  )}
                </div>
                
                {/* Country Rate Section - Dropdown for viewing different currency rates */}
                {(() => {
                  const rates = getCurrencyRates();
                  const priceInUSD = parseFloat(processedProduct.price || 0);
                  
                  // Only show Country Rate section if customer has a country set
                  if (!customerCountryCurrency || !rates) return null;
                  
                  const getCurrencyFlagClass = (code) => {
                    const flagClasses = {
                      'USD': 'fi fi-us',
                      'HKD': 'fi fi-hk',
                      'AED': 'fi fi-ae',
                      'SGD': 'fi fi-sg',
                      'INR': 'fi fi-in'
                    };
                    return flagClasses[code] || '';
                  };
                  
                  const currencies = [];
                  
                  // Always show AED
                  if (rates.AED) {
                    currencies.push({ code: 'AED', flagClass: getCurrencyFlagClass('AED'), label: 'AED' });
                  }
                  
                  // Show customer country currency if available and not AED
                  if (customerCountryCurrency !== 'AED' && rates[customerCountryCurrency]) {
                    const labels = {
                      'HKD': 'HK',
                      'SGD': 'SGD',
                      'INR': 'INR'
                    };
                    currencies.push({ 
                      code: customerCountryCurrency, 
                      flagClass: getCurrencyFlagClass(customerCountryCurrency),
                      label: labels[customerCountryCurrency] || customerCountryCurrency
                    });
                  }
                  
                  if (currencies.length === 0) return null;
                  
                  // Ensure selected currency is valid, default to first available
                  const validSelectedCurrency = currencies.find(c => c.code === selectedCountryRate) 
                    ? selectedCountryRate 
                    : currencies[0]?.code || 'AED';
                  
                  const selectedCurrencyData = currencies.find(c => c.code === validSelectedCurrency) || currencies[0];
                  const selectedFormattedPrice = formatPriceForCurrency(priceInUSD, selectedCurrencyData.code, rates);
                  
                  return (
                    <div className="space-y-2">
                      {/* <label className="block text-sm font-medium text-gray-700">Country Rate</label> */}
                      <div className="relative country-rate-dropdown">
                        <button
                          type="button"
                          onClick={() => setIsCountryRateDropdownOpen(!isCountryRateDropdownOpen)}
                          className="w-full md:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between gap-2 min-w-[200px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`${selectedCurrencyData.flagClass} rounded-sm`} style={{ width: '16px', height: '12px' }}></span>
                            <span className="font-medium">{selectedCurrencyData.label}</span>
                            <span className="text-gray-500">-</span>
                            <span className="font-semibold">{selectedFormattedPrice}</span>
                          </div>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${isCountryRateDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isCountryRateDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full md:w-auto min-w-[200px] bg-white border border-gray-300 rounded-lg shadow-lg">
                            {currencies.map((currency) => {
                              const formattedPrice = formatPriceForCurrency(priceInUSD, currency.code, rates);
                              const isSelected = currency.code === validSelectedCurrency;
                              return (
                                <button
                                  key={currency.code}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountryRate(currency.code);
                                    setIsCountryRateDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-1.5 hover:bg-gray-50 transition-colors ${
                                    isSelected ? 'bg-blue-50' : ''
                                  } ${currency.code === currencies[0]?.code ? 'rounded-t-lg' : ''} ${
                                    currency.code === currencies[currencies.length - 1]?.code ? 'rounded-b-lg' : ''
                                  }`}
                                >
                                  <span className={`${currency.flagClass} rounded-sm`} style={{ width: '16px', height: '12px' }}></span>
                                  <span className="font-medium">{currency.label}</span>
                                  <span className="text-gray-500">-</span>
                                  <span className="font-semibold">{formattedPrice}</span>
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-red-500 italic">
                        Prices shown are for view reference only. Actual transactions are processed in USD only.
                      </p>
                    </div>
                  );
                })()}
              </div>
              {processedProduct.expiryTime && !processedProduct.isExpired && timeLeft && (
                <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-pink-50 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm border border-red-200">
                  <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-2" />
                  <span className="font-bold">
                    {timeLeft.days}d {timeLeft.hours}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
            </div>
            
            {/* Mobile Colour Selection - Above Key Features */}
            {variantOptions.colors.length > 0 && (
              <div className=" mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Colour</label>
                <div className="flex items-center gap-3">
                  {variantOptions.colors.map((c) => {
                    const isSelected = selectedVariant.color === c;
                    return (
                      <button
                        key={c}
                        onClick={() => handleVariantClick("color", c)}
                        className={`w-10 h-10 rounded-full ${getColorSwatchStyle(c).className} border-2 transition-all ${
                          isSelected
                            ? "border-gray-900"
                            : "border-gray-200"
                        }`}
                        style={getColorSwatchStyle(c).style}
                      >
                        {isSelected && (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile Size (RAM + Storage) Selection */}
            {getSizeOptions().length > 0 && (
              <div className=" mb-4 border-b border-gray-200 pb-3">
                <label className="block text-sm text-gray-500 font-medium mb-2">
                  Size : <span className="font-bold text-gray-900">{processedProduct.ram} + {processedProduct.storage}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {getSizeOptions().map((size, idx) => {
                    const isSelected = String(selectedVariant.ram) === String(size.ram) && String(selectedVariant.storage) === String(size.storage);
                    const isDisabled = isVariantChanging && !isSelected;
                    return (
                      <button
                        key={`${size.ram}-${size.storage}-${idx}`}
                        onClick={() => {
                          // Only update if not already selected and not currently changing
                          if (!isSelected && !isVariantChanging) {
                            handleSizeClick(size.ram, size.storage);
                          }
                        }}
                        disabled={isDisabled}
                        className={`px-4 py-2 rounded-[10px] text-sm font-semibold border transition-colors ${
                          isSelected 
                            ? "border-gray-200 text-gray-800 bg-white" 
                            : isDisabled
                            ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                            : "border-gray-200 text-gray-800 bg-white hover:border-gray-300"
                        }`}
                        style={isSelected ? { borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR, backgroundColor: PRIMARY_COLOR_LIGHT } : {}}
                      >
                        {size.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Features Section - 6 Cards Grid */}
            <div className="">
              <h3 className="text-base font-bold text-gray-900 mb-3">Key Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Card 1: SKU / Model ID */}
                {processedProduct.code && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">SKU / Model ID</p>
                    <p className="text-sm font-bold text-gray-900">{processedProduct.code}</p>
                  </div>
                )}

                {/* Card 2: Storage & Variant */}
                {storageVariantLabel && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">Storage & Variant</p>
                    <p className="text-sm font-bold text-gray-900">{storageVariantLabel}</p>
                  </div>
                )}

                {/* Card 3: Warehouse */}
                {processedProduct.country && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">Warehouse</p>
                    <p className="text-sm font-bold text-gray-900">
                       {processedProduct.country}
                    </p>
                  </div>
                )}

                {/* Card 4: Delivery (EST) */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">Delivery (EST)</p>
                  <p className="text-sm font-bold text-gray-900">
                    {currentProduct?.deliveryEstimate || processedProduct.deliveryEstimate || "3-5 Business Days"}
                  </p>
                </div>

                {/* Card 5: MOQ */}
                {processedProduct.moq && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">MOQ</p>
                    <p className="text-sm font-bold text-gray-900">{processedProduct.moq} Units</p>
                  </div>
                )}

                {/* Card 6: Available Stock */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">Available Stock</p>
                  <p className={`text-sm font-bold ${effectiveStockStatus === "In Stock" ? "text-green-600" : "text-gray-900"} flex items-center gap-1`}>
                    {effectiveStockStatus === "In Stock" && (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                    )}
                    {effectiveStockCount} Units
                  </p>
                </div>
              </div>
            </div>
            {processedProduct.description && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">About This Item</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {processedProduct.description}
                </p>
              </div>
            )}
            {/* Variant selectors under description (Color, RAM, Storage, SIM Type) */}
            {(variantOptions.colors.length > 0 ||
              variantOptions.rams.length > 0 ||
              variantOptions.storages.length > 0 ||
              variantOptions.simTypes.length > 0) && (
              <div className="space-y-6">
                {/* First Row: Color and RAM */}
                {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {variantOptions.colors.length > 0 && (
                    <div className="hidden bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <FontAwesomeIcon icon={faPalette} className="text-purple-600 text-sm" />
                        </div>
                        <label className="text-sm font-semibold text-gray-700">Color Options</label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variantOptions.colors.map((c) => (
                          <button
                            key={c}
                            className={`group relative px-3 py-2 rounded-lg border-2 text-sm font-semibold cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              selectedVariant.color === c
                                ? "border-purple-500 text-purple-700 bg-purple-50 shadow-lg shadow-purple-100"
                                : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                            }`}
                            onMouseEnter={() => handleVariantHover("color", c)}
                            onClick={() => handleVariantClick("color", c)}
                          >
                            <div className="flex items-center space-x-2">
                              <div 
                                className={`w-3 h-3 rounded-full border ${
                                  c.toLowerCase().includes('gold') ? 'bg-gradient-to-br from-yellow-300 to-yellow-600' :
                                  c.toLowerCase().includes('silver') ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                  c.toLowerCase().includes('black') ? 'bg-gray-900' :
                                  c.toLowerCase().includes('white') ? 'bg-white border-gray-300' :
                                  c.toLowerCase().includes('red') ? 'bg-red-500' :
                                  c.toLowerCase().includes('green') ? 'bg-green-500' :
                                  c.toLowerCase().includes('purple') ? 'bg-purple-500' :
                                  'bg-gray-400'
                                }`}
                                style={c.toLowerCase().includes('blue') ? { backgroundColor: PRIMARY_COLOR } : {}}
                              ></div>
                              <span className="capitalize text-xs">{c}</span>
                            </div>
                            {selectedVariant.color === c && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {variantOptions.rams.length > 0 && (
                    <div className="hidden bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <FontAwesomeIcon icon={faMicrochip} className="text-green-600 text-sm" />
                        </div>
                        <label className="text-sm font-semibold text-gray-700">Memory (RAM)</label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variantOptions.rams.map((r) => (
                          <button
                            key={r}
                            className={`group relative px-3 py-2 rounded-lg border-2 text-sm font-semibold cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              selectedVariant.ram === r
                                ? "border-green-500 text-green-700 bg-green-50 shadow-lg shadow-green-100"
                                : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                            }`}
                            onMouseEnter={() => handleVariantHover("ram", r)}
                            onClick={() => handleVariantClick("ram", r)}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-sm flex items-center justify-center">
                                <FontAwesomeIcon icon={faMicrochip} className="text-white text-xs" />
                              </div>
                              <span className="font-mono text-xs">{r}</span>
                            </div>
                            {selectedVariant.ram === r && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div> */}

                {/* Second Row: Storage and SIM Type */}
                {/* <div className="hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {variantOptions.storages.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 mb-4">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <FontAwesomeIcon icon={faDatabase} className="text-orange-600 text-sm" />
                        </div>
                        <label className="text-sm font-semibold text-gray-700">Storage Capacity</label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variantOptions.storages.map((s) => (
                          <button
                            key={s}
                            className={`group relative px-3 py-2 rounded-lg border-2 text-sm font-semibold cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              selectedVariant.storage === s
                                ? "border-orange-500 text-orange-700 bg-orange-50 shadow-lg shadow-orange-100"
                                : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                            }`}
                            onMouseEnter={() => handleVariantHover("storage", s)}
                            onClick={() => handleVariantClick("storage", s)}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-sm flex items-center justify-center">
                                <FontAwesomeIcon icon={faDatabase} className="text-white text-xs" />
                              </div>
                              <span className="font-mono text-xs">{s}</span>
                            </div>
                            {selectedVariant.storage === s && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {variantOptions.simTypes.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                          <FontAwesomeIcon icon={faSimCard} className="text-cyan-600 text-sm" />
                        </div>
                        <label className="text-sm font-semibold text-gray-700">SIM Configuration</label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variantOptions.simTypes.map((t) => (
                          <button
                            key={t}
                            className={`group relative px-3 py-2 rounded-lg border-2 text-sm font-semibold cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              selectedVariant.simType === t
                                ? "border-cyan-500 text-cyan-700 bg-cyan-50 shadow-lg shadow-cyan-100"
                                : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                            }`}
                            onMouseEnter={() => handleVariantHover("simType", t)}
                            onClick={() => handleVariantClick("simType", t)}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-3 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-sm flex items-center justify-center">
                                <FontAwesomeIcon icon={faSimCard} className="text-white text-xs" />
                              </div>
                              <span className="font-medium text-xs">{t}</span>
                            </div>
                            {selectedVariant.simType === t && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div> */}
              </div>
            )}
            {/* Desktop/Tablet quantity + total */}
            {/* <div className="hidden md:grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-xs text-gray-500 block font-medium mb-1">Minimum Order Quantity</span>
                <span className="text-lg font-bold text-gray-900">{processedProduct.moq} units</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-xs text-gray-500 block font-medium mb-1">Available Stock</span>
                <span className={`text-lg font-bold ${getStockColor()} flex items-center`}>
                  <FontAwesomeIcon icon={getStockIcon()} className="mr-2" />
                  {effectiveStockCount} units
                </span>
              </div>
            </div> */}
            {processedProduct.expiryTime && (
              <div
                className={`p-4 rounded-lg text-sm font-medium ${
                  processedProduct.isExpired
                    ? "bg-red-50 text-red-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                <FontAwesomeIcon icon={faCalendarXmark} className="mr-2" />
                {processedProduct.isExpired ? (
                  <span>
                    Expired on{" "}
                    {new Date(processedProduct.expiryTime).toLocaleDateString(
                      "en-US",
                      {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      }
                    )}
                  </span>
                ) : (
                  <span>
                    Expires on{" "}
                    {new Date(processedProduct.expiryTime).toLocaleDateString(
                      "en-US",
                      {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      }
                    )}
                  </span>
                )}
              </div>
            )}
            {/* Desktop/Tablet quantity + total + CTAs */}
            <div className="hidden md:grid grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Quantity</label>
                <div className="flex items-center">
                  <button
                    className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-default transition-all duration-200"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={
                      quantity <= processedProduct.moq ||
                      effectiveIsOutOfStock ||
                      processedProduct.isExpired
                    }
                  >
                    <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                  </button>
                  <input
                    className="mx-2 w-16 text-center text-base font-bold text-gray-900 border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    min={processedProduct.moq}
                    max={effectiveStockCount}
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || processedProduct.moq;
                      if (
                        newValue >= processedProduct.moq &&
                        newValue <= effectiveStockCount
                      ) {
                        setQuantity(newValue);
                      }
                    }}
                    disabled={
                      effectiveIsOutOfStock ||
                      processedProduct.isExpired
                    }
                  />
                  <button
                    className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-default transition-all duration-200"
                    onClick={() => handleQuantityChange(1)}
                    disabled={
                      quantity >= effectiveStockCount ||
                      effectiveIsOutOfStock ||
                      processedProduct.isExpired
                    }
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-600 mb-1">Total Amount</span>
                <span className="text-xl font-bold text-gray-900">
                  {convertPrice(totalAmount)}
                </span>
              </div>
            </div>
            <div className="hidden md:flex space-x-3">
              {processedProduct.isExpired ? (
                <button
                  className="flex-1 cursor-pointer text-black py-3 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                  disabled
                >
                  Product Expired
                </button>
              ) : effectiveIsOutOfStock ? (
                <>
                  <button
                    className="flex-1 cursor-pointer text-black py-3 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                    disabled
                  >
                    Out of Stock
                  </button>
                  {canNotify && (notify ? (
                    <button
                      className="flex-1 bg-red-600 cursor-pointer text-white py-3 rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                      onClick={(ev) => handleNotifyToggle(ev, false)}
                    >
                      <FontAwesomeIcon icon={faBellSlash} className="mr-2" />
                      Turn Off Notifications
                    </button>
                  ) : (
                    <button
                      className="flex-1 cursor-pointer text-white py-3 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = PRIMARY_COLOR_DARK}
                      onMouseLeave={(e) => e.target.style.backgroundColor = PRIMARY_COLOR}
                      onClick={(ev) => handleNotifyToggle(ev, true)}
                    >
                      <FontAwesomeIcon icon={faBell} className="mr-2" />
                      Notify When Available
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || processedProduct.isOutOfStock || processedProduct.isExpired}
                    className="flex-1 cursor-pointer text-black py-3 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlacingOrder ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faBolt} className="mr-2" />
                        Place Order
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleAddToCartClick}
                    className="flex-1 cursor-pointer text-black py-3 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faCartShopping} className="mr-2" />
                    Order Now
                  </button>
                  {processedProduct.isNegotiable && (
                    <button
                      onClick={handleBiddingClick}
                      className="flex-1 cursor-pointer text-white py-3 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = PRIMARY_COLOR_DARK}
                      onMouseLeave={(e) => e.target.style.backgroundColor = PRIMARY_COLOR}
                    >
                      <FontAwesomeIcon icon={faHandshake} className="mr-2" />
                      Make an Offer
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
        {/* Spacer for mobile sticky bar */}
        <div className="md:hidden" />

        {/* Mobile sticky bottom action bar */}
        {!processedProduct.isExpired && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] glassiffectfor_productinfo">
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="block text-xs text-gray-500 font-medium">Total</span>
                  <span className="text-lg font-extrabold text-green-600">{convertPrice(totalAmount)}</span>
                  {processedProduct.moq && (
                    <p className="text-xs text-gray-600">
                      Minimum order quantity is {processedProduct.moq} units.
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <button
                    className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-default"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={
                      quantity <= processedProduct.moq ||
                      effectiveIsOutOfStock ||
                      processedProduct.isExpired
                    }
                  >
                    <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                  </button>
                  <input
                    className="mx-2 w-14 text-center text-base font-bold text-gray-900 border border-gray-200 rounded-lg py-2 focus:outline-none"
                    min={processedProduct.moq}
                    max={effectiveStockCount}
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || processedProduct.moq;
                      if (newValue >= processedProduct.moq && newValue <= effectiveStockCount) {
                        setQuantity(newValue);
                      }
                    }}
                    disabled={effectiveIsOutOfStock || processedProduct.isExpired}
                  />
                  <button
                    className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-default"
                    onClick={() => handleQuantityChange(1)}
                    disabled={
                      quantity >= effectiveStockCount ||
                      effectiveIsOutOfStock ||
                      processedProduct.isExpired
                    }
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {effectiveIsOutOfStock ? (
                <div className="flex gap-3">
                  <button
                    className="flex-1 cursor-pointer text-gray-700 py-3 rounded-lg text-sm font-semibold border border-gray-200 bg-gray-50"
                    disabled
                  >
                    Out of Stock
                  </button>
                  {canNotify && (notify ? (
                    <button
                      className="flex-1 bg-red-600 cursor-pointer text-white py-3 rounded-lg text-sm font-semibold"
                      onClick={(ev) => handleNotifyToggle(ev, false)}
                    >
                      Turn Off
                    </button>
                  ) : (
                    <button
                      className="flex-1 cursor-pointer text-white py-3 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = PRIMARY_COLOR_DARK}
                      onMouseLeave={(e) => e.target.style.backgroundColor = PRIMARY_COLOR}
                      onClick={(ev) => handleNotifyToggle(ev, true)}
                    >
                      Notify Me
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCartClick}
                    className="flex-1 cursor-pointer bg-white text-gray-900 py-3 rounded-lg text-sm font-semibold border border-gray-200"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faCartShopping} />
                      Order Now
                    </span>
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || processedProduct.isOutOfStock || processedProduct.isExpired}
                    className="flex-1 cursor-pointer text-white py-3 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                    onMouseEnter={(e) => !isPlacingOrder && (e.target.style.backgroundColor = PRIMARY_COLOR_DARK)}
                    onMouseLeave={(e) => !isPlacingOrder && (e.target.style.backgroundColor = PRIMARY_COLOR)}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {isPlacingOrder ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faBolt} />
                          Place Order
                        </>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Specifications Section */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Product Specifications</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Comprehensive product details</p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Basic Information */}
            <div className="mb-8 sm:mb-10">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 sm:mb-5 uppercase tracking-wide">Basic Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { icon: faTag, label: "Brand", value: processedProduct.brand, color: "primary" },
                  { icon: faBarcode, label: "Product Code", value: processedProduct.code, color: "green" },
                  { icon: faShield, label: "Condition", value: processedProduct.condition, color: "purple" },
                  { icon: faCheckCircle, label: "Status", value: processedProduct.status, color: "emerald" },
                ]
                  .filter((item) => item.value)
                  .map((item, index) => {
                    const colors = getSpecColor(item.color);
                    return (
                      <div 
                        key={index} 
                        className="group relative bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: colors.bg }}
                          >
                            <FontAwesomeIcon 
                              icon={item.icon} 
                              style={{ color: colors.icon }} 
                              className="text-sm sm:text-base" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                            <p className="text-sm sm:text-base font-semibold text-gray-900 break-words leading-tight">
                              {['Condition', 'RAM', 'Storage', 'SIM Type'].includes(item.label) 
                                ? (item.value?.toString().toUpperCase() || '') 
                                : toTitleCase(item.value)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="mb-8 sm:mb-10">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 sm:mb-5 uppercase tracking-wide">Technical Specifications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { icon: faDatabase, label: "Storage", value: processedProduct.storage, color: "orange" },
                  { icon: faMicrochip, label: "RAM", value: processedProduct.ram, color: "indigo" },
                  { icon: faPalette, label: "Color", value: processedProduct.color, color: "pink" },
                  { icon: faPalette, label: "Color Variants", value: processedProduct.colorVariant, color: "pink" },
                  { icon: faSimCard, label: "SIM Type", value: processedProduct.simType, color: "cyan" },
                  { icon: faWifi, label: "Network Bands", value: processedProduct.networkBands, color: "teal" },
                ]
                  .filter((item) => item.value)
                  .map((item, index) => {
                    const colors = getSpecColor(item.color);
                    return (
                      <div 
                        key={index} 
                        className="group relative bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: colors.bg }}
                          >
                            <FontAwesomeIcon 
                              icon={item.icon} 
                              style={{ color: colors.icon }} 
                              className="text-sm sm:text-base" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                            <p className="text-sm sm:text-base font-semibold text-gray-900 break-words leading-tight">
                              {['Condition', 'RAM', 'Storage', 'SIM Type'].includes(item.label) 
                                ? (item.value?.toString().toUpperCase() || '') 
                                : toTitleCase(item.value)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Location & Purchase */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 sm:mb-5 uppercase tracking-wide">Location & Purchase</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { icon: faGlobe, label: "Country", value: processedProduct.country, color: "primary" },
                  { icon: faTruck, label: "Purchase Type", value: processedProduct.purchaseType, color: "amber" },
                  { icon: faHandshake, label: "Negotiable", value: processedProduct.isNegotiable ? "Yes" : "No", color: "green" },
                ]
                  .filter((item) => item.value)
                  .map((item, index) => {
                    const colors = getSpecColor(item.color);
                    return (
                      <div 
                        key={index} 
                        className="group relative bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: colors.bg }}
                          >
                            <FontAwesomeIcon 
                              icon={item.icon} 
                              style={{ color: colors.icon }} 
                              className="text-sm sm:text-base" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                            <p className="text-sm sm:text-base font-semibold text-gray-900 break-words leading-tight">
                              {['Condition', 'RAM', 'Storage', 'SIM Type'].includes(item.label) 
                                ? (item.value?.toString().toUpperCase() || '') 
                                : toTitleCase(item.value)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isNotifyMePopupOpen && (
        <NotifyMePopup
          product={processedProduct}
          onClose={() => setIsNotifyMePopupOpen(false)}
        />
      )}

      {isAddToCartPopupOpen && (
        <AddToCartPopup
          product={popupProduct}
          onClose={() => setIsAddToCartPopupOpen(false)}
        />
      )}

      {isBiddingFormOpen && (
        <BiddingForm
          product={processedProduct}
          isOpen={isBiddingFormOpen}
          onClose={() => setIsBiddingFormOpen(false)}
          onSuccess={handleBiddingSuccess}
        />
      )}

    </div>
  );
};

export default ProductInfo;