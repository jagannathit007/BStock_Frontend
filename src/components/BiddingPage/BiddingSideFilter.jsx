import { useEffect, useState } from "react";
import axios from "axios";

const BiddingSideFilter = ({ onFilterChange, onClose, appliedFilters }) => {
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState({ grades: [], models: [], capacities: [], carriers: [], priceRange: { min: 0, max: 0 } });
  const [selected, setSelected] = useState({ grades: [], models: [], capacities: [], carriers: [], minPrice: undefined, maxPrice: undefined });

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
  }, [appliedFilters]);

  const toggle = (key, value) => {
    setSelected((prev) => {
      const current = new Set(prev[key]);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      const next = { ...prev, [key]: Array.from(current) };
      onFilterChange?.({
        grade: next.grades,
        models: next.models,
        capacities: next.capacities,
        carriers: next.carriers,
        minPrice: next.minPrice,
        maxPrice: next.maxPrice,
      });
      return next;
    });
  };

  const onPriceChange = (key, value) => {
    const num = value === "" ? undefined : Number(value);
    setSelected((prev) => {
      const next = { ...prev, [key]: num };
      onFilterChange?.({
        grade: next.grades,
        models: next.models,
        capacities: next.capacities,
        carriers: next.carriers,
        minPrice: next.minPrice,
        maxPrice: next.maxPrice,
      });
      return next;
    });
  };

  const renderGroup = (title, key, items) => (
    <div className="mb-8">
      <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">{title}</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {items.map((i) => (
          <label
            key={i.value}
            className="flex items-center justify-between text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-all duration-200"
          >
            <span className="truncate mr-2">{i.value}</span>
            <div className="flex items-center space-x-3">
              <span className="text-gray-400 text-xs">{i.count}</span>
              <input
                type="checkbox"
                checked={selected[key]?.includes(i.value)}
                onChange={() => toggle(key, i.value)}
              />
            </div>
          </label>
        ))}
        {items.length === 0 && <div className="text-xs text-gray-400">No options</div>}
      </div>
    </div>
  );

  const handlePriceSliderChange = (type, value) => {
    const numValue = parseFloat(value);
    setSelected((prev) => {
      const next = { ...prev, [type]: numValue };
      onFilterChange?.({
        grade: next.grades,
        models: next.models,
        capacities: next.capacities,
        carriers: next.carriers,
        minPrice: next.minPrice,
        maxPrice: next.maxPrice,
      });
      return next;
    });
  };

  return (
    <aside className="w-full bg-white rounded-xl border border-gray-200">
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
      `}</style>
      <div className="px-6 py-8 bg-[#FAFAFF] rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 font-apple">Filters</h3>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 lg:hidden transition-colors duration-200">
              Close
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading filters...</div>
        ) : (
          <>
            {/* Price range */}
            <div className="mb-8">
              <h4 className="text-base font-medium text-gray-900 mb-4 font-apple">Price Range</h4>
              <div className="range-container mb-3">
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
                  className="absolute h-1 bg-primary rounded-full"
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
              <div className="flex justify-between text-sm text-gray-500 font-apple">
                <span>${selected.minPrice ?? facets.priceRange?.min ?? 0}</span>
                <span>${selected.maxPrice ?? facets.priceRange?.max ?? 0}</span>
              </div>
            </div>

            {renderGroup('Condition', 'grades', facets.grades)}
            {renderGroup('Model', 'models', facets.models)}
            {renderGroup('Memory', 'capacities', facets.capacities)}
            {renderGroup('Carrier', 'carriers', facets.carriers)}
          </>
        )}
      </div>
    </aside>
  );
};

export default BiddingSideFilter;


