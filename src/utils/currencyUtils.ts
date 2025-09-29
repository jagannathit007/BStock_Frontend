/**
 * Currency utility functions for price conversion and formatting
 * Based on user's business profile currency settings
 */

export interface UserCurrency {
  _id: string;
  currencyCode: string;
  rate: string;
}

/**
 * Currency symbols mapping
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  SGD: 'S$',
  HKD: 'HK$',
  AED: 'د.إ',
  INR: '₹',
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};

/**
 * Set user's currency information in localStorage
 * @param currency - User's currency object from login response
 */
export const setCurrency = (currency: UserCurrency): void => {
  try {
    localStorage.setItem('userCurrency', JSON.stringify(currency));
    
    // Dispatch event to notify components about currency change
    window.dispatchEvent(new CustomEvent('currencyUpdated', { 
      detail: currency 
    }));
  } catch (error) {
    console.error('Error saving currency to localStorage:', error);
  }
};

/**
 * Get user's currency information from localStorage
 * @returns User's currency information or null
 */
export const getCurrency = (): UserCurrency | null => {
  try {
    const currencyData = localStorage.getItem('userCurrency');
    
    if (!currencyData) return null;
    
    return JSON.parse(currencyData);
  } catch (error) {
    console.error('Error getting currency from localStorage:', error);
    return null;
  }
};

/**
 * Convert price from USD to user's currency and format it
 * @param priceInUSD - Price in USD (can be number, string, or other)
 * @returns Formatted price string in user's currency
 */
export const convertPrice = (priceInUSD: any): string => {
  // Convert input to number and validate
  const numericPrice = typeof priceInUSD === 'string' ? parseFloat(priceInUSD) : Number(priceInUSD);
  
  if (isNaN(numericPrice) || numericPrice < 0) {
    // Return $0.00 for invalid prices
    return '$0.00';
  }
  
  const userCurrency = getCurrency();
  
  if (!userCurrency || !userCurrency.rate) {
    // Fallback to USD if no currency data
    return `$${numericPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  
  const rate = parseFloat(userCurrency.rate);
  if (isNaN(rate) || rate <= 0) {
    // Fallback to USD if invalid rate
    return `$${numericPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  
  const convertedPrice = numericPrice * rate;
  const symbol = getCurrencySymbol(userCurrency.currencyCode);
  
  // Format the converted price with proper decimals
  const formattedPrice = convertedPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formattedPrice}`;
};

