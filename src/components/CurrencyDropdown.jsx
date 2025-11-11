import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import 'flag-icons/css/flag-icons.min.css';

const CurrencyDropdown = () => {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currencies = [
    { code: 'USD', label: 'USD', flagClass: 'fi fi-us' },
    { code: 'AED', label: 'AED', flagClass: 'fi fi-ae' },
    { code: 'HKD', label: 'HK', flagClass: 'fi fi-hk' },
  ];

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCurrencySelect = (currencyCode) => {
    setSelectedCurrency(currencyCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 text-gray-500 rounded-lg relative cursor-pointer group flex items-center space-x-2 transition-colors nav-button-hover"
        title="Select Currency"
      >
        <span className={`${selectedCurrencyData.flagClass} rounded-sm`} style={{ width: '16px', height: '12px' }}></span>
        <span className="text-sm font-medium hidden lg:inline-block">{selectedCurrencyData.label}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200">
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencySelect(currency.code)}
              className={`flex items-center space-x-3 w-full px-4 py-3 text-sm transition-colors ${
                selectedCurrency === currency.code
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`${currency.flagClass} rounded-sm`} style={{ width: '16px', height: '12px' }}></span>
              <span>{currency.label}</span>
              {selectedCurrency === currency.code && (
                <svg className="w-4 h-4 ml-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencyDropdown;

