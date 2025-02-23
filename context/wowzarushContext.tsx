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
     * Get a specific campaign by ID from the smart contract
     */
    const getCampaignById = useCallback(async (id: string) => {
        const allCampaigns = await fetchCampaigns();
        const campaign = allCampaigns.find(camp => camp.id === id);
        return campaign || null;
    }, []);

    /**
     * Get a specific campaign from state by ID
     */
    const getCampaign = useCallback((id: string) => {
        return campaigns.find(campaign => campaign.id === id);
    }, [campaigns]);

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
                createCampaign: async () => { },
                contributeToCampaign: async () => { },
                withdrawFromCampaign: async () => { },
                completeMilestone: async () => { },
                updateMilestone: async () => { },
                connectWallet,
                disconnectWallet,
                fetchCampaigns: async () => [],
                getCampaignById,
                getCampaign,
                getUserContributions: async () => [],
            }}
        >
            {children}
        </WowzarushContext.Provider>
    );
};

// Correctly exported hook
export const useWowzarush = () => useContext(WowzarushContext);
