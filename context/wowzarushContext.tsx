"use client";

import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
} from "react";
import { ethers } from "ethers";
import type {
    Campaign,
    Milestone,
    wowzarushContextType,
} from "@/utils/contextInterfaces";
import { contractABI, contractAddress } from "@/utils/constants";

// Default context value with empty implementations
const defaultContextValue: wowzarushContextType = {
    isConnected: false,
    connectedAccount: null,
    accountBalance: 0,
    campaigns: [],
    userCampaigns: [],
    loading: false,
    error: null,
    createCampaign: async () => { },
    contributeToCampaign: async () => { },
    withdrawFromCampaign: async () => { },
    completeMilestone: async () => { },
    updateMilestone: async () => { },
    connectWallet: async () => { },
    disconnectWallet: async () => Promise.resolve(),
    fetchCampaigns: async () => [],
    getCampaignById: async () => null,
    getCampaign: () => undefined,
    getUserContributions: async () => [],
};

// Create Context
const WowzarushContext = createContext<wowzarushContextType>(
    defaultContextValue
);

export const WowzarushProvider = ({ children }: { children: ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
    const [accountBalance, setAccountBalance] = useState<number>(0);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Connects the user's wallet using MetaMask
     */
    const connectWallet = useCallback(async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await provider.listAccounts();

                if (accounts.length > 0) {
                    setConnectedAccount(accounts[0]);
                    setIsConnected(true);

                    // Fetch Account Balance
                    const balance = await provider.getBalance(accounts[0]);
                    setAccountBalance(Number(ethers.utils.formatEther(balance)));
                } else {
                    setError("No accounts found. Please connect your wallet.");
                }
            } catch (error: any) {
                setError(error.message || "Failed to connect wallet");
            }
        } else {
            setError("No Ethereum provider found. Please install MetaMask.");
        }
    }, []);

    /**
     * Disconnects the user's wallet
     */
    const disconnectWallet = useCallback(async (): Promise<void> => {
        setConnectedAccount(null);
        setIsConnected(false);
        setAccountBalance(0);
        return Promise.resolve();
    }, []);

    /**
     * Placeholder for Required Functions
     */
    const createCampaign = async () => {
        console.warn("createCampaign function not implemented yet.");
    };

    const contributeToCampaign = async () => {
        console.warn("contributeToCampaign function not implemented yet.");
    };

    const withdrawFromCampaign = async () => {
        console.warn("withdrawFromCampaign function not implemented yet.");
    };

    const completeMilestone = async () => {
        console.warn("completeMilestone function not implemented yet.");
    };

    const updateMilestone = async () => {
        console.warn("updateMilestone function not implemented yet.");
    };

    const getUserContributions = async () => {
        console.warn("getUserContributions function not implemented yet.");
        return [];
    };

    /**
     * Fetches all campaigns from the smart contract
     */
    const fetchCampaigns = useCallback(async (): Promise<Campaign[]> => {
        setLoading(true);
        try {
            if (typeof window.ethereum !== "undefined") {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await window.ethereum.request({ method: "eth_requestAccounts" });

                const signer = provider.getSigner();
                const contract = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                );

                const campaignCounter = await contract.campaignCounter();

                if (Number(campaignCounter) === 0) {
                    setCampaigns([]);
                    return [];
                }

                const campaignPromises = [];
                for (let i = 0; i < Number(campaignCounter); i++) {
                    campaignPromises.push(contract.getCampaignMetadata(i));
                }

                const rawCampaigns = await Promise.all(campaignPromises);
                const parsedCampaigns: Campaign[] = rawCampaigns.map(
                    (campaign: any) => ({
                        id: campaign.id.toString(),
                        creator: campaign.creator,
                        title: campaign.title,
                        description: campaign.description,
                        goalAmount: Number(ethers.utils.formatEther(campaign.goalAmount)),
                        totalFunded: Number(ethers.utils.formatEther(campaign.totalFunded)),
                        deadline: new Date(campaign.deadline.toNumber() * 1000),
                        milestones: campaign.milestones.map(
                            (ms: any, index: number): Milestone => ({
                                id: ms.id ? ms.id.toString() : `milestone-${index}`,
                                name: ms.name,
                                target: Number(ethers.utils.formatEther(ms.target)),
                                completed: ms.completed,
                                dueDate: ms.dueDate
                                    ? new Date(ms.dueDate.toNumber() * 1000)
                                    : undefined,
                            })
                        ),
                        category: campaign.category,
                        beneficiaries: campaign.beneficiaries,
                        proofOfWork: campaign.proofOfWork,
                        collateral: campaign.collateral,
                        multimedia: campaign.multimedia,
                        isActive: campaign.isActive,
                        createdAt: new Date(campaign.createdAt),
                        duration: Number(campaign.duration),
                    })
                );
                setCampaigns(parsedCampaigns);
                return parsedCampaigns;
            } else {
                setError("No Ethereum provider found. Please install MetaMask.");
                return [];
            }
        } catch (err: any) {
            setError(err.reason || err.message || "Failed to fetch campaigns");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Global Context Value
     */
    return (
        <WowzarushContext.Provider
            value={{
                isConnected,
                connectedAccount,
                accountBalance,
                campaigns,
                userCampaigns,
                loading,
                error,
                createCampaign,
                contributeToCampaign,
                withdrawFromCampaign,
                completeMilestone,
                updateMilestone,
                connectWallet,
                disconnectWallet,
                fetchCampaigns,
                getUserContributions
            }}
        >
            {children}
        </WowzarushContext.Provider>
    );
};

// Correctly exported hook
export const useWowzarush = () => useContext(WowzarushContext);
