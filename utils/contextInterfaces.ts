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
  id: string;
  name: string;
  target: number;
  completed: boolean;
  dueDate?: Date;
}

export interface Campaign {
  id: string;
  creator: string;
  title: string;
  description: string;
  goalAmount: number;
  totalFunded: number;
  deadline: Date;
  milestones: Milestone[];
  category: string;
  beneficiaries: string[];
  proofOfWork: string;
  collateral: string;
  multimedia: string;
  isActive: boolean;
  createdAt: Date;
  duration: number;
}

export interface wowzarushContextType {
  isConnected: boolean;
  connectedAccount: string | null;
  accountBalance: number;
  campaigns: Campaign[];
  userCampaigns: Campaign[];
  loading: boolean;
  error: string | null;
  createCampaign: (campaign: Campaign) => Promise<void>;
  contributeToCampaign: () => Promise<void>;
  withdrawFromCampaign: () => Promise<void>;
  completeMilestone: () => Promise<void>;
  updateMilestone: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  fetchCampaigns: () => Promise<Campaign[]>;
  getCampaignById: (id: string) => Promise<Campaign | null>;
  getCampaign: (id: string) => Campaign | undefined;
  getUserContributions: () => Promise<Campaign[]>;
}

// This file should only contain type definitions and interfaces
// Campaign page component should be moved to a pages/ or components/ directory
