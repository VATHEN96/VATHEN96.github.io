"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { ethers } from "ethers";
import type {
  Campaign,
  Milestone,
  wowzarushContextType,
} from "../utils/contextInterfaces";
import { contractABI, contractAddress, chainIdHex } from "@/utils/constants";
import { switchNetwork } from "@/utils/addCurrentNetwork";

const defaultContextValue: wowzarushContextType = {
  isConnected: false,
  connectedAccount: null,
  accountBalance: 0,
  campaigns: [],
  userCampaigns: [],
  loading: false,
  error: null,
  createCampaign: async () => {},
  contributeToCampaign: async () => {},
  withdrawFromCampaign: async () => {},
  completeMilestone: async () => {},
  updateMilestone: async () => {},
  connectWallet: async () => {},
  disconnectWallet: async () => Promise.resolve(),
  fetchCampaigns: async () => Promise.resolve([]),
  getCampaignById: async () => Promise.resolve<Campaign | null>(null),
  getCampaign: () => undefined as Campaign | undefined,
  getUserContributions: async () => Promise.resolve([]),
};

const WowzarushContext = createContext<wowzarushContextType>(defaultContextValue);

export const WowzarushProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: Get provider and signer
  const getProviderAndSigner = useCallback(async () => {
    try {
      if (typeof window === "undefined") {
        throw new Error("Browser environment is required");
      }

      const ethereum = window.ethereum;
      if (!ethereum) {
        throw new Error("No Ethereum provider found. Please install MetaMask or use Brave Browser.");
      }

      // Check if using Brave Wallet
      const isBraveWallet = ethereum.isBraveWallet;
      console.log(`Using ${isBraveWallet ? 'Brave' : 'MetaMask'} wallet`);

      // Ensure we're on the correct network
      const currentChainId = await ethereum.request({ method: "eth_chainId" });
      if (currentChainId !== chainIdHex) {
        await switchNetwork(chainIdHex);
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      try {
        await ethereum.request({ method: "eth_requestAccounts" });
      } catch (requestError: any) {
        if (requestError.code === 4001) {
          throw new Error("Please connect your wallet to continue. You can try again by clicking the 'Connect Wallet' button.");
        }
        throw new Error("Failed to connect to MetaMask. Please try again.");
      }

      // Verify network connection
      try {
        await provider.getNetwork();
      } catch (networkError) {
        throw new Error("Unable to connect to the Telos network. Please check your network connection and try again.");
      }

      const signer = provider.getSigner();
      return { provider, signer };
    } catch (error: any) {
      console.error("Error getting provider and signer:", error);
      throw error;
    }
  }, []);

  // Helper: Get contract instance
  const getContract = useCallback(async () => {
    const { signer } = await getProviderAndSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
  }, [getProviderAndSigner]);

  // Helper: Parse campaign data from blockchain format
  const parseCampaign = useCallback((campaign: any): Campaign => ({
    id: campaign.id.toString(),
    creator: campaign.creator,
    title: campaign.title,
    description: campaign.description,
    goalAmount: Number(ethers.utils.formatEther(campaign.goalAmount)),
    totalFunded: Number(ethers.utils.formatEther(campaign.totalFunded)),
    deadline: new Date(campaign.deadline.toNumber() * 1000),
    milestones: campaign.milestones?.map((ms: any, index: number): Milestone => ({
      id: ms.id?.toString() || `milestone-${index}`,
      name: ms.name,
      target: Number(ethers.utils.formatEther(ms.target)),
      completed: ms.completed,
      dueDate: ms.dueDate ? new Date(ms.dueDate.toNumber() * 1000) : undefined,
    })) || [],
    category: campaign.category,
    beneficiaries: campaign.beneficiaries,
    proofOfWork: campaign.proofOfWork,
    collateral: campaign.collateral,
    multimedia: campaign.multimedia,
    isActive: campaign.isActive,
    createdAt: new Date(campaign.createdAt.toNumber() * 1000),
    duration: Number(campaign.duration),
  }), []);

  const fetchCampaigns = useCallback(async (): Promise<Campaign[]> => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure correct network and RPC access before fetching
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
          if (currentChainId !== chainIdHex) {
            await switchNetwork(chainIdHex);
            // Verify the network switch was successful
            const newChainId = await window.ethereum.request({ method: "eth_chainId" });
            if (newChainId !== chainIdHex) {
              throw new Error("Failed to switch to the Telos network. Please switch manually through your wallet.");
            }
          }
          
          // Verify RPC endpoint access
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          try {
            await provider.getNetwork();
          } catch (rpcError) {
            throw new Error("Unable to access RPC endpoint. Please check your network connection or try a different RPC endpoint.");
          }
        } catch (networkError: any) {
          throw new Error(networkError.message || "Failed to connect to the Telos network. Please check your wallet connection.");
        }
      }

      const contract = await getContract();
      const campaignIds = await contract.getCampaignsByRange(0, await contract.campaignCounter() - 1);
      const campaigns = await Promise.all(
        campaignIds.map(async (id: number) => {
          const metadata = await contract.getCampaignMetadata(id);
          const details = await contract.getCampaignDetails(id);
          const [donors, stakeholders] = await contract.getCampaignParticipants(id);
          
          // Fetch milestone data
          const milestones = [];
          for (let i = 0; i < metadata.milestones?.length || 0; i++) {
            const milestoneMetadata = await contract.getMilestoneMetadata(id, i);
            const [proofOfCompletion, fundsReleased] = await contract.getMilestoneProof(id, i);
            milestones.push({
              id: i.toString(),
              name: milestoneMetadata.name,
              target: Number(ethers.utils.formatEther(milestoneMetadata.targetAmount)),
              completed: milestoneMetadata.isCompleted,
              dueDate: undefined
            });
          }

          return {
            id: metadata.id.toString(),
            creator: metadata.creator,
            title: metadata.title,
            description: details.description,
            goalAmount: Number(ethers.utils.formatEther(metadata.goalAmount)),
            totalFunded: Number(ethers.utils.formatEther(metadata.totalFunded)),
            deadline: new Date(metadata.createdAt.toNumber() * 1000 + metadata.duration * 24 * 60 * 60 * 1000),
            milestones,
            category: metadata.category,
            beneficiaries: details.beneficiaries,
            proofOfWork: details.proofOfWork,
            collateral: "0",
            multimedia: details.media,
            isActive: metadata.isActive,
            createdAt: new Date(metadata.createdAt.toNumber() * 1000),
            duration: Number(metadata.duration)
          };
        })
      );
      
      setCampaigns(campaigns);
      return campaigns;
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      setError(error.message || "Failed to fetch campaigns. Please ensure you're connected to Telos network.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [getContract, parseCampaign]);

  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const { provider } = await getProviderAndSigner();
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) {
        throw new Error("No accounts found. Please connect your wallet.");
      }
      const account = accounts[0];
      setConnectedAccount(account);
      setIsConnected(true);
      const balance = await provider.getBalance(account);
      setAccountBalance(Number(ethers.utils.formatEther(balance)));
      const camps = await fetchCampaigns();
      if (account) {
        const userCamps = camps.filter(
          (camp) => camp.creator.toLowerCase() === account.toLowerCase()
        );
        setUserCampaigns(userCamps);
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      setError(error.message || "Failed to connect wallet");
      setIsConnected(false);
      setConnectedAccount(null);
      setAccountBalance(0);
    } finally {
      setLoading(false);
    }
  }, [fetchCampaigns, getProviderAndSigner]);

  const disconnectWallet = useCallback(async (): Promise<void> => {
    setConnectedAccount(null);
    setIsConnected(false);
    setAccountBalance(0);
    setCampaigns([]);
    setUserCampaigns([]);
    setError(null);
    return Promise.resolve();
  }, []);

  // Initialize wallet connection and fetch campaigns
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const { provider, signer } = await getProviderAndSigner();
        if (signer) {
          const address = await signer.getAddress();
          setConnectedAccount(address);
          setIsConnected(true);
          const balance = await provider.getBalance(address);
          setAccountBalance(Number(ethers.utils.formatEther(balance)));
          await fetchCampaigns();
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
        setConnectedAccount(null);
        setAccountBalance(0);
      }
    };

    if (typeof window !== "undefined" && window.ethereum) {
      initializeWallet();
    }
  }, [fetchCampaigns, getProviderAndSigner]);

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const eth = window.ethereum;
      const handleAccountsChanged = async (accounts: string[]) => {
        try {
          if (accounts.length === 0) {
            await disconnectWallet();
          } else if (accounts[0] !== connectedAccount) {
            await connectWallet();
          }
        } catch (error) {
          console.error("Error handling account change:", error);
          setError("Failed to handle account change");
        }
      };

      const handleChainChanged = () => {
        try {
          window.location.reload();
        } catch (error) {
          console.error("Error handling chain change:", error);
          setError("Failed to handle network change");
        }
      };

      eth?.on("accountsChanged", handleAccountsChanged);
      eth?.on("chainChanged", handleChainChanged);

      return () => {
        eth?.removeListener("accountsChanged", handleAccountsChanged);
        eth?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [connectedAccount, connectWallet, disconnectWallet]);

  const getCampaignById = useCallback(async (id: string): Promise<Campaign | null> => {
    try {
      setLoading(true);
      setError(null);
      const contract = await getContract();
      const campaignData = await contract.getCampaign(id);
      if (!campaignData) return null;
      return parseCampaign(campaignData);
    } catch (error: any) {
      setError(error.message || "Failed to fetch campaign");
      return null;
    } finally {
      setLoading(false);
    }
  }, [getContract, parseCampaign]);

  const getCampaign = useCallback((id: string): Campaign | undefined => {
    return campaigns.find(campaign => campaign.id === id);
  }, [campaigns]);

  const contextValue: wowzarushContextType = {
    isConnected,
    connectedAccount,
    accountBalance,
    campaigns,
    userCampaigns,
    loading,
    error,
    createCampaign: async () => {},
    contributeToCampaign: async () => {},
    withdrawFromCampaign: async () => {},
    completeMilestone: async () => {},
    updateMilestone: async () => {},
    connectWallet,
    disconnectWallet,
    fetchCampaigns,
    getCampaignById: (id: string) => getCampaignById(id),
    getCampaign: (id: string) => getCampaign(id),
    getUserContributions: async () => [],
  };

  return (
    <WowzarushContext.Provider value={contextValue}>
      {children}
    </WowzarushContext.Provider>
  );
};

export const useWowzarush = () => {
  const context = useContext(WowzarushContext);
  if (!context) {
    throw new Error("useWowzarush must be used within a WowzarushProvider");
  }
  return context;
};
