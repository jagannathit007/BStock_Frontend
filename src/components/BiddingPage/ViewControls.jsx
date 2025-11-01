import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableCellsLarge,
  faList,
} from "@fortawesome/free-solid-svg-icons";

const ViewControls = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  setCurrentPage,
  onFiltersClick,
  filters,
}) => {
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center mb-8 gap-6 lg:gap-0">
      <div className="flex items-center space-x-4 w-full lg:hidden lg:flex-shrink-0">
        {/* <div className="flex bg-gray-100 rounded-2xl p-1.5 w-full lg:w-auto"> */}
          {/* <button
            className={`flex-1 lg:flex-none px-4 py-3 cursor-pointer text-sm font-medium rounded-xl transition-all duration-200 font-apple ${
              viewMode === "grid"
                ? "bg-white text-[#0071E0] shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setViewMode("grid")}
          >
            <FontAwesomeIcon icon={faTableCellsLarge} className="mr-2" />
            <span className="hidden sm:inline">Grid</span>
            <span className="sm:hidden">Grid View</span>
          </button> */}
          {/* <button
            className={`flex-1 lg:flex-none px-4 py-3 text-sm cursor-pointer font-medium rounded-xl transition-all duration-200 font-apple ${
              viewMode === "list"
                ? "bg-white text-[#0071E0] shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setViewMode("list")}
          >
            <FontAwesomeIcon icon={faList} className="mr-2" />
            <span className="hidden sm:inline">List</span>
            <span className="sm:hidden">List View</span>
          </button> */}
        {/* </div> */}
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:flex-1 lg:min-w-0">
        <div className="relative flex-1 min-w-0">
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
            placeholder="Search auctions, products..."
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
        <div className="flex items-center gap-2 sm:gap-3">
          <select 
            value={sortOption}
            onChange={handleSortChange}
            className="flex-1 sm:flex-none border border-gray-200 cursor-pointer rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E0]/20 focus:border-[#0071E0] transition-all duration-200 bg-white sm:min-w-[180px] font-apple"
          >
            <option value="">Sort by: Featured</option>
            <option value="ending_soon">Sort by: Ending Soon</option>
            <option value="price_asc">Sort by: Starting Price Low to High</option>
            <option value="price_desc">Sort by: Starting Price High to Low</option>
            <option value="bids_desc">Sort by: Most Bids</option>
            <option value="bids_asc">Sort by: Least Bids</option>
            <option value="newest">Sort by: Newest</option>
          </select>
          {/* Mobile Filters Button */}
          {onFiltersClick && (
            <button
              onClick={onFiltersClick}
              className="lg:hidden relative flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-[#0071E0] transition-all duration-200 shadow-sm active:scale-95"
              aria-label="Filters"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {/* Filter count badge */}
              {filters && (
                (filters.grade?.length > 0 || filters.models?.length > 0 || filters.capacities?.length > 0 || filters.carriers?.length > 0 || filters.minPrice || filters.maxPrice) && (
                  <span className="absolute -top-1 -right-1 bg-[#0071E0] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {[filters.grade?.length, filters.models?.length, filters.capacities?.length, filters.carriers?.length].reduce((a, b) => (a || 0) + (b || 0), 0) + (filters.minPrice || filters.maxPrice ? 1 : 0)}
                  </span>
                )
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewControls;
