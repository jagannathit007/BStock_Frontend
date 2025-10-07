import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { ProductService } from "../services/products/products.services"; // Adjust the import path to your ProductService
import { convertPrice } from "../utils/currencyUtils";

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
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const handleColorChange = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
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
    <div className="lg:w-72 hidden lg:block">
      <aside className="bg-white h-fit sticky top-24">
        <style>
          {`
            input[type="range"] {
              -webkit-appearance: none;
              appearance: none;
              height: 4px;
              background: transparent;
              outline: none;
              pointer-events: none;
              position: absolute;
              width: 100%;
            }
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              background: #0071e3;
              border-radius: 50%;
              cursor: pointer;
              pointer-events: auto;
              box-shadow: 0 2px 8px rgba(0, 113, 227, 0.3);
              border: 2px solid white;
              transition: all 0.2s ease;
            }
            input[type="range"]::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 4px 12px rgba(0, 113, 227, 0.4);
            }
            input[type="range"]::-moz-range-thumb {
              width: 20px;
              height: 20px;
              background: #0071e3;
              border-radius: 50%;
              cursor: pointer;
              pointer-events: auto;
              box-shadow: 0 2px 8px rgba(0, 113, 227, 0.3);
              border: 2px solid white;
              transition: all 0.2s ease;
            }
            input[type="range"]::-moz-range-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 4px 12px rgba(0, 113, 227, 0.4);
            }
            .range-container {
              position: relative;
              height: 4px;
              background: #f5f5f7;
              border-radius: 2px;
            }
            input[type="checkbox"] {
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 18px;
              border: 1.5px solid #d1d1d6;
              border-radius: 4px;
              background: white;
              cursor: pointer;
              position: relative;
              transition: all 0.2s ease;
            }
            input[type="checkbox"]:checked {
              background: #0071e3;
              border-color: #0071e3;
            }
            input[type="checkbox"]:checked::after {
              content: '✓';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: white;
              font-size: 12px;
              font-weight: 600;
            }
            input[type="checkbox"]:hover {
              border-color: #0071e3;
              transform: scale(1.05);
            }
          `}
        </style>
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 font-apple">Filters</h3>
            <button className="text-gray-400 hover:text-gray-600 lg:hidden transition-colors duration-200" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
            </button>
          </div>

        {/* Price Range */}
        <div className="mb-8">
          <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">Price Range</h4>
          <div className="range-container mb-3">
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
              className="absolute h-1 bg-primary rounded-full"
              style={{
                left: `${
                  ((minPrice || priceRange.min) / priceRange.max) * 100
                }%`,
                width: `${
                  (((maxPrice || priceRange.max) -
                    (minPrice || priceRange.min)) /
                    priceRange.max) *
                  100
                }%`,
                zIndex: 0,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 font-apple">
            <span>{convertPrice(parseFloat(minPrice || priceRange.min))}</span>
            <span>{convertPrice(parseFloat(maxPrice || priceRange.max))}</span>
          </div>
        </div>

        {/* MOQ Range */}
        <div className="mb-8">
          <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">MOQ Range</h4>
          <div className="range-container mb-3">
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
              className="absolute h-1 bg-primary rounded-full"
              style={{
                left: `${((minMoq || moqRange.min) / moqRange.max) * 100}%`,
                width: `${
                  (((maxMoq || moqRange.max) - (minMoq || moqRange.min)) /
                    moqRange.max) *
                  100
                }%`,
                zIndex: 0,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 font-apple">
            <span>{minMoq || moqRange.min}</span>
            <span>{maxMoq || moqRange.max}</span>
          </div>
        </div>

        {/* Stock Range */}
        <div className="mb-8">
          <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">Stock Range</h4>
          <div className="range-container mb-3">
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
              className="absolute h-1 bg-primary rounded-full"
              style={{
                left: `${
                  ((minStock || stockRange.min) / stockRange.max) * 100
                }%`,
                width: `${
                  (((maxStock || stockRange.max) -
                    (minStock || stockRange.min)) /
                    stockRange.max) *
                  100
                }%`,
                zIndex: 0,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 font-apple">
            <span>{minStock || stockRange.min}</span>
            <span>{maxStock || stockRange.max}</span>
          </div>
        </div>

        {/* SIM Types */}
        <div className="mb-8">
          <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">SIM Types</h4>
          <div className="space-y-3">
            {simTypes.map((simType) => (
              <label key={simType} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSimTypes.includes(simType)}
                  onChange={() => handleSimTypeChange(simType)}
                />
                <span className="ml-3 text-sm text-gray-700 font-apple group-hover:text-gray-900 transition-colors duration-200">{simType}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Storage */}
        <div className="mb-8">
          <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">Storage</h4>
          <div className="space-y-3">
            {storages.map((storage) => (
              <label key={storage} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStorage.includes(storage)}
                  onChange={() => handleStorageChange(storage)}
                />
                <span className="ml-3 text-sm text-gray-700 font-apple group-hover:text-gray-900 transition-colors duration-200">{storage}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Grades */}
        <div className="mb-8">
          <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">Grades</h4>
          <div className="space-y-3">
            {grades.map((grade) => (
              <label key={grade} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGrades.includes(grade)}
                  onChange={() => handleGradeChange(grade)}
                />
                <span className="ml-3 text-sm text-gray-700 font-apple group-hover:text-gray-900 transition-colors duration-200">{grade}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="mb-8">
          <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">Colors</h4>
          <div className="space-y-3">
            {colors.map((color) => (
              <label key={color.name} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color.name)}
                  onChange={() => handleColorChange(color.name)}
                />
                <span className="ml-3 text-sm text-gray-700 font-apple group-hover:text-gray-900 transition-colors duration-200">{color.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* RAM */}
        <div className="mb-8">
          <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">RAM</h4>
          <div className="space-y-3">
            {rams.map((ram) => (
              <label key={ram} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRams.includes(ram)}
                  onChange={() => handleRamChange(ram)}
                />
                <span className="ml-3 text-sm text-gray-700 font-apple group-hover:text-gray-900 transition-colors duration-200">{ram}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearAllFilters}
          className="w-full bg-[#0071E0] text-white py-3 px-6 rounded-xl text-sm font-medium font-apple hover:bg-primary-dark transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          Clear All Filters
        </button>
        </div>
      </aside>
    </div>
  );
};

export default SideFilter;
