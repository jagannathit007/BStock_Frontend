import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faChevronDown, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { ProductService } from "../services/products/products.services"; // Adjust the import path to your ProductService
import { convertPrice } from "../utils/currencyUtils";

const SideFilter = ({ onClose, onFilterChange, currentFilters = {} }) => {
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice);
  const [minMoq, setMinMoq] = useState(currentFilters.minMoq || "");
  const [maxMoq, setMaxMoq] = useState(currentFilters.maxMoq || "");
  const [minStock, setMinStock] = useState(currentFilters.minStock || "");
  const [maxStock, setMaxStock] = useState(currentFilters.maxStock || "");
  const [selectedSimTypes, setSelectedSimTypes] = useState(currentFilters.simTypes || []);
  const [selectedStorage, setSelectedStorage] = useState(currentFilters.storage || []);
  const [selectedGrades, setSelectedGrades] = useState(currentFilters.grades || []);
  const [selectedColors, setSelectedColors] = useState(currentFilters.colors || []);
  const [selectedRams, setSelectedRams] = useState(currentFilters.rams || []);
  const [selectedBrands, setSelectedBrands] = useState(currentFilters.brands || []);
  const [selectedCategories, setSelectedCategories] = useState(currentFilters.categories || []);
  const [selectedModels, setSelectedModels] = useState(currentFilters.models || []);
  const [selectedVariants, setSelectedVariants] = useState(currentFilters.variants || []);
  const [selectedSpecifications, setSelectedSpecifications] = useState(currentFilters.specifications || []);
  const [specificationSearch, setSpecificationSearch] = useState("");
  const [filtersData, setFiltersData] = useState(null);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [hasFiltersLoaded, setHasFiltersLoaded] = useState(false);
  const prevFiltersStrRef = React.useRef("");
  
  // State for collapsible sections (all open by default)
  const [openSections, setOpenSections] = useState({
    priceRange: true,
    brand: true,
    category: true,
    model: true,
    variant: true,
    storage: true,
    ram: true,
    color: true,
    grade: true,
    simType: true,
    stockAvailability: true,
    moq: true,
    specification: true,
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Sync internal state with currentFilters prop when it changes externally  
  useEffect(() => {
    // Create a normalized string representation of current filters
    const currentFiltersStr = JSON.stringify({
      minPrice: currentFilters.minPrice || "",
      maxPrice: currentFilters.maxPrice || "",
      minMoq: currentFilters.minMoq || "",
      maxMoq: currentFilters.maxMoq || "",
      minStock: currentFilters.minStock || "",
      maxStock: currentFilters.maxStock || "",
      simTypes: currentFilters.simTypes || [],
      storage: currentFilters.storage || [],
      grades: currentFilters.grades || [],
      colors: currentFilters.colors || [],
      rams: currentFilters.rams || [],
      brands: currentFilters.brands || [],
      categories: currentFilters.categories || [],
      models: currentFilters.models || [],
      variants: currentFilters.variants || [],
      specifications: currentFilters.specifications || [],
    });
    
    // Only update if the filter values have actually changed
    if (currentFiltersStr !== prevFiltersStrRef.current) {
      setMinPrice(currentFilters.minPrice);
      setMaxPrice(currentFilters.maxPrice);
      setMinMoq(currentFilters.minMoq || "");
      setMaxMoq(currentFilters.maxMoq || "");
      setMinStock(currentFilters.minStock || "");
      setMaxStock(currentFilters.maxStock || "");
      setSelectedSimTypes(currentFilters.simTypes || []);
      setSelectedStorage(currentFilters.storage || []);
      setSelectedGrades(currentFilters.grades || []);
      setSelectedColors(currentFilters.colors || []);
      setSelectedRams(currentFilters.rams || []);
      setSelectedBrands(currentFilters.brands || []);
      setSelectedCategories(currentFilters.categories || []);
      setSelectedModels(currentFilters.models || []);
      setSelectedVariants(currentFilters.variants || []);
      setSelectedSpecifications(currentFilters.specifications || []);
      prevFiltersStrRef.current = currentFiltersStr;
    }
  }, [currentFilters]);

  // Reset the ref on unmount/remount to ensure proper sync
  useEffect(() => {
    return () => {
      prevFiltersStrRef.current = "";
    };
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
      setIsLoadingFilters(true);
      setFiltersData(null); // Clear filters while loading
      try {
        const data = await ProductService.getFilters();
        setFiltersData(data);
      } catch (err) {
        // Error is already toasted in service
        setFiltersData(null);
      } finally {
        setIsLoadingFilters(false);
        setHasFiltersLoaded(true);
      }
    };
    fetchFilters();
  }, []);

  // Apply filters function - called when user clicks "Apply Filters" button
  const handleApplyFilters = () => {
    if (onFilterChange) {
      // Apply constraints before applying filters
      let finalMinPrice = minPrice;
      let finalMaxPrice = maxPrice;
      
      // Ensure min <= max
      if (finalMinPrice !== undefined && finalMaxPrice !== undefined && finalMinPrice > finalMaxPrice) {
        finalMinPrice = finalMaxPrice;
        setMinPrice(finalMinPrice);
      }
      if (finalMinPrice !== undefined && finalMinPrice < priceRange.min) {
        finalMinPrice = priceRange.min;
        setMinPrice(finalMinPrice);
      }
      if (finalMaxPrice !== undefined && finalMaxPrice > priceRange.max) {
        finalMaxPrice = priceRange.max;
        setMaxPrice(finalMaxPrice);
      }
      
      const newFilters = {
        minPrice: finalMinPrice,
        maxPrice: finalMaxPrice,
        minMoq: minMoq || undefined,
        maxMoq: maxMoq || undefined,
        minStock: minStock || undefined,
        maxStock: maxStock || undefined,
        simTypes: selectedSimTypes.length > 0 ? selectedSimTypes : undefined,
        storage: selectedStorage.length > 0 ? selectedStorage : undefined,
        grades: selectedGrades.length > 0 ? selectedGrades : undefined,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
        rams: selectedRams.length > 0 ? selectedRams : undefined,
        brands: selectedBrands.length > 0 ? selectedBrands : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        models: selectedModels.length > 0 ? selectedModels : undefined,
        variants: selectedVariants.length > 0 ? selectedVariants : undefined,
        specifications: selectedSpecifications.length > 0 ? selectedSpecifications : undefined,
      };
      onFilterChange(newFilters);
      // Close mobile filter overlay if open
      if (onClose) {
        onClose();
      }
    }
  };

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

  const handleBrandChange = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleModelChange = (model) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const handleVariantChange = (variant) => {
    setSelectedVariants((prev) =>
      prev.includes(variant) ? prev.filter((v) => v !== variant) : [...prev, variant]
    );
  };

  const handleSpecificationChange = (spec) => {
    setSelectedSpecifications((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
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
    Gray: "bg-gray-500",
    Grey: "bg-gray-500",
    Green: "bg-green-500",
    Orange: "bg-orange-500",
  };

  const colors = (filtersData?.colors || []).map((name) => ({
    name,
    class: colorMap[name] || "bg-gray-400", // Fallback for unknown colors
  }));
  const simTypes = filtersData?.simTypes || [];
  const storages = filtersData?.storages || [];
  const grades = filtersData?.conditions || [];
  const rams = filtersData?.rams || [];
  const brands = filtersData?.brands || [];
  const categories = filtersData?.categories || [];
  const models = filtersData?.models || [];
  const variants = filtersData?.variants || [];
  const specifications = filtersData?.specifications || [];
  const priceRange = filtersData?.price || { min: 0, max: 1000 };
  const moqRange = filtersData?.moq || { min: 0, max: 100 };
  const stockRange = filtersData?.stock || { min: 0, max: 100 };

  const clearAllFilters = () => {
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinMoq("");
    setMaxMoq("");
    setMinStock("");
    setMaxStock("");
    setSelectedSimTypes([]);
    setSelectedStorage([]);
    setSelectedGrades([]);
    setSelectedColors([]);
    setSelectedRams([]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedModels([]);
    setSelectedVariants([]);
    setSelectedSpecifications([]);
    setSpecificationSearch("");
  };

  // Check if any filters are applied
  const hasActiveFilters = () => {
    if (!filtersData) return false;
    const defaultMin = filtersData?.price?.min;
    const defaultMax = filtersData?.price?.max;
    return (
      (minPrice !== undefined && minPrice !== defaultMin) || (maxPrice !== undefined && maxPrice !== defaultMax) ||
      minMoq || maxMoq || minStock || maxStock ||
      selectedSimTypes.length > 0 || selectedStorage.length > 0 ||
      selectedGrades.length > 0 || selectedColors.length > 0 ||
      selectedRams.length > 0 || selectedBrands.length > 0 ||
      selectedCategories.length > 0 || selectedModels.length > 0 ||
      selectedVariants.length > 0 || selectedSpecifications.length > 0
    );
  };

  // Helper to handle min/max constraints - smooth version like bidding
  const handlePriceChange = (type, value) => {
    const numValue = parseFloat(value);
    // Directly set the value for smooth dragging - no constraints during drag
    if (type === "min") {
      setMinPrice(numValue);
    } else {
      setMaxPrice(numValue);
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

  // Helper component for collapsible filter section
  const FilterSection = ({ sectionKey, title, children, isOpen, onToggle }) => (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors rounded-lg px-1 -mx-1"
      >
        <h4 className="text-sm font-semibold text-gray-800 tracking-tight">
          {title}
        </h4>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-gray-400 text-xs transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="pb-3 pt-1">{children}</div>}
    </div>
  );

  // Skeleton loader for filter section
  const FilterSectionSkeleton = ({ title }) => (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="w-full flex items-center justify-between py-3 px-1">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="pb-3 pt-1">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center px-2 py-1.5">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mr-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Skeleton loader for range slider
  const RangeSliderSkeleton = () => (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="w-full flex items-center justify-between py-3 px-1">
        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
        <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="pb-3 pt-1">
        <div className="h-1 bg-gray-200 rounded-full animate-pulse mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  // Helper to render checkbox grid (2-3 columns)
  const CheckboxGrid = ({ items, selectedItems, onToggle, columns = 2 }) => {
    const gridClass = columns === 3 ? "grid-cols-3" : "grid-cols-2";
    return (
      <div className={`grid ${gridClass} gap-x-3 gap-y-2.5`}>
        {items.map((item) => {
          const isSelected = selectedItems.includes(item);
          return (
            <label
              key={item}
              className={`flex items-center cursor-pointer group px-2 py-1.5 rounded-md transition-colors ${
                isSelected ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(item)}
                className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 focus:ring-1 cursor-pointer"
              />
              <span className={`ml-2 text-xs text-gray-700 ${
                isSelected ? "font-medium text-gray-900" : ""
              }`}>
                {item}
              </span>
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="bg-white h-fit sticky top-24 w-full lg:w-72 border-r border-gray-100 flex flex-col max-h-[calc(100vh-6rem)]">
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
              width: 18px;
              height: 18px;
              background: #0071e3;
              border-radius: 50%;
              cursor: pointer;
              pointer-events: auto;
              box-shadow: 0 2px 6px rgba(0, 113, 227, 0.3);
              border: 2px solid white;
              transition: all 0.2s ease;
            }
            input[type="range"]::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 4px 10px rgba(0, 113, 227, 0.4);
            }
            input[type="range"]::-moz-range-thumb {
              width: 18px;
              height: 18px;
              background: #0071e3;
              border-radius: 50%;
              cursor: pointer;
              pointer-events: auto;
              box-shadow: 0 2px 6px rgba(0, 113, 227, 0.3);
              border: 2px solid white;
              transition: all 0.2s ease;
            }
            input[type="range"]::-moz-range-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 4px 10px rgba(0, 113, 227, 0.4);
            }
            .range-container {
              position: relative;
              height: 4px;
              background: #e5e7eb;
              border-radius: 2px;
              margin: 12px 0;
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
              flex-shrink: 0;
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
            }
          `}
        </style>
        <div className="px-4 py-3 bg-white border-r border-gray-100 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight uppercase">
              Filters
            </h3>
            <div className="flex items-center gap-2">
              {onClose && (
                <button className="text-gray-400 hover:text-gray-600 lg:hidden transition-colors duration-200" onClick={onClose}>
                  <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {isLoadingFilters ? (
            <>
              {/* Loading Skeletons */}
              <RangeSliderSkeleton />
              <FilterSectionSkeleton title="Brand" />
              <FilterSectionSkeleton title="Category" />
              <FilterSectionSkeleton title="Storage" />
              <FilterSectionSkeleton title="RAM" />
            </>
          ) : !isLoadingFilters && hasFiltersLoaded && !filtersData ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Unable to load filters</p>
            </div>
          ) : (
            <>
          {/* Price Range */}
          <FilterSection
            sectionKey="priceRange"
            title="Price Range"
            isOpen={openSections.priceRange}
            onToggle={toggleSection}
          >
            <div className="range-container">
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={minPrice ?? priceRange.min ?? 0}
                onChange={(e) => handlePriceChange("min", e.target.value)}
                className="min-range"
                style={{ zIndex: 2 }}
                aria-label="Minimum price"
              />
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={maxPrice ?? priceRange.max ?? 0}
                onChange={(e) => handlePriceChange("max", e.target.value)}
                className="max-range"
                style={{ zIndex: 1 }}
                aria-label="Maximum price"
              />
              <div
                className="absolute h-1 bg-blue-600 rounded-full"
                style={{
                  left: `${
                    ((minPrice ?? priceRange.min ?? 0) / (priceRange.max || 1)) * 100
                  }%`,
                  width: `${
                    (((maxPrice ?? priceRange.max ?? 0) - (minPrice ?? priceRange.min ?? 0)) / (priceRange.max || 1)) * 100
                  }%`,
                  zIndex: 0,
                }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-600 font-medium">
                {convertPrice(minPrice ?? priceRange.min ?? 0)}
              </div>
              <div className="text-xs text-gray-400">-</div>
              <div className="text-xs text-gray-600 font-medium">
                {convertPrice(maxPrice ?? priceRange.max ?? 0)}
              </div>
            </div>
          </FilterSection>

          {/* Brand */}
          {brands.length > 0 && (
            <FilterSection
              sectionKey="brand"
              title="Brand"
              isOpen={openSections.brand}
              onToggle={toggleSection}
            >
              <CheckboxGrid
                items={brands}
                selectedItems={selectedBrands}
                onToggle={handleBrandChange}
                columns={2}
              />
            </FilterSection>
          )}

          {/* Category */}
          {categories.length > 0 && (
            <FilterSection
              sectionKey="category"
              title="Category"
              isOpen={openSections.category}
              onToggle={toggleSection}
            >
              <CheckboxGrid
                items={categories}
                selectedItems={selectedCategories}
                onToggle={handleCategoryChange}
                columns={2}
              />
            </FilterSection>
          )}

          {/* Model - Searchable */}
          {models.length > 0 && (
            <FilterSection
              sectionKey="model"
              title="Model - Searchable"
              isOpen={openSections.model}
              onToggle={toggleSection}
            >
              <CheckboxGrid
                items={models}
                selectedItems={selectedModels}
                onToggle={handleModelChange}
                columns={3}
              />
            </FilterSection>
          )}

          {/* Variant (Series) */}
          {variants.length > 0 && (
            <FilterSection
              sectionKey="variant"
              title="Variant (Series)"
              isOpen={openSections.variant}
              onToggle={toggleSection}
            >
              <CheckboxGrid
                items={variants}
                selectedItems={selectedVariants}
                onToggle={handleVariantChange}
                columns={2}
              />
            </FilterSection>
          )}

          {/* Storage */}
          {storages.length > 0 && (
            <FilterSection
              sectionKey="storage"
              title="Storage"
              isOpen={openSections.storage}
              onToggle={toggleSection}
            >
              <CheckboxGrid
                items={storages}
                selectedItems={selectedStorage}
                onToggle={handleStorageChange}
                columns={2}
              />
            </FilterSection>
          )}

          {/* RAM */}
          {rams.length > 0 && (
            <FilterSection
              sectionKey="ram"
              title="RAM"
              isOpen={openSections.ram}
              onToggle={toggleSection}
            >
              <CheckboxGrid
                items={rams}
                selectedItems={selectedRams}
                onToggle={handleRamChange}
                columns={2}
              />
            </FilterSection>
          )}

          {/* Color */}
          {colors.length > 0 && (
            <FilterSection
              sectionKey="color"
              title="Color"
              isOpen={openSections.color}
              onToggle={toggleSection}
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                {colors.map((color) => {
                  const isSelected = selectedColors.includes(color.name);
                  return (
                    <button
                      key={color.name}
                      onClick={() => handleColorChange(color.name)}
                      className={`w-8 h-8 rounded-full ${color.class} border-2 transition-all relative ${
                        isSelected
                          ? "border-blue-600 ring-2 ring-blue-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      title={color.name}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </FilterSection>
          )}

          {/* Grade / Condition */}
          {grades.length > 0 && (
            <FilterSection
              sectionKey="grade"
              title="Grade / Condition"
              isOpen={openSections.grade}
              onToggle={toggleSection}
            >
              <CheckboxGrid
                items={grades}
                selectedItems={selectedGrades}
                onToggle={handleGradeChange}
                columns={3}
              />
            </FilterSection>
          )}

          {/* SIM Type */}
          {simTypes.length > 0 && (
            <FilterSection
              sectionKey="simType"
              title="SIM Type"
              isOpen={openSections.simType}
              onToggle={toggleSection}
            >
              <CheckboxGrid
                items={simTypes}
                selectedItems={selectedSimTypes}
                onToggle={handleSimTypeChange}
                columns={2}
              />
            </FilterSection>
          )}

          {/* Stock Availability */}
          <FilterSection
            sectionKey="stockAvailability"
            title="Stock Availability"
            isOpen={openSections.stockAvailability}
            onToggle={toggleSection}
          >
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
                className="absolute h-1 bg-blue-600 rounded-full"
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
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-600 font-medium">
                {minStock || stockRange.min}
              </div>
              <div className="text-xs text-gray-400">-</div>
              <div className="text-xs text-gray-600 font-medium">
                {maxStock || stockRange.max}
              </div>
            </div>
          </FilterSection>

          {/* MOQ (Minimum Order Qty) */}
          <FilterSection
            sectionKey="moq"
            title="MOQ (Minimum Order Qty)"
            isOpen={openSections.moq}
            onToggle={toggleSection}
          >
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
                className="absolute h-1 bg-blue-600 rounded-full"
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
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-600 font-medium">
                {minMoq || moqRange.min}
              </div>
              <div className="text-xs text-gray-400">-</div>
              <div className="text-xs text-gray-600 font-medium">
                {maxMoq || moqRange.max}
              </div>
            </div>
          </FilterSection>

          {/* Specification / Serial Type */}
          {specifications.length > 0 && (
            <FilterSection
              sectionKey="specification"
              title="Specification / Serial Type"
              isOpen={openSections.specification}
              onToggle={toggleSection}
            >
              <div className="mb-2">
                <div className="relative">
                  <svg
                    className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search specifications..."
                    value={specificationSearch}
                    onChange={(e) => setSpecificationSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
              <CheckboxGrid
                items={specifications.filter(spec => 
                  !specificationSearch || spec.toLowerCase().includes(specificationSearch.toLowerCase())
                )}
                selectedItems={selectedSpecifications}
                onToggle={handleSpecificationChange}
                columns={2}
              />
            </FilterSection>
          )}
            </>
          )}
      </div>
      
      {/* Apply Filters Button - Desktop & Mobile */}
      <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] z-10">
        <div className="flex gap-3">
          <button
            onClick={clearAllFilters}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 active:scale-95"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyFilters}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-200 active:scale-95 ${
              hasActiveFilters()
                ? "bg-[#0071E0] hover:bg-[#005bb5] cursor-pointer shadow-sm hover:shadow-md"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            disabled={!hasActiveFilters()}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SideFilter;
