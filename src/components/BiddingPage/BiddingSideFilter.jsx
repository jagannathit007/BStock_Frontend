import { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const BiddingSideFilter = ({ onFilterChange, onClose, appliedFilters }) => {
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState({ grades: [], models: [], capacities: [], carriers: [], priceRange: { min: 0, max: 0 } });
  const [selected, setSelected] = useState({ grades: [], models: [], capacities: [], carriers: [], minPrice: undefined, maxPrice: undefined });
  const [collapsed, setCollapsed] = useState({ priceRange: false, grades: false, models: false, capacities: false, carriers: false });

  useEffect(() => {
    let cancel;
    const fetchFilters = async () => {
      try {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
        const res = await axios.post(
          `${baseUrl}/api/customer/get-bid-filters`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
            },
            cancelToken: new axios.CancelToken((c) => (cancel = c)),
          }
        );
        if (res.data?.status === 200) {
          setFacets(res.data.data || {});
          const { min, max } = res.data.data?.priceRange || { min: 0, max: 0 };
          setSelected((prev) => ({
            ...prev,
            minPrice: prev.minPrice ?? appliedFilters?.minPrice ?? min,
            maxPrice: prev.maxPrice ?? appliedFilters?.maxPrice ?? max,
          }));
        }
      } catch (e) {
        if (!axios.isCancel(e)) console.error("Fetch bid filters error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFilters();
    return () => cancel && cancel();
  }, []);

  // Hydrate local state from applied filters when opening/props change
  useEffect(() => {
    if (!appliedFilters) return;
    setSelected((prev) => ({
      ...prev,
      grades: Array.isArray(appliedFilters.grade) ? appliedFilters.grade : (appliedFilters.grades || prev.grades),
      models: Array.isArray(appliedFilters.models) ? appliedFilters.models : prev.models,
      capacities: Array.isArray(appliedFilters.capacities) ? appliedFilters.capacities : prev.capacities,
      carriers: Array.isArray(appliedFilters.carriers) ? appliedFilters.carriers : prev.carriers,
      minPrice: appliedFilters.minPrice ?? prev.minPrice,
      maxPrice: appliedFilters.maxPrice ?? prev.maxPrice,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters?.grade, appliedFilters?.grades, appliedFilters?.models, appliedFilters?.capacities, appliedFilters?.carriers, appliedFilters?.minPrice, appliedFilters?.maxPrice]);

  const toggle = (key, value) => {
    setSelected((prev) => {
      const current = new Set(prev[key]);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [key]: Array.from(current) };
    });
  };

  const clearAll = () => {
    const next = { grades: [], models: [], capacities: [], carriers: [], minPrice: facets.priceRange?.min, maxPrice: facets.priceRange?.max };
    setSelected(next);
  };

  // Apply filters function - called when user clicks "Apply Filters" button
  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        grade: selected.grades,
        models: selected.models,
        capacities: selected.capacities,
        carriers: selected.carriers,
        minPrice: selected.minPrice,
        maxPrice: selected.maxPrice,
      });
      // Close mobile filter overlay if open
      if (onClose) {
        onClose();
      }
    }
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    const defaultMin = facets.priceRange?.min;
    const defaultMax = facets.priceRange?.max;
    return (
      selected.grades.length > 0 ||
      selected.models.length > 0 ||
      selected.capacities.length > 0 ||
      selected.carriers.length > 0 ||
      (selected.minPrice !== undefined && selected.minPrice !== defaultMin) ||
      (selected.maxPrice !== undefined && selected.maxPrice !== defaultMax)
    );
  };


  const renderGroup = (title, key, items) => (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors rounded-lg px-1 -mx-1"
      >
        <h4 className="text-sm font-semibold text-gray-800 tracking-tight">
          {title}
        </h4>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${collapsed[key] ? '' : 'transform rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsed[key] && (
        <div className="pb-3 pt-1">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {items.length > 0 ? (
              items.map((i) => {
                const isSelected = selected[key]?.includes(i.value);
                return (
                  <label
                    key={i.value}
                    className={`flex items-center cursor-pointer group px-2 py-1.5 rounded-md transition-colors ${
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(key, i.value)}
                      className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 focus:ring-1 cursor-pointer"
                    />
                    <span className={`ml-2 text-xs text-gray-700 ${
                      isSelected ? "font-medium text-gray-900" : ""
                    }`}>
                      {i.value}
                    </span>
                  </label>
                );
              })
            ) : (
              <div className="col-span-2 text-xs text-gray-400 py-2">No options available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const handlePriceSliderChange = (type, value) => {
    const numValue = parseFloat(value);
    setSelected((prev) => ({ ...prev, [type]: numValue }));
  };

  return (
    <aside className="bg-white h-fit sticky top-24 w-full lg:w-72 border-r border-gray-100 flex flex-col max-h-[calc(100vh-6rem)]">
      <style>{`
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
      `}</style>
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


        {loading ? (
          <>
            {/* Loading Skeletons */}
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
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
            ))}
          </>
        ) : (
          <>
            {/* Price Range */}
            <div className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => setCollapsed((prev) => ({ ...prev, priceRange: !prev.priceRange }))}
                className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors rounded-lg px-1 -mx-1"
              >
                <h4 className="text-sm font-semibold text-gray-800 tracking-tight">
                  Price Range
                </h4>
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${collapsed.priceRange ? '' : 'transform rotate-180'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {!collapsed.priceRange && (
                <div className="pb-3 pt-1">
                  <div className="range-container">
                    <input
                      type="range"
                      min={facets.priceRange?.min || 0}
                      max={facets.priceRange?.max || 0}
                      value={selected.minPrice ?? facets.priceRange?.min ?? 0}
                      onChange={(e) => handlePriceSliderChange('minPrice', e.target.value)}
                      className="min-range"
                      style={{ zIndex: 2 }}
                      aria-label="Minimum price"
                    />
                    <input
                      type="range"
                      min={facets.priceRange?.min || 0}
                      max={facets.priceRange?.max || 0}
                      value={selected.maxPrice ?? facets.priceRange?.max ?? 0}
                      onChange={(e) => handlePriceSliderChange('maxPrice', e.target.value)}
                      className="max-range"
                      style={{ zIndex: 1 }}
                      aria-label="Maximum price"
                    />
                    <div
                      className="absolute h-1 bg-blue-600 rounded-full"
                      style={{
                        left: `${
                          ((selected.minPrice ?? facets.priceRange?.min ?? 0) / (facets.priceRange?.max || 1)) * 100
                        }%`,
                        width: `${
                          (((selected.maxPrice ?? facets.priceRange?.max ?? 0) -
                            (selected.minPrice ?? facets.priceRange?.min ?? 0)) /
                            (facets.priceRange?.max || 1)) *
                          100
                        }%`,
                        zIndex: 0,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-600 font-medium">
                      ${selected.minPrice ?? facets.priceRange?.min ?? 0}
                    </div>
                    <div className="text-xs text-gray-400">-</div>
                    <div className="text-xs text-gray-600 font-medium">
                      ${selected.maxPrice ?? facets.priceRange?.max ?? 0}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {renderGroup('Condition', 'grades', facets.grades)}
            {renderGroup('Model', 'models', facets.models)}
            {renderGroup('Memory', 'capacities', facets.capacities)}
            {renderGroup('Carrier', 'carriers', facets.carriers)}
          </>
        )}
      </div>
      
      {/* Apply Filters Button - Desktop & Mobile */}
      <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] z-10">
        <div className="flex gap-3">
          <button
            onClick={clearAll}
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

export default BiddingSideFilter;


