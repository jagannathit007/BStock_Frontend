import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { ProductService } from '../services/products/products.services'; // Adjust the import path to your ProductService

const SideFilter = ({ onClose, onFilterChange }) => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minMoq, setMinMoq] = useState("");
  const [maxMoq, setMaxMoq] = useState("");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [selectedSimTypes, setSelectedSimTypes] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState([]);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedRams, setSelectedRams] = useState([]);
  const [filtersData, setFiltersData] = useState(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const data = await ProductService.getFilters();
        setFiltersData(data);
      } catch (err) {
        // Error is already toasted in service
      }
    };
    fetchFilters();
  }, []);

  // Use useCallback to prevent unnecessary re-renders
  const handleFilterUpdate = useCallback(() => {
    if (onFilterChange) {
      const newFilters = {
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minMoq: minMoq || undefined,
        maxMoq: maxMoq || undefined,
        minStock: minStock || undefined,
        maxStock: maxStock || undefined,
        simTypes: selectedSimTypes.length > 0 ? selectedSimTypes : undefined,
        storage: selectedStorage.length > 0 ? selectedStorage : undefined,
        grades: selectedGrades.length > 0 ? selectedGrades : undefined,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
        rams: selectedRams.length > 0 ? selectedRams : undefined,
      };
      onFilterChange(newFilters);
    }
  }, [
    minPrice,
    maxPrice,
    minMoq,
    maxMoq,
    minStock,
    maxStock,
    selectedSimTypes,
    selectedStorage,
    selectedGrades,
    selectedColors,
    selectedRams,
    onFilterChange,
  ]);

  useEffect(() => {
    handleFilterUpdate();
  }, [handleFilterUpdate]);

  const handleSimTypeChange = (simType) => {
    setSelectedSimTypes((prev) =>
      prev.includes(simType)
        ? prev.filter((s) => s !== simType)
        : [...prev, simType]
    );
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
      prev.includes(grade)
        ? prev.filter((g) => g !== grade)
        : [...prev, grade]
    );
  };

  const handleColorChange = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color]
    );
  };

  const handleRamChange = (ram) => {
    setSelectedRams((prev) =>
      prev.includes(ram) ? prev.filter((r) => r !== ram) : [...prev, ram]
    );
  };

  const colorMap = {
    Black: "bg-gray-800",
    Blue: "bg-blue-600",
    Purple: "bg-purple-600",
    Pink: "bg-pink-400",
    White: "bg-white border-2 border-gray-300",
    Gold: "bg-yellow-400",
    Red: "bg-red-500",
    Graphite: "bg-gray-600",
    Silver: "bg-gray-300",
  };

  const colors = (filtersData?.colors || []).map((name) => ({
    name,
    class: colorMap[name] || "bg-gray-400", // Fallback for unknown colors
  }));
  const simTypes = filtersData?.simTypes || [];
  const storages = filtersData?.storages || [];
  const grades = filtersData?.conditions || [];
  const rams = filtersData?.rams || [];
  const priceRange = filtersData?.price || { min: 0, max: 1000 };
  const moqRange = filtersData?.moq || { min: 0, max: 100 };
  const stockRange = filtersData?.stock || { min: 0, max: 100 };

  const clearAllFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setMinMoq("");
    setMaxMoq("");
    setMinStock("");
    setMaxStock("");
    setSelectedSimTypes([]);
    setSelectedStorage([]);
    setSelectedGrades([]);
    setSelectedColors([]);
    setSelectedRams([]);
  };

  // Helper to handle min/max constraints
  const handlePriceChange = (type, value) => {
    const parsedValue = parseInt(value);
    if (type === "min") {
      const max = maxPrice ? parseInt(maxPrice) : priceRange.max;
      setMinPrice(parsedValue <= max ? parsedValue.toString() : max.toString());
    } else {
      const min = minPrice ? parseInt(minPrice) : priceRange.min;
      setMaxPrice(parsedValue >= min ? parsedValue.toString() : min.toString());
    }
  };

  const handleMoqChange = (type, value) => {
    const parsedValue = parseInt(value);
    if (type === "min") {
      const max = maxMoq ? parseInt(maxMoq) : moqRange.max;
      setMinMoq(parsedValue <= max ? parsedValue.toString() : max.toString());
    } else {
      const min = minMoq ? parseInt(minMoq) : moqRange.min;
      setMaxMoq(parsedValue >= min ? parsedValue.toString() : min.toString());
    }
  };

  const handleStockChange = (type, value) => {
    const parsedValue = parseInt(value);
    if (type === "min") {
      const max = maxStock ? parseInt(maxStock) : stockRange.max;
      setMinStock(parsedValue <= max ? parsedValue.toString() : max.toString());
    } else {
      const min = minStock ? parseInt(minStock) : stockRange.min;
      setMaxStock(parsedValue >= min ? parsedValue.toString() : min.toString());
    }
  };

  return (
    <aside className="bg-white-50 rounded-[18px] shadow-sm border border-gray-200 h-fit sticky top-24">
      <style>
        {`
          input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            height: 8px;
            background: transparent;
            outline: none;
            pointer-events: none;
            position: absolute;
            width: 100%;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
          }
          .range-container {
            position: relative;
            height: 8px;
            background: #e5e7eb; /* bg-gray-200 */
            border-radius: 4px;
          }
        `}
      </style>
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
          <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
          <div className="range-container">
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              value={minPrice || priceRange.min}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              className="min-range"
              style={{ zIndex: 2 }}
              aria-label="Minimum price"
            />
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              value={maxPrice || priceRange.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              className="max-range"
              style={{ zIndex: 1 }}
              aria-label="Maximum price"
            />
            <div
              className="absolute h-2 bg-primary"
              style={{
                left: `${
                  ((minPrice || priceRange.min) / priceRange.max) * 100
                }%`,
                width: `${
                  ((maxPrice || priceRange.max) - (minPrice || priceRange.min)) /
                  priceRange.max *
                  100
                }%`,
                zIndex: 0,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>${minPrice || priceRange.min}</span>
            <span>${maxPrice || priceRange.max}</span>
          </div>
        </div>

        {/* MOQ Range */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">MOQ Range</h4>
          <div className="range-container">
            <input
              type="range"
              min={moqRange.min}
              max={moqRange.max}
              value={minMoq || moqRange.min}
              onChange={(e) => handleMoqChange("min", e.target.value)}
              className="min-range"
              style={{ zIndex: 2 }}
              aria-label="Minimum MOQ"
            />
            <input
              type="range"
              min={moqRange.min}
              max={moqRange.max}
              value={maxMoq || moqRange.max}
              onChange={(e) => handleMoqChange("max", e.target.value)}
              className="max-range"
              style={{ zIndex: 1 }}
              aria-label="Maximum MOQ"
            />
            <div
              className="absolute h-2 bg-primary"
              style={{
                left: `${((minMoq || moqRange.min) / moqRange.max) * 100}%`,
                width: `${
                  ((maxMoq || moqRange.max) - (minMoq || moqRange.min)) /
                  moqRange.max *
                  100
                }%`,
                zIndex: 0,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{minMoq || moqRange.min}</span>
            <span>{maxMoq || moqRange.max}</span>
          </div>
        </div>

        {/* Stock Range */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Stock Range</h4>
          <div className="range-container">
            <input
              type="range"
              min={stockRange.min}
              max={stockRange.max}
              value={minStock || stockRange.min}
              onChange={(e) => handleStockChange("min", e.target.value)}
              className="min-range"
              style={{ zIndex: 2 }}
              aria-label="Minimum stock"
            />
            <input
              type="range"
              min={stockRange.min}
              max={stockRange.max}
              value={maxStock || stockRange.max}
              onChange={(e) => handleStockChange("max", e.target.value)}
              className="max-range"
              style={{ zIndex: 1 }}
              aria-label="Maximum stock"
            />
            <div
              className="absolute h-2 bg-primary"
              style={{
                left: `${
                  ((minStock || stockRange.min) / stockRange.max) * 100
                }%`,
                width: `${
                  ((maxStock || stockRange.max) - (minStock || stockRange.min)) /
                  stockRange.max *
                  100
                }%`,
                zIndex: 0,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{minStock || stockRange.min}</span>
            <span>{maxStock || stockRange.max}</span>
          </div>
        </div>

        {/* SIM Types */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">SIM Types</h4>
          <div className="space-y-2">
            {simTypes.map((simType) => (
              <label key={simType} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedSimTypes.includes(simType)}
                  onChange={() => handleSimTypeChange(simType)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">{simType}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Storage */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Storage</h4>
          <div className="space-y-2">
            {storages.map((storage) => (
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
            {grades.map((grade) => (
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

        {/* RAM */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">RAM</h4>
          <div className="space-y-2">
            {rams.map((ram) => (
              <label key={ram} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRams.includes(ram)}
                  onChange={() => handleRamChange(ram)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">{ram}</span>
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