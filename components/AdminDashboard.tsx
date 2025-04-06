'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  UserCog,
  Users,
  PieChart,
  Settings,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  Layers,
  RefreshCw
} from 'lucide-react';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { useToast } from '@/components/ui/use-toast';

interface AdminDashboardProps {
  isAdmin: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAdmin = false
}) => {
  const { toast } = useToast();
  const { blockchainService } = useBlockchainService();
  const [loading, setLoading] = useState<boolean>(true);
  const [platformData, setPlatformData] = useState<any>(null);
  const [transactionFee, setTransactionFee] = useState<string>('1.00');
  const [milestoneFee, setMilestoneFee] = useState<string>('0.50');
  const [useTokenDiscounts, setUseTokenDiscounts] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Load platform data
  useEffect(() => {
    const fetchPlatformData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would fetch actual data from the blockchain
        // Simulating data fetch with timeout
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock data for demonstration
        const mockData = {
          platform: {
            totalRevenue: "25670.45",
            activeUsers: 1245,
            pendingCampaigns: 12,
            tokenHolders: 876,
            totalValueLocked: "1250450.34",
            feeCollected: "15750.23",
            revenueGrowth: "12.8",
            campaignsCreatedThisMonth: 87
          },
          fees: {
            transactionFee: "1.00", // 1% (in percentage)
            milestoneFee: "0.50",   // 0.5% (in percentage)
            useTokenDiscounts: true,
            latestFeesCollected: [
              { date: "2023-07-15", amount: "1245.56", type: "Transaction" },
              { date: "2023-07-14", amount: "876.32", type: "Milestone" },
              { date: "2023-07-13", amount: "1120.45", type: "Transaction" },
              { date: "2023-07-12", amount: "754.23", type: "Transaction" },
              { date: "2023-07-11", amount: "456.78", type: "Milestone" }
            ]
          },
          users: {
            premiumUsers: 143,
            standardUsers: 1102,
            totalStakedAmount: "456780.45",
            recentUsers: [
              { address: "0xabc...123", joined: "2023-07-15", campaigns: 2, premium: true },
              { address: "0xdef...456", joined: "2023-07-14", campaigns: 0, premium: false },
              { address: "0xghi...789", joined: "2023-07-13", campaigns: 5, premium: true },
              { address: "0xjkl...012", joined: "2023-07-12", campaigns: 1, premium: false },
              { address: "0xmno...345", joined: "2023-07-11", campaigns: 3, premium: true }
            ]
          },
          security: {
            lastAudit: "2023-06-01",
            securityIssues: 0,
            auditorName: "CertiK",
            auditReport: "https://certik.com/reports/wowzarush",
            bugBountyStatus: "Active",
            bugBountyPool: "50000",
            totalBugsReported: 12,
            criticalIssues: 0
          }
        };
        
        setPlatformData(mockData);
        setTransactionFee(mockData.fees.transactionFee);
        setMilestoneFee(mockData.fees.milestoneFee);
        setUseTokenDiscounts(mockData.fees.useTokenDiscounts);
      } catch (error) {
        console.error("Error fetching platform data:", error);
        toast({
          title: "Error loading admin data",
          description: "Failed to load platform administration data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isAdmin) {
      fetchPlatformData();
    }
  }, [isAdmin, toast]);

  // Function to update platform fees
  const handleUpdateFees = async () => {
    try {
      setLoading(true);
      
      // Check fee values
      const txFee = parseFloat(transactionFee);
      const mileFee = parseFloat(milestoneFee);
      
      if (isNaN(txFee) || txFee < 0 || txFee > 10) {
        toast({
          title: "Invalid transaction fee",
          description: "Transaction fee must be between 0% and 10%",
          variant: "destructive"
        });
        return;
      }
      
      if (isNaN(mileFee) || mileFee < 0 || mileFee > 5) {
        toast({
          title: "Invalid milestone fee",
          description: "Milestone fee must be between 0% and 5%",
          variant: "destructive"
        });
        return;
      }
      
      // In a real implementation, this would call the blockchain service
      // to update the fees on the smart contract
      // Simulating blockchain transaction with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Fees updated successfully",
        description: `Transaction fee: ${transactionFee}%, Milestone fee: ${milestoneFee}%`,
      });
      
    } catch (error: any) {
      toast({
        title: "Failed to update fees",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle token discounts
  const handleToggleTokenDiscounts = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call the blockchain service
      // to toggle token discounts on the smart contract
      // Simulating blockchain transaction with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUseTokenDiscounts(!useTokenDiscounts);
      
      toast({
        title: "Token discounts updated",
        description: `Token discounts are now ${!useTokenDiscounts ? 'enabled' : 'disabled'}`,
      });
      
    } catch (error: any) {
      toast({
        title: "Failed to toggle token discounts",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to withdraw platform fees
  const handleWithdrawFees = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call the blockchain service
      // to withdraw collected fees from the smart contract
      // Simulating blockchain transaction with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Fees withdrawn successfully",
        description: `${platformData.fees.feeCollected} TLOS has been withdrawn to admin wallet`,
      });
      
    } catch (error: any) {
      toast({
        title: "Failed to withdraw fees",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Access control - only allow admin users
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the administration dashboard.
            Please contact the platform administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Loading state
  if (loading && !platformData) {
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
          <h1 className="text-3xl font-bold">Platform Administration</h1>
          <p className="text-muted-foreground">
            Manage platform settings, fees, and user accounts
          </p>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <div className="flex items-end gap-1">
                  <h3 className="text-2xl font-bold">{platformData.platform.totalRevenue}</h3>
                  <span className="text-sm mb-1">TLOS</span>
                </div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+{platformData.platform.revenueGrowth}%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <h3 className="text-2xl font-bold">{platformData.platform.activeUsers}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-muted-foreground">{platformData.users.premiumUsers} premium users</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staked</p>
                <div className="flex items-end gap-1">
                  <h3 className="text-2xl font-bold">{platformData.users.totalStakedAmount}</h3>
                  <span className="text-sm mb-1">WZR</span>
                </div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Layers className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-muted-foreground">Across {platformData.platform.tokenHolders} users</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Campaigns</p>
                <h3 className="text-2xl font-bold">{platformData.platform.campaignsCreatedThisMonth}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-muted-foreground">This month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Admin Tabs */}
      <Tabs defaultValue="fees" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fees">
            <DollarSign className="h-4 w-4 mr-2" />
            Fee Management
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <PieChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>
        
        {/* Fee Management */}
        <TabsContent value="fees" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Fee Configuration</CardTitle>
              <CardDescription>
                Manage transaction and milestone fees for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="transaction-fee">Transaction Fee (%)</Label>
                    <div className="flex items-center mt-1.5">
                      <Input
                        id="transaction-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={transactionFee}
                        onChange={(e) => setTransactionFee(e.target.value)}
                        className="max-w-[180px]"
                      />
                      <span className="ml-2 text-sm text-muted-foreground">Max: 10%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fee charged on each investment transaction
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="milestone-fee">Milestone Fee (%)</Label>
                    <div className="flex items-center mt-1.5">
                      <Input
                        id="milestone-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={milestoneFee}
                        onChange={(e) => setMilestoneFee(e.target.value)}
                        className="max-w-[180px]"
                      />
                      <span className="ml-2 text-sm text-muted-foreground">Max: 5%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fee charged when milestone funds are released
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="token-discounts" 
                      checked={useTokenDiscounts}
                      onCheckedChange={handleToggleTokenDiscounts}
                    />
                    <Label htmlFor="token-discounts">Enable token-based fee discounts</Label>
                  </div>
                  
                  <Button 
                    onClick={handleUpdateFees}
                    disabled={loading}
                    className="mt-4"
                  >
                    {loading ? 'Updating...' : 'Update Fees'}
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Current Fee Collection</h3>
                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Fees Collected:</span>
                      <span className="font-bold">{platformData.fees.feeCollected} TLOS</span>
                    </div>
                    <Button 
                      onClick={handleWithdrawFees}
                      disabled={loading}
                      className="w-full"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      {loading ? 'Processing...' : 'Withdraw Fees'}
                    </Button>
                  </div>
                  
                  <h4 className="font-medium mb-2 text-sm">Recent Fee Collections</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {platformData.fees.latestFeesCollected.map((fee: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{fee.date}</TableCell>
                            <TableCell>{fee.type}</TableCell>
                            <TableCell className="text-right">{fee.amount} TLOS</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* User Management */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage platform users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">User Statistics</h3>
                    <p className="text-sm text-muted-foreground">Overview of platform user base</p>
                  </div>
                  <Input className="max-w-[300px]" placeholder="Search users by address..." />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <h3 className="text-2xl font-bold">{platformData.platform.activeUsers}</h3>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Premium Users</p>
                      <h3 className="text-2xl font-bold">{platformData.users.premiumUsers}</h3>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Token Holders</p>
                      <h3 className="text-2xl font-bold">{platformData.platform.tokenHolders}</h3>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">New This Month</p>
                      <h3 className="text-2xl font-bold">152</h3>
                    </CardContent>
                  </Card>
                </div>
                
                <h3 className="text-lg font-medium my-4">Recent Users</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Wallet Address</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Campaigns</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {platformData.users.recentUsers.map((user: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{user.address}</TableCell>
                          <TableCell>{user.joined}</TableCell>
                          <TableCell>{user.campaigns}</TableCell>
                          <TableCell>
                            {user.premium ? 
                              <Badge className="bg-green-100 text-green-800">Premium</Badge> : 
                              <Badge className="bg-blue-100 text-blue-800">Standard</Badge>
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">View Details</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics */}
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>
                Data-driven insights about platform performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Revenue Distribution</h3>
                  <div className="h-[300px] w-full bg-muted/30 rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">Revenue chart visualization would go here</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">User Growth</h3>
                  <div className="h-[300px] w-full bg-muted/30 rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">User growth chart would go here</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Campaign Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Avg. Funding Rate</p>
                      <h3 className="text-2xl font-bold">67.8%</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Percentage of campaign goals reached
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Avg. Campaign Duration</p>
                      <h3 className="text-2xl font-bold">32 days</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        From creation to completion
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Series Funding Success</p>
                      <h3 className="text-2xl font-bold">82%</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Series funding campaigns that reach goals
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Security</CardTitle>
              <CardDescription>
                Monitor and manage platform security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Smart Contract Security</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">Last Security Audit</p>
                              <p className="text-sm text-muted-foreground">{platformData.security.lastAudit}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {platformData.security.securityIssues === 0 ? 'Secure' : 'Issues Found'}
                            </Badge>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium">Auditor</p>
                            <p className="text-sm">{platformData.security.auditorName}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium">Critical Issues</p>
                            <p className="text-sm">{platformData.security.criticalIssues}</p>
                          </div>
                          
                          <Button variant="outline" size="sm" className="w-full">
                            View Audit Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Bug Bounty Program</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <p className="text-sm text-muted-foreground">{platformData.security.bugBountyStatus}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              Active
                            </Badge>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium">Bounty Pool</p>
                            <p className="text-sm">{platformData.security.bugBountyPool} TLOS</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium">Total Bugs Reported</p>
                            <p className="text-sm">{platformData.security.totalBugsReported}</p>
                          </div>
                          
                          <Button variant="outline" size="sm" className="w-full">
                            Manage Bounty Program
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Emergency Controls</h3>
                  <Card className="border-orange-200">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch id="pause-platform" />
                          <div>
                            <Label htmlFor="pause-platform">Emergency Platform Pause</Label>
                            <p className="text-xs text-muted-foreground">
                              Temporarily pause all operations except withdrawals
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch id="pause-investments" />
                          <div>
                            <Label htmlFor="pause-investments">Pause New Investments</Label>
                            <p className="text-xs text-muted-foreground">
                              Temporarily prevent new investments while allowing other operations
                            </p>
                          </div>
                        </div>
                        
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Warning</AlertTitle>
                          <AlertDescription>
                            These controls should only be used in emergency situations.
                            All actions are logged and require administrative approval.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard; 