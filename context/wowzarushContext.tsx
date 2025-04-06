'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import BlockchainServiceFixedV3Instance, {
  BlockchainServiceFixed 
} from '@/services/blockchainServiceFixedV3';
import NotificationService from '@/services/NotificationService';
import RiskAssessmentService from '@/services/RiskAssessmentService';
import AnalyticsService from '@/services/AnalyticsService';
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
import { 
  initStorage,
  getQuestions,
  addQuestion as addStorageQuestion,
  getUserProfile,
  updateUserProfile,
  addComment as addStorageComment,
  getCampaignUpdates as getStorageUpdates,
  addCampaignUpdate as addStorageUpdate
} from '@/utils/web3-storage';
import * as web3Storage from '@/utils/web3-storage';

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
const blockchainService = BlockchainServiceFixedV3Instance;
const riskAssessmentService = new RiskAssessmentService();
const analyticsService = new AnalyticsService();
const notificationService = new NotificationService();

// Removed mock data for development - will now use real data

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
  userAddress: string | null;
  isWalletConnected: boolean;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  chainId: number | null;
  
  // Blockchain service
  blockchainService: BlockchainServiceFixed;
  
  // User profile
  userProfile: CreatorProfile | null;
  
  // Campaign functions
  getCampaign: (id: string) => Promise<any>;
  getCampaignDetails: (id: string) => Promise<any>;
  createCampaign: (campaignData: any) => Promise<string>;
  updateCampaign: (campaignData: any) => Promise<boolean>;
  contributeToCampaign: (campaignId: string, amount: number, tierId?: string) => Promise<boolean>;
  followCampaign: (campaignId: string) => Promise<boolean>;
  isFollowing: (campaignId: string, address?: string) => Promise<boolean>;
  likeCampaign: (campaignId: string) => Promise<boolean>;
  isUserLiked: (campaignId: string, address?: string) => Promise<boolean>;
  reportCampaign: (campaignId: string, reason: string, details: string, evidence?: string[]) => Promise<boolean>;
  fetchCampaigns: (forceRefresh?: boolean, page?: number, limit?: number) => Promise<void>;
  fetchUserCampaigns: (forceRefresh?: boolean, page?: number, limit?: number) => Promise<void>;
  campaigns: any[];
  userCampaigns: any[];
  userContributedCampaigns: any[];
  allCampaigns: any[];
  totalUserCampaigns: number;
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
  addQuestion: (campaignId: string, title: string, content: string) => Promise<any>;
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
  createCampaignUpdate: (updateData: any) => Promise<CampaignUpdate | null>;
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

  // Get campaigns created by a user
  getUserCampaigns: (address?: string, page?: number, limit?: number) => Promise<any[]>;

  // Get campaigns backed by a user
  getUserBackedCampaigns: (address?: string, page?: number, limit?: number) => Promise<any[]>;

  // Alias for getUserBackedCampaigns for backward compatibility
  getUserContributedCampaigns: (address?: string) => Promise<any[]>;

  // Trust score calculation
  calculateTrustScore: (address: string) => Promise<number>;

  // Web3Storage
  web3Storage: any;

  // New state variables and their setter functions
  tryConnectWallet: () => Promise<boolean>;
  isWalletConnecting: boolean;
  setIsWalletConnecting: React.Dispatch<React.SetStateAction<boolean>>;
  walletConnectError: string | null;
  setWalletConnectError: React.Dispatch<React.SetStateAction<string | null>>;
}

// Create the context
const WowzaRushContext = createContext<WowzaRushContextType | null>(null);

// Create the provider component
export function WowzaRushProvider({ children }: { children: ReactNode }) {
  // State management
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState<boolean>(false);
  const [walletConnectError, setWalletConnectError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [userCampaigns, setUserCampaigns] = useState<any[]>([]);
  const [userContributedCampaigns, setUserContributedCampaigns] = useState<any[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]); // Added the missing state for allCampaigns
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // User profile state
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [totalUserCampaigns, setTotalUserCampaigns] = useState<number>(0);
  const router = useRouter();
  
  // Initialize web3Storage on component mount
  const initWeb3Storage = async () => {
    try {
      console.log('Initializing web3 storage...');
      
      // Check if we already have a web3Storage instance
      if (web3Storage && typeof web3Storage.getUserProfile === 'function') {
        console.log('Web3 storage already initialized');
        return;
      }
      
      // Import and initialize web3Storage
      try {
        await web3Storage.initStorage();
        console.log('Web3 storage initialized successfully');
        
        // Test storage is working
        const storageTest = await web3Storage.blockchainCache.get('storage-test');
        if (!storageTest) {
          // Set a test value to confirm storage is working
          await web3Storage.blockchainCache.set(
            'storage-test',
            { test: 'Storage is working' },
            1, // chainId - just a placeholder
            60 * 60 * 1000 // 1 hour TTL
          );
          console.log('Storage test successful');
        }
      } catch (initError) {
        console.error('Error initializing web3 storage:', initError);
        
        // If initialization failed, try one more time after a delay
        setTimeout(async () => {
          try {
            await web3Storage.initStorage();
            console.log('Web3 storage initialized successfully on retry');
          } catch (retryError) {
            console.error('Failed to initialize web3 storage on retry:', retryError);
          }
        }, 2000);
      }
    } catch (e) {
      console.error('Unexpected error in web3 storage initialization:', e);
    }
  };
  
  // Initialize immediately
  initWeb3Storage();

  // Cleanup function
  useEffect(() => {
    return () => {
      // Any cleanup needed
    };
  }, []); // Empty dependency array since we only want to initialize once
  
  // Define the checkConnection function to synchronize with blockchain service
  const checkConnection = async () => {
    try {
      // First explicitly check with the window.ethereum provider if available
      if (window.ethereum) {
        try {
          // Force get accounts - this is more reliable than just checking the state
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          // Log whether accounts were found to help with debugging
          if (accounts && accounts.length > 0) {
            const currentAccount = accounts[0];
            console.log('Provider has active account:', currentAccount.substring(0, 8) + '...');
            
            // Get current wallet state from blockchain service
            const currentWalletState = blockchainService.getWalletState();
            
            // Update state only if it's different to avoid unnecessary re-renders
            if (!isWalletConnected || userAddress !== currentAccount) {
              console.log('Updating wallet connection state from provider');
              setIsWalletConnected(true);
              setUserAddress(currentAccount);
              setChainId(currentWalletState.chainId);
            }
            return true;
          } else {
            console.log('Provider reports no connected accounts');
          }
        } catch (providerError) {
          console.error('Error checking accounts with provider:', providerError);
        }
      }
      
      // Fallback to blockchain service if provider check failed or returned no accounts
      const serviceIsConnected = blockchainService.isConnected();
      const serviceWalletAddress = blockchainService.getWalletAddress();
      const serviceWalletState = blockchainService.getWalletState();
      
      console.log({
        serviceIsConnected,
        serviceWalletAddress: serviceWalletAddress ? `${serviceWalletAddress.substring(0, 8)}...` : null,
        currentContextIsConnected: isWalletConnected,
        currentContextWalletAddress: userAddress ? `${userAddress.substring(0, 8)}...` : null
      });
      
      // Update state if service reports different connection state
      if (serviceIsConnected && serviceWalletAddress) {
        if (!isWalletConnected || userAddress !== serviceWalletAddress) {
          console.log('Updating connection state from service:', serviceWalletAddress.substring(0, 8) + '...');
          setIsWalletConnected(true);
          setUserAddress(serviceWalletAddress);
          setChainId(serviceWalletState.chainId);
        }
        return true;
      }
      
      // If we get here, no wallet is connected
      if (isWalletConnected) {
        console.log('No wallet connected, resetting state');
        setIsWalletConnected(false);
        setUserAddress(null);
        setChainId(null);
      }
      return false;
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsWalletConnected(false);
      setUserAddress(null);
      setChainId(null);
      return false;
    }
  };
  
  // Add useEffect for more frequent synchronization during critical operations
  useEffect(() => {
    // Initial connection check
    checkConnection();
    
    // Set up regular synchronization to ensure state is always up-to-date
    const syncInterval = setInterval(() => {
      checkConnection();
    }, 3000); // Check every 3 seconds (more frequent than before)
    
    // Define event handler functions to make cleanup easier
    const handleAccountsChanged = () => {
      console.log('Accounts changed, checking connection');
      checkConnection();
    };
    
    const handleChainChanged = () => {
      console.log('Chain changed, checking connection');
      checkConnection();
    };
    
    const handleConnect = () => {
      console.log('Wallet connected event received');
      checkConnection();
    };
    
    const handleDisconnect = () => {
      console.log('Wallet disconnected event received');
      setIsWalletConnected(false);
      setUserAddress(null);
      setChainId(null);
    };
    
    // Set up event listeners for wallet changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('connect', handleConnect);
      window.ethereum.on('disconnect', handleDisconnect);
      
      // Force an immediate check for accounts
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            console.log('Found accounts on initial load:', accounts[0].substring(0, 8) + '...');
            const currentWalletState = blockchainService.getWalletState();
            setIsWalletConnected(true);
            setUserAddress(accounts[0]);
            setChainId(currentWalletState.chainId);
          }
        })
        .catch((err: any) => console.error('Error checking accounts:', err));
    }
    
    return () => {
      // Clean up interval and event listeners
      clearInterval(syncInterval);
      
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  // Add forceCheckConnection function back
  const forceCheckConnection = async () => {
    // Always check with actual wallet provider first
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const currentWalletState = blockchainService.getWalletState();
          setIsWalletConnected(true);
          setUserAddress(accounts[0]);
          setChainId(currentWalletState.chainId);
          console.log('Force-updated wallet connection state:', accounts[0]);
          return true;
        }
      } catch (error) {
        console.error('Error in force check connection:', error);
      }
    }
    
    // If no accounts from provider, check blockchain service
    try {
      const serviceIsConnected = blockchainService.isConnected();
      const serviceWalletAddress = blockchainService.getWalletAddress();
      const serviceWalletState = blockchainService.getWalletState();
      
      if (serviceIsConnected && serviceWalletAddress) {
        setIsWalletConnected(true);
        setUserAddress(serviceWalletAddress);
        setChainId(serviceWalletState.chainId);
        console.log('Force-updated wallet from blockchain service:', serviceWalletAddress);
        return true;
      }
    } catch (error) {
      console.error('Error checking service connection:', error);
    }
    
    return false;
  };

  // Fix the connectWallet function to handle errors properly
  async function connectWallet() {
    console.log('Connecting wallet...');
    
    // State for tracking connection flow
    setIsWalletConnecting(true);
    setWalletConnectError(null);
    
    try {
      // Verify ethereum is available
      if (typeof window === 'undefined') {
        throw new Error('Browser environment not available');
      }
      
      if (!window.ethereum) {
        const errorMsg = 'MetaMask not detected. Please install MetaMask to use this application.';
        setWalletConnectError(errorMsg);
        toast.error(errorMsg);
        setIsWalletConnecting(false);
        return false;
      }
      
      // First, check if wallet is already connected by querying existing accounts
      try {
        const existingAccounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        if (existingAccounts && existingAccounts.length > 0) {
          const connectedAddress = existingAccounts[0];
          console.log('Wallet was already connected:', connectedAddress);
          
          // Get chain ID
          const chainIdHex = await window.ethereum.request({
            method: 'eth_chainId'
          });
          const chainId = parseInt(chainIdHex, 16);
          
          // Update state with connected wallet
          setUserAddress(connectedAddress);
          setIsWalletConnected(true);
          setChainId(chainId);
          setIsWalletConnecting(false);
          
          // Initialize blockchain service if it exists
          if (blockchainService) {
            try {
              await blockchainService.connectWallet();
              console.log('Successfully initialized blockchain service with wallet');
            } catch (error) {
              console.warn('Error initializing blockchain service:', error);
            }
          }
          
          return true;
        }
      } catch (checkError) {
        console.warn('Error checking for existing connection:', checkError);
        // Continue to explicit connection request
      }
      
      // Request wallet connection (will prompt user if not connected)
      console.log('Requesting wallet connection...');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      // Verify we got accounts back
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please check your wallet and try again.');
      }
      
      const connectedAddress = accounts[0];
      console.log('Wallet connected successfully:', connectedAddress);
      
      // Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId'
      });
      const chainId = parseInt(chainIdHex, 16);
      
      // Update state with connected wallet
      setUserAddress(connectedAddress);
      setIsWalletConnected(true);
      setChainId(chainId);
      
      // Initialize blockchain service with connected wallet
      if (blockchainService) {
        try {
          await blockchainService.connectWallet();
          console.log('Successfully initialized blockchain service with wallet');
        } catch (error) {
          console.warn('Error initializing blockchain service:', error);
        }
      }
      
      // Update connected wallet in local storage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('wallet_address', connectedAddress);
      }
      
      toast.success('Wallet connected successfully!');
      return true;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to connect wallet. Please try again.';
      
      if (error.code) {
        // MetaMask error codes
        switch (error.code) {
          case 4001:
            // User rejected the request
            errorMessage = 'You declined the connection request. Please try again.';
            break;
          case -32002:
            // Request already pending
            errorMessage = 'A wallet connection request is already pending. Please check your wallet.';
            break;
          case -32603:
            // Internal JSON-RPC error
            errorMessage = 'Wallet connection error. Your wallet may be locked or disconnected.';
            break;
          default:
            errorMessage = `Wallet connection error: ${error.message || error}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setWalletConnectError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsWalletConnecting(false);
    }
  }
  
  // Disconnect wallet
  const disconnectWallet = () => {
    setUserAddress(null);
    setChainId(null);
    setIsWalletConnected(false);
    
    // Call blockchain service disconnect if available
    if (blockchainService) {
      // Check if disconnect method exists before calling it
      if (typeof blockchainService.disconnect === 'function') {
        blockchainService.disconnect();
      } else if (typeof blockchainService.resetWalletConnection === 'function') {
        blockchainService.resetWalletConnection();
      }
      // If neither method exists, continue without calling anything
    }
    
    // Clear local storage if needed
    localStorage.removeItem('WowzaRush_wallet_connected');
  };

  // Function to synchronize wallet state with blockchain service
  const synchronizeWalletState = async () => {
    try {
      if (!blockchainService) {
        setIsWalletConnected(false);
        setUserAddress(null);
        setChainId(null);
      } else {
        // Update context state based on blockchain service state
        const walletState = blockchainService.getWalletState();
        setIsWalletConnected(walletState.isConnected);
        setUserAddress(walletState.address);
        setChainId(walletState.chainId);
      }
    } catch (error) {
      console.error('Error during wallet synchronization:', error);
      setIsWalletConnected(false);
      setUserAddress(null);
      setChainId(null);
    }
  };

  // Initialize the context
  useEffect(() => {
    initWeb3Storage()
      .then(() => console.log('Web3Storage initialized'))
      .catch(error => console.error('Failed to initialize web3Storage:', error));
      
    checkConnection()
      .then(() => console.log('Wallet connection checked'))
      .catch(error => console.error('Error checking wallet connection:', error));
  }, []);
  
  // Get creator profile with robust error handling
  const getCreatorProfile = async (address?: string): Promise<CreatorProfile | null> => {
    console.log('getCreatorProfile called for address:', address);
    
    // Handle undefined or null address
    if (!address) {
      console.warn('getCreatorProfile called with no address, returning null');
      return null;
    }
    
    try {
      // Normalize address
      const normalizedAddress = address.toLowerCase();
      console.log('Getting profile for normalized address:', normalizedAddress);
      
      // First attempt: Try to get from web3Storage
      try {
        if (web3Storage?.getUserProfile) {
          console.log('Fetching profile from web3Storage');
          const profile = await web3Storage.getUserProfile(normalizedAddress);
          
          if (profile) {
            console.log('Found profile in web3Storage:', profile);
            
            // Create stats object if it doesn't exist
            const stats = profile.stats || {};

            // If profile exists in storage but doesn't have campaigns count, get from blockchain
            if (!stats.campaignsCreated && blockchainService?.getUserCampaigns) {
              try {
                console.log('Fetching campaign count from blockchain');
                const campaigns = await blockchainService.getUserCampaigns(normalizedAddress);
                if (Array.isArray(campaigns)) {
                  stats.campaignsCreated = campaigns.length;
                  
                  // Count successful campaigns
                  stats.successfulCampaigns = campaigns.filter(
                    c => c.status === 'completed' || c.totalFunded >= c.goalAmount
                  ).length;
                  
                  // Calculate total funds raised
                  const totalRaised = campaigns.reduce((sum, campaign) => {
                    const fundedAmount = campaign.totalFunded ? 
                      (typeof campaign.totalFunded === 'object' && campaign.totalFunded.toString) ? 
                        campaign.totalFunded.toString() : 
                        String(campaign.totalFunded) 
                      : '0';
                    return sum + (parseFloat(fundedAmount) || 0);
                  }, 0);
                  
                  stats.totalFundsRaised = totalRaised.toString();
                }
              } catch (campaignErr) {
                console.warn('Error fetching campaigns for stats:', campaignErr);
              }
            }
            
            // Return the profile with updated stats
            return {
              ...profile,
              address: normalizedAddress,
              stats
            };
          }
        }
      } catch (storageErr) {
        console.warn('Error fetching profile from web3Storage:', storageErr);
      }
      
      // Second attempt: Build minimal profile from blockchain data
      console.log('No profile found in storage, building minimal profile from blockchain');
      if (blockchainService) {
        try {
          const campaigns = await blockchainService.getUserCampaigns(normalizedAddress);
          
          // Create minimal profile
          const minimalProfile: CreatorProfile = {
            address: normalizedAddress,
            displayName: `${normalizedAddress.substring(0, 6)}...${normalizedAddress.substring(normalizedAddress.length - 4)}`,
            stats: {
              campaignsCreated: Array.isArray(campaigns) ? campaigns.length : 0,
              successfulCampaigns: 0,
              totalFundsRaised: '0'
            }
          };
          
          // Calculate successful campaigns and total funds
          if (Array.isArray(campaigns) && campaigns.length > 0) {
            minimalProfile.stats.successfulCampaigns = campaigns.filter(
              c => c.status === 'completed' || c.totalFunded >= c.goalAmount
            ).length;
            
            const totalRaised = campaigns.reduce((sum, campaign) => {
              const fundedAmount = campaign.totalFunded ? 
                (typeof campaign.totalFunded === 'object' && campaign.totalFunded.toString) ? 
                  campaign.totalFunded.toString() : 
                  String(campaign.totalFunded) 
                : '0';
              return sum + (parseFloat(fundedAmount) || 0);
            }, 0);
            
            minimalProfile.stats.totalFundsRaised = totalRaised.toString();
          }
          
          // Store this minimal profile for future use
          if (web3Storage?.updateUserProfile) {
            try {
              await web3Storage.updateUserProfile(normalizedAddress, minimalProfile);
              console.log('Stored minimal profile for future use');
            } catch (updateErr) {
              console.warn('Could not store minimal profile:', updateErr);
            }
          }
          
          return minimalProfile;
        } catch (blockchainErr) {
          console.warn('Error building profile from blockchain:', blockchainErr);
        }
      }
      
      // Final fallback: Return minimal profile with just the address
      console.log('Creating fallback minimal profile');
      return {
        address: normalizedAddress,
        displayName: `${normalizedAddress.substring(0, 6)}...${normalizedAddress.substring(normalizedAddress.length - 4)}`,
        stats: {
          campaignsCreated: 0,
          successfulCampaigns: 0,
          totalFundsRaised: '0'
        }
      };
    } catch (error) {
      console.error('Error in getCreatorProfile:', error);
      
      // Last resort error fallback
      return {
        address: address.toLowerCase(),
        displayName: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        stats: {
          campaignsCreated: 0,
          successfulCampaigns: 0,
          totalFundsRaised: '0'
        }
      };
    }
  };

  // Update the getCampaign method with better initialization and error handling
  const getCampaign = async (campaignId: string) => {
    try {
      if (!blockchainService) {
        console.error('Blockchain service is not available');
        throw new Error('Blockchain service is not available');
      }
      
      console.log(`Getting campaign with ID: ${campaignId}`);
      
      // Explicitly initialize the blockchain service first
      try {
        await blockchainService.initialize();
        
        // Check if connected properly
        if (!blockchainService.isConnected()) {
          console.warn('Blockchain service connected but not ready');
          throw new Error('Blockchain service not ready');
        }
      } catch (initError) {
        console.error('Failed to initialize blockchain service:', initError);
        throw new Error(`Blockchain initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
      }
      
      const numericId = parseInt(campaignId);
      
      // Ensure we pass the ID as a string to the blockchain service
      const campaign = await blockchainService.getCampaign(numericId.toString());
      
      console.log(`Successfully retrieved campaign: ${campaign?.title}`);
      return campaign;
    } catch (error) {
      console.error(`Error in context getCampaign for ID ${campaignId}:`, error);
      // Provide more detailed error information
      if (error instanceof Error) {
        throw new Error(`Failed to get campaign: ${error.message}`);
      } else {
        throw new Error(`Failed to get campaign: Unknown error`);
      }
    }
  };

  // Create context value with all required properties
  const contextValue = {
    // Wallet connection
    userAddress,
    isWalletConnected,
    connectWallet,
    disconnectWallet,
    chainId,
    
    // Blockchain service
    blockchainService,
    
    // User profile
    userProfile,
    
    // Creator profile functions
    getCreatorProfile,
    
    // Fetch user campaigns
    fetchUserCampaigns: async (forceRefresh = false, page = 1, limit = 10) => {
      if (!userAddress) {
        console.warn('Cannot fetch user campaigns: No user address');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching user campaigns for address:', userAddress);
        
        // Try to get from blockchain service if available
        if (blockchainService?.getUserCampaigns) {
          const campaigns = await blockchainService.getUserCampaigns(userAddress);
          if (Array.isArray(campaigns)) {
            setUserCampaigns(campaigns);
            console.log(`Fetched ${campaigns.length} user campaigns`);
          }
        } else {
          // Use empty array instead of mock data
          console.log('No campaigns available from blockchain service');
          setUserCampaigns([]);
        }
      } catch (error) {
        console.error('Error fetching user campaigns:', error);
        // Set to empty array on error
        setUserCampaigns([]);
      } finally {
        setLoading(false);
      }
    },
    
    // Other functions and properties needed by the context
    // Include mock implementations for required interface methods
    getCampaign,
    getCampaignDetails: async () => ({}),
    createCampaign: async () => "",
    updateCampaign: async () => true,
    contributeToCampaign: async (campaignId: string, amount: number, tierId?: string) => {
      try {
        if (!blockchainService) {
          console.error("Blockchain service not available");
          toast.error("Blockchain service not available");
          throw new Error("Blockchain service not available");
        }

        // If tierId is provided, use the contributeWithTier method
        if (tierId && blockchainService.contributeWithTier) {
          console.log(`Contributing ${amount} ETH to campaign ${campaignId} with tier ${tierId}`);
          
          try {
            const result = await blockchainService.contributeWithTier(campaignId, tierId, amount);
            if (result) {
              toast.success(`Successfully contributed ${amount} ETH with selected tier!`);
            }
            return result;
          } catch (error) {
            console.error("Error contributing with tier:", error);
            toast.error(`Failed to contribute with tier: ${error instanceof Error ? error.message : "Unknown error"}`);
            throw error;
          }
        } 
        // Otherwise, use the regular contribute method
        else if (blockchainService.contributeToCampaign) {
          console.log(`Contributing ${amount} ETH to campaign ${campaignId}`);
          
          try {
            const result = await blockchainService.contributeToCampaign(campaignId, amount);
            if (result) {
              toast.success(`Successfully contributed ${amount} ETH to the campaign!`);
            }
            return result;
          } catch (error) {
            console.error("Error contributing to campaign:", error);
            toast.error(`Failed to contribute: ${error instanceof Error ? error.message : "Unknown error"}`);
            throw error;
          }
        } else {
          console.error("Blockchain service method contributeToCampaign is not available");
          toast.error("Contribution functionality is not available");
          throw new Error("Contribution functionality not available");
        }
      } catch (error) {
        console.error("Error contributing to campaign:", error);
        toast.error(`Failed to contribute: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
      }
    },
    followCampaign: async () => true,
    isFollowing: async () => false,
    likeCampaign: async () => true,
    isUserLiked: async () => false,
    
    // Implement risk assessment functions
    getCampaignRiskScore: async (campaignId: string) => {
      try {
        return await riskAssessmentService.getCampaignRiskScore(campaignId);
      } catch (error) {
        console.error('Error getting campaign risk score:', error);
        throw error;
      }
    },
    getCampaignReports: async (campaignId: string, adminOnly: boolean = true) => {
      try {
        return await riskAssessmentService.getCampaignReports(campaignId, adminOnly);
      } catch (error) {
        console.error('Error getting campaign reports:', error);
        return [];
      }
    },
    resolveReport: async (reportId: string, resolution: string) => {
      try {
        return await riskAssessmentService.resolveReport(reportId, resolution);
      } catch (error) {
        console.error('Error resolving report:', error);
        return false;
      }
    },
    flagCampaign: async (campaignId: string, reason?: string) => {
      try {
        return await riskAssessmentService.flagCampaign(campaignId, 'admin', reason);
      } catch (error) {
        console.error('Error flagging campaign:', error);
        return false;
      }
    },
    unflagCampaign: async (campaignId: string, reason: string) => {
      if (!userAddress) return false;
      try {
        return await riskAssessmentService.unflagCampaign(campaignId, userAddress, reason);
      } catch (error) {
        console.error('Error unflagging campaign:', error);
        return false;
      }
    },
    reportCampaign: async (campaignId: string, reason: string, details: string, evidence?: string[]) => {
      if (!userAddress) return false;
      try {
        return await riskAssessmentService.reportCampaign(
          campaignId,
          userAddress, // Using address as ID
          userAddress,
          reason,
          details,
          evidence
        );
      } catch (error) {
        console.error('Error reporting campaign:', error);
        return false;
      }
    },
    
    // Implement reward tiers functions
    getCampaignTiers: async (campaignId: string) => {
      try {
        console.log('Getting campaign tiers for campaign:', campaignId);
        if (!blockchainService) {
          const error = new Error("Blockchain service not available");
          console.error(error);
          toast.error("Blockchain service not available");
          throw error;
        }

        try {
          const tiers = await blockchainService.getCampaignTiers(campaignId);
          console.log('Received tiers:', tiers);
          return tiers;
        } catch (error) {
          console.error("Error getting campaign tiers:", error);
          toast.error(`Error getting campaign tiers: ${error instanceof Error ? error.message : "Unknown error"}`);
          throw error;
        }
      } catch (error) {
        console.error("Error in getCampaignTiers:", error);
        toast.error(`Failed to get campaign tiers: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
      }
    },
    
    createTier: async (campaignId: string, tierData: any) => {
      try {
        if (!blockchainService?.createRewardTier) {
          toast.error("Tier creation functionality unavailable. Please check your connection.");
          console.error("Blockchain service method createRewardTier is not available");
          throw new Error("Tier creation functionality unavailable");
        }
        
        const result = await blockchainService.createRewardTier(campaignId, tierData);
        if (result) {
          toast.success("Reward tier created successfully");
        }
        return result;
      } catch (error) {
        console.error("Error creating reward tier:", error);
        toast.error("Failed to create reward tier. Please try again later.");
        throw error;
      }
    },
    
    updateTier: async (tierId: string, tierData: any) => {
      try {
        if (!blockchainService?.updateRewardTier) {
          toast.error("Tier update functionality unavailable. Please check your connection.");
          console.error("Blockchain service method updateRewardTier is not available");
          throw new Error("Tier update functionality unavailable");
        }
        
        const result = await blockchainService.updateRewardTier(tierId, tierData);
        if (result) {
          toast.success("Reward tier updated successfully");
        }
        return result;
      } catch (error) {
        console.error("Error updating reward tier:", error);
        toast.error("Failed to update reward tier. Please try again later.");
        throw error;
      }
    },
    
    deleteTier: async (tierId: string) => {
      try {
        if (!blockchainService?.deleteRewardTier) {
          toast.error("Tier deletion functionality unavailable. Please check your connection.");
          console.error("Blockchain service method deleteRewardTier is not available");
          throw new Error("Tier deletion functionality unavailable");
        }
        
        const result = await blockchainService.deleteRewardTier(tierId);
        if (result) {
          toast.success("Reward tier deleted successfully");
        }
        return result;
      } catch (error) {
        console.error("Error deleting reward tier:", error);
        toast.error("Failed to delete reward tier. Please try again later.");
        throw error;
      }
    },
    
    contributeWithTier: async (campaignId: string, tierId: string, amount: number) => {
      try {
        if (!blockchainService) {
          const error = new Error("Blockchain service not available");
          console.error(error);
          toast.error("Blockchain service not available");
          throw error;
        }

        if (!blockchainService.contributeWithTier) {
          const error = new Error("contributeWithTier method not available");
          console.error(error);
          toast.error("Contribution functionality not available");
          throw error;
        }

        console.log(`Contributing ${amount} ETH to campaign ${campaignId} with tier ${tierId}`);
        
        try {
          const result = await blockchainService.contributeWithTier(campaignId, tierId, amount);
          if (result) {
            toast.success(`Successfully contributed ${amount} ETH with selected tier!`);
          }
          return result;
        } catch (error) {
          console.error("Error contributing with tier:", error);
          toast.error(`Failed to contribute with tier: ${error instanceof Error ? error.message : "Unknown error"}`);
          throw error;
        }
      } catch (error) {
        console.error("Error in contributeWithTier:", error);
        toast.error(`Failed to contribute: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
      }
    },
    
    // Implement governance functions
    getCampaignProposals: async (campaignId: string) => {
      try {
        console.log(`Getting proposals for campaign: ${campaignId}`);
        if (!blockchainService || !blockchainService.getCampaignProposals) {
          const error = new Error("Blockchain service method getCampaignProposals is not available");
          console.error(error);
          toast.error('Failed to load proposals. Service unavailable.');
          throw error;
        }
        const proposals = await blockchainService.getCampaignProposals(campaignId);
        console.log('Received proposals:', proposals);
        return proposals;
      } catch (error) {
        console.error('Error fetching campaign proposals:', error);
        toast.error(`Failed to load proposals: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
      }
    },
    
    createProposal: async (proposalData: any) => {
      try {
        if (!blockchainService?.createProposal) {
          toast.error("Proposal creation functionality unavailable. Please check your connection.");
          console.error("Blockchain service method createProposal is not available");
          throw new Error("Proposal creation functionality unavailable");
        }
        
        const result = await blockchainService.createProposal(proposalData);
        if (result) {
          toast.success("Proposal created successfully");
        }
        return result;
      } catch (error) {
        console.error("Error creating proposal:", error);
        toast.error("Failed to create proposal. Please try again later.");
        throw error;
      }
    },
    
    castVote: async (proposalId: string, optionId: string, votingPower: number) => {
      try {
        if (!blockchainService?.castVote) {
          toast.error("Voting functionality unavailable. Please check your connection.");
          console.error("Blockchain service method castVote is not available");
          throw new Error("Voting functionality unavailable");
        }
        
        const result = await blockchainService.castVote(proposalId, optionId, votingPower);
        if (result) {
          toast.success("Vote cast successfully");
        }
        return result;
      } catch (error) {
        console.error("Error casting vote:", error);
        toast.error("Failed to cast vote. Please try again later.");
        throw error;
      }
    },
    
    getUserVotingPower: async (address: string, campaignId: string) => {
      try {
        console.log(`Getting voting power for user: ${address} in campaign: ${campaignId}`);
        if (!blockchainService || !blockchainService.getUserVotingPower) {
          console.error('Blockchain service method getUserVotingPower is not available');
          toast.error('Failed to load voting power. Service unavailable.');
          return '0';
        }
        const votingPower = await blockchainService.getUserVotingPower(address, campaignId);
        console.log('Received voting power:', votingPower);
        return votingPower || '0';
      } catch (error) {
        console.error('Error fetching user voting power:', error);
        toast.error('Failed to load voting power');
        return '0';
      }
    },
    
    fetchCampaigns: async () => {},
    campaigns: [],
    userCampaigns: [],
    userContributedCampaigns: [],
    allCampaigns: [],
    totalUserCampaigns: 0,
    loading: false,
    error: null,
    startVerification: async () => false,
    getVerificationStatus: async () => ({ level: VerificationLevel.UNVERIFIED, inProgress: false }),
    updateCreatorProfile: async () => true,
    followCreator: async () => true,
    getComments: async () => [],
    addComment: async (campaignId: string, content: string, parentId?: string) => {
      if (!userAddress) {
        toast.error('Please connect your wallet to add a comment');
        throw new Error('Wallet not connected');
      }
      
      try {
        // Generate a unique ID for the comment
        const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Check if user is the creator
        let isCreator = false;
        try {
          if (blockchainService && campaignId) {
            const campaign = await blockchainService.getCampaign(campaignId);
            if (campaign && campaign.creator) {
              isCreator = campaign.creator.toLowerCase() === userAddress.toLowerCase();
            }
          }
        } catch (error) {
          console.warn('Error checking if user is creator:', error);
        }
        
        // Create the comment object
        const newComment: Comment = {
          id: commentId,
          campaignId,
          userId: userAddress,
          content,
          timestamp: Date.now(),
          likes: 0,
          isCreator
        };
        
        if (parentId) {
          newComment.parentId = parentId;
        }
        
        // Store the comment in web3Storage if available
        if (web3Storage?.addComment) {
          await web3Storage.addComment(campaignId, newComment);
        }
        
        return newComment;
      } catch (error) {
        console.error('Error adding comment:', error);
        toast.error(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    getOnboardingStatus: async () => ({ completed: false }),
    completeOnboardingStep: async () => true,
    web3Storage: web3Storage,
    tryConnectWallet: async () => false,
    isWalletConnecting,
    setIsWalletConnecting,
    walletConnectError,
    setWalletConnectError,
    getUserContributedCampaigns: async (address?: string) => {
      const userAddr = address || userAddress;
      if (!userAddr) {
        console.warn('Cannot fetch contributed campaigns: No user address');
        return [];
      }
      
      try {
        console.log('Fetching contributed campaigns for address:', userAddr);
        
        // Try to use blockchain service if available
        if (blockchainService?.getUserContributions) {
          const contributions = await blockchainService.getUserContributions(userAddr);
          if (Array.isArray(contributions)) {
            setUserContributedCampaigns(contributions);
            return contributions;
          }
        }
        
        // Return empty array instead of mock data
        console.log('No contributions available from blockchain service');
        setUserContributedCampaigns([]);
        return [];
      } catch (error) {
        console.error('Error fetching contributed campaigns:', error);
        setUserContributedCampaigns([]);
        return [];
      }
    },
    getUserBackedCampaigns: async (address?: string, page = 1, limit = 10) => {
      const userToFetch = address || userAddress;
      
      if (!userToFetch) {
        console.warn('Cannot fetch backed campaigns: No user address');
        return [];
      }
      
      try {
        console.log('Fetching backed campaigns for address:', userToFetch);
        
        // Try to get from blockchain service if available
        if (blockchainService?.getUserBackedCampaigns) {
          const campaigns = await blockchainService.getUserBackedCampaigns(userToFetch);
          if (Array.isArray(campaigns)) {
            console.log(`Fetched ${campaigns.length} backed campaigns`);
            return campaigns;
          }
        }
        
        // Return empty array instead of mock data
        console.log('No backed campaigns available from blockchain service');
        return [];
      } catch (error) {
        console.error('Error fetching backed campaigns:', error);
        // Return empty array on error
        return [];
      }
    },
    calculateTrustScore: async () => 0,
    getUserReputation: async () => ({}),
    getCategories: async () => [],
    getFundingStats: async () => ({}),
    getQuestions: async (campaignId: string) => {
      try {
        console.log(`Getting questions for campaign: ${campaignId}`);
        
        // Try to get questions from web3Storage if available
        if (web3Storage?.getQuestions) {
          try {
            const questions = await web3Storage.getQuestions(campaignId);
            if (Array.isArray(questions) && questions.length > 0) {
              console.log(`Found ${questions.length} questions in web3Storage`);
              return questions;
            }
          } catch (storageError) {
            console.warn('Error fetching questions from web3Storage:', storageError);
            // Continue to other methods
          }
        }
        
        // Return empty array instead of failing
        return [];
      } catch (error) {
        console.error('Error getting questions:', error);
        // Return empty array on error rather than throwing
        return [];
      }
    },
    addQuestion: async (campaignId: string, title: string, content: string) => {
      if (!userAddress) {
        toast.error('Please connect your wallet to ask a question');
        throw new Error('Wallet not connected');
      }
      
      try {
        console.log(`Adding question to campaign ${campaignId}`);
        
        // Generate a unique question ID
        const questionId = `question_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Check if user is the creator
        let isCreator = false;
        try {
          if (blockchainService) {
            const campaign = await blockchainService.getCampaign(campaignId);
            if (campaign && campaign.creator) {
              isCreator = campaign.creator.toLowerCase() === userAddress.toLowerCase();
            }
          }
        } catch (error) {
          console.warn('Error checking if user is creator:', error);
          // Don't throw here - we'll assume the user is not a creator
        }
        
        // If user is creator, don't allow question submission
        if (isCreator) {
          toast.error('As the creator, you cannot ask questions on your own campaign');
          throw new Error('Creator cannot ask questions on their own campaign');
        }
        
        // Create the new question object with proper type
        const newQuestion = {
          id: questionId,
          campaignId,
          title,
          content,
          createdAt: Date.now(),
          creatorAddress: userAddress,
          creatorName: userProfile?.displayName || `${userAddress.substring(0, 6)}...`,
          isAnswered: false,
          isPinned: false,
          answerCount: 0,
          upvotes: 0,
          tags: [] as string[]
        };
        
        // Store the question in web3Storage if available
        if (web3Storage?.addQuestion) {
          try {
            await web3Storage.addQuestion(campaignId, newQuestion);
            console.log('Question added to web3Storage');
          } catch (storageError) {
            console.warn('Error adding question to web3Storage:', storageError);
            // Continue - this is just a backup
          }
        } else {
          console.warn('web3Storage.addQuestion not available');
        }
        
        // Return the new question
        return newQuestion;
      } catch (error) {
        console.error('Error adding question:', error);
        toast.error(`Failed to add question: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    answerQuestion: async () => true,
    getCampaignUpdates: async (campaignId: string, includePrivate: boolean = false) => {
      try {
        console.log(`Getting updates for campaign: ${campaignId}, includePrivate: ${includePrivate}`);
        
        // Try to get campaign updates from web3Storage if available
        try {
          const updates = await getStorageUpdates(campaignId, includePrivate);
          if (Array.isArray(updates)) {
            return updates;
          }
        } catch (storageError) {
          console.warn('Error fetching updates from web3Storage:', storageError);
        }
        
        // If the blockchain service has this method, try it
        if (blockchainService?.getCampaignUpdates) {
          try {
            const updates = await blockchainService.getCampaignUpdates(campaignId, includePrivate);
            if (Array.isArray(updates)) {
              return updates;
            }
          } catch (error) {
            console.warn('Error fetching updates from blockchain service:', error);
          }
        }
        
        // Return empty array as fallback
        return [];
      } catch (error) {
        console.error('Error in getCampaignUpdates:', error);
        toast.error(`Failed to load campaign updates: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return [];
      }
    },
    createCampaignUpdate: async (updateData: any) => {
      try {
        console.log('Creating campaign update:', updateData);
        
        // Validate the user is connected
        if (!userAddress) {
          toast.error('Please connect your wallet to create an update');
          throw new Error('Wallet not connected');
        }
        
        // Check if the user is the creator of the campaign
        let isCreator = false;
        try {
          if (blockchainService && updateData.campaignId) {
            const campaign = await blockchainService.getCampaign(updateData.campaignId);
            if (campaign?.creator) {
              isCreator = campaign.creator.toLowerCase() === userAddress.toLowerCase();
            }
          }
        } catch (error) {
          console.warn('Error checking if user is creator:', error);
        }
        
        if (!isCreator) {
          toast.error('Only the campaign creator can post updates');
          throw new Error('Not authorized to post campaign updates');
        }
        
        // Generate a unique ID for the update
        const updateId = `update_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Create the update object
        const newUpdate = {
          id: updateId,
          campaignId: updateData.campaignId,
          creatorId: userAddress,
          title: updateData.title,
          content: updateData.content,
          isPublic: updateData.isPublic !== false, // Default to true if not specified
          isPinned: updateData.isPinned === true, // Default to false if not specified
          attachments: updateData.attachments || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likes: 0,
          comments: []
        };
        
        // Store in web3Storage if available
        try {
          await addStorageUpdate(newUpdate);
          console.log('Update stored in web3Storage');
        } catch (storageError) {
          console.warn('Error storing update in web3Storage:', storageError);
          // Continue - this is just a backup storage
        }
        
        return newUpdate;
      } catch (error) {
        console.error('Error creating campaign update:', error);
        toast.error(`Failed to create update: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    updateCampaignUpdate: async (updateId: string, updateData: any) => {
      try {
        console.log(`Updating campaign update ${updateId}:`, updateData);
        
        if (!userAddress) {
          toast.error('Please connect your wallet to update a campaign update');
          throw new Error('Wallet not connected');
        }
        
        // Try to load the existing update from web3Storage
        let existingUpdate = null;
        if (web3Storage?.getCampaignUpdate) {
          existingUpdate = await web3Storage.getCampaignUpdate(updateId);
        }
        
        if (!existingUpdate) {
          toast.error('Failed to find the update to edit');
          throw new Error('Update not found');
        }
        
        // Verify the user is the creator of the update
        if (existingUpdate.creatorId.toLowerCase() !== userAddress.toLowerCase()) {
          toast.error('You can only edit your own updates');
          throw new Error('Not authorized to edit this update');
        }
        
        // Create updated object
        const updatedUpdate = {
          ...existingUpdate,
          title: updateData.title !== undefined ? updateData.title : existingUpdate.title,
          content: updateData.content !== undefined ? updateData.content : existingUpdate.content,
          isPublic: updateData.isPublic !== undefined ? updateData.isPublic : existingUpdate.isPublic,
          isPinned: updateData.isPinned !== undefined ? updateData.isPinned : existingUpdate.isPinned,
          attachments: updateData.attachments !== undefined ? updateData.attachments : existingUpdate.attachments,
          updatedAt: new Date().toISOString()
        };
        
        // Update in web3Storage
        if (web3Storage?.updateCampaignUpdate) {
          await web3Storage.updateCampaignUpdate(updateId, updatedUpdate);
          return true;
        }
        
        toast.error('Update storage functionality not available');
        return false;
      } catch (error) {
        console.error(`Error updating campaign update ${updateId}:`, error);
        toast.error(`Failed to update campaign update: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      }
    },
    deleteCampaignUpdate: async (updateId: string) => {
      try {
        console.log(`Deleting campaign update ${updateId}`);
        
        if (!userAddress) {
          toast.error('Please connect your wallet to delete an update');
          throw new Error('Wallet not connected');
        }
        
        // Try to load the existing update
        let existingUpdate = null;
        if (web3Storage?.getCampaignUpdate) {
          existingUpdate = await web3Storage.getCampaignUpdate(updateId);
        }
        
        if (!existingUpdate) {
          toast.error('Failed to find the update to delete');
          throw new Error('Update not found');
        }
        
        // Verify the user is the creator of the update
        if (existingUpdate.creatorId.toLowerCase() !== userAddress.toLowerCase()) {
          toast.error('You can only delete your own updates');
          throw new Error('Not authorized to delete this update');
        }
        
        // Delete from web3Storage
        if (web3Storage?.deleteCampaignUpdate) {
          await web3Storage.deleteCampaignUpdate(updateId);
          return true;
        }
        
        toast.error('Delete functionality not available');
        return false;
      } catch (error) {
        console.error(`Error deleting campaign update ${updateId}:`, error);
        toast.error(`Failed to delete campaign update: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      }
    },
  };
  
  return (
    <WowzaRushContext.Provider value={contextValue}>
      {children}
    </WowzaRushContext.Provider>
  );
}

// Export the hook
export const useWowzaRush = () => {
  const context = useContext(WowzaRushContext);
  if (!context) {
    throw new Error('useWowzaRush must be used within a WowzaRushProvider');
  }
  return context;
};

// Keep the old name as an alias for backward compatibility
export const useWowzaRushContext = useWowzaRush;

export default WowzaRushContext;

