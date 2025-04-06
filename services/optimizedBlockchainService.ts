/**
 * Optimized Blockchain Service
 * 
 * Enhanced version of the blockchain service that uses IPFS for large data storage
 * to reduce transaction data size and gas costs
 */

import { ethers } from 'ethers';
import { BlockchainServiceFixed } from './blockchainServiceFixedV3';
import { prepareOptimizedTransactionParams, retrieveFullTransactionData } from '../utils/blockchain-data-optimizer';
import { getOptimalGasSettings, GasPriceLevel } from '../utils/gas-optimizer';
import { ipfsService } from './ipfsService';

/**
 * Enhanced blockchain service that optimizes transaction data size
 * by storing large data in IPFS and only including IPFS hashes in transactions
 */
export class OptimizedBlockchainService extends BlockchainServiceFixed {
  /**
   * Creates a new campaign with optimized data storage
   * Large data is stored in IPFS to reduce transaction size
   * 
   * @param params Parameters for campaign creation
   * @returns Campaign ID if successful
   */
  public async createCampaign(params: any): Promise<number> {
    try {
      // Get provider for gas settings
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }
      
      // Optimize transaction parameters
      console.log('Optimizing transaction data for campaign creation...');
      const optimizedParams = await prepareOptimizedTransactionParams(params, provider);
      
      // Log optimization results
      console.log('Transaction data optimized successfully');
      
      // Call the parent implementation with optimized parameters
      return await super.createCampaign(optimizedParams);
    } catch (error) {
      console.error('Error in optimized createCampaign:', error);
      throw error;
    }
  }
  
  /**
   * Updates campaign metadata with optimized data storage
   * 
   * @param campaignId Campaign ID to update
   * @param metadata Campaign metadata
   * @param mediaHash Media hash
   * @returns Transaction result
   */
  public async updateCampaignMetadata(
    campaignId: number,
    metadata: any,
    mediaHash?: string
  ): Promise<void> {
    try {
      // Store full metadata in IPFS
      console.log('Storing campaign metadata in IPFS...');
      const metadataHash = await ipfsService.storeCampaignMetadata(metadata);
      
      // Call parent implementation with IPFS hash
      return await super.updateCampaignMetadata(campaignId, metadataHash, mediaHash || '');
    } catch (error) {
      console.error('Error in optimized updateCampaignMetadata:', error);
      throw error;
    }
  }
  
  /**
   * Get campaign with full data retrieved from IPFS
   * 
   * @param campaignId Campaign ID to retrieve
   * @returns Campaign with full data
   */
  public async getCampaignWithFullData(campaignId: number): Promise<any> {
    try {
      // Get basic campaign data
      const campaign = await super.getCampaign(campaignId);
      
      // Check if metadata is an IPFS hash
      if (campaign.metadataIPFSHash && campaign.metadataIPFSHash.startsWith('Qm')) {
        try {
          // Retrieve full metadata from IPFS
          const metadata = await ipfsService.getCampaignMetadata(campaign.metadataIPFSHash);
          
          // Merge metadata with campaign data
          return {
            ...campaign,
            metadata
          };
        } catch (error) {
          console.warn('Could not retrieve full metadata from IPFS:', error);
          // Return campaign with hash if retrieval fails
          return campaign;
        }
      }
      
      return campaign;
    } catch (error) {
      console.error('Error getting campaign with full data:', error);
      throw error;
    }
  }
  
  /**
   * Get transaction overrides with optimized gas settings
   * 
   * @returns Transaction overrides with optimal gas settings
   */
  public async getOptimizedTransactionOverrides(): Promise<any> {
    try {
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }
      
      // Get optimal gas settings
      const gasSettings = await getOptimalGasSettings(provider, GasPriceLevel.STANDARD);
      
      // Create transaction overrides
      const overrides: any = {};
      
      if ('maxFeePerGas' in gasSettings) {
        // EIP-1559 transaction
        overrides.maxFeePerGas = gasSettings.maxFeePerGas;
        overrides.maxPriorityFeePerGas = gasSettings.maxPriorityFeePerGas;
      } else {
        // Legacy transaction
        overrides.gasPrice = gasSettings.gasPrice;
      }
      
      // Set a higher gas limit for complex transactions
      overrides.gasLimit = ethers.utils.hexlify(3000000);
      
      return overrides;
    } catch (error) {
      console.error('Error getting optimized transaction overrides:', error);
      // Return empty overrides on error
      return {};
    }
  }
}

// Create singleton instance
const optimizedBlockchainService = new OptimizedBlockchainService();
export default optimizedBlockchainService;