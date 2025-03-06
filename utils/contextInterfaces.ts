"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
// Helper: Calculate the number of days left until a campaign's deadline
const calculateDaysLeft = (deadline: Date | string): number => {
    const now = new Date();
    const endDate = new Date(deadline);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

export interface Milestone {
  name: string;
  targetAmount: string; // Changed to string for BigNumber compatibility
  isCompleted: boolean;
  isFunded: boolean;
  proofOfCompletion: string;
  fundsReleased: string; // Changed to string for BigNumber compatibility
  isUnderReview: boolean;
}

export interface Campaign {
  id: string; // Changed to string for BigNumber compatibility
  creator: string;
  title: string;
  description: string;
  category: string;
  goalAmount: string; // Changed to string for BigNumber compatibility
  totalFunded: string; // Changed to string for BigNumber compatibility
  duration: string; // Changed to string for BigNumber compatibility
  createdAt: string; // Changed to string for BigNumber compatibility
  isActive: boolean;
  media: string[];
  donors: string[];
  milestones: Milestone[];
  currentMilestone: string; // Changed to string for BigNumber compatibility
  proofOfWork: string;
  beneficiaries: string;
  stakeholders: string[];
  campaignType: string; // "0" for funding, "1" for investing
  // Investment specific fields
  equityPercentage?: string; // Percentage of equity offered to investors (basis points)
  minInvestment?: string;
  userInvestment?: string; // Current user's investment amount
  userEquityShare?: string; // Current user's equity share
}

export interface wowzarushContextType {
  isConnected: boolean;
  connectedAccount: string | null;
  accountBalance: number;
  campaigns: Campaign[];
  userCampaigns: any[] | null;
  userContributedCampaigns: any[] | null;
  loading: boolean;
  error: string | null;
  createCampaign: (title: string, description: string, category: string, goalAmount: number, duration: number, media: string[], milestones: Milestone[], beneficiaries: string, stakeholders: string[], campaignType: number, equityPercentage?: number, minInvestment?: number) => Promise<number>;
  donate: (campaignId: number, amount: number) => Promise<void>;
  invest: (campaignId: number, amount: number) => Promise<void>;
  submitMilestoneCompletion: (campaignId: number, milestoneIndex: number, proofOfCompletion: string) => Promise<void>;
  voteMilestone: (campaignId: number, milestoneIndex: number, isUpvote: boolean, message: string) => Promise<void>;
  releaseMilestoneFunds: (campaignId: number, milestoneIndex: number) => Promise<void>;
  getInvestmentDetails: (campaignId: number) => Promise<{investmentAmount: string, equityShare: string}>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  fetchCampaigns: () => Promise<Campaign[]>;
  fetchUserCampaigns: () => Promise<void>;
  getUserBackedCampaigns: (address?: string) => Promise<any[]>;
  getUserContributedCampaigns: (address?: string) => Promise<any[]>;
  getUserCampaigns: (address?: string) => Promise<any[]>;
  getCampaignById: (id: number) => Promise<Campaign | null>;
  getCampaign: (id: number) => Campaign | undefined;
  getUserContributions: () => Promise<Campaign[]>;
}

// This file should only contain type definitions and interfaces
// Campaign page component should be moved to a pages/ or components/ directory
