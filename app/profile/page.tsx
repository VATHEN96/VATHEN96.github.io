'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWowzaRush } from '@/context/wowzarushContext';
import Navbar from '@/components/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CampaignCard from '@/components/CampaignCard';
import { SafeUserProfile } from '@/components/SafeUserProfile';

export default function ProfilePage() {
  const router = useRouter();
  const { isWalletConnected, account, getCreatorProfile, userCampaigns, fetchUserCampaigns, userContributedCampaigns, getUserContributedCampaigns } = useWowzaRush();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<any>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('created');
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!isWalletConnected || !account) {
        setLoading(false);
        return;
      }
      
      try {
        const creatorProfile = await getCreatorProfile(account);
        setProfile(creatorProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [isWalletConnected, account, getCreatorProfile]);
  
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!isWalletConnected || !account) return;
      
      setLoadingCampaigns(true);
      try {
        await fetchUserCampaigns();
        await getUserContributedCampaigns();
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    };
    
    loadCampaigns();
  }, [isWalletConnected, account, fetchUserCampaigns, getUserContributedCampaigns]);
  
  if (!isWalletConnected) {
    return (
      <div className="w-full py-8">
        <Navbar />
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <p className="text-gray-500 mb-6">Please connect your wallet to view your profile</p>
          <Button onClick={() => router.push('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="w-full py-8">
        <Navbar />
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full py-8">
      <Navbar />
      
      <div className="w-full px-4 py-6">
        {!isWalletConnected ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Wallet Not Connected</h2>
              <p className="text-gray-600 text-center mb-6">Please connect your wallet to view your profile.</p>
              <Button onClick={() => router.push('/')}>
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          account && <SafeUserProfile address={account} />
        )}
      </div>
    </div>
  );
} 