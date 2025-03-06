'use client'

export const runtime = 'edge';

import React, { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useWowzaRush } from '@/context/wowzarushContext'
import Link from 'next/link'
import NavBar from '@/components/navbar'
import type { Campaign as CampaignType } from "@/utils/contextInterfaces"
import { formatBlockchainValue, formatCategory, truncateAddress } from '@/utils/formatting'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ethers } from 'ethers'
import CopyableAddress from '@/components/CopyableAddress'
import MilestoneManagement from '@/app/components/MilestoneManagement'
import ShareButton from '@/components/ShareButton'

// Simple milestone interface for display purposes
interface SimpleMilestone {
  id?: string;
  name: string;
  target?: number;
  targetAmount?: string;
  completed?: boolean;
  isCompleted?: boolean;
  isUnderReview?: boolean;
  proofOfCompletion?: string;
}

// Extended campaign details interface to include our formatted values
interface CampaignDetails {
  formattedGoalAmount?: string;
  formattedTotalFunded?: string;
  formattedCategory?: string;
  formattedCreator?: string;
  deadline?: string;
  beneficiaries?: string;
  stakeholders?: string;
  isInvestment?: boolean;
  formattedEquityPercentage?: string;
  formattedMinInvestment?: string;
  estimatedValuation?: string;
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { id: campaignId } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { 
    getCampaignById, 
    loading, 
    error, 
    account,
    isWalletConnected,
    connectWallet
  } = useWowzaRush();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails>({});
  const [loadingState, setLoadingState] = useState(false);
  const [errorState, setErrorState] = useState('');

  // Calculate estimated valuation for investment campaigns
  const calculateValuation = (campaign: CampaignType): string => {
    if (campaign.campaignType !== "1" || !campaign.equityPercentage || !campaign.goalAmount) {
      return 'N/A';
    }
    
    // Convert equity percentage from basis points (e.g., 550 = 5.5%) to decimal (0.055)
    const equityDecimal = parseFloat(campaign.equityPercentage) / 10000;
    
    if (equityDecimal === 0) return 'N/A';
    
    // Calculate valuation: goalAmount / equityDecimal
    const goalAmountValue = parseFloat(campaign.goalAmount);
    const valuation = goalAmountValue / equityDecimal;
    
    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(valuation);
  };

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setLoadingState(true);
        if (getCampaignById && campaignId) {
          const fetchedCampaign = await getCampaignById(campaignId.toString());
          setCampaign(fetchedCampaign);
        }
        setLoadingState(false);
      } catch (err) {
        setErrorState(String(err));
        setLoadingState(false);
      }
    };

    fetchCampaignDetails();
  }, [campaignId, getCampaignById]);

  // Loading state
  if (loadingState) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
      </div>
    );
  }

  // Error state
  if (errorState || !campaign) {
    return (
      <div className="container mx-auto py-12">
        <NavBar />
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Error</h1>
          <p>{errorState || "Campaign not found"}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-[#FFFDF6]">
      <NavBar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Campaign header and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <Link href="/campaigns" className="inline-flex items-center text-blue-500 hover:text-blue-700 mb-4 sm:mb-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Link>
            <div className="flex space-x-2">
              <Button 
                onClick={() => router.push(`/fund-campaign/${campaignId}`)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {campaign?.campaignType === "1" ? "Invest Now" : "Support Now"}
              </Button>
              <ShareButton campaignId={campaignId} />
            </div>
          </div>
          
          {/* Campaign title and details */}
          <div className="bg-white p-6 rounded-lg border-2 border-black shadow-md mb-6">
            <h1 className="text-2xl font-bold mb-4">{campaign.title}</h1>
            <p className="text-gray-700 mb-4">{campaign.description}</p>
            
            {/* Investment details section */}
            {campaign.campaignType === "1" && (
              <div className="bg-blue-50 p-4 rounded-lg my-4 border border-blue-200">
                <h3 className="font-semibold text-lg mb-2">Investment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Equity Offered</p>
                    <p className="font-medium">{parseFloat(campaign.equityPercentage) / 100}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Minimum Investment</p>
                    <p className="font-medium">{formatBlockchainValue(campaign.minInvestment || "0")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valuation</p>
                    <p className="font-medium">{calculateValuation(campaign)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 