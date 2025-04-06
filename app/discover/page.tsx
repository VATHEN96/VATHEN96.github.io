"use client";

import { useState, useEffect } from "react";
import { useWowzaRush } from "@/context/wowzarushContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/navbar";
import CampaignCard from "@/app/components/CampaignCard";
import CampaignSearchById from "@/app/campaign/[id]/searchByIdForm";
import { BookmarkIcon, TrendingUp, Search, Loader2 } from "lucide-react";

export default function DiscoverPage() {
  const { blockchainService, account } = useWowzaRush();
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [followedCampaigns, setFollowedCampaigns] = useState<any[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (blockchainService) {
      fetchCampaigns();
    }
  }, [blockchainService]);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all campaigns
      const campaigns = await blockchainService.getAllCampaigns();
      setAllCampaigns(campaigns);

      // Sort campaigns by funding percentage to find top campaigns
      const sorted = [...campaigns].sort((a, b) => {
        const percentA = (parseFloat(a.amountCollected) / parseFloat(a.target)) * 100;
        const percentB = (parseFloat(b.amountCollected) / parseFloat(b.target)) * 100;
        return percentB - percentA;
      });

      // Take top 10 campaigns
      setTopCampaigns(sorted.slice(0, 10));

      // For now, we'll simulate followed campaigns with random selection
      // In a real app, this would come from user preferences stored in a database
      if (campaigns.length > 0) {
        const randomIndices = new Set<number>();
        while (randomIndices.size < Math.min(5, campaigns.length)) {
          randomIndices.add(Math.floor(Math.random() * campaigns.length));
        }
        const followed = Array.from(randomIndices).map(index => campaigns[index]);
        setFollowedCampaigns(followed);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setError("Failed to load campaigns. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-6">
          Discover Campaigns
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Explore crowdfunding campaigns on Telos blockchain. Support innovative projects, 
              follow campaigns you're interested in, or find specific campaigns by ID.
            </p>
          </div>
          <div className="md:col-span-1">
            <CampaignSearchById />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-black dark:text-white text-lg">Loading campaigns...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p>{error}</p>
            <button
              onClick={fetchCampaigns}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>All Campaigns</span>
              </TabsTrigger>
              <TabsTrigger value="followed" className="flex items-center gap-2">
                <BookmarkIcon className="h-4 w-4" />
                <span>Followed</span>
              </TabsTrigger>
              <TabsTrigger value="top" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Top Campaigns</span>
              </TabsTrigger>
            </TabsList>

            {/* All Campaigns Tab */}
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allCampaigns.length > 0 ? (
                  allCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      id={campaign.id}
                      title={campaign.title}
                      description={campaign.description}
                      target={campaign.target}
                      deadline={campaign.deadline}
                      amountCollected={campaign.amountCollected}
                      image={campaign.image}
                      owner={campaign.owner}
                      category={campaign.category}
                      donators={campaign.donators}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No campaigns found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Followed Campaigns Tab */}
            <TabsContent value="followed">
              {account ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {followedCampaigns.length > 0 ? (
                    followedCampaigns.map((campaign) => (
                      <CampaignCard
                        key={campaign.id}
                        id={campaign.id}
                        title={campaign.title}
                        description={campaign.description}
                        target={campaign.target}
                        deadline={campaign.deadline}
                        amountCollected={campaign.amountCollected}
                        image={campaign.image}
                        owner={campaign.owner}
                        category={campaign.category}
                        donators={campaign.donators}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">
                        You haven't followed any campaigns yet
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <BookmarkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                    Connect your wallet to see followed campaigns
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    You'll need to connect your wallet to follow campaigns and see your personalized list
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Top Campaigns Tab */}
            <TabsContent value="top">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topCampaigns.length > 0 ? (
                  topCampaigns.map((campaign, index) => (
                    <div key={campaign.id} className="relative">
                      {index < 3 && (
                        <div className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-black">
                          #{index + 1}
                        </div>
                      )}
                      <CampaignCard
                        id={campaign.id}
                        title={campaign.title}
                        description={campaign.description}
                        target={campaign.target}
                        deadline={campaign.deadline}
                        amountCollected={campaign.amountCollected}
                        image={campaign.image}
                        owner={campaign.owner}
                        category={campaign.category}
                        donators={campaign.donators}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No top campaigns available</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
} 