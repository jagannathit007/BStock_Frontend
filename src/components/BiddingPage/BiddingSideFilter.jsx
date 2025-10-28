import { useEffect, useState } from "react";
import axios from "axios";

const BiddingSideFilter = ({ onFilterChange, onClose }) => {
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
          setSelected((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
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
    <div className="mb-6">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{title}</div>
      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {items.map((i) => (
          <label key={i.value} className="flex items-center justify-between text-sm text-gray-700 cursor-pointer">
            <span className="truncate mr-2">{i.value}</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-xs">{i.count}</span>
              <input
                type="checkbox"
                checked={selected[key]?.includes(i.value)}
                onChange={() => toggle(key, i.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
          </label>
        ))}
        {items.length === 0 && <div className="text-xs text-gray-400">No options</div>}
      </div>
    </div>
  );

  return (
    <aside className="w-full p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold">Filters</div>
        {onClose && (
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Close</button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading filters...</div>
      ) : (
        <>
          {/* Price range */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Price Range</div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                value={selected.minPrice ?? ''}
                onChange={(e) => onPriceChange('minPrice', e.target.value)}
                placeholder="Min"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                value={selected.maxPrice ?? ''}
                onChange={(e) => onPriceChange('maxPrice', e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>

          {renderGroup('Condition', 'grades', facets.grades)}
          {renderGroup('Model', 'models', facets.models)}
          {renderGroup('Memory', 'capacities', facets.capacities)}
          {renderGroup('Carrier', 'carriers', facets.carriers)}
        </>
      )}
    </aside>
  );
};

export default BiddingSideFilter;


