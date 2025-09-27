import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NavTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: "ready-stock", name: "Ready Stock", path: "/ready-stock" },
    // { id: "flash-deals", name: "Flash Deals", path: "/flash-deals" },
    // { id: "bidding", name: "Bidding", path: "/bidding" },
    // { id: "watchlist", name: "Watchlist", path: "/watchlist" },
    { id: "Order", name: "Order", path: "/order" },
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
    <nav className="bg-[#fff] border-b border-gray-200 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6">
        <div className="flex space-x-8 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.id}
                className={`py-4 px-1 border-b-2 whitespace-nowrap cursor-pointer transition-colors duration-200
                  ${
                    isActive
                      ? "border-[#0071E0] text-[#0071E0] font-bold"
                      : "border-transparent text-gray-500 hover:text-gray-700 font-medium"
                  }`}
                onClick={() => handleTabClick(tab.path)}
              >
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
