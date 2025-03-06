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
import { Loader2, Medal, Crown, Sparkles, Shield, Vote, DollarSign, AlertCircle, Info, Heart } from 'lucide-react';
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
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load tiers
        const tierData = await getCampaignTiers(campaignId);
        if (tierData && tierData.length > 0) {
          setTiers(tierData.sort((a, b) => a.amount - b.amount));
        } else {
          // Mock data if no tiers exist
          const mockTiers: RewardTier[] = [
            {
              id: 'tier-1',
              title: 'Early Supporter',
              description: 'Get your name listed on our supporters page and receive exclusive project updates.',
              amount: 0.05,
              rewards: {
                nftBadge: true,
                nftBadgeImageUrl: 'https://example.com/nft/early-supporter.png',
                governanceRights: false,
                votingPower: 0,
                earlyAccess: false,
                exclusiveUpdates: true,
                physicalRewards: [],
                customRewards: []
              }
            },
            {
              id: 'tier-2',
              title: 'Silver Backer',
              description: 'All previous rewards plus early access to the beta version and a silver supporter NFT badge.',
              amount: 0.2,
              rewards: {
                nftBadge: true,
                nftBadgeImageUrl: 'https://example.com/nft/silver-backer.png',
                governanceRights: false,
                votingPower: 0,
                earlyAccess: true,
                exclusiveUpdates: true,
                physicalRewards: ['Digital thank you card'],
                customRewards: []
              }
            },
            {
              id: 'tier-3',
              title: 'Gold Supporter',
              description: 'All previous rewards plus governance rights for future project decisions and a gold supporter NFT badge.',
              amount: 0.5,
              maxContributors: 50,
              rewards: {
                nftBadge: true,
                nftBadgeImageUrl: 'https://example.com/nft/gold-supporter.png',
                governanceRights: true,
                votingPower: 10,
                earlyAccess: true,
                exclusiveUpdates: true,
                physicalRewards: ['Digital thank you card', 'Exclusive digital artwork'],
                customRewards: ['Monthly supporter call']
              }
            },
            {
              id: 'tier-4',
              title: 'Platinum Patron',
              description: 'All previous rewards with enhanced governance rights (25% voting power) and a platinum patron NFT badge. Limited to 10 supporters.',
              amount: 2.0,
              maxContributors: 10,
              rewards: {
                nftBadge: true,
                nftBadgeImageUrl: 'https://example.com/nft/platinum-patron.png',
                governanceRights: true,
                votingPower: 25,
                earlyAccess: true,
                exclusiveUpdates: true,
                physicalRewards: ['Digital thank you card', 'Exclusive digital artwork', 'Limited edition merchandise'],
                customRewards: ['Monthly supporter call', 'Private advisory session with team']
              }
            }
          ];
          setTiers(mockTiers);
        }
        
        // Load campaign data
        const campaignData = await getCampaign(campaignId);
        setCampaign(campaignData);
        
        // Load user's contribution data
        // This would be implemented in a real application to show which tiers the user has already backed
        setContributedTiers({});
        
      } catch (error) {
        console.error('Error loading tier data:', error);
        toast.error('Failed to load contribution tiers');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [campaignId, getCampaignTiers, getCampaign]);
  
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
    if (!selectedTierId || !customAmount) return;
    
    setIsContributing(true);
    try {
      const amount = parseFloat(customAmount);
      
      if (onContribute) {
        // Use the provided callback
        await onContribute(selectedTierId, amount);
      } else {
        // Use the default implementation
        await contributeToCampaign(campaignId, amount, selectedTierId);
      }
      
      toast.success(`Successfully contributed ${amount} ETH to the campaign!`);
      
      // Update the user's contributed tiers
      setContributedTiers(prev => ({
        ...prev,
        [selectedTierId]: (prev[selectedTierId] || 0) + amount
      }));
      
      // Reset form
      setCustomAmount('');
      setSelectedTierId(null);
      setShowConfirmDialog(false);
      
      // Update campaign data
      const updatedCampaign = await getCampaign(campaignId);
      setCampaign(updatedCampaign);
      
    } catch (error) {
      console.error('Error contributing to campaign:', error);
      toast.error('Failed to contribute to campaign. Please try again.');
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
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Support This Campaign</h2>
        <p className="text-sm text-gray-500">
          Choose a contribution tier to support this campaign
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading contribution tiers...</span>
        </div>
      ) : tiers.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-gray-500">
                This campaign doesn't have any custom contribution tiers.
              </p>
              <div className="mt-4">
                <Label htmlFor="custom-contribution">Custom Contribution (ETH)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="custom-contribution"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder="0.1"
                    disabled={isContributing || !isWalletConnected}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={!customAmount || isContributing || !isWalletConnected}
                  >
                    {isContributing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                    Contribute
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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
        </>
      )}
      
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