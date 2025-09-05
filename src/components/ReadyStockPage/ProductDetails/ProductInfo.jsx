import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as solidHeart,
  faHeart as regularHeart,
  faCartShopping,
  faBolt,
  faCube,
  faMicrochip,
  faCamera,
  faShieldHalved,
  faTruckFast,
  faTruck,
  faArrowRotateLeft,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const ProductInfo = ({ product, navigate }) => {
  const [selectedColor, setSelectedColor] = useState("Natural Titanium");
  const [selectedStorage, setSelectedStorage] = useState("256GB");
  const [selectedGrade, setSelectedGrade] = useState("A+");
  const [quantity, setQuantity] = useState(5);
  const [isFavorite, setIsFavorite] = useState(false);

  const colors = [
    { name: "Natural Titanium", class: "bg-gray-200" },
    { name: "Blue", class: "bg-blue-600" },
    { name: "Black", class: "bg-black" },
    { name: "White", class: "bg-white border-2 border-gray-300" },
  ];

  const storageOptions = ["128GB", "256GB", "512GB", "1TB"];
  const gradeOptions = ["A+", "A", "B", "C"];

  const handleQuantityChange = (amount) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= product.moq) {
      setQuantity(newQuantity);
    }
  };

  const totalAmount = (
    parseInt(product.price.replace(/,/g, "")) * quantity
  ).toLocaleString();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-4 md:mb-6 flex items-center text-sm cursor-pointer mt-3">
        <button
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          Home
        </button>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column - Images & Gallery */}
        <div className="lg:col-span-5">
          {/* Main Image */}
          <div className="relative mb-4">
            <img
              className="w-full h-64 sm:h-[450px] object-cover rounded-xl bg-white border border-gray-200"
              src={product.mainImage}
              alt={product.name}
            />
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                Verified Seller
              </span>
              <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                {product.stockStatus}
              </span>
            </div>
            <button
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <FontAwesomeIcon
                icon={isFavorite ? solidHeart : regularHeart}
                className={`text-sm ${
                  isFavorite ? "text-red-500" : "text-gray-600"
                }`}
              />
            </button>
          </div>

          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-6">
            {product.thumbnails.map((thumbnail, index) => (
              <img
                key={index}
                className={`w-full h-14 sm:h-16 object-cover rounded-lg bg-white ${
                  index === 0
                    ? "border-2 border-blue-600"
                    : "border border-gray-200"
                } cursor-pointer hover:border-blue-600`}
                src={thumbnail}
                alt={`View ${index + 1}`}
              />
            ))}
            <div className="w-full h-14 sm:h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200">
              <span className="text-xs text-gray-600">+5 More</span>
            </div>
          </div>

          {/* Virtual Tour */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-blue-200">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center mb-2 sm:mb-0">
                <FontAwesomeIcon
                  icon={faCube}
                  className="text-blue-600 text-lg mr-3"
                />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                    360° Product View
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Interactive product exploration
                  </p>
                </div>
              </div>
              <button className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 w-full sm:w-auto">
                Launch
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Product Details */}
        <div className="lg:col-span-7">
          {/* Product Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {product.name}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {product.description}
                </p>
              </div>
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4">
              <div className="mb-2 sm:mb-0">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ${product.price}
                </span>
                <span className="text-base sm:text-lg text-gray-500 line-through ml-2 sm:ml-3">
                  ${product.originalPrice}
                </span>
                <span className="bg-green-500 text-white text-xs sm:text-sm font-medium px-2 py-1 rounded ml-2 sm:ml-3">
                  -{product.discountPercentage}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-gray-600">
                  Price per unit
                </p>
                <p className="text-xs text-gray-500">
                  Bulk discounts available
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">MOQ</span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {product.moq} units
                  </span>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-2 sm:p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Available
                  </span>
                  <span className="font-semibold text-green-500 text-sm sm:text-base">
                    {product.stockCount} units
                  </span>
                </div>
              </div>
            </div>

            {/* Price Calculator */}
            <div className="border-t pt-3 sm:pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">
                  Quantity
                </span>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= product.moq}
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                  </button>
                  <span className="w-10 sm:w-12 text-center font-medium text-sm sm:text-base">
                    {quantity}
                  </span>
                  <button
                    className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-blue-600">${totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-4 sm:mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4">
              Key Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {product.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <FontAwesomeIcon
                    icon={feature.icon}
                    className={`${feature.color} mr-2 sm:mr-3 text-sm sm:text-base`}
                  />
                  <span className="text-xs sm:text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {/* Storage */}
            <div>
              <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                Storage Options
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {storageOptions.map((storage) => (
                  <button
                    key={storage}
                    className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm ${
                      selectedStorage === storage
                        ? "border-2 border-blue-600 bg-blue-50 text-blue-600 font-medium"
                        : "border border-gray-300 hover:border-blue-600"
                    }`}
                    onClick={() => setSelectedStorage(storage)}
                  >
                    {storage}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                Color Options
              </h4>
              <div className="flex items-center space-x-2 sm:space-x-3">
                {colors.map((color) => (
                  <div
                    key={color.name}
                    className={`w-8 h-8 sm:w-10 sm:h-10 ${
                      color.class
                    } rounded-full border-2 ${
                      selectedColor === color.name
                        ? "border-blue-600"
                        : "border-transparent"
                    } cursor-pointer relative`}
                    onClick={() => setSelectedColor(color.name)}
                    title={color.name}
                  >
                    {selectedColor === color.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-blue-600 text-xs sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <span className="text-xs sm:text-sm text-gray-600 ml-1 sm:ml-2">
                  {selectedColor}
                </span>
              </div>
            </div>

            {/* Grade */}
            <div>
              <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                Grade Options
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {gradeOptions.map((grade) => (
                  <button
                    key={grade}
                    className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm ${
                      selectedGrade === grade
                        ? "border-2 border-blue-600 bg-blue-50 text-blue-600 font-medium"
                        : "border border-gray-300 hover:border-blue-600"
                    }`}
                    onClick={() => setSelectedGrade(grade)}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full bg-orange-500 text-white py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center">
              <FontAwesomeIcon icon={faCartShopping} className="mr-2" />
              Add to Cart
            </button>
            <button className="w-full bg-blue-600 text-white py-3 sm:py-4 px-6 rounded-lg text-base sm:text-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
              <FontAwesomeIcon icon={faBolt} className="mr-2" />
              Buy Now
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="flex flex-col items-center">
              <FontAwesomeIcon
                icon={faTruck}
                className="text-xl sm:text-2xl text-green-600 mb-1 sm:mb-2"
              />
              <span className="text-xs sm:text-sm text-gray-600">
                Free Delivery
              </span>
            </div>
            <div className="flex flex-col items-center">
              <FontAwesomeIcon
                icon={faArrowRotateLeft}
                className="text-xl sm:text-2xl text-blue-600 mb-1 sm:mb-2"
              />
              <span className="text-xs sm:text-sm text-gray-600">
                7 Days Return
              </span>
            </div>
            <div className="flex flex-col items-center">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="text-xl sm:text-2xl text-purple-600 mb-1 sm:mb-2"
              />
              <span className="text-xs sm:text-sm text-gray-600">Warranty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
