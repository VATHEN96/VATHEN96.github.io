'use client';

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  VoteIcon, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Users, 
  BarChart3, 
  Info,
  Plus,
  XCircle,
  AlertCircle,
  Trophy,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Shield } from 'lucide-react';
import * as z from 'zod';
import { ProposalOption, Proposal, VotingPower, ProposalFormValues } from '@/types';

// Define the zod schema for proposal form
const proposalFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters."
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters."
  }),
  votingDuration: z.string(),
  options: z.array(z.string()).min(2, {
    message: "You must provide at least 2 options."
  })
});

interface GovernanceRightsProps {
  campaignId: string;
}

export function GovernanceRights({ campaignId }: GovernanceRightsProps) {
  const { 
    account, 
    isWalletConnected, 
    connectWallet, 
    getUserVotingPower, 
    getCampaignProposals, 
    createProposal, 
    voteOnProposal 
  } = useWowzaRush();
  
  const [activeTab, setActiveTab] = useState<string>('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votingPower, setVotingPower] = useState<VotingPower | null>(null);
  const [optionsCount, setOptionsCount] = useState<number>(2);
  const [voteLoading, setVoteLoading] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof proposalFormSchema>>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      title: '',
      description: '',
      votingDuration: '7',
      options: ['', '']
    }
  });
  
  useEffect(() => {
    const loadProposals = async () => {
      if (!campaignId) return;
      
      setIsLoading(true);
      try {
        const proposals = await getCampaignProposals(campaignId);
        setProposals(proposals);
        
        if (isWalletConnected && account) {
          const power = await getUserVotingPower(account, campaignId);
          setVotingPower(power);
        }
      } catch (error) {
        console.error('Error loading governance data:', error);
        toast.error('Failed to load governance data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProposals();
  }, [campaignId, isWalletConnected, account, getCampaignProposals, getUserVotingPower]);
  
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
    } else if (proposal.status === 'cancelled') {
      return {
        label: 'Cancelled',
        color: 'bg-red-500',
        icon: <XCircle className="h-4 w-4 mr-1" />
      };
    } else {
      return {
        label: 'Pending',
        color: 'bg-yellow-500',
        icon: <Clock className="h-4 w-4 mr-1" />
      };
    }
  };
  
  const calculateProposalProgress = (proposal: Proposal) => {
    const now = Date.now();
    const total = proposal.endTime - proposal.createdAt;
    const elapsed = now - proposal.createdAt;
    
    if (proposal.status === 'completed' || now > proposal.endTime) {
      return 100;
    }
    
    return Math.min(Math.round((elapsed / total) * 100), 100);
  };
  
  const handleAddOption = () => {
    const currentOptions = form.getValues('options');
    form.setValue('options', [...currentOptions, '']);
  };
  
  const handleRemoveOption = (index: number) => {
    const currentOptions = form.getValues('options');
    if (currentOptions.length > 2) {
      form.setValue('options', currentOptions.filter((_, i: number) => i !== index));
    } else {
      toast.error('You need at least 2 options');
    }
  };
  
  const onSubmitProposal = async (values: z.infer<typeof proposalFormSchema>) => {
    setIsSubmitting(true);
    
    try {
      const durationDays = parseInt(values.votingDuration);
      const endTime = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
      
      // Map form values to proposal format
      const proposalOptions = values.options.map((option: string, index: number) => ({
        id: `option-${index + 1}`,
        text: option,
        votes: 0
      }));
      
      await createProposal({
        campaignId,
        title: values.title,
        description: values.description,
        options: proposalOptions,
        endTime
      });
      
      toast.success('Proposal created successfully');
      setIsCreateDialogOpen(false);
      form.reset();
      
      // Refresh proposals
      const refreshedProposals = await getCampaignProposals(campaignId);
      setProposals(refreshedProposals);
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Failed to create proposal');
    }
  };
  
  const handleVote = async (proposalId: string, optionId: string) => {
    if (!isWalletConnected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!votingPower || votingPower.total <= 0) {
      toast.error('You need voting power to vote on proposals');
      return;
    }
    
    setVoteLoading(proposalId);
    try {
      await voteOnProposal(campaignId, proposalId, optionId);
      toast.success('Vote submitted successfully');
      
      // Refresh proposals
      const refreshedProposals = await getCampaignProposals(campaignId);
      setProposals(refreshedProposals);
    } catch (error) {
      console.error('Error voting on proposal:', error);
      toast.error('Failed to vote on proposal');
    } finally {
      setVoteLoading(null);
    }
  };
  
  const filteredProposals = proposals.filter(proposal => {
    if (activeTab === 'active') {
      return proposal.status === 'active' && proposal.endTime > Date.now();
    } else if (activeTab === 'completed') {
      return proposal.status === 'completed' || proposal.endTime <= Date.now();
    } else {
      return true; // All proposals
    }
  });
  
  // Check if user has enough voting power to create proposals
  const canCreateProposal = votingPower && votingPower.total >= 10;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading governance data...</span>
      </div>
    );
  }
  
  if (!isWalletConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Governance Rights
          </CardTitle>
          <CardDescription>
            Connect your wallet to participate in campaign governance
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center py-8">
          <Shield className="h-16 w-16 mx-auto text-primary opacity-70 mb-4" />
          <p className="text-lg font-medium mb-2">Gain Voting Power</p>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Support this campaign with certain tier levels to receive governance rights
            and voting power on important decisions.
          </p>
          <Button size="lg" onClick={connectWallet}>
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Campaign Governance
              </CardTitle>
              <CardDescription>
                Participate in decisions that shape this campaign
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex flex-col text-sm">
                <span className="text-muted-foreground">Your Voting Power</span>
                <span className="font-medium text-lg flex items-center">
                  <VoteIcon className="h-4 w-4 mr-1 text-primary" />
                  {votingPower?.total || 0}
                </span>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!canCreateProposal}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Proposal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Proposal</DialogTitle>
                    <DialogDescription>
                      Create a new proposal for campaign contributors to vote on.
                      You need at least 10 voting power to create proposals.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitProposal)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proposal Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter proposal title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe what this proposal is about and why it matters" 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="votingDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voting Duration</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select voting duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1 day</SelectItem>
                                <SelectItem value="3">3 days</SelectItem>
                                <SelectItem value="7">7 days</SelectItem>
                                <SelectItem value="14">14 days</SelectItem>
                                <SelectItem value="30">30 days</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel>Options</FormLabel>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={handleAddOption}
                            disabled={optionsCount >= 5}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {Array.from({ length: optionsCount }).map((_, index) => (
                            <div key={index} className="flex gap-2">
                              <FormField
                                control={form.control}
                                name={`options.${index}`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input 
                                        placeholder={`Option ${index + 1}`} 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {index >= 2 && (
                                <Button 
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveOption(index)}
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Create Proposal</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {!canCreateProposal && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Insufficient Voting Power
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      You need at least 10 voting power to create new proposals. 
                      Support this campaign with higher tier contributions to gain more voting power.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Proposals</TabsTrigger>
            </TabsList>
            
            <div className="space-y-6">
              {filteredProposals.length > 0 ? (
                filteredProposals.map(proposal => {
                  const status = getProposalStatus(proposal);
                  const progress = calculateProposalProgress(proposal);
                  const isActive = proposal.status === 'active' && proposal.endTime > Date.now();
                  const hasVoted = proposal.userVoted;
                  
                  return (
                    <Card key={proposal.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{proposal.title}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <span>By {proposal.creatorName || proposal.creatorAddress.slice(0, 6) + '...'}</span>
                              <span className="mx-2">•</span>
                              <span>{format(new Date(proposal.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                          <Badge className={`${status.color} text-white`}>
                            <div className="flex items-center">
                              {status.icon}
                              {status.label}
                            </div>
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="mb-4">{proposal.description}</p>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{getTimeRemaining(proposal.endTime)}</span>
                            </div>
                          </div>
                          <Progress value={progress} className="h-2" />
                          
                          <div className="mt-6 space-y-3">
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
                                  
                                  <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                                    <div 
                                      className="h-full bg-primary transition-all duration-500 rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center text-sm">
                                    <span>{option.votes} votes</span>
                                    
                                    {isActive && !hasVoted && votingPower && votingPower.total > 0 && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleVote(proposal.id, option.id)}
                                        disabled={voteLoading === proposal.id}
                                      >
                                        {voteLoading === proposal.id ? (
                                          <>
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            Voting...
                                          </>
                                        ) : (
                                          <>
                                            <VoteIcon className="h-3 w-3 mr-1" />
                                            Vote
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex justify-between pt-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{proposal.totalVotes} total votes</span>
                        </div>
                        
                        {hasVoted && (
                          <div className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                            <span className="text-green-600">You voted</span>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 bg-primary/10 p-4 rounded-full">
                      {activeTab === 'active' ? (
                        <VoteIcon className="h-8 w-8 text-primary" />
                      ) : (
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      {activeTab === 'active' 
                        ? "No active proposals" 
                        : activeTab === 'completed' 
                          ? "No completed proposals" 
                          : "No proposals found"}
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      {activeTab === 'active' 
                        ? "There are no active proposals for this campaign yet." 
                        : activeTab === 'completed' 
                          ? "There are no completed proposals for this campaign yet." 
                          : "No proposals have been created for this campaign yet."}
                      {canCreateProposal && " Create the first one!"}
                    </p>
                    
                    {canCreateProposal && (
                      <Button 
                        className="mt-4" 
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Proposal
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {votingPower && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              Your Voting Power
            </CardTitle>
            <CardDescription>
              Breakdown of your voting power in this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{votingPower.total}</p>
                  <p className="text-sm text-muted-foreground">Total voting power</p>
                </div>
                
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">
                    View All Campaigns
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center mb-2">
                  <h3 className="font-medium">Voting Power by Tier</h3>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="#">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {votingPower.tiers.length > 0 ? (
                    votingPower.tiers.map((tier) => (
                      <div key={tier.tier} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{tier.tier}</p>
                        </div>
                        <Badge variant="outline" className="bg-primary/10">
                          <VoteIcon className="h-3 w-3 mr-1" />
                          {tier.power} VP
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No voting power tiers found</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="font-medium">How to Increase Your Voting Power</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Support this campaign with higher tier contributions to receive more voting power.
                  Each tier grants you different voting power levels and governance rights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 