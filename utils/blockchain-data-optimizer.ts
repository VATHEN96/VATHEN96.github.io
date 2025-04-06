/**
 * Blockchain Data Optimizer
 * 
 * Integrates transaction optimization with blockchain services
 * to reduce transaction data size and gas costs
 */

import { ethers } from 'ethers';
import { optimizeTransactionData, retrieveFullData, OptimizedTransactionData } from './transaction-optimizer';
import { getOptimalGasSettings, GasPriceLevel } from './gas-optimizer';

/**
 * Optimize campaign metadata for blockchain transactions
 * 
 * @param metadata The campaign metadata to optimize
 * @param provider Ethers.js provider
 * @returns Optimized metadata with IPFS hash
 */
export async function optimizeCampaignMetadata(
  metadata: any,
  summaryLength: number = 100
): Promise<OptimizedTransactionData> {
  try {
    // Optimize the metadata by storing it in IPFS
    return await optimizeTransactionData(metadata, summaryLength);
  } catch (error) {
    console.error('Error optimizing campaign metadata:', error);
    throw new Error('Failed to optimize campaign metadata: ' + 
      (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Optimize milestone data for blockchain transactions
 * 
 * @param milestones Array of milestone data
 * @returns Optimized milestones with IPFS references for large descriptions
 */
export async function optimizeMilestoneData(
  milestones: any[]
): Promise<any[]> {
  if (!milestones || !Array.isArray(milestones)) {
    return [];
  }
  
  try {
    const optimizedMilestones = [];
    
    for (const milestone of milestones) {
      // Check if milestone description is large
      if (milestone.description && 
          new TextEncoder().encode(milestone.description).length > 1000) {
        // Store large description in IPFS
        const optimizedDescription = await optimizeTransactionData(milestone.description, 50);
        
        // Create a new milestone with optimized description
        optimizedMilestones.push({
          ...milestone,
          description: JSON.stringify(optimizedDescription)
        });
      } else {
        // Keep milestone as is if description is small
        optimizedMilestones.push(milestone);
      }
    }
    
    return optimizedMilestones;
  } catch (error) {
    console.error('Error optimizing milestone data:', error);
    throw new Error('Failed to optimize milestone data: ' + 
      (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Prepare optimized transaction parameters for blockchain service
 * 
 * @param params Original transaction parameters
 * @param provider Ethers.js provider
 * @returns Optimized transaction parameters
 */
export async function prepareOptimizedTransactionParams(
  params: any,
  provider: ethers.providers.Provider
): Promise<any> {
  try {
    // Deep clone the params to avoid modifying the original
    const optimizedParams = JSON.parse(JSON.stringify(params));
    
    // Optimize metadata if present
    if (params.description) {
      const metadataJSON = {
        description: params.description || '',
        beneficiaries: params.beneficiaries || {},
        stakeholders: params.stakeholders || []
      };
      
      // Store metadata in IPFS and get hash
      const optimizedMetadata = await optimizeCampaignMetadata(metadataJSON);
      
      // Replace full metadata with optimized version (IPFS hash + summary)
      optimizedParams.description = optimizedMetadata.ipfsHash;
      
      // Add a note about optimization
      console.log(`Metadata optimized: ${optimizedMetadata.summary.substring(0, 50)}... stored at ${optimizedMetadata.ipfsHash}`);
    }
    
    // Optimize milestones if present
    if (params.milestones && Array.isArray(params.milestones)) {
      optimizedParams.milestones = await optimizeMilestoneData(params.milestones);
      console.log(`Optimized ${optimizedParams.milestones.length} milestones`);
    }
    
    // Get optimal gas settings
    const gasSettings = await getOptimalGasSettings(provider, GasPriceLevel.STANDARD);
    optimizedParams.gasSettings = gasSettings;
    
    return optimizedParams;
  } catch (error) {
    console.error('Error preparing optimized transaction params:', error);
    throw new Error('Failed to prepare optimized transaction parameters: ' + 
      (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Retrieve full data from optimized transaction parameters
 * 
 * @param optimizedParams Parameters with IPFS references
 * @returns Full data with retrieved content
 */
export async function retrieveFullTransactionData(
  optimizedParams: any
): Promise<any> {
  try {
    // Deep clone the params to avoid modifying the original
    const fullParams = JSON.parse(JSON.stringify(optimizedParams));
    
    // Retrieve metadata if it's an IPFS hash
    if (optimizedParams.description && 
        optimizedParams.description.startsWith('Qm')) {
      try {
        const metadataJSON = await retrieveFullData({
          ipfsHash: optimizedParams.description,
          summary: 'Campaign metadata',
          timestamp: Date.now()
        });
        
        // Parse the retrieved metadata
        const metadata = JSON.parse(metadataJSON);
        
        // Replace the IPFS hash with full metadata
        fullParams.description = metadata.description;
        fullParams.beneficiaries = metadata.beneficiaries;
        fullParams.stakeholders = metadata.stakeholders;
      } catch (error) {
        console.warn('Could not retrieve full metadata:', error);
        // Keep the IPFS hash if retrieval fails
      }
    }
    
    // Retrieve milestone data if present
    if (optimizedParams.milestones && Array.isArray(optimizedParams.milestones)) {
      for (let i = 0; i < optimizedParams.milestones.length; i++) {
        const milestone = optimizedParams.milestones[i];
        
        // Check if description is an optimized data JSON string
        if (milestone.description && typeof milestone.description === 'string') {
          try {
            const descriptionData = JSON.parse(milestone.description);
            
            // Check if it's our optimized data format
            if (descriptionData.ipfsHash && descriptionData.summary) {
              // Retrieve full description from IPFS
              const fullDescription = await retrieveFullData(descriptionData);
              fullParams.milestones[i].description = fullDescription;
            }
          } catch (e) {
            // Not a JSON string or not our format, keep as is
          }
        }
      }
    }
    
    return fullParams;
  } catch (error) {
    console.error('Error retrieving full transaction data:', error);
    throw new Error('Failed to retrieve full transaction data: ' + 
      (error instanceof Error ? error.message : 'Unknown error'));
  }
}