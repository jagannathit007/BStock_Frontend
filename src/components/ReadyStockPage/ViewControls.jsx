import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableCellsLarge,
  faList,
  faMobileScreen,
} from "@fortawesome/free-solid-svg-icons";

const ViewControls = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  setCurrentPage,
}) => {
  useEffect(() => {
    const savedViewMode = localStorage.getItem("preferredViewMode");
    if (savedViewMode === "grid" || savedViewMode === "list") {
      setViewMode(savedViewMode);
    }
  }, [setViewMode]);
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-6">
      <div className="flex items-center space-x-4 w-full lg:w-auto">
        <div className="flex bg-gray-100 rounded-2xl p-1.5 w-full lg:w-auto">
          <button
            className={`flex-1 lg:flex-none px-4 py-2 cursor-pointer text-sm font-medium rounded-xl transition-all duration-200 font-apple ${
              viewMode === "grid"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => {
     setViewMode("grid");
     localStorage.setItem("preferredViewMode", "grid");
   }}
          >
            <FontAwesomeIcon icon={faTableCellsLarge} className="mr-2" />
            <span className="hidden sm:inline">Grid</span>
            <span className="sm:hidden">Grid View</span>
          </button>
          <button
            className={`flex-1 lg:flex-none px-4 py-2 text-sm cursor-pointer font-medium rounded-xl transition-all duration-200 font-apple ${
              viewMode === "list"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => {
     setViewMode("list");
     localStorage.setItem("preferredViewMode", "list");
   }}
          >
            <FontAwesomeIcon icon={faList} className="mr-2" />
            <span className="hidden sm:inline">List</span>
            <span className="sm:hidden">List View</span>
          </button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
        <div className="relative flex-1">
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
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
          />
          {/* <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 border border-gray-200 rounded text-xs font-mono text-gray-500 bg-gray-100">
              ⌘K
            </kbd>
          </div> */}
        </div>
        <select 
          value={sortOption}
          onChange={handleSortChange}
          className="border border-gray-200 cursor-pointer rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white min-w-[180px] font-apple"
        >
          <option value="">Sort by: Featured</option>
          <option value="price_asc">Sort by: Price Low to High</option>
          <option value="price_desc">Sort by: Price High to Low</option>
          <option value="newest">Sort by: Newest</option>
        </select>
      </div>
    </div>
  );
};

export default ViewControls;