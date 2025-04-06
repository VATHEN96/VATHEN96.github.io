'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Star, TrendingUp, Award, Zap, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { ethers } from 'ethers';

interface PremiumFeaturesProps {
  userAddress?: string;
  campaignId?: string;
  tokenBalance?: string;
}

const PremiumFeatures: React.FC<PremiumFeaturesProps> = ({
  userAddress,
  campaignId,
  tokenBalance = '0',
}) => {
  const { toast } = useToast();
  const { blockchainService } = useBlockchainService();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');

  // Define premium plans with features and pricing
  const premiumPlans = {
    monthly: {
      title: "Monthly Premium",
      price: "50",
      tokenPrice: "200",
      duration: "30 days",
      features: [
        "Featured campaign listing",
        "Advanced analytics dashboard",
        "Priority customer support",
        "Investor profile visibility boost",
        "Early access to new features"
      ]
    },
    quarterly: {
      title: "Quarterly Premium",
      price: "120",
      tokenPrice: "500",
      duration: "90 days",
      features: [
        "All Monthly Premium features",
        "Custom campaign URL",
        "Verified creator badge",
        "Investor contact export",
        "Marketing toolkit access"
      ]
    },
    annual: {
      title: "Annual Premium",
      price: "400",
      tokenPrice: "1600",
      duration: "365 days",
      features: [
        "All Quarterly Premium features",
        "Zero platform fees",
        "API access for developers",
        "Dedicated account manager",
        "Campaign strategy consulting"
      ]
    }
  };

  // Function to purchase premium features
  const handlePurchasePremium = async (plan: string, useTokens: boolean) => {
    if (!userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to purchase premium features",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const planDetails = premiumPlans[plan as keyof typeof premiumPlans];
      const amount = useTokens ? planDetails.tokenPrice : planDetails.price;
      const currency = useTokens ? "WZR" : "TLOS";
      
      // This would be replaced with actual blockchain transaction
      // For token payments: tokenContract.transferFrom(userAddress, platformAddress, amount)
      // For native currency: direct transfer with transaction
      
      // Simulated call to blockchain service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Premium Features Activated",
        description: `You have successfully activated ${planDetails.title} for ${planDetails.duration}`,
      });
      
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to purchase premium features",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Premium Features</h1>
        <p className="text-muted-foreground mt-2">
          Upgrade your crowdfunding experience with premium features
        </p>
      </div>
      
      <Tabs defaultValue="subscription" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
          <TabsTrigger value="services">Premium Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(premiumPlans).map(([key, plan]) => (
              <Card 
                key={key} 
                className={`${selectedPlan === key ? 'border-primary ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedPlan(key)}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{plan.title}</CardTitle>
                    {key === 'annual' && (
                      <Badge variant="default">Best Value</Badge>
                    )}
                  </div>
                  <CardDescription>
                    Duration: {plan.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="ml-1 text-muted-foreground">TLOS</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      or {plan.tokenPrice} WZR tokens
                    </div>
                  </div>
                  
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button 
                    onClick={() => handlePurchasePremium(key, false)} 
                    className="w-full" 
                    disabled={isProcessing}
                  >
                    Pay with TLOS
                  </Button>
                  <Button 
                    onClick={() => handlePurchasePremium(key, true)} 
                    variant="outline" 
                    className="w-full"
                    disabled={isProcessing || parseFloat(tokenBalance) < parseFloat(plan.tokenPrice)}
                  >
                    Pay with WZR Tokens
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="services" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle>Featured Campaign</CardTitle>
                </div>
                <CardDescription>
                  Boost visibility of your campaign on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Get your campaign highlighted in the featured section of our platform for maximum visibility.
                  This can increase your chances of getting funded by up to 70%.
                </p>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">25</span>
                  <span className="ml-1 text-muted-foreground">TLOS / week</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Promote Campaign</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary" />
                  <CardTitle>Verified Creator Badge</CardTitle>
                </div>
                <CardDescription>
                  Build trust with a verified creator status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Get a verified badge on your profile and campaigns after our team reviews 
                  your credentials and history. Verified campaigns receive 3x more investor attention.
                </p>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">75</span>
                  <span className="ml-1 text-muted-foreground">TLOS (one-time)</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Apply for Verification</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle>Custom Domain</CardTitle>
                </div>
                <CardDescription>
                  Use your own branding for campaign URLs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Link your campaign to a custom domain that matches your brand. 
                  Perfect for established projects looking to maintain consistent branding.
                </p>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">50</span>
                  <span className="ml-1 text-muted-foreground">TLOS / month</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Configure Domain</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle>API Access</CardTitle>
                </div>
                <CardDescription>
                  Connect your systems to our platform data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Get programmatic access to platform data and features. 
                  Perfect for integrating crowdfunding into your existing systems.
                </p>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">100</span>
                  <span className="ml-1 text-muted-foreground">TLOS / month</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Request API Access</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-12 bg-muted rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Star className="h-6 w-6 text-yellow-500 mr-2" />
          <h2 className="text-xl font-semibold">Benefits of WZR Token Holders</h2>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-2">Fee Discounts</h3>
            <p className="text-sm text-muted-foreground">
              Stake WZR tokens to receive up to 50% off platform fees based on your staking tier.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Governance Rights</h3>
            <p className="text-sm text-muted-foreground">
              Vote on platform decisions and feature requests with your staked tokens.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Premium Features</h3>
            <p className="text-sm text-muted-foreground">
              Pay for premium services at a discount when using WZR tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatures; 