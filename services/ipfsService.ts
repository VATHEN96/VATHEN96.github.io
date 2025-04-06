import { create } from '@web3-storage/w3up-client';
import { CampaignMetadata, User, CampaignUpdate } from '@/types';

class IPFSService {
  private client: any;
  private initialized: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = await create();
      this.initialized = true;
      console.log('IPFS client initialized');
    } catch (error) {
      console.error('Failed to initialize IPFS client:', error);
      throw error;
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeClient();
    }
  }

  /**
   * Store campaign metadata on IPFS
   */
  async storeCampaignMetadata(metadata: CampaignMetadata): Promise<string> {
    await this.ensureInitialized();
    
    try {
      const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const cid = await this.client.uploadFile(blob);
      return cid.toString();
    } catch (error) {
      console.error('Failed to store campaign metadata:', error);
      throw error;
    }
  }

  /**
   * Retrieve campaign metadata from IPFS
   */
  async getCampaignMetadata(cid: string): Promise<CampaignMetadata> {
    await this.ensureInitialized();
    
    try {
      const response = await fetch(`https://${cid}.ipfs.w3s.link`);
      if (!response.ok) throw new Error('Failed to fetch campaign metadata');
      return await response.json();
    } catch (error) {
      console.error('Failed to get campaign metadata:', error);
      throw error;
    }
  }

  /**
   * Store user profile on IPFS
   */
  async storeUserProfile(profile: User): Promise<string> {
    await this.ensureInitialized();
    
    try {
      const blob = new Blob([JSON.stringify(profile)], { type: 'application/json' });
      const cid = await this.client.uploadFile(blob);
      return cid.toString();
    } catch (error) {
      console.error('Failed to store user profile:', error);
      throw error;
    }
  }

  /**
   * Retrieve user profile from IPFS
   */
  async getUserProfile(cid: string): Promise<User> {
    await this.ensureInitialized();
    
    try {
      const response = await fetch(`https://${cid}.ipfs.w3s.link`);
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return await response.json();
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Store campaign media (images, videos) on IPFS
   */
  async storeMedia(file: File): Promise<string> {
    await this.ensureInitialized();
    
    try {
      const cid = await this.client.uploadFile(file);
      return cid.toString();
    } catch (error) {
      console.error('Failed to store media:', error);
      throw error;
    }
  }

  /**
   * Store multiple media files
   */
  async storeMultipleMedia(files: File[]): Promise<string[]> {
    await this.ensureInitialized();
    
    try {
      const promises = files.map(file => this.storeMedia(file));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to store multiple media:', error);
      throw error;
    }
  }

  /**
   * Get media URL from CID
   */
  getMediaUrl(cid: string): string {
    return `https://${cid}.ipfs.w3s.link`;
  }

  async storeCampaignUpdate(update: CampaignUpdate): Promise<string> {
    try {
      // Convert update object to JSON string
      const updateJson = JSON.stringify(update);
      
      // Create a Blob from the JSON string
      const blob = new Blob([updateJson], { type: 'application/json' });
      
      // Create a File object from the Blob
      const file = new File([blob], 'update.json', { type: 'application/json' });
      
      // Store the file in IPFS
      const cid = await this.storeFile(file);
      
      return cid;
    } catch (error) {
      console.error('Error storing campaign update:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to store campaign update');
    }
  }

  async getCampaignUpdate(cid: string): Promise<CampaignUpdate> {
    try {
      const response = await fetch(`${this.ipfsGateway}/ipfs/${cid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign update');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching campaign update:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaign update');
    }
  }
}

export const ipfsService = new IPFSService();
export default ipfsService; 