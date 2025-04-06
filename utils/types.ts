import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';

export interface Milestone {
  name: string;
  description: string;
  target: ethers.BigNumber;
  dueDate: number;
  completed?: boolean;
  fundsReleased?: boolean;
}

export interface Campaign {
  id: number;
  creator: string;
  title: string;
  description: string;
  category: string;
  goalAmount: ethers.BigNumber;
  totalFunded: ethers.BigNumber;
  duration: number;
  createdAt: number;
  isActive: boolean;
  metadataIPFSHash: string;
  mediaIPFSHash: string;
  currentMilestone: number;
  milestones: Milestone[];
  donors: string[];
  campaignType: number;
  equityPercentage: number;
  minInvestment: ethers.BigNumber;
}

export interface wowzarushContextType {
  isConnected: boolean;
  connectedAccount: string | null;
  accountBalance: number;
  campaigns: Campaign[];
  userCampaigns: Campaign[];
  loading: boolean;
  error: string | null;
  createCampaign: (campaign: Campaign) => Promise<void>;
  contributeToCampaign: (campaignId: string, amount: number) => Promise<void>;
  withdrawFromCampaign: (campaignId: string, amount: number) => Promise<void>;
  completeMilestone: (campaignId: string, milestoneId: string) => Promise<void>;
  updateMilestone: (campaignId: string, milestoneId: string, milestone: Milestone) => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  fetchCampaigns: () => Promise<Campaign[]>;
  getCampaignById: (id: string) => Promise<Campaign | null>;
  getCampaign: (id: string) => Campaign | undefined;
  getUserContributions: () => Promise<Campaign[]>;
}

export interface CreateCampaignParams {
  title: string;
  description: string;
  category: string;
  goalAmount: ethers.BigNumber;
  duration: number;
  media?: string[];
  milestones: {
    name: string;
    description: string;
    target: ethers.BigNumber;
    dueDate: number;
    completed?: boolean;
    fundsReleased?: boolean;
  }[];
  beneficiaries?: Record<string, number>;
  stakeholders?: string[];
  campaignType?: number;
  metadataIPFSHash?: string; // Added for 7-arg ABI compatibility
}

// Helper function to create a new Campaign object
function createCampaignData(userInput: Partial<Campaign>): Campaign {
  return {
    id: userInput.id ?? 0,
    creator: userInput.creator || 'Default Creator',
    title: userInput.title || 'Default Campaign Title',
    description: userInput.description || 'Default Description',
    category: userInput.category || 'Default Category',
    goalAmount: userInput.goalAmount || ethers.BigNumber.from(0), // Use BigNumber
    totalFunded: userInput.totalFunded ?? ethers.BigNumber.from(0), // Use BigNumber
    duration: userInput.duration || 0,
    createdAt: userInput.createdAt ?? 0,
    isActive: userInput.isActive ?? true,
    metadataIPFSHash: userInput.metadataIPFSHash || '',
    mediaIPFSHash: userInput.mediaIPFSHash || '',
    currentMilestone: userInput.currentMilestone ?? 0,
    milestones: userInput.milestones || [],
    donors: userInput.donors || [],
    campaignType: userInput.campaignType ?? 0,
    equityPercentage: userInput.equityPercentage ?? 0,
    minInvestment: userInput.minInvestment || ethers.BigNumber.from(0), // Use BigNumber
  };
}

// Example usage in your component or function
async function handleCreateCampaign() {
  try {
    const campaignData = createCampaignData({
      title: 'My New Campaign',
      creator: 'John Doe',
      goalAmount: ethers.BigNumber.from(1000), // Use BigNumber
      // Add other properties as needed
    });
    // Call the createCampaignData function
    await createCampaignData(campaignData);
    alert('Campaign created successfully!');
  } catch (error) {
    console.error('Campaign creation failed:', error);
  }
}

// Call the function to create a campaign
handleCreateCampaign();
