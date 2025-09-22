import React, { useState, useRef, useEffect } from "react";
import { env } from "../utils/env";
import { useNavigate } from "react-router-dom";

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const toAbsoluteUrl = (p) => {
    if (!p || typeof p !== 'string') return null;
    const normalized = p.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalized)) return normalized;
    return `${env.baseUrl}/${normalized.replace(/^\//, '')}`;
  };

  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      const storedDirect = localStorage.getItem('profileImageUrl');
      if (storedDirect) return storedDirect;
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        const url = toAbsoluteUrl(user?.profileImage || user?.avatar);
        if (url) return url;
      }
    } catch {}
    return "";
  });

  useEffect(() => {
    const applyAvatar = () => {
      const storedDirect = localStorage.getItem('profileImageUrl');
      if (storedDirect) {
        setAvatarUrl(storedDirect);
        return;
      }
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          const url = toAbsoluteUrl(user?.profileImage || user?.avatar);
          if (url) {
            setAvatarUrl(url);
            return;
          }
        }
      } catch {}
      setAvatarUrl("");
    };
    applyAvatar();
    const onStorage = (e) => {
      if (e.key === 'profileImageUrl' || e.key === 'user') {
        applyAvatar();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      <header className="bg-[#fff] shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always visible */}
            <div className="flex items-center flex-shrink-0">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-[#0071E0] rounded-lg mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 384 512"
                >
                  <path d="M16 64C16 28.7 44.7 0 80 0H304c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H80c-35.3 0-64-28.7-64-64V64zM224 448a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM304 64H80V384H304V64z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                xGSM Bidding
              </h1>
            </div>

            <div className="flex-1 mx-4 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 512 512"
                  >
                    <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base 
             focus:border-[#0071E0] focus:ring-1 focus:ring-[#0071E0] outline-none"
                  placeholder="Search iPhone models..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 512 512"
                >
                  <path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64H80c-8.8 0-16-7.2-16-16s7.2-16 16-16H448c17.7 0 32-14.3 32-32s-14.3-32-32-32H64zM416 272a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  $2,450.00
                </span>
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 576 512"
                >
                  <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <div
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1 transition-colors duration-200"
                  onClick={handleProfileClick}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-200" />
                  )}
                </div>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100 animate-fadeIn">
                    <div className="py-1">
                      <button
                        onClick={handleProfileNavigation}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0071E0] transition-colors duration-150"
                      >
                        <i className="fas fa-user w-4 h-4 mr-3 text-gray-400"></i>
                        Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                      >
                        <i className="fas fa-sign-out-alt w-4 h-4 mr-3 text-red-500"></i>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
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
    </>
  );
};

export default Header;
