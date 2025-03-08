'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import BlockchainService, { 
  RewardTier, 
  CreateProposalParams, 
  NFTBadgeMetadata 
} from '@/services/blockchainService';
import NotificationService, { 
  CampaignUpdate, 
  DeliveryStatus, 
  DeliveryMilestone, 
  Notification, 
  NotificationPreferences 
} from '../services/NotificationService';
import RiskAssessmentService, { RiskScore, CampaignReport, SpamPreventionRules } from '@/services/RiskAssessmentService';
import AnalyticsService, {
  OnChainMetric, 
  ChartDataPoint, 
  MetricChartData, 
  MilestoneProgress, 
  LinkedProposal, 
  CampaignAnalytics,
} from '@/services/AnalyticsService';
import { 
  Shield, 
  CircleCheck, 
  Award, 
  CircleDollarSign, 
  Users, 
  Calendar, 
  CircleAlert,
  ExternalLink,
  History,
  Activity,
  Flame,
  Star,
  Sparkles,
  Heart,
  TrendingUp,
  BadgeCheck,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  Loader2,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { Web3Provider } from '@ethersproject/providers';
import { useAccount, useNetwork } from 'wagmi';
import { configureChains } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { supportedChains } from '@/constants/chains';
import { ethers } from 'ethers';
import { signMessage } from '@wagmi/core';
import { 
  CreatorProfile,
  User,
  CampaignAnalytics,
  MetricChartData,
  MilestoneProgress,
  LinkedProposal
} from '@/types';

// Define the Comment interface
export interface Comment {
  id: string;
  campaignId: string;
  userId: string;
  content: string;
  timestamp: number;
  likes: number;
  isCreator: boolean;
  parentId?: string;  // Optional parentId for replies
  replies?: Comment[];
}

// Create instances of services
const blockchainService = new BlockchainService();
// NotificationService is now an object, not a class, so no instantiation needed
// const notificationService = new NotificationService();
const riskAssessmentService = new RiskAssessmentService(blockchainService);
const analyticsService = new AnalyticsService();

// Mock data for development
const mockUserCampaigns = [
  {
    id: '1',
    title: 'DeFi Education Platform',
    description: 'Educational platform for DeFi in emerging markets',
    creator_address: '0x6fcee09a8079d8db0a462f5df35da7fd5d3c56cd',
    status: 'active',
    funds_raised: 12.5,
    target: 20,
    end_date: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days from now
    image: '/images/campaign1.jpg'
  },
  {
    id: '2',
    title: 'Decentralized Identity Solution',
    description: 'Self-sovereign identity platform for the unbanked',
    creator_address: '0x6fcee09a8079d8db0a462f5df35da7fd5d3c56cd',
    status: 'completed',
    funds_raised: 15,
    target: 15,
    end_date: Date.now() - 1000 * 60 * 60 * 24 * 15, // 15 days ago
    image: '/images/campaign2.jpg'
  }
];

const mockBackedCampaigns = [
  {
    id: '3',
    title: 'Community DAO Infrastructure',
    description: 'Tools for community governance and treasury management',
    creator_address: '0x8a42d311a97d8436b14d49f6c1e2132f5a875e66',
    status: 'active',
    funds_raised: 8.3,
    target: 12,
    end_date: Date.now() + 1000 * 60 * 60 * 24 * 20, // 20 days from now
    image: '/images/campaign3.jpg'
  },
  {
    id: '4',
    title: 'NFT Marketplace for Artists',
    description: 'Platform for artists to mint and sell NFTs with low fees',
    creator_address: '0x9b67f5b9f6b5f5f5f5f5f5f5f5f5f5f5f5f5f5f5',
    status: 'active',
    funds_raised: 5.7,
    target: 10,
    end_date: Date.now() + 1000 * 60 * 60 * 24 * 25, // 25 days from now
    image: '/images/campaign4.jpg'
  }
];

// Add the CreatorProfile interface definition
export interface CreatorProfile {
  id?: string;
  address: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  verificationLevel?: VerificationLevel;
  trustScore?: number;
  joinDate?: string | Date;
  badges?: (string | { id: number; name: string; icon: string; })[];
  socialLinks?: {
    website?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  stats?: {
    campaigns?: number;
    contributions?: number;
    followers?: number;
    following?: number;
    totalFundsRaised?: string;
    totalContributors?: number;
    campaignsCreated?: number;
    successfulCampaigns?: number;
  };
}

// Define the VerificationLevel enum
export enum VerificationLevel {
  NONE = 'Unverified',
  BASIC = 'Basic',
  VERIFIED = 'Verified',
  ESTABLISHED = 'Established',
  UNVERIFIED = 'Unverified' // Alias for NONE for backward compatibility
}

// Types for NFT badges and proposals
export interface NFTBadge {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  campaignId: string;
  campaignTitle: string;
  tier: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  votingPower: number;
  dateIssued: number;
  attributes: {
    trait_type: string;
    value: string;
  }[];
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
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  totalVotes: number;
  userVoted?: boolean;
  userVoteOption?: string;
}

export interface VotingPower {
  tier: string;
  power: number;
}

interface WowzaRushContextType {
  // Wallet connection
  account: string | null;
  isWalletConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  
  // User profile
  userProfile: any | null;
  
  // Campaign functions
  getCampaign: (id: string) => Promise<any>;
  getCampaignDetails: (id: string) => Promise<any>;
  createCampaign: (campaignData: any) => Promise<string>;
  contributeToCampaign: (campaignId: string, amount: number) => Promise<boolean>;
  followCampaign: (campaignId: string) => Promise<boolean>;
  isFollowing: (campaignId: string, address?: string) => Promise<boolean>;
  likeCampaign: (campaignId: string) => Promise<boolean>;
  isUserLiked: (campaignId: string, address?: string) => Promise<boolean>;
  reportCampaign: (campaignId: string, reason: string, details: string, evidence?: string[]) => Promise<boolean>;
  fetchCampaigns: (forceRefresh?: boolean) => Promise<void>;
  campaigns: any[];
  userCampaigns: any[];
  userContributedCampaigns: any[];
  loading: boolean;
  error: string | null;
  
  // Verification functions
  startVerification: (level: VerificationLevel) => Promise<boolean>;
  getVerificationStatus: () => Promise<{level: VerificationLevel, inProgress: boolean, pendingLevel?: VerificationLevel}>;
  
  // Creator profile functions
  getCreatorProfile: (address?: string) => Promise<any>;
  updateCreatorProfile: (profileData: any) => Promise<boolean>;
  followCreator: (creatorAddress: string, shouldFollow?: boolean) => Promise<boolean>;
  
  // Comments and Q&A functions
  getComments: (campaignId: string) => Promise<Comment[]>;
  addComment: (campaignId: string, content: string, parentId?: string) => Promise<Comment>;
  likeComment: (commentId: string) => Promise<boolean>;
  reportComment: (commentId: string) => Promise<boolean>;
  getQuestions: (campaignId: string) => Promise<any[]>;
  addQuestion: (campaignId: string, content: string) => Promise<any>;
  answerQuestion: (questionId: string, answer: string) => Promise<boolean>;
  likeQuestion: (questionId: string) => Promise<boolean>;
  
  // Reward tiers functions
  getCampaignTiers: (campaignId: string) => Promise<RewardTier[]>;
  createTier: (campaignId: string, tierData: any) => Promise<string>;
  updateTier: (tierId: string, tierData: any) => Promise<boolean>;
  deleteTier: (tierId: string) => Promise<boolean>;
  contributeWithTier: (campaignId: string, tierId: string, amount: number) => Promise<boolean>;
  
  // NFT badge functions
  getUserNFTBadges: (address: string) => Promise<NFTBadge[]>;
  getCampaignNFTBadges: (campaignId: string) => Promise<NFTBadge[]>;
  mintNFTBadge: (campaignId: string, tierId: string, recipient: string, metadata: NFTBadgeMetadata) => Promise<string>;
  
  // Governance functions
  getCampaignProposals: (campaignId: string) => Promise<Proposal[]>;
  createProposal: (proposalData: CreateProposalParams) => Promise<string>;
  castVote: (proposalId: string, optionId: string, votingPower: number) => Promise<boolean>;
  getUserVotingPower: (address: string, campaignId: string) => Promise<{total: number, breakdown: VotingPower[]}>;

  // Notification functions
  getUserNotifications: (userId: string) => Promise<Notification[]>;
  getUnreadNotificationsCount: (userId: string) => Promise<number>;
  markNotificationAsRead: (notificationId: string) => Promise<boolean>;
  markAllNotificationsAsRead: (userId: string) => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  updateNotificationPreferences: (userId: string, preferences: Partial<NotificationPreferences>) => Promise<boolean>;
  getNotificationPreferences: (userId: string) => Promise<NotificationPreferences>;
  
  // Campaign updates functions
  getCampaignUpdates: (campaignId: string, includePrivate?: boolean) => Promise<CampaignUpdate[]>;
  createCampaignUpdate: (updateData: Omit<CampaignUpdate, 'id' | 'createdAt' | 'likes' | 'comments'>) => Promise<CampaignUpdate | null>;
  updateCampaignUpdate: (updateId: string, updateData: Partial<CampaignUpdate>) => Promise<boolean>;
  deleteCampaignUpdate: (updateId: string) => Promise<boolean>;
  
  // Delivery tracking functions
  getDeliveryStatus: (campaignId: string, rewardTierId?: string) => Promise<DeliveryStatus[]>;
  updateDeliveryStatus: (deliveryId: string, updates: Partial<DeliveryStatus>) => Promise<boolean>;
  updateMilestone: (deliveryId: string, milestoneId: string, updates: Partial<DeliveryMilestone>) => Promise<boolean>;
  
  // Risk assessment functions
  getCampaignRiskScore: (campaignId: string) => Promise<RiskScore>;
  getCampaignReports: (campaignId: string, adminOnly?: boolean) => Promise<CampaignReport[]>;
  resolveReport: (reportId: string, resolution: string) => Promise<boolean>;
  flagCampaign: (campaignId: string, reason?: string) => Promise<boolean>;
  unflagCampaign: (campaignId: string, reason: string) => Promise<boolean>;
  
  // Anti-spam functions
  canPerformAction: (actionType: 'create' | 'comment' | 'report') => Promise<boolean>;
  getSpamRules: () => SpamPreventionRules;
  updateSpamRules: (rules: Partial<SpamPreventionRules>) => Promise<boolean>;

  // Analytics functions
  getCampaignMetrics: (campaignId: string) => Promise<OnChainMetric[]>;
  getMetricChartData: (
    campaignId: string, 
    metricId: string, 
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all'
  ) => Promise<MetricChartData>;
  getMilestonesWithProposals: (campaignId: string) => Promise<MilestoneProgress[]>;
  getCampaignAnalytics: (campaignId: string) => Promise<CampaignAnalytics>;
  linkProposalToMilestone: (
    campaignId: string,
    milestoneId: string,
    proposalId: string
  ) => Promise<boolean>;
  unlinkProposalFromMilestone: (
    campaignId: string,
    milestoneId: string,
    proposalId: string
  ) => Promise<boolean>;
  getLinkableProposals: (campaignId: string) => Promise<LinkedProposal[]>;

  // New functions
  releaseMilestoneFunds: (
    campaignId: string,
    milestoneId: string
  ) => Promise<boolean>;
  getUserContributions: (campaignId?: string) => Promise<any[]>;

  // Fetch campaigns created by the current user
  fetchUserCampaigns: () => Promise<void>;

  // Get campaigns created by a user
  getUserCampaigns: (address?: string) => Promise<any[]>;

  // Get campaigns backed by a user
  getUserBackedCampaigns: (address?: string) => Promise<any[]>;

  // Alias for getUserBackedCampaigns for backward compatibility
  getUserContributedCampaigns: (address?: string) => Promise<any[]>;

  // Trust score calculation
  calculateTrustScore: (address: string) => Promise<number>;
}

// Create the context with default values
const WowzaRushContext = createContext<WowzaRushContextType | undefined>(undefined);

// Custom hook to use the context
export const useWowzaRush = () => {
  const context = useContext(WowzaRushContext);
  
  if (context === undefined) {
    throw new Error('useWowzaRush must be used within a WowzaRushProvider');
  }
  
  return context;
};

// Props for the provider component
interface WowzaRushProviderProps {
  children: ReactNode;
  contractAddress?: string;
}

// Provider component
export const WowzaRushProvider: React.FC<WowzaRushProviderProps> = ({ children, contractAddress }) => {
  // State for wallet connection
  const [account, setAccount] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const router = useRouter();
  
  // State for campaigns - initialize with empty array to prevent null reference
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [userCampaigns, setUserCampaigns] = useState<any[]>([]);
  const [userContributedCampaigns, setUserContributedCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // User profile state
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Check if wallet is connected on component mount
  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsWalletConnected(true);
        } else {
          setAccount(null);
          setIsWalletConnected(false);
        }
      });
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  // Check if wallet is already connected
  const checkConnection = async () => {
    try {
      const isConnected = await blockchainService.isWalletConnected();
      
      if (isConnected) {
        const currentAccount = await blockchainService.getCurrentAccount();
        
        if (currentAccount) {
          setAccount(currentAccount);
          setIsWalletConnected(true);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };
  
  // Connect wallet
  const connectWallet = async () => {
    try {
      const connectedAccount = await blockchainService.connectWallet();
      
      if (connectedAccount) {
        setAccount(connectedAccount);
        setIsWalletConnected(true);
        toast.success('Wallet connected successfully');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setIsWalletConnected(false);
    toast.success('Wallet disconnected');
  };
  
  // Campaign functions
  const getCampaign = async (id: string) => {
    try {
      // Implement API call to get campaign
      // For now, return mock data
      return {
        id,
        title: `Campaign ${id}`,
        description: 'This is a sample campaign description.',
        creatorAddress: '0x1234567890123456789012345678901234567890',
        creatorName: 'Creator Name',
        targetAmount: 10,
        currentAmount: 5,
        startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        category: 'Technology',
        imageUrl: 'https://via.placeholder.com/800x400',
        likes: 120,
        followers: 45,
        updates: 3
      };
    } catch (error) {
      console.error(`Error getting campaign ${id}:`, error);
      return null;
    }
  };
  
  const getCampaignDetails = async (id: string) => {
    // In a real app, this would fetch more detailed information about the campaign
    return getCampaign(id);
  };
  
  const createCampaign = async (campaignData: any) => {
    try {
      // Implement API call to create campaign
      return `campaign-${Date.now()}`;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };
  
  const contributeToCampaign = async (campaignId: string, amount: number) => {
    try {
      // Implementation would call an API endpoint or blockchain transaction
      toast.success(`Contributed ${amount} ETH to campaign ${campaignId}`);
      return true;
    } catch (error) {
      console.error(`Error contributing to campaign ${campaignId}:`, error);
      return false;
    }
  };
  
  const followCampaign = async (campaignId: string) => {
    try {
      // Implementation would call an API endpoint
      toast.success(`Following campaign ${campaignId}`);
      return true;
    } catch (error) {
      console.error(`Error following campaign ${campaignId}:`, error);
      return false;
    }
  };
  
  const isFollowing = async (campaignId: string, address?: string) => {
    try {
      // Implementation would check if user is following the campaign
      return Math.random() > 0.5; // Mock result
    } catch (error) {
      console.error(`Error checking follow status for campaign ${campaignId}:`, error);
      return false;
    }
  };
  
  const likeCampaign = async (campaignId: string) => {
    try {
      // Implementation would call an API endpoint
      toast.success(`Liked campaign ${campaignId}`);
      return true;
    } catch (error) {
      console.error(`Error liking campaign ${campaignId}:`, error);
      return false;
    }
  };
  
  const isUserLiked = async (campaignId: string, address?: string) => {
    try {
      // Implementation would check if user has liked the campaign
      return Math.random() > 0.5; // Mock result
    } catch (error) {
      console.error(`Error checking like status for campaign ${campaignId}:`, error);
      return false;
    }
  };
  
  const reportCampaign = async (campaignId: string, reason: string, details: string, evidence?: string[]): Promise<boolean> => {
    try {
      if (!account) {
        toast.error('Please connect your wallet to report a campaign');
        return false;
      }
      
      const reporterId = userProfile?.id || 'anonymous';
      return await riskAssessmentService.reportCampaign(
        campaignId,
        reporterId,
        account,
        reason,
        details,
        evidence
      );
    } catch (error) {
      console.error('Error reporting campaign:', error);
      toast.error('Failed to report campaign. Please try again.');
      return false;
    }
  };
  
  // Creator profile functions
  const getCreatorProfile = async (address?: string) => {
    try {
      const userAddress = address || account;
      
      if (!userAddress) {
        throw new Error('No address provided and no wallet connected');
      }
      
      // For now, return mock data
      return {
        address: userAddress,
        name: 'Creator Name',
        displayName: 'Creator Name',
        bio: 'This is a sample creator biography.',
        avatarUrl: 'https://via.placeholder.com/200',
        profileImageUrl: 'https://via.placeholder.com/200',
        website: 'https://example.com',
        social: {
          twitter: '@creator',
          github: 'creator',
          linkedin: 'creator'
        },
        verificationLevel: VerificationLevel.BASIC,
        createdCampaigns: 5,
        supportedCampaigns: 12,
        totalContributions: 8.5,
        stats: {
          totalRaised: 12500,
          totalFundsRaised: "12.5",
          totalBacked: 8,
          totalContributors: 42,
          successfulCampaigns: 3,
          campaignsCreated: 5
        }
      };
    } catch (error) {
      console.error('Error getting creator profile:', error);
      return null;
    }
  };
  
  const updateCreatorProfile = async (profileData: any) => {
    try {
      // Implementation would call an API endpoint
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating creator profile:', error);
      return false;
    }
  };
  
  const followCreator = async (creatorAddress: string, shouldFollow?: boolean): Promise<boolean> => {
    try {
      if (!account) {
        toast.error('Please connect your wallet to follow creators');
        return false;
      }

      // Default to following if not specified
      const isFollowing = shouldFollow !== false;

      if (process.env.NEXT_PUBLIC_MOCK_DATA === 'true') {
        // Mock implementation for development
        console.log(`${isFollowing ? 'Following' : 'Unfollowing'} creator: ${creatorAddress}`);
        return true;
      }

      // In production, this would call your API endpoint
      // Example: const response = await axios.post('/api/follow-creator', { creatorAddress, shouldFollow: isFollowing, account });
      
      // For now, we'll just simulate success
      return true;
    } catch (error) {
      console.error(`Error ${shouldFollow !== false ? 'following' : 'unfollowing'} creator ${creatorAddress}:`, error);
      return false;
    }
  };
  
  // Comments functions
  const getComments = async (campaignId: string) => {
    try {
      // For now, return mock data
      return [
        {
          id: 'comment-1',
          campaignId,
          userId: '0x1234567890abcdef1234567890abcdef12345678',
          content: 'This is an amazing campaign!',
          timestamp: Date.now() - 60 * 60 * 1000,
          likes: 5,
          isCreator: true,
          replies: [
            {
              id: 'comment-2',
              campaignId,
              userId: '0x2234567890abcdef1234567890abcdef12345678',
              content: 'I agree, it\'s fantastic!',
              timestamp: Date.now() - 30 * 60 * 1000,
              likes: 2,
              isCreator: false
            }
          ]
        },
        {
          id: 'comment-3',
          campaignId,
          userId: '0x3234567890abcdef1234567890abcdef12345678',
          content: 'Looking forward to seeing this project succeed!',
          timestamp: Date.now() - 120 * 60 * 1000,
          likes: 3,
          isCreator: false,
          replies: []
        }
      ] as Comment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  };
  
  const addComment = async (campaignId: string, content: string, parentId?: string) => {
    try {
      // Implementation would call an API endpoint
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        campaignId,
        userId: account || '0x0000000000000000000000000000000000000000',
        content,
        timestamp: Date.now(),
        likes: 0,
        isCreator: false, // This would be determined by checking if the user is the creator
        replies: []
      };
      
      toast.success('Comment added successfully');
      return comment;
    } catch (error) {
      console.error(`Error adding comment to campaign ${campaignId}:`, error);
      throw error;
    }
  };
  
  const likeComment = async (commentId: string) => {
    try {
      // Implementation would call an API endpoint
      toast.success(`Liked comment ${commentId}`);
      return true;
    } catch (error) {
      console.error(`Error liking comment ${commentId}:`, error);
      return false;
    }
  };
  
  const reportComment = async (commentId: string) => {
    try {
      // Implementation would call an API endpoint
      toast.success(`Comment reported successfully`);
      return true;
    } catch (error) {
      console.error(`Error reporting comment ${commentId}:`, error);
      return false;
    }
  };
  
  // Q&A functions
  const getQuestions = async (campaignId: string) => {
    try {
      // For now, return mock data
      return [
        {
          id: 'question-1',
          content: 'When will the project be completed?',
          author: {
            id: 'user-1',
            name: 'User 1',
            avatarUrl: 'https://via.placeholder.com/50'
          },
          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          likes: 12,
          userLiked: Math.random() > 0.5,
          answer: {
            content: 'We expect to complete the project by the end of Q3 2023.',
            createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
          }
        },
        {
          id: 'question-2',
          content: 'Will there be international shipping?',
          author: {
            id: 'user-2',
            name: 'User 2',
            avatarUrl: 'https://via.placeholder.com/50'
          },
          createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
          likes: 8,
          userLiked: Math.random() > 0.5,
          answer: null
        }
      ];
    } catch (error) {
      console.error(`Error getting questions for campaign ${campaignId}:`, error);
      return [];
    }
  };
  
  const addQuestion = async (campaignId: string, content: string) => {
    try {
      // Implementation would call an API endpoint
      const question = {
        id: `question-${Date.now()}`,
        content,
        author: {
          id: account || 'anonymous',
          name: account ? 'Connected User' : 'Anonymous',
          avatarUrl: 'https://via.placeholder.com/50'
        },
        createdAt: Date.now(),
        likes: 0,
        userLiked: false,
        answer: null
      };
      
      toast.success('Question added successfully');
      return question;
    } catch (error) {
      console.error(`Error adding question to campaign ${campaignId}:`, error);
      throw error;
    }
  };
  
  const answerQuestion = async (questionId: string, answer: string) => {
    try {
      // Implementation would call an API endpoint
      toast.success(`Answered question ${questionId}`);
      return true;
    } catch (error) {
      console.error(`Error answering question ${questionId}:`, error);
      return false;
    }
  };
  
  const likeQuestion = async (questionId: string) => {
    try {
      // Implementation would call an API endpoint
      toast.success(`Liked question ${questionId}`);
      return true;
    } catch (error) {
      console.error(`Error liking question ${questionId}:`, error);
      return false;
    }
  };
  
  // Reward tiers functions
  const getCampaignTiers = async (campaignId: string) => {
    try {
      return await blockchainService.getCampaignTiers(campaignId);
    } catch (error) {
      console.error(`Error getting tiers for campaign ${campaignId}:`, error);
      // Return mock data as fallback
      return [
        {
          id: 'tier-1',
          name: 'Early Bird',
          description: 'Basic supporter tier with early access',
          amount: 0.01,
          rewards: ['Early access', 'Thank you email'],
          nftBadge: true,
          votingPower: 1,
          governanceRights: true
        },
        {
          id: 'tier-2',
          name: 'Silver Supporter',
          description: 'Silver tier with additional benefits',
          amount: 0.05,
          rewards: ['Early access', 'Thank you email', 'Name in credits'],
          nftBadge: true,
          votingPower: 5,
          governanceRights: true
        },
        {
          id: 'tier-3',
          name: 'Gold Supporter',
          description: 'Gold tier with significant benefits',
          amount: 0.1,
          rewards: [
            'Early access', 
            'Thank you email', 
            'Name in credits', 
            'Exclusive updates'
          ],
          nftBadge: true,
          votingPower: 10,
          governanceRights: true
        },
        {
          id: 'tier-4',
          name: 'Platinum Patron',
          description: 'Premium tier with all benefits',
          amount: 0.5,
          rewards: [
            'Early access', 
            'Thank you email', 
            'Name in credits', 
            'Exclusive updates',
            'Private Discord access',
            'One-on-one meeting with creator'
          ],
          nftBadge: true,
          votingPower: 25,
          maxContributions: 10,
          governanceRights: true
        }
      ];
    }
  };
  
  const createTier = async (campaignId: string, tierData: any) => {
    try {
      // Implementation would call an API endpoint
      toast.success('Tier created successfully');
      return `tier-${Date.now()}`;
    } catch (error) {
      console.error(`Error creating tier for campaign ${campaignId}:`, error);
      throw error;
    }
  };
  
  const updateTier = async (tierId: string, tierData: any) => {
    try {
      // Implementation would call an API endpoint
      toast.success(`Tier ${tierId} updated successfully`);
      return true;
    } catch (error) {
      console.error(`Error updating tier ${tierId}:`, error);
      return false;
    }
  };
  
  const deleteTier = async (tierId: string) => {
    try {
      // Implementation would call an API endpoint
      toast.success(`Tier ${tierId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting tier ${tierId}:`, error);
      return false;
    }
  };
  
  const contributeWithTier = async (campaignId: string, tierId: string, amount: number) => {
    try {
      if (!isWalletConnected) {
        toast.error('Please connect your wallet first');
        return false;
      }
      
      try {
        const result = await blockchainService.contributeToCampaign(campaignId, tierId, amount);
        
        if (result) {
          toast.success(`Contributed ${amount} ETH to campaign ${campaignId} with tier ${tierId}`);
          toast.success(`NFT badge minted! Token ID: ${result.tokenId}`);
          return true;
        }
        return false;
      } catch (error: any) {
        console.error(`Error contributing to campaign ${campaignId} with tier ${tierId}:`, error);
        toast.error(error.message || 'Error contributing to campaign');
        return false;
      }
    } catch (error) {
      console.error(`Error contributing to campaign ${campaignId} with tier ${tierId}:`, error);
      return false;
    }
  };
  
  // NFT badge functions
  const getUserNFTBadges = async (address: string): Promise<NFTBadge[]> => {
    try {
      const userAddress = address || account;
      
      if (!userAddress) {
        throw new Error('No address provided and no wallet connected');
      }
      
      return await blockchainService.getUserNFTBadges(userAddress) as NFTBadge[];
    } catch (error) {
      console.error(`Error getting NFT badges for address ${address}:`, error);
      return [];
    }
  };
  
  const getCampaignNFTBadges = async (campaignId: string): Promise<NFTBadge[]> => {
    // This would fetch all possible badge types for a campaign
    // For now, we'll mock this by getting a user's badges
    return getUserNFTBadges(account || '');
  };
  
  const mintNFTBadge = async (
    campaignId: string, 
    tierId: string, 
    recipient: string, 
    metadata: NFTBadgeMetadata
  ): Promise<string> => {
    try {
      const result = await blockchainService.mintNFTBadge(
          campaignId,
        tierId,
        recipient,
        metadata
      );
      
      toast.success(`NFT badge minted successfully! Token ID: ${result.tokenId}`);
      return result.tokenId;
    } catch (error: any) {
      console.error(`Error minting NFT badge:`, error);
      toast.error(error.message || 'Error minting NFT badge');
      throw error;
    }
  };
  
  // Governance functions
  const getCampaignProposals = async (campaignId: string): Promise<Proposal[]> => {
    try {
      return await blockchainService.getCampaignProposals(campaignId) as Proposal[];
    } catch (error) {
      console.error(`Error getting proposals for campaign ${campaignId}:`, error);
      return [];
    }
  };
  
  const createProposal = async (proposalData: CreateProposalParams): Promise<string> => {
    try {
      if (!isWalletConnected) {
        toast.error('Please connect your wallet first');
        throw new Error('Wallet not connected');
      }
      
      const proposalId = await blockchainService.createProposal(proposalData);
      toast.success('Proposal created successfully');
      return proposalId;
      } catch (error: any) {
      console.error(`Error creating proposal:`, error);
      toast.error(error.message || 'Error creating proposal');
      throw error;
    }
  };
  
  const castVote = async (
    proposalId: string, 
    optionId: string, 
    votingPower: number
  ): Promise<boolean> => {
    try {
      if (!isWalletConnected) {
        toast.error('Please connect your wallet first');
        return false;
      }
      
      // In a real implementation, this would call the blockchain service
      const campaignId = 'campaign-1'; // This would be determined from the proposal
      const success = await blockchainService.voteOnProposal(
        campaignId,
        proposalId,
        optionId
      );
      
      if (success) {
        toast.success(`Vote cast successfully with ${votingPower} voting power`);
      }
      
      return success;
    } catch (error: any) {
      console.error(`Error casting vote:`, error);
      toast.error(error.message || 'Error casting vote');
      return false;
    }
  };
  
  const getUserVotingPower = async (
    address: string, 
    campaignId: string
  ): Promise<{total: number, breakdown: VotingPower[]}> => {
    try {
      const userAddress = address || account;
      
      if (!userAddress) {
        throw new Error('No address provided and no wallet connected');
      }
      
      const votingPower = await blockchainService.getUserVotingPower(userAddress, campaignId);
      
      return {
        total: votingPower.total,
        breakdown: votingPower.tiers.map((tier: any) => ({
          tier: tier.tier,
          power: tier.power
        }))
      };
    } catch (error) {
      console.error(`Error getting voting power:`, error);
      return {
        total: 0,
        breakdown: []
      };
    }
  };
  
  // Notification functions
  const getUserNotifications = async (userId: string): Promise<Notification[]> => {
    try {
      return await NotificationService.getUserNotifications(userId);
    } catch (error) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
        return [];
    }
  };
  
  const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    try {
      const notifications = await NotificationService.getUserNotifications(userId);
      return notifications.filter(notification => !notification.isRead).length;
    } catch (error) {
      console.error(`Error getting unread notification count for user ${userId}:`, error);
      return 0;
    }
  };
  
  const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      return await NotificationService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      return false;
    }
  };
  
  const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    try {
      return await NotificationService.markAllNotificationsAsRead(userId);
    } catch (error) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      return false;
    }
  };
  
  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    try {
      return await NotificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      return false;
    }
  };
  
  const updateNotificationPreferences = async (userId: string, preferences: Partial<NotificationPreferences>): Promise<boolean> => {
    try {
      return await NotificationService.updateNotificationPreferences(userId, preferences);
    } catch (error) {
      console.error(`Error updating notification preferences for user ${userId}:`, error);
      return false;
    }
  };
  
  const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
    try {
      return await NotificationService.getNotificationPreferences(userId);
    } catch (error) {
      console.error(`Error getting notification preferences for user ${userId}:`, error);
      // Return default preferences
      return {
        campaignUpdates: true,
        deliveryUpdates: true,
        milestoneUpdates: true,
        commentReplies: true,
        governanceProposals: true,
        contributionConfirmations: true,
        marketingEmails: false,
        emailNotifications: true,
        pushNotifications: true
      };
    }
  };
  
  // Campaign updates functions
  const getCampaignUpdates = async (campaignId: string, includePrivate: boolean = false): Promise<CampaignUpdate[]> => {
    try {
      // Only campaign creators or admins should be able to see private updates
      const isCreator = true; // This should be determined based on user role
      return await NotificationService.getCampaignUpdates(campaignId, isCreator && includePrivate);
    } catch (error) {
      console.error(`Error getting updates for campaign ${campaignId}:`, error);
      return [];
    }
  };
  
  const createCampaignUpdate = async (updateData: Omit<CampaignUpdate, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<CampaignUpdate | null> => {
    try {
      // Verify the user is the campaign creator or has permission
      return await NotificationService.createCampaignUpdate(updateData);
    } catch (error) {
      console.error('Error creating campaign update:', error);
      toast.error('Failed to publish campaign update');
      return null;
    }
  };
  
  const updateCampaignUpdate = async (updateId: string, updateData: Partial<CampaignUpdate>): Promise<boolean> => {
    try {
      // Verify the user is the campaign creator or has permission
      return await NotificationService.updateCampaignUpdate(updateId, updateData);
    } catch (error) {
      console.error(`Error updating campaign update ${updateId}:`, error);
      toast.error('Failed to edit campaign update');
      return false;
    }
  };
  
  const deleteCampaignUpdate = async (updateId: string): Promise<boolean> => {
    try {
      // Verify the user is the campaign creator or has permission
      return await NotificationService.deleteCampaignUpdate(updateId);
    } catch (error) {
      console.error(`Error deleting campaign update ${updateId}:`, error);
      toast.error('Failed to delete campaign update');
      return false;
    }
  };
  
  // Delivery tracking functions
  const getDeliveryStatus = async (campaignId: string, rewardTierId?: string): Promise<DeliveryStatus[]> => {
    try {
      return await NotificationService.getDeliveryStatus(campaignId, rewardTierId);
    } catch (error) {
      console.error(`Error getting delivery status for campaign ${campaignId}:`, error);
      return [];
    }
  };
  
  const updateDeliveryStatus = async (deliveryId: string, updates: Partial<DeliveryStatus>): Promise<boolean> => {
    try {
      // Verify the user is the campaign creator or has permission
      return await NotificationService.updateDeliveryStatus(deliveryId, updates);
    } catch (error) {
      console.error(`Error updating delivery status ${deliveryId}:`, error);
      toast.error('Failed to update delivery status');
      return false;
    }
  };
  
  const updateMilestone = async (deliveryId: string, milestoneId: string, updates: Partial<DeliveryMilestone>) => {
    try {
      // Verify the user is the campaign creator or has permission
      return await NotificationService.updateMilestone(deliveryId, milestoneId, updates);
    } catch (error) {
      console.error(`Error updating milestone ${milestoneId}:`, error);
      toast.error('Failed to update milestone');
      return false;
    }
  };
  
  // Risk assessment functions
  const getCampaignRiskScore = async (campaignId: string): Promise<RiskScore> => {
    try {
      return await riskAssessmentService.getCampaignRiskScore(campaignId);
    } catch (error) {
      console.error('Error getting campaign risk score:', error);
      toast.error('Failed to fetch risk assessment for this campaign');
      throw error;
    }
  };

  const getCampaignReports = async (campaignId: string, adminOnly: boolean = true): Promise<CampaignReport[]> => {
    try {
      // Only admins should see all reports
      const isAdmin = userProfile?.role === 'admin';
      if (adminOnly && !isAdmin) {
        return [];
      }
      
      
      return await riskAssessmentService.getCampaignReports(campaignId, adminOnly);
    } catch (error) {
      console.error('Error getting campaign reports:', error);
        throw error;
    }
  };

  const resolveReport = async (reportId: string, resolution: string): Promise<boolean> => {
    try {
      const isAdmin = userProfile?.role === 'admin';
      if (!isAdmin) {
        toast.error('Only administrators can resolve reports');
        return false;
      }
      
      return await riskAssessmentService.resolveReport(reportId, resolution);
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
      return false;
    }
  };

  const flagCampaign = async (campaignId: string, reason?: string): Promise<boolean> => {
    try {
      const isAdmin = userProfile?.role === 'admin';
      if (!isAdmin) {
        toast.error('Only administrators can manually flag campaigns');
        return false;
      }
      
      return await riskAssessmentService.flagCampaign(campaignId, 'admin', reason);
    } catch (error) {
      console.error('Error flagging campaign:', error);
      toast.error('Failed to flag campaign');
      return false;
    }
  };

  const unflagCampaign = async (campaignId: string, reason: string): Promise<boolean> => {
    try {
      const isAdmin = userProfile?.role === 'admin';
      if (!isAdmin) {
        toast.error('Only administrators can unflag campaigns');
        return false;
      }
      
      const adminId = userProfile?.id || 'unknown';
      return await riskAssessmentService.unflagCampaign(campaignId, adminId, reason);
    } catch (error) {
      console.error('Error unflagging campaign:', error);
      toast.error('Failed to unflag campaign');
      return false;
    }
  };

  // Anti-spam functions
  const canPerformAction = async (actionType: 'create' | 'comment' | 'report'): Promise<boolean> => {
    try {
      if (!account) {
        toast.error('Please connect your wallet first');
        return false;
      }
      
      return await riskAssessmentService.canUserPerformAction(account, actionType);
    } catch (error) {
      console.error(`Error checking if user can perform ${actionType}:`, error);
      return false;
    }
  };

  const getSpamRules = (): SpamPreventionRules => {
    return riskAssessmentService.getSpamRules();
  };

  const updateSpamRules = async (rules: Partial<SpamPreventionRules>): Promise<boolean> => {
    try {
      const isAdmin = userProfile?.role === 'admin';
      if (!isAdmin) {
        toast.error('Only administrators can update spam prevention rules');
        return false;
      }
      
      return await riskAssessmentService.updateSpamRules(rules);
    } catch (error) {
      console.error('Error updating spam prevention rules:', error);
      toast.error('Failed to update spam prevention rules');
      return false;
    }
  };
  
  // Analytics functions
  const getCampaignMetrics = async (campaignId: string): Promise<OnChainMetric[]> => {
    try {
      return await analyticsService.getCampaignMetrics(campaignId);
    } catch (error) {
      console.error('Error getting campaign metrics:', error);
      toast.error('Failed to fetch on-chain metrics');
      return [];
    }
  };

  const getMetricChartData = async (
    campaignId: string,
    metricId: string,
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all'
  ): Promise<MetricChartData> => {
    try {
      // Use default value of 'weekly' if timeframe is not provided
      const finalTimeframe = timeframe || 'weekly';
      // For actual implementation, we'd call the analytics service
      // For development, we'll use the mock service
      return await analyticsService.getMetricChartData(campaignId, metricId, finalTimeframe as any);
    } catch (error) {
      console.error("Error fetching metric chart data:", error);
      return { 
        metricId,
        metric: { id: '', name: '', description: '' }, 
        data: [] 
      };
    }
  };

  const getMilestonesWithProposals = async (campaignId: string): Promise<MilestoneProgress[]> => {
    try {
      return await analyticsService.getMilestonesWithProposals(campaignId);
    } catch (error) {
      console.error('Error getting milestones with proposals:', error);
      toast.error('Failed to fetch milestone data');
      return [];
    }
  };

  const getCampaignAnalytics = async (campaignId: string): Promise<CampaignAnalytics> => {
    try {
      return await analyticsService.getCampaignAnalytics(campaignId);
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      toast.error('Failed to fetch campaign analytics');
      return {
        campaignId,
        performance: {
          contributionsTotal: 0,
          contributorsTotal: 0,
          contributorChangePercent: 0,
          averageContribution: 0,
          recentActivity: 0
        },
        funding: {
          totalRaised: 0,
          fundingGoal: 0,
          percentFunded: 0,
          fundingRate: 0,
          fundingLeft: 0,
          daysLeft: 0
        },
        tiers: {
          popularTiers: [],
          tiersDistribution: []
        },
        governance: {
          totalProposals: 0,
          activeProposals: 0,
          averageParticipation: 0,
          voterCount: 0
        },
        milestones: {
          total: 0,
          completed: 0,
          inProgress: 0,
          delayed: 0,
          percentComplete: 0,
          onTrack: false
        }
      };
    }
  };

  const linkProposalToMilestone = async (
    campaignId: string,
    milestoneId: string,
    proposalId: string
  ): Promise<boolean> => {
    try {
      return await analyticsService.linkProposalToMilestone(campaignId, milestoneId, proposalId);
    } catch (error) {
      console.error('Error linking proposal to milestone:', error);
      toast.error('Failed to link proposal to milestone');
      return false;
    }
  };

  const unlinkProposalFromMilestone = async (
    campaignId: string,
    milestoneId: string,
    proposalId: string
  ): Promise<boolean> => {
    try {
      return await analyticsService.unlinkProposalFromMilestone(campaignId, milestoneId, proposalId);
    } catch (error) {
      console.error('Error unlinking proposal from milestone:', error);
      toast.error('Failed to unlink proposal from milestone');
      return false;
    }
  };

  const getLinkableProposals = async (campaignId: string): Promise<LinkedProposal[]> => {
    try {
      return await analyticsService.getLinkableProposals(campaignId);
    } catch (error) {
      console.error('Error getting linkable proposals:', error);
      toast.error('Failed to fetch available proposals');
        return [];
      }
  };
  
  // Add fetchCampaigns function
  const fetchCampaigns = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, you would fetch campaigns from an API or blockchain
      // For now, we'll simulate with mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock campaigns data
      const mockCampaigns = [
        {
          id: '1',
          creator: '0x1234567890123456789012345678901234567890',
          title: 'Decentralized Education Platform',
          description: 'A platform to make education accessible to everyone through blockchain technology',
          category: '11', // Education
          goalAmount: '5000000000000000000000', // 5000 TLOS in wei
          totalFunded: '2000000000000000000000', // 2000 TLOS in wei (40% funded)
          duration: '30', // 30 days
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          media: ['/images/campaign-1.jpg'],
          donors: ['0xabc1', '0xabc2', '0xabc3'],
          milestones: [
            {
              name: 'Initial Planning',
              targetAmount: '1000000000000000000000',
              isCompleted: true,
              isFunded: true,
              proofOfCompletion: '',
              fundsReleased: '1000000000000000000000',
              isUnderReview: false
            },
            {
              name: 'MVP Development',
              targetAmount: '2000000000000000000000',
              isCompleted: false,
              isFunded: false,
              proofOfCompletion: '',
              fundsReleased: '0',
              isUnderReview: false
            },
            {
              name: 'Platform Launch',
              targetAmount: '2000000000000000000000',
              isCompleted: false,
              isFunded: false,
              proofOfCompletion: '',
              fundsReleased: '0',
              isUnderReview: false
            }
          ],
          currentMilestone: '0',
          proofOfWork: '',
          beneficiaries: '0x1234567890123456789012345678901234567890',
          stakeholders: ['0x1234567890123456789012345678901234567890'],
          campaignType: '0'
        },
        {
          id: '2',
          creator: '0x0987654321098765432109876543210987654321',
          title: 'Green Energy Blockchain Solution',
          description: 'Revolutionizing renewable energy trading using smart contracts',
          category: '12', // Environment
          goalAmount: '10000000000000000000000', // 10000 TLOS in wei
          totalFunded: '8000000000000000000000', // 8000 TLOS in wei (80% funded)
          duration: '45', // 45 days
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          media: ['/images/campaign-2.jpg'],
          donors: ['0xdef1', '0xdef2', '0xdef3', '0xdef4'],
          milestones: [
            {
              name: 'Research Phase',
              targetAmount: '2000000000000000000000',
              isCompleted: true,
              isFunded: true,
              proofOfCompletion: '',
              fundsReleased: '2000000000000000000000',
              isUnderReview: false
            },
            {
              name: 'Prototype Development',
              targetAmount: '4000000000000000000000',
              isCompleted: true,
              isFunded: true,
              proofOfCompletion: '',
              fundsReleased: '4000000000000000000000',
              isUnderReview: false
            },
            {
              name: 'Full Production',
              targetAmount: '4000000000000000000000',
              isCompleted: false,
              isFunded: false,
              proofOfCompletion: '',
              fundsReleased: '0',
              isUnderReview: false
            }
          ],
          currentMilestone: '1',
          proofOfWork: '',
          beneficiaries: '0x0987654321098765432109876543210987654321',
          stakeholders: ['0x0987654321098765432109876543210987654321'],
          campaignType: '0'
        },
        {
          id: '3',
          creator: '0xabcdef1234567890abcdef1234567890abcdef12',
          title: 'Community-Owned Marketplace',
          description: 'Building a decentralized marketplace that gives power back to the community',
          category: '9', // Commerce
          goalAmount: '7500000000000000000000', // 7500 TLOS in wei
          totalFunded: '3000000000000000000000', // 3000 TLOS in wei (40% funded)
          duration: '60', // 60 days
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          media: ['/images/campaign-3.jpg'],
          donors: ['0xghi1', '0xghi2'],
          milestones: [
            {
              name: 'Design Phase',
              targetAmount: '1500000000000000000000',
              isCompleted: true,
              isFunded: true,
              proofOfCompletion: '',
              fundsReleased: '1500000000000000000000',
              isUnderReview: false
            },
            {
              name: 'Core Development',
              targetAmount: '3000000000000000000000',
              isCompleted: false,
              isFunded: false,
              proofOfCompletion: '',
              fundsReleased: '0',
              isUnderReview: false
            },
            {
              name: 'Security Audit',
              targetAmount: '1500000000000000000000',
              isCompleted: false,
              isFunded: false,
              proofOfCompletion: '',
              fundsReleased: '0',
              isUnderReview: false
            },
            {
              name: 'Launch & Marketing',
              targetAmount: '1500000000000000000000',
              isCompleted: false,
              isFunded: false,
              proofOfCompletion: '',
              fundsReleased: '0',
              isUnderReview: false
            }
          ],
          currentMilestone: '0',
          proofOfWork: '',
          beneficiaries: '0xabcdef1234567890abcdef1234567890abcdef12',
          stakeholders: ['0xabcdef1234567890abcdef1234567890abcdef12'],
          campaignType: '0'
        }
      ];
      
      setCampaigns(mockCampaigns);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      setError(error.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };
  
  // Verification functions
  const startVerification = async (level: VerificationLevel): Promise<boolean> => {
    try {
      // Implementation would call an API endpoint
      toast.success(`Verification started at level ${level}`);
      return true;
    } catch (error) {
      console.error('Error starting verification:', error);
      toast.error('Failed to start verification');
      return false;
    }
  };

  const getVerificationStatus = async (): Promise<{level: VerificationLevel, inProgress: boolean, pendingLevel?: VerificationLevel}> => {
    try {
      // Implementation would call an API endpoint
      return {
        level: VerificationLevel.NONE,
        inProgress: false,
        pendingLevel: undefined
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      toast.error('Failed to fetch verification status');
      return {
        level: VerificationLevel.NONE,
        inProgress: false,
        pendingLevel: undefined
      };
    }
  };
  
  // New functions
  const releaseMilestoneFunds = async (
    campaignId: string,
    milestoneId: string
  ): Promise<boolean> => {
    // Implementation
    return true;
  };

  // Get user's contributions to campaigns
  const getUserContributions = async (campaignId?: string): Promise<any[]> => {
    try {
      if (!account) return [];
      
      // If campaignId is provided, get specific campaign contributions
      if (campaignId) {
        const result = await blockchainService.getUserContributionsToCampaign(account, campaignId);
        return result;
      }
      
      // Otherwise get all user contributions
      const result = await blockchainService.getUserContributions(account);
      return result;
    } catch (error) {
      console.error('Error getting user contributions:', error);
      return [];
    }
  };

  // Fetch campaigns created by the current user
  const fetchUserCampaigns = async () => {
    if (account) {
      console.log('Fetching user campaigns...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userCreatedCampaigns = campaigns?.filter(campaign => 
        campaign.creator_address.toLowerCase() === account.toLowerCase()
      ) || [];
      
      console.log('User campaigns:', userCreatedCampaigns);
      setUserCampaigns(userCreatedCampaigns);
    } else {
      console.log('No account connected');
      setUserCampaigns([]);
    }
  };

  // Get campaigns created by a user
  const getUserCampaigns = async (address?: string): Promise<any[]> => {
    // Add a unique identifier to know which call is which
    const callId = Math.random().toString(36).substring(2, 8);
    const userAddress = address || account;
    
    if (!userAddress) {
      console.warn(`[${callId}] getUserCampaigns: No user address provided`);
      return [];
    }
    
    // Limit console spam by reducing logging
    if (userAddress === account) {
      console.log(`[${callId}] getUserCampaigns for current user: ${userAddress.substring(0, 8)}...`);
    }
    
    try {
      // Mock implementation: In a real app, this would be an API call
      return mockUserCampaigns || [];
    } catch (error) {
      console.error(`[${callId}] Error getting user campaigns:`, error);
      return [];
    }
  };
  
  // Get campaigns backed by a user
  const getUserBackedCampaigns = async (address?: string): Promise<any[]> => {
    // Add a unique identifier to know which call is which
    const callId = Math.random().toString(36).substring(2, 8);
    const userAddress = address || account;
    
    if (!userAddress) {
      console.warn(`[${callId}] getUserBackedCampaigns: No user address provided`);
      return [];
    }
    
    // Limit console spam by reducing logging
    if (userAddress === account) {
      console.log(`[${callId}] getUserBackedCampaigns for current user: ${userAddress.substring(0, 8)}...`);
    }
    
    try {
      // Mock implementation: In a real app, this would be an API call
      return mockBackedCampaigns || [];
    } catch (error) {
      console.error(`[${callId}] Error getting user backed campaigns:`, error);
      return [];
    }
  };
  
  // Alias for getUserBackedCampaigns for backward compatibility
  const getUserContributedCampaigns = async (address?: string) => {
    return getUserBackedCampaigns(address);
  };
  
  // Trust score calculation
  const calculateTrustScore = async (address: string): Promise<number> => {
    if (!address) {
      console.warn("No address provided for trust score calculation");
      return 50; // Default score for missing address
    }
    
    try {
      console.log("Calculating trust score for address:", address);
      // This is a mock implementation - in a real app, this would use actual on-chain and off-chain data
      const userProfile = await getCreatorProfile(address);
      if (!userProfile) {
        console.warn("No user profile found for address:", address);
        return 50;
      }
      
      // Base score components
      let verificationScore = 0;
      let activityScore = 0;
      let contributionScore = 0;
      let campaignSuccessScore = 0;
      
      // Verification level affects score
      switch(userProfile.verificationLevel) {
        case VerificationLevel.ESTABLISHED:
          verificationScore = 40;
          break;
        case VerificationLevel.VERIFIED:
          verificationScore = 30;
          break;
        case VerificationLevel.BASIC:
          verificationScore = 15;
          break;
        default:
          verificationScore = 0;
      }
      
      try {
        // Get campaigns created by user - handle potential errors separately
        const userCreatedCampaigns = await getUserCampaigns(address) || [];
        
        // Activity score based on campaign count
        activityScore = Math.min(20, userCreatedCampaigns.length * 5);
        
        // Success score based on campaign success rate
        const successfulCampaigns = userCreatedCampaigns.filter(c => c && (c.status === 'completed' || c.status === 'successful'));
        if (userCreatedCampaigns.length > 0) {
          campaignSuccessScore = Math.floor((successfulCampaigns.length / userCreatedCampaigns.length) * 20);
        }
      } catch (error) {
        console.error("Error calculating activity and success scores:", error);
        // Use default values if there's an error
        activityScore = 10;
        campaignSuccessScore = 10;
      }
      
      try {
        // Get contributions - handle potential errors separately
        const backedCampaigns = await getUserBackedCampaigns(address) || [];
        contributionScore = Math.min(20, (backedCampaigns.length || 0) * 4);
      } catch (error) {
        console.error("Error calculating contribution score:", error);
        // Use default value if there's an error
        contributionScore = 10;
      }
      
      // Sum all components for total score
      const totalScore = verificationScore + activityScore + contributionScore + campaignSuccessScore;
      console.log("Trust score components:", {
        verificationScore,
        activityScore,
        contributionScore,
        campaignSuccessScore,
        totalScore
      });
      
      // Add small random factor to prevent all scores looking the same
      const randomFactor = Math.floor(Math.random() * 5);
      
      return Math.min(100, totalScore + randomFactor);
    } catch (error) {
      console.error("Error calculating trust score:", error);
      return 50; // Default fallback score
    }
  };
  
  // Context value
  const contextValue: WowzaRushContextType = {
    // Wallet connection
    account,
    isWalletConnected,
    connectWallet,
    disconnectWallet,
    
    // User profile
    userProfile,
    
    // Campaign functions
    getCampaign,
    getCampaignDetails,
    createCampaign,
    contributeToCampaign,
    followCampaign,
    isFollowing,
    likeCampaign,
    isUserLiked,
    reportCampaign,
    fetchCampaigns,
    fetchUserCampaigns,
    getUserCampaigns,
    getUserBackedCampaigns,
    getUserContributedCampaigns,
    getCreatorProfile,
    updateCreatorProfile,
    followCreator,
    
    // State
    campaigns,
    userCampaigns,
    userContributedCampaigns,
    loading,
    error,
    
    // Verification functions
    startVerification,
    getVerificationStatus,
    
    // Comments and Q&A functions
    getComments,
    addComment,
    likeComment,
    reportComment,
    getQuestions,
    addQuestion,
    answerQuestion,
    likeQuestion,
    
    // Reward tiers functions
    getCampaignTiers,
    createTier,
    updateTier,
    deleteTier,
    contributeWithTier,
    
    // NFT badge functions
    getUserNFTBadges,
    getCampaignNFTBadges,
    mintNFTBadge,
    
    // Governance functions
    getCampaignProposals,
    createProposal,
    castVote,
    getUserVotingPower,
    
    // Notification functions
    getUserNotifications,
    getUnreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    updateNotificationPreferences,
    getNotificationPreferences,
    
    // Campaign updates functions
    getCampaignUpdates,
    createCampaignUpdate,
    updateCampaignUpdate,
    deleteCampaignUpdate,
    
    // Delivery tracking functions
    getDeliveryStatus,
    updateDeliveryStatus,
    updateMilestone,
    
    // Risk assessment functions
    getCampaignRiskScore,
    getCampaignReports,
    resolveReport,
    flagCampaign,
    unflagCampaign,
    
    // Anti-spam functions
    canPerformAction,
    getSpamRules,
    updateSpamRules,
    
    // Analytics functions
    getCampaignMetrics,
    getMetricChartData,
    getMilestonesWithProposals,
    getCampaignAnalytics,
    linkProposalToMilestone,
    unlinkProposalFromMilestone,
    getLinkableProposals,
    
    // New functions
    releaseMilestoneFunds,
    getUserContributions,
    calculateTrustScore,
  };
  
  return (
    <WowzaRushContext.Provider value={contextValue}>
      {children}
    </WowzaRushContext.Provider>
  );
};

export default WowzaRushProvider;
