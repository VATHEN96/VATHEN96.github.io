'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  Target, 
  Award, 
  Share2, 
  AlertTriangle,
  Wallet
} from 'lucide-react';

import { useWowzaRush } from '@/context/wowzarushContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import ContributionTiers from '@/components/campaign/ContributionTiers';
import MilestoneTimeline from '@/components/campaign/MilestoneTimeline';
import { CommentsSection } from '@/components/campaign/CommentsSection';
import QASection from '@/components/campaign/QASection';
import { GovernanceRights } from '@/components/campaign/GovernanceRights';
import { CampaignUpdates } from '@/components/campaign/CampaignUpdates';
import { RiskAssessment } from '@/components/campaign/RiskAssessment';
import { AnalyticsDashboard } from '@/components/campaign/AnalyticsDashboard';
import { Campaign } from '@/types/campaign';
import CampaignHeader from '@/components/campaign/CampaignHeader';
import ContributeForm from '@/components/campaign/ContributeForm';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') || 'about';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [hasContributed, setHasContributed] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  
  const { 
    isWalletConnected, 
    connectWallet, 
    getCampaign, 
    getUserContributions,
    userProfile
  } = useWowzaRush();

  useEffect(() => {
    const loadCampaignData = async () => {
      if (!id) {
        console.error('Campaign ID is missing');
        return;
      }
      
      setIsLoading(true);
      try {
        const campaignData = await getCampaign(id);
        setCampaign(campaignData);
        
        // Check if user is the creator
        if (isWalletConnected && userProfile) {
          setIsCreator(campaignData.creatorAddress === userProfile.walletAddress);
        }
        
        // Check if user has contributed
        if (isWalletConnected) {
          const contributions = await getUserContributions(id);
          setHasContributed(contributions && contributions.length > 0);
        }
      } catch (error) {
        console.error('Error loading campaign:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      loadCampaignData();
    }
  }, [id, isWalletConnected, userProfile, getCampaign, getUserContributions]);

  // Helper functions
  const formatDateString = (dateString: string | number | Date): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const calculateTimeLeft = (endDate: string | number | Date): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Ended';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return diffDays > 0 
      ? `${diffDays} days left` 
      : `${diffHours} hours left`;
  };

  const calculateFundingProgress = (raised: number | string, goal: number | string): number => {
    const raisedNum = typeof raised === 'string' ? parseFloat(raised) : raised;
    const goalNum = typeof goal === 'string' ? parseFloat(goal) : goal;
    
    if (isNaN(raisedNum) || isNaN(goalNum) || goalNum === 0) {
      return 0;
    }
    
    return Math.min(Math.round((raisedNum / goalNum) * 100), 100);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[100px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Render 404 if campaign not found
  if (!campaign) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Campaign Not Found</h1>
        <p className="text-muted-foreground mb-8">The campaign you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <a href="/explore">Explore Campaigns</a>
        </Button>
      </div>
    );
  }

  // Governance notice for users
  const renderGovernanceNotice = () => {
    if (!isWalletConnected) {
      return (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Connect your wallet to participate in governance for this campaign.
            <Button variant="link" onClick={connectWallet} className="p-0 h-auto font-semibold ml-2">
              Connect Wallet
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!hasContributed) {
      return (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need to contribute to this campaign to gain governance rights.
            <Button 
              variant="link" 
              onClick={() => setActiveTab('contribute')} 
              className="p-0 h-auto font-semibold ml-2"
            >
              Contribute Now
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <CampaignHeader campaign={campaign} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="space-y-6">
              <RiskAssessment campaignId={id as string} />
              
              <h2 className="text-2xl font-bold mt-6">About This Campaign</h2>
              <div className="prose max-w-none dark:prose-invert">
                {campaign.description}
              </div>
              
              <h3 className="mt-8">Campaign Updates</h3>
              <CampaignUpdates campaignId={id as string} isCreator={isCreator} />
              
              <h3 className="mt-8">Milestones</h3>
              <MilestoneTimeline 
                milestones={campaign.milestones} 
                campaignStartDate={campaign.createdAt}
                campaignEndDate={campaign.deadline}
                campaignGoalAmount={campaign.goalAmount}
                totalFunded={campaign.totalFunded}
              />
            </TabsContent>
            
            <TabsContent value="updates">
              {/* ...updates tab content... */}
            </TabsContent>
            
            <TabsContent value="analytics">
              <AnalyticsDashboard campaignId={id as string} />
            </TabsContent>
            
            <TabsContent value="comments">
              <h2 className="text-2xl font-bold mb-6">Community Discussion</h2>
              <CommentsSection campaignId={id as string} creatorId={campaign.creator} />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ContributeForm campaign={campaign} />
          </div>
        </div>
      </div>
    </div>
  );
}
