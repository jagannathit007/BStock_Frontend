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
  totalProducts,
  showingProducts,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">View:</span>
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
        <span>
          Showing {showingProducts} of {totalProducts} products
        </span>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {/* <option>Sort by: Featured</option> */}
          <option>Sort by: Price Low to High</option>
          <option>Sort by: Price High to Low</option>
          <option>Sort by: Newest</option>
        </select>
      </div>
    </div>
  );
};

export default ViewControls;
