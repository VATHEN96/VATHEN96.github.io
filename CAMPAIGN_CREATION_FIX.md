# Campaign Creation Fix Documentation

## Issue Summary

The campaign creation process was failing with the error:
```
TypeError: Cannot read properties of undefined (reading 'length')
```

This error occurred in the ethers.js library when trying to encode string arrays for the smart contract call, specifically the `imageUrl` parameter.

## Root Cause Analysis

After thorough investigation, we identified the root cause:

1. When passing string arrays to ethers.js for ABI encoding, all elements in the array must be valid strings.
2. If any element in the array is `undefined` or `null`, ethers.js attempts to access the `length` property of that element, causing the error.
3. This happens in the `toUtf8Bytes` function in ethers.js at `node_modules/@ethersproject/strings/lib.esm/utf8.js:190:29`.
4. The issue specifically occurred with the `imageUrl` parameter, which is a string array passed to the smart contract.

## Solution Implemented

We implemented a robust solution by adding two utility methods to the blockchain service:

1. `sanitizeStringArray`: A method that ensures all elements in an array are valid strings, replacing any `undefined` or `null` values with empty strings.

2. `prepareContractStringArray`: A wrapper method that applies the sanitization and handles any errors, always returning a valid string array.

These methods are now used for all string array parameters passed to the smart contract, ensuring that:

1. All arrays contain at least one element (even if it's an empty string)
2. All elements in the arrays are valid strings
3. No `undefined` or `null` values are passed to ethers.js

## Code Changes

The key code changes were:

```typescript
// Added utility methods
private sanitizeStringArray(array: any): string[] {
  // If not an array, create a new one with a single sanitized value
  if (!Array.isArray(array)) {
    const sanitizedValue = typeof array === 'string' ? array : '';
    return sanitizedValue ? [sanitizedValue] : [''];
  }
  
  // Ensure every element is a valid string
  const sanitizedArray = array
    .map(item => {
      // The critical fix: handle any non-string values that could cause the length error
      if (item === undefined || item === null) {
        return '';
      }
      // Convert any non-string values to strings
      return String(item);
    });
  
  // If the array is empty after sanitization, add a single empty string
  if (sanitizedArray.length === 0) {
    sanitizedArray.push('');
  }
  
  return sanitizedArray;
}

// Apply the sanitizer before any string array is passed to a contract
private prepareContractStringArray(array: any, defaultValue: string = ''): string[] {
  try {
    return this.sanitizeStringArray(array);
  } catch (error) {
    console.error('Error preparing string array:', error);
    // Always return a valid array with at least one element
    return [defaultValue];
  }
}
```

And updated the contract call to use these methods:

```typescript
const tx = await useCreateCampaign(
  sanitizedTitle,
  sanitizedDescription,
  targetAmountWei,
  deadlineTimestamp,
  sanitizedCategory,
  this.prepareContractStringArray(safeImageUrl),
  this.prepareContractStringArray(validatedArrays.titles, 'Milestone'),
  this.prepareContractStringArray(validatedArrays.descriptions, ''),
  validatedArrays.amounts,
  validatedArrays.completions,
  { gasLimit }
);
```

## Benefits of This Approach

1. **Robustness**: The solution handles all edge cases for string arrays, preventing the error from occurring.
2. **Simplicity**: The fix is contained within the blockchain service, requiring no changes to the contract or other components.
3. **Maintainability**: The utility methods can be reused for any string array parameters in the future.
4. **Clean UI**: No emergency tools or workarounds are needed, providing a clean user experience.

## Testing

The fix has been tested with various input scenarios:
- Empty arrays
- Arrays with undefined or null elements
- Arrays with non-string elements
- Single string values (not in an array)
- Undefined or null values

All scenarios now result in a properly formatted string array being passed to the contract, preventing the error.

## Conclusion

This fix addresses the root cause of the campaign creation issue by ensuring that all string arrays are properly sanitized before being passed to ethers.js for ABI encoding. The solution is robust, maintainable, and provides a clean user experience without the need for emergency tools or workarounds. 