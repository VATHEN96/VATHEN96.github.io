/**
 * Optimized Campaign Service
 * 
 * Enhanced version of the campaign service that uses IPFS for large data storage
 * to reduce transaction data size and gas costs
 */

import { ethers } from 'ethers';
import { ipfsService } from './ipfsService';
import optimizedBlockchainService from './optimizedBlockchainService';
import { prepareOptimizedTransactionParams } from '../utils/blockchain-data-optimizer';

export interface CampaignMetadata {
  description: string;
  longDescription: string;
  tags: string[];
  team: TeamMember[];
  updates: CampaignUpdate[];
  socialLinks: SocialLinks;
  risks: string;
  timeline: TimelineItem[];
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
}

interface CampaignUpdate {
  date: string;
  title: string;
  content: string;
  media?: string[];
}

interface SocialLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

interface TimelineItem {
  date: string;
  title: string;
  description: string;
}

/**
 * Enhanced campaign service that optimizes transaction data size
 * by storing large data in IPFS and only including IPFS hashes in transactions
 */
export default class OptimizedCampaignService {
  /**
   * Creates a new campaign with optimized data storage
   * Large data is stored in IPFS to reduce transaction size
   */
  async createCampaign(
    title: string,
    category: string,
    goalAmount: string,
    duration: number,
    description: string,
    longDescription: string,
    milestones: any[],
    mediaFiles: File[],
    metadata: Partial<CampaignMetadata>
  ) {
    try {
      console.log('Starting optimized campaign creation process...');
      
      // 1. Upload media files to IPFS
      console.log('Uploading media files to IPFS...');
      const mediaHashes = await ipfsService.storeMultipleMedia(mediaFiles);
      
      // 2. Prepare campaign metadata
      const campaignMetadata: CampaignMetadata = {
        description,
        longDescription,
        tags: metadata.tags || [],
        team: metadata.team || [],
        updates: [],
        socialLinks: metadata.socialLinks || {},
        risks: metadata.risks || '',
        timeline: metadata.timeline || []
      };
      
      // 3. Store metadata on IPFS
      console.log('Storing campaign metadata on IPFS...');
      const metadataHash = await ipfsService.storeCampaignMetadata(campaignMetadata);
      
      // 4. Calculate campaign creation fee
      const provider = optimizedBlockchainService.getProvider();
      const creationFee = ethers.utils.parseEther('0.01'); // Match the smart contract fee
      
      // 5. Prepare optimized transaction parameters
      console.log('Preparing optimized transaction parameters...');
      const params = {
        title,
        category,
        goalAmount: ethers.utils.parseEther(goalAmount),
        duration,
        metadataHash, // Use IPFS hash instead of full metadata
        mediaHash: mediaHashes[0], // Use first media hash as main campaign image
        milestones,
        value: creationFee
      };
      
      // 6. Create campaign on blockchain with optimized data
      console.log('Creating campaign on blockchain with optimized data...');
      const campaignId = await optimizedBlockchainService.createCampaign(params);
      
      console.log(`Campaign created successfully with ID: ${campaignId}`);
      
      return {
        campaignId,
        metadataHash,
        mediaHashes
      };
    } catch (error) {
      console.error('Error creating campaign with optimized data:', error);
      throw error;
    }
  }
  
  /**
   * Updates an existing campaign with optimized data storage
   */
  async updateCampaign(
    campaignId: number,
    title: string,
    category: string,
    description: string,
    longDescription: string,
    mediaFiles: File[],
    metadata: Partial<CampaignMetadata>
  ) {
    try {
      // 1. Upload new media files to IPFS if provided
      let mediaHashes = [];
      if (mediaFiles && mediaFiles.length > 0) {
        mediaHashes = await ipfsService.storeMultipleMedia(mediaFiles);
      }
      
      // 2. Prepare updated campaign metadata
      const campaignMetadata: Partial<CampaignMetadata> = {
        description,
        longDescription,
        tags: metadata.tags,
        team: metadata.team,
        socialLinks: metadata.socialLinks,
        risks: metadata.risks,
        timeline: metadata.timeline
      };
      
      // 3. Store updated metadata on IPFS
      const metadataHash = await ipfsService.storeCampaignMetadata(campaignMetadata as CampaignMetadata);
      
      // 4. Update campaign on blockchain with optimized data
      await optimizedBlockchainService.updateCampaignMetadata(
        campaignId,
        metadataHash,
        mediaHashes[0] || ''
      );
      
      return {
        metadataHash,
        mediaHashes
      };
    } catch (error) {
      console.error('Error updating campaign with optimized data:', error);
      throw error;
    }
  }
  
  /**
   * Gets a campaign with full data retrieved from IPFS
   */
  async getCampaign(campaignId: number) {
    try {
      // Get campaign with full data from IPFS
      return await optimizedBlockchainService.getCampaignWithFullData(campaignId);
    } catch (error) {
      console.error('Error getting campaign with full data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const optimizedCampaignService = new OptimizedCampaignService();
export { optimizedCampaignService };