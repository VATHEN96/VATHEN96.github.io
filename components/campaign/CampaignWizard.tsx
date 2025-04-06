'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWowzaRush } from '@/context/wowzarushContext';
import { ethers, ContractTransaction, parseEther, parseUnits } from 'ethers'; // Import parseEther and parseUnits
import { toast } from 'sonner';
import Navbar from '@/components/navbar';
import CampaignBasicInfoForm from './CampaignBasicInfoForm';
import CampaignMilestonesForm from './CampaignMilestonesForm';
import CampaignMediaForm from './CampaignMediaForm';
import CampaignReviewForm from './CampaignReviewForm';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { CheckCircle, AlertCircle, ExternalLink, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMilestonesForContract, getWowzaRushABI } from '@/utils/contractHelpers';
import BlockchainServiceFixedV3Instance from '@/services/blockchainServiceFixedV3';
import DiagnosticButton from '../diagnostic/DiagnosticButton';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { wowzarushContextType } from '../../utils/types';
import { uploadToIPFS } from '@/utils/ipfsHelpers';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';

// Define step types for our wizard
enum WizardStep {
  BASIC_INFO = 0,
  MILESTONES = 1,
  MEDIA = 2,
  REVIEW = 3
};

// Function to get a title for each step
const getStepTitle = (step: WizardStep): string => {
  switch (step) {
    case WizardStep.BASIC_INFO:
      return 'Basic Information';
    case WizardStep.MILESTONES:
      return 'Milestones';
    case WizardStep.MEDIA:
      return 'Media Upload';
    case WizardStep.REVIEW:
      return 'Review & Submit';
    default:
      return 'Create Campaign';
  };
};


// Global options for categories and campaign types
export const categoryOptions = [
  { value: '0', label: 'Technology' },
  { value: '1', label: 'Product' },
  { value: '2', label: 'Game' },
  { value: '3', label: 'Creative' },
  { value: '4', label: 'Community' },
  { value: '5', label: 'Charity' },
  { value: '6', label: 'Other' }
];

export const campaignTypeOptions = [
  { value: '0', label: 'Donation' },
  { value: '1', label: 'Investment' }
]

interface CampaignMilestone {
  name: string;
  description: string;
  percentage: number;
  dueDate?: Date;
  deliverables: string;
};

interface CampaignData {
  title: string;
  description: string;
  category: string;
  goalAmount: number;
  duration: number;
  mainImageUrl: string;
  additionalImages?: string[];
  videoUrl?: string;
  mediaConsent: boolean;
  milestones: CampaignMilestone[];
  campaignType: string;
  equityPercentage?: number;
  minInvestment?: number;
};

interface TransactionResult {
  success: boolean;
  campaignId: string;
  transactionHash: string;
  receipt: any;
};

interface CampaignWizardProps {};

interface CampaignReviewFormProps {
  campaignData: {
    title: string;
    description: string;
    category: string;
    campaignType: string;
    duration: number;
    goalAmount: number;
    mainImage: string;
    additionalImages: string[];
    videoUrl?: string;
    milestones: Array<{
      name: string;
      description: string;
      percentage: number;
      dueDate: Date | null;
      deliverables: string;
    }>;
  };
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  onEdit: (step: number) => void;
};

// Add type for campaign created event arguments (using bigint for v6)
interface CampaignCreatedEventArgs {
  campaignId: bigint; // Use bigint
  [key: string]: any; // Allow other potential args
};

// Define a simpler type for the parsed log if needed, or handle directly
// interface CampaignCreatedEventLog extends ethers.LogDescription { // Example using LogDescription
//   args: CampaignCreatedEventArgs;
//   name: 'CampaignCreated';
// }

// We might not need a dedicated Event interface if we just access args after parsing

export default function CampaignWizard({}: CampaignWizardProps) {
  const { userAddress, blockchainService, connectWallet } = useWowzaRush();
  const router = useRouter();
  const { createCampaign } = useWowzaRush();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.BASIC_INFO);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'pending' | 'confirmed' | 'failed' | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState<boolean>(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Form data state with default values
  const [campaignData, setCampaignData] = useState<CampaignData>({
    title: '',
    description: '',
    category: '0',
    duration: 30,
    goalAmount: 1,
    mainImageUrl: '',
    additionalImages: [],
    videoUrl: '',
    mediaConsent: false,
    milestones: [
      {
        name: 'Initial Milestone',
        description: 'Complete first phase of the project',
        percentage: 25,
        deliverables: 'Initial phase deliverables',
        dueDate: new Date()
      },
      {
        name: 'Halfway Point',
        description: 'Complete halfway point of the project',
        percentage: 25,
        deliverables: 'Halfway point deliverables',
        dueDate: new Date()
      },
      {
        name: 'Beta Release',
        description: 'Release a beta version for testing',
        percentage: 25,
        deliverables: 'Beta version deliverables',
        dueDate: new Date()
      },
      {
        name: 'Final Release',
        description: 'Deliver the completed project',
        percentage: 25,
        deliverables: 'Final deliverables',
        dueDate: new Date()
      }
    ],
    campaignType: '0'
  });
  
  // Set page title based on step
  useEffect(() => {
    document.title = `Create Campaign - ${getStepTitle(currentStep)} | WowzaRush`;
  }, [currentStep]);
  
  // Check wallet connection - improved to be more robust
  useEffect(() => {
    // Check if really disconnected by verifying with the blockchain service directly
    const verifyWalletConnection = async () => {
      // Multiple ways to check wallet connection for maximum reliability
      const serviceConnected = BlockchainServiceFixedV3Instance.isConnected();
      const serviceWalletAddr = BlockchainServiceFixedV3Instance.getWalletAddress();
      
      // FIXED: More reliable connection detection
      const anyWalletConnected = 
        !!userAddress || 
        !!serviceWalletAddr;
      
      // Log the state for debugging
      console.log('Wallet connection status:', {
        serviceIsConnected: serviceConnected,
        serviceWalletAddress: serviceWalletAddr,
        currentContextIsConnected: !!userAddress,
        currentContextWalletAddress: userAddress,
      });
      
      // Only show error if we are ABSOLUTELY SURE no wallet is connected
      if (!anyWalletConnected) {
        // Show a more informative message with a connect button
        toast.error((
          <div>
            Wallet not connected. Please connect your wallet to create a campaign.
            <div style={{ marginTop: '10px' }}>
              <button 
                onClick={async () => {
                  toast.dismiss('wallet-connection-error');
                  await connectWallet();
                }}
                style={{
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Connect Wallet
              </button>
            </div>
          </div>
        ), {
          id: 'wallet-connection-error',
          duration: 10000
        });
      }
    }
    
    verifyWalletConnection();
    
    // Set up a less frequent check to avoid annoyance
    const intervalId = setInterval(() => {
      verifyWalletConnection();
    }, 30000); // Check every 30 seconds instead of 10
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
    }
  }, [userAddress]);
  
  // Function to connect wallet if needed
  const handleWalletConnection = async () => {
    try {
      await connectWallet();
      const isConnected = blockchainService?.isConnected();
      
      if (!isConnected) {
        toast.error('Failed to connect wallet');
          return false;
        }
      
      return true;
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
      return false;
    }
  };
  
  // Reset transaction state when step changes
  useEffect(() => {
    setTransactionHash(null);
    setTransactionStatus(null);
    setShowTransactionDialog(false);
  }, [currentStep]);
  
  // Add transaction status checker
  useEffect(() => {
    // Only run this effect if we have a transaction hash and the status is still pending
    if (transactionHash && transactionStatus === 'pending') {
      console.log('Checking transaction status for hash:', transactionHash);
      
      // Set up a listener for transaction confirmation
      const checkTransactionStatus = async () => {
        try {
          // Get the provider from the blockchain service context
          const provider = blockchainService.getProvider(); // Revert to using context instance
          if (!provider) {
            console.error('No provider available to check transaction status');
            return;
          }
          
          // Check if the transaction has been mined
          const receipt = await provider.getTransactionReceipt(transactionHash);
          
          if (receipt) {
            // Transaction has been mined
            if (receipt.status === 1) {
              // Transaction was successful
              console.log('Transaction confirmed on blockchain:', receipt);
              setTransactionStatus('confirmed');
              toast.success('Campaign creation successful!', {
                id: 'transaction-status-update'
              });

              // Navigate to the campaign page after confirmation
              setTimeout(() => {
                // Use the state variable createdCampaignId
                if (createdCampaignId) {
                   window.location.href = `/campaign/${createdCampaignId}`;
                } else {
                   console.error("createdCampaignId is null, cannot redirect.");
                   // Optionally redirect to a default page or show an error
                }
              }, 2000); // Short delay for UI feedback
            } else {
              // Transaction failed
              console.error('Transaction failed on blockchain:', receipt);
              setTransactionStatus('failed');
              toast.error('Transaction failed on the blockchain');
            }
          } else {
            // Transaction not yet mined, check again after a delay
            setTimeout(checkTransactionStatus, 5000); // Check every 5 seconds
          }
        } catch (error) {
          console.error('Error checking transaction status:', error);
        }
      };
      
      // Start checking transaction status
      checkTransactionStatus();
      
      return () => {
        // No cleanup needed as setTimeout handles itself
      };
    }
    // Removed campaignId from dependency array as the effect primarily depends on hash/status
  }, [transactionHash, transactionStatus]);

  // Handle basic info form submission
  const handleBasicInfoSubmit = (data: any) => {
    setCampaignData(prev => ({
      ...prev,
      title: data.title,
      description: data.description,
      category: data.category,
      duration: data.duration,
      goalAmount: data.goalAmount
    }));
    
    setCurrentStep(WizardStep.MILESTONES);
  };
  
  // Handle milestones form submission
  const handleMilestonesSubmit = (data: any) => {
    setCampaignData(prev => ({
      ...prev,
      milestones: data.milestones
    }));
    
    setCurrentStep(WizardStep.MEDIA);
  };
  
  // Handle media form submission
  const handleMediaSubmit = (data: any) => {
    // Get the main image from either field
    const mainImage = data.mainImage || data.mainImageUrl;
    
    if (!mainImage) {
      toast.error('Main image is required');
      return;
    }

    // Update campaign data with the correct field names
    setCampaignData(prev => ({
      ...prev,
      mainImageUrl: mainImage,
      additionalImages: data.additionalImages || [],
      videoUrl: data.videoUrl || '',
      mediaConsent: data.mediaConsent
    }));
    
    setCurrentStep(WizardStep.REVIEW);
  };
  
  // Update error handling in the component
  const handleError = (error: unknown) => {
    console.error('Error:', error);
    setTransactionStatus('failed');
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }
  };
  
  // Update the handleSubmit function with proper error handling and type checking
  const handleSubmit = async (campaignData: CampaignData) => {
    try {
      setIsSubmitting(true);

      // Prepare metadata object
      const metadata = {
        title: campaignData.title,
        description: campaignData.description,
        // Include other relevant metadata fields if needed
        // milestones: campaignData.milestones // Maybe not needed in metadata if stored on-chain? Check requirements.
      };
      // Upload stringified metadata to IPFS
      const metadataHash = await uploadToIPFS(JSON.stringify(metadata));
      console.log("IPFS Metadata Hash:", metadataHash); // Log the hash

      // Pass the hash to createCampaign
      await createCampaign({
        ...campaignData,
        metadataIPFSHash: metadataHash,
      });
      setShowTransactionDialog(true);
      setTransactionStatus('pending');

      // Validate wallet connection first
      if (!userAddress) {
        const connected = await handleWalletConnection();
        if (!connected) {
          toast.error('Please connect your wallet to create a campaign');
          return false;
        }
      }

      // Validate required fields
      if (!campaignData.title?.trim() || !campaignData.description?.trim() || !campaignData.category || !campaignData.goalAmount || !campaignData.duration || !campaignData.milestones || campaignData.milestones.length === 0 || !metadataHash) {
        // Additional check for investment type campaigns
        if (campaignData.campaignType === '1' && (!campaignData.equityPercentage || !campaignData.minInvestment)) {
          toast.error('Please fill in all required fields');
          return false;
        }
        toast.error('Please fill in all required fields');
        return false;
      }

      // Format milestones for the contract
      const goalAmountInWei = parseEther(campaignData.goalAmount.toString()); // Use imported parseEther
      const formattedMilestones = campaignData.milestones.map(m => ({
        name: m.name,
        description: m.description,
        // Use standard bigint math
        target: (goalAmountInWei * BigInt(m.percentage || 0)) / 100n, // Ensure percentage is BigInt, handle potential null/undefined
        dueDate: m.dueDate instanceof Date ? Math.floor(m.dueDate.getTime() / 1000) : Math.floor(Date.now() / 1000)
      }));

      // Prepare media array
      const mediaArray = [
        campaignData.mainImageUrl,
        ...(campaignData.additionalImages || []).filter(Boolean)
      ];

      // Ensure we have a valid wallet address
      if (!userAddress) {
        throw new Error('Wallet address is required');
      }

      // Create campaign parameters
      const params = {
        title: campaignData.title,
        description: campaignData.description,
        category: campaignData.category,
        goalAmount: goalAmountInWei,
        duration: Math.floor(campaignData.duration * 24 * 60 * 60), // Convert days to seconds
        metadataIPFSHash: metadataHash, // Use the correct variable name
        milestones: formattedMilestones,
        beneficiaries: { [userAddress]: 100 } as Record<string, number>,
        stakeholders: [userAddress] as string[],
        campaignType: parseInt(campaignData.campaignType || '0')
      }

      // Add investment-specific parameters if this is an investment campaign
      if (campaignData.campaignType === '1') {
        if (!campaignData.equityPercentage || !campaignData.minInvestment) {
          toast.error('Equity percentage and minimum investment are required for investment campaigns');
          return false;
        }
        
        // Add equity percentage and minimum investment for investment campaigns
        Object.assign(params, {
          equityPercentage: parseUnits(campaignData.equityPercentage.toString(), 0), // Use imported parseUnits
          minInvestment: parseEther(campaignData.minInvestment.toString()) // Use imported parseEther
        });
      }

      console.log('Creating campaign with params:', params);

      try {
        // Create campaign and get the transaction receipt
        const receipt = await blockchainService.createCampaign(params);
        
        if (!receipt) {
          // Error already logged in service, just update status
          setTransactionStatus('failed');
          toast.error('Campaign creation transaction failed. Check console.');
          return false; // Indicate failure
        }

        // Transaction succeeded, now parse the receipt for the ID
        let campaignId: number | null = null;
        const campaignCreatedTopic = '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b';
        
        try {
            const campaignLog = receipt.logs?.find(log => log.topics?.[0] === campaignCreatedTopic);
            if (campaignLog && blockchainService.contract?.interface) { // Check if interface exists
                const parsedLog = blockchainService.contract.interface.parseLog(campaignLog);
                if (parsedLog?.name === 'CampaignCreated' && parsedLog.args?.id) {
                    const idBigInt = BigInt(parsedLog.args.id);
                     if (idBigInt <= BigInt(Number.MAX_SAFE_INTEGER)) {
                        campaignId = Number(idBigInt);
                     } else {
                         console.error("Campaign ID from event exceeds MAX_SAFE_INTEGER.");
                         toast.error("Error: Received unexpectedly large Campaign ID.");
                     }
                }
            }
        } catch (parseError) {
            console.error("Error parsing CampaignCreated event from receipt:", parseError);
        }

        if (campaignId === null) {
            console.error("Could not extract campaignId from successful transaction receipt:", receipt);
            setTransactionStatus('failed'); // Or maybe a 'warning' status?
            toast.error('Campaign created, but failed to retrieve its ID from events.');
            // Don't redirect if we don't have the ID
            return false;
        }

        // --- ID Found - Start Polling for Data ---
        setCreatedCampaignId(campaignId.toString());
        setTransactionStatus('indexing'); // New status: waiting for node
        toast.success('Campaign created! Waiting for data to be available...');
        
        const pollCampaignData = async (id: number, attemptsLeft = 10, delay = 3000) => {
            if (attemptsLeft <= 0) {
                console.error(`Polling timed out for campaign ID ${id}.`);
                toast.error(`Failed to load campaign data after creation. Please try refreshing or finding it manually.`);
                setTransactionStatus('failed'); // Indicate final failure
                setIsSubmitting(false); // Re-enable form
                return;
            }

            console.log(`Polling for campaign ${id}, attempts left: ${attemptsLeft}`);
            try {
                const campaignData = await blockchainService.getCampaign(id.toString());
                if (campaignData) {
                    console.log(`Campaign ${id} data found! Redirecting...`);
                    toast.success('Campaign data available!');
                    setTransactionStatus('confirmed'); // Final success state
                    setIsSubmitting(false); // Re-enable form
                    await router.push(`/campaign/${id}`); // Redirect now
                } else {
                    // Data not found yet, wait and retry
                    setTimeout(() => pollCampaignData(id, attemptsLeft - 1, delay), delay);
                }
            } catch (pollError) {
                console.error(`Error polling for campaign ${id}:`, pollError);
                 // Wait and retry even on error, might be temporary RPC issue
                setTimeout(() => pollCampaignData(id, attemptsLeft - 1, delay), delay);
            }
        };

        pollCampaignData(campaignId); // Start polling

        // Return true immediately as the *creation* transaction succeeded
        // The UI will show the 'indexing' status while polling happens.
        return true;
        // --- End Polling Logic ---

      } catch (error: unknown) { // Catch errors from createCampaign call itself
        console.error('Error sending createCampaign transaction:', error);
        setTransactionStatus('failed');
        const errorMessage = error instanceof Error ? error.message : 'Failed to send campaign creation transaction';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      handleError(error);
      return false;
    }
  };
  
  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    return ((currentStep + 1) / Object.keys(WizardStep).length) * 100;
  };

  const isStepComplete = (step: WizardStep): boolean => {
    switch (step) {
      case WizardStep.BASIC_INFO:
        return Boolean(
          campaignData.title &&
          campaignData.description &&
          campaignData.goalAmount &&
          campaignData.duration &&
          campaignData.category
        );
      case WizardStep.MILESTONES:
        return campaignData.milestones.length > 0 && 
          campaignData.milestones.every(m => 
            Boolean(m.name && m.description && (typeof m.percentage === 'number'))
          );
      case WizardStep.MEDIA:
        return Boolean(campaignData.mediaConsent);
      case WizardStep.REVIEW:
        return Boolean(
          campaignData.title &&
          campaignData.description &&
          campaignData.goalAmount &&
          campaignData.duration &&
          campaignData.milestones.length > 0 &&
          campaignData.mediaConsent
        );
      default:
        return false;
    }
  };

  const reinitializeContract = async () => {
    try {
      setIsSubmitting(true); // Use setIsSubmitting
      await BlockchainServiceFixedV3Instance.initializeContract(); // Call initializeContract directly

      // Removed diagnoseFunctionAvailability call
      // console.log('Contract diagnostics after reinitialization:', contractDiagnostics);

      // Assume success or check specific methods if needed after reinitialization
      // For example, check if createCampaign exists now:
      // const hasCreateMethod = BlockchainServiceFixedV3Instance.hasMethod('createCampaign');
      // if (hasCreateMethod) {
      // }
      toast.success('Contract reinitialized successfully.'); // Simplified message

      // if (contractDiagnostics.hasCreateCampaignInAbi) { // Removed check based on removed function
      //   toast.success('Contract reinitialized successfully. The createCampaign method is now available.');
      // } else { // Also comment out the corresponding else block
      //   toast.warning('Contract reinitialization issue. The createCampaign method is still missing.');
      // }
    } catch (error: unknown) {
      console.error("Failed to reinitialize contract:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to reinitialize contract: ${errorMessage}`);
    } finally {
      setIsSubmitting(false); // Use setIsSubmitting
    }
  };
  
  // Update the diagnostic function to use public methods
  const runDiagnostics = async () => {
    // Explicitly get blockchainService from context here if needed, though it should be in scope
    const currentBlockchainService = blockchainService; // Use the one from context hook result
    if (!currentBlockchainService) {
        toast.error("Blockchain service not available for diagnostics.");
        return;
    }
    try {
      setIsSubmitting(true); // Use setIsSubmitting
      toast.info('Running contract diagnostics...');

      // Get contract instance directly
      const diagnostics = await currentBlockchainService.diagnoseContractFunctions(); // Use correct function name
      console.log('CONTRACT DIAGNOSTICS:', diagnostics);

      if (diagnostics.error) {
        toast.error(`Contract Error: ${diagnostics.error}`);
        return;
      }
      
      // Display full diagnostics
      toast.success(
        <div>
          <strong>Contract Diagnostic Results:</strong>
          <ul style={{ marginTop: '10px', listStyleType: 'none', paddingLeft: '5px' }}>
            <li>• Contract Address: {diagnostics.contractAddress}</li>
            <li>• createCampaign in ABI: {diagnostics.hasCreateCampaignInAbi ? 'Yes' : 'No'}</li>
          </ul>
        </div>,
        { duration: 10000, id: 'contract-diagnostics' }
      );
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setIsSubmitting(false); // Use setIsSubmitting
    }
  };
  
  // Fix error handling for unknown types
  const handleDiagnosticError = (error: unknown) => {
    console.error('Error in contract diagnostics:', error);
    if (error instanceof Error) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.error('An unexpected error occurred during diagnostics');
    }
  };

  const handleContractError = (error: unknown) => {
    console.error('Error reinitializing contract:', error);
    if (error instanceof Error) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.error('An unexpected error occurred while reinitializing the contract');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create a Campaign</h1>
          <p className="text-gray-600">Share your project with the world and get funding from supporters.</p>
          
          {/* Wizard progress */}
          <div className="mt-8 mb-6">
            <Progress value={getProgressPercentage()} className="h-2" />
            
            <div className="mt-2">
              <Tabs value={currentStep.toString()} className="w-full">
                <TabsList className="w-full grid grid-cols-4 h-auto">
                  <TabsTrigger
                    value="0"
                    className={`data-[state=active]:bg-primary py-3 ${currentStep >= WizardStep.BASIC_INFO ? 'text-primary' : 'text-gray-400'}`}
                    disabled
                  >
                    Information
                  </TabsTrigger>
                  <TabsTrigger
                    value="1"
                    className={`data-[state=active]:bg-primary py-3 ${currentStep >= WizardStep.MILESTONES ? 'text-primary' : 'text-gray-400'}`}
                    disabled
                  >
                    Milestones
                  </TabsTrigger>
                  <TabsTrigger
                    value="2"
                    className={`data-[state=active]:bg-primary py-3 ${currentStep >= WizardStep.MEDIA ? 'text-primary' : 'text-gray-400'}`}
                    disabled
                  >
                    Media
                  </TabsTrigger>
                  <TabsTrigger
                    value="3"
                    className={`data-[state=active]:bg-primary py-3 ${currentStep >= WizardStep.REVIEW ? 'text-primary' : 'text-gray-400'}`}
                    disabled
                  >
                    Review
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Form Steps */}
          <div className="mt-8">
            {currentStep === WizardStep.BASIC_INFO && (
              <CampaignBasicInfoForm
                onNext={(data) => {
                  setCampaignData((prev) => ({
                    ...prev,
                    title: data.title,
                    description: data.description,
                    category: data.category,
                    duration: data.duration,
                    goalAmount: data.goalAmount
                  }));
                  setCurrentStep(WizardStep.MILESTONES);
                }}
                defaultValues={{
                  title: campaignData.title,
                  description: campaignData.description,
                  category: campaignData.category,
                  duration: campaignData.duration,
                  goalAmount: campaignData.goalAmount,
                  campaignType: '0'
                }}
              />
            )}
            
            {currentStep === WizardStep.MILESTONES && (
              <CampaignMilestonesForm
                onNext={(milestones) => {
                  setCampaignData((prev) => ({
                    ...prev,
                    milestones: (milestones.milestones || []) as CampaignMilestone[]
                  }));
                  setCurrentStep(WizardStep.MEDIA);
                }}
                onBack={() => setCurrentStep(WizardStep.BASIC_INFO)}
                defaultValues={{ milestones: campaignData.milestones }}
                campaignDuration={campaignData.duration}
              />
            )}
            
            {currentStep === WizardStep.MEDIA && (
              <CampaignMediaForm
                onNext={(mediaData) => {
                  setCampaignData((prev) => ({
                    ...prev,
                    mainImageUrl: mediaData.mainImage || mediaData.mainImageUrl || '',
                    additionalImages: mediaData.additionalImages || [],
                    videoUrl: mediaData.videoUrl || '',
                    mediaConsent: mediaData.mediaConsent
                  }));
                  setCurrentStep(WizardStep.REVIEW);
                }}
                onBack={() => setCurrentStep(WizardStep.MILESTONES)}
                defaultValues={{
                  mainImage: campaignData.mainImageUrl,
                  mainImageUrl: campaignData.mainImageUrl,
                  additionalImages: campaignData.additionalImages || [],
                  videoUrl: campaignData.videoUrl || '',
                  mediaConsent: campaignData.mediaConsent
                }}
              />
            )}
            
            {currentStep === WizardStep.REVIEW && (
              <CampaignReviewForm
                campaignData={{
                  title: campaignData.title,
                  description: campaignData.description,
                  category: campaignData.category,
                  campaignType: '0',
                  duration: campaignData.duration,
                  goalAmount: campaignData.goalAmount,
                  mainImage: campaignData.mainImageUrl,
                  additionalImages: campaignData.additionalImages || [],
                  videoUrl: campaignData.videoUrl,
                  milestones: campaignData.milestones
                }}
                onSubmit={() => handleSubmit(campaignData)} // Wrap handleSubmit
                onBack={() => setCurrentStep(WizardStep.MEDIA)}
                isSubmitting={isSubmitting}
                onEdit={(step) => setCurrentStep(step)}
              />
            )}
          </div>
          
          {/* Transaction Dialog */}
          <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {transactionStatus === 'pending' ? 'Transaction In Progress' : 
                   transactionStatus === 'confirmed' ? 'Transaction Confirmed' : 
                   'Transaction Failed'}
                </DialogTitle>
                <DialogDescription>
                  {transactionStatus === 'pending' 
                    ? 'Your transaction is being processed on the blockchain.'
                    : transactionStatus === 'confirmed'
                    ? 'Your campaign has been successfully created.'
                    : 'There was an error creating your campaign.'}
                </DialogDescription>
              </DialogHeader>
              
              {transactionStatus === 'pending' && (
                <div className="space-y-2 mt-2 text-sm">
                  <p>
                    Your transaction has been submitted to the blockchain and is awaiting confirmation. 
                    This process typically takes 2-5 minutes but can sometimes take longer.
                  </p>
                  <p className="font-semibold text-orange-500">
                    Please do NOT refresh this page or close your browser while confirmation is in progress.
                  </p>
                  <p className="text-sm text-gray-500">
                    The blockchain needs time to process and confirm your transaction. This is a normal part of 
                    blockchain transactions and ensures your campaign is securely recorded.
                  </p>
                  <p className="text-sm text-blue-500 mt-2 font-medium">
                    If you've been waiting for more than 3 minutes and believe the transaction has already been confirmed, 
                    you can click the "Complete Transaction" button below to proceed.
                  </p>
                </div>
              )}
              
              {transactionStatus === 'confirmed' && (
                <div className="space-y-2 mt-2 text-sm">
                  <p>
                    Your campaign has been successfully created and confirmed on the blockchain!
                  </p>
                  <p className="text-sm text-green-600">
                    The transaction has been fully validated and recorded on the Telos blockchain.
                  </p>
                </div>
              )}
              
              {transactionStatus === 'failed' && (
                <div className="space-y-2 mt-2 text-sm">
                  <p>
                    There was an error creating your campaign. Please try again.
                  </p>
                  <p className="text-sm text-red-500">
                    If the problem persists, please check your wallet connection and balance.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col items-center justify-center p-4 space-y-4">
                {transactionStatus === 'pending' && (
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <p className="text-sm text-gray-500 animate-pulse">Awaiting blockchain confirmation...</p>
                  </div>
                )}
                
                {transactionStatus === 'confirmed' && (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                )}
                
                {transactionStatus === 'failed' && (
                  <AlertCircle className="h-16 w-16 text-red-500" />
                )}
                
                {transactionHash && (
                  <div className="flex flex-col items-center">
                    <p className="text-sm mb-2">Transaction Hash:</p>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {transactionHash.substring(0, 20)}...{transactionHash.substring(transactionHash.length - 8)}
                      </code>
                      <a 
                        href={`https://explorer.telos.net/transaction/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}