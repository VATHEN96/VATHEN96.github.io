import { ethers } from 'ethers';

/**
 * Checks if a value is likely already in human-readable format (not wei)
 * @param value - The value to check
 * @returns Boolean indicating if the value is already formatted
 */
const isAlreadyFormatted = (value: string | number): boolean => {
  // If it's a small number or contains a decimal point, it's likely already formatted
  const stringValue = String(value);
  return (
    // Contains decimal point
    stringValue.includes('.') || 
    // Is in scientific notation (e.g. 1e+21)
    stringValue.includes('e') ||
    // Is a small number (less than what would be a reasonable wei amount)
    (Number(value) < 1000000 && Number(value) > 0)
  );
};

/**
 * Safely converts a blockchain value to ether, handling both wei and already formatted values
 * @param value - The value to convert
 * @returns The value in ether
 */
const safelyConvertToEther = (value: string | number): number => {
  try {
    if (isAlreadyFormatted(value)) {
      // If it's likely already formatted, return as number directly
      return Number(value);
    }
    
    // For very large numbers that might be in wei format
    const stringValue = String(value);
    if (stringValue.length > 15) {
      try {
        // Try to use ethers to format from wei to ether
        return Number(ethers.utils.formatEther(value));
      } catch (error) {
        // If that fails, try a manual conversion - divide by 10^18
        return Number(value) / 1e18;
      }
    }
    
    // Otherwise just return the number
    return Number(value);
  } catch (error) {
    // If conversion fails, return the original value as a number
    // or 0 if it can't be converted to a number
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }
};

/**
 * Formats a blockchain value (in wei/smallest unit) to a human-readable format
 * @param value - The value to format (string, number, or BigNumber)
 * @param decimals - Number of decimal places to display (default: 2)
 * @returns Formatted string value
 */
export const formatBlockchainValue = (value: any): string => {
  try {
    // Handle empty values
    if (value === null || value === undefined || value === '') {
      return '0';
    }
    
    // Handle BigNumber objects from ethers.js
    if (typeof value === 'object') {
      // Handle ethers.js v5 BigNumber
      if (value._hex !== undefined) {
        return ethers.utils.formatEther(value);
      }
      
      // Handle ethers.js BigNumber with toString method
      if (typeof value.toString === 'function') {
        try {
          return ethers.utils.formatEther(value.toString());
        } catch (error) {
          console.warn('Error formatting BigNumber with toString:', error);
        }
      }
    }
    
    // Convert to string for consistent handling
    const stringValue = String(value);
    
    // For scientific notation or very large numbers (wei values)
    if (stringValue.includes('e') || stringValue.length > 15) {
      try {
        // Use ethers.utils to properly format from wei to ether
        const etherValue = Number(ethers.utils.formatEther(value));
        
        // Format with 2 decimal places for proper display
        return etherValue.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      } catch (error) {
        console.warn('Error using ethers.utils.formatEther:', error);
        // If ethers formatting fails, try manual conversion
        const num = Number(value);
        if (!isNaN(num)) {
          const etherValue = num / 1e18;
          return etherValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          });
        }
      }
    }
    
    // For regular numbers that might already be in ether
    const num = Number(value);
    if (!isNaN(num)) {
      // If number is very small, likely already in ether
      if (num < 1000) {
        return num.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      }
      
      // If number is moderate sized but not huge, it might still be in ether
      if (num < 1e6) {
        return num.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      }
      
      // For larger numbers, assume they're in wei
      const etherValue = num / 1e18;
      return etherValue.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    
    // Fallback
    return String(value);
  } catch (error) {
    console.error('Error formatting blockchain value:', error);
    return String(value);
  }
};

/**
 * Maps numeric category IDs to human-readable category names
 * @param category - Category ID or name
 * @returns Human-readable category name
 */
export const formatCategory = (category: string | number): string => {
  const categories = [
    "Technology",
    "Art",
    "Music",
    "Film",
    "Games",
    "Food",
    "Publishing",
    "Fashion",
    "Design",
    "Community",
    "Education",
    "Environment",
    "Health",
    "Politics",
    "Other"
  ];
  
  const categoryNum = parseInt(String(category));
  if (!isNaN(categoryNum) && categoryNum >= 0 && categoryNum < categories.length) {
    return categories[categoryNum];
  }
  
  return String(category) || "Uncategorized";
};

/**
 * Truncates a wallet address for display
 * @param address - The full wallet address
 * @returns Truncated address (e.g., 0x1234...5678)
 */
export const truncateAddress = (address: string): string => {
  if (!address) return '';
  if (address.length <= 10) return address;
  
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Calculates days left until a deadline
 * @param deadline - The deadline date (string or Date)
 * @returns Number of days left (0 if deadline has passed)
 */
export const calculateDaysLeft = (deadline: Date | string): number => {
  try {
    // Check for null/undefined/empty deadline
    if (!deadline) {
      console.warn('Missing deadline, returning 30 days as fallback');
      return 30;
    }
    
    const now = new Date();
    let deadlineDate: Date;
    
    // Handle different deadline formats
    if (deadline instanceof Date) {
      deadlineDate = deadline;
    } else if (typeof deadline === 'string') {
      deadlineDate = new Date(deadline);
    } else {
      // Handle numeric timestamp
      deadlineDate = new Date(Number(deadline));
    }
    
    // Validate the parsed date
    if (isNaN(deadlineDate.getTime())) {
      console.warn('Invalid deadline date format, returning 30 days as fallback', deadline);
      return 30;
    }
    
    // Simple calculation of days between now and deadline
    const diffTime = deadlineDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    console.log('Calculating days left:', {
      now: now.toLocaleString(),
      deadline: deadlineDate.toLocaleString(),
      diffTime,
      daysLeft
    });
    
    // Extra safety check - if days left is extremely large (which suggests an error),
    // default to 30 days
    if (daysLeft > 365 * 10) { // If more than 10 years, something is wrong
      console.warn('Extremely large days left value detected, defaulting to 30 days');
      return 30;
    }
    
    return daysLeft;
  } catch (error) {
    console.error('Error calculating days left:', error);
    // Return 30 as default if there's any error
    return 30;
  }
};

/**
 * Calculates progress percentage of funding
 * @param current - Current amount funded
 * @param goal - Goal amount
 * @returns Progress percentage (0-100)
 */
export const calculateProgress = (current: string | number, goal: string | number): number => {
  const currentNum = safelyConvertToEther(current);
  const goalNum = safelyConvertToEther(goal);
  
  if (isNaN(currentNum) || isNaN(goalNum) || goalNum === 0) {
    return 0;
  }
  
  return Math.min(100, (currentNum / goalNum) * 100);
}; 