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

