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
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6">
      <div className="flex items-center space-x-4 w-full lg:w-auto">
        <div className="flex bg-gray-100 rounded-2xl p-1.5 w-full lg:w-auto">
          <button
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
          </button>
          <button
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
          </button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search auctions..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E0]/20 focus:border-[#0071E0] transition-all duration-200 bg-white font-apple placeholder-gray-400"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        <select 
          value={sortOption}
          onChange={handleSortChange}
          className="border border-gray-200 cursor-pointer rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E0]/20 focus:border-[#0071E0] transition-all duration-200 bg-white min-w-[180px] font-apple"
        >
          <option value="">Sort by: Featured</option>
          <option value="ending_soon">Sort by: Ending Soon</option>
          <option value="price_asc">Sort by: Starting Price Low to High</option>
          <option value="price_desc">Sort by: Starting Price High to Low</option>
          <option value="bids_desc">Sort by: Most Bids</option>
          <option value="bids_asc">Sort by: Least Bids</option>
          <option value="newest">Sort by: Newest</option>
        </select>
      </div>
    </div>
  );
};

export default ViewControls;
