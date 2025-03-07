'use client';

import React, { useState, useEffect } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import type { Proposal, VotingPower } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  VoteIcon, 
  Users, 
  Trophy, 
  Medal, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  ArrowRight, 
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Proposal as GovernanceProposal } from '@/components/campaign/GovernanceRights';

interface UserGovernanceStats {
  totalVotingPower: number;
  totalProposalsVoted: number;
  totalProposalsCreated: number;
  governedCampaigns: number;
  activeCampaigns: {
    id: string;
    title: string;
    activeProposals: number;
    userVotingPower: number;
  }[];
}

const DashboardPage = () => {
  const { account, isWalletConnected, connectWallet, getUserVotingPower, getCampaign, getCampaignProposals } = useWowzaRush();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [governanceStats, setGovernanceStats] = useState<UserGovernanceStats>({
    totalVotingPower: 0,
    totalProposalsVoted: 0,
    totalProposalsCreated: 0,
    governedCampaigns: 0,
    activeCampaigns: []
  });
  const [recentProposals, setRecentProposals] = useState<Proposal[]>([]);
  
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isWalletConnected || !account) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // This is mock data for development - in a real app, you would get this from the backend
        const mockCampaignIds = ['campaign-1', 'campaign-2', 'campaign-3'];
        
        // Fetch governance data for each campaign
        const campaignData = await Promise.all(
          mockCampaignIds.map(async (campaignId) => {
            const campaign = await getCampaign(campaignId);
            const proposals = await getCampaignProposals(campaignId);
            const votingPower = await getUserVotingPower(account, campaignId);
            
            const activeProposals = proposals.filter(
              p => p.status === 'active' || p.endTime > Date.now()
            );
            
            return {
              campaign,
              proposals,
              activeProposals,
              votingPower
            };
          })
        );
        
        // Calculate governance stats
        const stats: UserGovernanceStats = {
          totalVotingPower: 0,
          totalProposalsVoted: 0,
          totalProposalsCreated: 0,
          governedCampaigns: 0,
          activeCampaigns: []
        };
        
        const allProposals: Proposal[] = [];
        
        campaignData.forEach(({ campaign, proposals, activeProposals, votingPower }) => {
          stats.totalVotingPower += votingPower.total;
          
          const votedProposals = proposals.filter(p => p.userVoted);
          stats.totalProposalsVoted += votedProposals.length;
          
          const createdProposals = proposals.filter(
            p => p.creatorAddress.toLowerCase() === account.toLowerCase()
          );
          stats.totalProposalsCreated += createdProposals.length;
          
          if (votingPower.total > 0) {
            stats.governedCampaigns++;
            
            if (activeProposals.length > 0) {
              stats.activeCampaigns.push({
                id: campaign.id,
                title: campaign.title,
                activeProposals: activeProposals.length,
                userVotingPower: votingPower.total
              });
            }
          }
          
          allProposals.push(...proposals);
        });
        
        // Sort proposals by created date (most recent first)
        const sortedProposals = allProposals.sort((a, b) => b.createdAt - a.createdAt);
        
        setGovernanceStats(stats);
        setRecentProposals(sortedProposals.slice(0, 5)); // Get top 5 most recent
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load governance dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [account, isWalletConnected, getCampaign, getCampaignProposals, getUserVotingPower]);
  
  const calculateProposalProgress = (proposal: Proposal) => {
    const now = Date.now();
    const total = proposal.endTime - proposal.createdAt;
    const elapsed = now - proposal.createdAt;
    
    if (proposal.status === 'completed' || now > proposal.endTime) {
      return 100;
    }
    
    return Math.min(Math.round((elapsed / total) * 100), 100);
  };
  
  const getTimeRemaining = (endTime: number) => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      return 'Voting ended';
    }
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else {
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m remaining`;
    }
  };
  
  const getProposalStatus = (proposal: Proposal) => {
    if (proposal.status === 'completed' || proposal.endTime < Date.now()) {
      return {
        label: 'Completed',
        color: 'bg-gray-500',
        icon: <CheckCircle2 className="h-4 w-4 mr-1" />
      };
    } else if (proposal.status === 'active') {
      return {
        label: 'Active',
        color: 'bg-green-500',
        icon: <Clock className="h-4 w-4 mr-1" />
      };
    } else {
      return {
        label: 'Pending',
        color: 'bg-yellow-500',
        icon: <Clock className="h-4 w-4 mr-1" />
      };
    }
  };
  
  if (!isWalletConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="mx-auto max-w-md">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <Shield className="h-16 w-16 mx-auto text-primary opacity-80" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Governance Dashboard</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Connect your wallet to access your governance dashboard and participate in campaign decisions.
                </p>
              </div>
              <Button size="lg" onClick={connectWallet}>
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading governance dashboard...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Governance Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your voting power and participate in campaign decisions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-base">
            <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
            <span>Level: Citizen</span>
          </Badge>
          
          <Badge variant="secondary" className="px-3 py-1 text-base">
            <VoteIcon className="h-4 w-4 mr-2" />
            <span>Total Voting Power: {governanceStats.totalVotingPower}</span>
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="voting-power">Voting Power</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Voting Power</p>
                    <p className="text-3xl font-bold">{governanceStats.totalVotingPower}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3">
                    <VoteIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Proposals Voted</p>
                    <p className="text-3xl font-bold">{governanceStats.totalProposalsVoted}</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Proposals Created</p>
                    <p className="text-3xl font-bold">{governanceStats.totalProposalsCreated}</p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Governed Campaigns</p>
                    <p className="text-3xl font-bold">{governanceStats.governedCampaigns}</p>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3">
                    <Shield className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Proposals</CardTitle>
              <CardDescription>
                The most recent proposals across your governed campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProposals.length > 0 ? (
                <div className="space-y-4">
                  {recentProposals.map(proposal => {
                    const status = getProposalStatus(proposal);
                    const progress = calculateProposalProgress(proposal);
                    
                    return (
                      <div key={proposal.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{proposal.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Campaign: {proposal.campaignId}
                            </p>
                          </div>
                          <Badge className={`${status.color} text-white`}>
                            <div className="flex items-center">
                              {status.icon}
                              {status.label}
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{proposal.totalVotes} votes</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                {getTimeRemaining(proposal.endTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/campaign/${proposal.campaignId}?tab=governance`}>
                              View Proposal
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent proposals found</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Active Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>
                Campaigns with active proposals that need your vote
              </CardDescription>
            </CardHeader>
            <CardContent>
              {governanceStats.activeCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {governanceStats.activeCampaigns.map(campaign => (
                    <div key={campaign.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <h3 className="font-medium">{campaign.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {campaign.activeProposals} active proposal(s)
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          <VoteIcon className="h-4 w-4 mr-1" />
                          Power: {campaign.userVotingPower}
                        </Badge>
                        
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/campaign/${campaign.id}?tab=governance`}>
                            View Campaign
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active campaigns found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="proposals" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Proposals</CardTitle>
              <CardDescription>
                Proposals you've created or participated in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Proposals</TabsTrigger>
                  <TabsTrigger value="created">Created</TabsTrigger>
                  <TabsTrigger value="voted">Voted</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  {recentProposals.length > 0 ? (
                    <div className="space-y-4">
                      {recentProposals.map(proposal => {
                        const status = getProposalStatus(proposal);
                        const progress = calculateProposalProgress(proposal);
                        
                        return (
                          <div key={proposal.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">{proposal.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Campaign: {proposal.campaignId}
                                </p>
                              </div>
                              <Badge className={`${status.color} text-white`}>
                                <div className="flex items-center">
                                  {status.icon}
                                  {status.label}
                                </div>
                              </Badge>
                            </div>
                            
                            <div className="mt-4 space-y-4">
                              <div>
                                <p className="text-sm mb-2">{proposal.description}</p>
                                
                                <div className="space-y-2">
                                  {proposal.options.map(option => {
                                    const percentage = proposal.totalVotes > 0 ? 
                                      Math.round((option.votes / proposal.totalVotes) * 100) : 0;
                                    const isUserVote = proposal.userVoteOption === option.id;
                                    
                                    return (
                                      <div key={option.id} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center">
                                            <span>{option.text}</span>
                                            {isUserVote && (
                                              <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                                                Your vote
                                              </Badge>
                                            )}
                                          </div>
                                          <span className="text-sm">{percentage}%</span>
                                        </div>
                                        
                                        <div className="flex items-center">
                                          <Progress value={percentage} className="h-2 flex-1" />
                                          <span className="text-sm ml-2">{option.votes} votes</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  <span>{proposal.totalVotes} total votes</span>
                                </div>
                                
                                <div>
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  <span>
                                    {getTimeRemaining(proposal.endTime)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No proposals found</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="created">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No created proposals found</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="voted">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No voted proposals found</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="voting-power" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Voting Power Overview</CardTitle>
              <CardDescription>
                Your voting power across different campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Voting Power</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <div className="rounded-full bg-primary/10 p-4">
                          <VoteIcon className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-4xl font-bold">{governanceStats.totalVotingPower}</p>
                          <p className="text-sm text-muted-foreground">
                            Across {governanceStats.governedCampaigns} campaigns
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">NFT Badges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-4xl font-bold">12</p>
                          <p className="text-sm text-muted-foreground">
                            Total badges collected
                          </p>
                        </div>
                        
                        <Button variant="outline" asChild>
                          <Link href="/profile/badges">
                            <Medal className="h-4 w-4 mr-2" />
                            View Badges
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Voting Power by Campaign</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {governanceStats.activeCampaigns.map(campaign => (
                        <div key={campaign.id}>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h3 className="font-medium">{campaign.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {campaign.activeProposals} active proposal(s)
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-primary/10">
                              <VoteIcon className="h-4 w-4 mr-2" />
                              {campaign.userVotingPower} VP
                            </Badge>
                          </div>
                          
                          <div className="relative pt-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs text-muted-foreground">
                                Power Distribution
                              </div>
                              <div className="text-xs font-semibold text-primary">
                                {campaign.userVotingPower}/{governanceStats.totalVotingPower}
                              </div>
                            </div>
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-primary/20">
                              <div
                                style={{ width: `${(campaign.userVotingPower / governanceStats.totalVotingPower) * 100}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {governanceStats.activeCampaigns.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">No campaigns with voting power found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How to Increase Your Voting Power</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="rounded-full bg-green-100 p-2 mt-1">
                          <Trophy className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Support Campaigns</h3>
                          <p className="text-sm text-muted-foreground">
                            Back campaigns with higher tier contributions to receive more voting power in their governance.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="rounded-full bg-blue-100 p-2 mt-1">
                          <Medal className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Collect NFT Badges</h3>
                          <p className="text-sm text-muted-foreground">
                            Each NFT badge from campaign contributions grants you voting power in that campaign's governance.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="rounded-full bg-purple-100 p-2 mt-1">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Participate Actively</h3>
                          <p className="text-sm text-muted-foreground">
                            Create quality proposals and vote consistently to earn reputation and additional voting rights.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage; 