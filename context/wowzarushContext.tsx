"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ethers } from "ethers";
import type {
    Campaign,
    Milestone,
    wowzarushContextType,
    wowzarushProviderProps,
} from "@/utils/contextInterfaces";
import { chainIdHex, contractABI, contractAddress } from "@/utils/constants";
import { switchNetwork } from "@/utils/addCurrentNetwork";

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
    disconnectWallet: async () => { },
    fetchCampaigns: async () => [],
    getCampaignById: async () => null,
    getCampaign: () => undefined,
    getUserContributions: async () => [],
};

// Create Context
export const WowzarushContext = createContext<wowzarushContextType>(
    defaultContextValue
);

// Updated to PascalCase
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
    async function connectWallet() {
        if (typeof window.ethereum !== "undefined") {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await provider.listAccounts();

                if (accounts.length > 0) {
                    setConnectedAccount(accounts[0]);
                    setIsConnected(true);
                } else {
                    console.log("No accounts found");
                    setError("No accounts found. Please connect your wallet.");
                }
            } catch (error: any) {
                console.error("Error connecting wallet:", error);
                if (error.message) {
                    setError(error.message);
                } else {
                    setError("Failed to connect wallet");
                }
            }
        } else {
            console.error("No Ethereum provider found");
            setError("No Ethereum provider found. Please install MetaMask.");
        }
    }

    /**
     * Network Check and Switcher
     */
    async function checkNetwork() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        const expectedChainId = "0x1"; // Mainnet (Change this to your network's chain ID)

        if (network.chainId !== parseInt(expectedChainId, 16)) {
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: expectedChainId }],
                });
            } catch (switchError) {
                console.error("Failed to switch network:", switchError);
            }
        }
    }

    /**
     * Fetches all campaigns from the smart contract
     */
    async function fetchCampaigns(): Promise<Campaign[]> {
        try {
            setLoading(true);

            // Check if Ethereum provider is available
            if (typeof window.ethereum !== "undefined") {
                const provider = new ethers.providers.Web3Provider(window.ethereum);

                // Request account access if necessary
                await window.ethereum.request({ method: "eth_requestAccounts" });

                const signer = provider.getSigner();
                const contract = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                );

                // Ensure the network is correct
                await checkNetwork();

                // Call the contract function
                const campaignCounter = await contract.campaignCounter();
                console.log("Campaign Counter:", campaignCounter.toString());

                // If no campaigns are found, return an empty array
                if (Number(campaignCounter) === 0) {
                    console.log("No campaigns found.");
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
                console.error("No Ethereum provider found");
                setError("No Ethereum provider found. Please install MetaMask.");
                return [];
            }
        } catch (err: any) {
            console.error("Error fetching campaigns:", err);
            setError(err.reason || err.message || "Failed to fetch campaigns");
            return [];
        } finally {
            setLoading(false);
        }
    }

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
                createCampaign: async () => { },
                connectWallet,
                fetchCampaigns,
            }}
        >
            {children}
        </WowzarushContext.Provider>
    );
};

// Correctly exported hook
export const useWowzarush = () => useContext(WowzarushContext);
