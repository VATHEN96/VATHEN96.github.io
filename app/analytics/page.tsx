'use client';

import { useState, useEffect } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { TrendingUp, Users, Coins, Award, Search, Filter, ArrowUpRight, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Navbar from '@/components/navbar';

export default function AnalyticsPage() {
  const { isWalletConnected, campaigns, fetchCampaigns } = useWowzaRush();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for analytics data
  const [platformStats, setPlatformStats] = useState({
    totalFundsRaised: 0,
    totalCampaigns: 0,
    totalContributors: 0,
    totalProposals: 0,
    avgContributionSize: 0,
    successRate: 0,
    topCategory: '',
    activeUsers: 0,
    currency: 'TELOS'  // Default currency
  });
  
  const [trendingCampaigns, setTrendingCampaigns] = useState([]);
  const [fundingOverTime, setFundingOverTime] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [governanceActivity, setGovernanceActivity] = useState([]);

  // Fallback data in case API fails
  const fallbackData = {
    platformStats: {
      totalFundsRaised: 127.45,
      totalCampaigns: 35,
      totalContributors: 1223,
      totalProposals: 87,
      avgContributionSize: 0.104,
      successRate: 72,
      topCategory: 'Technology',
      activeUsers: 542,
      currency: 'TELOS'
    },
    fundingOverTime: [
      { month: 'Jan', amount: 8.2 },
      { month: 'Feb', amount: 10.5 },
      { month: 'Mar', amount: 15.3 },
      { month: 'Apr', amount: 12.7 },
      { month: 'May', amount: 14.1 },
      { month: 'Jun', amount: 16.8 },
      { month: 'Jul', amount: 18.2 },
      { month: 'Aug', amount: 17.5 },
      { month: 'Sep', amount: 21.3 },
      { month: 'Oct', amount: 23.7 },
      { month: 'Nov', amount: 26.8 },
      { month: 'Dec', amount: 32.4 }
    ],
    categoryDistribution: [
      { name: 'Technology', value: 35, color: '#8884d8' },
      { name: 'Environment', value: 20, color: '#82ca9d' },
      { name: 'Arts', value: 15, color: '#ffc658' },
      { name: 'Education', value: 10, color: '#ff8042' },
      { name: 'Health', value: 10, color: '#0088fe' },
      { name: 'Other', value: 10, color: '#00C49F' }
    ],
    governanceActivity: [
      { month: 'Jan', proposals: 3, votes: 68 },
      { month: 'Feb', proposals: 4, votes: 83 },
      { month: 'Mar', proposals: 5, votes: 112 },
      { month: 'Apr', proposals: 4, votes: 97 },
      { month: 'May', proposals: 6, votes: 134 },
      { month: 'Jun', proposals: 5, votes: 108 },
      { month: 'Jul', proposals: 7, votes: 156 },
      { month: 'Aug', proposals: 8, votes: 172 },
      { month: 'Sep', proposals: 8, votes: 183 },
      { month: 'Oct', proposals: 10, votes: 214 },
      { month: 'Nov', proposals: 12, votes: 248 },
      { month: 'Dec', proposals: 15, votes: 293 }
    ],
    trendingCampaigns: [
      { id: '1', title: 'Decentralized Social Media Platform', category: 'Technology', fundingPercentage: 78, growth: 12, contributorsCount: 142 },
      { id: '2', title: 'Sustainable Ocean Cleanup Initiative', category: 'Environment', fundingPercentage: 92, growth: 23, contributorsCount: 267 },
      { id: '3', title: 'Community-Owned Renewable Energy', category: 'Energy', fundingPercentage: 65, growth: 8, contributorsCount: 89 },
      { id: '4', title: 'Decentralized Education Platform', category: 'Education', fundingPercentage: 42, growth: 15, contributorsCount: 76 },
      { id: '5', title: 'Mental Health Support DAO', category: 'Healthcare', fundingPercentage: 54, growth: 7, contributorsCount: 93 }
    ]
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading analytics data');
        
        // First, ensure we have the latest campaigns data
        if (!campaigns || campaigns.length === 0) {
          await fetchCampaigns();
        }
        
        // Try to fetch from API
        try {
          // Fetch platform stats
          const statsResponse = await fetch('/api/analytics');
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setPlatformStats(statsData.platformStats);
          } else {
            throw new Error('Failed to fetch platform stats');
          }
          
          // Fetch chart data
          const chartsResponse = await fetch('/api/analytics/charts');
          if (chartsResponse.ok) {
            const chartsData = await chartsResponse.json();
            setFundingOverTime(chartsData.fundingOverTime);
            setCategoryDistribution(chartsData.categoryDistribution);
            setGovernanceActivity(chartsData.governanceActivity);
            
            // Map trending campaigns to actual campaign data if possible
            const enrichedTrendingCampaigns = chartsData.trendingCampaigns.map(trendingCampaign => {
              const matchingCampaign = campaigns?.find(c => c.id === trendingCampaign.id);
              if (matchingCampaign) {
                return {
                  ...trendingCampaign,
                  title: matchingCampaign.title,
                  category: matchingCampaign.category,
                  // Calculate funding percentage from actual campaign data
                  fundingPercentage: Math.round((parseFloat(matchingCampaign.totalFunded) / parseFloat(matchingCampaign.goalAmount)) * 100)
                };
              }
              return trendingCampaign;
            });
            
            setTrendingCampaigns(enrichedTrendingCampaigns);
          } else {
            throw new Error('Failed to fetch chart data');
          }
        } catch (apiError) {
          console.error('API calls failed:', apiError);
          toast.error(`Failed to load data from API: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
          
          // Use fallback data
          setPlatformStats(fallbackData.platformStats);
          setFundingOverTime(fallbackData.fundingOverTime);
          setCategoryDistribution(fallbackData.categoryDistribution);
          setGovernanceActivity(fallbackData.governanceActivity);
          
          // If we have campaigns data, use it to enrich trending campaigns
          if (campaigns && campaigns.length > 0) {
            const enrichedTrendingCampaigns = fallbackData.trendingCampaigns.map((tc, index) => {
              if (index < campaigns.length) {
                const campaign = campaigns[index];
                return {
                  ...tc,
                  id: campaign.id,
                  title: campaign.title,
                  category: campaign.category,
                  fundingPercentage: Math.round((parseFloat(campaign.totalFunded) / parseFloat(campaign.goalAmount)) * 100)
                };
              }
              return tc;
            });
            setTrendingCampaigns(enrichedTrendingCampaigns);
          } else {
            setTrendingCampaigns(fallbackData.trendingCampaigns);
          }
        }
      } catch (error) {
        console.error('Error in loadData:', error);
        toast.error(`Failed to load analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Still use fallback data as a safety net
        setPlatformStats(fallbackData.platformStats);
        setFundingOverTime(fallbackData.fundingOverTime);
        setCategoryDistribution(fallbackData.categoryDistribution);
        setGovernanceActivity(fallbackData.governanceActivity);
        setTrendingCampaigns(fallbackData.trendingCampaigns);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [campaigns, fetchCampaigns]);

  // Filter trending campaigns based on search query
  const filteredCampaigns = trendingCampaigns.filter(campaign => 
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Platform Analytics</h1>
            <p className="text-muted-foreground mt-1">Comprehensive insights into WowzaRush platform performance</p>
          </div>
          
          {!isWalletConnected && (
            <Button className="mt-4 md:mt-0 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 border-2 border-black dark:border-white">
              Connect Wallet for Personalized Insights
            </Button>
          )}
        </div>

        {/* Platform Statistics Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-10 w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center">
                  <Coins className="h-4 w-4 mr-1" /> Total Funds Raised
                </CardDescription>
                <CardTitle className="text-3xl">{platformStats.totalFundsRaised.toLocaleString()} {platformStats.currency}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center">
                  <Users className="h-4 w-4 mr-1" /> Total Contributors
                </CardDescription>
                <CardTitle className="text-3xl">{platformStats.totalContributors.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-1" /> Active Campaigns
                </CardDescription>
                <CardTitle className="text-3xl">{platformStats.totalCampaigns.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center">
                  <Award className="h-4 w-4 mr-1" /> Governance Proposals
                </CardDescription>
                <CardTitle className="text-3xl">{platformStats.totalProposals.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid grid-cols-3 mb-8 bg-white dark:bg-black border-2 border-black dark:border-white">
            <TabsTrigger value="overview" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
              Platform Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
              Trending Campaigns
            </TabsTrigger>
            <TabsTrigger value="governance" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
              Governance
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funding Over Time Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Funding Over Time</CardTitle>
                    <CardDescription>Monthly fundraising in {platformStats.currency} across all campaigns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {fundingOverTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={fundingOverTime}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <CartesianGrid strokeDasharray="3 3" />
                          <Tooltip formatter={(value) => [`${value} ${platformStats.currency}`, 'Funding']} />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#8884d8"
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">No funding data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Category Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Categories</CardTitle>
                    <CardDescription>Distribution of campaigns by category</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    {categoryDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">No category data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Additional Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Performance Indicators</CardTitle>
                    <CardDescription>Important platform metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Average Contribution</p>
                        <p className="text-2xl font-bold">{platformStats.avgContributionSize.toFixed(2)} {platformStats.currency}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <p className="text-2xl font-bold">{platformStats.successRate}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Top Category</p>
                        <p className="text-2xl font-bold">{platformStats.topCategory || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">{platformStats.activeUsers.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Governance Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Governance Overview</CardTitle>
                    <CardDescription>Monthly proposals and votes activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {governanceActivity.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={governanceActivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="proposals" fill="#8884d8" name="Proposals" />
                          <Bar yAxisId="right" dataKey="votes" fill="#82ca9d" name="Votes" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">No governance data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          {/* Trending Campaigns Tab */}
          <TabsContent value="campaigns">
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filters
                </Button>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="flex justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-[250px]" />
                            <Skeleton className="h-4 w-[150px]" />
                          </div>
                          <Skeleton className="h-10 w-[100px]" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.length > 0 ? (
                    filteredCampaigns.map(campaign => (
                      <Card key={campaign.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2 mb-4 md:mb-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-lg">{campaign.title}</h3>
                                <Badge variant="outline">{campaign.category}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {campaign.contributorsCount} contributors
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  {campaign.growth}% this week
                                </div>
                                <div>
                                  {campaign.fundingPercentage}% funded
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/campaign/${campaign.id}`}>
                                <Button className="w-full md:w-auto" size="sm" variant="outline">
                                  View Campaign
                                </Button>
                              </Link>
                              <Link href={`/analytics/campaign/${campaign.id}`}>
                                <Button className="w-full md:w-auto" size="sm">
                                  View Analytics <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        {trendingCampaigns.length === 0 
                          ? "No campaigns available at the moment." 
                          : "No campaigns found matching your search."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Governance Activity Tab */}
          <TabsContent value="governance">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Governance Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Governance Activity</CardTitle>
                    <CardDescription>Monthly proposals and votes across all campaigns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {governanceActivity.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={governanceActivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="proposals" 
                            stroke="#8884d8" 
                            activeDot={{ r: 8 }} 
                            name="Proposals"
                            yAxisId="left"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="votes" 
                            stroke="#82ca9d" 
                            name="Votes"
                            yAxisId="right"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">No governance activity data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Recent Proposals - This would be fetched from real data in a complete implementation */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Governance Proposals</CardTitle>
                    <CardDescription>Latest proposals across all campaigns</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {governanceActivity.length > 0 ? (
                      // This is a placeholder for real proposal data that would be fetched from the API
                      [
                        { id: '1', title: 'Implement Multi-Chain Support', campaign: 'Decentralized Social Media Platform', status: 'active', votes: 234 },
                        { id: '2', title: 'Expand Ocean Cleanup to Southeast Asia', campaign: 'Sustainable Ocean Cleanup Initiative', status: 'passed', votes: 456 },
                        { id: '3', title: 'Add Solar Panel Integration', campaign: 'Community-Owned Renewable Energy', status: 'rejected', votes: 187 },
                        { id: '4', title: 'Partnership with Universities', campaign: 'Decentralized Education Platform', status: 'active', votes: 103 }
                      ].map(proposal => (
                        <div key={proposal.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{proposal.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {proposal.campaign}
                              </p>
                            </div>
                            <Badge variant={
                              proposal.status === 'passed' ? 'default' :
                              proposal.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm">
                            {proposal.votes} votes cast
                          </div>
                          <Button variant="link" className="px-0 mt-1 h-auto">
                            View Details
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">No recent proposals available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Voter participation section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Voter Participation Rate</CardTitle>
                    <CardDescription>Percentage of eligible voters that participate in governance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <span className="text-5xl font-bold">{Math.round(platformStats.totalContributors > 0 ? 
                        (platformStats.totalProposals / platformStats.totalContributors * 100) : 0)
                      }%</span>
                      <p className="text-muted-foreground mt-2">Overall participation rate</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 