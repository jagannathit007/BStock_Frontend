import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

const CurrencyToggle = ({ className = '' }) => {
  const { selectedCurrency, customerCountryCurrency, setSelectedCurrency } = useCurrency();

  const getCurrencyLabel = (code) => {
    const labels = {
      'USD': 'USD',
      'HKD': 'HK',
      'AED': 'AED',
      'SGD': 'SGD',
      'INR': 'INR'
    };
    return labels[code] || code;
  };

  const getCurrencyFlag = (code) => {
    const flags = {
      'USD': '🇺🇸',
      'HKD': '🇭🇰',
      'AED': '🇦🇪',
      'SGD': '🇸🇬',
      'INR': '🇮🇳'
    };
    return flags[code] || '';
  };

  const handleCurrencyClick = (currency) => {
    setSelectedCurrency(currency);
  };

  // If no customer country currency, only show USD and AED
  const showThirdCurrency = customerCountryCurrency && customerCountryCurrency !== 'AED';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* USD Button - Always shown */}
      <button
        onClick={() => handleCurrencyClick('USD')}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
          selectedCurrency === 'USD'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-gray-100'
        }`}
      >
        <span>{getCurrencyFlag('USD')}</span>
        <span>{getCurrencyLabel('USD')}</span>
        {selectedCurrency === 'USD' && (
          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
      </button>

      {/* AED Button - Always shown */}
      <button
        onClick={() => handleCurrencyClick('AED')}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
          selectedCurrency === 'AED'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-gray-100'
        }`}
      >
        <span>{getCurrencyFlag('AED')}</span>
        <span>{getCurrencyLabel('AED')}</span>
        {selectedCurrency === 'AED' && (
          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
      </button>

      {/* Customer Country Currency Button - Only shown if customer country is set and not AED */}
      {showThirdCurrency && (
        <button
          onClick={() => handleCurrencyClick(customerCountryCurrency)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
            selectedCurrency === customerCountryCurrency
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-gray-100'
          }`}
        >
          <span>{getCurrencyFlag(customerCountryCurrency)}</span>
          <span>{getCurrencyLabel(customerCountryCurrency)}</span>
          {selectedCurrency === customerCountryCurrency && (
            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default CurrencyToggle;

