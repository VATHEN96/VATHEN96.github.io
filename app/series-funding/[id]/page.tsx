'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FundingRound } from '@/types';
import InvestInRoundForm from '@/components/InvestInRoundForm';
import StartFundingRoundForm from '@/components/StartFundingRoundForm';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';

// Enum for funding series
enum FundingSeries {
  SEED = 0,
  SERIES_A = 1,
  SERIES_B = 2,
  SERIES_C = 3
}

const SeriesFundingPage = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { blockchainService, isLoading: isServiceLoading, error: serviceError } = useBlockchainService();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [currentValuation, setCurrentValuation] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRound, setActiveRound] = useState<FundingRound | null>(null);
  const [completedRounds, setCompletedRounds] = useState<FundingRound[]>([]);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!blockchainService || !id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get user address if wallet is connected
        const address = blockchainService.getAddress();
        setUserAddress(address);
        
        // Fetch campaign details
        const campaignData = await blockchainService.getCampaign(id);
        setCampaign(campaignData);
        
        // Check if this is a series funding campaign
        if (campaignData.campaignType !== 2) {
          setError('This is not a Series Funding campaign');
          setIsLoading(false);
          return;
        }
        
        // Get current valuation
        const val = await blockchainService.getSeriesFundingValuation(id);
        setCurrentValuation(ethers.utils.formatEther(val));
        
        // Fetch all funding rounds
        const active: FundingRound[] = [];
        const completed: FundingRound[] = [];
        
        // Check each possible series
        for (let i = 0; i <= FundingSeries.SERIES_C; i++) {
          try {
            const roundDetails = await blockchainService.getFundingRoundDetails(id, i);
            
            if (roundDetails && roundDetails.series >= 0) {
              if (roundDetails.isActive) {
                active.push(roundDetails);
              } else if (roundDetails.isComplete) {
                completed.push(roundDetails);
              }
            }
          } catch (roundError) {
            console.error(`Error fetching round ${i} details:`, roundError);
            // Continue to next round if one fails
          }
        }
        
        setActiveRound(active.length > 0 ? active[0] : null);
        setCompletedRounds(completed);
      } catch (err) {
        console.error('Error fetching campaign data:', err);
        setError('Failed to load campaign details');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (blockchainService && !isServiceLoading) {
      fetchCampaignData();
    }
  }, [id, blockchainService, isServiceLoading, refreshTrigger]);
  
  // Handle investment success
  const handleInvestmentSuccess = () => {
    // Refresh data
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Function to get next series
  const getNextSeries = (): number => {
    if (completedRounds.length === 0) {
      return FundingSeries.SEED;
    }
    
    const maxSeries = Math.max(...completedRounds.map(round => round.series));
    return maxSeries + 1;
  };
  
  // Get series name
  const getSeriesName = (series: number): string => {
    switch (series) {
      case FundingSeries.SEED: return 'Seed';
      case FundingSeries.SERIES_A: return 'Series A';
      case FundingSeries.SERIES_B: return 'Series B';
      case FundingSeries.SERIES_C: return 'Series C';
      default: return `Series ${series}`;
    }
  };
  
  // Loading state
  if (isServiceLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Error state
  if (serviceError || error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || serviceError?.message || 'Failed to load campaign details'}
          </AlertDescription>
        </Alert>
        
        <Button className="mt-4" onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </div>
    );
  }
  
  // Not found or not a series funding campaign
  if (!campaign || campaign.campaignType !== 2) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campaign Not Found</AlertTitle>
          <AlertDescription>
            This campaign doesn't exist or is not a Series Funding campaign.
          </AlertDescription>
        </Alert>
        
        <Button className="mt-4" onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <Badge variant="default">Series Funding</Badge>
        </div>
        <p className="text-lg text-muted-foreground">{campaign.description}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Valuation</p>
                <p className="text-2xl font-bold">{parseFloat(currentValuation).toLocaleString()} TLOS</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Rounds</p>
                <p className="text-2xl font-bold">{completedRounds.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  <Badge variant={activeRound ? "default" : "outline"}>
                    {activeRound ? `${getSeriesName(activeRound.series)} Active` : 'No Active Round'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue={activeRound ? "active" : "completed"}>
            <TabsList className="mb-4">
              <TabsTrigger value="active" disabled={!activeRound}>
                Current Round
              </TabsTrigger>
              <TabsTrigger value="completed" disabled={completedRounds.length === 0}>
                Past Rounds
              </TabsTrigger>
              <TabsTrigger value="start" disabled={!blockchainService.isOwner(campaign.owner)}>
                Start New Round
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {activeRound ? (
                <InvestInRoundForm
                  campaignId={id}
                  fundingRound={activeRound}
                  blockchainService={blockchainService}
                  onSuccess={handleInvestmentSuccess}
                  userAddress={userAddress}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No active funding round available</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {completedRounds.length > 0 ? (
                <div className="space-y-6">
                  {completedRounds.map((round) => (
                    <Card key={round.series}>
                      <CardHeader>
                        <CardTitle>{getSeriesName(round.series)} Funding Round</CardTitle>
                        <CardDescription>
                          Completed with {round.investorCount} investors
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Target Amount</p>
                            <p className="font-medium">
                              {parseFloat(ethers.utils.formatEther(round.targetAmount)).toLocaleString()} TLOS
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Amount Raised</p>
                            <p className="font-medium">
                              {parseFloat(ethers.utils.formatEther(round.amountRaised)).toLocaleString()} TLOS
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Equity Offered</p>
                            <p className="font-medium">{(round.equityOffered / 100).toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Min Investment</p>
                            <p className="font-medium">
                              {parseFloat(ethers.utils.formatEther(round.minInvestment)).toLocaleString()} TLOS
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No completed funding rounds yet</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="start">
              {blockchainService.isOwner(campaign.owner) ? (
                <StartFundingRoundForm
                  campaignId={id}
                  currentValuation={currentValuation}
                  blockchainService={blockchainService}
                  onSuccess={handleInvestmentSuccess}
                  series={getNextSeries()}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">Only the campaign owner can start new funding rounds</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {campaign.milestones && campaign.milestones.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>
              Track the progress of this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaign.milestones.map((milestone: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{milestone.name}</h3>
                      <Badge variant={milestone.completed ? "default" : "outline"}>
                        {milestone.completed ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{milestone.description}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Target: {parseFloat(ethers.utils.formatEther(milestone.target)).toLocaleString()} TLOS
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SeriesFundingPage; 