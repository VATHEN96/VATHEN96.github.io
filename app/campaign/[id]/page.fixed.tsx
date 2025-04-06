"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import ContributionTiers from '@/components/campaign/ContributionTiers';
import MilestoneTimeline from '@/components/campaign/MilestoneTimeline';
import { CommentsSection } from '@/components/campaign/CommentsSection';
import QASection from '@/components/campaign/QASection';
import { GovernanceRights } from '@/components/campaign/GovernanceRights';
import { CampaignUpdates } from '@/components/campaign/CampaignUpdates';
import { RiskAssessment } from '@/components/campaign/RiskAssessment';
import BlockchainServiceFixedV3Instance from '@/services/blockchainServiceFixedV3';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    if (!id) {
      setError('Campaign ID is missing');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const campaignData = await BlockchainServiceFixedV3Instance.getCampaign(Number(id));
      setCampaign(campaignData);
    } catch (error: any) {
      console.error(`Error fetching campaign ${id}:`, error);
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign?.title,
        text: campaign?.description,
        url: window.location.href,
      }).catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch((error) => console.error('Error copying link:', error));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
          <h1 className="text-3xl font-bold mb-6">{campaign.title}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="rounded-lg overflow-hidden mb-6 relative aspect-video">
                {campaign.image ? (
                  <Image 
                    src={campaign.image} 
                    alt={campaign.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-muted h-full w-full flex items-center justify-center">
                    <p className="text-muted-foreground">No image available</p>
                  </div>
                )}
              </div>
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="qa">Q&A</TabsTrigger>
                </TabsList>
                
                <TabsContent value="about" className="space-y-4">
                  <div className="prose max-w-none">
                    <p>{campaign.description}</p>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <CampaignUpdates campaignId={id} />
                  
                  <Separator className="my-6" />
                  
                  <RiskAssessment campaignId={id} />
                </TabsContent>
                
                <TabsContent value="milestones">
                  {campaign.milestones && campaign.milestones.length > 0 ? (
                    <MilestoneTimeline milestones={campaign.milestones} />
                  ) : (
                    <p className="text-muted-foreground">No milestones available for this campaign.</p>
                  )}
                </TabsContent>
                
                <TabsContent value="comments">
                  <CommentsSection campaignId={id} />
                </TabsContent>
                
                <TabsContent value="qa">
                  <QASection campaignId={id} />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-6">
              <Card className="p-6">
                <div className="mb-4">
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
                  <Link href={`/fund-campaign/${id}`} className="w-full">
                    <Button className="w-full">Fund this Campaign</Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
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
              
              <ContributionTiers campaignId={id} />
              
              <GovernanceRights campaignId={id} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
} 