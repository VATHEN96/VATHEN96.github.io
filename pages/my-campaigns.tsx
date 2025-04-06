import { useEffect, useState } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import ClientLayout from '@/components/ClientLayout';
import CampaignCard from '@/components/CampaignCard';
import { RefreshCw, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MyCampaigns() {
  const { fetchUserCampaigns, userCampaigns, loading, totalUserCampaigns } = useWowzaRush();
  const [page, setPage] = useState(1);
  const limit = 5;
  
  useEffect(() => {
    fetchUserCampaigns(true, 1, limit);
  }, []);
  
  const handleRefresh = () => {
    fetchUserCampaigns(true, 1, limit);
    setPage(1);
  };

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <div className="flex space-x-4">
            <Button onClick={handleRefresh} variant="outline" className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Link href="/create-campaign">
              <Button className="bg-primary text-white flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : userCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="text-gray-500 mb-4">No campaigns found</div>
                <p className="text-gray-600 max-w-md mx-auto">
                  You haven't created any campaigns yet. Click 'Create Campaign' to get started!
                </p>
                <Link href="/create-campaign">
                  <Button className="mt-4 bg-primary text-white px-6 py-3 flex items-center text-lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Campaign
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {!loading && totalUserCampaigns > page * limit && (
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={() => {
                  setPage(page + 1);
                  fetchUserCampaigns(false, page + 1, limit);
                }}
                variant="outline"
                className="px-6"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
} 