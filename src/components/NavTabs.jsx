import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NavTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
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
    { 
      id: "Order", 
      name: "Your History", 
      path: "/order",
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
    <nav className="bg-white border-b border-gray-200/50 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 sm:space-x-6 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.id}
                className={`py-3 px-2 sm:px-1 border-b-2 whitespace-nowrap cursor-pointer transition-all duration-200 text-sm flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-[#0071E0]/20 focus:ring-offset-2
                  ${
                    isActive
                      ? "border-[#0071E0] text-[#0071E0] font-medium"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-normal"
                  }`}
                onClick={() => handleTabClick(tab.path)}
                aria-current={isActive ? "page" : undefined}
                role="tab"
                tabIndex="0"
              >
                <span className={`transition-colors duration-200 ${isActive ? "text-[#0071E0]" : "text-gray-500 group-hover:text-gray-700"}`}>
                  {tab.icon}
                </span>
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavTabs;
