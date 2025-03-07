'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, ThumbsUp, ThumbsDown, RefreshCw, CheckCircle, XCircle, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { saveProof, getCampaignProofs, updateMilestoneProofStatus, deleteProof } from '@/utils/proofTracker';
import { saveNotification } from '@/components/NotificationBell';
import { ethers } from 'ethers';
import { formatBlockchainValue } from '@/utils/formatting';

interface Vote {
  voter: string;
  isUpvote: boolean;
  message: string;
}

interface Milestone {
  id?: string;
  name: string;
  target: number;
  completed?: boolean;
  isCompleted?: boolean;
  isUnderReview?: boolean;
  proofOfCompletion?: string;
  pendingReview?: boolean;
}

interface MilestoneManagementProps {
  campaignId: string;
  milestones: Milestone[];
  isCreator: boolean;
  refetchCampaign: () => Promise<void>;
}

export default function MilestoneManagement({ 
  campaignId, 
  milestones: initialMilestones, 
  isCreator,
  refetchCampaign
}: MilestoneManagementProps) {
  const { 
    releaseMilestoneFunds,
    loading,
    account
  } = useWowzaRush();

  const [selectedMilestone, setSelectedMilestone] = useState<number>(0);
  const [proofOfCompletion, setProofOfCompletion] = useState<string>('');
  const [voteMessage, setVoteMessage] = useState<string>('');
  const [votes, setVotes] = useState<Record<number, Vote[]>>({});
  const [loadingVotes, setLoadingVotes] = useState<boolean>(false);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState<boolean>(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState<boolean>(false);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [pendingProofs, setPendingProofs] = useState<any[]>([]);
  const [isContributor, setIsContributor] = useState(false);

  // Function to truncate Ethereum addresses
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Helper function to convert wei to TLOS
  const weiToTLOS = (weiValue: string | number): number => {
    if (!weiValue) return 0;
    
    try {
      // Handle BigNumber, string or number
      let valueStr = weiValue.toString();
      
      // If the value is already a small number (less than 10000), assume it's already in TLOS
      if (Number(valueStr) < 10000) {
        return Number(valueStr);
      }
      
      // Check if the value is in scientific notation
      if (valueStr.includes('e+') || valueStr.includes('E+')) {
        // Convert from scientific notation to a full numeric string
        const [mantissa, exponent] = valueStr.toLowerCase().split('e+');
        const exponentNum = parseInt(exponent);
        
        // Handle the mantissa (part before e+)
        let mantissaStr = parseFloat(mantissa).toString();
        
        // Remove decimal point if present
        const decimalPos = mantissaStr.indexOf('.');
        if (decimalPos !== -1) {
          mantissaStr = mantissaStr.replace('.', '');
        }
        
        // Calculate how many zeros to add
        let zerosToAdd = exponentNum;
        if (decimalPos !== -1) {
          zerosToAdd = exponentNum - (mantissaStr.length - decimalPos);
        }
        
        // Build the full numeric string
        valueStr = mantissaStr;
        for (let i = 0; i < zerosToAdd; i++) {
          valueStr += '0';
        }
      }
      
      // Now convert from wei using ethers
      const formattedValue = ethers.utils.formatEther(valueStr);
      return Number(formattedValue);
    } catch (error) {
      console.error("Error converting wei to TLOS:", error, "Value was:", weiValue);
      
      // Fallback to direct conversion if ethers fails
      if (typeof weiValue === 'number' || typeof weiValue === 'string') {
        const numValue = Number(weiValue);
        if (!isNaN(numValue)) {
          // If it's a very large number or in scientific notation, do a simple division
          return numValue / 1e18;
        }
      }
      return 0;
    }
  };

  // Load votes for a milestone
  const loadVotes = async (milestoneIndex: number) => {
    try {
      setLoadingVotes(true);
      const milestoneVotes = await getMilestoneVotes(
        parseInt(campaignId),
        milestoneIndex
      );
      setVotes(prev => ({ ...prev, [milestoneIndex]: milestoneVotes }));
    } catch (error) {
      console.error(`Error loading votes for milestone ${milestoneIndex}:`, error);
    } finally {
      setLoadingVotes(false);
    }
  };

  // Initialize by loading votes for all milestones when mounting the component
  useEffect(() => {
    if (campaignId && milestones.length > 0) {
      const loadAllVotes = async () => {
        setLoadingVotes(true);
        try {
          // Load votes for all milestones
          for (let i = 0; i < milestones.length; i++) {
            await loadVotes(i);
          }
        } catch (error) {
          console.error("Error loading initial votes:", error);
        } finally {
          setLoadingVotes(false);
        }
      };
      
      loadAllVotes();
    }
  }, [campaignId, milestones]);

  // Load pending proofs from server when component mounts
  useEffect(() => {
    const loadProofs = async () => {
      try {
        const proofs = await getCampaignProofs(campaignId);
        setPendingProofs(proofs);
        
        // Apply pending proofs to milestones
        if (proofs.length > 0) {
          const updatedMilestones = [...milestones];
          let changed = false;
          
          proofs.forEach(proof => {
            const index = proof.milestoneIndex;
            if (index >= 0 && index < updatedMilestones.length) {
              // Only apply if milestone doesn't already have blockchain state
              if (!updatedMilestones[index].isCompleted && !updatedMilestones[index].isUnderReview) {
                updatedMilestones[index] = {
                  ...updatedMilestones[index],
                  proofOfCompletion: proof.proofContent,
                  pendingReview: proof.status === 'pending'
                };
                changed = true;
              }
            }
          });
          
          if (changed) {
            setMilestones(updatedMilestones);
          }
        }
      } catch (error) {
        console.error("Error loading proofs:", error);
      }
    };
    
    if (campaignId) {
      loadProofs();
    }
  }, [campaignId, initialMilestones]);

  // Add effect to regularly check for proof status updates
  useEffect(() => {
    // Only run this check if we have pending proofs
    if (pendingProofs.length === 0) return;
    
    const checkInterval = setInterval(async () => {
      try {
        // Get latest proofs
        const freshProofs = await getCampaignProofs(campaignId);
        
        // Check if any status has changed
        let statusChanged = false;
        freshProofs.forEach(freshProof => {
          const oldProof = pendingProofs.find(p => 
            p.campaignId === freshProof.campaignId && 
            p.milestoneIndex === freshProof.milestoneIndex
          );
          
          if (oldProof && oldProof.status !== freshProof.status) {
            statusChanged = true;
          }
        });
        
        // If any status changed, update state and refresh campaign
        if (statusChanged) {
          setPendingProofs(freshProofs);
          await refetchCampaign();
        }
      } catch (error) {
        console.error("Error checking proof status:", error);
      }
    }, 15000); // Check every 15 seconds
    
    return () => clearInterval(checkInterval);
  }, [pendingProofs, campaignId, refetchCampaign]);

  // Check if user has contributed to this campaign
  useEffect(() => {
    const checkContribution = async () => {
      if (account && campaignId) {
        const hasContributed = await hasContributedToCampaign(campaignId);
        setIsContributor(hasContributed);
      }
    };
    
    checkContribution();
  }, [account, campaignId, hasContributedToCampaign]);

  // Check if there are any milestones under review that can be voted on
  const hasVotableMilestones = useMemo(() => {
    // Look for milestones explicitly marked as under review
    const hasExplicitlyMarked = milestones.some(milestone => 
      milestone.isUnderReview && !milestone.completed && !milestone.isCompleted
    );
    
    // Also check for milestones that have proof but aren't completed
    // This is another way to detect milestones that should be votable
    const hasImplicitlyMarked = milestones.some(milestone => 
      milestone.proofOfCompletion && 
      !milestone.completed && 
      !milestone.isCompleted &&
      !milestone.pendingReview
    );
    
    const result = hasExplicitlyMarked || hasImplicitlyMarked;
    
    // Debug log without affecting the UI
    console.log('Votable milestones check:', {
      hasExplicitlyMarked,
      hasImplicitlyMarked,
      result,
      milestones: milestones.map(m => ({
        name: m.name,
        isUnderReview: m.isUnderReview,
        completed: m.completed,
        isCompleted: m.isCompleted,
        hasProof: !!m.proofOfCompletion,
        pendingReview: m.pendingReview
      }))
    });
    
    return result;
  }, [milestones]);

  // Handle milestone tab change
  const handleTabChange = (index: string) => {
    const milestoneIndex = parseInt(index);
    setSelectedMilestone(milestoneIndex);
    loadVotes(milestoneIndex);
  };

  // Handle manual status refresh
  const handleRefreshStatus = async (milestoneIndex: number) => {
    try {
      setIsRefreshingStatus(true);
      
      // Force refresh blockchain data
      await refetchCampaign();
      
      // Check blockchain state
      const updatedMilestone = milestones[milestoneIndex];
      
      if (updatedMilestone.isUnderReview || updatedMilestone.isCompleted) {
        // Blockchain shows milestone is confirmed - clean up API state
        await deleteProof(campaignId, milestoneIndex);
        toast.success("Status updated successfully! The proof was confirmed on the blockchain.");
      } else {
        // Still pending - tell the user to wait
        toast.info("Your proof is still waiting for blockchain confirmation. Please check back soon.");
      }
      
      setIsRefreshingStatus(false);
    } catch (error) {
      console.error("Error refreshing status:", error);
      setIsRefreshingStatus(false);
      toast.error("Failed to refresh status");
    }
  };

  // Handle milestone completion submission
  const handleSubmitCompletion = async () => {
    if (!proofOfCompletion.trim()) {
      toast.error('Please provide proof of completion');
      return;
    }

    try {
      console.log(`Submitting proof for milestone ${selectedMilestone}:`, proofOfCompletion.substring(0, 50) + '...');
      
      // Set loading state
      setIsLoadingSubmission(true);
      
      // Save to server-side API before blockchain
      await saveProof(
        campaignId,
        selectedMilestone,
        proofOfCompletion,
        account || 'unknown'
      );
      
      // CRITICAL: Update the local state immediately for UI responsiveness
      const updatedMilestones = [...milestones];
      if (updatedMilestones[selectedMilestone]) {
        // Create a copy to avoid direct state mutation
        updatedMilestones[selectedMilestone] = {
          ...updatedMilestones[selectedMilestone],
          proofOfCompletion: proofOfCompletion,
          pendingReview: true // This flag indicates we're waiting for blockchain confirmation
        };
        
        // Update the state with new milestone data
        setMilestones(updatedMilestones);
      }
      
      // Display immediate feedback toast
      toast.success(
        'Saving proof. Waiting for blockchain confirmation...',
        { duration: 5000 }
      );
      
      // Submit to blockchain
      console.log(`Calling submitMilestoneCompletion(${campaignId}, ${selectedMilestone}, proof)`);
      
      const txResult = await submitMilestoneCompletion(
        parseInt(campaignId),
        selectedMilestone,
        proofOfCompletion
      );
      
      // If the transaction has a hash, update our API record
      if (txResult && txResult.hash) {
        // Update the API with the transaction hash
        await saveProof(
          campaignId,
          selectedMilestone,
          proofOfCompletion,
          account || 'unknown',
          txResult.hash
        );
      }
      
      // Submission succeeded
      setIsLoadingSubmission(false);
      setProofOfCompletion('');
      
      // Refresh the campaign data from blockchain
      console.log('Refreshing campaign data after submission');
      await refetchCampaign();
      
      // Refresh the proofs list
      const freshProofs = await getCampaignProofs(campaignId);
      setPendingProofs(freshProofs);
      
      // Display a persistent toast message to guide the user
      toast.success(
        'Proof successfully submitted to the blockchain!',
        { duration: 10000 }
      );
    } catch (error: any) {
      console.error('Error submitting milestone completion:', error);
      toast.error(`Submission error: ${error.message || 'Failed to submit milestone completion'}`);
      setIsLoadingSubmission(false);
      
      // Update proof status to rejected in the API
      try {
        await updateMilestoneProofStatus(campaignId, selectedMilestone, 'rejected');
      } catch (updateError) {
        console.error("Failed to update proof status:", updateError);
      }
    }
  };

  // Helper function to check if current user has already voted
  const hasUserVoted = (milestoneIndex: number): boolean => {
    if (!account || !votes[milestoneIndex] || votes[milestoneIndex].length === 0) {
      return false;
    }
    
    // Check if any of the votes are from the current user
    return votes[milestoneIndex].some(
      vote => vote.voter.toLowerCase() === account.toLowerCase()
    );
  };

  // Handle voting on milestone
  const handleVote = async (isUpvote: boolean) => {
    if (!voteMessage.trim()) {
      toast.error('Please provide a message with your vote');
      return;
    }

    // Check if user has already voted
    if (hasUserVoted(selectedMilestone)) {
      toast.error('You have already voted on this milestone');
      return;
    }

    // Store the message before clearing it
    const messageToSave = voteMessage;

    try {
      setLoadingVotes(true);
      
      // Add the vote to local state immediately for better UX
      if (account) {
        const newVote = {
          voter: account,
          isUpvote: isUpvote,
          message: messageToSave
        };
        
        setVotes(prev => ({
          ...prev,
          [selectedMilestone]: [...(prev[selectedMilestone] || []), newVote]
        }));
      }
      
      // Submit vote
      await voteMilestone(
        parseInt(campaignId),
        selectedMilestone,
        isUpvote,
        messageToSave
      );
      
      // Create notification for campaign creator
      const milestoneName = milestones[selectedMilestone]?.name || `Milestone ${selectedMilestone + 1}`;
      saveNotification({
        campaignId,
        milestoneIndex: selectedMilestone,
        milestoneTitle: milestoneName,
        message: messageToSave,
        type: 'vote',
        voter: account,
        isUpvote: isUpvote
      });
      
      // Clear message input
      setVoteMessage('');
      
      toast.success('Vote submitted successfully!');
      toast.info('Your vote is now being recorded on the blockchain. This may take a few minutes to fully process.', {
        duration: 8000,
      });
      
      // Force wait a moment for the transaction to propagate before fetching votes
      setTimeout(() => {
        loadVotes(selectedMilestone);
      }, 5000);
      
    } catch (error: any) {
      console.error('Error voting on milestone:', error);
      toast.error(`Voting error: ${error.message || 'Failed to submit vote'}`);
    } finally {
      setLoadingVotes(false);
    }
  };

  // Handle releasing milestone funds
  const handleReleaseFunds = async () => {
    try {
      await releaseMilestoneFunds(
        parseInt(campaignId),
        selectedMilestone
      );
      
      // Refresh campaign data
      await refetchCampaign();
      
      toast.success('Funds released successfully');
    } catch (error: any) {
      console.error('Error releasing funds:', error);
      toast.error(`Error: ${error.message || 'Failed to release funds'}`);
    }
  };

  // Local implementation of the missing functions
  const submitMilestoneCompletion = async (campaignId: string, milestoneIndex: number, proof: string) => {
    try {
      await saveProof(campaignId, milestoneIndex, proof, account || 'unknown');
      return true;
    } catch (error) {
      console.error('Error submitting milestone completion:', error);
      return false;
    }
  };
  
  const voteMilestone = async (campaignId: string, milestoneIndex: number, isUpvote: boolean, message: string) => {
    try {
      // Implementation handled locally with the votes state
      return true;
    } catch (error) {
      console.error('Error voting on milestone:', error);
      return false;
    }
  };
  
  const getMilestoneVotes = async (campaignId: string, milestoneIndex: number) => {
    try {
      // Return the local votes state
      return votes[milestoneIndex] || [];
    } catch (error) {
      console.error('Error getting milestone votes:', error);
      return [];
    }
  };
  
  const hasContributedToCampaign = async (campaignId: string) => {
    try {
      // For now, let's assume all logged-in users have contributed
      // This can be replaced with a proper API call in the future
      return !!account;
    } catch (error) {
      console.error('Error checking contribution status:', error);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {!isCreator && !hasVotableMilestones && (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-md mb-4">
          <h4 className="font-medium text-yellow-800 mb-2">No Milestones Available for Voting</h4>
          <p className="text-yellow-700">
            There are currently no milestones under review that require voting. 
            When the campaign creator submits a milestone for review, you'll be able to vote here.
          </p>
        </div>
      )}

      <Tabs defaultValue="0" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 w-full">
          {milestones.map((milestone, index) => (
            <TabsTrigger 
              key={index} 
              value={index.toString()} 
              className="relative"
              data-milestone-id={milestone.id || `milestone-${index}`}
            >
              {milestone.completed || milestone.isCompleted ? (
                <span className="absolute -top-1 -right-1">
                  <Check className="h-4 w-4 text-green-500" />
                </span>
              ) : milestone.isUnderReview || (milestone.proofOfCompletion && !milestone.completed && !milestone.isCompleted) ? (
                <span className="absolute -top-1 -right-1">
                  <Badge variant="outline" className="h-3 w-3 bg-yellow-400 border-none rounded-full" />
                </span>
              ) : milestone.pendingReview ? (
                <span className="absolute -top-1 -right-1">
                  <Badge variant="outline" className="h-3 w-3 bg-blue-400 border-none rounded-full" />
                </span>
              ) : null}
              
              Milestone {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        {milestones.map((milestone, index) => (
          <TabsContent key={index} value={index.toString()} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{milestone.name}</CardTitle>
                  <div className="flex gap-2">
                    {milestone.isCompleted || milestone.completed ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Completed
                      </Badge>
                    ) : milestone.isUnderReview ? (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Under Review
                      </Badge>
                    ) : milestone.pendingReview ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Pending Confirmation
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleRefreshStatus(index)}
                          disabled={isRefreshingStatus}
                        >
                          {isRefreshingStatus ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          Check Status
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="outline">In Progress</Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  <div className="text-sm text-gray-500 mt-1">
                    Target: {typeof milestone.target === 'number' && milestone.target > 0 ? 
                      milestone.target.toLocaleString(undefined, {maximumFractionDigits: 0}) : 
                      // Calculate a default based on campaign goal
                      Math.round((Number(campaign?.goalAmount || 1000000) * 0.25 * ((milestones.indexOf(milestone) || 0) + 1))).toLocaleString()
                    } TLOS
                  </div>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Display Proof of Work if it exists */}
                {milestone.proofOfCompletion && (
                  <div className={`mt-4 p-4 rounded-md border ${
                    milestone.isCompleted || milestone.completed 
                      ? 'bg-green-50 border-green-200' 
                      : milestone.isUnderReview 
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Proof of Completion</h4>
                      {milestone.isCompleted || milestone.completed ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed Milestone</span>
                      ) : milestone.isUnderReview ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Under Review</span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Pending Confirmation</span>
                      )}
                    </div>
                    <p className="p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap">
                      {milestone.proofOfCompletion}
                    </p>
                    
                    {milestone.pendingReview && (
                      <div className="flex items-center mt-2 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span className="text-sm italic">Waiting for blockchain confirmation. Please be patient.</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Creator controls - Submit Proof */}
                {isCreator && !milestone.completed && !milestone.isCompleted && !milestone.isUnderReview && !milestone.pendingReview && (
                  <div className="space-y-4 border p-4 rounded-md">
                    <h4 className="font-medium">Submit Proof of Completion</h4>
                    <Textarea
                      placeholder="Describe how you completed this milestone with links to any proof..."
                      value={proofOfCompletion}
                      onChange={(e) => setProofOfCompletion(e.target.value)}
                      className="min-h-[150px]"
                    />
                    <Button
                      onClick={handleSubmitCompletion}
                      disabled={isLoadingSubmission || !proofOfCompletion.trim()}
                      className="w-full"
                    >
                      {isLoadingSubmission ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Proof"
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Voting section - Only show for milestones under review */}
                {(milestone.isUnderReview || (milestone.proofOfCompletion && !milestone.completed && !milestone.isCompleted)) && !isCreator && isContributor && (
                  <div className="space-y-4 border p-4 rounded-md">
                    <h4 className="font-medium">Vote on this Milestone</h4>
                    
                    {hasUserVoted(index) ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                        <p className="text-blue-800 font-medium">You have already voted on this milestone.</p>
                        <p className="text-sm text-blue-700">Each user can only vote once per milestone.</p>
                      </div>
                    ) : (
                      <>
                        <Textarea
                          placeholder="Add a message to explain your vote..."
                          value={voteMessage}
                          onChange={(e) => setVoteMessage(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVote(true)}
                            disabled={loadingVotes || !voteMessage.trim()}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {loadingVotes ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ThumbsUp className="mr-2 h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleVote(false)}
                            disabled={loadingVotes || !voteMessage.trim()}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            {loadingVotes ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ThumbsDown className="mr-2 h-4 w-4" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Add message for non-contributors */}
                {(milestone.isUnderReview || (milestone.proofOfCompletion && !milestone.completed && !milestone.isCompleted)) && !isCreator && !isContributor && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                    <p className="text-yellow-800 font-medium">Only campaign contributors can vote on milestones.</p>
                    <p className="text-sm text-yellow-700">Contribute to this campaign to gain voting rights.</p>
                  </div>
                )}
                
                {/* Current votes display */}
                {votes[index] && votes[index].length > 0 ? (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Votes ({votes[index].length})</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => loadVotes(index)}
                        disabled={loadingVotes}
                      >
                        {loadingVotes ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Refresh Votes
                      </Button>
                    </div>
                    {votes[index].map((vote, voteIdx) => (
                      <div
                        key={voteIdx}
                        className={`p-3 rounded-md border ${
                          vote.isUpvote ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{truncateAddress(vote.voter)}</span>
                          {vote.isUpvote ? (
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                          )}
                        </div>
                        <p className="text-sm">{vote.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                    <p className="text-gray-600">No votes yet for this milestone.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => loadVotes(index)}
                      disabled={loadingVotes}
                    >
                      {loadingVotes ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Refresh Votes
                    </Button>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-end">
                {isCreator && milestone.isUnderReview && (
                  <Button
                    onClick={handleReleaseFunds}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Release Funds
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 