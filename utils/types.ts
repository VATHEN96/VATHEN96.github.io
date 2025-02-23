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
  createCampaign: () => Promise<void>;
  contributeToCampaign: () => Promise<void>;
  withdrawFromCampaign: () => Promise<void>;
  completeMilestone: () => Promise<void>;
  updateMilestone: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  fetchCampaigns: () => Promise<Campaign[]>;
  getCampaignById: () => Promise<Campaign | null>;
  getCampaign: () => Campaign | undefined;
  getUserContributions: () => Promise<Campaign[]>;
} 