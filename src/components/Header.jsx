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

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
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

  const handleCartClick = () => {
    navigate("/cart");
  };

  const handleNegotiationClick = () => {
    setIsNegotiationModalOpen(true);
  };

  const handleWishlistClick = () => {
    setIsWishlistModalOpen(true);
  };

  const handleWatchlistNavigation = () => {
    navigate("/profile?tab=watchlist");
    setIsDropdownOpen(false);
  };

  const handleWalletClick = () => {
    setIsWalletModalOpen(true);
  };

  const handleOrderHistoryClick = () => {
    navigate("/order");
    setIsDropdownOpen(false);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex items-center space-x-3 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm animate-float">
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

            {/* Search bar */}
            <div className="flex-1 mx-6 max-w-2xl hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                  placeholder="Search products, brands, models..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <kbd className="hidden sm:inline-flex items-center px-2 py-1 border border-gray-200 rounded text-xs font-mono text-gray-500 bg-gray-100">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2">
              {/* Mobile Search Button */}
              <button className="md:hidden p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Wallet Info */}
              <button
                onClick={handleWalletClick}
                className="hidden lg:flex items-center space-x-2 cursor-pointer px-4 py-2 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200"
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

              {/* Navigation Buttons */}
              <div className="flex items-center space-x-1">
                {/* Negotiations */}
                <button
                  className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg relative cursor-pointer transition-all duration-200 group"
                  onClick={handleNegotiationClick}
                  title="My Negotiations"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>

                    {/* Wishlist */}
                <button
                  className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg relative cursor-pointer transition-all duration-200 group"
                  onClick={handleWishlistClick}
                  title="My Wishlist"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {/* Cart */}
                <button
                  className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg relative cursor-pointer transition-all duration-200 group"
                  onClick={handleCartClick}
                  title="My Cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart-icon lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-sm">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile Dropdown */}
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-all duration-200 border border-gray-200"
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
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200 animate-fadeIn">
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
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Settings
                      </button>

                      <button
                        onClick={handleWalletClick}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Wallet & Payments
                      </button>

                      <button
                        onClick={handleOrderHistoryClick}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Order History
                      </button>

                      <button
                        onClick={handleWatchlistNavigation}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        My Watchlist
                      </button>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
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
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}</style>
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