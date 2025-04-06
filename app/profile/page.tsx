'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import { useWowzaRush } from '@/context/wowzarushContext';
import { fetchUserCampaigns, fetchUserContributedCampaigns } from '@/services/userCampaigns';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  funds_raised: number;
  target: number;
  creator_address: string;
  end_date: number;
  image?: string;
}

export default function ProfilePage() {
  const { isWalletConnected, userAddress } = useWowzaRush();
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
  const [contributedCampaigns, setContributedCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (!isWalletConnected || !userAddress) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Load user's created campaigns
        const campaigns = await fetchUserCampaigns(userAddress);
        setUserCampaigns((campaigns || []) as unknown as Campaign[]);
        
        // Load campaigns user has contributed to
        const contributions = await fetchUserContributedCampaigns(userAddress);
        setContributedCampaigns((contributions || []) as unknown as Campaign[]);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [isWalletConnected, userAddress]);

  if (!isWalletConnected) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Please connect your wallet</h1>
          <p className="text-gray-600 mb-4">Connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading your profile...</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        {/* Wallet Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-2">Wallet Information</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
            <span className="font-semibold">Address:</span> {userAddress}
          </p>
        </div>

        {/* Created Campaigns */}
        <h2 className="text-2xl font-bold mb-4">Your Campaigns</h2>
        {isLoading ? (
          <p>Loading your campaigns...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {userCampaigns.length > 0 ? (
              userCampaigns.map((campaign: any) => (
                <Card key={campaign.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-0">
                    <CardTitle>{campaign.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{campaign.description || 'No description available'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2">
                      <div className="text-sm mb-2">
                        <span className="font-bold">Status:</span> {campaign.status || 'Pending'}
                      </div>
                      <div className="text-sm mb-2">
                        <span className="font-bold">Funds raised:</span> {campaign.funds_raised > 0 ? campaign.funds_raised : '0'} TLOS
                      </div>
                      <Link href={`/campaign/${campaign.id}`}>
                        <Button className="w-full">View Campaign</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-full">You haven't created any campaigns yet.</p>
            )}
            <Card className="overflow-hidden transition-shadow hover:shadow-lg flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <Link href="/create-campaign">
                  <Button variant="outline" className="gap-2">
                    <span>Create New Campaign</span>
                    <span>+</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contributed Campaigns */}
        <h2 className="text-2xl font-bold mb-4">Campaigns You've Backed</h2>
        {isLoading ? (
          <p>Loading backed campaigns...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contributedCampaigns.length > 0 ? (
              contributedCampaigns.map((campaign: any) => (
                <Card key={campaign.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-0">
                    <CardTitle>{campaign.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{campaign.description || 'No description available'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2">
                      <div className="text-sm mb-2">
                        <span className="font-bold">Status:</span> {campaign.status || 'Pending'}
                      </div>
                      <div className="text-sm mb-2">
                        <span className="font-bold">Funds raised:</span> {campaign.funds_raised > 0 ? campaign.funds_raised : '0'} TLOS
                      </div>
                      <Link href={`/campaign/${campaign.id}`}>
                        <Button className="w-full">View Campaign</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-full">You haven't backed any campaigns yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 