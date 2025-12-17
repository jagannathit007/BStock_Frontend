import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPlus,
  faMinus,
  faCartShopping,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import CartService from "../../services/cart/cart.services";
import { AuthService } from "../../services/auth/auth.services";
import { useNavigate } from "react-router-dom";
import { getCurrencySymbol } from "../../utils/currencyUtils";
import { getSubSkuFamilyId } from "../../utils/productUtils";
import { useCurrency } from "../../context/CurrencyContext";

const BulkAddToCartModal = ({ products, groupCode, totalMoq, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();
  const [quantities, setQuantities] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCurrencyState, setSelectedCurrencyState] = useState(selectedCurrency || 'USD');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    
    // Initialize quantities with MOQ for each product
    const initialQuantities = {};
    products.forEach(product => {
      initialQuantities[product.id] = product.moq || 1;
    });
    setQuantities(initialQuantities);
    
    return () => {
      setMounted(false);
      document.body.style.overflow = 'unset';
    };
  }, [products]);

  // Get available countries and currencies from products
  const getAvailableOptions = () => {
    const countries = new Set();
    const currencies = new Set();
    
    products.forEach(product => {
      const rawProduct = product?._product || product;
      if (rawProduct.countryDeliverables && Array.isArray(rawProduct.countryDeliverables)) {
        rawProduct.countryDeliverables.forEach(d => {
          if (d.country) countries.add(d.country);
          if (d.currency) currencies.add(d.currency);
        });
      }
    });
    
    return {
      countries: Array.from(countries),
      currencies: Array.from(currencies)
    };
  };

  const { countries, currencies } = getAvailableOptions();

  // Auto-select country and currency if only one option
  useEffect(() => {
    if (countries.length === 1 && !selectedCountry) {
      setSelectedCountry(countries[0]);
    }
    if (currencies.length === 1 && !selectedCurrencyState) {
      setSelectedCurrencyState(currencies[0]);
    }
  }, [countries, currencies, selectedCountry, selectedCurrencyState]);

  const formatPriceInCurrency = (priceValue) => {
    const numericPrice = parseFloat(priceValue) || 0;
    const currency = selectedCurrencyState || 'USD';
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${numericPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getProductPrice = (product) => {
    const rawProduct = product?._product || product;
    if (!rawProduct.countryDeliverables || !Array.isArray(rawProduct.countryDeliverables)) {
      return parseFloat(product.price) || 0;
    }

    const normalize = (val) => (typeof val === "string" ? val.trim().toLowerCase() : "");
    const deliverable = rawProduct.countryDeliverables.find(d => {
      const dCountry = normalize(d.country);
      const dCurrency = d.currency ? normalize(d.currency) : null;
      return dCountry === normalize(selectedCountry) && dCurrency === normalize(selectedCurrencyState);
    });

    if (deliverable) {
      return parseFloat(deliverable.calculatedPrice || deliverable.basePrice || product.price || 0);
    }

    return parseFloat(product.price) || 0;
  };

  const handleQuantityChange = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const product = products.find(p => p.id === productId);
      const moq = product?.moq || 1;
      const stock = product?.stockCount || 0;
      const newQty = Math.max(moq, Math.min(stock, current + delta));
      return { ...prev, [productId]: newQty };
    });
  };

  const handleQuantityInput = (productId, value) => {
    const product = products.find(p => p.id === productId);
    const moq = product?.moq || 1;
    const stock = product?.stockCount || 0;
    let num = parseInt(value, 10);
    if (isNaN(num)) num = moq;
    num = Math.max(moq, Math.min(stock, num));
    setQuantities(prev => ({ ...prev, [productId]: num }));
  };

  const calculateTotalQuantity = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const calculateTotalPrice = () => {
    return products.reduce((sum, product) => {
      const qty = quantities[product.id] || product.moq || 1;
      const price = getProductPrice(product);
      return sum + (price * qty);
    }, 0);
  };

  const handleConfirm = async () => {
    try {
      setError(null);
      
      // Check if profile is complete
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          const isProfileComplete = AuthService.isProfileComplete(userData);
          if (!isProfileComplete) {
            onClose();
            navigate('/profile', { replace: true });
            return;
          }
        } catch (error) {
          console.error('Error checking profile completion:', error);
        }
      }

      if (!selectedCountry || !selectedCurrencyState) {
        setError("Please select both country and currency");
        return;
      }

      // Validate total MOQ if applicable
      if (totalMoq) {
        const totalQty = calculateTotalQuantity();
        if (totalQty < totalMoq) {
          setError(`Group MOQ requirement: ${totalMoq}. Current total: ${totalQty}. Please add ${totalMoq - totalQty} more item(s).`);
          return;
        }
      }

      setIsLoading(true);

      // Prepare items for bulk add
      const items = products.map(product => {
        const rawProduct = product?._product || product;
        const subSkuFamilyId = getSubSkuFamilyId(rawProduct);
        const price = getProductPrice(product);
        const qty = quantities[product.id] || product.moq || 1;

        return {
          productId: product.id,
          quantity: qty,
          subSkuFamilyId: subSkuFamilyId,
          price: price
        };
      });

      const response = await CartService.bulkAdd(items, selectedCountry, selectedCurrencyState);

      if (response?.success || response?.status === 200) {
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cartUpdated', Date.now().toString());
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const errorMessage = response?.message || response?.data?.message || "Failed to add products to cart";
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred";
      setError(errorMessage);
      console.error("Bulk add to cart error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const totalQty = calculateTotalQuantity();
  const totalPrice = calculateTotalPrice();
  const moqStatus = totalMoq ? {
    isValid: totalQty >= totalMoq,
    remaining: Math.max(0, totalMoq - totalQty)
  } : null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-[9999] transition-opacity duration-300 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faLayerGroup} className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Add All Products from Group
              </h2>
              <p className="text-sm text-gray-600 mt-1">Group: {groupCode}</p>
            </div>
          </div>
          <button
            className="w-10 h-10 flex items-center cursor-pointer justify-center rounded-lg hover:bg-gray-100 transition-all duration-200"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Country and Currency Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Country <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCountry || ""}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCurrencyState || ""}
                onChange={(e) => setSelectedCurrencyState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select currency</option>
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Group MOQ Status */}
          {moqStatus && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              moqStatus.isValid 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            }`}>
              {moqStatus.isValid ? (
                <span>✓ Group MOQ met ({totalQty}/{totalMoq})</span>
              ) : (
                <span>⚠ Need {moqStatus.remaining} more item(s) to meet group MOQ ({totalQty}/{totalMoq})</span>
              )}
            </div>
          )}

          {/* Products List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Products ({products.length})
            </h3>
            {products.map((product) => {
              const qty = quantities[product.id] || product.moq || 1;
              const price = getProductPrice(product);
              const total = price * qty;

              return (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-600">Stock: {product.stockCount}</span>
                        <span className="text-sm text-gray-600">MOQ: {product.moq}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          Price: {formatPriceInCurrency(price)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(product.id, -1)}
                          disabled={qty <= (product.moq || 1)}
                          className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => handleQuantityInput(product.id, e.target.value)}
                          min={product.moq || 1}
                          max={product.stockCount}
                          className="w-16 text-center text-sm font-semibold py-2 border-0 focus:outline-none"
                        />
                        <button
                          onClick={() => handleQuantityChange(product.id, 1)}
                          disabled={qty >= product.stockCount}
                          className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatPriceInCurrency(total)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Grand Total:</span>
              <div className="text-2xl font-bold text-gray-900">
                {formatPriceInCurrency(totalPrice)}
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {totalQty} item(s) total
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 p-6 pt-0 border-t border-gray-200">
          <button
            className="flex-1 bg-[#0071e3] hover:bg-[#0056B3] cursor-pointer text-white py-4 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirm}
            disabled={isLoading || !selectedCountry || !selectedCurrencyState}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCartShopping} className="w-5 h-5" />
                Add All to Cart
              </>
            )}
          </button>
          <button
            className="px-6 py-4 border border-gray-200 text-gray-700 cursor-pointer rounded-xl font-semibold text-base hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default BulkAddToCartModal;

