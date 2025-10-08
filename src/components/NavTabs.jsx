import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NavTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { 
      id: "home", 
      name: "Home", 
      path: "/home",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      )
    },
    { 
      id: "ready-stock", 
      name: "Ready Stock", 
      path: "/ready-stock",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>
      )
    },
    { 
      id: "flash-deals", 
      name: "Flash Deals", 
      path: "/flash-deals",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      )
    },
    { 
      id: "bidding", 
      name: "Bidding", 
      path: "/bidding",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      )
    },
  ];

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const exactMatch = tabs.find((tab) => currentPath === tab.path);
    if (exactMatch) return exactMatch.name;
    const startsWithMatch = tabs.find(
      (tab) => tab.path !== "/" && currentPath.startsWith(tab.path)
    );
    if (startsWithMatch) return startsWithMatch.name;
    if (currentPath === "/ready-stock") return "Ready Stock";
    return null;
  };

  const activeTab = getActiveTab();

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 overflow-x-auto sticky top-16 z-40 animate-slideUp">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex space-x-8 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.id}
                className={`relative py-4 whitespace-nowrap cursor-pointer transition-all duration-300 text-sm flex items-center gap-2 group focus:outline-none hover:scale-105
                  ${
                    isActive
                      ? "text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700 font-normal"
                  }`}
                onClick={() => handleTabClick(tab.path)}
                aria-current={isActive ? "page" : undefined}
                role="tab"
                tabIndex="0"
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"></div>
                )}
                
                
                <span className={`transition-colors duration-200 ${
                  isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"
                }`}>
                  {tab.icon}
                </span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavTabs;
