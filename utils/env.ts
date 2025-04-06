/**
 * Environment Variable Utilities
 * 
 * Safely access environment variables with validation and defaults
 */

// Interface for environment variable configuration
interface EnvVarConfig {
  name: string;
  defaultValue?: string;
  required?: boolean;
  validator?: (value: string) => boolean;
}

// Get environment variable with validation
export function getEnvVar({
  name,
  defaultValue = '',
  required = false,
  validator,
}: EnvVarConfig): string {
  // Get the value from Next.js environment variables
  const value = process.env[name] ?? defaultValue;
  
  // Check if value is required but not provided
  if (required && !value) {
    // In development, throw an error
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    
    // In production, log the error but don't crash
    console.error(`Required environment variable ${name} is not set`);
  }
  
  // Validate the value if a validator is provided
  if (validator && value && !validator(value)) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Environment variable ${name} failed validation`);
    }
    
    console.error(`Environment variable ${name} failed validation`);
    return defaultValue;
  }
  
  return value;
}

// Common validators
export const Validators = {
  // URL validator
  isUrl: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // Ethereum address validator
  isEthAddress: (value: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
  },
  
  // Number validator
  isNumber: (value: string) => {
    return !isNaN(Number(value));
  },
  
  // Boolean validator
  isBoolean: (value: string) => {
    return ['true', 'false', '0', '1'].includes(value.toLowerCase());
  },
};

// Environment variables used in the application
export const ENV = {
  // App info
  APP_URL: getEnvVar({ 
    name: 'NEXT_PUBLIC_APP_URL', 
    defaultValue: 'http://localhost:3000',
    validator: Validators.isUrl
  }),
  
  // Web3 related
  RPC_URL: getEnvVar({ 
    name: 'NEXT_PUBLIC_RPC_URL',
    defaultValue: 'https://mainnet.infura.io/v3/your-api-key',
    validator: Validators.isUrl
  }),
  
  CONTRACT_ADDRESS: getEnvVar({ 
    name: 'NEXT_PUBLIC_CONTRACT_ADDRESS',
    validator: Validators.isEthAddress
  }),
  
  CHAIN_ID: getEnvVar({ 
    name: 'NEXT_PUBLIC_CHAIN_ID',
    defaultValue: '1',
    validator: Validators.isNumber
  }),
  
  // Feature flags
  FEATURE_SOCIAL_LOGIN: getEnvVar({ 
    name: 'NEXT_PUBLIC_FEATURE_SOCIAL_LOGIN',
    defaultValue: 'false',
    validator: Validators.isBoolean
  }),
  
  // API keys (server-side only)
  getApiKey: () => getEnvVar({ 
    name: 'API_KEY', 
    required: process.env.NODE_ENV === 'production'
  }),
}; 