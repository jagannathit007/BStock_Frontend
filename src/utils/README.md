# Currency Utilities

This directory contains utility functions for handling currency conversion and formatting based on user's business profile settings.

## Overview

The currency utilities provide a comprehensive solution for:
- Converting prices from USD to user's local currency
- Formatting prices with proper currency symbols
- Managing user currency preferences
- Providing consistent price display across the application

## Files

### `currencyUtils.ts`
Core utility functions for currency operations:
- Price conversion functions
- Currency formatting functions
- Currency symbol and name mappings
- Validation functions

### `../hooks/useCurrency.ts`
React hook for easy currency management in components:
- Automatic currency loading from localStorage
- Real-time currency updates
- Formatted price functions
- Currency information access

## Usage Examples

### 1. Basic Price Conversion

```javascript
import { convertPrice, formatPrice } from '../utils/currencyUtils';

// Convert USD price to user's currency
const userCurrency = { currencyCode: 'SGD', rate: '1.35' };
const convertedPrice = convertPrice(100, userCurrency); // 135

// Format price with currency symbol
const formattedPrice = formatPrice(135, 'SGD'); // "S$135.00"
```

### 2. Using the useCurrency Hook

```javascript
import { useCurrency } from '../hooks/useCurrency';

const ProductCard = ({ product }) => {
  const { formatPrice, currencyCode, isLoaded } = useCurrency();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>Price: {formatPrice(product.price)}</p>
    </div>
  );
};
```

### 3. Advanced Formatting Options

```javascript
import { formatPrice } from '../utils/currencyUtils';

// Basic formatting
formatPrice(100, 'USD'); // "$100.00"

// Without currency symbol
formatPrice(100, 'USD', { showSymbol: false }); // "100.00"

// Custom decimal places
formatPrice(100, 'USD', { decimals: 0 }); // "$100"

// Different locale
formatPrice(100, 'EUR', { locale: 'de-DE' }); // "100,00 €"
```

### 4. User Currency Information

```javascript
import { getUserCurrency, getUserCurrencyCode } from '../utils/currencyUtils';

// Get user's currency object
const userCurrency = getUserCurrency();
// Returns: { _id: "...", currencyCode: "SGD", rate: "1.35" }

// Get just the currency code
const currencyCode = getUserCurrencyCode(); // "SGD"
```

## Integration Guide

### Step 1: Update Existing Components

Replace hardcoded USD prices with currency-aware formatting:

**Before:**
```javascript
<span className="price">${product.price}</span>
```

**After:**
```javascript
import { useCurrency } from '../hooks/useCurrency';

const { formatPrice } = useCurrency();
<span className="price">{formatPrice(product.price)}</span>
```

### Step 2: Handle Loading States

Always check if currency data is loaded before displaying prices:

```javascript
const { formatPrice, isLoaded } = useCurrency();

if (!isLoaded) {
  return <div>Loading prices...</div>;
}

return <span>{formatPrice(product.price)}</span>;
```

### Step 3: Update API Response Handling

The login API response includes currency information:
```json
{
  "data": {
    "customer": {
      "currency": {
        "_id": "68da7d04b569833557737b64",
        "currencyCode": "SGD",
        "rate": "55"
      }
    }
  }
}
```

This data is automatically saved to localStorage and used by the currency utilities.

## Supported Currencies

The system supports the following currencies with proper symbols:

- USD - US Dollar ($)
- EUR - Euro (€)
- GBP - British Pound (£)
- JPY - Japanese Yen (¥)
- HKD - Hong Kong Dollar (HK$)
- AED - UAE Dirham (د.إ)
- INR - Indian Rupee (₹)
- CAD - Canadian Dollar (C$)
- AUD - Australian Dollar (A$)
- And many more...

## Best Practices

1. **Always use the hook**: Prefer `useCurrency()` hook over direct utility functions in React components
2. **Handle loading states**: Check `isLoaded` before displaying prices
3. **Consistent formatting**: Use the same formatting options across similar components
4. **Error handling**: The utilities gracefully fall back to USD if currency data is unavailable
5. **Performance**: The hook automatically updates when user currency changes

## Migration Checklist

- [ ] Import `useCurrency` hook in components that display prices
- [ ] Replace `${price}` with `formatPrice(price)`
- [ ] Add loading state checks
- [ ] Test with different currency settings
- [ ] Verify price calculations are correct
- [ ] Update any hardcoded currency symbols

## Troubleshooting

### Prices not converting
- Check if user currency data exists in localStorage
- Verify the currency rate is a valid number
- Ensure the hook is properly imported and used

### Currency symbol not displaying
- Check if the currency code is supported
- Verify the currency code matches the mapping in `CURRENCY_SYMBOLS`

### Performance issues
- The hook only re-renders when currency data changes
- Use `usePriceFormatter` for components that only need formatting
- Avoid calling utility functions directly in render loops
