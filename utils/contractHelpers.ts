/**
 * Contract Helpers
 * 
 * This file centralizes contract ABI imports to avoid case sensitivity issues.
 */

// Import the contract ABIs with explicit paths - use the available files
// import WowzaRushABI from '../web3/contracts/WowzaRush_metadata.json'; // Keep commented or remove if not used elsewhere
import BadgeNFTABI from '../contracts/BadgeNFT.json';
import GovernanceABI from '../contracts/Governance.json';
import { ethers, parseEther } from 'ethers';
import { toast } from 'sonner';

// Contract addresses
export const WOWZA_RUSH_CONTRACT_ADDRESS = '0x15493F1ae7D556e0150D76528dd06d76050caf43';

// Network configuration for Telos EVM testnet
export const TELOS_TESTNET_CONFIG = {
  chainId: '0x29',
  chainName: 'Telos EVM Testnet',
  nativeCurrency: {
    name: 'TLOS',
    symbol: 'TLOS',
    decimals: 18
  },
  rpcUrls: [
    'https://testnet.telos.net/evm',
    'https://telos-testnet.rpc.thirdweb.com',
    'https://telos-evm-testnet.rpc.ambitio.us'
  ],
  blockExplorerUrls: ['https://testnet.teloscan.io/']
};

// Define the Milestone interface to match the contract
export interface WowzaRushMilestone {
  name: string;
  targetAmount: bigint;
  isCompleted: boolean;
  isFunded: boolean;
  proofOfCompletion: string;
  fundsReleased: number;
  isUnderReview: boolean;
}

// Define the complete interface for the createCampaign function
export interface CreateCampaignParams {
  title: string;
  description: string;
  category: string;
  goalAmount: bigint;
  duration: number;
  media: string[];
  milestones: {
    name: string;
    description: string;
    target: bigint;
    dueDate?: number;
    completed?: boolean;
    fundsReleased?: boolean;
  }[];
  beneficiaries: string;
  stakeholders: string[];
}

/**
 * Get the WowzaRush contract ABI
 * This function ensures a valid ABI is always returned, even if there's an issue with imports
 */
export function getWowzaRushABI() {
  try {
    // Return the full ABI provided from Remix compilation (updated 2025-04-05 PM - includes DebugDeadlineValue)
    return [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			}
		],
		"name": "CampaignCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "CampaignUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "contributor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ContributionMade",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "deadlineStored",
				"type": "uint256"
			}
		],
		"name": "DebugDeadlineValue",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "feeType",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newRate",
				"type": "uint256"
			}
		],
		"name": "FeeRateUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "series",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "milestoneIndex",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundingMilestoneReleased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "series",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountRaised",
				"type": "uint256"
			}
		],
		"name": "FundingRoundCompleted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "series",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "targetAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "valuation",
				"type": "uint256"
			}
		],
		"name": "FundingRoundCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "seriesIndex",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "investor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "InvestmentMade",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "MilestoneAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "milestoneIndex",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "approved",
				"type": "bool"
			}
		],
		"name": "MilestoneApproved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "milestoneIndex",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "MilestoneCompleted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"name": "PlatformFeesCollected",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "tokenContract",
				"type": "address"
			}
		],
		"name": "TokenContractSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "bool",
				"name": "enabled",
				"type": "bool"
			}
		],
		"name": "TokenDiscountsToggled",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "BASIS_POINTS",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_MILESTONE_FEE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_TRANSACTION_FEE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "milestoneIndex",
				"type": "uint256"
			}
		],
		"name": "approveMilestone",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			}
		],
		"name": "claimFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			}
		],
		"name": "contribute",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "goalAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			},
			{
				"components": [
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "dueDate",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "completed",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "fundsClaimed",
						"type": "bool"
					}
				],
				"internalType": "struct WowzaRushStorage.Milestone[]",
				"name": "milestones",
				"type": "tuple[]"
			}
		],
		"name": "createCampaign",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			}
		],
		"name": "getCampaignDetails",
		"outputs": [
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "goalAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountRaised",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "completed",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "fundsClaimed",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "milestoneCount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "contributorCount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "contributor",
				"type": "address"
			}
		],
		"name": "getContributorCampaigns",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			}
		],
		"name": "getCreatorCampaigns",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getFeeRates",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "transactionFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "milestoneFee",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "useDiscounts",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "milestoneIndex",
				"type": "uint256"
			}
		],
		"name": "getMilestoneDetails",
		"outputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "completed",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "fundsClaimed",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "contributor",
				"type": "address"
			}
		],
		"name": "getUserContribution",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "initialize",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newFeePercent",
				"type": "uint256"
			}
		],
		"name": "setMilestoneFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "tokenAddress",
				"type": "address"
			}
		],
		"name": "setTokenContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "newFeePercent",
				"type": "uint256"
			}
		],
		"name": "setTransactionFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bool",
				"name": "enabled",
				"type": "bool"
			}
		],
		"name": "toggleTokenDiscounts",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferPlatformOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawPlatformFees",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
  } catch (e) {
    console.error('Error getting contract ABI:', e);
    throw new Error('Failed to load contract ABI');
  }
}

// Export contract configurations
export const getWowzaRushConfig = () => ({
  address: WOWZA_RUSH_CONTRACT_ADDRESS,
  abi: getWowzaRushABI(),
});

// Format milestone data for the contract with the right structure
export function formatMilestonesForContract(milestones: any[]): [string[], string[], number[], bigint[]] {
  try {
    console.log("Formatting milestones for contract:", milestones ? milestones.length : 0, "milestones");
    
    // Initialize arrays to avoid undefined returns
    const milestoneTitles: string[] = [];
    const milestoneDescriptions: string[] = [];
    const milestoneDueDates: number[] = [];
    const milestoneTargetAmounts: bigint[] = [];

    // Validate milestones input
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      console.warn("No valid milestones provided to formatMilestonesForContract");
      // Return default arrays with at least one item to prevent "undefined length" errors
      return [
        ["Default Milestone"], 
        [""], 
        [Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)], 
        [parseEther("0.1")]
      ];
    }

    // Process each milestone
    milestones.forEach((milestone, index) => {
      try {
        if (!milestone) {
          console.warn(`Milestone at index ${index} is undefined or null, skipping`);
          return; // Skip this iteration
        }

        // Extract and validate title
        let title = milestone.title || `Milestone ${index + 1}`;
        milestoneTitles.push(title);

        // Extract and validate description
        let description = milestone.description || "";
        milestoneDescriptions.push(description);

        // Extract and validate due date
        let dueDate = 0;
        try {
          if (milestone.dueDate) {
            dueDate = parseInt(milestone.dueDate.toString(), 10);
            if (isNaN(dueDate)) {
              console.warn(`Invalid due date for milestone ${index}, using current time`);
              dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
            }
          } else {
            console.warn(`No due date for milestone ${index}, using default`);
            dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
          }
        } catch (error) {
          console.error(`Error processing due date for milestone ${index}:`, error);
          dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        }
        milestoneDueDates.push(dueDate);

        // Extract and validate target amount
        let targetAmount: bigint;
        try {
          if (milestone.targetAmount) {
            // Ensure target amount is a string before converting
            const targetAmountStr = typeof milestone.targetAmount === 'number' 
              ? milestone.targetAmount.toString() 
              : (milestone.targetAmount || "0.1");
            
            // Convert to BigNumber
            targetAmount = parseEther(targetAmountStr);
          } else {
            console.warn(`No target amount for milestone ${index}, using default`);
            targetAmount = parseEther("0.1");
          }
        } catch (error) {
          console.error(`Error processing target amount for milestone ${index}:`, error);
          targetAmount = parseEther("0.1");
        }
        milestoneTargetAmounts.push(targetAmount);
      } catch (milestoneError) {
        console.error(`Error processing milestone ${index}:`, milestoneError);
        // Add default values for this milestone to maintain array length consistency
        milestoneTitles.push(`Milestone ${index + 1}`);
        milestoneDescriptions.push("");
        milestoneDueDates.push(Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60));
        milestoneTargetAmounts.push(parseEther("0.1"));
      }
    });

    // Final validation - ensure we have at least one item in each array
    if (milestoneTitles.length === 0) {
      console.warn("No valid milestones were formatted, adding default milestone");
      milestoneTitles.push("Default Milestone");
      milestoneDescriptions.push("");
      milestoneDueDates.push(Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60));
      milestoneTargetAmounts.push(parseEther("0.1"));
    }

    // Final safety check - ensure all arrays are the same length
    const maxLength = Math.max(
      milestoneTitles.length,
      milestoneDescriptions.length,
      milestoneDueDates.length,
      milestoneTargetAmounts.length
    );

    while (milestoneTitles.length < maxLength) {
      milestoneTitles.push(`Milestone ${milestoneTitles.length + 1}`);
    }

    while (milestoneDescriptions.length < maxLength) {
      milestoneDescriptions.push("");
    }

    while (milestoneDueDates.length < maxLength) {
      milestoneDueDates.push(Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60));
    }

    while (milestoneTargetAmounts.length < maxLength) {
      milestoneTargetAmounts.push(parseEther("0.1"));
    }

    console.log("Formatted milestones complete:", {
      titlesCount: milestoneTitles.length,
      descriptionsCount: milestoneDescriptions.length,
      dueDatesCount: milestoneDueDates.length,
      targetAmountsCount: milestoneTargetAmounts.length
    });

    return [milestoneTitles, milestoneDescriptions, milestoneDueDates, milestoneTargetAmounts];
  } catch (error) {
    console.error("Error in formatMilestonesForContract:", error);
    // Return simple default arrays to avoid null/undefined errors
    return [
      ["Default Milestone"], 
      [""], 
      [Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)], 
      [parseEther("0.1")]
    ];
  }
}

// Format milestones data for the flattened createCampaign function
export const formatFlattenedMilestones = (milestones: any[]): { 
  names: string[], 
  descriptions: string[], 
  amounts: number[], 
  completions: number[] 
} => {
  if (!milestones || !Array.isArray(milestones)) {
    console.warn('Invalid milestones data for flattened format:', milestones);
    return { names: [], descriptions: [], amounts: [], completions: [] };
  }
  
  const names: string[] = [];
  const descriptions: string[] = [];
  const amounts: number[] = [];
  const completions: number[] = [];
  
  milestones.forEach(m => {
    if (!m) {
      console.warn('Invalid milestone entry for flattened format:', m);
      return;
    }
    
    // Push name (required)
    names.push(typeof m.name === 'string' ? m.name : "Unnamed Milestone");
    
    // Push description (default to empty string)
    descriptions.push(m.description || "");
    
    // Push amount (ensure valid number)
    let amount = 0;
    if (m.target !== undefined) {
      if (typeof m.target === 'number') {
        amount = m.target;
      } else if (typeof m.target === 'string') {
        // Try to parse the string as a number
        const parsed = parseFloat(m.target);
        if (!isNaN(parsed)) {
          amount = parsed;
        }
      }
    }
    amounts.push(amount);
    
    // Push completion date (default to current timestamp)
    let completion = Math.floor(Date.now() / 1000); // Default to now
    if (m.dueDate) {
      if (typeof m.dueDate === 'number') {
        completion = m.dueDate;
      } else if (m.dueDate instanceof Date) {
        completion = Math.floor(m.dueDate.getTime() / 1000);
      }
    }
    completions.push(completion);
  });
  
  return { names, descriptions, amounts, completions };
};

export default {
  getWowzaRushABI,
  getWowzaRushConfig,
  WOWZA_RUSH_CONTRACT_ADDRESS,
  formatMilestonesForContract,
  formatFlattenedMilestones
};