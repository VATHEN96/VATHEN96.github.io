/**
 * Gas Optimizer Utilities
 * 
 * Optimize gas costs for Ethereum transactions
 */

import { BigNumber, ethers } from 'ethers';

// Percentage above base fee to set for max fee
const BASE_FEE_MULTIPLIER_PERCENTAGE = 50; // 50% above base fee

// Gas price levels
export enum GasPriceLevel {
  SLOW = 'slow',
  STANDARD = 'standard',
  FAST = 'fast',
  URGENT = 'urgent',
}

// Multipliers for different gas price levels (over base price)
const GAS_PRICE_MULTIPLIERS: Record<GasPriceLevel, number> = {
  [GasPriceLevel.SLOW]: 1,     // 1x base price
  [GasPriceLevel.STANDARD]: 1.2, // 1.2x base price
  [GasPriceLevel.FAST]: 1.5,   // 1.5x base price
  [GasPriceLevel.URGENT]: 2,   // 2x base price
};

// Priority fee per gas for different speed levels (in gwei)
const PRIORITY_FEE_PER_GAS: Record<GasPriceLevel, number> = {
  [GasPriceLevel.SLOW]: 1,     // 1 gwei
  [GasPriceLevel.STANDARD]: 1.5, // 1.5 gwei
  [GasPriceLevel.FAST]: 2,     // 2 gwei
  [GasPriceLevel.URGENT]: 3,   // 3 gwei
};

// Interface for EIP-1559 gas settings
export interface EIP1559GasSettings {
  maxFeePerGas: BigNumber;       // Maximum fee per gas (base fee + priority fee)
  maxPriorityFeePerGas: BigNumber; // Maximum priority fee per gas (tip to miners)
}

// Interface for legacy gas settings
export interface LegacyGasSettings {
  gasPrice: BigNumber;           // Gas price for legacy transactions
}

// Interface for gas cost estimate
export interface GasCostEstimate {
  totalCost: BigNumber;          // Total cost in wei
  totalCostInEth: string;        // Total cost in ETH
  baseFeePerGas?: BigNumber;     // Current base fee per gas
  gasLimit: BigNumber;           // Gas limit for the transaction
  gasSettings: EIP1559GasSettings | LegacyGasSettings; // Gas settings
  isEIP1559: boolean;            // Whether EIP-1559 is being used
}

/**
 * Calculate gas settings for an EIP-1559 transaction
 * 
 * @param baseFeePerGas Current base fee per gas in wei
 * @param level Gas price level (slow, standard, fast, urgent)
 * @returns EIP-1559 gas settings
 */
export function calculateEIP1559GasSettings(
  baseFeePerGas: BigNumber,
  level: GasPriceLevel = GasPriceLevel.STANDARD
): EIP1559GasSettings {
  // Convert priority fee from gwei to wei (1 gwei = 10^9 wei)
  const priorityFeeInGwei = PRIORITY_FEE_PER_GAS[level];
  const priorityFeeInWei = BigNumber.from(priorityFeeInGwei).mul(1_000_000_000);
  
  // Calculate a buffer above base fee (e.g., 50% higher)
  const baseFeeBump = baseFeePerGas.mul(BASE_FEE_MULTIPLIER_PERCENTAGE).div(100);
  
  // Calculate max fee per gas: base fee + bump + priority fee
  const maxFeePerGas = baseFeePerGas.add(baseFeeBump).add(priorityFeeInWei);
  
  return {
    maxFeePerGas,
    maxPriorityFeePerGas: priorityFeeInWei,
  };
}

/**
 * Calculate legacy gas settings
 * 
 * @param gasPrice Current average gas price in wei
 * @param level Gas price level (slow, standard, fast, urgent)
 * @returns Legacy gas settings
 */
export function calculateLegacyGasSettings(
  gasPrice: BigNumber,
  level: GasPriceLevel = GasPriceLevel.STANDARD
): LegacyGasSettings {
  // Apply multiplier based on desired speed
  const multiplier = GAS_PRICE_MULTIPLIERS[level];
  
  // Calculate adjusted gas price
  const adjustedGasPrice = gasPrice.mul(Math.floor(multiplier * 100)).div(100);
  
  return {
    gasPrice: adjustedGasPrice,
  };
}

/**
 * Calculate gas cost for a transaction
 * 
 * @param gasLimit Estimated gas limit for the transaction
 * @param gasSettings Gas settings (EIP-1559 or legacy)
 * @param baseFeePerGas Current base fee per gas (for EIP-1559 only)
 * @returns Gas cost estimate
 */
export function calculateGasCost(
  gasLimit: BigNumber,
  gasSettings: EIP1559GasSettings | LegacyGasSettings,
  baseFeePerGas?: BigNumber
): GasCostEstimate {
  const isEIP1559 = 'maxFeePerGas' in gasSettings;
  let totalCost: BigNumber;
  
  if (isEIP1559 && baseFeePerGas) {
    // For EIP-1559, we calculate based on:
    // Total = gasLimit * (baseFeePerGas + priorityFeePerGas)
    // Note: Actual fee can be lower if baseFee goes down
    const effectiveFeePerGas = baseFeePerGas.add(gasSettings.maxPriorityFeePerGas);
    totalCost = gasLimit.mul(effectiveFeePerGas);
  } else if (isEIP1559) {
    // If baseFeePerGas is not provided, use max values for conservative estimate
    totalCost = gasLimit.mul(gasSettings.maxFeePerGas);
  } else {
    // For legacy transactions
    totalCost = gasLimit.mul((gasSettings as LegacyGasSettings).gasPrice);
  }
  
  // Format total cost in ETH
  const totalCostInEth = formatEthValue(totalCost);
  
  return {
    totalCost,
    totalCostInEth,
    baseFeePerGas,
    gasLimit,
    gasSettings,
    isEIP1559,
  };
}

/**
 * Fetch current gas prices from an RPC provider
 * 
 * @param provider Ethers.js provider
 * @returns Current gas prices and EIP-1559 support status
 */
export async function fetchGasPrices(provider: any): Promise<{
  baseFeePerGas?: BigNumber;
  gasPrice: BigNumber;
  supportsEIP1559: boolean;
}> {
  try {
    // Get latest block to check for EIP-1559 support
    const latestBlock = await provider.getBlock('latest');
    const supportsEIP1559 = !!latestBlock.baseFeePerGas;
    
    // Get current gas price for legacy transactions
    const gasPrice = await provider.getGasPrice();
    
    return {
      baseFeePerGas: latestBlock.baseFeePerGas,
      gasPrice,
      supportsEIP1559,
    };
  } catch (error) {
    console.error('Error fetching gas prices:', error);
    
    // Fallback to legacy gas price only
    try {
      const gasPrice = await provider.getGasPrice();
      return {
        gasPrice,
        supportsEIP1559: false,
      };
    } catch (fallbackError) {
      console.error('Error fetching fallback gas price:', fallbackError);
      throw new Error('Failed to fetch gas prices');
    }
  }
}

/**
 * Get fixed gas settings for Telos network
 * 
 * @returns Legacy gas settings with ultra-low gas price for Telos
 */
export function getTelosGasSettings(): LegacyGasSettings {
  // For Telos blockchain, we need to use a fixed, ultra-low gas price to avoid transaction failures
  // Telos has a much lower gas price requirement than other chains
  // Using 1000 wei (0.000000001 Gwei) for Telos to prevent transaction failures
  // IMPORTANT: We must override any gas price provided by the network to ensure transactions succeed
  const fixedGasPrice = BigNumber.from('1000'); // 1000 wei for Telos (ultra-ultra-ultra-low)
  
  // Log the gas price we're using to help with debugging
  console.log('Setting Telos gas price to:', fixedGasPrice.toString(), 'wei');
  
  return {
    gasPrice: fixedGasPrice,
    // Also provide a higher gas limit for complex transactions
    gasLimit: ethers.utils.hexlify(8000000) // Increased gas limit for complex operations
  };
}

/**
 * Calculate optimal gas settings for a transaction
 * 
 * @param provider Ethers.js provider
 * @param level Gas price level
 * @returns Optimal gas settings
 */
export async function getOptimalGasSettings(
  provider: any,
  level: GasPriceLevel = GasPriceLevel.STANDARD
): Promise<EIP1559GasSettings | LegacyGasSettings> {
  try {
    // Check if we're on Telos network (chainId 41 for testnet, 40 for mainnet)
    const network = await provider.getNetwork();
    if (network.chainId === 41 || network.chainId === 40) {
      // For Telos, always use fixed gas settings
      return getTelosGasSettings();
    }
    
    const { baseFeePerGas, gasPrice, supportsEIP1559 } = await fetchGasPrices(provider);
    
    if (supportsEIP1559 && baseFeePerGas) {
      // Use EIP-1559 gas settings if supported
      return calculateEIP1559GasSettings(baseFeePerGas, level);
    } else {
      // Fall back to legacy gas settings
      return calculateLegacyGasSettings(gasPrice, level);
    }
  } catch (error) {
    console.error('Error determining optimal gas settings:', error);
    // Fallback to standard gas settings
    const gasPrice = await provider.getGasPrice();
    return calculateLegacyGasSettings(gasPrice, level);
  }
}

/**
 * Format wei value to ETH with specified decimals
 * 
 * @param wei Value in wei (as BigNumber)
 * @param decimals Number of decimals to show
 * @returns Formatted ETH value as string
 */
export function formatEthValue(wei: BigNumber, decimals: number = 6): string {
  // 1 ETH = 10^18 wei
  const ethValue = wei.div(BigNumber.from(10).pow(18 - decimals)).toNumber() / Math.pow(10, decimals);
  return ethValue.toFixed(decimals);
}

/**
 * Check if current gas prices are within acceptable range
 * 
 * @param provider Ethers.js provider
 * @param highThresholdGwei High gas price threshold in gwei
 * @returns Whether gas prices are high
 */
export async function areGasPricesHigh(
  provider: any,
  highThresholdGwei: number = 100
): Promise<boolean> {
  try {
    const { baseFeePerGas, gasPrice } = await fetchGasPrices(provider);
    
    // Convert to gwei for comparison
    const highThresholdWei = BigNumber.from(highThresholdGwei).mul(1_000_000_000);
    
    if (baseFeePerGas) {
      // For EIP-1559, check base fee
      return baseFeePerGas.gt(highThresholdWei);
    } else {
      // For legacy, check gas price
      return gasPrice.gt(highThresholdWei);
    }
  } catch (error) {
    console.error('Error checking gas prices:', error);
    return false; // Default to not high on error
  }
}

/**
 * Gas optimization strategies for advanced use cases
 */
export const gasStrategies = {
  /**
   * Recommend when to defer transactions based on gas prices
   */
  shouldDeferTransaction: async (
    provider: any,
    urgency: 'low' | 'medium' | 'high' = 'medium',
    customThresholdGwei?: number
  ) => {
    // Threshold by urgency (in gwei)
    const thresholds = {
      low: 30,    // Defer if above 30 gwei for low urgency
      medium: 100, // Defer if above 100 gwei for medium urgency
      high: 200,  // Defer if above 200 gwei for high urgency
    };
    
    const threshold = customThresholdGwei || thresholds[urgency];
    return await areGasPricesHigh(provider, threshold);
  },
  
  /**
   * Choose optimal time to submit transaction
   * Useful for scheduling transactions when gas prices are lower
   */
  getOptimalSubmissionTime: async (
    provider: any
  ) => {
    try {
      // Get recent gas price trends
      const block = await provider.getBlock('latest');
      
      // This is simplified - in a real implementation,
      // you would analyze gas price trends over recent blocks
      
      const { baseFeePerGas, gasPrice } = await fetchGasPrices(provider);
      
      // Convert to gwei for easier comparison
      const currentGasGwei = baseFeePerGas ? 
        Number(formatEthValue(baseFeePerGas, 9)) * 1e9 : 
        Number(formatEthValue(gasPrice, 9)) * 1e9;
      
      // Simple thresholds for recommendation
      if (currentGasGwei < 50) {
        return 'now';  // Low gas prices, submit now
      } else if (currentGasGwei < 150) {
        return 'soon'; // Moderate gas prices, maybe wait a bit
      } else {
        return 'wait'; // High gas prices, better to wait
      }
    } catch (error) {
      console.error('Error getting optimal submission time:', error);
      return 'soon'; // Default to moderate recommendation on error
    }
  },
};