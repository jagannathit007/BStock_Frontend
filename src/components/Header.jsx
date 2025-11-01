import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Handshake } from "lucide-react";
import CartService from "../services/cart/cart.services";
import { WalletService } from "../services/wallet/wallet.services";
import { env } from "../utils/env";
import NegotiationModal from "./negotiation/NegotiationModal";
import WatchlistModal from "./WishListPage/WatchlistModal";
import WalletModal from "./WalletTransactionsPage/WalletTransactions";
import { convertPrice } from "../utils/currencyUtils";

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      if (!isLoggedIn) {
        setCartItemCount(0);
        return;
      }
      const count = await CartService.count();
      setCartItemCount(count || 0);
    } catch (error) {
      console.error("Fetch cart count error:", error);
      setCartItemCount(0);
    }
  };

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      if (!isLoggedIn) {
        setWalletBalance(0);
        return;
      }
      const response = await WalletService.getWallet();
      if (response.status === 200 && response.data) {
        setWalletBalance(parseFloat(response.data.balance) || 0);
      } else {
        setWalletBalance(0);
      }
    } catch (error) {
      console.error("Fetch wallet balance error:", error);
      setWalletBalance(0);
    }
  };


  useEffect(() => {
    const loadData = async () => {
      await fetchCartCount();
      await fetchWalletBalance();
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchCartCount();
      await fetchWalletBalance();
    };
    loadData();
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      navigate("/login");
    }
  };

  const handleProfileNavigation = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  // removed duplicate simple cart click; unified below with auth-redirect

  const handleNegotiationClick = () => {
    // Check both isLoggedIn and token existence
    const token = localStorage.getItem('token');
    if (!isLoggedIn || !token) {
      try { localStorage.setItem('postLoginAction', JSON.stringify({ type: 'negotiations' })); } catch {}
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    setIsNegotiationModalOpen(true);
  };

  const handleWishlistClick = () => {
    // Check both isLoggedIn and token existence
    const token = localStorage.getItem('token');
    if (!isLoggedIn || !token) {
      try { localStorage.setItem('postLoginAction', JSON.stringify({ type: 'wishlist' })); } catch {}
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    setIsWishlistModalOpen(true);
  };

  const handleWatchlistNavigation = () => {
    navigate("/profile?tab=watchlist");
    setIsDropdownOpen(false);
  };

  const handleWalletClick = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      try { localStorage.setItem('postLoginAction', JSON.stringify({ type: 'wallet' })); } catch {}
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    setIsWalletModalOpen(true);
  };

  const handleOrderHistoryClick = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      // Direct user back to orders page after login
      const returnTo = encodeURIComponent('/order');
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    navigate("/order");
    setIsDropdownOpen(false);
  };

  const handleCartClick = () => {
    if (!isLoggedIn) {
      // Direct user back to cart after login
      const returnTo = encodeURIComponent('/cart');
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    navigate("/cart");
  };

  const handleLoginClick = () => {
    const hashPath = window.location.hash?.slice(1) || '/home';
    const returnTo = encodeURIComponent(hashPath);
    navigate(`/login?returnTo=${returnTo}`);
  };

  const toAbsoluteUrl = (p) => {
    if (!p || typeof p !== "string") return null;
    const normalized = p.replace(/\\/g, "/");
    if (/^https?:\/\//i.test(normalized)) return normalized;
    return `${env.baseUrl}/${normalized.replace(/^\//, "")}`;
  };

  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      const storedDirect = localStorage.getItem("profileImageUrl");
      if (storedDirect) return storedDirect;
      const raw = localStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw);
        const url = toAbsoluteUrl(user?.profileImage || user?.avatar);
        if (url) return url;
      }
    } catch (error) {
      console.error('Error parsing user data for avatar:', error);
    }
    return "";
  });

  const [userName, setUserName] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        return user?.name || "";
      }
    } catch (error) {
      console.error('Error parsing user data for name:', error);
    }
    return "";
  });

  useEffect(() => {
    const applyAvatar = () => {
      const storedDirect = localStorage.getItem("profileImageUrl");
      if (storedDirect) {
        setAvatarUrl(storedDirect);
        return;
      }
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const user = JSON.parse(raw);
          const url = toAbsoluteUrl(user?.profileImage || user?.avatar);
          if (url) {
            setAvatarUrl(url);
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing user data in applyAvatar:', error);
      }
      setAvatarUrl("");
    };

    const applyUserName = () => {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          setUserName(user?.name || "");
        }
      } catch (error) {
        console.error('Error parsing user data in applyUserName:', error);
      }
    };

    applyAvatar();
    applyUserName();

    const onStorage = (e) => {
      if (e.key === "profileImageUrl" || e.key === "user") {
        applyAvatar();
        applyUserName();
      }
      if (e.key === 'postLoginAction' || e.key === 'isLoggedIn') {
        processPostLoginAction();
      }
    };

    const onProfileUpdate = () => {
      applyAvatar();
      applyUserName();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('profileUpdated', onProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('profileUpdated', onProfileUpdate);
    };
  }, []);

  // Open any post-login header modal if requested before login
  const processPostLoginAction = () => {
    try {
      const isNowLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const token = localStorage.getItem('token');
      const raw = localStorage.getItem('postLoginAction');
      if (!isNowLoggedIn || !token || !raw) return;
      const { type } = JSON.parse(raw);
      if (type === 'wallet') setIsWalletModalOpen(true);
      if (type === 'wishlist') {
        // Double-check token before opening wishlist
        if (token) {
          setIsWishlistModalOpen(true);
        }
      }
      if (type === 'negotiations') {
        // Double-check token before opening negotiations
        if (token) {
          setIsNegotiationModalOpen(true);
        }
      }
      localStorage.removeItem('postLoginAction');
    } catch {}
  };

  useEffect(() => {
    processPostLoginAction();
  }, [location.pathname]);

  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  useEffect(() => {
    const resetImageError = () => {
      setImageError(false);
    };
    resetImageError();
  }, [avatarUrl]);

  const hasImage = useMemo(() => {
    return avatarUrl && avatarUrl.trim() !== '';
  }, [avatarUrl]);

  const getInitials = useMemo(() => {
    if (!userName) return 'U';
    const words = userName.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }, [userName]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-2 sm:px-4 md:px-6 xl:px-[80px]">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    XGSM
                  </h1>
                  <p className="text-xs text-gray-500 font-medium hidden sm:block">
                    Electronics Trading Platform
                  </p>
                </div>
              </div>
            </div>


            {/* Right Side */}
            <div className="flex items-center space-x-2">

              {/* Wallet Info - Only show when logged in */}
              {isLoggedIn && (
                <button
                  onClick={handleWalletClick}
                  className="hidden lg:flex items-center space-x-2 cursor-pointer px-4 py-2 hover:bg-gray-50 rounded-lg border border-gray-200"
                  title="My Wallet"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-500 font-medium">Balance</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {convertPrice(walletBalance)}
                      </span>
                    </div>
                  </div>
                </button>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center space-x-1">
                {/* Negotiations - Only show when logged in */}
                {isLoggedIn && (
                  <button
                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg relative cursor-pointer group"
                    onClick={handleNegotiationClick}
                    title="My Negotiations"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                )}

                    {/* Wishlist */}
                <button
                  className={`${!isLoggedIn ? 'px-3 py-2' : 'p-2.5'} text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg relative cursor-pointer group flex items-center space-x-2`}
                  onClick={handleWishlistClick}
                  title="My Wishlist"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                  {!isLoggedIn && (
                    <span className="hidden lg:inline-block text-sm font-medium">Wishlist</span>
                  )}
                </button>

                {/* Cart */}
                <button
                  className={`${!isLoggedIn ? 'px-3 py-2' : 'p-2.5'} text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg relative cursor-pointer group flex items-center space-x-2`}
                  onClick={handleCartClick}
                  title="My Cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart-icon lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                  {isLoggedIn && cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-sm">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                  {!isLoggedIn && (
                    <span className="hidden lg:inline-block text-sm font-medium">Cart</span>
                  )}
                </button>

              {/* Login button when not authenticated */}
              {!isLoggedIn && (
                <button
                  onClick={handleLoginClick}
                  className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  title="Login"
                >
                  Login
                </button>
              )}
              </div>

              {/* Profile Dropdown (only when logged in) */}
              {isLoggedIn && (
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 border border-gray-200"
                    onClick={handleProfileClick}
                  >
                    {hasImage ? (
                      <img
                        src={imageError ? "/images/avtar.jpg" : avatarUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border-2 border-gray-200 object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {getInitials}
                        </span>
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
                      <p className="text-xs text-gray-500">Account</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          {hasImage ? (
                            <img
                              src={imageError ? "/images/avtar.jpg" : avatarUrl}
                              alt="Profile"
                              className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                              onError={handleImageError}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full border border-gray-200 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {getInitials}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{userName || 'User'}</p>
                            <p className="text-xs text-gray-500">Member since 2024</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={handleProfileNavigation}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Settings
                        </button>

                        <button
                          onClick={handleWalletClick}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Wallet & Payments
                        </button>

                        <button
                          onClick={handleOrderHistoryClick}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Order History
                        </button>
                        
                        <button
                        onClick={handleWatchlistNavigation}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                        My Watchlist
                      </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* Negotiation Modal */}
      <NegotiationModal
        isOpen={isNegotiationModalOpen}
        onClose={() => setIsNegotiationModalOpen(false)}
        userType="customer"
      />

      {/* Watchlist Modal */}
      <WatchlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
      />

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
};

export default Header;