import React, { useState, useEffect } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Medal, Crown, Sparkles, Shield, Vote, DollarSign, AlertCircle, Info, Heart, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { RewardTier } from './ContributionTiers';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RewardTierSelectorProps {
  campaignId: string;
  onContribute?: (tierId: string, amount: number) => Promise<void>;
}

const RewardTierSelector: React.FC<RewardTierSelectorProps> = ({ 
  campaignId,
  onContribute
}) => {
  const { getCampaignTiers, contributeToCampaign, isWalletConnected, getCampaign } = useWowzaRush();
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isContributing, setIsContributing] = useState<boolean>(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [contributedTiers, setContributedTiers] = useState<Record<string, number>>({});
  
  // Load tiers and campaign data
  useEffect(() => {
    if (campaignId) {
      const loadTiers = async () => {
        setIsLoading(true);
        try {
          const tierData = await getCampaignTiers(campaignId);
          // Sort tiers by amount in ascending order
          if (tierData && tierData.length > 0) {
            const sortedTiers = [...tierData].sort((a, b) => {
              // Handle different property names that might exist in the API response
              const amountA = parseFloat(a.minimumAmount || a.amount || '0');
              const amountB = parseFloat(b.minimumAmount || b.amount || '0');
              return amountA - amountB;
            });
            setTiers(sortedTiers);
          } else {
            setTiers([]);
          }
        } catch (error) {
          console.error('Error loading tiers:', error);
          toast.error(`Failed to load tiers: ${error instanceof Error ? error.message : "Unknown error"}`);
          setTiers([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadTiers();
    }
  }, [campaignId, getCampaignTiers]);
  
  const handleTierSelect = (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      setSelectedTierId(tierId);
      setCustomAmount(tier.amount.toString());
    }
  };
  
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
  };
  
  const handleContribute = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet to contribute');
      return;
    }
    
    if (!selectedTierId) {
      toast.error('Please select a contribution tier');
      return;
    }
    
    const tier = tiers.find(t => t.id === selectedTierId);
    if (!tier) {
      toast.error('Selected tier not found');
      return;
    }
    
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid contribution amount');
      return;
    }
    
    if (amount < tier.amount) {
      toast.error(`Minimum contribution for this tier is ${tier.amount} ETH`);
      return;
    }
    
    // Check if tier has a max contributor limit and if it's been reached
    if (tier.maxContributors) {
      // In a real application, you would check this against the blockchain
      // For now, we'll just show the dialog
    }
    
    setShowConfirmDialog(true);
  };
  
  const confirmContribution = async () => {
    if (!selectedTierId || !customAmount) {
      toast.error('Please select a tier and enter an amount');
      return;
    }
    
    setIsContributing(true);
    try {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      let success = false;
      try {
        if (onContribute) {
          // Use the provided callback
          await onContribute(selectedTierId, amount);
          success = true;
        } else {
          // Use the default implementation
          success = await contributeToCampaign(campaignId, amount, selectedTierId);
        }
        
        if (success) {
          toast.success(`Successfully contributed ${amount} ETH to the campaign!`);
          
          // Update the user's contributed tiers
          setContributedTiers((prev) => {
            const updatedTiers = { ...prev };
            updatedTiers[selectedTierId] = (prev[selectedTierId] || 0) + amount;
            return updatedTiers;
          });
          
          // Reset form
          setCustomAmount('');
          setSelectedTierId(null);
          setShowConfirmDialog(false);
          
          // Update campaign data
          try {
            const updatedCampaign = await getCampaign(campaignId);
            setCampaign(updatedCampaign);
          } catch (campaignError) {
            console.error('Error updating campaign data:', campaignError);
          }
        }
      } catch (contributionError) {
        console.error('Error contributing to campaign:', contributionError);
        toast.error(`Failed to contribute: ${contributionError instanceof Error ? contributionError.message : "Unknown error"}`);
      }
    } finally {
      setIsContributing(false);
    }
  };
  
  // Render tier badge based on amount
  const renderTierBadge = (amount: number) => {
    if (amount >= 10) {
      return <Badge className="bg-purple-600 hover:bg-purple-700">Platinum</Badge>;
    } else if (amount >= 1) {
      return <Badge className="bg-yellow-600 hover:bg-yellow-700">Gold</Badge>;
    } else if (amount >= 0.1) {
      return <Badge className="bg-gray-400 hover:bg-gray-500">Silver</Badge>;
    } else {
      return <Badge className="bg-amber-600 hover:bg-amber-700">Bronze</Badge>;
    }
  };
  
  // Render remaining slots for limited tiers
  const renderRemainingSlots = (tier: RewardTier) => {
    if (!tier.maxContributors) return null;
    
    // In a real application, you would get this from the blockchain
    // For demo purposes, we'll use a random number
    const takenSlots = Math.floor(Math.random() * tier.maxContributors);
    const remainingSlots = tier.maxContributors - takenSlots;
    
    return (
      <div className="mt-2 text-sm">
        {remainingSlots <= 5 ? (
          <span className="text-red-500 font-medium">
            Only {remainingSlots} {remainingSlots === 1 ? 'slot' : 'slots'} left!
          </span>
        ) : (
          <span className="text-gray-500">
            {remainingSlots} of {tier.maxContributors} slots available
          </span>
        )}
      </div>
    );
  };
  
  // Check if user has already contributed to a tier
  const hasContributedToTier = (tierId: string) => {
    return contributedTiers[tierId] !== undefined;
  };
  
  // Return improved loading and error states
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (tiers.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <Gift className="h-8 w-8 mx-auto text-muted-foreground" />
          <h3 className="font-medium">No Reward Tiers Available</h3>
          <p className="text-sm text-muted-foreground">
            This campaign doesn't have any reward tiers defined yet.
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Support This Campaign</h2>
        <p className="text-sm text-gray-500">
          Choose a contribution tier to support this campaign
        </p>
      </div>
      
      <RadioGroup value={selectedTierId || ''} onValueChange={handleTierSelect}>
        <div className="space-y-4">
          {tiers.map((tier) => {
            const isContributed = hasContributedToTier(tier.id);
            
            return (
              <div key={tier.id} className="relative">
                {isContributed && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-green-600">
                    Backed
                  </Badge>
                )}
                <Label
                  htmlFor={`tier-${tier.id}`}
                  className={`block ${selectedTierId === tier.id ? 'ring-2 ring-primary' : ''} ${isContributed ? 'border-green-200 bg-green-50' : ''}`}
                >
                  <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-center p-4 border-b">
                      <RadioGroupItem value={tier.id} id={`tier-${tier.id}`} className="mr-3" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-lg">{tier.title}</h3>
                          {renderTierBadge(tier.amount)}
                        </div>
                        <div className="text-lg font-bold mt-1">{tier.amount} ETH</div>
                      </div>
                    </div>
                    
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-gray-700">{tier.description}</p>
                          {renderRemainingSlots(tier)}
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Rewards</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {tier.rewards.nftBadge && (
                              <div className="flex items-center gap-2">
                                <Medal className="h-4 w-4 text-amber-500" />
                                <span>Unique NFT Badge</span>
                              </div>
                            )}
                            
                            {tier.rewards.governanceRights && (
                              <div className="flex items-center gap-2">
                                <Vote className="h-4 w-4 text-yellow-500" />
                                <span>Governance Rights (Power: {tier.rewards.votingPower})</span>
                              </div>
                            )}
                            
                            {tier.rewards.earlyAccess && (
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-blue-500" />
                                <span>Early Access</span>
                              </div>
                            )}
                            
                            {tier.rewards.exclusiveUpdates && (
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span>Exclusive Updates</span>
                              </div>
                            )}
                          </div>
                          
                          {(tier.rewards.physicalRewards.length > 0 || tier.rewards.customRewards.length > 0) && (
                            <div className="mt-2">
                              {tier.rewards.physicalRewards.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium mt-2">Physical Rewards:</h5>
                                  <ul className="list-disc list-inside text-sm pl-2">
                                    {tier.rewards.physicalRewards.map((reward, index) => (
                                      <li key={index}>{reward}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {tier.rewards.customRewards.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium mt-2">Custom Rewards:</h5>
                                  <ul className="list-disc list-inside text-sm pl-2">
                                    {tier.rewards.customRewards.map((reward, index) => (
                                      <li key={index}>{reward}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              </div>
            );
          })}
        </div>
      </RadioGroup>
      
      <Card>
        <CardContent className="py-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="contribution-amount">
                <div className="flex items-center gap-1">
                  Contribution Amount (ETH)
                  {selectedTierId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            You can contribute more than the minimum amount for extra support.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="contribution-amount"
                  type="number"
                  min={selectedTierId ? tiers.find(t => t.id === selectedTierId)?.amount || 0.001 : 0.001}
                  step="0.001"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="flex-1"
                  disabled={!selectedTierId || isContributing || !isWalletConnected}
                />
                <Button 
                  onClick={handleContribute}
                  disabled={!selectedTierId || !customAmount || isContributing || !isWalletConnected}
                >
                  {isContributing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Heart className="h-4 w-4 mr-2" />}
                  Support
                </Button>
              </div>
              {selectedTierId && (
                <p className="text-sm text-gray-500 mt-2">
                  Minimum contribution for this tier: {tiers.find(t => t.id === selectedTierId)?.amount} ETH
                </p>
              )}
            </div>
            
            {!isWalletConnected && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wallet not connected</AlertTitle>
                <AlertDescription>
                  Please connect your wallet to contribute to this campaign.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Contribution</DialogTitle>
            <DialogDescription>
              You're about to contribute to this campaign and receive the selected rewards.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTierId && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Selected Tier:</span>
                <span>{tiers.find(t => t.id === selectedTierId)?.title}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Contribution Amount:</span>
                <span>{customAmount} ETH</span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">You will receive:</h4>
                {tiers.find(t => t.id === selectedTierId)?.rewards.nftBadge && (
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-amber-500" />
                    <span>Unique NFT Badge</span>
                  </div>
                )}
                
                {tiers.find(t => t.id === selectedTierId)?.rewards.governanceRights && (
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span>Governance Rights</span>
                  </div>
                )}
                
                {/* Additional rewards would be listed here */}
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important Information</AlertTitle>
                <AlertDescription>
                  Your contribution will be recorded on the blockchain and NFT rewards will be transferred to your wallet after transaction confirmation.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isContributing}>
              Cancel
            </Button>
            <Button onClick={confirmContribution} disabled={isContributing}>
              {isContributing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Contribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RewardTierSelector; 