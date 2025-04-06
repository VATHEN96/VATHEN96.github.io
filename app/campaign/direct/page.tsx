'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  Share2, 
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Copy
} from 'lucide-react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import BlockchainServiceFixedV3Instance from '@/services/blockchainServiceFixedV3';
import Navbar from '@/components/navbar';

export default function DirectCampaignPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formattedId, setFormattedId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCampaign();
  }, []);

  // Direct fetch of campaign 0 - no ID parsing required
  const fetchCampaign = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Directly fetching campaign 0');
      
      // Use fixed campaign ID 0
      const campaignId = 0;
      
      const campaignData = await BlockchainServiceFixedV3Instance.getCampaign(campaignId);
      
      // Generate a formatted ID for display (optional)
      const displayId = BlockchainServiceFixedV3Instance.formatCampaignId(
        campaignId, 
        campaignData.creator || ''
      );
      setFormattedId(displayId);
      
      // Transform the data to match expected fields
      const transformedData = {
        ...campaignData,
        amountCollected: campaignData.totalFunded ? ethers.utils.formatEther(campaignData.totalFunded) : '0',
        target: campaignData.goalAmount ? ethers.utils.formatEther(campaignData.goalAmount) : '0',
        owner: campaignData.creator,
        // Calculate deadline from createdAt and duration (in seconds)
        deadline: campaignData.createdAt && campaignData.duration ? 
          new Date(Number(campaignData.createdAt) * 1000 + Number(campaignData.duration) * 1000).toISOString() : 
          new Date().toISOString()
      };
      
      setCampaign(transformedData);
    } catch (error: any) {
      console.error('Error fetching campaign 0:', error);
      setError(`Failed to load campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateProgress = () => {
    if (!campaign) return 0;
    
    const target = parseFloat(campaign.target);
    const amountCollected = parseFloat(campaign.amountCollected);
    
    if (isNaN(target) || target === 0 || isNaN(amountCollected)) return 0;
    
    const progress = (amountCollected / target) * 100;
    return Math.min(progress, 100);
  };

  const calculateDaysRemaining = () => {
    if (!campaign?.deadline) return 0;
    
    const deadline = new Date(campaign.deadline);
    const now = new Date();
    
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // Add a function to copy campaign ID
  const copyToClipboard = (text: string) => {
    // Make sure we're using the formatted ID without any extra whitespace
    const cleanText = text.trim();
    console.log("Copying to clipboard:", cleanText);
    
    navigator.clipboard.writeText(cleanText)
      .then(() => {
        toast.success('Campaign ID copied to clipboard');
        console.log("Successfully copied to clipboard");
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy campaign ID');
      });
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <Link href="/campaigns" className="flex items-center text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Campaigns
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
            <Button variant="outline" size="sm" className="ml-auto" onClick={fetchCampaign}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </Alert>
        ) : campaign ? (
          <>
            <div className="flex flex-col space-y-2 mb-6">
              <h1 className="text-3xl font-bold">{campaign.title}</h1>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md flex items-center">
                  Campaign ID: {formattedId || 0}
                  <button 
                    onClick={() => copyToClipboard(formattedId || "0")}
                    className="ml-2 hover:text-primary"
                    title="Copy Campaign ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <div className="rounded-lg overflow-hidden mb-6 relative aspect-video">
                  {campaign.media && campaign.media.length > 0 && campaign.media[0] ? (
                    <Image 
                      src={campaign.media[0]} 
                      alt={campaign.title || 'Campaign Image'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-muted h-full w-full flex items-center justify-center">
                      <p className="text-muted-foreground">No image available</p>
                    </div>
                  )}
                </div>
                
                <div className="prose max-w-none mb-6">
                  <h2 className="text-2xl font-bold mb-4">About This Campaign</h2>
                  <p>{campaign?.description || 'No description available'}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Campaign ID</span>
                      <span className="font-medium flex items-center">
                        {formattedId || 0}
                        <button 
                          onClick={() => copyToClipboard(formattedId || "0")}
                          className="ml-2 hover:text-primary"
                          title="Copy Campaign ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Raised</span>
                      <span className="font-medium">{campaign.amountCollected} TLOS</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">{campaign.target} TLOS</span>
                    </div>
                    <Progress value={calculateProgress()} className="h-2 mt-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <CalendarDays className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="font-medium">{formatDate(campaign.deadline)}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <Clock className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-medium">{calculateDaysRemaining()} days</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Link href="/fund-campaign/0" className="w-full">
                      <Button className="w-full">Fund this Campaign</Button>
                    </Link>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Campaign Creator</h3>
                  <div className="flex items-center">
                    <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center mr-3">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Creator</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {campaign.owner}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">Troubleshooting</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This is a direct view of campaign with ID 0, bypassing all ID parsing logic.
                    If you're seeing this page correctly, but have issues with the regular campaign page,
                    there's likely an issue with the ID format handling.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
} 