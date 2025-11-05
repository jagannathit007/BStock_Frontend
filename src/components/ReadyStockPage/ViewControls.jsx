import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableCellsLarge,
  faList,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import CurrencyToggle from "../CurrencyToggle";

const ViewControls = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  setCurrentPage,
  onFilterClick,
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
    <div className="mb-6">
      {/* Mobile/Tablet View (< lg) */}
      <div className="flex flex-col lg:hidden gap-4">
        {/* Top: Search Field */}
        <div className="relative w-full">
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
        </div>

        {/* Middle Row: View, Sort, Filter */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: View Buttons */}
          <div className="flex bg-gray-100 rounded-xl p-1.5">
            <button
              className={`px-4 py-2 cursor-pointer text-sm font-medium rounded-lg transition-all duration-200 ${
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
              <span>Grid</span>
            </button>
            <button
              className={`px-4 py-2 text-sm cursor-pointer font-medium rounded-lg transition-all duration-200 ${
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
              <span>List</span>
            </button>
          </div>

          {/* Middle: Sort By */}
          <div className="flex-1 max-w-xs">
            <select 
              value={sortOption}
              onChange={handleSortChange}
              className="w-full border border-gray-200 cursor-pointer rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white font-apple"
            >
              <option value="">Sort by: Featured</option>
              <option value="price_asc">Sort by: Price Low to High</option>
              <option value="price_desc">Sort by: Price High to Low</option>
              <option value="newest">Sort by: Newest</option>
            </select>
          </div>

          {/* Right: Filter Icon */}
          {onFilterClick && (
            <button
              onClick={onFilterClick}
              className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center"
              title="Open Filters"
            >
              <FontAwesomeIcon icon={faFilter} className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Bottom Row: Currency Toggle */}
        <div className="flex items-center justify-start">
          <CurrencyToggle />
        </div>
      </div>

      {/* Desktop View (>= lg) - Original Layout */}
      <div className="hidden lg:flex flex-row items-center justify-between gap-6">
        {/* Left: View Buttons and Currency Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-2xl p-1.5">
            <button
              className={`px-4 py-2 cursor-pointer text-sm font-medium rounded-xl transition-all duration-200 font-apple ${
                viewMode === "grid"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => {
                setViewMode("grid");
                localStorage.setItem("preferredViewMode", "grid");
              }}
            >
              <FontAwesomeIcon icon={faTableCellsLarge} className="" />
              <span className="hidden sm:inline md:hidden xl:inline ml-2">Grid</span>
              <span className="sm:hidden ml-2">Grid View</span>
            </button>
            <button
              className={`px-4 py-2 text-sm cursor-pointer font-medium rounded-xl transition-all duration-200 font-apple ${
                viewMode === "list"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => {
                setViewMode("list");
                localStorage.setItem("preferredViewMode", "list");
              }}
            >
              <FontAwesomeIcon icon={faList} className="" />
              <span className="hidden sm:inline md:hidden xl:inline ml-2">List</span>
              <span className="sm:hidden ml-2">List View</span>
            </button>
          </div>
          
          {/* Currency Toggle Buttons */}
          <CurrencyToggle />
        </div>

        {/* Right: Search and Sort */}
        <div className="flex flex-row items-center space-x-4">
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
              className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 min-w-[300px]"
            />
          </div>
          <select 
            value={sortOption}
            onChange={handleSortChange}
            className="border border-gray-200 cursor-pointer rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white min-w-[180px] font-apple"
          >
            <option value="">Sort by: Featured</option>
            <option value="price_asc">Sort by: Price Low to High</option>
            <option value="price_desc">Sort by: Price High to Low</option>
            <option value="newest">Sort by: Newest</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ViewControls;