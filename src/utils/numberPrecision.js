/**
 * Round a number to 2 decimal places
 * @param {number|string|null|undefined} value - The number to round
 * @returns {number} Rounded number with 2 decimal places
 */
export const roundToTwoDecimals = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) {
    return 0;
  }
  return Math.round((numValue + Number.EPSILON) * 100) / 100;
};

/**
 * Format a number to 2 decimal places as a string
 * @param {number|string|null|undefined} value - The number to format
 * @returns {string} Formatted string with 2 decimal places
 */
export const formatToTwoDecimals = (value) => {
  return roundToTwoDecimals(value).toFixed(2);
};

/**
 * Round all numeric values in an object to 2 decimal places
 * Recursively processes nested objects and arrays
 * @param {any} obj - Object, array, or value to process
 * @returns {any} Object with all numbers rounded to 2 decimals
 */
export const roundObjectNumbers = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'number') {
    return roundToTwoDecimals(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => roundObjectNumbers(item));
  }
  
  if (typeof obj === 'object') {
    const rounded = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        rounded[key] = roundObjectNumbers(obj[key]);
      }
    }
    return rounded;
  }
  
  return obj;
};

