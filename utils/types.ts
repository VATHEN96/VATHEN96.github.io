import { v4 as uuidv4 } from 'uuid';

export interface Milestone {
  id: string;
  name: string;
  target: number;
  completed: boolean;
  dueDate?: Date;
}

export interface Campaign {
  id: string;
  creator: string;
  title: string;
  description: string;
  goalAmount: number;
  totalFunded: number;
  deadline: Date;
  milestones: Milestone[];
  category: string;
  beneficiaries: string[];
  proofOfWork: string;
  collateral: string;
  multimedia: string;
  isActive: boolean;
  createdAt: Date;
  duration: number;
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

// Helper function to create a new Campaign object
function createCampaignData(userInput: Partial<Campaign>): Campaign {
  return {
    id: uuidv4(), // Generate a unique ID
    creator: userInput.creator || 'Default Creator',
    title: userInput.title || 'Default Campaign Title',
    description: userInput.description || 'Default Description',
    goalAmount: userInput.goalAmount || 0,
    totalFunded: userInput.totalFunded ?? 0, // Default to 0 if not provided
    deadline: userInput.deadline || new Date(),
    milestones: userInput.milestones || [],
    category: userInput.category || 'Default Category',
    beneficiaries: userInput.beneficiaries || [],
    proofOfWork: userInput.proofOfWork || 'Default Proof',
    collateral: userInput.collateral || 'Default Collateral',
    multimedia: userInput.multimedia || 'Default Multimedia',
    isActive: userInput.isActive ?? true,
    createdAt: userInput.createdAt || new Date(),
    duration: userInput.duration || 0,
  };
}

// Example usage in your component or function
async function handleCreateCampaign() {
  try {
    const campaignData = createCampaignData({
      title: 'My New Campaign',
      creator: 'John Doe',
      goalAmount: 1000,
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
