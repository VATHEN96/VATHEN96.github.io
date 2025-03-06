'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWowzaRush } from '@/context/wowzarushContext';
import Navbar from '@/components/navbar';
import CampaignCard from '@/components/CampaignCard';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ContributedCampaignsPage() {
  const router = useRouter();
  const { 
    isWalletConnected, 
    connectWallet, 
    userContributedCampaigns, 
    getUserContributedCampaigns, 
    loading 
  } = useWowzaRush();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch campaigns the user has contributed to
  useEffect(() => {
    const fetchContributedCampaigns = async () => {
      if (isWalletConnected) {
        try {
          await getUserContributedCampaigns();
        } catch (error) {
          console.error('Error fetching contributed campaigns:', error);
          toast.error('Failed to fetch campaigns you contributed to');
        }
      }
    };

    fetchContributedCampaigns();
  }, [isWalletConnected, getUserContributedCampaigns]);

  // Handle search
  const filteredCampaigns = userContributedCampaigns?.filter(campaign => 
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (campaign.category && campaign.category.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await getUserContributedCampaigns();
      toast.success('Campaigns refreshed');
    } catch (error) {
      console.error('Error refreshing campaigns:', error);
      toast.error('Failed to refresh campaigns');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-20 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Campaigns You've Contributed To</h1>
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
        
        {!isWalletConnected ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to see campaigns you've contributed to.
            </p>
            <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700">
              Connect Wallet
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 relative">
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-lg">Loading your contributed campaigns...</span>
              </div>
            ) : filteredCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onClick={() => router.push(`/campaign/${campaign.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">No Contributions Found</h2>
                <p className="text-gray-600 mb-6">
                  You haven't contributed to any campaigns yet, or we couldn't find your contributions.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
                    Refresh
                  </Button>
                  <Button 
                    onClick={() => router.push('/campaigns')} 
                    variant="outline"
                  >
                    Browse Campaigns
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 