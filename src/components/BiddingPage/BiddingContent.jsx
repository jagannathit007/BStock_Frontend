import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableCellsLarge,
  faList,
  faMobileScreen,
  faGavel,
  faEye,
  faEyeSlash,
  faCrown,
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
  faTimes,
  faBuilding,
  faPhone,
  faEnvelope,
  faUser,
  faMapMarkerAlt,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import BiddingProductDetails from "./BiddingProductDetails";
import SideFilter from "../SideFilter";
import BusinessDetailsPopup from "./BusinessDetailsPopup";

const BiddingContent = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [showBidValues, setShowBidValues] = useState(false);
  const [showBusinessPopup, setShowBusinessPopup] = useState(false);

  const biddingProducts = [
    {
      id: 1,
      name: "iPhone 15 Pro Max",
      modelName: "iPhone 15 Pro Max",
      description: "256GB • Natural Titanium • Grade A+",
      color: "Natural Titanium",
      grade: "Grade A+",
      currentBid: "$1,245",
      startingPrice: "$999",
      lastReference: "$1,299",
      lastInfo: "Last sale: 2 days ago",
      lotInfo: "Lot #12345",
      bids: 23,
      timer: "2h 34m 12s",
      imageUrl:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/90fea2a54b-7fe8f6b9faf5b4f741c2.png",
      isLeading: false,
    },
    {
      id: 2,
      name: "iPhone 15 Pro",
      modelName: "iPhone 15 Pro",
      description: "128GB • Blue Titanium • Grade A",
      color: "Blue Titanium",
      grade: "Grade A",
      currentBid: "$1,045",
      startingPrice: "$849",
      lastReference: "$1,099",
      lastInfo: "Last sale: 1 day ago",
      lotInfo: "Lot #12346",
      bids: 18,
      timer: "4h 18m 45s",
      imageUrl:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/80b089ef6f-c00c46c1f05b11119414.png",
      isLeading: false,
    },
    {
      id: 3,
      name: "iPhone 14 Pro Max",
      modelName: "iPhone 14 Pro Max",
      description: "512GB • Deep Purple • Grade A+",
      color: "Deep Purple",
      grade: "Grade A+",
      currentBid: "$1,156",
      startingPrice: "$899",
      lastReference: "$1,199",
      lastInfo: "Last sale: 3 days ago",
      lotInfo: "Lot #12347",
      bids: 31,
      timer: "1h 12m 08s",
      imageUrl:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/0366903b66-d50587746fa14e36ae3b.png",
      isLeading: true,
    },
    {
      id: 4,
      name: "iPhone 15",
      modelName: "iPhone 15",
      description: "128GB • Pink • Grade A",
      color: "Pink",
      grade: "Grade A",
      currentBid: "$845",
      startingPrice: "$749",
      lastReference: "$899",
      lastInfo: "Last sale: 5 days ago",
      lotInfo: "Lot #12348",
      bids: 15,
      timer: "6h 42m 33s",
      imageUrl:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/3fce268c5e-b4af47c76dc9303b034b.png",
      isLeading: false,
    },
  ];

  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = biddingProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(biddingProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleProductClick = (product) => {
    if (showBidValues) {
      setSelectedProduct(product);
    }
  };

  const handleButtonClick = (e, product) => {
    e.stopPropagation();
    if (showBidValues) {
      setSelectedProduct(product);
    } else {
      setShowBusinessPopup(true);
    }
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
  };

  const renderBidValue = (value) => {
    if (!showBidValues) {
      return (
        <span className="blur-sm select-none" style={{ userSelect: "none" }}>
          {value.replace(/./g, "•")}
        </span>
      );
    }
    return value;
  };

  if (selectedProduct && showBidValues) {
    return (
      <BiddingProductDetails
        product={selectedProduct}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 min-h-screen">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium flex items-center justify-center cursor-pointer hover:bg-gray-50"
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

        {/* Mobile Filters Overlay */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-opacity-30 backdrop-blur-[1.5px] cursor-pointer"
              onClick={() => setShowMobileFilters(false)}
            ></div>
            <div className="absolute left-0 top-0 h-full w-72 bg-white z-50 overflow-y-auto">
              <SideFilter onClose={() => setShowMobileFilters(false)} />
              <button
                className="w-full bg-[#0071E0] text-white py-3 px-4 text-sm font-medium lg:hidden sticky bottom-0 cursor-pointer hover:bg-blue-800"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block lg:w-80">
          <SideFilter />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* View Controls */}
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
                <button
                  className={`px-3 py-1 text-sm cursor-pointer font-medium ${
                    viewMode === "mobile"
                      ? "bg-white text-[#0071E0] rounded-md shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setViewMode("mobile")}
                >
                  <FontAwesomeIcon icon={faMobileScreen} className="mr-2" />
                  Mobile
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              {/* Toggle Switch for Bid Values */}
              <div className="flex items-center space-x-2">
              
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showBidValues}
                    onChange={() => setShowBidValues(!showBidValues)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm cursor-pointer">
                <option>Sort by Ending Soon</option>
                <option>Sort by Starting Price</option>
                <option>Sort by Bid Count</option>
              </select>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === "grid" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                {currentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-[18px]  shadow-[2px_4px_12px_#00000014] hover:shadow-[6px_8px_24px_#00000026]   overflow-hidden  transition-shadow flex flex-col cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        className="w-full h-48 object-cover"
                        src={product.imageUrl}
                        alt={product.name}
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Live
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {product.description}
                      </p>

                      <div className="mb-4 flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">
                            Current Bid
                          </span>
                          <span className="text-sm text-gray-600">
                            {renderBidValue(`${product.bids} bids`)}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-[#0071E0]">
                          {renderBidValue(product.currentBid)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Starting: {renderBidValue(product.startingPrice)}
                        </div>
                        <div className="text-sm text-red-600 font-medium mt-2">
                          Timer: {product.timer}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          className={`flex-1 px-4 py-2 rounded-3xl text-sm font-medium h-10 flex items-center justify-center cursor-pointer ${
                            product.isLeading
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-[#0071E0] text-white hover:bg-blue-800"
                          }`}
                          onClick={(e) => handleButtonClick(e, product)}
                        >
                          <FontAwesomeIcon
                            icon={product.isLeading ? faCrown : faGavel}
                            className="mr-2"
                          />
                          {product.isLeading ? "Leading Bid" : "Place Bid"}
                        </button>
                        <button
                          className="border border-gray-300 rounded-lg hover:bg-gray-50 h-10 w-10 flex items-center justify-center cursor-pointer"
                          onClick={(e) => handleButtonClick(e, product)}
                        >
                          <FontAwesomeIcon
                            icon={showBidValues ? faEye : faEyeSlash}
                            className="text-gray-600"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
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
                        className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
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
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
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
          ) : viewMode === "list" ? (
            <>
              <div className="flex-1 flex flex-col">
                <div className="overflow-y-auto flex-1">
                  <div className="space-y-4 pb-4">
                    {currentProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                          {/* Product Image */}
                          <div className="relative flex-shrink-0">
                            <img
                              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                              src={product.imageUrl}
                              alt={product.name}
                            />
                            <div className="absolute -top-1 -right-1">
                              <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                Live
                              </span>
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-[180px]">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 sm:mb-3">
                              {product.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1 sm:gap-y-2 text-xs sm:text-sm text-gray-600">
                              <span>
                                Current Bid:{" "}
                                <span className="font-semibold text-[#0071E0]">
                                  {renderBidValue(product.currentBid)}
                                </span>
                              </span>
                              <span>
                                Starting:{" "}
                                {renderBidValue(product.startingPrice)}
                              </span>
                              <span>
                                {renderBidValue(`${product.bids} bids`)}
                              </span>
                            </div>
                          </div>

                          {/* Timer */}
                          <div className="text-center flex-shrink-0">
                            <div className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">
                              Time Left
                            </div>
                            <div className="text-base sm:text-lg font-bold text-red-600">
                              {product.timer}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <button
                              className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center cursor-pointer ${
                                product.isLeading
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-[#0071E0] text-white hover:bg-blue-800"
                              }`}
                              onClick={(e) => handleButtonClick(e, product)}
                            >
                              <FontAwesomeIcon
                                icon={product.isLeading ? faCrown : faGavel}
                                className="mr-1 sm:mr-2"
                              />
                              {product.isLeading ? "Leading Bid" : "Place Bid"}
                            </button>
                            <button
                              className="border border-gray-300 rounded-lg hover:bg-gray-50 h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center cursor-pointer"
                              onClick={(e) => handleButtonClick(e, product)}
                            >
                              <FontAwesomeIcon
                                icon={showBidValues ? faEye : faEyeSlash}
                                className="text-gray-600"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
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
                        className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
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
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
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
            // Mobile View
            <>
              <div className="flex flex-col gap-4 pb-6">
                {currentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row bg-white border border-gray-200 rounded-xl p-4 gap-4 cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Image Section */}
                    <div className="relative flex-shrink-0 w-full sm:w-32 h-48 sm:h-36">
                      <img
                        className="w-full h-full object-contain sm:object-cover rounded-lg bg-gray-50"
                        src={product.imageUrl}
                        alt={product.modelName}
                      />
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded font-bold shadow">
                        LIVE
                      </span>
                    </div>

                    {/* Product Info Section */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 sm:gap-x-2 sm:gap-y-1 items-center">
                      <div className="font-semibold text-sm text-gray-900 sm:col-span-1">
                        Model name
                      </div>
                      <div className="text-sm font-medium text-gray-700 sm:col-span-2">
                        {product.modelName}
                      </div>

                      <div className="font-semibold text-sm text-gray-900 sm:col-span-1">
                        Color
                      </div>
                      <div className="text-sm font-medium text-gray-700 sm:col-span-2">
                        {product.color}
                      </div>

                      <div className="font-semibold text-sm text-gray-900 sm:col-span-1">
                        Grade
                      </div>
                      <div className="text-sm font-medium text-gray-700 sm:col-span-2">
                        {product.grade}
                      </div>

                      <div className="font-semibold text-sm text-gray-900 sm:col-span-1">
                        Current Bid
                      </div>
                      <div className="text-sm font-bold text-[#0071E0] sm:col-span-2">
                        {renderBidValue(product.currentBid)}
                      </div>

                      <div className="font-semibold text-sm text-gray-900 sm:col-span-1">
                        Bids
                      </div>
                      <div className="text-sm font-medium text-gray-700 sm:col-span-2">
                        {renderBidValue(`${product.bids} bids`)}
                      </div>

                      <div className="font-semibold text-sm text-gray-900 sm:col-span-1">
                        Reference last
                      </div>
                      <div className="text-sm font-bold text-gray-900 sm:col-span-2">
                        {product.lastReference}
                      </div>

                      <div className="text-xs text-gray-500 sm:col-span-1">
                        {product.lastInfo}
                      </div>
                      <div className="text-xs text-gray-500 sm:col-span-1">
                        {product.lotInfo}
                      </div>
                      <div className="text-xs text-red-600 font-medium sm:col-span-1">
                        {product.timer}
                      </div>
                    </div>

                    {/* Button Section */}
                    <div className="flex sm:flex-col justify-between sm:justify-center gap-2 sm:w-32">
                      <button
                        className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
                          product.isLeading
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-[#0071E0] text-white hover:bg-blue-800"
                        }`}
                        onClick={(e) => handleButtonClick(e, product)}
                      >
                        {product.isLeading ? "Leading Bid" : "Place Bid"}
                      </button>
                      <button
                        className="border border-gray-300 text-gray-700 font-semibold rounded px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={(e) => handleButtonClick(e, product)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
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
                        className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
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
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
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
        </main>
      </div>

      {/* Business Details Popup */}
      {showBusinessPopup && (
        <BusinessDetailsPopup
          onClose={() => setShowBusinessPopup(false)}
          onContinue={() => setShowBidValues(true)}
        />
      )}
    </>
  );
};

export default BiddingContent;
