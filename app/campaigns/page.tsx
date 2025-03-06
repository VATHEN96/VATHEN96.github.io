"use client";

import { useState, useEffect } from "react";
import { useWowzaRush } from "@/context/wowzarushContext";
import Navbar from "@/components/navbar";
import CampaignCard from "@/components/CampaignCard";
import { Search, RefreshCw } from "lucide-react";

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { fetchCampaigns, campaigns, loading, error } = useWowzaRush();

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchCampaigns(true);
  };

  // Filter campaigns by title or description
  const filteredCampaigns = campaigns?.filter((campaign) =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Heading and Create Campaign button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white">Explore Campaigns</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleRefresh}
              className="bg-black hover:bg-gray-800 text-white font-bold border-2 border-black dark:border-white py-2 px-4 rounded-md transition-all flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <a
              href="/create-campaign"
              className="bg-white hover:bg-gray-100 text-black font-bold border-2 border-black dark:border-white py-2 px-4 rounded-md transition-all dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              Create Campaign
            </a>
          </div>
        </div>

        {/* Large Search Bar with Icon */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black dark:text-white" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full
              pl-12
              pr-4
              py-3
              border-2
              border-black
              dark:border-white
              text-lg
              focus:outline-none
              focus:ring-2
              ring-black
              dark:ring-white
              rounded-md
              transition-colors
              bg-white
              text-black
              dark:bg-black
              dark:text-white
            "
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-white border-2 border-black text-black p-4 rounded-lg mb-6 dark:bg-black dark:text-white">
            <p>Error: {error}</p>
          </div>
        )}

        {/* No Campaigns Found */}
        {!loading && !error && filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-black dark:text-white">No campaigns found</p>
          </div>
        )}

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </main>
    </div>
  );
}
