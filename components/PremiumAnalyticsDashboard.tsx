'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  BarChart,
  PieChart,
  LineChart,
  Download,
  Lock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useBlockchainService } from '@/hooks/useBlockchainService';

interface PremiumAnalyticsDashboardProps {
  campaignId: string;
  isPremiumUser: boolean;
}

const PremiumAnalyticsDashboard: React.FC<PremiumAnalyticsDashboardProps> = ({
  campaignId,
  isPremiumUser = false,
}) => {
  const { toast } = useToast();
  const { blockchainService } = useBlockchainService();
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  // Load analytics data based on campaign ID
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!campaignId) return;
      
      try {
        setLoading(true);
        
        // In a real implementation, this would fetch actual analytics data
        // from the blockchain service or a dedicated analytics API
        // Simulating data fetch with timeout
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock data for demonstration
        const mockData = {
          overview: {
            totalRaised: "125000",
            investorCount: 87,
            avgInvestment: "1436.78",
            conversionRate: "4.2",
            growthRate: "12.3"
          },
          investors: {
            newInvestors: 23,
            returningInvestors: 64,
            demographicBreakdown: [
              { group: "Americas", percentage: 45 },
              { group: "Europe", percentage: 30 },
              { group: "Asia", percentage: 20 },
              { group: "Other", percentage: 5 }
            ],
            retentionRate: "78.4%"
          },
          funding: {
            dailyTrend: [
              { date: "2023-05-01", amount: 12500 },
              { date: "2023-05-02", amount: 8700 },
              { date: "2023-05-03", amount: 14300 },
              { date: "2023-05-04", amount: 11200 },
              { date: "2023-05-05", amount: 16800 },
              { date: "2023-05-06", amount: 9500 },
              { date: "2023-05-07", amount: 17600 }
            ],
            projectedFunding: "210000",
            timeToGoal: "18 days",
            topContributors: [
              { address: "0x1234...5678", amount: "15000" },
              { address: "0x8765...4321", amount: "12000" },
              { address: "0x5678...1234", amount: "10000" }
            ]
          },
          engagement: {
            pageViews: 2450,
            avgTimeOnPage: "3:45",
            bounceRate: "32%",
            socialShares: 187,
            referralSources: [
              { source: "Twitter", count: 820 },
              { source: "Discord", count: 560 },
              { source: "Direct", count: 450 },
              { source: "Telegram", count: 340 },
              { source: "Other", count: 280 }
            ]
          },
          predictions: {
            fundingProbability: "92%",
            estimatedCompletion: "2023-05-25",
            riskFactors: [
              "Market volatility",
              "Competing projects",
              "Regulatory changes"
            ],
            recommendedActions: [
              "Increase social media engagement",
              "Host an AMA session",
              "Highlight recent milestones"
            ]
          }
        };
        
        setAnalyticsData(mockData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast({
          title: "Error loading analytics",
          description: "Failed to load analytics data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [campaignId, toast]);

  // Function to export analytics data
  const handleExportData = (format: 'csv' | 'pdf' | 'json') => {
    toast({
      title: "Export initiated",
      description: `Analytics data is being exported in ${format.toUpperCase()} format.`
    });
    
    // In a real implementation, this would trigger an actual export process
  };
  
  // Render premium-locked content for non-premium users
  if (!isPremiumUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-dashed border-2">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Advanced Analytics</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Upgrade to a premium plan to access detailed analytics for your campaign,
                including investor demographics, funding predictions, and more.
              </p>
              <Button className="mt-4">Upgrade to Premium</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
          <p className="text-muted-foreground">
            Advanced insights and metrics for your funding campaign
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => handleExportData('csv')}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportData('pdf')}>
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportData('json')}>
            <Download className="h-4 w-4 mr-2" /> JSON
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <div className="flex items-end gap-1">
                  <h3 className="text-2xl font-bold">{analyticsData.overview.totalRaised}</h3>
                  <span className="text-sm mb-1">TLOS</span>
                </div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+{analyticsData.overview.growthRate}%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Investors</p>
                <h3 className="text-2xl font-bold">{analyticsData.overview.investorCount}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+{analyticsData.investors.newInvestors}</span>
              <span className="text-muted-foreground ml-1">new this week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Investment</p>
                <div className="flex items-end gap-1">
                  <h3 className="text-2xl font-bold">{analyticsData.overview.avgInvestment}</h3>
                  <span className="text-sm mb-1">TLOS</span>
                </div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-muted-foreground">Per investor</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <h3 className="text-2xl font-bold">{analyticsData.overview.conversionRate}%</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-muted-foreground">Visitors to investors</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="funding" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="funding" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Daily Funding Trend
                </CardTitle>
                <CardDescription>
                  Last 7 days of campaign funding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full bg-muted/30 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Chart visualization would go here</p>
                  {/* In a real implementation, this would be a chart component */}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2" />
                  Funding Projections
                </CardTitle>
                <CardDescription>
                  Estimated campaign performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Projected Total</p>
                    <div className="flex items-end">
                      <h3 className="text-2xl font-bold">{analyticsData.funding.projectedFunding}</h3>
                      <span className="text-sm ml-1 mb-1">TLOS</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full mt-2">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${(parseInt(analyticsData.overview.totalRaised) / parseInt(analyticsData.funding.projectedFunding)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analyticsData.overview.totalRaised} of {analyticsData.funding.projectedFunding} TLOS
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Completion</p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{analyticsData.funding.timeToGoal}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Top Contributors</p>
                    <ul className="space-y-2">
                      {analyticsData.funding.topContributors.map((contributor: any, index: number) => (
                        <li key={index} className="flex items-center justify-between">
                          <span className="text-sm truncate max-w-[150px]">{contributor.address}</span>
                          <Badge variant="outline">{contributor.amount} TLOS</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="investors" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Investor Demographics
                </CardTitle>
                <CardDescription>
                  Regional distribution of investors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full bg-muted/30 rounded-md flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">Demographics chart would go here</p>
                  {/* In a real implementation, this would be a chart component */}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {analyticsData.investors.demographicBreakdown.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.group}</span>
                      <Badge variant="outline">{item.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Investor Retention
                </CardTitle>
                <CardDescription>
                  New vs returning investor analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md text-center">
                      <p className="text-sm text-muted-foreground mb-1">New Investors</p>
                      <p className="text-2xl font-bold">{analyticsData.investors.newInvestors}</p>
                    </div>
                    <div className="p-4 border rounded-md text-center">
                      <p className="text-sm text-muted-foreground mb-1">Returning</p>
                      <p className="text-2xl font-bold">{analyticsData.investors.returningInvestors}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Retention Rate</p>
                    <div className="flex items-center">
                      <div className="h-2 w-full bg-muted rounded-full">
                        <div 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{ width: analyticsData.investors.retentionRate }}
                        ></div>
                      </div>
                      <span className="ml-2 font-medium">{analyticsData.investors.retentionRate}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Investor Insights</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="bg-green-100 text-green-800 p-1 rounded-full mr-2">•</span>
                        <span>Most active time: 18:00-22:00 UTC</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 text-blue-800 p-1 rounded-full mr-2">•</span>
                        <span>Average wallet age: 1.8 years</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-purple-100 text-purple-800 p-1 rounded-full mr-2">•</span>
                        <span>87% have invested in similar projects</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="engagement" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Engagement Metrics</CardTitle>
              <CardDescription>
                How users are interacting with your campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Page Views</p>
                  <p className="text-2xl font-bold">{analyticsData.engagement.pageViews}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Avg. Time on Page</p>
                  <p className="text-2xl font-bold">{analyticsData.engagement.avgTimeOnPage}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Bounce Rate</p>
                  <p className="text-2xl font-bold">{analyticsData.engagement.bounceRate}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Social Shares</p>
                  <p className="text-2xl font-bold">{analyticsData.engagement.socialShares}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Referral Sources</h3>
                {analyticsData.engagement.referralSources.map((source: any, index: number) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{source.source}</span>
                      <span className="text-sm">{source.count} visitors</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ 
                          width: `${(source.count / analyticsData.engagement.pageViews) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="predictions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Campaign Predictions</CardTitle>
              <CardDescription>
                Data-driven insights to optimize your campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Funding Probability</p>
                  <p className="text-2xl font-bold text-green-600">{analyticsData.predictions.fundingProbability}</p>
                  <p className="text-xs text-muted-foreground mt-1">Likelihood of reaching target</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Completion</p>
                  <p className="text-2xl font-bold">{analyticsData.predictions.estimatedCompletion}</p>
                  <p className="text-xs text-muted-foreground mt-1">Projected date to reach goal</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Optimal Price Point</p>
                  <p className="text-2xl font-bold">2,500 TLOS</p>
                  <p className="text-xs text-muted-foreground mt-1">Suggested minimum investment</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Risk Factors</h3>
                  <ul className="space-y-2">
                    {analyticsData.predictions.riskFactors.map((factor: string, index: number) => (
                      <li key={index} className="flex items-center p-2 bg-red-50 rounded-md">
                        <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                        <span className="text-sm">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Recommended Actions</h3>
                  <ul className="space-y-2">
                    {analyticsData.predictions.recommendedActions.map((action: string, index: number) => (
                      <li key={index} className="flex items-center p-2 bg-green-50 rounded-md">
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-sm">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="milestones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Milestone Tracking</CardTitle>
              <CardDescription>
                Progress and timeline of campaign milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative pl-8 pb-8 border-l border-muted">
                  <div className="absolute -left-2 top-0">
                    <div className="h-4 w-4 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mb-1">
                    <Badge variant="outline" className="mb-2">Completed</Badge>
                    <h3 className="text-lg font-medium">Initial fundraising goal</h3>
                    <p className="text-sm text-muted-foreground">May 1, 2023</p>
                  </div>
                  <p className="text-sm mt-2">Raised 50,000 TLOS in initial seed funding round</p>
                </div>
                
                <div className="relative pl-8 pb-8 border-l border-muted">
                  <div className="absolute -left-2 top-0">
                    <div className="h-4 w-4 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mb-1">
                    <Badge variant="outline" className="mb-2">Completed</Badge>
                    <h3 className="text-lg font-medium">MVP development</h3>
                    <p className="text-sm text-muted-foreground">May 15, 2023</p>
                  </div>
                  <p className="text-sm mt-2">Completed the minimum viable product development</p>
                </div>
                
                <div className="relative pl-8 pb-8 border-l border-muted">
                  <div className="absolute -left-2 top-0">
                    <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                  </div>
                  <div className="mb-1">
                    <Badge variant="outline" className="mb-2">In Progress</Badge>
                    <h3 className="text-lg font-medium">Beta testing phase</h3>
                    <p className="text-sm text-muted-foreground">Est. June 1, 2023</p>
                  </div>
                  <p className="text-sm mt-2">Launching beta version to early adopters</p>
                  <div className="mt-2">
                    <div className="w-full bg-muted h-2 rounded-full">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">65% complete</p>
                  </div>
                </div>
                
                <div className="relative pl-8 pb-8 border-l border-muted">
                  <div className="absolute -left-2 top-0">
                    <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                  </div>
                  <div className="mb-1">
                    <Badge variant="outline" className="mb-2">Upcoming</Badge>
                    <h3 className="text-lg font-medium">Public launch</h3>
                    <p className="text-sm text-muted-foreground">Est. July 15, 2023</p>
                  </div>
                  <p className="text-sm mt-2">Official public launch and marketing campaign</p>
                </div>
                
                <div className="relative pl-8">
                  <div className="absolute -left-2 top-0">
                    <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                  </div>
                  <div className="mb-1">
                    <Badge variant="outline" className="mb-2">Upcoming</Badge>
                    <h3 className="text-lg font-medium">Series A funding</h3>
                    <p className="text-sm text-muted-foreground">Est. September 1, 2023</p>
                  </div>
                  <p className="text-sm mt-2">Begin Series A funding round targeting 200,000 TLOS</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PremiumAnalyticsDashboard; 