import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const SideFilter = ({ onClose }) => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedBiddingStatus, setSelectedBiddingStatus] = useState({
    liveBidding: true,
    endingSoon: true,
    myBids: false,
  });
  const [selectedStorage, setSelectedStorage] = useState([]);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);

  const handleBiddingStatusChange = (type) => {
    setSelectedBiddingStatus((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleStorageChange = (storage) => {
    setSelectedStorage((prev) =>
      prev.includes(storage)
        ? prev.filter((s) => s !== storage)
        : [...prev, storage]
    );
  };

  const handleGradeChange = (grade) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const handleColorChange = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color]
    );
  };

  const colors = [
    { name: "Black", class: "bg-gray-800" },
    { name: "Blue", class: "bg-blue-600" },
    { name: "Purple", class: "bg-purple-600" },
    { name: "Pink", class: "bg-pink-400" },
    { name: "White", class: "bg-white border-2 border-gray-300" },
    { name: "Gold", class: "bg-yellow-400" },
    { name: "Red", class: "bg-red-500" },
  ];

  const clearAllFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedBiddingStatus({
      liveBidding: true,
      endingSoon: true,
      myBids: false,
    });
    setSelectedStorage([]);
    setSelectedGrades([]);
    setSelectedColors([]);
  };

  return (
    <aside className="bg-white-50 rounded-[18px] shadow-sm border border-gray-200 h-fit sticky top-24">
      <div className="p-4 sm:p-6 pt-10">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            className="text-gray-400 hover:text-gray-500 lg:hidden"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Starting Price Range
          </h4>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Bidding Status */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Bidding Status
          </h4>
          <div className="space-y-2">
            {[
              {
                id: "liveBidding",
                label: "Live Bidding",
                checked: selectedBiddingStatus.liveBidding,
              },
              {
                id: "endingSoon",
                label: "Ending Soon",
                checked: selectedBiddingStatus.endingSoon,
              },
              {
                id: "myBids",
                label: "My Bids",
                checked: selectedBiddingStatus.myBids,
              },
            ].map((item) => (
              <label key={item.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleBiddingStatusChange(item.id)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
            <option>All Models</option>
            <option>iPhone 15 Series</option>
            <option>iPhone 14 Series</option>
            <option>iPhone 13 Series</option>
          </select>
        </div>

        {/* Storage */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Storage</h4>
          <div className="space-y-2">
            {["128GB", "256GB", "512GB", "1TB"].map((storage) => (
              <label key={storage} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedStorage.includes(storage)}
                  onChange={() => handleStorageChange(storage)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">{storage}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Grades */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Grades</h4>
          <div className="space-y-2">
            {["Grade A+", "Grade A", "Grade B"].map((grade) => (
              <label key={grade} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedGrades.includes(grade)}
                  onChange={() => handleGradeChange(grade)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">{grade}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Colors</h4>
          <div className="space-y-2">
            {colors.map((color) => (
              <label key={color.name} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color.name)}
                  onChange={() => handleColorChange(color.name)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">{color.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearAllFilters}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  );
};

export default SideFilter;