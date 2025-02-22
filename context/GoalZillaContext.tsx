"use client"

import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";
import type {
    Campaign,
    Milestone,
    GoalZillaContextType,
    GoalZillaProviderProps,
} from "@/utils/contextInterfaces";
import { chainIdHex, contractABI, contractAddress } from "@/utils/constants";
import { switchNetwork } from "@/utils/addCurrentNetwork";

// Default context value with empty implementations
const defaultContextValue: GoalZillaContextType = {
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

export const GoalZillaContext = createContext<GoalZillaContextType>(
    defaultContextValue
);

export const GoalZillaProvider: React.FC<GoalZillaProviderProps> = ({
    children,
}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
    const [accountBalance, setAccountBalance] = useState<number>(0);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function connectWallet() {
        // Your wallet connection logic here...
    }

    // Updated createCampaign function with the correct parameter type.
    const createCampaign = async (
        campaignData: Omit<Campaign, "id" | "totalFunded">
    ): Promise<void> => {
        // Your create campaign logic here...
    };

    async function fetchCampaigns(): Promise<Campaign[]> {
        try {
            setLoading(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );

            const campaignCounter = await contract.campaignCounter();
            const campaignPromises = [];
            for (let i = 0; i < Number(campaignCounter); i++) {
                campaignPromises.push(contract.getCampaignMetadata(i));
            }
            const rawCampaigns = await Promise.all(campaignPromises);
            const parsedCampaigns: Campaign[] = rawCampaigns.map((campaign: any) => ({
                id: campaign.id.toString(),
                creator: campaign.creator,
                title: campaign.title,
                description: campaign.description,
                goalAmount: Number(ethers.utils.formatEther(campaign.goalAmount)),
                totalFunded: Number(ethers.utils.formatEther(campaign.totalFunded)),
                deadline: new Date(campaign.deadline.toNumber() * 1000),
                milestones: campaign.milestones.map((ms: any, index: number): Milestone => ({
                    id: ms.id ? ms.id.toString() : `milestone-${index}`,
                    name: ms.name,
                    target: Number(ethers.utils.formatEther(ms.target)),
                    completed: ms.completed,
                    dueDate: ms.dueDate ? new Date(ms.dueDate.toNumber() * 1000) : undefined,
                })),
                category: campaign.category,
                beneficiaries: campaign.beneficiaries,
                proofOfWork: campaign.proofOfWork,
                collateral: campaign.collateral,
                multimedia: campaign.multimedia, // Adjust conversion if necessary
                isActive: campaign.isActive,
                createdAt: new Date(campaign.createdAt),
                duration: Number(campaign.duration),
            }));
            setCampaigns(parsedCampaigns);
            if (connectedAccount) {
                const userCamps = parsedCampaigns.filter(
                    (camp) => camp.creator.toLowerCase() === connectedAccount.toLowerCase()
                );
                setUserCampaigns(userCamps);
            }
            return parsedCampaigns;
        } catch (err) {
            console.error(err);
            setError("Failed to fetch campaigns");
            return [];
        } finally {
            setLoading(false);
        }
    }

    async function getCampaignById(id: string): Promise<Campaign | null> {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );
            const campaign = await contract.getCampaignMetadata(id);
            const parsedCampaign: Campaign = {
                id: campaign.id.toString(),
                creator: campaign.creator,
                title: campaign.title,
                description: campaign.description,
                goalAmount: Number(ethers.utils.formatEther(campaign.goalAmount)),
                totalFunded: Number(ethers.utils.formatEther(campaign.totalFunded)),
                deadline: new Date(campaign.deadline.toNumber() * 1000),
                milestones: campaign.milestones.map((ms: any, index: number): Milestone => ({
                    id: ms.id ? ms.id.toString() : `milestone-${index}`,
                    name: ms.name,
                    target: Number(ethers.utils.formatEther(ms.target)),
                    completed: ms.completed,
                    dueDate: ms.dueDate ? new Date(ms.dueDate.toNumber() * 1000) : undefined,
                })),
                category: campaign.category,
                beneficiaries: campaign.beneficiaries,
                proofOfWork: campaign.proofOfWork,
                collateral: campaign.collateral,
                multimedia: campaign.multimedia,
                isActive: campaign.isActive,
                createdAt: new Date(campaign.createdAt),
                duration: Number(campaign.duration),
            };
            return parsedCampaign;
        } catch (err) {
            console.error(err);
            setError("Failed to fetch campaign details");
            return null;
        }
    }

    function getCampaign() {
        return undefined;
    }

    async function contributeToCampaign(campaignId: string, amount: number) {
        // Placeholder implementation
    }

    async function withdrawFromCampaign(campaignId: string, amount: number) {
        // Placeholder implementation
    }

    async function completeMilestone(campaignId: string, milestoneId: string) {
        // Placeholder implementation
    }

    async function updateMilestone(campaignId: string, milestoneId: string, updates: Partial<Milestone>) {
        // Placeholder implementation
    }

    async function getUserContributions(address: string) {
        // Placeholder implementation
        return [];
    }

    return (
        <GoalZillaContext.Provider
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
                disconnectWallet: async () => { },
                fetchCampaigns,
                getCampaignById,
                getCampaign,
                getUserContributions,
            }}
        >
            {children}
        </GoalZillaContext.Provider>
    );
};

export const useGoalZilla = () => useContext(GoalZillaContext);
