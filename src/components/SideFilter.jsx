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
  const priceDebounceRef = React.useRef({ min: null, max: null });
  const [isDragging, setIsDragging] = useState(null); // 'min', 'max', or null
  const rangeBarRef = React.useRef(null);
  const dragStartRef = React.useRef({ x: 0, minPrice: 0, maxPrice: 0 });
  
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


  const handleSimTypeChange = (simType) => {
    const newSelected = selectedSimTypes.includes(simType)
      ? selectedSimTypes.filter((s) => s !== simType)
      : [...selectedSimTypes, simType];
    setSelectedSimTypes(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      simTypes: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  const handleStorageChange = (storage) => {
    const newSelected = selectedStorage.includes(storage)
      ? selectedStorage.filter((s) => s !== storage)
      : [...selectedStorage, storage];
    setSelectedStorage(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      storage: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  const handleGradeChange = (grade) => {
    const newSelected = selectedGrades.includes(grade)
      ? selectedGrades.filter((g) => g !== grade)
      : [...selectedGrades, grade];
    setSelectedGrades(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      grades: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  const handleColorChange = (color) => {
    const newSelected = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    setSelectedColors(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      colors: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  const handleRamChange = (ram) => {
    const newSelected = selectedRams.includes(ram)
      ? selectedRams.filter((r) => r !== ram)
      : [...selectedRams, ram];
    setSelectedRams(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      rams: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  const handleBrandChange = (brand) => {
    const newSelected = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      brands: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  const handleCategoryChange = (category) => {
    const newSelected = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      categories: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  const handleModelChange = (model) => {
    const newSelected = selectedModels.includes(model)
      ? selectedModels.filter((m) => m !== model)
      : [...selectedModels, model];
    setSelectedModels(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      models: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  const handleVariantChange = (variant) => {
    const newSelected = selectedVariants.includes(variant)
      ? selectedVariants.filter((v) => v !== variant)
      : [...selectedVariants, variant];
    setSelectedVariants(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      variants: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  const handleSpecificationChange = (spec) => {
    const newSelected = selectedSpecifications.includes(spec)
      ? selectedSpecifications.filter((s) => s !== spec)
      : [...selectedSpecifications, spec];
    setSelectedSpecifications(newSelected);
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      specifications: newSelected.length > 0 ? newSelected : undefined,
    });
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

  // Helper function to get current filter state
  const getCurrentFilters = () => {
    return {
      minPrice,
      maxPrice,
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
  };

  // Helper function to apply filters
  const applyFilters = (filtersToApply) => {
    if (onFilterChange) {
      // Apply constraints before applying filters
      let finalMinPrice = filtersToApply.minPrice;
      let finalMaxPrice = filtersToApply.maxPrice;
      
      // Ensure min <= max
      if (finalMinPrice !== undefined && finalMaxPrice !== undefined && finalMinPrice > finalMaxPrice) {
        finalMinPrice = finalMaxPrice;
      }
      if (finalMinPrice !== undefined && finalMinPrice < priceRange.min) {
        finalMinPrice = priceRange.min;
      }
      if (finalMaxPrice !== undefined && finalMaxPrice > priceRange.max) {
        finalMaxPrice = priceRange.max;
      }
      
      onFilterChange({
        ...filtersToApply,
        minPrice: finalMinPrice,
        maxPrice: finalMaxPrice,
      });
    }
  };

  // Helper to handle price input changes with validation and debouncing
  const handlePriceInputChange = (type, value) => {
    // Ensure filtersData is loaded
    if (!filtersData?.price) return;
    
    const priceRange = filtersData.price || { min: 0, max: 1000 };
    
    // Clear existing timeout for this type
    if (priceDebounceRef.current[type]) {
      clearTimeout(priceDebounceRef.current[type]);
      priceDebounceRef.current[type] = null;
    }

    // Remove non-numeric characters except decimal point
    let cleanedValue = value.replace(/[^0-9.]/g, '');
    
    // Handle multiple decimal points - keep only the first one
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      cleanedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      cleanedValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    if (cleanedValue === '' || cleanedValue === '.') {
      if (type === "min") {
        setMinPrice(undefined);
      } else {
        setMaxPrice(undefined);
      }
      // Apply filter immediately with cleared value
      priceDebounceRef.current[type] = setTimeout(() => {
        applyFilters({
          ...getCurrentFilters(),
          [type === "min" ? "minPrice" : "maxPrice"]: undefined,
        });
        priceDebounceRef.current[type] = null;
      }, 300);
      return;
    }

    const numValue = parseFloat(cleanedValue);
    
    if (isNaN(numValue)) {
      return;
    }

    // Constrain values to valid range
    let finalValue = numValue;
    if (finalValue < priceRange.min) {
      finalValue = priceRange.min;
    } else if (finalValue > priceRange.max) {
      finalValue = priceRange.max;
    }

    // Ensure min <= max
    if (type === "min") {
      if (maxPrice !== undefined && finalValue > maxPrice) {
        finalValue = maxPrice;
      }
      setMinPrice(finalValue >= priceRange.min ? finalValue : undefined);
    } else {
      if (minPrice !== undefined && finalValue < minPrice) {
        finalValue = minPrice;
      }
      setMaxPrice(finalValue <= priceRange.max ? finalValue : undefined);
    }

    // Apply filter with debounce
    priceDebounceRef.current[type] = setTimeout(() => {
      const currentFilters = getCurrentFilters();
      applyFilters({
        ...currentFilters,
        [type === "min" ? "minPrice" : "maxPrice"]: type === "min" 
          ? (finalValue >= priceRange.min ? finalValue : undefined)
          : (finalValue <= priceRange.max ? finalValue : undefined),
      });
      priceDebounceRef.current[type] = null;
    }, 500);
  };

  // Handle price input blur - apply filter immediately
  const handlePriceInputBlur = (type) => {
    // Clear debounce timeout and apply immediately
    if (priceDebounceRef.current[type]) {
      clearTimeout(priceDebounceRef.current[type]);
      priceDebounceRef.current[type] = null;
    }
    applyFilters(getCurrentFilters());
  };

  // Handle price range drag functionality
  const handleRangeBarMouseDown = (e, type) => {
    if (!filtersData?.price) return;
    e.preventDefault();
    setIsDragging(type);
    const rect = rangeBarRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartRef.current = {
        x: e.clientX - rect.left,
        minPrice: minPrice !== undefined ? minPrice : filtersData.price.min,
        maxPrice: maxPrice !== undefined ? maxPrice : filtersData.price.max,
      };
    }
  };

  const handleRangeBarClick = (e) => {
    if (!filtersData?.price || isDragging) return;
    const rect = rangeBarRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const priceRange = filtersData.price;
    const clickedPrice = priceRange.min + (percentage / 100) * (priceRange.max - priceRange.min);

    const currentMin = minPrice !== undefined ? minPrice : priceRange.min;
    const currentMax = maxPrice !== undefined ? maxPrice : priceRange.max;
    const minDistance = Math.abs(clickedPrice - currentMin);
    const maxDistance = Math.abs(clickedPrice - currentMax);

    // Determine which marker is closer or if clicking on the bar itself
    if (minDistance < maxDistance && minDistance < (priceRange.max - priceRange.min) * 0.1) {
      // Closer to min marker
      const newMin = Math.max(priceRange.min, Math.min(clickedPrice, currentMax));
      setMinPrice(newMin);
      applyFilters({
        ...getCurrentFilters(),
        minPrice: newMin,
      });
    } else if (maxDistance < (priceRange.max - priceRange.min) * 0.1) {
      // Closer to max marker
      const newMax = Math.max(currentMin, Math.min(clickedPrice, priceRange.max));
      setMaxPrice(newMax);
      applyFilters({
        ...getCurrentFilters(),
        maxPrice: newMax,
      });
    } else {
      // Clicking on the bar - move the range center to the clicked position
      const rangeSize = currentMax - currentMin;
      const newMin = Math.max(priceRange.min, clickedPrice - rangeSize / 2);
      const newMax = Math.min(priceRange.max, clickedPrice + rangeSize / 2);
      if (newMin >= priceRange.min && newMax <= priceRange.max) {
        setMinPrice(newMin);
        setMaxPrice(newMax);
        applyFilters({
          ...getCurrentFilters(),
          minPrice: newMin,
          maxPrice: newMax,
        });
      }
    }
  };

  useEffect(() => {
    if (!isDragging || !filtersData?.price) return;

    const handleMouseMove = (e) => {
      const rect = rangeBarRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (currentX / rect.width) * 100));
      const priceRange = filtersData.price;
      const newPrice = priceRange.min + (percentage / 100) * (priceRange.max - priceRange.min);

      if (isDragging === 'min') {
        const currentMax = maxPrice !== undefined ? maxPrice : priceRange.max;
        const constrainedPrice = Math.max(priceRange.min, Math.min(newPrice, currentMax));
        setMinPrice(constrainedPrice);
      } else if (isDragging === 'max') {
        const currentMin = minPrice !== undefined ? minPrice : priceRange.min;
        const constrainedPrice = Math.max(currentMin, Math.min(newPrice, priceRange.max));
        setMaxPrice(constrainedPrice);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      applyFilters(getCurrentFilters());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, filtersData, minPrice, maxPrice]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (priceDebounceRef.current.min) {
        clearTimeout(priceDebounceRef.current.min);
      }
      if (priceDebounceRef.current.max) {
        clearTimeout(priceDebounceRef.current.max);
      }
    };
  }, []);

  const handleMoqChange = (type, value) => {
    const parsedValue = parseInt(value);
    let newMinMoq = minMoq;
    let newMaxMoq = maxMoq;
    if (type === "min") {
      const max = maxMoq ? parseInt(maxMoq) : moqRange.max;
      newMinMoq = parsedValue <= max ? parsedValue.toString() : max.toString();
      setMinMoq(newMinMoq);
    } else {
      const min = minMoq ? parseInt(minMoq) : moqRange.min;
      newMaxMoq = parsedValue >= min ? parsedValue.toString() : min.toString();
      setMaxMoq(newMaxMoq);
    }
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      minMoq: newMinMoq || undefined,
      maxMoq: newMaxMoq || undefined,
    });
  };

  const handleStockChange = (type, value) => {
    const parsedValue = parseInt(value);
    let newMinStock = minStock;
    let newMaxStock = maxStock;
    if (type === "min") {
      const max = maxStock ? parseInt(maxStock) : stockRange.max;
      newMinStock = parsedValue <= max ? parsedValue.toString() : max.toString();
      setMinStock(newMinStock);
    } else {
      const min = minStock ? parseInt(minStock) : stockRange.min;
      newMaxStock = parsedValue >= min ? parsedValue.toString() : min.toString();
      setMaxStock(newMaxStock);
    }
    // Apply filter immediately
    applyFilters({
      ...getCurrentFilters(),
      minStock: newMinStock || undefined,
      maxStock: newMaxStock || undefined,
    });
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

  // Skeleton loader for price range filter
  const RangeSliderSkeleton = () => (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="w-full flex items-center justify-between py-3 px-1">
        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
        <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="pb-3 pt-1">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full animate-pulse mb-2"></div>
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
          {/* Price Range - Professional Design */}
          <FilterSection
            sectionKey="priceRange"
            title="Price Range"
            isOpen={openSections.priceRange}
            onToggle={toggleSection}
          >
            <div className="space-y-4">
              {/* Input Fields */}
              {/* <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1.5">Min Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-500">$</span>
                    <input
                      type="text"
                      placeholder={priceRange.min?.toString() || "0"}
                      value={minPrice !== undefined ? minPrice.toString() : ''}
                      onChange={(e) => handlePriceInputChange("min", e.target.value)}
                      onBlur={() => handlePriceInputBlur("min")}
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-sm hover:shadow-md"
                      aria-label="Minimum price"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1.5">Max Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-500">$</span>
                    <input
                      type="text"
                      placeholder={priceRange.max?.toString() || "0"}
                      value={maxPrice !== undefined ? maxPrice.toString() : ''}
                      onChange={(e) => handlePriceInputChange("max", e.target.value)}
                      onBlur={() => handlePriceInputBlur("max")}
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-sm hover:shadow-md"
                      aria-label="Maximum price"
                    />
                  </div>
                </div>
              </div> */}

              {/* Visual Range Indicator */}
              <div className="relative">
                {/* <div className="flex items-center justify-between mb-2"> */}
                  {/* <span className="text-xs text-gray-500 font-medium">Range</span> */}
                  {/* <span className="text-xs text-gray-500 font-medium">
                    {convertPrice(priceRange.min)} - {convertPrice(priceRange.max)}
                  </span> */}
                {/* </div> */}
                <div 
                  ref={rangeBarRef}
                  className="relative h-2 bg-gray-200 rounded-full cursor-pointer select-none"
                  onClick={(e) => {
                    // Only handle click if not dragging
                    if (!isDragging) {
                      handleRangeBarClick(e);
                    }
                  }}
                  onMouseDown={(e) => {
                    const rect = rangeBarRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const clickX = e.clientX - rect.left;
                    const percentage = (clickX / rect.width) * 100;
                    const currentMinPercent = priceRange.max > 0 
                      ? ((minPrice !== undefined ? minPrice : priceRange.min) / priceRange.max) * 100 
                      : 0;
                    const currentMaxPercent = priceRange.max > 0 
                      ? ((maxPrice !== undefined ? maxPrice : priceRange.max) / priceRange.max) * 100 
                      : 0;
                    
                    const minDistance = Math.abs(percentage - currentMinPercent);
                    const maxDistance = Math.abs(percentage - currentMaxPercent);
                    
                    // Check if clicking near markers (within 5% threshold)
                    if (minDistance < maxDistance && minDistance < 5) {
                      handleRangeBarMouseDown(e, 'min');
                    } else if (maxDistance < 5) {
                      handleRangeBarMouseDown(e, 'max');
                    }
                    // If clicking far from markers, the click handler will move the range
                  }}
                >
                  <div
                    className="absolute h-2 bg-blue-600 rounded-full transition-all duration-100"
                    style={{
                      left: `${
                        priceRange.max > 0 
                          ? ((minPrice !== undefined ? minPrice : priceRange.min) / priceRange.max) * 100 
                          : 0
                      }%`,
                      width: `${
                        priceRange.max > 0
                          ? (((maxPrice !== undefined ? maxPrice : priceRange.max) - (minPrice !== undefined ? minPrice : priceRange.min)) / priceRange.max) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                  {/* Min marker */}
                  <div
                    className={`absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1 transition-transform ${
                      isDragging === 'min' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'
                    }`}
                    style={{
                      left: `${
                        priceRange.max > 0 
                          ? ((minPrice !== undefined ? minPrice : priceRange.min) / priceRange.max) * 100 
                          : 0
                      }%`,
                      top: '50%',
                      marginTop: '-8px',
                    }}
                    title={`Min: ${convertPrice(minPrice !== undefined ? minPrice : priceRange.min)}`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleRangeBarMouseDown(e, 'min');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleRangeBarMouseDown(e.touches[0], 'min');
                    }}
                  ></div>
                  {/* Max marker */}
                  <div
                    className={`absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1 transition-transform ${
                      isDragging === 'max' ? 'scale-125 cursor-grabbing' : 'cursor-grab hover:scale-110'
                    }`}
                    style={{
                      left: `${
                        priceRange.max > 0 
                          ? ((maxPrice !== undefined ? maxPrice : priceRange.max) / priceRange.max) * 100 
                          : 0
                      }%`,
                      top: '50%',
                      marginTop: '-8px',
                    }}
                    title={`Max: ${convertPrice(maxPrice !== undefined ? maxPrice : priceRange.max)}`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleRangeBarMouseDown(e, 'max');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleRangeBarMouseDown(e.touches[0], 'max');
                    }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs font-semibold text-blue-600">
                    {convertPrice(minPrice !== undefined ? minPrice : priceRange.min)}
                  </div>
                  <div className="text-xs text-gray-400">-</div>
                  <div className="text-xs font-semibold text-blue-600">
                    {convertPrice(maxPrice !== undefined ? maxPrice : priceRange.max)}
                  </div>
                </div>
              </div>

              {/* Quick Filters */}
              {/* <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => {
                    setMinPrice(undefined);
                    setMaxPrice(undefined);
                    applyFilters({
                      ...getCurrentFilters(),
                      minPrice: undefined,
                      maxPrice: undefined,
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    const midPoint = (priceRange.min + priceRange.max) / 2;
                    setMinPrice(priceRange.min);
                    setMaxPrice(Math.round(midPoint));
                    applyFilters({
                      ...getCurrentFilters(),
                      minPrice: priceRange.min,
                      maxPrice: Math.round(midPoint),
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Under {convertPrice(Math.round((priceRange.min + priceRange.max) / 2))}
                </button>
                <button
                  onClick={() => {
                    const midPoint = (priceRange.min + priceRange.max) / 2;
                    setMinPrice(Math.round(midPoint));
                    setMaxPrice(priceRange.max);
                    applyFilters({
                      ...getCurrentFilters(),
                      minPrice: Math.round(midPoint),
                      maxPrice: priceRange.max,
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Over {convertPrice(Math.round((priceRange.min + priceRange.max) / 2))}
                </button>
              </div> */}
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
    </aside>
  );
};

export default SideFilter;
