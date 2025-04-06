/**
 * Transaction Optimizer Utilities
 * 
 * Optimize transaction data size by storing large data in IPFS
 * and only including IPFS hashes in the transaction calldata
 */

import { ethers } from 'ethers';
import { uploadToIPFS, getFromIPFS } from './ipfsHelpers';

// Maximum recommended size for transaction data (in bytes)
// This is a conservative limit to ensure transactions don't fail
const MAX_TRANSACTION_DATA_SIZE = 50000; // 50KB

// Interface for transaction data with IPFS reference
export interface OptimizedTransactionData {
  ipfsHash: string;       // IPFS hash where the full data is stored
  summary: string;        // Brief summary or identifier (stored on-chain)
  timestamp: number;      // When the data was optimized
}

/**
 * Check if data is too large for direct inclusion in a transaction
 * 
 * @param data The data to check
 * @returns Whether the data exceeds the recommended size limit
 */
export function isDataTooLarge(data: string): boolean {
  // Calculate approximate byte size (UTF-8 encoding)
  const byteSize = new TextEncoder().encode(data).length;
  return byteSize > MAX_TRANSACTION_DATA_SIZE;
}

/**
 * Optimize transaction data by storing large content in IPFS
 * 
 * @param data The data to optimize
 * @param summaryLength Length of the summary to include on-chain
 * @returns Optimized data with IPFS hash and summary
 */
export async function optimizeTransactionData(
  data: string | object,
  summaryLength: number = 100
): Promise<OptimizedTransactionData> {
  // Convert object to string if needed
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Check if optimization is needed
  if (!isDataTooLarge(dataString)) {
    console.log('Data is small enough for direct inclusion in transaction');
    // Still store in IPFS for consistency and future retrieval
  }
  
  try {
    // Upload to IPFS
    const ipfsHash = await uploadToIPFS(dataString);
    
    // Create a summary (truncate if needed)
    let summary = dataString;
    if (dataString.length > summaryLength) {
      summary = dataString.substring(0, summaryLength) + '...';
    }
    
    return {
      ipfsHash,
      summary,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error optimizing transaction data:', error);
    throw new Error('Failed to optimize transaction data: ' + 
      (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Retrieve full data from an optimized transaction
 * 
 * @param optimizedData The optimized transaction data with IPFS hash
 * @returns The full original data
 */
export async function retrieveFullData(
  optimizedData: OptimizedTransactionData
): Promise<string> {
  try {
    return await getFromIPFS(optimizedData.ipfsHash);
  } catch (error) {
    console.error('Error retrieving full data:', error);
    throw new Error('Failed to retrieve full data: ' + 
      (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Estimate gas savings from using optimized transaction data
 * 
 * @param originalData The original unoptimized data
 * @param optimizedData The optimized transaction data
 * @param gasPrice Current gas price in wei
 * @returns Estimated gas savings in wei
 */
export function estimateGasSavings(
  originalData: string,
  optimizedData: OptimizedTransactionData,
  gasPrice: ethers.BigNumber
): {
  originalGasCost: ethers.BigNumber;
  optimizedGasCost: ethers.BigNumber;
  savings: ethers.BigNumber;
  savingsPercentage: number;
} {
  // Calculate approximate byte sizes
  const originalByteSize = new TextEncoder().encode(originalData).length;
  const optimizedByteSize = new TextEncoder().encode(JSON.stringify(optimizedData)).length;
  
  // Estimate gas costs (approximately 16 gas per non-zero byte, 4 gas per zero byte)
  // This is a simplified estimation
  const originalGasCost = gasPrice.mul(originalByteSize * 16);
  const optimizedGasCost = gasPrice.mul(optimizedByteSize * 16);
  
  // Calculate savings
  const savings = originalGasCost.sub(optimizedGasCost);
  const savingsPercentage = originalByteSize > 0 ? 
    ((originalByteSize - optimizedByteSize) / originalByteSize) * 100 : 0;
  
  return {
    originalGasCost,
    optimizedGasCost,
    savings,
    savingsPercentage
  };
}

/**
 * Create a transaction with optimized data
 * 
 * @param provider Ethers.js provider
 * @param data The data to include in the transaction
 * @param gasSettings Gas settings for the transaction
 * @returns Transaction with optimized data
 */
export async function createOptimizedTransaction(
  data: string | object,
  summaryLength: number = 100
): Promise<OptimizedTransactionData> {
  // Optimize the transaction data
  return await optimizeTransactionData(data, summaryLength);
}