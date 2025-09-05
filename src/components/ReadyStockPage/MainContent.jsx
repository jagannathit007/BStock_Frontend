import React, { useState } from "react";
import ProductCard from "./ProductCard";
import SideFilter from "../SideFilter";
import ViewControls from "./ViewControls";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export const products = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    description: "256GB • Natural Titanium",
    price: "1,199",
    originalPrice: "1,299",
    discount: "100",
    moq: 5,
    stockStatus: "In Stock",
    stockCount: 47,
    imageUrl:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/3c400915fb-5d9209cb32fc1b5f022b.png",
    isFavorite: false,
    isOutOfStock: false,
  },
  {
    id: 2,
    name: "iPhone 15 Pro",
    description: "128GB • Blue Titanium",
    price: "999",
    originalPrice: "1,099",
    discount: "100",
    moq: 10,
    stockStatus: "In Stock",
    stockCount: 23,
    imageUrl:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/7458ea41c1-3c0cd1e16a04ae2ac69d.png",
    isFavorite: false,
    isOutOfStock: false,
  },
  {
    id: 3,
    name: "iPhone 14 Pro Max",
    description: "512GB • Deep Purple",
    price: "1,099",
    originalPrice: "1,199",
    discount: "100",
    moq: 5,
    stockStatus: "Low Stock",
    stockCount: 8,
    imageUrl:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/34a3f61667-bbc0c141e671c41ea802.png",
    isFavorite: false,
    isOutOfStock: false,
  },
  {
    id: 4,
    name: "iPhone 15",
    description: "128GB • Pink",
    price: "799",
    originalPrice: "829",
    discount: "30",
    moq: 15,
    stockStatus: "In Stock",
    stockCount: 156,
    imageUrl:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/001aef7d0a-45c73ca473efa53b8e08.png",
    isFavorite: true,
    isOutOfStock: false,
  },
  {
    id: 5,
    name: "iPhone 14 Pro",
    description: "256GB • Space Black",
    price: "899",
    originalPrice: "999",
    discount: "100",
    moq: 10,
    stockStatus: "In Stock",
    stockCount: 34,
    imageUrl:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/fda66a3b39-c6ffc867a1f62b5a63ce.png",
    isFavorite: false,
    isOutOfStock: false,
  },
  {
    id: 6,
    name: "iPhone 13 Pro Max",
    description: "1TB • Sierra Blue",
    price: "999",
    originalPrice: "1,099",
    discount: "100",
    moq: 5,
    stockStatus: "Out of Stock",
    stockCount: 0,
    imageUrl:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/bbd9690792-a8335c5e71b08e74873e.png",
    isFavorite: false,
    isOutOfStock: true,
  },
  {
    id: 7,
    name: "iPhone 15 Plus",
    description: "128GB • Blue",
    price: "899",
    originalPrice: "999",
    discount: "100",
    moq: 10,
    stockStatus: "In Stock",
    stockCount: 42,
    imageUrl:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/fbb4a94f91-b11a80d38dfa8acea074.png",
    isFavorite: false,
    isOutOfStock: false,
  },
];

const MainContent = () => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // You can adjust this number

  // Get current products
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {showMobileFilters && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-opacity-30 backdrop-blur-[1.5px]"
              onClick={() => setShowMobileFilters(false)}
            ></div>
            <div className="absolute left-0 top-0 h-full w-72 bg-white z-50 overflow-y-auto">
              <SideFilter onClose={() => setShowMobileFilters(false)} />
              <button
                className="w-full bg-[#0071E0] text-white py-3 px-4 text-sm font-medium lg:hidden"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        <div className="lg:w-72 hidden lg:block">
          <SideFilter />
        </div>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <button
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center"
              onClick={() => setShowMobileFilters(true)}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 512 512"
              >
                <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32H472c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9V448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6V320.9L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z" />
              </svg>
              Filters
            </button>
          </div>

          <ViewControls
            viewMode={viewMode}
            setViewMode={setViewMode}
            totalProducts={products.length}
            showingProducts={`${indexOfFirstProduct + 1}-${Math.min(
              indexOfLastProduct,
              products.length
            )}`}
          />

          {viewMode === "grid" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                  Previous
                </button>

                <div className="hidden md:flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                          currentPage === number
                            ? "bg-[#0071E0] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {number}
                      </button>
                    )
                  )}
                </div>

                <div className="md:hidden text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Next
                  <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Product
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Specifications
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Price
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Stock
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          MOQ
                        </th>
                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          viewMode={viewMode}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                  Previous
                </button>

                <div className="hidden md:flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                          currentPage === number
                            ? "bg-[#0071E0] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {number}
                      </button>
                    )
                  )}
                </div>

                <div className="md:hidden text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Next
                  <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainContent;
