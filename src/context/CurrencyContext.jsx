import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    try {
      return localStorage.getItem('selectedCurrency') || 'USD';
    } catch {
      return 'USD';
    }
  });

  const [customerCountryCurrency, setCustomerCountryCurrency] = useState(null);

  useEffect(() => {
    // Get customer business profile country
    const updateCustomerCurrency = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const country = user?.businessProfile?.country;
        
        // Map country to currency
        const countryToCurrency = {
          'Hongkong': 'HKD',
          'Dubai': 'AED',
        };
        
        if (country && countryToCurrency[country]) {
          const currency = countryToCurrency[country];
          setCustomerCountryCurrency(currency);
        } else {
          setCustomerCountryCurrency(null);
        }
      } catch (error) {
        console.error('Error getting customer country currency:', error);
        setCustomerCountryCurrency(null);
      }
    };

    // Initial load
    updateCustomerCurrency();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      updateCustomerCurrency();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const toggleCurrency = () => {
    if (!customerCountryCurrency) return;
    
    // Toggle between AED and customer's country currency
    const newCurrency = selectedCurrency === 'AED' ? customerCountryCurrency : 'AED';
    setSelectedCurrency(newCurrency);
    localStorage.setItem('selectedCurrency', newCurrency);
    
    // Dispatch event to notify components about currency change
    window.dispatchEvent(new CustomEvent('currencyChanged', { 
      detail: { currency: newCurrency } 
    }));
  };

  const value = {
    selectedCurrency,
    customerCountryCurrency,
    toggleCurrency,
    setSelectedCurrency: (currency) => {
      setSelectedCurrency(currency);
      localStorage.setItem('selectedCurrency', currency);
      window.dispatchEvent(new CustomEvent('currencyChanged', { 
        detail: { currency } 
      }));
    }
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

