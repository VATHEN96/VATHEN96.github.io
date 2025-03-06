'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWowzaRush } from '@/context/wowzarushContext';
import {
  Shield,
  AlertTriangle,
  Flag,
  Settings,
  Filter,
  Search,
  RefreshCw,
  Star,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { RiskAssessment } from '@/components/campaign/RiskAssessment';

export default function RiskManagementPage() {
  const router = useRouter();
  const {
    isWalletConnected,
    userProfile,
    getCampaign,
    getCampaignRiskScore,
    getCampaignReports,
    getSpamRules,
    updateSpamRules
  } = useWowzaRush();

  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [reportedFilter, setReportedFilter] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [spamRules, setSpamRules] = useState<any>(null);
  const [newSpamRules, setNewSpamRules] = useState<any>(null);

  // Check if user is admin
  useEffect(() => {
    if (isWalletConnected && userProfile) {
      const isAdmin = userProfile.role === 'admin';
      if (!isAdmin) {
        toast.error('You do not have permission to access this page');
        router.push('/');
      }
    }
  }, [isWalletConnected, userProfile, router]);

  // Load campaigns with risk scores
  useEffect(() => {
    const loadCampaigns = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would fetch all campaigns
        // For demo purposes, using mock data
        const mockCampaigns = [
          {
            id: 'camp_1',
            title: 'Innovative Tech Product',
            creatorName: 'TechFounder123',
            creatorAddress: '0x1234...abcd',
            fundingGoal: 50,
            fundingRaised: 12.5,
            createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
            endDate: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days from now
            status: 'active'
          },
          {
            id: 'camp_2',
            title: 'Sustainable Fashion Line',
            creatorName: 'EcoDesigner',
            creatorAddress: '0x5678...efgh',
            fundingGoal: 30,
            fundingRaised: 28.5,
            createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000, // 25 days ago
            endDate: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days from now
            status: 'active'
          },
          {
            id: 'camp_3',
            title: 'Suspicious Gaming Project',
            creatorName: 'NewCreator999',
            creatorAddress: '0x9012...ijkl',
            fundingGoal: 100,
            fundingRaised: 12,
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
            endDate: Date.now() + 28 * 24 * 60 * 60 * 1000, // 28 days from now
            status: 'active'
          }
        ];

        // Enhance campaigns with risk scores and report counts
        const enhancedCampaigns = await Promise.all(mockCampaigns.map(async (campaign) => {
          try {
            const riskScore = await getCampaignRiskScore(campaign.id);
            const reports = await getCampaignReports(campaign.id);
            
            return {
              ...campaign,
              riskScore,
              reportCount: reports.length,
              unresolvedReportCount: reports.filter(r => !r.resolved).length
            };
          } catch (error) {
            console.error(`Error fetching data for campaign ${campaign.id}:`, error);
            return {
              ...campaign,
              riskScore: { score: 0, level: 'unknown', factors: {} },
              reportCount: 0,
              unresolvedReportCount: 0
            };
          }
        }));

        setCampaigns(enhancedCampaigns);
        setFilteredCampaigns(enhancedCampaigns);
        
        // Load spam rules
        const rules = getSpamRules();
        setSpamRules(rules);
        setNewSpamRules(rules);
      } catch (error) {
        console.error('Error loading campaigns:', error);
        toast.error('Failed to load campaigns');
      } finally {
        setIsLoading(false);
      }
    };

    if (isWalletConnected && userProfile?.role === 'admin') {
      loadCampaigns();
    }
  }, [isWalletConnected, userProfile, getCampaignRiskScore, getCampaignReports, getSpamRules]);

  // Filter campaigns based on search query and filters
  useEffect(() => {
    if (!campaigns.length) return;

    let filtered = [...campaigns];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        campaign => 
          campaign.title.toLowerCase().includes(query) ||
          campaign.creatorName.toLowerCase().includes(query) ||
          campaign.creatorAddress.toLowerCase().includes(query)
      );
    }

    // Apply risk level filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(
        campaign => campaign.riskScore?.level === riskFilter
      );
    }

    // Apply reported filter
    if (reportedFilter !== null) {
      filtered = filtered.filter(
        campaign => reportedFilter 
          ? campaign.unresolvedReportCount > 0 
          : campaign.unresolvedReportCount === 0
      );
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, searchQuery, riskFilter, reportedFilter]);

  const handleSaveSpamRules = async () => {
    try {
      const success = await updateSpamRules(newSpamRules);
      if (success) {
        setSpamRules(newSpamRules);
        toast.success('Spam prevention rules updated successfully');
      }
    } catch (error) {
      console.error('Error updating spam rules:', error);
      toast.error('Failed to update spam prevention rules');
    }
  };

  const handleRuleChange = (key: string, value: number) => {
    setNewSpamRules({
      ...newSpamRules,
      [key]: value
    });
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">High</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  // Not admin or not connected
  if (!isWalletConnected || (userProfile && userProfile.role !== 'admin')) {
    return (
      <div className="container py-16 text-center">
        <AlertCircle className="h-16 w-16 mx-auto mb-6 text-red-500" />
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You don't have permission to access this page. Please connect with an admin wallet.
        </p>
        <Button asChild>
          <a href="/">Go Back Home</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Risk Management</h1>
          <p className="text-muted-foreground">Monitor and manage campaign risks, reports, and fraud prevention</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Flag className="mr-2 h-4 w-4" />
            High-Risk Campaigns
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Spam Prevention Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search campaigns or creators..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Risk Level" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="critical">Critical Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select 
                    value={reportedFilter === null ? 'all' : reportedFilter ? 'reported' : 'clean'}
                    onValueChange={(value) => {
                      if (value === 'all') setReportedFilter(null);
                      else if (value === 'reported') setReportedFilter(true);
                      else setReportedFilter(false);
                    }}
                  >
                    <SelectTrigger>
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Report Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      <SelectItem value="reported">Has Unresolved Reports</SelectItem>
                      <SelectItem value="clean">No Unresolved Reports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Campaign Risk Overview</CardTitle>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                {filteredCampaigns.length} campaigns found matching your criteria
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-32">
                        No campaigns found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Created {new Date(campaign.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{campaign.creatorName}</div>
                            <div className="text-xs text-muted-foreground">
                              {campaign.creatorAddress.substring(0, 6)}...{campaign.creatorAddress.substring(campaign.creatorAddress.length - 4)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRiskLevelBadge(campaign.riskScore?.level || 'unknown')}
                            <span className="text-xs text-muted-foreground">
                              {campaign.riskScore?.score || 0}/100
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign.unresolvedReportCount > 0 ? (
                            <div className="flex items-center">
                              <Badge variant="destructive" className="mr-2">
                                {campaign.unresolvedReportCount} unresolved
                              </Badge>
                            </div>
                          ) : campaign.reportCount > 0 ? (
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                All resolved
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No reports</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${Math.min((campaign.fundingRaised / campaign.fundingGoal) * 100, 100)}%` }} 
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((campaign.fundingRaised / campaign.fundingGoal) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog open={selectedCampaignId === campaign.id} onOpenChange={(open) => {
                              if (open) setSelectedCampaignId(campaign.id);
                              else setSelectedCampaignId(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Risk Assessment: {campaign.title}</DialogTitle>
                                  <DialogDescription>
                                    Review and manage risk factors and reports for this campaign
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="py-4 max-h-[80vh] overflow-y-auto">
                                  <RiskAssessment
                                    campaignId={campaign.id}
                                    isAdmin={true}
                                  />
                                </div>
                                
                                <DialogFooter className="flex justify-between">
                                  <div>
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={`/campaign/${campaign.id}`} target="_blank" rel="noopener noreferrer">
                                        View Campaign
                                      </a>
                                    </Button>
                                  </div>
                                  <Button onClick={() => setSelectedCampaignId(null)}>
                                    Close
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/campaign/${campaign.id}`} target="_blank" rel="noopener noreferrer">
                                <Star className="mr-2 h-4 w-4" />
                                View
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spam Prevention Settings</CardTitle>
              <CardDescription>
                Configure thresholds and rules to prevent spam and abuse on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!spamRules ? (
                <div className="py-8 text-center">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Activity Limits</h3>
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="campaignsPerDay">Campaigns per day: {newSpamRules.campaignsPerDay}</Label>
                          <span className="text-sm text-muted-foreground">{newSpamRules.campaignsPerDay}</span>
                        </div>
                        <Slider
                          id="campaignsPerDay"
                          min={1}
                          max={10}
                          step={1}
                          value={[newSpamRules.campaignsPerDay]}
                          onValueChange={(value) => handleRuleChange('campaignsPerDay', value[0])}
                        />
                        <p className="text-sm text-muted-foreground">
                          Maximum number of campaigns a user can create in a 24-hour period
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="commentsPerHour">Comments per hour: {newSpamRules.commentsPerHour}</Label>
                          <span className="text-sm text-muted-foreground">{newSpamRules.commentsPerHour}</span>
                        </div>
                        <Slider
                          id="commentsPerHour"
                          min={5}
                          max={100}
                          step={5}
                          value={[newSpamRules.commentsPerHour]}
                          onValueChange={(value) => handleRuleChange('commentsPerHour', value[0])}
                        />
                        <p className="text-sm text-muted-foreground">
                          Maximum number of comments a user can post in a 1-hour period
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="reportsPerDay">Reports per day: {newSpamRules.reportsPerDay}</Label>
                          <span className="text-sm text-muted-foreground">{newSpamRules.reportsPerDay}</span>
                        </div>
                        <Slider
                          id="reportsPerDay"
                          min={1}
                          max={50}
                          step={1}
                          value={[newSpamRules.reportsPerDay]}
                          onValueChange={(value) => handleRuleChange('reportsPerDay', value[0])}
                        />
                        <p className="text-sm text-muted-foreground">
                          Maximum number of reports a user can submit in a 24-hour period
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">User Trust Requirements</h3>
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="minimumAccountAge">Minimum account age (days): {newSpamRules.minimumAccountAge}</Label>
                          <span className="text-sm text-muted-foreground">{newSpamRules.minimumAccountAge}</span>
                        </div>
                        <Slider
                          id="minimumAccountAge"
                          min={0}
                          max={30}
                          step={1}
                          value={[newSpamRules.minimumAccountAge]}
                          onValueChange={(value) => handleRuleChange('minimumAccountAge', value[0])}
                        />
                        <p className="text-sm text-muted-foreground">
                          Minimum age (in days) required for an account to create campaigns
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="minimumVerificationLevel">Verification level: {newSpamRules.minimumVerificationLevel}</Label>
                          <span className="text-sm text-muted-foreground">
                            {
                              newSpamRules.minimumVerificationLevel === 0 ? 'None' :
                              newSpamRules.minimumVerificationLevel === 1 ? 'Email' :
                              newSpamRules.minimumVerificationLevel === 2 ? 'Phone' : 'ID'
                            }
                          </span>
                        </div>
                        <Slider
                          id="minimumVerificationLevel"
                          min={0}
                          max={3}
                          step={1}
                          value={[newSpamRules.minimumVerificationLevel]}
                          onValueChange={(value) => handleRuleChange('minimumVerificationLevel', value[0])}
                        />
                        <p className="text-sm text-muted-foreground">
                          Minimum verification level required to create campaigns (0=None, 1=Email, 2=Phone, 3=ID)
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="minimumWalletBalance">Minimum wallet balance (ETH): {newSpamRules.minimumWalletBalance}</Label>
                          <span className="text-sm text-muted-foreground">{newSpamRules.minimumWalletBalance} ETH</span>
                        </div>
                        <Slider
                          id="minimumWalletBalance"
                          min={0}
                          max={1}
                          step={0.01}
                          value={[newSpamRules.minimumWalletBalance]}
                          onValueChange={(value) => handleRuleChange('minimumWalletBalance', value[0])}
                        />
                        <p className="text-sm text-muted-foreground">
                          Minimum ETH balance required to create campaigns
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setNewSpamRules(spamRules)}
              >
                Reset to Default
              </Button>
              <Button 
                onClick={handleSaveSpamRules}
                disabled={JSON.stringify(spamRules) === JSON.stringify(newSpamRules)}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 