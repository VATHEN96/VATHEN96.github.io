"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWowzaRush } from "@/context/wowzarushContext";
import CampaignCard from "@/components/CampaignCard";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface HighlightedCampaignsProps {
  limit?: number;
}

export default function HighlightedCampaigns({ limit }: HighlightedCampaignsProps) {
  const { blockchainService } = useWowzaRush();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchHighlightedCampaigns();
  }, []);

  const fetchHighlightedCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get a small list of predefined campaign IDs that are considered "highlighted"
      // These would normally come from a voting mechanism or curation process
      // For now, we'll use a hardcoded list of IDs known to exist on the blockchain
      const highlightedIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      // Fetch each campaign individually by ID
      const fetchedCampaigns = [];
      
      for (const id of highlightedIds) {
        try {
          const campaign = await blockchainService.getCampaign(id);
          if (campaign) {
            // Add the campaign ID to the returned object
            fetchedCampaigns.push({
              ...campaign,
              id // Ensure ID is included
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch campaign ID ${id}:`, err);
          // Continue with next campaign instead of failing the entire operation
        }
        
        // Stop if we've reached the limit
        if (limit && fetchedCampaigns.length >= limit) {
          break;
        }
      }
      
      // Sort campaigns by some popularity metric (using donations as a proxy for now)
      // You could replace this with vote count or other metrics in the future
      const sortedCampaigns = fetchedCampaigns.sort((a, b) => {
        const aAmount = parseFloat(a.amountCollected || '0');
        const bAmount = parseFloat(b.amountCollected || '0');
        return bAmount - aAmount; // Sort by highest amount collected
      });
      
      setCampaigns(sortedCampaigns);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching highlighted campaigns:", error);
      setError("Failed to load highlighted campaigns. Please try again.");
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchHighlightedCampaigns();
  };

  return (
    <div>
      {/* Loading State */}
      {loading && (
        <div className="w-full py-12 flex flex-col items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <RefreshCw className="h-12 w-12 text-gray-500 animate-spin mb-4" />
            <p className="text-black dark:text-white text-lg font-medium">
              Loading top campaigns...
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Fetching the most popular campaigns from the blockchain
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {!loading && error && (
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
      {!loading && !error && campaigns.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-black dark:text-white text-lg font-medium mb-2">No highlighted campaigns found</p>
          <p className="text-gray-500 dark:text-gray-400">
            There are no featured campaigns available right now.
          </p>
        </div>
      )}

      {/* Campaigns Grid */}
      {!loading && !error && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
} 