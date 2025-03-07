'use client';

import { useState, useEffect } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, AlertCircle, ArrowRight, Link as LinkIcon, UnlinkIcon, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { OnChainMetric, MetricChartData, MilestoneProgress, LinkedProposal, CampaignAnalytics } from '@/services/AnalyticsService';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AnalyticsDashboardProps {
  campaignId: string;
}

export function AnalyticsDashboard({ campaignId }: AnalyticsDashboardProps) {
  const {
    getCampaignMetrics,
    getMetricChartData,
    getMilestonesWithProposals,
    getCampaignAnalytics,
    linkProposalToMilestone,
    unlinkProposalFromMilestone,
    getLinkableProposals,
    isWalletConnected
  } = useWowzaRush();

  // State
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<OnChainMetric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartData, setChartData] = useState<MetricChartData | null>(null);
  const [milestones, setMilestones] = useState<MilestoneProgress[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [linkableProposals, setLinkableProposals] = useState<Omit<LinkedProposal, 'impactDescription'>[]>([]);
  const [linkingMilestoneId, setLinkingMilestoneId] = useState<string>('');
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  const [impactDescription, setImpactDescription] = useState<string>('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Get analytics data
        const analyticsData = await getCampaignAnalytics(campaignId);
        setAnalytics(analyticsData);
        
        // Get metrics
        const metricsData = await getCampaignMetrics(campaignId);
        setMetrics(metricsData);
        
        if (metricsData.length > 0) {
          setSelectedMetric(metricsData[0].id);
          const chartData = await getMetricChartData(campaignId, metricsData[0].id, timeframe);
          setChartData(chartData);
        }
        
        // Get milestones with linked proposals
        const milestonesData = await getMilestonesWithProposals(campaignId);
        setMilestones(milestonesData);
        
        // Get linkable proposals
        const proposalsData = await getLinkableProposals(campaignId);
        setLinkableProposals(proposalsData);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [campaignId]);

  // Load chart data when metric or timeframe changes
  useEffect(() => {
    async function loadChartData() {
      if (!selectedMetric) return;
      
      try {
        const data = await getMetricChartData(campaignId, selectedMetric, timeframe);
        setChartData(data);
      } catch (error) {
        console.error('Error loading chart data:', error);
        toast.error('Failed to load chart data');
      }
    }
    
    loadChartData();
  }, [campaignId, selectedMetric, timeframe]);

  // Handle linking a proposal to milestone
  const handleLinkProposal = async () => {
    if (!selectedProposalId || !linkingMilestoneId || !impactDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const success = await linkProposalToMilestone(
        selectedProposalId,
        linkingMilestoneId,
        impactDescription
      );
      
      if (success) {
        toast.success('Proposal linked to milestone successfully');
        setLinkDialogOpen(false);
        
        // Refresh milestones data
        const milestonesData = await getMilestonesWithProposals(campaignId);
        setMilestones(milestonesData);
        
        // Refresh linkable proposals
        const proposalsData = await getLinkableProposals(campaignId);
        setLinkableProposals(proposalsData);
        
        // Reset form
        setSelectedProposalId('');
        setImpactDescription('');
      }
    } catch (error) {
      console.error('Error linking proposal:', error);
      toast.error('Failed to link proposal to milestone');
    }
  };

  // Handle unlinking a proposal from milestone
  const handleUnlinkProposal = async (milestoneId: string, proposalId: string) => {
    try {
      const success = await unlinkProposalFromMilestone(campaignId, milestoneId, proposalId);
      
      if (success) {
        toast.success('Proposal unlinked from milestone');
        
        // Refresh milestones data
        const milestonesData = await getMilestonesWithProposals(campaignId);
        setMilestones(milestonesData);
        
        // Refresh linkable proposals
        const proposalsData = await getLinkableProposals(campaignId);
        setLinkableProposals(proposalsData);
      }
    } catch (error) {
      console.error('Error unlinking proposal:', error);
      toast.error('Failed to unlink proposal');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="milestones">Milestones & Governance</TabsTrigger>
        </TabsList>
        
        {/* Performance Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Contributors</CardTitle>
                    <CardDescription>Unique wallets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics.performance.contributorCount}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {(analytics.performance.contributorChangePercent ?? 0) > 0 ? (
                        <span className="text-green-500 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          +{analytics.performance.contributorChangePercent ?? 0}% from last week
                        </span>
                      ) : (
                        <span className="text-red-500">
                          {analytics.performance.contributorChangePercent ?? 0}% from last week
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Funds Raised</CardTitle>
                    <CardDescription>Current total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics.performance.fundingAmount || "0"} ETH</div>
                    <div className="flex items-center mt-2">
                      <Progress value={analytics.performance.fundingProgress} className="h-2" />
                      <span className="ml-2 text-sm">{analytics.performance.fundingProgress}%</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Governance</CardTitle>
                    <CardDescription>Proposals & voting</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Proposals</div>
                        <div className="text-xl font-bold">{analytics.governance?.proposalCount || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Votes Cast</div>
                        <div className="text-xl font-bold">{analytics.governance?.voteCount || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Participation</div>
                        <div className="text-xl font-bold">{analytics.performance.participationRate}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          
          {/* Metric Chart */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Performance Over Time</CardTitle>
                  <CardDescription>Track on-chain metrics for this campaign</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {metrics.map(metric => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chartData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.data}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip 
                      formatter={(value: any) => [value, chartData.metricName]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fillOpacity={1}
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available for this metric</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Milestones & Governance Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Milestones & Linked Governance</CardTitle>
              <CardDescription>
                Track milestone progress and view linked governance proposals that impact each milestone
              </CardDescription>
            </CardHeader>
            <CardContent>
              {milestones.length > 0 ? (
                <div className="space-y-6">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="space-y-2 border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium flex items-center">
                          {milestone.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            milestone.status === 'at_risk' ? (
                              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2" />
                            )
                          )}
                          {milestone.title}
                        </h3>
                        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              disabled={!isWalletConnected || linkableProposals.length === 0}
                              onClick={() => setLinkingMilestoneId(milestone.id)}
                            >
                              <LinkIcon className="h-4 w-4" />
                              Link Proposal
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Link Governance Proposal to Milestone</DialogTitle>
                              <DialogDescription>
                                Connect a governance proposal to this milestone to show how it impacts the milestone's delivery or requirements.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <h4 className="font-medium">Milestone</h4>
                                <p className="text-sm text-muted-foreground">{milestone.title}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium">Select Proposal</h4>
                                <Select value={selectedProposalId} onValueChange={setSelectedProposalId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a proposal" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {linkableProposals.map(proposal => (
                                      <SelectItem key={proposal.id} value={proposal.id}>
                                        {proposal.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-medium">Impact Description</h4>
                                <Textarea 
                                  placeholder="Describe how this proposal impacts the milestone..."
                                  value={impactDescription}
                                  onChange={(e) => setImpactDescription(e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
                              <Button onClick={handleLinkProposal}>Link Proposal</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Due: {formatDate(milestone.dueDate)}
                        </span>
                        <Badge variant={
                          milestone.status === 'completed' ? 'default' :
                          milestone.status === 'at_risk' ? 'destructive' : 'secondary'
                        }>
                          {milestone.status === 'completed' ? 'Completed' :
                          milestone.status === 'at_risk' ? 'At Risk' : 'In Progress'}
                        </Badge>
                      </div>
                      
                      <Progress value={milestone.progressPercentage} className="h-2" />
                      
                      {/* Description */}
                      <p className="text-sm text-muted-foreground mt-2">{milestone.description}</p>
                      
                      {/* Linked Proposals */}
                      {milestone.linkedProposals.length > 0 ? (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Linked Governance Proposals</h4>
                          <div className="space-y-3">
                            {milestone.linkedProposals.map(proposal => (
                              <Card key={proposal.id} className="bg-accent/50">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                      <h5 className="font-medium">{proposal.title}</h5>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={
                                          proposal.status === 'passed' ? 'default' :
                                          proposal.status === 'rejected' ? 'destructive' : 'secondary'
                                        } className="text-xs">
                                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          Proposed: {formatDate(proposal.proposedDate)}
                                        </span>
                                      </div>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleUnlinkProposal(milestone.id, proposal.id)}
                                    >
                                      <UnlinkIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  {/* Impact Description */}
                                  <div className="mt-2 p-2 bg-background/50 rounded-md">
                                    <h6 className="text-xs font-medium">Impact on Milestone:</h6>
                                    <p className="text-sm mt-1">{proposal.impactDescription}</p>
                                  </div>
                                  
                                  {/* View Full Proposal Button */}
                                  <div className="mt-3 flex justify-end">
                                    <Button variant="link" size="sm" className="h-6 p-0">
                                      View Proposal <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-muted-foreground italic">
                          No governance proposals linked to this milestone yet.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No milestones found for this campaign</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 