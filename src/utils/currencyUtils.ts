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
 * Format price in USD without currency conversion
 * Use this for wallet, transactions, and other areas where currency conversion should not apply
 * @param priceInUSD - Price in USD (can be number, string, or other)
 * @returns Formatted price string in USD
 */
export const formatPriceUSD = (priceInUSD: any): string => {
  // Convert input to number and validate
  const numericPrice = typeof priceInUSD === 'string' ? parseFloat(priceInUSD) : Number(priceInUSD);
  
  if (isNaN(numericPrice) || numericPrice < 0) {
    // Return $0.00 for invalid prices
    return '$0.00';
  }

  // Always format in USD without conversion
  return `$${numericPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Convert price from USD to user's currency and format it
 * @param priceInUSD - Price in USD (can be number, string, or other)
 * @returns Formatted price string in user's currency
 */
export const convertPrice = (price: any): string => {
  // Treat incoming price as already in the selected currency; no extra conversion
  const numericPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  if (isNaN(numericPrice) || numericPrice < 0) {
    return '$0.00';
  }
  const selectedCurrency = localStorage.getItem('selectedCurrency') || 'USD';
  const symbol = getCurrencySymbol(selectedCurrency);
  return `${symbol}${numericPrice.toLocaleString('en-US', {
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

