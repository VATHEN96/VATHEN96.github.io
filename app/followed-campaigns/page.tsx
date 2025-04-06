"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWowzaRush } from "@/context/wowzarushContext";
import Navbar from "@/components/navbar";
import CampaignCard from "@/components/CampaignCard";
import { RefreshCw, AlertTriangle, ArrowLeft, Wallet } from "lucide-react";

export default function FollowedCampaignsPage() {
  const { 
    blockchainService, 
    isWalletConnected, 
    connectWallet 
  } = useWowzaRush();
  const [followedCampaigns, setFollowedCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isWalletConnected) {
      fetchFollowedCampaigns();
    } else {
      setLoading(false);
    }
  }, [isWalletConnected]);

  const fetchFollowedCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the user's wallet address
      const userAddress = await blockchainService.getUserAddress();
      
      if (!userAddress) {
        setError("No wallet address found. Please connect your wallet.");
        setLoading(false);
        return;
      }
      
      // Get campaigns the user has donated to
      // This would ideally come from the contract, but for now we'll use a placeholder
      // implementation that simulates the functionality
      const donatedCampaignIds = await getDonatedCampaignIds(userAddress);
      
      // Fetch each campaign by ID
      const campaigns = [];
      
      for (const id of donatedCampaignIds) {
        try {
          const campaign = await blockchainService.getCampaign(id);
          if (campaign) {
            campaigns.push(campaign);
          }
        } catch (err) {
          console.warn(`Failed to fetch campaign ID ${id}:`, err);
          // Continue with next campaign
        }
      }
      
      setFollowedCampaigns(campaigns);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching followed campaigns:", error);
      setError("Failed to load your followed campaigns. Please try again.");
      setLoading(false);
    }
  };

  // This is a temporary placeholder function until the contract implements this functionality
  // In a real implementation, this would call the contract method to get campaigns the user has donated to
  const getDonatedCampaignIds = async (userAddress: string): Promise<number[]> => {
    // For the prototype, return a static list of campaign IDs
    // In the real implementation, this would come from the contract
    return [1, 3, 5]; // Example IDs of campaigns the user has donated to
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleRetry = () => {
    fetchFollowedCampaigns();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Back button and header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-black dark:text-white">
            Followed Campaigns
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Campaigns you've contributed to or are following
          </p>
        </div>
        
        {/* Not connected state */}
        {!isWalletConnected && (
          <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-8 rounded-lg text-center mb-8">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-black dark:text-white" />
            <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              Connect your wallet to see campaigns you've contributed to or are following
            </p>
            <button
              onClick={handleConnect}
              className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-md transition-all dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Connect Wallet
            </button>
          </div>
        )}
        
        {/* Loading State */}
        {isWalletConnected && loading && (
          <div className="w-full py-12 flex flex-col items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <RefreshCw className="h-12 w-12 text-gray-500 animate-spin mb-4" />
              <p className="text-black dark:text-white text-lg font-medium">
                Loading your followed campaigns...
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Fetching campaigns you've contributed to from the blockchain
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {isWalletConnected && !loading && error && (
          <div className="bg-white border-2 border-red-500 text-black p-6 rounded-lg mb-6 dark:bg-black dark:text-white">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-500 mb-2">Error</h3>
                <p className="mb-4">{error}</p>
                <button 
                  onClick={handleRetry}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-all flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Campaigns Found */}
        {isWalletConnected && !loading && !error && followedCampaigns.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-black dark:text-white text-lg font-medium mb-2">
              No followed campaigns found
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You haven't contributed to or followed any campaigns yet
            </p>
            <Link
              href="/highlighted"
              className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md transition-all dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Discover Campaigns
            </Link>
          </div>
        )}

        {/* Campaigns Grid */}
        {isWalletConnected && !loading && !error && followedCampaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followedCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 