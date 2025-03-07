// Common types used across the application

// NFT Badge interfaces
export interface NFTBadge {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  campaignId: string;
  campaignTitle: string;
  tierId?: string;
  tierName?: string;
  tier?: string; // For backward compatibility
  acquiredAt?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  properties?: Record<string, any>;
  contractAddress?: string;
}

// RewardTier interfaces for both component and blockchain service
export interface RewardTierCommon {
  id: string;
  amount: number;
  description: string;
  maxContributors?: number;
  contributors?: number;
  rewards?: {
    physical?: boolean;
    digital?: boolean;
    earlyAccess?: boolean;
    specialAccess?: boolean;
    nftBadge?: boolean;
    governance?: boolean;
    other?: string;
  };
}

export interface ComponentRewardTier extends RewardTierCommon {
  title: string; // Used in components
}

export interface BlockchainRewardTier extends RewardTierCommon {
  name: string; // Used in blockchain service
}

// Delivery tracking types
export interface DeliveryMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: number;
  completedDate: number | null;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
}

export interface DeliveryStatus {
  id: string;
  campaignId: string;
  rewardTierId: string;
  rewardTierName: string;
  milestones: DeliveryMilestone[];
  estimatedDeliveryDate: number;
  updatedAt: number;
  shippingStarted: boolean;
  shippingCompleted: boolean;
  trackingAvailable: boolean;
}

// Voting and governance types
export interface ProposalOption {
  id: string;
  text: string;
  votes: number;
}

export interface Proposal {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  creatorAddress: string;
  creatorName: string;
  createdAt: number;
  endTime: number;
  options: ProposalOption[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  totalVotes: number;
  userVoted?: boolean;
  userVoteOption?: string;
}

export interface VotingPower {
  total: number;
  tiers: {
    tier: string;
    power: number;
  }[];
  breakdown?: VotingPower[];
}

export interface ProposalFormValues {
  title: string;
  description: string;
  votingDuration: string;
  options: string[];
}

// Analytics types
export interface CampaignAnalytics {
  campaignId: string;
  performance: {
    contributionsTotal: number;
    contributorsTotal: number;
    contributorChangePercent?: number;
    averageContribution: number;
    recentActivity: number;
  };
  funding: {
    totalRaised: number;
    fundingGoal: number;
    percentFunded: number;
    fundingRate: number;
    fundingLeft: number;
    daysLeft: number;
  };
  tiers: {
    popularTiers: {
      id: string;
      name: string;
      contributors: number;
      amount: number;
      percentOfTotal: number;
    }[];
    tiersDistribution: {
      name: string;
      value: number;
    }[];
  };
  governance: {
    totalProposals: number;
    activeProposals: number;
    averageParticipation: number;
    voterCount: number;
  };
  milestones: {
    total: number;
    completed: number;
    inProgress: number;
    delayed: number;
    percentComplete: number;
    onTrack: boolean;
  };
}

export interface MilestoneProgress {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'delayed' | 'pending';
  progressPercentage: number;
}

export interface MetricChartData {
  metricId: string;
  metric: {
    id: string;
    name: string;
    description: string;
  };
  data: {
    date: string;
    value: number;
  }[];
}

export interface LinkedProposal {
  id: string;
  title: string;
  proposedDate?: string | number;
  status: 'approved' | 'pending' | 'rejected';
  votes: number;
}

// Other shared types that need to be standardized
export interface User {
  id: string;
  displayName: string;
  walletAddress: string;
  bio?: string;
  avatarUrl?: string;
  skills?: string[];
  socialLinks?: Record<string, string>;
}

export interface CreatorProfile {
  id: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  walletAddress: string;
  stats?: {
    campaignsCreated?: number;
    successfulCampaigns?: number;
    totalBackers?: number;
    totalFundsRaised?: string;
  };
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
    discord?: string;
    telegram?: string;
    github?: string;
  };
  badges?: (string | { id: number; name: string; icon: string; })[];
  skills?: string[];
}

// Q&A Types
export interface Question {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  createdAt: number;
  creatorAddress: string;
  creatorName: string;
  isAnswered: boolean;
  isPinned: boolean;
  answerCount: number;
  upvotes: number;
  tags: string[];
  bestAnswerId?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  createdAt: number;
  creatorAddress: string;
  creatorName: string;
  upvotes: number;
  isBestAnswer: boolean;
} 