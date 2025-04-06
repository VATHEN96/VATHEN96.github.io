import { ethers } from 'ethers';
import { ipfsService } from './ipfsService';
import { BlockchainServiceFixed } from './blockchainServiceFixedV3';
import BlockchainServiceFixedV3Instance from './blockchainServiceFixedV3';
import { toast } from 'sonner';

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

export default class CampaignService {
  private blockchainService: BlockchainServiceFixed;

  constructor() {
    this.blockchainService = BlockchainServiceFixedV3Instance;
  }

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
      // 1. Upload media files to IPFS
      const mediaHashes = await ipfsService.storeMultipleMedia(mediaFiles);
      
      // 2. Prepare and upload campaign metadata
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
      const metadataHash = await ipfsService.storeCampaignMetadata(campaignMetadata);
      
      // 4. Calculate campaign creation fee
      const provider = this.blockchainService.getProvider();
      const creationFee = ethers.utils.parseEther('0.01'); // Match the smart contract fee
      
      // 5. Create campaign on blockchain
      const campaignId = await this.blockchainService.createCampaign(
        title,
        category,
        ethers.utils.parseEther(goalAmount),
        duration,
        metadataHash,
        mediaHashes[0], // Use first media hash as main campaign image
        milestones,
        { value: creationFee }
      );
      
      return {
        campaignId,
        metadataHash,
        mediaHashes
      };
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  }

  async getCampaign(campaignId: number) {
    try {
      // 1. Get on-chain campaign data
      const campaignData = await this.blockchainService.getCampaign(campaignId);
      
      // 2. Format amounts to human-readable format
      const formattedCampaign = {
        id: campaignData.id,
        title: campaignData.title,
        description: campaignData.description || '',
        category: campaignData.category,
        creator: campaignData.creator,
        creatorProfile: campaignData.creatorProfile || '',
        goalAmount: ethers.utils.formatEther(campaignData.goalAmount),
        totalFunded: ethers.utils.formatEther(campaignData.totalFunded),
        status: campaignData.isActive ? 'active' : 'completed',
        createdAt: campaignData.createdAt,
        duration: campaignData.duration,
        media: campaignData.media || [],
        milestones: campaignData.milestones?.map((milestone: any) => ({
          ...milestone,
          targetAmount: ethers.utils.formatEther(milestone.targetAmount),
          fundsReleased: ethers.utils.formatEther(milestone.fundsReleased)
        })) || [],
        stakeholders: campaignData.stakeholders || [],
        donors: campaignData.donors || [],
        campaignType: campaignData.campaignType || 0,
        minInvestment: campaignData.minInvestment ? 
          ethers.utils.formatEther(campaignData.minInvestment) : '0'
      };

      // 3. Get media URLs for each media item
      const mediaUrls = campaignData.media.map((hash: string) => 
        ipfsService.getMediaUrl(hash)
      );

      // 4. Return combined data
      return {
        ...formattedCampaign,
        mediaUrls
      };
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaign');
    }
  }

  async updateCampaign(
    campaignId: number,
    metadata: Partial<CampaignMetadata>,
    newMediaFiles?: File[]
  ) {
    try {
      // 1. Get current campaign data
      const campaignData = await this.blockchainService.getCampaign(campaignId);
      
      // 2. Handle new media files if provided
      let newMediaHashes: string[] = [];
      if (newMediaFiles && newMediaFiles.length > 0) {
        newMediaHashes = await ipfsService.storeMultipleMedia(newMediaFiles);
      }
      
      // 3. Combine existing and new media
      const updatedMedia = [
        ...campaignData.media,
        ...newMediaHashes
      ];
      
      // 4. Update campaign on blockchain with new media
      await this.blockchainService.updateCampaign(
        campaignId,
        {
          media: updatedMedia,
          description: metadata.description || campaignData.description,
          proofOfWork: metadata.proofOfWork || campaignData.proofOfWork,
          beneficiaries: metadata.beneficiaries || campaignData.beneficiaries
        }
      );
      
      return {
        mediaHashes: updatedMedia
      };
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update campaign');
    }
  }

  async addCampaignUpdate(
    campaignId: number,
    update: Omit<CampaignUpdate, 'date'>,
    mediaFiles?: File[]
  ) {
    try {
      // 1. Get current campaign data
      const campaignData = await this.blockchainService.getCampaign(campaignId);
      
      // 2. Handle media files if provided
      let mediaHashes: string[] = [];
      if (mediaFiles && mediaFiles.length > 0) {
        mediaHashes = await ipfsService.storeMultipleMedia(mediaFiles);
      }
      
      // 3. Create new update
      const newUpdate: CampaignUpdate = {
        ...update,
        date: new Date().toISOString(),
        media: mediaHashes
      };
      
      // 4. Store update in IPFS
      const updateHash = await ipfsService.storeCampaignUpdate(newUpdate);
      
      // 5. Update campaign on blockchain with new update hash
      await this.blockchainService.addCampaignUpdate(
        campaignId,
        updateHash
      );
      
      return {
        update: newUpdate,
        updateHash
      };
    } catch (error) {
      console.error('Error adding campaign update:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add campaign update');
    }
  }

  /**
   * Reinitialize the blockchain service with the new contract address
   */
  async reinitializeBlockchainService(): Promise<boolean> {
    try {
      const success = await this.blockchainService.reinitializeWithNewContract();
      if (success) {
        console.log('Successfully reinitialized blockchain service with new contract');
      } else {
        console.error('Failed to reinitialize blockchain service');
      }
      return success;
    } catch (error) {
      console.error('Error reinitializing blockchain service:', error);
      return false;
    }
  }
} 