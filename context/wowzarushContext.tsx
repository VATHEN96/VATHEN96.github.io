import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { useAddress } from '@thirdweb-dev/react';

interface Milestone {
    title: string;
    description: string;
    deadline: Date;
    amount: number;
    completed: boolean;
}

interface Campaign {
    id: string;
    creator: string;
    title: string;
    description: string;
    goalAmount: number;
    totalFunded: number;
    deadline: Date;
    category: string;
    beneficiaries: string[];
    proofOfWork: string;
    collateral: number;
    multimedia: string[];
    isActive: boolean;
    createdAt: Date;
    duration: number;
    milestones: Milestone[];
}

interface WowzarushContextType {
    address: string | undefined;
    contract: any;
    createCampaign: (form: any) => Promise<void>;
    getCampaigns: () => Promise<Campaign[]>;
    getUserCampaigns: () => Promise<Campaign[]>;
    donate: (pId: string, amount: number) => Promise<void>;
    getDonations: (pId: string) => Promise<any[]>;
}

const WowzarushContext = createContext<WowzarushContextType>({
    address: undefined,
    contract: null,
    createCampaign: async () => { },
    getCampaigns: async () => [],
    getUserCampaigns: async () => [],
    donate: async () => { },
    getDonations: async () => [],
});

export const useWowzarushContext = () => useContext(WowzarushContext);

export const WowzarushContextProvider = ({ children }: { children: React.ReactNode }) => {
    const { contract } = useContract("YOUR_CONTRACT_ADDRESS");
    const address = useAddress();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

    const createCampaign = async (form: any) => {
        try {
            const data = await contract.call('createCampaign', [
                address,
                form.title,
                form.description,
                form.goalAmount,
                new Date(form.deadline).getTime(),
                form.category,
                form.beneficiaries,
                form.proofOfWork,
                form.collateral,
                form.multimedia,
                form.milestones.map((milestone: Milestone) => ({
                    ...milestone,
                    deadline: new Date(milestone.deadline).getTime(),
                })),
            ]);

            console.log("Contract call success", data);
        } catch (error) {
            console.log("Contract call failure", error);
        }
    };

    const getCampaigns = async () => {
        try {
            const campaigns = await contract.call('getCampaigns');

            const parsedCampaigns: Campaign[] = campaigns.map((campaign: any) => ({
                id: campaign.id.toString(),
                creator: campaign.creator,
                title: campaign.title,
                description: campaign.description,
                goalAmount: Number(campaign.goalAmount),
                totalFunded: Number(campaign.totalFunded),
                deadline: new Date(campaign.deadline.toNumber()),
                category: campaign.category,
                beneficiaries: campaign.beneficiaries,
                proofOfWork: campaign.proofOfWork,
                collateral: Number(campaign.collateral),
                multimedia: campaign.multimedia,
                isActive: campaign.isActive,
                createdAt: new Date(campaign.createdAt.toNumber()),
                duration: Number(campaign.duration),
                milestones: campaign.milestones.map((milestone: any) => ({
                    title: milestone.title,
                    description: milestone.description,
                    deadline: new Date(milestone.deadline.toNumber()),
                    amount: Number(milestone.amount),
                    completed: milestone.completed,
                })),
            }));

            return parsedCampaigns;
        } catch (error) {
            console.log("Contract call failure", error);
            return [];
        }
    };

    const getUserCampaigns = async () => {
        try {
            const allCampaigns = await getCampaigns();
            const filteredCampaigns = allCampaigns.filter((campaign) =>
                campaign.creator === address
            );

            return filteredCampaigns;
        } catch (error) {
            console.log("Contract call failure", error);
            return [];
        }
    };

    const donate = async (pId: string, amount: number) => {
        try {
            const data = await contract.call('donateToCampaign', [pId], {
                value: ethers.utils.parseEther(amount.toString())
            });

            return data;
        } catch (error) {
            console.log("Contract call failure", error);
        }
    };

    const getDonations = async (pId: string) => {
        try {
            const donations = await contract.call('getDonators', [pId]);
            const numberOfDonations = donations[0].length;

            const parsedDonations = [];

            for (let i = 0; i < numberOfDonations; i++) {
                parsedDonations.push({
                    donator: donations[0][i],
                    donation: ethers.utils.formatEther(donations[1][i].toString())
                });
            }

            return parsedDonations;
        } catch (error) {
            console.log("Contract call failure", error);
            return [];
        }
    };

    return (
        <WowzarushContext.Provider value={{
            address,
            contract,
            createCampaign,
            getCampaigns,
            getUserCampaigns,
            donate,
            getDonations,
        }}>
            {children}
        </WowzarushContext.Provider>
    );
};

export default WowzarushContext;