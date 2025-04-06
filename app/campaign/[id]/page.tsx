'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  CalendarDays,
  Clock,
  Users,
  Target,
  // Award, // Removed - related to milestones?
  Share2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Copy,
  CheckCircle2,
  // XCircle, // Removed - related to voting
  // Upload, // Removed - related to proof submission
  // Plus, // Potentially unused
  // Loader2, // Removed - related to voting/submission
  // ChevronDown, // Removed - related to voting
  // ThumbsUp, // Removed - related to voting
  // ThumbsDown // Removed - related to voting
} from 'lucide-react';
import Link from 'next/link';
import { ethers, formatEther, ZeroAddress } from 'ethers'; // Import specific utilities
import { toast } from 'sonner';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import MilestoneTimeline from '@/components/campaign/MilestoneTimeline';
import { CommentsSection } from '@/components/campaign/CommentsSection';
import QASection from '@/components/campaign/QASection';
import { CampaignUpdates } from '@/components/campaign/CampaignUpdates';
import { RiskAssessment } from '@/components/campaign/RiskAssessment';
import BlockchainServiceFixedV3Instance from '@/services/blockchainServiceFixedV3';
import Navbar from '@/components/navbar';

// Removed imports related to disabled features
import { useWowzaRush } from '@/context/wowzarushContext';
import extractNumericId from '@/utils/extractNumericId';

// Define a basic Campaign type/interface if not already globally defined
interface Campaign {
    id: number;
    title: string;
    description: string;
    category: string;
    creator: string;
    goalAmount: bigint;
    totalFunded?: bigint;
    currentAmount?: number; // Derived from totalFunded
    status?: string;
    duration?: number; // Could be seconds or days depending on source
    createdAt?: number; // Timestamp in seconds
    deadline?: number; // Timestamp in seconds
    isActive?: boolean;
    milestones?: any[]; // Keep milestones if MilestoneTimeline uses it
    media?: string[];
    donors?: any[]; // Might not be populated correctly
    contributorsCount?: number;
    fundsClaimed?: boolean;
    completed?: boolean;
    campaignType?: number; // For investment campaigns
    equityPercentage?: bigint; // For investment campaigns
    minInvestment?: bigint; // For investment campaigns
    metadataIPFSHash?: string; // Potentially available
    mediaIPFSHash?: string; // Potentially available
    currentMilestone?: number; // Potentially available
    [key: string]: any; // Allow other potential fields
}


export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null); // Use defined interface
  const [error, setError] = useState<string | null>(null);
  const [formattedId, setFormattedId] = useState<string | null>(null); // Keep for display formatting if needed
  const { userAddress } = useWowzaRush();
  const [isCreator, setIsCreator] = useState(false);
  // Removed state variables for voting/proofs

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  // Removed useEffect for formatting ID '0' as it might conflict
  // useEffect(() => {
  //   if (id === '0') { ... }
  // }, [id]);

  const fetchCampaign = async () => {
    setLoading(true);
    setCampaign(null);
    setError(null);

    try {
      // Validate input
      if (!id) {
        setError('Campaign ID is required');
        // setLoading(false); // Moved to finally
        return null;
      }

      // Extract numeric id
      const numericId = extractNumericId(id);
      if (numericId === null) {
        setError('Invalid campaign ID format');
        // setLoading(false); // Moved to finally
        return null;
      }

      const blockchainService = BlockchainServiceFixedV3Instance;
      let campaignData: Campaign | null = null; // Use defined interface
      const maxAttempts = 5; // Number of attempts
      const existenceCheckDelay = 2000; // Delay in ms (2 seconds)

      try {
        // Attempt to retrieve campaign data with retries
        for (let attempts = 1; attempts <= maxAttempts; attempts++) {
          console.log(`[FETCH] Attempt ${attempts}/${maxAttempts} to retrieve campaign data for ID ${numericId}`);

          try {
            const contract = await blockchainService.getContract();
            console.log('[FETCH] Retrieved contract successfully');

            // Check if getCampaignDetails exists in the ABI
            const hasGetCampaignDetailsMethod = typeof contract.getCampaignDetails === 'function';

            if (hasGetCampaignDetailsMethod) {
               try {
                 console.log('[FETCH] Trying getCampaignDetails method...');
                 const details = await contract.getCampaignDetails(numericId);
                 // Log the raw details object AND specifically the deadline field
                 console.log('[FETCH] Raw Campaign details result:', details);
                 console.log('[FETCH] Raw Deadline value:', details?.deadline?.toString());

                 // Check if creator is valid to confirm existence
                 if (details && details.creator && details.creator !== ZeroAddress) {
                   // Construct campaign data primarily from details
                   campaignData = {
                     id: numericId,
                     title: details.title || 'Untitled Campaign',
                     description: details.description || 'No description available',
                     category: 'Not specified', // Not available in details - needs separate fetch or different source if required
                     goalAmount: details.goalAmount || 0n,
                     totalFunded: details.amountRaised || 0n, // Use amountRaised
                     currentAmount: parseFloat(formatEther(details.amountRaised || 0n)),
                     duration: undefined, // Calculate later if possible
                     createdAt: undefined, // Not available in details - needs separate fetch or different source if required
                     deadline: details.deadline ? Number(details.deadline) : undefined,
                     isActive: !details.completed && details.deadline ? (Math.floor(Date.now() / 1000) < Number(details.deadline)) : false,
                     creator: details.creator,
                     milestones: [], // Fetch separately below
                     contributorsCount: details.contributorCount ? Number(details.contributorCount) : 0,
                     fundsClaimed: details.fundsClaimed,
                     completed: details.completed,
                     // Add other potential fields with defaults if needed
                     campaignType: 0, // Default or fetch separately
                     equityPercentage: 0n,
                     minInvestment: 0n
                   };

                   // Attempt to fetch milestones separately if function exists
                   if (typeof contract.getCampaignMilestones === 'function') {
                      try {
                         const milestonesResult = await contract.getCampaignMilestones(numericId);
                         if (milestonesResult && milestonesResult.length > 0) {
                            campaignData.milestones = milestonesResult; // Assuming result matches expected structure
                         }
                      } catch (milestoneError) {
                         console.warn(`[FETCH] Failed to fetch milestones for campaign ${numericId}:`, milestoneError);
                      }
                   } else {
                       console.warn("[FETCH] getCampaignMilestones function not found in ABI.");
                   }

                   console.log('[FETCH] Constructed campaign from getCampaignDetails');
                   break; // Exit loop successfully
                 }
               } catch (detailsError) {
                 console.warn(`[FETCH] getCampaignDetails failed on attempt ${attempts}:`, detailsError);
                 // Don't break yet, allow retries
               }
            } else {
               console.warn("[FETCH] getCampaignDetails function not found in ABI. Cannot fetch campaign data reliably.");
               // If the primary method is missing, break the loop early
               break;
            }

            // If campaignData is found, exit loop (already handled by break above)
            // if (campaignData) { break; }

            // If not found and not the last attempt, wait before retrying
            if (attempts < maxAttempts) {
              console.log(`[FETCH] Campaign not found yet, attempt ${attempts}/${maxAttempts}. Retrying...`);
              await new Promise(resolve => setTimeout(resolve, existenceCheckDelay * attempts)); // Exponential backoff might be better
            }

          } catch (error) { // Catch errors from getContract or other issues within the attempt
            console.error(`[FETCH] Error during attempt ${attempts}:`, error);
             if (attempts < maxAttempts) {
                console.log(`[FETCH] Retrying after error...`);
                await new Promise(resolve => setTimeout(resolve, existenceCheckDelay * attempts));
             }
          }
        } // End of retry loop

        // If we reached max attempts without success
        if (!campaignData) {
          console.error(`[FETCH] Campaign ID ${numericId} not found after ${maxAttempts} attempts.`);
          setCampaign(null); // Ensure campaign is null
          setError(`Campaign with ID ${id} not found. This campaign may not exist yet or may have been removed.`);
          // setLoading(false); // Moved to finally block
          return null; // Return null to indicate not found
        } else {
           // Process successfully fetched campaignData
           setIsCreator(
              !!(userAddress &&
              campaignData.creator &&
              userAddress.toLowerCase() === campaignData.creator.toLowerCase())
           );
           setCampaign(campaignData);
           // setLoading(false); // Moved to finally block
           return campaignData; // Return the found data
        }

      } catch (blockchainError: any) { // Catch errors from the overall blockchain interaction setup
        console.error(`[FETCH] Error retrieving campaign from blockchain:`, blockchainError);
        setCampaign(null);
        setError(`Campaign data could not be retrieved. Please check your connection and try again.`);
        // setLoading(false); // Moved to finally block
        return null;
      }
    } catch (error: any) { // Catch fatal errors like invalid ID format
      console.error(`[FETCH] Fatal error fetching campaign:`, error);
      setCampaign(null);
      setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // setLoading(false); // Moved to finally block
      return null;
    } finally {
        console.log("[FETCH] Fetch attempt finished. Setting loading to false.");
        setLoading(false); // Ensure loading is always set to false at the end
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Assuming dateString is ISO or can be parsed by Date constructor
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
       console.warn("Error formatting date string:", dateString, error);
      return 'Invalid date';
    }
  };

   const formatTimestamp = (timestamp: number | undefined): string => {
     if (timestamp === undefined || timestamp === 0) return 'Unknown';
     try {
       // Multiply by 1000 to convert seconds to milliseconds for Date constructor
       return format(new Date(timestamp * 1000), 'MMM dd, yyyy');
     } catch (error) {
       console.warn("Error formatting timestamp:", timestamp, error);
       return 'Invalid date';
     }
   };


  const calculateProgress = (): number => {
    if (!campaign || !campaign.goalAmount || !campaign.totalFunded) return 0;

    try {
      const target = parseFloat(formatEther(campaign.goalAmount));
      const collected = parseFloat(formatEther(campaign.totalFunded));

      if (target === 0) return campaign.totalFunded > 0n ? 100 : 0; // Handle 0 goal edge case

      const percentage = (collected / target) * 100;
      return Math.min(percentage, 100); // Cap at 100%
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };

  const calculateDaysRemaining = (): number | string => { // Return string for "N/A"
    if (!campaign || campaign.deadline === undefined) return "N/A"; // Use deadline directly

    try {
      const endTimeSeconds = Number(campaign.deadline);
      const nowSeconds = Math.floor(Date.now() / 1000);

      // Use completed flag if available, otherwise rely on time
      const campaignEnded = campaign.completed ?? (nowSeconds >= endTimeSeconds);
      if (campaignEnded) return 0;

      const secondsRemaining = endTimeSeconds - nowSeconds;
      const daysRemaining = Math.ceil(secondsRemaining / 86400);

      return daysRemaining;
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return "Error";
    }
  };

  // Format category name based on category code
  const formatCategoryName = (categoryCode: string | number | undefined): string => {
    if (categoryCode === undefined || categoryCode === null) return 'Not specified';

    const categories: Record<string, string> = {
      '0': 'General',
      '1': 'Technology',
      '2': 'Art & Creative',
      '3': 'Business',
      '4': 'Community',
      '5': 'Education'
    };

    return categories[categoryCode.toString()] || 'Not specified';
  };

  // Calculate end date
  const calculateEndDate = (): string => {
     if (!campaign || campaign.deadline === undefined) return 'Unknown'; // Use deadline directly

     try {
       const endTimestamp = Number(campaign.deadline);
       return formatTimestamp(endTimestamp); // Use helper
     } catch (error) {
       console.error('Error calculating end date:', error);
       return 'Unknown';
     }
   };


  // Determine if campaign is active
  const isCampaignActive = (): boolean => {
    if (!campaign) return false;
    // Use isActive calculated during fetch (based on deadline and completed status)
    return campaign.isActive ?? false; // Default to false if undefined
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

  const copyToClipboard = (text: string) => {
    const cleanText = text.trim();

    navigator.clipboard.writeText(cleanText)
      .then(() => {
        toast.success('Campaign ID copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy campaign ID');
      });
  };

  const formatWalletAddress = (address: string): string => {
    if (!address) return "Unknown";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // --- Removed functions related to disabled features (Voting, Proof Submission) ---
  // Note: formatMilestoneStatus, getMilestoneStatusColor, getMilestoneIcon might be used by MilestoneTimeline, keeping them for now.
   const formatMilestoneStatus = (milestone: any) => {
    if (milestone.completed) return "Completed"; // Check 'completed' based on ABI/Struct
    // Add other statuses if needed based on your contract logic
    return "Upcoming";
  };

  const getMilestoneStatusColor = (milestone: any) => {
    if (milestone.completed) return "text-green-600";
    // Add other statuses if needed
    return "text-blue-600";
  };

  const getMilestoneIcon = (milestone: any) => {
    if (milestone.completed) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    // Add other statuses if needed
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  // --- Restored Original Render Logic ---
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
                  Campaign ID: {id} {/* Display only the ID from the route params */}
                  <button
                    onClick={() => copyToClipboard(id)} // Use id directly
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

                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="qa">Q&A</TabsTrigger>
                  </TabsList>

                  <TabsContent value="about" className="space-y-4">
                    <div className="prose max-w-none">
                      <p>{campaign?.description || 'No description available'}</p>
                    </div>

                    <Separator className="my-6" />

                    <CampaignUpdates campaignId={id} />

                    <Separator className="my-6" />

                    <RiskAssessment campaignId={id} />
                  </TabsContent>

                  <TabsContent value="milestones">
                    {campaign?.milestones && campaign.milestones.length > 0 ? (
                      <MilestoneTimeline
                        milestones={campaign.milestones}
                        // onMilestoneClick removed
                      />
                    ) : (
                      <p className="text-muted-foreground">No milestones available for this campaign.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="comments">
                    <CommentsSection campaignId={id} />
                  </TabsContent>

                  <TabsContent value="qa">
                    <QASection campaignId={id} creatorId={campaign?.creator || ''} />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {campaign.totalFunded ? `${formatEther(campaign.totalFunded)} TLOS raised` : 'No funds raised yet'}
                        </span>
                        <span className="text-sm font-medium">
                          {campaign.goalAmount ? `${formatEther(campaign.goalAmount)} TLOS goal` : '0 TLOS goal'}
                        </span>
                      </div>
                      <Progress value={calculateProgress()} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Time Left
                        </span>
                        <span className="font-medium">
                          {calculateDaysRemaining()} {typeof calculateDaysRemaining() === 'number' ? 'days' : ''}
                        </span>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Contributors
                        </span>
                        <span className="font-medium">
                          {campaign.contributorsCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Add investment campaign details if applicable */}
                    {campaign.campaignType === 1 && (
                      <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <h3 className="text-md font-semibold mb-2">Investment Campaign</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Equity Offered:</span>
                          <span className="font-medium">{campaign.equityPercentage ? (Number(campaign.equityPercentage) / 100).toFixed(2) : '0'}%</span>

                          <span className="text-muted-foreground">Min Investment:</span>
                          <span className="font-medium">{campaign.minInvestment ? formatEther(campaign.minInvestment) : '0'} TLOS</span>
                        </div>
                      </div>
                    )}

                    {!isCreator && (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => router.push(`/fund-campaign/${id}`)}
                      >
                        {campaign.campaignType === 1 ? 'Invest Now' : 'Contribute Now'}
                      </Button>
                    )}

                    {isCreator && (
                      <div className="text-center p-3 rounded-md border bg-muted mb-4">
                        <p className="text-muted-foreground text-sm">You are the creator of this campaign</p>
                      </div>
                    )}

                    <div className="flex justify-center mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Campaign
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Creator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-muted h-12 w-12 flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        {campaign.creator ? (
                          <>
                            <p className="font-medium">
                              {formatWalletAddress(campaign.creator)} {/* Use helper */}
                            </p>
                            <p className="text-sm text-blue-600 hover:underline cursor-pointer"
                               onClick={() => {
                                 navigator.clipboard.writeText(campaign.creator);
                                 toast.success('Creator address copied to clipboard');
                               }}>
                              Copy Address
                            </p>
                          </>
                        ) : (
                          <p className="font-medium">Unknown</p>
                        )}
                        <p className="text-sm text-muted-foreground">Campaign Creator</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Campaign Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Start Date</span>
                      <span className="text-sm">
                        {formatTimestamp(campaign.createdAt)} {/* Use helper */}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">End Date</span>
                      <span className="text-sm">
                        {calculateEndDate()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Category</span>
                      <span className="text-sm">
                        {formatCategoryName(campaign.category)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className="text-sm">
                        {isCampaignActive() ? 'Active' : 'Ended'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : null /* Error state should be handled by the 'error' condition */ }
      </div>

      {/* --- Removed Milestone Details Modal --- */}
    </div>
  );
}
