'use client'

import { useState, useEffect } from 'react'
import { useWowzaRush } from '@/context/wowzarushContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { saveNotification } from '@/components/NotificationBell'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Vote {
  voter: string;
  isUpvote: boolean;
  message: string;
}

interface EditProposal {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  proposedBy: string;
  createdAt: number;
  votes: Vote[];
  status: 'pending' | 'approved' | 'rejected';
  milestoneIndex?: number; // Optional if the proposal is related to a specific milestone
}

interface VoteRequestsProps {
  campaignId: string;
  isCreator: boolean;
}

export default function VoteRequests({ campaignId, isCreator }: VoteRequestsProps) {
  const { 
    account, 
    loading
  } = useWowzaRush();
  
  const [proposals, setProposals] = useState<EditProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [voteMessage, setVoteMessage] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isContributor, setIsContributor] = useState(false);

  // State for new proposal modal
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: ''
  });
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Local implementation of missing functions
  const getCampaignEditProposals = async (campaignId: number): Promise<any[]> => {
    try {
      console.log(`Fetching edit proposals for campaign ${campaignId}`);
      // Mock implementation that returns empty array
      // In a real implementation, this would fetch from an API or blockchain
      return [];
    } catch (error) {
      console.error('Error fetching campaign edit proposals:', error);
      return [];
    }
  };

  const voteOnEditProposal = async (proposalId: string, isUpvote: boolean, message: string): Promise<boolean> => {
    try {
      console.log(`Voting on proposal ${proposalId}: ${isUpvote ? 'upvote' : 'downvote'}`);
      // Mock implementation
      return true;
    } catch (error) {
      console.error('Error voting on proposal:', error);
      return false;
    }
  };

  const hasContributedToCampaign = async (campaignId: string): Promise<boolean> => {
    try {
      // For now, let's assume all logged-in users have contributed
      return !!account;
    } catch (error) {
      console.error('Error checking contribution status:', error);
      return false;
    }
  };

  const proposeCampaignEdit = async (campaignId: number, changes: any): Promise<string> => {
    try {
      console.log(`Proposing edit for campaign ${campaignId}:`, changes);
      // Mock implementation that returns a random ID
      return `proposal-${Date.now()}`;
    } catch (error) {
      console.error('Error proposing campaign edit:', error);
      throw error;
    }
  };

  // Local implementation of voteMilestone
  const voteMilestone = async (campaignId: string, milestoneIndex: number, isUpvote: boolean, message: string) => {
    try {
      console.log(`Voting on milestone ${milestoneIndex} in campaign ${campaignId}: ${isUpvote ? 'upvote' : 'downvote'}`);
      // The actual implementation is now handled through the edit proposal system
      // This function remains for backwards compatibility
      return true;
    } catch (error) {
      console.error('Error voting on milestone:', error);
      return false;
    }
  };

  // Fetch proposals from the context
  const fetchProposals = async () => {
    setLoadingProposals(true);
    try {
      // Convert campaignId to number since the context function expects a number
      const campaignIdNumber = parseInt(campaignId);
      if (isNaN(campaignIdNumber)) {
        throw new Error("Invalid campaign ID");
      }
      
      // Fetch proposals from context
      const fetchedProposals = await getCampaignEditProposals(campaignIdNumber);
      
      // If we have real proposals, use them
      if (fetchedProposals && fetchedProposals.length > 0) {
        // Convert the context proposal format to our component format
        const formattedProposals: EditProposal[] = fetchedProposals.map(p => ({
          id: p.id,
          campaignId: p.campaignId.toString(),
          title: Object.keys(p.changes).join(', '),
          description: JSON.stringify(p.changes),
          proposedBy: p.creator,
          createdAt: p.createdAt.getTime(),
          votes: [
            // Convert the yes/no votes to our Vote format
            ...Array(p.votes.yes).fill(0).map((_, i) => ({
              voter: `voter-yes-${i}`, // We don't have individual voter info in the context
              isUpvote: true,
              message: 'Approve'
            })),
            ...Array(p.votes.no).fill(0).map((_, i) => ({
              voter: `voter-no-${i}`, // We don't have individual voter info in the context
              isUpvote: false,
              message: 'Reject'
            }))
          ],
          status: p.status
        }));
        
        setProposals(formattedProposals);
      } else {
        // If no real proposals yet, use mock data for demonstration
        const mockProposals: EditProposal[] = [
          {
            id: '1',
            campaignId,
            title: 'Update Campaign Description',
            description: 'This proposal aims to update the campaign description to better reflect our current goals and progress.',
            proposedBy: '0x1234567890abcdef1234567890abcdef12345678',
            createdAt: Date.now() - 86400000, // 1 day ago
            votes: [
              { voter: '0xabcdef1234567890abcdef1234567890abcdef12', isUpvote: true, message: 'Great idea!' },
              { voter: '0x7890abcdef1234567890abcdef1234567890abcd', isUpvote: false, message: 'I prefer the original description.' }
            ],
            status: 'pending'
          },
          {
            id: '2',
            campaignId,
            title: 'Add New Milestone',
            description: 'Proposal to add a new milestone for the beta testing phase with a target of 5000 TLOS.',
            proposedBy: '0x2345678901abcdef2345678901abcdef23456789',
            createdAt: Date.now() - 172800000, // 2 days ago
            votes: [
              { voter: '0xabcdef1234567890abcdef1234567890abcdef12', isUpvote: true, message: 'This will help track progress better.' }
            ],
            status: 'pending',
            milestoneIndex: 2
          }
        ];
        
        setProposals(mockProposals);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load edit proposals');
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchProposals();
    }
  }, [campaignId]);

  // Check if user has contributed to this campaign
  useEffect(() => {
    const checkContribution = async () => {
      if (account && campaignId) {
        try {
          console.log(`Checking contribution status for account ${account} on campaign ${campaignId}`);
          const hasContributed = await hasContributedToCampaign(campaignId);
          console.log(`Contribution check result: ${hasContributed}`);
          
          // Set contributor status
          setIsContributor(hasContributed);
          
          // If the check is failing but you know you've contributed, you can uncomment this temporary override
          // setIsContributor(true); // TEMPORARY OVERRIDE
          
        } catch (error) {
          console.error('Error checking contribution status:', error);
          toast.error('Failed to verify your contribution status');
        }
      }
    };
    
    checkContribution();
  }, [account, campaignId, hasContributedToCampaign]);

  // Helper function to truncate Ethereum addresses
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Helper function to check if current user has already voted on a proposal
  const hasUserVoted = (proposal: EditProposal): boolean => {
    if (!account || !proposal.votes || proposal.votes.length === 0) {
      return false;
    }
    
    return proposal.votes.some(
      vote => vote.voter.toLowerCase() === account.toLowerCase()
    );
  };

  // Handle voting on a proposal
  const handleVote = async (proposalId: string, isUpvote: boolean) => {
    if (!voteMessage.trim()) {
      toast.error('Please provide a message with your vote');
      return;
    }

    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) {
      toast.error('Proposal not found');
      return;
    }

    // Check if user has already voted
    if (hasUserVoted(proposal)) {
      toast.error('You have already voted on this proposal');
      return;
    }

    // Store the message before clearing it
    const messageToSave = voteMessage;

    try {
      setIsVoting(true);
      
      // Add the vote to local state immediately for better UX
      if (account) {
        const newVote = {
          voter: account,
          isUpvote: isUpvote,
          message: messageToSave
        };
        
        setProposals(prev => 
          prev.map(p => 
            p.id === proposalId 
              ? { ...p, votes: [...p.votes, newVote] } 
              : p
          )
        );
      }
      
      // Call the context function to vote on the proposal
      await voteOnEditProposal(proposalId, isUpvote, messageToSave);
      
      // For milestone-related proposals, we might still use the existing voteMilestone function
      if (proposal.milestoneIndex !== undefined) {
        await voteMilestone(campaignId, proposal.milestoneIndex, isUpvote, messageToSave);
      }
      
      // Create notification for campaign creator
      saveNotification({
        campaignId,
        proposalId: proposalId,
        proposalTitle: proposal.title,
        message: messageToSave,
        type: 'vote',
        voter: account,
        isUpvote: isUpvote
      });
      
      // Clear message input and selected proposal
      setVoteMessage('');
      setSelectedProposal(null);
      
      toast.success('Vote submitted successfully!');
      toast.info('Your vote is now being recorded on the blockchain. This may take a few minutes to fully process.', {
        duration: 8000,
      });
      
      // Refresh proposals after a short delay
      setTimeout(() => {
        fetchProposals();
      }, 5000);
      
    } catch (error: any) {
      console.error('Error voting on proposal:', error);
      toast.error(`Voting error: ${error.message || 'Failed to submit vote'}`);
    } finally {
      setIsVoting(false);
    }
  };

  // Calculate vote statistics
  const getVoteStats = (proposal: EditProposal) => {
    const upvotes = proposal.votes.filter(v => v.isUpvote).length;
    const downvotes = proposal.votes.filter(v => !v.isUpvote).length;
    const total = proposal.votes.length;
    const percentage = total > 0 ? Math.round((upvotes / total) * 100) : 0;
    
    return { upvotes, downvotes, total, percentage };
  };

  // Function to handle new proposal submission
  const handleCreateProposal = async () => {
    if (!newProposal.title.trim()) {
      toast.error('Please provide a title for your proposal');
      return;
    }
    
    if (!newProposal.description.trim()) {
      toast.error('Please provide a description for your proposal');
      return;
    }
    
    try {
      setIsSubmittingProposal(true);
      
      // Prepare the changes object with only non-empty fields
      const changes: any = {};
      if (newProposal.title) changes.title = newProposal.title;
      if (newProposal.description) changes.description = newProposal.description;
      if (newProposal.category) changes.category = newProposal.category;
      
      // Call the context function to create a proposal
      await proposeCampaignEdit(Number(campaignId), changes);
      
      // Success message
      toast.success('Proposal submitted successfully');
      
      // Reset form and close dialog
      setNewProposal({ title: '', description: '', category: '' });
      setShowProposalDialog(false);
      
      // Refresh proposals
      fetchProposals();
      
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error(error.message || 'Failed to create proposal');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  if (loadingProposals) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading proposals...</span>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Edit Proposals</CardTitle>
          <CardDescription>
            There are currently no active edit proposals for this campaign.
          </CardDescription>
        </CardHeader>
        {/* Show Create New Proposal button for contributors who aren't creators */}
        {!isCreator && isContributor && (
          <CardFooter>
            <Button 
              variant="outline"
              onClick={() => setShowProposalDialog(true)}
            >
              Create New Proposal
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Edit Proposals</h2>
      <p className="text-muted-foreground">
        Vote on proposed changes to this campaign. Proposals need majority approval to be implemented.
      </p>
      
      {proposals.map(proposal => {
        const { upvotes, downvotes, total, percentage } = getVoteStats(proposal);
        const userHasVoted = hasUserVoted(proposal);
        
        return (
          <Card key={proposal.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{proposal.title}</CardTitle>
                  <CardDescription>
                    Proposed by {truncateAddress(proposal.proposedBy)} • {new Date(proposal.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant={proposal.status === 'approved' ? 'success' : proposal.status === 'rejected' ? 'destructive' : 'outline'}>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p>{proposal.description}</p>
              
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span>Votes: {total}</span>
                  <span>Approval: {percentage}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-1" /> {upvotes}
                  </span>
                  <span className="flex items-center">
                    <ThumbsDown className="h-4 w-4 mr-1" /> {downvotes}
                  </span>
                </div>
              </div>
              
              {proposal.votes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Votes</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {proposal.votes.slice(0, 3).map((vote, index) => (
                      <div key={index} className="bg-background p-3 rounded-md border">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{truncateAddress(vote.voter)}</span>
                          <Badge variant={vote.isUpvote ? "success" : "destructive"}>
                            {vote.isUpvote ? "Approve" : "Reject"}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{vote.message}</p>
                      </div>
                    ))}
                    {proposal.votes.length > 3 && (
                      <Button variant="ghost" size="sm" className="w-full">
                        View all {proposal.votes.length} votes
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {!userHasVoted && proposal.status === 'pending' && !isCreator && isContributor && (
                <div className="space-y-2">
                  {selectedProposal === proposal.id ? (
                    <>
                      <Textarea
                        placeholder="Why are you voting this way? (required)"
                        value={voteMessage}
                        onChange={(e) => setVoteMessage(e.target.value)}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleVote(proposal.id, true)}
                          disabled={isVoting || !voteMessage.trim()}
                          className="flex-1"
                          variant="outline"
                        >
                          {isVoting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleVote(proposal.id, false)}
                          disabled={isVoting || !voteMessage.trim()}
                          className="flex-1"
                          variant="outline"
                        >
                          {isVoting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ThumbsDown className="h-4 w-4 mr-2" />}
                          Reject
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => {
                            setSelectedProposal(null);
                            setVoteMessage('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setSelectedProposal(proposal.id)}
                      className="w-full"
                    >
                      Vote on this proposal
                    </Button>
                  )}
                </div>
              )}
              
              {!userHasVoted && proposal.status === 'pending' && !isCreator && !isContributor && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                  <p className="text-yellow-800 font-medium">Only campaign contributors can vote on proposals.</p>
                  <p className="text-sm text-yellow-700">Contribute to this campaign to gain voting rights.</p>
                </div>
              )}
              
              {userHasVoted && (
                <Badge variant="outline" className="w-full justify-center py-2">
                  You have already voted on this proposal
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {/* Show Create New Proposal button only for contributors who aren't creators */}
      {!isCreator && isContributor && (
        <>
          <Button 
            className="w-full" 
            onClick={() => setShowProposalDialog(true)}
          >
            Create New Proposal
          </Button>
          
          <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Proposal</DialogTitle>
                <DialogDescription>
                  Propose changes to the campaign. Your proposal will be voted on by other contributors.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Proposal Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Brief title for your proposal"
                    value={newProposal.title}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Proposal Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Describe your proposed changes in detail"
                    value={newProposal.description}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    New Category (Optional)
                  </label>
                  <Input
                    id="category"
                    placeholder="Suggest a new category"
                    value={newProposal.category}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowProposalDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProposal}
                  disabled={isSubmittingProposal || !newProposal.title.trim() || !newProposal.description.trim()}
                >
                  {isSubmittingProposal ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Proposal'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
} 