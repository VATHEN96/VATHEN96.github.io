"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWowzaRush } from "@/context/wowzarushContext";
import Navbar from "@/components/navbar";
import { Search } from "lucide-react";
import extractNumericId from "@/utils/extractNumericId";

export default function CampaignsPage() {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState<string>("");
  const [searchError, setSearchError] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Handle direct campaign ID search
  const handleIdSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setIsSearching(true);
    
    const inputId = campaignId.trim();
    
    if (!inputId) {
      setSearchError("Please enter a campaign ID");
      setIsSearching(false);
      return;
    }
    
    // Special case for formatted Campaign 0 IDs
    if (inputId.match(/camp-0-[\w-]+/i)) {
      router.push("/campaign/0?formatted=true");
      return;
    }
    
    // Handle numeric input
    if (/^\d+$/.test(inputId)) {
      router.push(`/campaign/${inputId}`);
      return;
    }
    
    // Handle CAMP-X-... format by extracting the numeric portion
    const campMatch = inputId.match(/camp-(\d+)/i);
    if (campMatch && campMatch[1]) {
      router.push(`/campaign/${campMatch[1]}`);
      return;
    }
    
    // Last resort, try to extract any numeric ID
    try {
      const numericId = extractNumericId(inputId);
      if (numericId !== null) {
        router.push(`/campaign/${numericId}`);
        return;
      }
      
      setSearchError("Unable to process this ID format. Please enter a numeric ID or formatted ID");
      setIsSearching(false);
    } catch (err) {
      setSearchError("An error occurred processing the campaign ID");
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Campaign ID search section */}
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center text-black dark:text-white">Find Campaign by ID</h2>
          <form onSubmit={handleIdSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Enter Campaign ID (e.g., 0 or CAMP-0-046394-ea31cd)"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black dark:border-white rounded-md focus:outline-none focus:ring-2 ring-black dark:ring-white transition-colors bg-white text-black dark:bg-black dark:text-white"
            />
            <button
              type="submit"
              className="mt-4 w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-md transition-all dark:bg-white dark:text-black dark:hover:bg-gray-200"
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Find Campaign'}
            </button>
          </form>
          {searchError && (
            <p className="mt-2 text-red-500 text-sm">{searchError}</p>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Looking for investment opportunities or want to support a cause? 
              The WowzaRush platform supports both donation and investment campaigns.
            </p>
            <a
              href="/create-campaign"
              className="inline-block bg-white hover:bg-gray-100 text-black font-bold border-2 border-black dark:border-white py-2 px-6 rounded-md transition-all dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              Create Campaign
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
