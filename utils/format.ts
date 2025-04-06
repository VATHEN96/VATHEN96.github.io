/**
 * Utility functions for formatting different types of data
 */

/**
 * Shortens an Ethereum address for display purposes
 * @param address - The full Ethereum address
 * @param startChars - Number of characters to keep at the start (default: 6)
 * @param endChars - Number of characters to keep at the end (default: 4)
 * @returns Shortened address with ellipsis in the middle
 */
export const shortenAddress = (address?: string): string => {
  if (!address) return 'Unknown';
  
  // Make sure the address is valid
  if (typeof address !== 'string' || address.length < 10) {
    return address;
  }
  
  const startChars = 6;
  const endChars = 4;
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
};

/**
 * Formats a number to a currency string (e.g., $1,234.56)
 * @param value - The number to format
 * @param currency - The currency symbol (default: $)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number | string,
  currency: string = '$',
  decimals: number = 2
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return `${currency}0.00`;
  
  return `${currency}${numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

/**
 * Formats a date to a locale string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date)
    : date;
    
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString(undefined, options);
}; 