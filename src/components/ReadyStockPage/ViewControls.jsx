import React from "react";
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
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
      <div className="flex items-center space-x-4">
        {/* <span className="text-sm text-gray-600">View:</span> */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`px-3 py-1 cursor-pointer text-sm font-medium ${
              viewMode === "grid"
                ? "bg-white text-[#0071E0] rounded-md shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setViewMode("grid")}
          >
            <FontAwesomeIcon icon={faTableCellsLarge} className="mr-2" />
            Grid
          </button>
          <button
            className={`px-3 py-1 text-sm cursor-pointer font-medium ${
              viewMode === "list"
                ? "bg-white text-[#0071E0] rounded-md shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setViewMode("list")}
          >
            <FontAwesomeIcon icon={faList} className="mr-2" />
            List
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-3 text-sm text-gray-600">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E0]"
        />
        <select 
          value={sortOption}
          onChange={handleSortChange}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {/* <option value="">Sort by: Featured</option> */}
          <option value="price_asc">Sort by: Price Low to High</option>
          <option value="price_desc">Sort by: Price High to Low</option>
          <option value="newest">Sort by: Newest</option>
        </select>
      </div>
    </div>
  );
};

export default ViewControls;