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
  AED: 'AED ',
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
  
  // Check for selected currency from localStorage (set by toggle)
  try {
    const selectedCurrency = localStorage.getItem('selectedCurrency');
    if (selectedCurrency && selectedCurrency !== 'USD') {
      const rates = getCurrencyRates();
      if (rates) {
        const currencyCode = selectedCurrency as 'AED' | 'SGD' | 'HKD';
        if (rates[currencyCode]) {
          return formatPriceForCurrency(numericPrice, currencyCode, rates);
        }
      }
    }
  } catch (_) {
    // Fallback silently
  }

  // Default to USD pricing (if no currency selected or no rates available)
  return `$${numericPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Interface for currency rates from API
 */
export interface CurrencyRates {
  AED: number;
  SGD: number;
  HKD: number;
}

/**
 * Get currency rates from localStorage
 * @returns Currency rates object or null
 */
export const getCurrencyRates = (): CurrencyRates | null => {
  try {
    const ratesData = localStorage.getItem('currencyRates');
    if (!ratesData) return null;
    return JSON.parse(ratesData);
  } catch (error) {
    console.error('Error getting currency rates from localStorage:', error);
    return null;
  }
};

/**
 * Convert price from USD to a specific currency
 * @param priceInUSD - Price in USD
 * @param currencyCode - Currency code (AED, SGD, HKD)
 * @param rates - Currency rates object
 * @returns Converted price as number
 */
export const convertPriceToCurrency = (
  priceInUSD: number,
  currencyCode: 'AED' | 'SGD' | 'HKD',
  rates: CurrencyRates | null
): number => {
  if (!rates || !rates[currencyCode]) {
    return priceInUSD;
  }
  const numericPrice = typeof priceInUSD === 'string' ? parseFloat(priceInUSD) : Number(priceInUSD);
  if (isNaN(numericPrice)) return 0;
  return numericPrice * rates[currencyCode];
};

/**
 * Format price for a specific currency
 * @param priceInUSD - Price in USD
 * @param currencyCode - Currency code (AED, SGD, HKD)
 * @param rates - Currency rates object
 * @returns Formatted price string
 */
export const formatPriceForCurrency = (
  priceInUSD: number,
  currencyCode: 'AED' | 'SGD' | 'HKD',
  rates: CurrencyRates | null
): string => {
  const convertedPrice = convertPriceToCurrency(priceInUSD, currencyCode, rates);
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${convertedPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

