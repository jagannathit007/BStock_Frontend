import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import 'flag-icons/css/flag-icons.min.css';

const CurrencyToggle = ({ className = '' }) => {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

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

  const getCurrencyFlagClass = (code) => {
    const flagClasses = {
      'USD': 'fi fi-us',
      'HKD': 'fi fi-hk',
      'AED': 'fi fi-ae',
      'SGD': 'fi fi-sg',
      'INR': 'fi fi-in'
    };
    return flagClasses[code] || '';
  };

  const handleCurrencyClick = (currency) => {
    setSelectedCurrency(currency);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* USD Button */}
      <button
        onClick={() => handleCurrencyClick('USD')}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
          selectedCurrency === 'USD'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-gray-100'
        }`}
      >
        <span className={`${getCurrencyFlagClass('USD')} rounded-sm`} style={{ width: '16px', height: '12px' }}></span>
        <span>{getCurrencyLabel('USD')}</span>
      </button>

      {/* AED Button */}
      <button
        onClick={() => handleCurrencyClick('AED')}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
          selectedCurrency === 'AED'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-gray-100'
        }`}
      >
        <span className={`${getCurrencyFlagClass('AED')} rounded-sm`} style={{ width: '16px', height: '12px' }}></span>
        <span>{getCurrencyLabel('AED')}</span>
      </button>

      {/* HKD Button - Always shown */}
      <button
        onClick={() => handleCurrencyClick('HKD')}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
          selectedCurrency === 'HKD'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-gray-100'
        }`}
      >
        <span className={`${getCurrencyFlagClass('HKD')} rounded-sm`} style={{ width: '16px', height: '12px' }}></span>
        <span>{getCurrencyLabel('HKD')}</span>
      </button>
    </div>
  );
};

export default CurrencyToggle;

