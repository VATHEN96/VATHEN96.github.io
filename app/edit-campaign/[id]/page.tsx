'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWowzaRush } from '@/context/wowzarushContext';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Edit, Save, ArrowLeft, AlertTriangle, HelpCircle, Vote } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Available campaign categories
const CATEGORIES = [
  'Technology',
  'Arts',
  'Health',
  'Education',
  'Environment',
  'Community',
  'Business',
  'Other'
];

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;
  
  const { 
    account, 
    isWalletConnected, 
    connectWallet,
    loading,
    error,
    getCampaign
  } = useWowzaRush();
  
  // Local implementation of getCampaignById using getCampaign from context
  const getCampaignById = async (id: string) => {
    try {
      return await getCampaign(id);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  };
  
  // Local implementation of proposeCampaignEdit
  const proposeCampaignEdit = async (campaignId: number, changes: any): Promise<string | null> => {
    try {
      console.log(`Proposing edit for campaign ${campaignId}:`, changes);
      // In a real implementation, this would interact with the blockchain
      // For now, mock a successful response with a random ID
      return `proposal-${Date.now()}`;
    } catch (error) {
      console.error('Error proposing campaign edit:', error);
      return null;
    }
  };
  
  // Campaign data states
  const [originalCampaign, setOriginalCampaign] = useState<any>(null);
  const [editedCampaign, setEditedCampaign] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingOpen, setVotingOpen] = useState(false);
  const [votes, setVotes] = useState({ yes: 0, no: 0 });
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [editProposalId, setEditProposalId] = useState<string | null>(null);

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      if (!campaignId) return;
      
      try {
        const campaign = await getCampaignById(campaignId);
        if (!campaign) {
          toast.error('Campaign not found');
          router.push('/my-campaigns');
          return;
        }
        
        setOriginalCampaign(campaign);
        
        // Only the creator can edit the campaign
        if (account && campaign.creator !== account) {
          toast.error('Only the campaign creator can edit this campaign');
          router.push(`/campaign/${campaignId}`);
          return;
        }
        
        // Create a copy for editing
        setEditedCampaign({
          title: campaign.title,
          description: campaign.description,
          category: campaign.category,
          media: campaign.multimedia || campaign.media || [],
          // Only non-financial/structural details can be edited after funding begins
        });
        
      } catch (error) {
        console.error('Error loading campaign:', error);
        toast.error('Failed to load campaign');
      }
    };
    
    if (isWalletConnected) {
      loadCampaign();
    } else {
      // Prompt to connect wallet
      toast.error('Please connect your wallet to edit a campaign');
    }
  }, [campaignId, getCampaignById, isWalletConnected, account, router]);
  
  // Check for changes
  useEffect(() => {
    if (originalCampaign && editedCampaign) {
      const hasChanged = 
        originalCampaign.title !== editedCampaign.title ||
        originalCampaign.description !== editedCampaign.description ||
        originalCampaign.category !== editedCampaign.category;
      
      setHasChanges(hasChanged);
    }
  }, [originalCampaign, editedCampaign]);
  
  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setEditedCampaign(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWalletConnected) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!hasChanges) {
      toast.info('No changes to submit');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get only the changed fields
      const changes: any = {};
      if (originalCampaign.title !== editedCampaign.title) changes.title = editedCampaign.title;
      if (originalCampaign.description !== editedCampaign.description) changes.description = editedCampaign.description;
      if (originalCampaign.category !== editedCampaign.category) changes.category = editedCampaign.category;
      
      // Propose the edit (this will create a voting proposal)
      const proposalId = await proposeCampaignEdit(Number(campaignId), changes);
      
      if (proposalId) {
        setEditProposalId(proposalId);
        toast.success('Edit proposal submitted for voting');
        setVotingOpen(true);
        setShowVotingDialog(true);
      } else {
        toast.error('Failed to submit edit proposal');
      }
      
    } catch (error) {
      console.error('Error submitting changes:', error);
      toast.error('Failed to submit changes');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    router.push(`/campaign/${campaignId}`);
  };
  
  // Loading state
  if (loading || !editedCampaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <Button
                variant="outline"
                size="sm"
                className="mb-4"
                onClick={handleCancel}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaign
              </Button>
              <h1 className="text-3xl font-bold">Edit Campaign</h1>
              <p className="text-gray-600 mt-2">
                Propose changes to your campaign. Changes will be subject to community voting.
              </p>
            </div>
          </div>
          
          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-md">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Title
                </label>
                <Input
                  id="title"
                  value={editedCampaign.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Description
                </label>
                <Textarea
                  id="description"
                  value={editedCampaign.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full min-h-[200px]"
                  required
                />
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select
                  value={editedCampaign.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger className="border-2 border-gray-300">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Changes
                  </>
                )}
              </Button>
            </div>
          </form>
          
          {/* Voting Dialog */}
          <Dialog open={showVotingDialog} onOpenChange={setShowVotingDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Proposal Submitted</DialogTitle>
                <DialogDescription>
                  Your edit proposal has been submitted for community voting. 
                  The changes will be applied if the proposal receives majority approval.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Proposal ID: {editProposalId}
                </p>
                <div className="bg-gray-100 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Changes Proposed:</h4>
                  <ul className="text-sm space-y-2">
                    {originalCampaign.title !== editedCampaign.title && (
                      <li>
                        <span className="font-medium">Title:</span> {editedCampaign.title}
                      </li>
                    )}
                    {originalCampaign.description !== editedCampaign.description && (
                      <li>
                        <span className="font-medium">Description:</span> Updated
                      </li>
                    )}
                    {originalCampaign.category !== editedCampaign.category && (
                      <li>
                        <span className="font-medium">Category:</span> {editedCampaign.category}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => router.push(`/campaign/${campaignId}`)}>
                  Return to Campaign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 