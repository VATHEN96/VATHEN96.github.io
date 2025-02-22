import { ReactNode } from 'react';

export interface Campaign {
    id: string;
    title: string;
    description: string;
    goalAmount: number;       // renamed from goal
    totalFunded: number;      // renamed from currentAmount
    deadline: Date;
    creator: string;
    milestones: Milestone[];
    category: string;
    beneficiaries: string;
    proofOfWork: string;
    collateral?: string;
    multimedia?: File | null;
    isActive: boolean;        // New flag indicating whether the campaign is active
    createdAt: Date;          // The creation date of the campaign
    duration: number;         // Campaign duration in days
}

export interface Milestone {
    id: string;
    name: string;
    target: number;
    completed: boolean;
    dueDate?: Date;
}

export interface GoalZillaContextType {
    // Wallet
    isConnected: boolean;
    connectedAccount: string | null;
    accountBalance: number;

    // State
    campaigns: Campaign[];
    userCampaigns: Campaign[];
    loading: boolean;
    error: string | null;

    // Campaign actions
    createCampaign: (campaign: Omit<Campaign, 'id' | 'totalFunded'>) => Promise<void>;
    contributeToCampaign: (campaignId: string, amount: number) => Promise<void>;
    withdrawFromCampaign: (campaignId: string, amount: number) => Promise<void>;

    // Milestone actions
    completeMilestone: (campaignId: string, milestoneId: string) => Promise<void>;
    updateMilestone: (campaignId: string, milestoneId: string, updates: Partial<Milestone>) => Promise<void>;

    // User actions
    connectWallet: () => Promise<void>;
    disconnectWallet: () => Promise<void>;

    // State getters
    getCampaign: (campaignId: string) => Campaign | undefined;
    getUserContributions: (address: string) => Promise<{ campaignId: string; amount: number }[]>;
    getCampaignById: (id: string) => Promise<Campaign | null>;

    // Additional actions
    fetchCampaigns: () => Promise<Campaign[]>;
}

export interface GoalZillaProviderProps {
    children: ReactNode;
}
