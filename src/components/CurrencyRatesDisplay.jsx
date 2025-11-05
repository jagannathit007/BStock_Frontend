import React from 'react';
import { getCurrencyRates, formatPriceForCurrency } from '../utils/currencyUtils';

const CurrencyRatesDisplay = ({ 
  priceInUSD, 
  className = '',
  variant = 'compact' 
}) => {
  const rates = getCurrencyRates();
  
  if (!rates) {
    return null;
  }

  const currencyData = [
    { code: 'HKD', label: 'HK', flag: '🇭🇰' },
    { code: 'AED', label: 'AED', flag: '🇦🇪' },
  ];

  if (variant === 'full') {
    currencyData.push({ code: 'SGD', label: 'SGD', flag: '🇸🇬' });
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {currencyData.map((currency) => {
        const formattedPrice = formatPriceForCurrency(priceInUSD, currency.code, rates);
        return (
          <div
            key={currency.code}
            className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="mr-1">{currency.flag}</span>
            <span className="font-semibold">{currency.label}</span>
            <span className="ml-1 text-gray-600">-</span>
            <span className="ml-1">{formattedPrice}</span>
          </div>
        );
      })}
    </div>
  );
};

export default CurrencyRatesDisplay;

