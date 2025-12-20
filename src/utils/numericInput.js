/**
 * Utility function to handle numeric input changes
 * Filters input to only allow numbers and decimal points
 * @param {string} value - The input value
 * @param {boolean} allowDecimals - Whether to allow decimal points (default: true)
 * @param {boolean} allowNegative - Whether to allow negative numbers (default: false)
 * @returns {string} Filtered numeric string
 */
export const handleNumericInput = (value, allowDecimals = true, allowNegative = false) => {
  // Remove all non-numeric characters except decimal point and minus sign
  let filtered = value;
  
  if (allowDecimals && allowNegative) {
    // Allow numbers, one decimal point, and one minus sign at the start
    filtered = value.replace(/[^\d.-]/g, '');
    // Ensure only one decimal point
    const parts = filtered.split('.');
    if (parts.length > 2) {
      filtered = parts[0] + '.' + parts.slice(1).join('');
    }
    // Ensure minus sign is only at the start
    if (filtered.includes('-')) {
      const minusIndex = filtered.indexOf('-');
      if (minusIndex !== 0) {
        filtered = filtered.replace(/-/g, '');
      }
      // Only allow one minus sign
      if ((filtered.match(/-/g) || []).length > 1) {
        filtered = '-' + filtered.replace(/-/g, '');
      }
    }
  } else if (allowDecimals) {
    // Allow numbers and one decimal point
    filtered = value.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = filtered.split('.');
    if (parts.length > 2) {
      filtered = parts[0] + '.' + parts.slice(1).join('');
    }
  } else if (allowNegative) {
    // Allow numbers and one minus sign at the start
    filtered = value.replace(/[^\d-]/g, '');
    // Ensure minus sign is only at the start
    if (filtered.includes('-')) {
      const minusIndex = filtered.indexOf('-');
      if (minusIndex !== 0) {
        filtered = filtered.replace(/-/g, '');
      }
      // Only allow one minus sign
      if ((filtered.match(/-/g) || []).length > 1) {
        filtered = '-' + filtered.replace(/-/g, '');
      }
    }
  } else {
    // Only allow digits
    filtered = value.replace(/[^\d]/g, '');
  }
  
  return filtered;
};

/**
 * Validates if a string is a valid number
 * @param {string} value - The value to validate
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @returns {Object} Object with isValid boolean and error message
 */
export const validateNumericValue = (value, min, max) => {
  if (value === '' || value === null || value === undefined) {
    return { isValid: false, error: 'Value is required' };
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Must be a valid number' };
  }
  
  if (min !== undefined && numValue < min) {
    return { isValid: false, error: `Must be at least ${min}` };
  }
  
  if (max !== undefined && numValue > max) {
    return { isValid: false, error: `Must be at most ${max}` };
  }
  
  return { isValid: true };
};

