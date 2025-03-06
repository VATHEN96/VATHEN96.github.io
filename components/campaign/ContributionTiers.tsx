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
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Edit2, Trash2, Medal, Crown, Info, Award, Sparkles, Shield, Vote } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ethers } from 'ethers';

export type RewardTier = {
  id: string;
  title: string;
  description: string;
  amount: number;
  maxContributors?: number; // Optional limit to number of contributors
  rewards: {
    nftBadge: boolean;
    nftBadgeImageUrl?: string;
    nftBadgeMetadata?: {
      name: string;
      description: string;
      attributes?: Record<string, any>[];
    };
    governanceRights: boolean;
    votingPower: number; // 0-100, relative voting power
    earlyAccess: boolean;
    exclusiveUpdates: boolean;
    physicalRewards: string[];
    customRewards: string[];
  };
};

// Define form validation schema
const rewardTierSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  amount: z.coerce.number().positive('Amount must be positive').min(0.001, 'Minimum amount is 0.001 ETH'),
  maxContributors: z.coerce.number().int().nonnegative('Must be a positive number or zero').optional(),
  rewards: z.object({
    nftBadge: z.boolean(),
    nftBadgeImageUrl: z.string().url('Please enter a valid URL').optional(),
    governanceRights: z.boolean(),
    votingPower: z.coerce.number().int().min(0).max(100),
    earlyAccess: z.boolean(),
    exclusiveUpdates: z.boolean(),
    physicalRewards: z.array(z.string()),
    customRewards: z.array(z.string())
  })
});

type ContributionTiersProps = {
  campaignId?: string;
  isEditing?: boolean;
  initialTiers?: RewardTier[];
  onChange?: (tiers: RewardTier[]) => void;
};

const ContributionTiers: React.FC<ContributionTiersProps> = ({
  campaignId,
  isEditing = false,
  initialTiers = [],
  onChange
}) => {
  const { getCampaignTiers, createCampaignTiers, updateCampaignTiers } = useWowzaRush();
  const [tiers, setTiers] = useState<RewardTier[]>(initialTiers);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentTier, setCurrentTier] = useState<RewardTier | null>(null);
  const [newPhysicalReward, setNewPhysicalReward] = useState<string>('');
  const [newCustomReward, setNewCustomReward] = useState<string>('');

  // Form definition
  const form = useForm<z.infer<typeof rewardTierSchema>>({
    resolver: zodResolver(rewardTierSchema),
    defaultValues: {
      title: '',
      description: '',
      amount: 0.1,
      maxContributors: undefined,
      rewards: {
        nftBadge: false,
        nftBadgeImageUrl: '',
        governanceRights: false,
        votingPower: 0,
        earlyAccess: false,
        exclusiveUpdates: false,
        physicalRewards: [],
        customRewards: []
      }
    }
  });

  // Load existing tiers if campaignId is provided
  useEffect(() => {
    if (campaignId && !isEditing) {
      const loadTiers = async () => {
        setIsLoading(true);
        try {
          const tierData = await getCampaignTiers(campaignId);
          if (tierData && tierData.length > 0) {
            setTiers(tierData);
          }
        } catch (error) {
          console.error('Error loading contribution tiers:', error);
          toast.error('Failed to load contribution tiers');
        } finally {
          setIsLoading(false);
        }
      };

      loadTiers();
    } else if (initialTiers && initialTiers.length > 0) {
      setTiers(initialTiers);
    }
  }, [campaignId, getCampaignTiers, isEditing, initialTiers]);

  // Update parent component when tiers change
  useEffect(() => {
    if (onChange) {
      onChange(tiers);
    }
  }, [tiers, onChange]);

  // Add a new tier
  const handleAddTier = (data: z.infer<typeof rewardTierSchema>) => {
    const newTier: RewardTier = {
      id: currentTier?.id || `tier-${Date.now()}`,
      ...data
    };

    if (currentTier) {
      // Editing existing tier
      setTiers(prev => prev.map(tier => tier.id === currentTier.id ? newTier : tier));
    } else {
      // Adding new tier
      setTiers(prev => [...prev, newTier]);
    }

    setIsDialogOpen(false);
    setCurrentTier(null);
    form.reset();
  };

  // Edit an existing tier
  const handleEditTier = (tier: RewardTier) => {
    setCurrentTier(tier);
    form.reset({
      title: tier.title,
      description: tier.description,
      amount: tier.amount,
      maxContributors: tier.maxContributors,
      rewards: {
        nftBadge: tier.rewards.nftBadge,
        nftBadgeImageUrl: tier.rewards.nftBadgeImageUrl || '',
        governanceRights: tier.rewards.governanceRights,
        votingPower: tier.rewards.votingPower,
        earlyAccess: tier.rewards.earlyAccess,
        exclusiveUpdates: tier.rewards.exclusiveUpdates,
        physicalRewards: tier.rewards.physicalRewards,
        customRewards: tier.rewards.customRewards
      }
    });
    setIsDialogOpen(true);
  };

  // Delete a tier
  const handleDeleteTier = (tierId: string) => {
    setTiers(prev => prev.filter(tier => tier.id !== tierId));
  };

  // Add a physical reward
  const handleAddPhysicalReward = () => {
    if (newPhysicalReward.trim()) {
      const currentPhysicalRewards = form.getValues('rewards.physicalRewards') || [];
      form.setValue('rewards.physicalRewards', [...currentPhysicalRewards, newPhysicalReward.trim()]);
      setNewPhysicalReward('');
    }
  };

  // Remove a physical reward
  const handleRemovePhysicalReward = (index: number) => {
    const currentPhysicalRewards = form.getValues('rewards.physicalRewards') || [];
    form.setValue(
      'rewards.physicalRewards',
      currentPhysicalRewards.filter((_, i) => i !== index)
    );
  };

  // Add a custom reward
  const handleAddCustomReward = () => {
    if (newCustomReward.trim()) {
      const currentCustomRewards = form.getValues('rewards.customRewards') || [];
      form.setValue('rewards.customRewards', [...currentCustomRewards, newCustomReward.trim()]);
      setNewCustomReward('');
    }
  };

  // Remove a custom reward
  const handleRemoveCustomReward = (index: number) => {
    const currentCustomRewards = form.getValues('rewards.customRewards') || [];
    form.setValue(
      'rewards.customRewards',
      currentCustomRewards.filter((_, i) => i !== index)
    );
  };

  // Save tiers to the blockchain
  const handleSaveTiers = async () => {
    if (!campaignId) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateCampaignTiers(campaignId, tiers);
        toast.success('Contribution tiers updated successfully');
      } else {
        await createCampaignTiers(campaignId, tiers);
        toast.success('Contribution tiers saved successfully');
      }
    } catch (error) {
      console.error('Error saving contribution tiers:', error);
      toast.error('Failed to save contribution tiers');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dialog reset
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCurrentTier(null);
      form.reset();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Contribution Tiers</h2>
          <p className="text-sm text-gray-500">
            Define different contribution levels and their associated rewards
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => { setCurrentTier(null); form.reset(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentTier ? 'Edit Contribution Tier' : 'Add Contribution Tier'}</DialogTitle>
              <DialogDescription>
                Define a new contribution tier with associated rewards for backers
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddTier)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tier Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Early Bird, Premium Supporter, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (ETH)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.001" min="0.001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="maxContributors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <div className="flex items-center gap-1">
                                Max Contributors
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">
                                        Optional. Leave empty for unlimited contributors.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                placeholder="Optional" 
                                {...field} 
                                value={field.value ?? ''} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what backers get at this tier" 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="font-medium">Blockchain Rewards</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="rewards.nftBadge"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange} 
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <div className="flex items-center">
                                <FormLabel className="font-medium">NFT Badge</FormLabel>
                                <Medal className="h-4 w-4 ml-2 text-amber-500" />
                              </div>
                              <FormDescription>
                                Contributors receive a unique NFT badge for this tier
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {form.watch('rewards.nftBadge') && (
                        <FormField
                          control={form.control}
                          name="rewards.nftBadgeImageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NFT Badge Image URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/image.png" {...field} />
                              </FormControl>
                              <FormDescription>
                                URL to the image that will be used for the NFT
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={form.control}
                        name="rewards.governanceRights"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange} 
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <div className="flex items-center">
                                <FormLabel className="font-medium">Governance Rights</FormLabel>
                                <Crown className="h-4 w-4 ml-2 text-yellow-500" />
                              </div>
                              <FormDescription>
                                Contributors can participate in campaign governance decisions
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {form.watch('rewards.governanceRights') && (
                        <FormField
                          control={form.control}
                          name="rewards.votingPower"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Voting Power (0-100)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="100"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Relative voting power for governance decisions (higher = more influence)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    
                    <h3 className="font-medium">Additional Benefits</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="rewards.earlyAccess"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange} 
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <div className="flex items-center">
                                <FormLabel className="font-medium">Early Access</FormLabel>
                                <Sparkles className="h-4 w-4 ml-2 text-blue-500" />
                              </div>
                              <FormDescription>
                                Contributors get early access to the product or service
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="rewards.exclusiveUpdates"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange} 
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <div className="flex items-center">
                                <FormLabel className="font-medium">Exclusive Updates</FormLabel>
                                <Shield className="h-4 w-4 ml-2 text-green-500" />
                              </div>
                              <FormDescription>
                                Contributors receive exclusive updates on the project
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <Label>Physical Rewards</Label>
                      <div className="flex gap-2 mt-2 mb-4">
                        <Input 
                          placeholder="T-shirt, poster, etc." 
                          value={newPhysicalReward}
                          onChange={(e) => setNewPhysicalReward(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddPhysicalReward()}
                        />
                        <Button type="button" onClick={handleAddPhysicalReward}>
                          Add
                        </Button>
                      </div>
                      
                      {form.watch('rewards.physicalRewards')?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.watch('rewards.physicalRewards').map((reward, index) => (
                            <Badge key={index} variant="secondary" className="px-2 py-1">
                              {reward}
                              <button 
                                type="button" 
                                onClick={() => handleRemovePhysicalReward(index)} 
                                className="ml-2 text-gray-500 hover:text-gray-700"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label>Custom Rewards</Label>
                      <div className="flex gap-2 mt-2 mb-4">
                        <Input 
                          placeholder="Private call, advisor role, etc." 
                          value={newCustomReward}
                          onChange={(e) => setNewCustomReward(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomReward()}
                        />
                        <Button type="button" onClick={handleAddCustomReward}>
                          Add
                        </Button>
                      </div>
                      
                      {form.watch('rewards.customRewards')?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.watch('rewards.customRewards').map((reward, index) => (
                            <Badge key={index} variant="secondary" className="px-2 py-1">
                              {reward}
                              <button 
                                type="button" 
                                onClick={() => handleRemoveCustomReward(index)} 
                                className="ml-2 text-gray-500 hover:text-gray-700"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {currentTier ? 'Save Changes' : 'Add Tier'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading tiers...</span>
        </div>
      ) : tiers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Award className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-medium">No Contribution Tiers</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Create different contribution tiers with unique rewards to incentivize backers to contribute more.
              </p>
              <Button 
                onClick={() => { setCurrentTier(null); form.reset(); setIsDialogOpen(true); }}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Tier
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tiers
            .sort((a, b) => a.amount - b.amount)
            .map((tier) => (
              <Card key={tier.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-lg">{tier.title}</h3>
                    {renderTierBadge(tier.amount)}
                  </div>
                  <div className="text-xl font-bold">{tier.amount} ETH</div>
                </div>
                
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-700">{tier.description}</p>
                      
                      {tier.maxContributors && (
                        <div className="mt-2 text-sm text-gray-500">
                          Limited to {tier.maxContributors} backers
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Rewards</h4>
                      
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
                            <div className="mt-2">
                              <h5 className="text-sm font-medium">Physical Rewards:</h5>
                              <ul className="list-disc list-inside text-sm pl-2">
                                {tier.rewards.physicalRewards.map((reward, index) => (
                                  <li key={index}>{reward}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {tier.rewards.customRewards.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium">Custom Rewards:</h5>
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
                
                <CardFooter className="bg-gray-50 justify-end py-3">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditTier(tier)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteTier(tier.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
        </div>
      )}
      
      {tiers.length > 0 && campaignId && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveTiers}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isEditing ? 'Update Tiers' : 'Save Tiers'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ContributionTiers; 