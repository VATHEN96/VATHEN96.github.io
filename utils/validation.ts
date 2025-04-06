/**
 * Validation utilities for form inputs
 */

// Validate ethereum address
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Validate email address
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Validate input is not empty
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

// Validate length constraints
export const isValidLength = (value: string, min: number, max: number): boolean => {
  const length = value.trim().length;
  return length >= min && length <= max;
};

// Validate numeric input
export const isNumeric = (value: string): boolean => {
  return /^-?\d+(\.\d+)?$/.test(value);
};

// Validate positive number
export const isPositiveNumber = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

// Validate safe text (prevent XSS)
export const isSafeText = (value: string): boolean => {
  // Basic XSS prevention check
  return !/[<>]/.test(value);
};

// Common error messages
export const ValidationErrors = {
  REQUIRED: "This field is required",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_URL: "Please enter a valid URL",
  INVALID_ADDRESS: "Please enter a valid Ethereum address",
  TOO_SHORT: (min: number) => `Must be at least ${min} characters`,
  TOO_LONG: (max: number) => `Must be less than ${max} characters`,
  INVALID_NUMBER: "Please enter a valid number",
  MUST_BE_POSITIVE: "Value must be greater than zero",
  UNSAFE_CONTENT: "Contains invalid characters"
}; 