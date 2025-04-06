import { ethers, LogDescription, ZeroAddress, AbiCoder, formatEther, hexlify, parseUnits, toBeArray, Contract, BrowserProvider, JsonRpcProvider, Signer, Provider, FeeData, ContractTransactionResponse } from 'ethers'; // Add ContractTransactionResponse
import { toast } from 'sonner';
import { WOWZA_RUSH_CONTRACT_ADDRESS, getWowzaRushABI } from '../utils/contractHelpers';
import { RPCManager } from './rpcManager';
import extractNumericIdUtil from '../utils/extractNumericId';
import { BlockchainRewardTier, Proposal, VotingPower, FundingRound } from '../types';

// Debug mode flag - can be controlled via environment variable in the future
export const DEBUG_MODE = false;

// Define Campaign and Milestone interfaces locally if not available from types
interface Campaign {
  id: number;
  title: string;
  description: string;
  category: string;
  creator: string;
  goalAmount: bigint; // Use bigint
  currentAmount?: number;
  totalFunded?: bigint; // Use bigint
  status?: string;
  duration?: number;
  createdAt?: number;
  isActive?: boolean;
  milestones?: any[];
  media?: string[];
  donors?: any[];
  contributorsCount?: number;
  [key: string]: any;
}

interface Milestone { // Matches the 6-field structure from getWowzaRushABI
  name: string;
  description: string;
  target: bigint; // Use bigint
  dueDate: bigint; // Use bigint
  completed: boolean;
  fundsReleased: boolean;
  [key: string]: any;
}

// Export the required types
// Use the imported CreateCampaignParams directly
import { CreateCampaignParams } from '../utils/types';

// Remove the type alias as we import directly now
// type CreateCampaignParams = ImportedCreateCampaignParams;


export interface UpdateCampaignParams {
  media: string[];
  description: string;
  proofOfWork: string;
  beneficiaries: string;
  title?: string;
  category?: string;
  mediaIPFSHash?: string;
}

export interface BlockchainServiceConfig {
  contractAddress?: string;
  rpcUrl?: string;
}

// Matches contract return structure for getCampaignBasicInfo
export interface CampaignBasicInfo {
  creator: string;
  title: string;
  description: string; // Note: Description might not be in all versions of basicInfo
  category: string;
  goalAmount: bigint; // Use bigint
  totalFunded: bigint; // Use bigint
  duration: bigint; // Contract returns uint256
  createdAt: bigint; // Contract returns uint256
  isActive: boolean;
}


export interface CampaignInvestmentInfo {
  campaignType: number;
  equityPercentage: bigint; // Use bigint
  minInvestment: bigint; // Use bigint
}

// Matches the 6-field structure from getWowzaRushABI used in createCampaign
export interface CampaignMilestoneInfo {
  name: string;
  description: string; // Added description
  targetAmount: bigint; // Use bigint
  dueDate: bigint; // Use bigint
  isCompleted: boolean; // Maps to 'completed' in ABI
  fundsReleased: boolean; // Maps to 'fundsReleased' in ABI
}

/**
 * Enhanced Blockchain Service Fixed for reliability
 * This class provides robust handling of the WowzaRush contract
 */
class BlockchainServiceFixed {
  private isInitialized: boolean = false;
  private initializationAttempts: number = 0;
  private readonly MAX_INITIALIZATION_ATTEMPTS = 3;
  private lastInitializationAttempt: number = 0;
  private readonly INITIALIZATION_COOLDOWN = 5000;
  private initializationTimeout: NodeJS.Timeout | null = null;
  private providerCheckInterval: NodeJS.Timeout | null = null;
  private isInitializing: boolean = false;
  private contract: Contract | null = null; // Use imported Contract
  private contractAbi: any[] = [];
  private provider: Provider | null = null; // Use imported Provider
  private projectConfig: BlockchainServiceConfig;
  private walletState: {
    isConnected: boolean;
    address: string | null;
    chainId: number | null;
  };
  private createCampaignSignature: string | null = null;
  private _lastCreateAttempt: number | null = null;
  
  /**
   * Constructor that initializes the blockchain service
   */
  constructor(config?: BlockchainServiceConfig) {
    console.log('Initializing BlockchainServiceFixed with config:', config);
    
    // Initialize state
    this.isInitialized = false;
    this.walletState = {
      isConnected: false,
      address: null,
      chainId: null
    };
    
    // Save config
    this.projectConfig = config || {};
    
    // Clean up the previous interval if it exists
    if (this.providerCheckInterval) {
      clearInterval(this.providerCheckInterval);
      this.providerCheckInterval = null;
    }
    
    if (typeof window !== 'undefined') {
      // Replace interval with a more efficient check
      let providerCheckCount = 0;
      const maxChecks = 10;
      
      const checkProvider = () => {
        if (providerCheckCount >= maxChecks) {
          if (this.providerCheckInterval) {
            clearInterval(this.providerCheckInterval);
            this.providerCheckInterval = null;
          }
          console.warn('Ethereum provider not found after multiple checks');
          return;
        }
        
        if (window.ethereum) {
          if (this.providerCheckInterval) {
            clearInterval(this.providerCheckInterval);
            this.providerCheckInterval = null;
          }
          this.initialize().catch(console.error);
        }
        providerCheckCount++;
      };
      
      this.providerCheckInterval = setInterval(checkProvider, 1000);
      
      // Cleanup on window unload
      window.addEventListener('unload', () => {
        if (this.providerCheckInterval) {
          clearInterval(this.providerCheckInterval);
        }
        if (this.initializationTimeout) {
          clearTimeout(this.initializationTimeout);
        }
      });
    }
  }
  
  /**
   * Public initialize method
   */
  public async initialize(): Promise<boolean> {
    try {
      // Prevent multiple simultaneous initialization attempts
      if (this.isInitializing) {
        console.log('Initialization already in progress');
        return false;
      }

      this.isInitializing = true;
      
      // Clear any existing timeout
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
      }
      
      // Set a timeout for the entire initialization process
      const initPromise = new Promise<boolean>((resolve, reject) => {
        this.initializationTimeout = setTimeout(() => {
          this.isInitializing = false;
          reject(new Error('Initialization timed out'));
        }, 15000); // 15 second timeout
        
        this._initialize()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            if (this.initializationTimeout) {
              clearTimeout(this.initializationTimeout);
            }
          });
      });
      
      const result = await initPromise;
      this.isInitializing = false;
      return result;
      } catch (error) {
      this.isInitializing = false;
      console.error('Initialization failed:', error);
      return false;
    }
  }
  
  private async _initialize(): Promise<boolean> {
    try {
      console.log('Initializing BlockchainServiceFixed...');
      
      // Listen for account changes
      if (typeof window !== 'undefined' && window.ethereum) {
        console.log('Setting up account change listeners');
        
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          console.log('Accounts changed:', accounts);
          if (accounts.length > 0) {
            this.walletState.isConnected = true;
            this.walletState.address = accounts[0];
            // Re-initialize contract with new signer when account changes
            this.initializeContract().catch(e => {
              console.error('Failed to reinitialize contract after account change:', e);
            });
    } else {
            this.walletState.isConnected = false;
            this.walletState.address = null;
          }
        });
        
        window.ethereum.on('chainChanged', (chainId: string) => {
          console.log('Chain changed:', chainId);
          // Convert chainId to a number
          this.walletState.chainId = parseInt(chainId, 16);
          // Re-initialize contract for new chain
          this.initializeContract().catch(e => {
            console.error('Failed to reinitialize contract after chain change:', e);
          });
        });
      }
      
      // Initialize contract
      const contractInitialized = await this.initializeContract();
      this.isInitialized = true;
      
      // Return success
      return contractInitialized;
    } catch (e) {
      console.error('Error initializing BlockchainServiceFixed:', e);
        return false;
    }
  }
  
  /**
   * Checks if the wallet is connected to the blockchain
   * @returns boolean indicating if a wallet is connected
   */
  public isConnected(): boolean {
    return this.walletState.isConnected;
  }

  /**
   * Connect wallet to the blockchain
   * @returns Connected address or null if connection failed
   */
  public async connectWallet(): Promise<string | null> {
    try {
      // Make sure the provider is initialized
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found. Please install MetaMask or another compatible wallet.');
      }
  
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        // Update wallet state
        this.walletState.isConnected = true;
        this.walletState.address = accounts[0];
        
        console.log('Wallet connected successfully, address:', accounts[0]);
        
        // Get chain ID
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          this.walletState.chainId = parseInt(chainId, 16);
          console.log('Connected to chain ID:', this.walletState.chainId);
        } catch (error) {
          console.warn('Could not get chain ID:', error);
        }
        
        // Create a new BrowserProvider with the connected wallet (v6)
        const browserProvider = new BrowserProvider((window as any).ethereum); // Use BrowserProvider
        this.provider = browserProvider;

        // Get signer from the provider
        const signer = await browserProvider.getSigner(); // Use browserProvider and await

        // Get contract ABI and address
        const abi = this.getContractAbi();
        const contractAddress = WOWZA_RUSH_CONTRACT_ADDRESS;
        
        // Create a new contract instance with the signer
        this.contract = new ethers.Contract(contractAddress, abi, signer);
        
        // Verify the contract is connected with a signer
        if (this.contract.signer) {
          console.log('Contract reinitialized with signer after wallet connection');
          this.isInitialized = true;
        } else {
          console.warn('Contract still has no signer after wallet connection');
        }
        
        // Return the connected address
        return accounts[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * Gets the current wallet address if connected
   * @returns wallet address or null if not connected
   */
  public getWalletAddress(): string | null {
    return this.walletState.address;
  }

  /**
   * Gets the current wallet state
   * @returns The current wallet state containing connection status, address, and chain ID
   */
  public getWalletState(): { isConnected: boolean; address: string | null; chainId: number | null } {
    return {
      isConnected: this.walletState.isConnected,
      address: this.walletState.address,
      chainId: this.walletState.chainId
    };
  }
  
  /**
   * Resynchronizes the wallet connection state
   * @returns Promise<boolean> indicating if synchronization was successful
   */
  public async resynchronizeConnectionState(): Promise<boolean> {
    try {
      // Check if window and ethereum are available
      if (typeof window === 'undefined' || !window.ethereum) {
        console.warn('Ethereum provider not available');
        this.walletState.isConnected = false;
        this.walletState.address = null;
      return false;
      }

      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      // Update connection state
            if (accounts && accounts.length > 0) {
        this.walletState.isConnected = true;
        this.walletState.address = accounts[0];
        
        // Get chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        this.walletState.chainId = parseInt(chainId, 16);
        
        // Reinitialize contract if needed
        if (!this.contract) {
          await this.initializeContract();
        }
        
        return true;
      } else {
        this.walletState.isConnected = false;
        this.walletState.address = null;
        this.walletState.chainId = null;
        return false;
      }
    } catch (error) {
      console.error('Error resynchronizing wallet state:', error);
      this.walletState.isConnected = false;
      this.walletState.address = null;
      this.walletState.chainId = null;
      return false;
    }
  }
  
  /**
   * Ensures the service is initialized before performing operations
   * @returns Promise that resolves when initialization is complete
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized && this.contract) {
      console.log('Contract already initialized, using existing instance');
      return true;
    }
    
    console.log('ensureInitialized called, current state:', {
      isInitialized: this.isInitialized,
      hasContract: !!this.contract,
      walletState: this.walletState
    });
    
    // Retry mechanism with exponential backoff
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 500; // 500ms
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Initialization attempt ${retryCount + 1} of ${maxRetries}`);
        
        // Force complete reinitialization of the contract
        await this.initializeContract();
        
        // Verify we have a working contract
        if (this.contract) {
          this.isInitialized = true;
          console.log('Blockchain service initialized successfully with contract');
        return true;
        } else {
          throw new Error('Contract initialization failed - contract is still null');
        }
      } catch (error) {
        retryCount++;
        const delay = baseDelay * Math.pow(2, retryCount - 1);
        console.error(`Initialization attempt ${retryCount} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('All initialization attempts failed');
          throw new Error('Failed to initialize blockchain service after multiple attempts');
        }
      }
    }
    
    return false;
  }
  
  /**
   * Creates a new campaign on the blockchain
   * @param params Parameters for campaign creation
   * @returns Campaign ID if successful, -1 if unsuccessful
   */
  public async createCampaign(params: CreateCampaignParams): Promise<ethers.TransactionReceipt | null> { // Return full receipt or null
    try {
      // Ensure we have a signer
      const signer = this.getSigner();
      if (!signer) {
        throw new Error('No signer available. Please connect your wallet.');
      }

      // Sanitize and validate parameters
      const title = params.title || '';
      const category = params.category || '0';
      const goalAmount = BigInt(params.goalAmount || '0'); // Use BigInt
      const duration = params.duration || 0;

      // Debug - log raw params
      console.log('Raw campaign params:', {
        title: params.title,
        description: params.description?.substring(0, 50) + '...',
        category: params.category,
        goalAmount: params.goalAmount?.toString(),
        duration: params.duration,
        milestones: params.milestones?.length || 0
      });

      // Create metadata JSON from description
      const metadataJSON = JSON.stringify({
        description: params.description || '',
        beneficiaries: params.beneficiaries || {},
        stakeholders: params.stakeholders || []
      });

      console.log('Creating regular campaign with params:');
      console.log({
        title,
        category,
        goalAmount: goalAmount.toString(),
        duration,
        metadataJSON: metadataJSON?.length > 100 ? metadataJSON.substring(0, 100) + '...' : metadataJSON
      });

      // Sanitize milestones to match contract's exact structure
      const sanitizedMilestones = [];
      
      if (params.milestones && Array.isArray(params.milestones)) {
        for (let i = 0; i < params.milestones.length; i++) {
          const milestone = params.milestones[i];
          if (!milestone) {
            console.warn(`Milestone ${i} is undefined, skipping`);
            continue;
          }
          
          // Log each milestone for debugging
          console.log(`Milestone ${i+1}:`, {
            name: milestone.name || 'Unnamed',
            target: milestone.target ? milestone.target.toString() : 'undefined',
            description: milestone.description || '' // Log description
          });
          
          // Validate milestone data before adding it
          if (!milestone.name) {
            console.warn(`Milestone ${i} missing name, using default`);
          }
          if (!milestone.description) {
            console.warn(`Milestone ${i} missing description, using default`);
          }
          if (!milestone.target) {
            console.warn(`Milestone ${i} missing target amount, using zero`);
          }
          
          // Convert milestone to contract's expected structure
          sanitizedMilestones.push([
            milestone.name || 'Unnamed Milestone',
            milestone.description || 'No description provided',
            BigInt(milestone.target || '0'), // Use BigInt
            milestone.dueDate || Math.floor(Date.now() / 1000) + 604800 // Default to 1 week from now
          ]);
        }
      }

      // Double-check all sanitizedMilestones for undefined values
      for (let i = 0; i < sanitizedMilestones.length; i++) {
        const m = sanitizedMilestones[i];
        console.log(`Full milestone ${i} structure:`, JSON.stringify({
          title: m[0],
          description: m[1],
          targetAmount: m[2].toString(),
          dueDate: m[3]
        }));
      }

      // Ensure contract is initialized
      await this.ensureInitialized();

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Check if the createCampaign method is available
      if (!this.contract.createCampaign) {
        throw new Error('createCampaign method not available in contract');
      }

      // Debug log all parameters before final contract call
      console.log('Contract call parameters:', {
        title,
        category,
        goalAmount: goalAmount.toString(),
        duration,
        metadataIPFSHash: params.metadataIPFSHash || 'MISSING_IPFS_HASH', // Use params.metadataIPFSHash
        milestoneCount: sanitizedMilestones.length
      });

      console.log('Testing parameter encoding before contract call');
      console.log('Parameter types:', {
        title: typeof title,
        category: typeof category,
        goalAmount: typeof goalAmount === 'object' ? 'object (BigNumber)' : typeof goalAmount,
        duration: typeof duration,
        metadataJSON: typeof metadataJSON,
        milestones: 'array of arrays'
      });

      try { // Main try for transaction sending logic
        // Define transaction overrides as a separate object
        // Use hardcoded gas price based on Telos fixed price model
        const gasPrice = parseUnits('600', 'gwei'); // Set slightly above expected 550 Gwei
        console.log(`[Debug] Using hardcoded gasPrice for Telos: ${gasPrice.toString()}`);

        const overrides = {
          gasLimit: hexlify(toBeArray(5000000)), // Use top-level hexlify/toBeArray
          gasPrice: gasPrice // Use hardcoded gas price
        };

        // Log full milestone structure before the call
        console.log(`Final sanitized milestones (${sanitizedMilestones.length}):`);
        for (let i = 0; i < sanitizedMilestones.length; i++) {
          // Add safe stringify replacer for logging individual milestones
          console.log(`Milestone ${i} structure:`, JSON.stringify(sanitizedMilestones[i], (key, value) => typeof value === 'bigint' ? value.toString() : value));
        }

        // Create an array of milestone OBJECTS matching the corrected 5-field ABI/Struct
        const milestoneObjects = sanitizedMilestones.map(m => ({
            title: String(m[0] || ''),       // Use 'title' to match struct/ABI
            description: String(m[1] || ''),
            amount: BigInt(m[2] || '0'),     // Use 'amount' to match struct/ABI
            completed: false,                // Use 'completed'
            fundsClaimed: false,             // Use 'fundsClaimed' to match struct/ABI
            dueDate: BigInt(m[3] || '0')     // Add dueDate from sanitizedMilestones[3]
            // Removed dueDate
        }));

        // Log the array of objects
        console.log("Milestone objects for contract call (5-field):", JSON.stringify(milestoneObjects, (key, value) => typeof value === 'bigint' ? value.toString() : value));

        // Check contract for campaign creation fee requirement
        let campaignCreationFee = 0n; // Use bigint literal
        try {
          if (this.hasMethod('CAMPAIGN_CREATION_FEE')) {
            // Ensure contract is not null before calling
            if (!this.contract) throw new Error("Contract not available for fee check");
            // Add specific try-catch for the contract call itself
            try {
                const feeResult = await this.contract.CAMPAIGN_CREATION_FEE();
                // Now try converting to BigInt safely
                try {
                    campaignCreationFee = BigInt(feeResult);
                    console.log("Campaign creation fee required:", formatEther(campaignCreationFee), "ETH");
                } catch (conversionError: any) {
                    console.warn(`Error converting CAMPAIGN_CREATION_FEE result (${feeResult}) to BigInt:`, conversionError?.message || conversionError);
                    campaignCreationFee = 0n; // Keep fee as 0n if conversion fails
                }
            } catch (feeError: any) {
                 // Log safely, avoid logging complex object if not Error instance
                 if (feeError instanceof Error) {
                    console.warn("Error calling CAMPAIGN_CREATION_FEE:", feeError.message);
                 } else {
                    console.warn("Error calling CAMPAIGN_CREATION_FEE: Non-standard error object received.");
                 }
                 campaignCreationFee = 0n; // Keep fee as 0n if the call fails
            }
          }
        } catch (error) { // Catch errors from hasMethod or other unexpected issues
          console.warn("Could not determine campaign creation fee (outer check):", error);
          campaignCreationFee = 0n; // Ensure fee is 0 if outer check fails
        }

        // Add transaction value if campaign creation requires a fee
        const txOptions: any = {
          gasLimit: hexlify(toBeArray(3000000)) // Use top-level hexlify/toBeArray
        };

        if (campaignCreationFee > 0n) { // Use bigint comparison
          console.log("Adding campaign creation fee to transaction:", formatEther(campaignCreationFee), "ETH"); // Use imported formatEther
          txOptions.value = campaignCreationFee;
        }

        // Wrap the contract call in a try-catch to provide better error information
        try {
          console.log("Final parameter types:", {
            title: typeof title,
            category: typeof category,
            goalAmount: typeof goalAmount,
            duration: typeof duration,
            metadataJSON: typeof metadataJSON,
            contractMilestones: typeof milestoneObjects // Use correct variable name
          });

          // --- REMOVED Encoding Test Block ---
          // The encoding test block (previously lines ~659-705) was removed
          // as it seemed to be throwing complex errors causing serialization issues.
          // The actual contract call below uses the same parameters.

          // The actual contract call - using array format for Telos compatibility
          let tx: ContractTransactionResponse | undefined; // Add type hint
          let receipt;
          try { // Add specific try-catch around the contract call and receipt handling
            // Ensure signer is available for write operation
            const signer = await this.getSigner();
            if (!signer) {
                throw new Error("Signer is required for createCampaign transaction.");
            }
            // Connect signer to contract instance if not already connected
            const contractWithSigner = this.contract.runner === signer ? this.contract : this.contract.connect(signer);

            // Cast to 'any' to bypass specific method type check, or use a more specific type if available
            const durationBN = BigInt(duration); // Convert duration to BigInt

            // Consolidate overrides (defined earlier: gasPrice, txOptions potentially has value)
            // Let ethers estimate gasLimit, but keep gasPrice and potential value
            const finalOverrides: any = {
                gasPrice: gasPrice // Use determined/hardcoded gasPrice
            };
            if (txOptions.value) { // Check if value was added to txOptions
                finalOverrides.value = txOptions.value;
            }

            // Re-add 'as any' cast to bypass specific method type check
            // Calculate deadline (assuming params.duration is in days)
            console.log(`[DEBUG] Calculating deadline. params.duration (should be seconds): ${params.duration}, type: ${typeof params.duration}`); // Log duration value and type
            const currentTimestamp = BigInt(Math.floor(Date.now() / 1000)); // Ensure currentTimestamp is BigInt
            // Duration from params is already in seconds, no need to multiply by 86400
            const durationInSeconds = BigInt(params.duration || 0);
            const deadline = currentTimestamp + durationInSeconds + 60n; // Add 60 second buffer
console.log(`[DEBUG] Calling createCampaign with deadline: ${deadline.toString()}`); // Log deadline value

// Call the contract function, which returns a transaction response
const tx: ContractTransactionResponse = await (contractWithSigner as any).createCampaign(
  title,                  // 1. string
  params.description || '', // 2. string
  goalAmount,             // 3. bigint (uint256)
  deadline,               // 4. bigint (uint256)
  [],                     // DEBUG: Pass empty milestones array
  finalOverrides          // Pass overrides as the last argument
); // Correctly closed parenthesis for createCampaign call

          // Log right before the call for final verification
          console.log("[Debug] Final Args for createCampaign:", {
              arg1_title: title, type1: typeof title,
              arg2_category: category, type2: typeof category,
              arg3_goalAmount: goalAmount, type3: typeof goalAmount,
              arg4_durationBN: durationBN, type4: typeof durationBN,
              arg5_metadataIPFSHash: params.metadataIPFSHash, type5: typeof params.metadataIPFSHash,
              arg6_mediaIPFSHash: "", type6: "string",
              arg7_milestoneStructs: milestoneObjects, type7: typeof milestoneObjects, length7: milestoneObjects?.length, // Use correct variable name
              arg8_overrides: finalOverrides, type8: typeof finalOverrides
          });

          console.log("Transaction sent:", tx.hash);

          // Wait for the transaction receipt using tx.wait()
          const receipt = await tx.wait();

          if (!receipt) {
              throw new Error("Transaction receipt was null after waiting.");
          }
          console.log("Transaction confirmed in block", receipt.blockNumber);

          // Find event in logs manually by topic hash first
          const campaignCreatedTopic = '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b'; // ethers.id('CampaignCreated(uint256,address,string)')
          let campaignLog = null;
          console.log(`Searching for topic ${campaignCreatedTopic} in ${receipt.logs?.length || 0} logs.`);
          for (const log of receipt.logs || []) { // Add default empty array
              if (log.topics && log.topics.length > 0 && log.topics[0] === campaignCreatedTopic) {
                  campaignLog = log;
                  console.log("Found potential CampaignCreated log:", campaignLog);
                  break;
              }
          }

           let campaignId: bigint | undefined = undefined; // Use undefined initially, type as bigint

           if (campaignLog) {
               try {
                   // Now try parsing the specific log we found
                   if (!contractWithSigner?.interface) {
                       throw new Error("Contract interface not available for parsing found log.");
                   }
                   const parsedLog = contractWithSigner.interface.parseLog(campaignLog);
                   console.log("Successfully parsed log:", parsedLog);
                   if (parsedLog?.name === 'CampaignCreated') {
                       // Access 'id' based on the ABI definition
                       campaignId = parsedLog.args?.id; // Should be bigint
                       console.log("Extracted campaignId (BigInt):", campaignId?.toString());
                   } else {
                        console.warn("Parsed log name did not match 'CampaignCreated'. Parsed:", parsedLog?.name);
                   }
               } catch (parseError) {
                   console.error("Error parsing the found log with interface.parseLog:", parseError);
                   // Fallback: Try decoding manually if possible (example for indexed uint256 id)
                   // Assuming id is the first indexed topic after the signature topic (topics[1])
                   if (campaignLog.topics.length > 1) {
                       try {
                           // Indexed uint256 is usually directly in topics[1] as hex
                           campaignId = BigInt(campaignLog.topics[1]); // Convert hex topic to BigInt
                            console.log("Manually decoded campaignId from topic[1] (BigInt):", campaignId?.toString());
                       } catch (manualDecodeError) {
                            console.error("Error manually decoding topic[1] as campaignId:", manualDecodeError);
                       }
                   }
               }
           } else {
               console.warn("No log found with CampaignCreated topic hash:", campaignCreatedTopic);
           }
           // --- END DETAILED LOG PARSING ---

           // --- Fallback: Explicitly query for the event if not found in receipt ---
           if (campaignId === undefined) {
               console.log("DETAILED LOG: CampaignId not found in receipt, attempting explicit event query...");
               try {
                   const signer = await this.getSigner(); // Need signer for filtering
                   if (!signer) throw new Error("Signer not available for event query filter.");
                   const filter = contractWithSigner.filters.CampaignCreated(undefined, await signer.getAddress()); // Filter by creator (current signer)
                   // Query events only in the block where the transaction was mined
                   const events = await contractWithSigner.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
                   console.log(`DETAILED LOG: Found ${events.length} CampaignCreated events in block ${receipt.blockNumber} for creator ${await signer.getAddress()}.`);

                   if (events.length > 0) {
                       // Find the event related to *this* transaction hash if multiple events exist in the block
                       const matchingEvent = events.find(e => e.transactionHash === receipt.hash);
                       if (matchingEvent) {
                           console.log("DETAILED LOG: Found matching event via queryFilter:", matchingEvent);
                           // Type assertion might be needed depending on ethers version/setup
                           campaignId = (matchingEvent as any).args?.id;
                           console.log("DETAILED LOG: Extracted campaignId (BigInt) from queried event:", campaignId?.toString());
                       } else {
                            console.warn("DETAILED LOG: Found events in block, but none matched this transaction hash:", receipt.hash);
                       }
                   } else {
                       console.warn("DETAILED LOG: Explicit queryFilter returned no matching CampaignCreated events.");
                   }
               } catch (queryError) {
                   console.error("DETAILED LOG: Error during explicit event query:", queryError);
               }
           }
           // --- End Fallback ---

           // Check if campaignId was found (either from receipt or query) and convert to number
           // Regardless of whether campaignId was found in logs, return the receipt if transaction succeeded
           if (receipt) {
               if (campaignId === undefined) {
                   // Log if ID wasn't found, but still return receipt
                   console.warn("Campaign ID could not be extracted from logs, but returning successful receipt.");
               }
               return receipt; // Return the full receipt object
           } else {
               // This case should not be reachable if tx.wait() succeeded without throwing
               console.error("Transaction succeeded but receipt is unexpectedly null/undefined.");
               throw new Error("Transaction receipt missing after confirmation.");
           }
        } catch (callError: any) { // Catch errors from call, wait, or parsing
            console.error("Error during contract call or receipt processing:", callError);
            // Return null on any error during the process
            return null;
        }
      } // <-- Add missing closing brace for the outer try block (started line 592)
      catch (txError: any) { // This catch now only handles errors from before the contract call try block
          console.error("Transaction setup error details:", { // Renamed log for clarity
            code: txError.code,
            message: txError.message,
            reason: txError.reason,
            hash: txError.transactionHash,
            receipt: txError.receipt
          });
          // Safely construct error message from txError
          let txErrorMessage = 'Transaction failed';
          if (txError instanceof Error) {
              txErrorMessage = `Transaction failed: ${txError.message}`;
          } else {
              txErrorMessage = 'Transaction failed with non-standard error object.';
              console.log("Non-standard txError object:", txError);
          }
          throw new Error(txErrorMessage); // Re-throw safe message
        }
      } // <-- Add missing closing brace for main 'try' block (started line 486)
      catch (error: any) { // This is the outermost catch block for setup/parameter errors
        // Log the raw error object for inspection, even if it might fail serialization in console
        console.error('Error during campaign creation setup:', error);

        // Throw a completely generic error message or return null
        // throw new Error('Campaign creation failed during setup. Check console for raw error.');
        return null;
      }
    } catch (error) { // This catch block seems redundant now, but keep for safety? Or remove? Let's keep it simple.
      console.error('Error creating campaign:', error);
      // throw error; // Don't re-throw, return null
      return null;
    }
  } // <-- End of createCampaign method


  // --- Helper function for Gas Price ---
  private async fetchGasPriceWithRetry(): Promise<bigint> {
    let gasPrice: bigint | undefined;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;
    const ATTEMPT_TIMEOUT = 15000;

    if (!this.provider) {
        throw new Error('Provider is not initialized, cannot get gas price.');
    }

    console.log(`[Debug] Attempting to fetch gas price (max ${MAX_RETRIES} retries)...`);
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      let feeData: FeeData | null = null;
      try {
        console.log(`[Debug] Attempt ${attempt}: Trying provider.getFeeData()...`);
        const feeDataPromise = this.provider.getFeeData();
        const feeDataResult = await Promise.race([
          feeDataPromise,
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error(`getFeeData timed out after ${ATTEMPT_TIMEOUT / 1000}s`)), ATTEMPT_TIMEOUT))
        ]);
        feeData = feeDataResult as FeeData | null;

        if (feeData?.gasPrice) {
          gasPrice = feeData.gasPrice;
          console.log(`[Debug] Gas price from getFeeData successful: ${gasPrice.toString()}`);
          break; // Success
        } else {
          console.warn(`[Debug] getFeeData attempt ${attempt} returned null or no gasPrice.`);
        }
      } catch (feeError: any) {
        console.warn(`[Debug] getFeeData attempt ${attempt} failed:`, feeError.message || feeError);
        const isMethodNotFound = feeError?.code === -32601 || feeError?.message?.includes('does not exist');
        if (isMethodNotFound) {
          console.log(`[Debug] getFeeData failed (method not found), trying legacy getGasPrice...`);
          try {
            const legacyGasPricePromise = (this.provider as any).getGasPrice();
            const legacyGasPrice = await Promise.race([
              legacyGasPricePromise,
              new Promise<null>((_, reject) => setTimeout(() => reject(new Error(`getGasPrice timed out after ${ATTEMPT_TIMEOUT / 1000}s`)), ATTEMPT_TIMEOUT))
            ]);
            if (legacyGasPrice) {
              gasPrice = legacyGasPrice;
              console.log(`[Debug] Legacy getGasPrice successful: ${gasPrice?.toString() ?? 'undefined'}`);
              break; // Success
            } else {
               throw new Error("Legacy getGasPrice returned null");
            }
          } catch (legacyError: any) {
             console.warn(`[Debug] Legacy getGasPrice attempt ${attempt} also failed:`, legacyError.message || legacyError);
          }
        }
      }
      // --- Handle Fallback or Retry ---
      if (attempt === MAX_RETRIES && !gasPrice) {
        console.error(`[Error] All ${MAX_RETRIES} attempts to fetch gas price (EIP-1559 & Legacy) failed.`);
        console.warn('[Recommendation] Check RPC URL and network compatibility.');
        gasPrice = parseUnits('500', 'gwei'); // Increased Fallback
        console.warn('[Warning] Using hardcoded fallback gas price:', gasPrice.toString());
        break;
      } else if (!gasPrice) {
         console.log(`[Debug] Attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
         await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }

      if (gasPrice === undefined) {
          // This should theoretically not happen due to the fallback, but as a safeguard:
          throw new Error("Failed to determine gas price after all attempts and fallback.");
      }
      return gasPrice;
  }
  // --- End Helper function ---


  /**
   * Gets the current contract instance.
   * If the contract is not initialized, it will attempt to initialize it.
   * @returns The contract instance
   */
  public async getContract(): Promise<ethers.Contract> {
    if (!this.contract) {
      await this.initializeContract();
    }

    // If we have a signer, make sure the contract is connected to it
    const signerPromise = this.getSigner(); // getSigner is now async
    const resolvedSigner = await signerPromise; // Await the promise
    if (resolvedSigner && this.contract && !this.contract.runner) { // Check runner in v6
      console.log('Connecting signer to contract...');
      this.contract = this.contract.connect(resolvedSigner) as Contract; // Use resolvedSigner and cast
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    return this.contract;
  }

  /**
   * Gets the contract address if available
   */
  public async getContractAddress(): Promise<string | null> { // Make async
    return this.contract ? await this.contract.getAddress() : null; // Use getAddress() and await
  }
  
  /**
   * Diagnoses the available functions in the contract ABI
   * @returns Object with detailed information about contract function availability
   */
  public async diagnoseContractFunctions(): Promise<any> {
    try {
      await this.ensureInitialized();
      
      if (!this.contract) {
        return { error: 'Contract failed to initialize' };
      }
      
      const functions: Record<string, boolean> = {};
      
      // Check common function names
      const commonFunctions = [
        'createCampaign',
        'campaigns',
        'getCampaign',
        'getCampaignBasicInfo',
        'getCampaignMilestones',
        'donateToCampaign',
        'voteMilestoneCompletion',
        'updateCampaignMetadata'
      ];
      
      for (const func of commonFunctions) {
        functions[func] = this.hasMethod(func);
      }
      
      // Check for alternative campaign retrieval methods
      if (!functions['campaigns'] && !functions['getCampaign']) {
        console.warn('Standard campaign retrieval methods not found, checking alternatives');
        
        // Look for any function that might retrieve campaigns
        const allFunctions = Object.keys(this.contract.functions || {});
        const potentialCampaignGetters = allFunctions.filter(f => 
          f.toLowerCase().includes('campaign') && 
          !f.toLowerCase().includes('create')
        );
        
        if (potentialCampaignGetters.length > 0) {
          console.log('Found potential campaign getter functions:', potentialCampaignGetters);
          for (const getter of potentialCampaignGetters) {
            functions[`alternative_${getter}`] = true;
          }
        }
      }
      
      return {
        functions,
        contractAddress: this.getContractAddress(),
        isWalletConnected: this.isWalletConnected(),
        isInitialized: this.isInitialized
      };
    } catch (error) {
      console.error('Error diagnosing contract functions:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Checks if a method exists in the contract
   * @param methodName The name of the method to check
   * @returns true if the method exists, false otherwise
   */
  private hasMethod(methodName: string): boolean {
    if (!this.contract) {
      return false;
    }
    
    // First check - direct function existence
    const functionExists = typeof this.contract[methodName] === 'function';
    
    // Second check - interface check
    let foundInInterface = false;
    try {
      if (this.contract?.interface) { // Use optional chaining
        // Use getFunction which throws if not found in v6
        const funcFragment = this.contract.interface.getFunction(methodName);
        foundInInterface = !!funcFragment;
      }
    } catch (error) {
      foundInInterface = false;
      // Optional: Log only unexpected errors
      // if (!error.message?.includes('no matching function')) {
      //   console.warn(`Error checking interface for method ${methodName}:`, error);
      // }
    }

    // Fallback check (less reliable)
    if (!foundInInterface && typeof (this.contract as any)[methodName] === 'function') {
       console.warn(`Method ${methodName} found directly but not in interface.`);
       return true;
    }

    return foundInInterface; // Primarily rely on interface check
  }

  // --- End Helper function ---


  /**
   * Gets the current signer instance
   * @returns Promise resolving to the signer instance or null if not available
   */
  private async getSigner(): Promise<Signer | null> { // Make async, use imported Signer, update return type
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) { // Add type assertion for window.ethereum check
        return null;
      }
      
      // Check if the wallet is connected according to our state
      if (!this.walletState.isConnected || !this.walletState.address) {
        // Try to update our state by checking the provider
        try {
          const getAccounts = async () => {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              this.walletState.isConnected = true;
              this.walletState.address = accounts[0];
              console.log('Updated wallet state from provider check - address:', accounts[0]);
              return true;
            }
            return false;
          };
          
          // Use Promise to avoid blocking
          getAccounts().catch(e => console.warn('Error checking accounts:', e));
        } catch (e) {
          console.warn('Error updating wallet state:', e);
        }
      }
      
      // If our wallet state shows connected, get the signer
      if (this.walletState.isConnected && this.walletState.address) {
        // Create a new BrowserProvider if needed (v6)
        if (!this.provider || !(this.provider instanceof BrowserProvider)) { // Use BrowserProvider
          this.provider = new BrowserProvider((window as any).ethereum); // Use BrowserProvider
        }

        if (this.provider instanceof BrowserProvider) { // Use BrowserProvider
          const signer = await this.provider.getSigner(); // Use await
          console.log('Returning active signer');
          return signer; // Return awaited signer
        }
      }
      
      console.warn('No signer available - wallet not connected');
      return null;
    } catch (error) {
      console.error('Error getting signer:', error);
      return null;
    }
  }
  
  /**
   * Gets the provider or signer for contract initialization
   * This is a critical function for connecting to the contract
   */
  private async getProviderOrSigner(): Promise<Provider | Signer | null> { // Use imported types, make async
    try {
      // First try to get a signer (getSigner is now async)
      const signer = await this.getSigner(); // Add await
      if (signer) {
        console.log('Using signer for contract initialization');
        return signer;
      }
      
      // Fallback to provider if no signer available
      const provider = this.getProvider();
      if (!provider) {
        console.error('No provider available for contract initialization');
        return null;
      }
      
      console.log('No signer available, using provider only');
      return provider;
    } catch (e) {
      console.error('Error in getProviderOrSigner:', e);
      return null;
    }
  }

  /**
   * Public method to force contract reinitialization
   * Useful for debugging contract connection issues
   */
  public async initializeContract(): Promise<boolean> {
    try {
      console.log('Reinitializing contract...');
      
      // Get provider for network checking
      const provider = await this.getReliableProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }

      // Check network connection
      try {
        const network = await provider.getNetwork();
        console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);

        // Verify Telos testnet (more flexible verification)
        // Accept chain ID 41 (Telos testnet), 31337 (Hardhat/local), or 1337 (Ganache)
        const chainIdNumber = Number(network.chainId); // Convert bigint to number
        const isValidChain = [41, 31337, 1337].includes(chainIdNumber);
        if (!isValidChain) {
          console.warn(`Network detection issue: Connected to ${network.name} (${network.chainId}) but expected Telos Testnet (41)`);
          // Don't throw error, try to continue anyway
        }
      } catch (networkError) {
        console.warn('Network detection error:', networkError);
        // Continue anyway - don't abort initialization on network detection failure
      }

      const contractAddress = WOWZA_RUSH_CONTRACT_ADDRESS;
      console.log('Using contract address:', contractAddress);

      // Verify contract exists
      try {
        const bytecode = await provider.getCode(contractAddress);
        if (bytecode === '0x' || bytecode === '') {
          console.warn(`No contract found at address ${contractAddress}, but continuing anyway`);
          // Don't throw error, try to continue with initialization
        } else {
          console.log('Contract bytecode verified at address:', contractAddress);
        }
      } catch (bytecodeError) {
        console.warn('Error verifying contract bytecode:', bytecodeError);
        // Continue anyway - don't abort initialization on bytecode check failure
      }

      // Get full ABI
      const abi = this.getContractAbi();
      console.log(`[Debug][InitializeContract] Got contract ABI.`); // Added log confirmation
      // Log the specific createCampaign fragment being used
      const createCampaignFragment = abi.find((item: any) => item.name === 'createCampaign' && item.type === 'function');
      console.log("[Debug][InitializeContract] createCampaign ABI Fragment:", JSON.stringify(createCampaignFragment, null, 2));

      // First try to get a signer - CRITICAL for write operations
      let signer = null;
      if (typeof window !== 'undefined' && window.ethereum) {
        // Check if accounts are already connected
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            this.walletState.isConnected = true;
            this.walletState.address = accounts[0];

            // Create a BrowserProvider and get the signer (v6)
            const browserProvider = new ethers.BrowserProvider(window.ethereum); // Use BrowserProvider
            signer = await browserProvider.getSigner(); // Use await
            console.log('Using connected wallet signer with address:', this.walletState.address);

            // Create contract with signer
            this.contract = new ethers.Contract(contractAddress, abi, signer);
            console.log('Contract initialized with signer');
          } else {
            console.log('No connected accounts found, using read-only mode');
            this.contract = new ethers.Contract(contractAddress, abi, provider);
            console.log('Contract initialized in read-only mode');
          }
        } catch (error) {
          console.warn('Error checking accounts:', error);
          // Fallback to provider only
          this.contract = new ethers.Contract(contractAddress, abi, provider);
          console.log('Contract initialized in read-only mode (after account check error)');
        }
      } else {
        // No ethereum provider, use read-only mode
        this.contract = new ethers.Contract(contractAddress, abi, provider);
        console.log('Contract initialized in read-only mode (no ethereum provider)');
      }
      
      // Log available methods for debugging
      console.log("Contract methods check:", {
        createCampaign: this.hasMethod('createCampaign'),
        campaigns: this.hasMethod('campaigns'),
        getCampaign: this.hasMethod('getCampaign'),
        getCampaignBasicInfo: this.hasMethod('getCampaignBasicInfo')
      });
      
      // Check for required contract methods, but make it more resilient
      if (!this.hasMethod('createCampaign')) {
        console.warn('Warning: createCampaign method not found in contract');
      }
      
      // Check for campaign access methods - log warnings but don't fail initialization
      const hasCampaignAccess = 
        this.hasMethod('campaigns') || 
        this.hasMethod('getCampaign') || 
        this.hasMethod('getCampaignBasicInfo');
      
      if (!hasCampaignAccess) {
        console.warn('Warning: No standard campaign access methods found (campaigns, getCampaign, or getCampaignBasicInfo). Some functionality may be limited.');
      }
      
      // Explicitly log whether the contract has a signer
      if (this.contract.signer) {
        console.log('Contract initialized with signer - write operations available');
      } else {
        console.warn('Contract initialized without signer - read-only mode');
      }
      
      // Always succeed once we have a contract instance
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing contract:', error);
      // Don't throw error, return false instead
      return false;
    }
  }
  
  /**
   * Gets a reliable provider with fallback mechanisms
   * @returns The provider instance or null if all fallbacks fail
   */
  private async getReliableProvider(): Promise<Provider | null> { // Use imported Provider
    // Try to get the provider in this order:
    // 1. From window.ethereum (MetaMask, etc.)
    // 2. From existing provider cache
    // 3. From RPC URL in config
    // 4. From each of the fallback RPC URLs
    
    const fallbackRpcUrls = [
      'https://rpc.testnet.telos.net',
      'https://testnet.telos.net/evm',
      'https://telos-testnet.rpc.thirdweb.com',
      'https://telos-evm-testnet.rpc.ambitio.us',
      'https://testnet.telos.caleos.io/evm'
    ];
    
    // 1. Try window.ethereum first
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new BrowserProvider((window as any).ethereum); // Use BrowserProvider (v6)
        // Quick check if provider is working
        await provider.getNetwork();
        console.log('Using connected wallet provider');
        this.provider = provider;
        return provider;
      } catch (e) {
        console.warn('Error with wallet provider, will try fallbacks:', e);
      }
    }
    
    // 2. Check if we already have a working provider
    if (this.provider) {
      try {
        // Verify it's still working with a quick test
        await this.provider.getNetwork();
        console.log('Using existing cached provider');
        return this.provider;
      } catch (e) {
        console.warn('Cached provider no longer working, will try fallbacks:', e);
        this.provider = null; // Reset invalid provider
      }
    }
    
    // 3. Try the config RPC URL if provided
    if (this.projectConfig.rpcUrl) {
      try {
        const provider = new ethers.JsonRpcProvider(this.projectConfig.rpcUrl); // Use top-level JsonRpcProvider (v6)
        await provider.getNetwork(); // Test connection
        console.log('Using RPC URL from config:', this.projectConfig.rpcUrl);
        this.provider = provider;
        return provider;
      } catch (e) {
        console.warn(`Error with RPC URL from config (${this.projectConfig.rpcUrl}), will try fallbacks:`, e);
      }
    }
    
    // 4. Try each fallback URL until one works
    let lastError = null;
    for (const rpcUrl of fallbackRpcUrls) {
      try {
        console.log(`Trying fallback RPC URL: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl); // Use top-level JsonRpcProvider (v6)

        // Test the provider with a timeout (increased from 5s to 15s for better reliability)
        const networkPromise = provider.getNetwork();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Connection to ${rpcUrl} timed out`)), 15000)
        );
        
        await Promise.race([networkPromise, timeoutPromise]);
        
        console.log(`Connected successfully to fallback RPC: ${rpcUrl}`);
        this.provider = provider;
        return provider;
      } catch (e) {
        lastError = e;
        console.warn(`Error with fallback RPC URL (${rpcUrl}):`, e);
        
        // Add a small delay before trying the next endpoint to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Check if lastError has a message property before accessing it
    const lastErrorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    console.error('All RPC providers failed, unable to establish connection', lastError ? `: ${lastErrorMessage}` : ''); // Use checked message

    // If we're in development mode, show a more helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error('Troubleshooting tips for RPC connection issues:');
      console.error('1. Check if the Telos testnet is operational: https://status.telos.net/');
      console.error('2. Try adding additional RPC endpoints to the fallbackRpcUrls array');
      console.error('3. Verify your internet connection and any network restrictions');
    }
    
    return null;
  }

  /**
   * Gets the current provider instance or creates a new one
   * @returns The provider instance or null if initialization fails
   */
  public getProvider(): Provider | null { // Make public
    if (!this.provider) {
      try {
        // Use the getReliableProvider method which has robust fallback logic
        this.getReliableProvider().catch(error => {
          console.error('Error getting reliable provider:', error);
        });
      } catch (error) {
        console.error('Error initializing provider:', error);
      }
    }
    return this.provider;
  }

  /**
   * Checks if the contract is valid and has the required methods
   */
  private isValidContract(): boolean {
    return !!(this.contract && this.contract.address);
  }

  async updateCampaignMetadata(
      campaignId: number,
      metadataIPFSHash: string,
      mediaIPFSHash: string
  ): Promise<void> {
      try {
          await this.ensureInitialized();
          
          const contract = await this.getContract();
          
          // Check if campaigns method exists
          if (!this.hasMethod('campaigns')) {
            console.warn('campaigns method not found, attempting alternative approach');
            
            // Try using getCampaignBasicInfo if available
            if (this.hasMethod('getCampaignBasicInfo')) {
              const basicInfo = await contract.getCampaignBasicInfo(campaignId);
              if (!basicInfo || !basicInfo.creator) {
                throw new Error('Campaign not found');
              }
              
              // Get signer
              const signerPromise = this.getSigner(); // getSigner is async
              const signer = await signerPromise; // Await the promise
              if (!signer) {
                  throw new Error('No signer available');
              }

              // Verify ownership
              const signerAddress = await signer.getAddress(); // Now call getAddress
              if (basicInfo.creator !== signerAddress) {
                  throw new Error('Only campaign creator can update metadata');
              }
              
              const tx = await contract.updateCampaignMetadata(
                  campaignId,
                  metadataIPFSHash,
                  mediaIPFSHash
              );
              
              await tx.wait();
              return;
            } else {
              throw new Error('No method available to get campaign data');
            }
          }
          
          // Standard approach using campaigns mapping
          const campaign = await contract.campaigns(campaignId);
          
          if (!campaign) {
              throw new Error('Campaign not found');
          }
          
          // Get signer
          const signerPromise = this.getSigner(); // getSigner is async
          const signer = await signerPromise; // Await the promise
          if (!signer) {
              throw new Error('No signer available');
          }

          // Verify ownership
          const signerAddress = await signer.getAddress(); // Now call getAddress
          if (campaign.creator !== signerAddress) {
              throw new Error('Only campaign creator can update metadata');
          }
          
          const tx = await contract.updateCampaignMetadata(
              campaignId,
              metadataIPFSHash,
              mediaIPFSHash
          );
          
          await tx.wait();
      } catch (error) {
          console.error('Error updating campaign metadata:', error);
          throw new Error(error instanceof Error ? error.message : 'Failed to update campaign metadata');
      }
  }

  // Implement a direct question handling approach that bypasses blockchain checks for non-existent campaigns

  // Helper method for campaign existence check that never throws an error
  async doesCampaignExist(campaignId: string | number): Promise<boolean> {
    try {
      // Convert string to number if necessary
      const id = typeof campaignId === 'string' ? parseInt(campaignId, 10) : campaignId;
      
      // First check if the contract is initialized
      if (!this.contract) {
        console.warn('Contract not initialized when checking campaign existence');
        return false;
      }
      
      try {
        // Try to get the campaign info from the contract
        await this.contract.getCampaignBasicInfo(id);
        return true;
      } catch (error) {
        console.warn(`Campaign ${id} not found in blockchain`);
        return false;
      }
    } catch (error) {
      console.error('Error checking campaign existence:', error);
      return false;
    }
  }

  /**
   * @description Get campaign data by ID
   * @param campaignId ID of the campaign to get
   * @returns Campaign data
   */
  public async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      console.log(`===== CAMPAIGN RETRIEVAL START =====`);
      console.log(`Getting campaign data for ID: ${campaignId}`);
      
      // Validate input
      if (!campaignId) {
        console.error('Campaign ID is required');
        throw new Error('Campaign ID is required');
      }
      
      // Extract numeric ID using our utility function
      const numericId = this.extractNumericId(campaignId);
      console.log(`Extracted numeric ID: ${numericId}`);
      
      // Force full initialization before proceeding
      await this.ensureInitialized();
      
      if (!this.contract) {
        console.error('Contract still not initialized');
        throw new Error('Contract is not initialized');
      }
      
      // Check available contract methods for campaign retrieval
      const hasCampaignsMethod = this.hasMethod('campaigns');
      const hasGetCampaignMethod = this.hasMethod('getCampaign');
      const hasGetCampaignBasicInfoMethod = this.hasMethod('getCampaignBasicInfo');
      const hasGetCampaignExtendedInfoMethod = this.hasMethod('getCampaignExtendedInfo');
      const hasGetCampaignDetailsMethod = this.hasMethod('getCampaignDetails');
      const hasGetCampaignMilestonesMethod = this.hasMethod('getCampaignMilestones');
      const hasGetCampaignDonorsMethod = this.hasMethod('getCampaignDonors');
      
      console.log('Available campaign retrieval methods:', {
        campaigns: hasCampaignsMethod,
        getCampaign: hasGetCampaignMethod,
        getCampaignBasicInfo: hasGetCampaignBasicInfoMethod,
        getCampaignExtendedInfo: hasGetCampaignExtendedInfoMethod,
        getCampaignDetails: hasGetCampaignDetailsMethod,
        getCampaignMilestones: hasGetCampaignMilestonesMethod,
        getCampaignDonors: hasGetCampaignDonorsMethod
      });
      
      // --- Add Retry Logic for Existence Check ---
      let campaignExists = false;
      const maxExistenceChecks = 5; // Number of attempts
      const existenceCheckDelay = 2000; // Delay in ms (2 seconds)

      for (let attempt = 1; attempt <= maxExistenceChecks; attempt++) {
          console.log(`Existence Check Attempt ${attempt}/${maxExistenceChecks} for campaign ID ${numericId}`);
          
          // Try available methods in order of preference
          if (hasGetCampaignDetailsMethod) { // Prefer the most comprehensive getter if available
              try {
                  const details = await this.contract.getCampaignDetails(numericId);
                  // Check if creator is valid (non-zero address) as an indicator of existence
                  if (details && details.creator && details.creator !== ZeroAddress) {
                      console.log(`Existence confirmed via getCampaignDetails on attempt ${attempt}`);
                      campaignExists = true;
                      break;
                  }
              } catch (error: any) {
                  console.warn(`Attempt ${attempt}: getCampaignDetails failed:`, error.message || error);
              }
          }
          
          if (!campaignExists && hasGetCampaignBasicInfoMethod) {
              try {
                  const basicInfo = await this.contract.getCampaignBasicInfo(numericId);
                  if (basicInfo && basicInfo.creator && basicInfo.creator !== ZeroAddress) {
                      console.log(`Existence confirmed via getCampaignBasicInfo on attempt ${attempt}`);
                      campaignExists = true;
                      break;
                  }
              } catch (error: any) {
                  console.warn(`Attempt ${attempt}: getCampaignBasicInfo failed:`, error.message || error);
              }
          }

          // Add check for getCampaign (if it exists and returns struct)
          if (!campaignExists && hasGetCampaignMethod) {
              try {
                  const campaignData = await this.contract.getCampaign(numericId);
                  if (campaignData && campaignData.creator && campaignData.creator !== ZeroAddress) {
                      console.log(`Existence confirmed via getCampaign on attempt ${attempt}`);
                      campaignExists = true;
                      break;
                  }
              } catch (error: any) {
                  console.warn(`Attempt ${attempt}: getCampaign failed:`, error.message || error);
              }
          }

          // Try direct mapping access as last resort
          if (!campaignExists && hasCampaignsMethod) {
              try {
                  const rawCampaign = await this.contract.campaigns(numericId);
                  if (rawCampaign && rawCampaign.creator && rawCampaign.creator !== ZeroAddress) {
                      console.log(`Existence confirmed via campaigns mapping on attempt ${attempt}`);
                      campaignExists = true;
                      break;
                  }
              } catch (error: any) {
                  console.warn(`Attempt ${attempt}: campaigns mapping access failed:`, error.message || error);
              }
          }

          // If not found and not the last attempt, wait before retrying
          if (!campaignExists && attempt < maxExistenceChecks) {
              console.log(`Campaign not found yet, waiting ${existenceCheckDelay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, existenceCheckDelay));
          }
      }

      // If campaign still not found after all retries, return null
      if (!campaignExists) {
          console.error(`Campaign ID ${numericId} not found after ${maxExistenceChecks} attempts.`);
          return null;
      }
      // --- End Retry Logic ---
      
      // At this point, we know the campaign exists, so we can construct it
      // Start with minimal representation and enhance it with available data
      const campaign: Campaign = {
        id: numericId,
        title: 'Untitled Campaign',
        description: 'No description available',
        category: 'Not specified',
        creator: ZeroAddress, // Use ZeroAddress
        goalAmount: 0n, // Use bigint literal
        totalFunded: 0n, // Use bigint literal
        status: 'unknown',
        milestones: []
      };
      
      // Try to get basic info to populate core campaign properties
      // --- Populate Campaign Data ---
      // Use the most comprehensive method available first
      if (hasGetCampaignDetailsMethod) {
          try {
              console.log('Fetching full campaign details via getCampaignDetails...');
              const details = await this.contract.getCampaignDetails(numericId);
              console.log('Raw data from getCampaignDetails:', details);
              if (details && details.creator && details.creator !== ZeroAddress) {
                  campaign.creator = details.creator;
                  campaign.title = details.title;
                  campaign.description = details.description;
                  campaign.goalAmount = details.goalAmount;
                  campaign.amountRaised = details.amountRaised; // Use amountRaised from details
                  campaign.totalFunded = details.amountRaised; // Alias for consistency
                  campaign.deadline = details.deadline ? Number(details.deadline) : undefined; // Use deadline from details
                  campaign.completed = details.completed;
                  campaign.fundsClaimed = details.fundsClaimed;
                  // milestoneCount and contributorCount are available here too
                  campaign.currentAmount = parseFloat(formatEther(details.amountRaised || 0n));
                  // Infer isActive based on deadline and completion? Or rely on extendedInfo if available
                  const now = Math.floor(Date.now() / 1000);
                  campaign.isActive = !details.completed && campaign.deadline ? now < campaign.deadline : false;
                  campaign.status = campaign.isActive ? 'active' : 'ended';
              }
          } catch (error) {
              console.warn('Error fetching campaign details via getCampaignDetails:', error);
              // Fallback to other methods if getCampaignDetails fails
          }
      }
      
      // If getCampaignDetails wasn't available or failed, try getCampaignBasicInfo
      // Only update fields not already populated by getCampaignDetails
      if (campaign.creator === ZeroAddress && hasGetCampaignBasicInfoMethod) {
          try {
              console.log('Fetching basic campaign info (fallback)...');
              const basicInfo = await this.contract.getCampaignBasicInfo(numericId);
              console.log('Raw data from getCampaignBasicInfo (fallback):', basicInfo);
              if (basicInfo && basicInfo.creator && basicInfo.creator !== ZeroAddress) {
                  campaign.creator = basicInfo.creator;
                  campaign.title = basicInfo.title || campaign.title;
                  campaign.category = basicInfo.category || campaign.category; // Basic might have category
                  campaign.goalAmount = basicInfo.goalAmount || campaign.goalAmount;
                  campaign.totalFunded = basicInfo.totalFunded || campaign.totalFunded;
                  campaign.duration = basicInfo.duration ? Number(basicInfo.duration) : undefined; // Basic might have duration
                  if (basicInfo.description) campaign.description = basicInfo.description;
                  campaign.currentAmount = parseFloat(formatEther(basicInfo.totalFunded || 0n));
                  campaign.isActive = basicInfo.isActive ?? campaign.isActive; // Use ?? for potential undefined
                  // Infer status if possible
                  if (campaign.isActive !== undefined && campaign.duration && campaign.createdAt) {
                     const endTimestamp = campaign.createdAt + campaign.duration;
                     const nowTimestamp = Math.floor(Date.now() / 1000);
                     campaign.isActive = campaign.isActive && nowTimestamp < endTimestamp;
                     campaign.status = campaign.isActive ? 'active' : 'ended';
                  } else if (campaign.isActive !== undefined) {
                     campaign.status = campaign.isActive ? 'active' : 'ended';
                  }
              }
          } catch (error) {
              console.warn('Error fetching campaign basic info (fallback):', error);
          }
      }
      
      // Try to get extended info to populate additional campaign properties
      if (hasGetCampaignExtendedInfoMethod) {
        try {
          console.log('Fetching extended campaign info...');
          const extendedInfo = await this.contract.getCampaignExtendedInfo(numericId);
          console.log('Raw data from getCampaignExtendedInfo:', extendedInfo);
          
          if (extendedInfo) {
            // Update campaign with extended info
            campaign.createdAt = extendedInfo.createdAt ? Number(extendedInfo.createdAt) : undefined;
            campaign.isActive = extendedInfo.isActive;
            campaign.status = extendedInfo.isActive ? 'active' : 'ended';
            campaign.metadataIPFSHash = extendedInfo.metadataIPFSHash;
            campaign.mediaIPFSHash = extendedInfo.mediaIPFSHash;
            campaign.currentMilestone = extendedInfo.currentMilestone ? Number(extendedInfo.currentMilestone) : 0;
            campaign.campaignType = extendedInfo.campaignType ? Number(extendedInfo.campaignType) : 0;
            
            // Try to parse metadata if available
            if (extendedInfo.metadataIPFSHash && extendedInfo.metadataIPFSHash.length > 0) {
              try {
                // Check if it's JSON data directly encoded
                if (extendedInfo.metadataIPFSHash.startsWith('{') && extendedInfo.metadataIPFSHash.endsWith('}')) {
                  const metadata = JSON.parse(extendedInfo.metadataIPFSHash);
                  if (metadata.description) {
                    campaign.description = metadata.description;
                  }
                  if (metadata.beneficiaries) {
                    campaign.beneficiaries = metadata.beneficiaries;
                  }
                }
              } catch (e) {
                console.warn('Error parsing metadata:', e);
              }
            }
          }
        } catch (error) {
          console.warn('Error fetching campaign extended info:', error);
        }
      }
      
      // Try to get milestones
      if (hasGetCampaignMilestonesMethod) {
        try {
          console.log('Fetching campaign milestones...');
          const milestones = await this.contract.getCampaignMilestones(numericId);
          console.log('Raw data from getCampaignMilestones:', milestones);
          
          if (milestones && milestones.length > 0) {
            campaign.milestones = milestones.map((milestone: any) => ({
              name: milestone.name || 'Unnamed Milestone',
              targetAmount: BigInt(milestone.targetAmount || '0'), // Use BigInt
              isCompleted: milestone.isCompleted || false,
              isFunded: milestone.isFunded || false,
              proofOfCompletion: milestone.proofOfCompletion || '',
              fundsReleased: BigInt(milestone.fundsReleased || '0'), // Use BigInt
              isUnderReview: milestone.isUnderReview || false
            }));
          }
        } catch (error) {
          console.warn('Error fetching campaign milestones:', error);
        }
      }
      
      // Try to get donors
      if (hasGetCampaignDonorsMethod) {
        try {
          console.log('Fetching campaign donors...');
          const donors = await this.contract.getCampaignDonors(numericId);
          console.log('Raw data from getCampaignDonors:', donors);
          
          if (donors) {
            campaign.donors = donors;
            campaign.contributorsCount = donors.length;
          }
        } catch (error) {
          console.warn('Error fetching campaign donors:', error);
        }
      }
      
      // Compute additional fields based on available data
      this.computeCampaignDerivedFields(campaign);
      
      console.log(`===== CAMPAIGN RETRIEVAL COMPLETE =====`);
      console.log('Final campaign data:', campaign);
      
      return campaign;
    } catch (error) {
      console.error('Error in getCampaign:', error);
      throw error;
    }
  }

  /**
   * Compute derived fields for a campaign based on available data
   */
  private computeCampaignDerivedFields(campaign: Campaign): void {
    try {
      // Convert bigint values to string/number for use in UI
      if (campaign.goalAmount) {
        campaign.goalAmountEth = parseFloat(formatEther(campaign.goalAmount)); // Use imported formatEther
      }

      if (campaign.totalFunded) {
        campaign.currentAmount = parseFloat(formatEther(campaign.totalFunded)); // Use imported formatEther

        // Calculate progress percentage
        if (campaign.goalAmount && campaign.goalAmount > 0n) { // Use bigint comparison
          // Use standard bigint math and Number() conversion
          campaign.progress = Number((campaign.totalFunded * 100n) / campaign.goalAmount);
        }
      }
      
      // Compute end time if we have createdAt and duration
      if (campaign.createdAt && campaign.duration) {
        campaign.endTime = campaign.createdAt + campaign.duration;
        
        // Compute status based on end time and current time
        const currentTime = Math.floor(Date.now() / 1000);
        if (campaign.isActive === undefined) {
          campaign.isActive = currentTime < campaign.endTime;
          campaign.status = campaign.isActive ? 'active' : 'ended';
        }
      }
      
      // Process milestone information if available
      if (campaign.milestones && campaign.milestones.length > 0) {
        // Calculate funds distribution across milestones
        let totalMilestoneAmount = 0n; // Use bigint literal
        campaign.milestones.forEach((milestone: CampaignMilestoneInfo) => { // Add type hint
          if (milestone.targetAmount) {
            totalMilestoneAmount = totalMilestoneAmount + BigInt(milestone.targetAmount || '0'); // Use bigint math
          }
        });
        
        // Ensure we have a current milestone index
        if (campaign.currentMilestone === undefined) {
          campaign.currentMilestone = 0;
          
          // Try to determine current milestone based on completion status
          for (let i = 0; i < campaign.milestones.length; i++) {
            if (!campaign.milestones[i].isCompleted) {
              campaign.currentMilestone = i;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error computing derived fields:', error);
    }
  }

  /**
   * @description Get the total number of campaigns
   * @returns Total number of campaigns
   */
  public async getCampaignCount(): Promise<number> {
    try {
      await this.ensureInitialized();
      
      if (!this.contract) {
        throw new Error('Contract is not initialized');
      }
      
      if (this.hasMethod('getCampaignCount')) {
        const count = await this.contract.getCampaignCount();
        return count.toNumber();
      } else if (this.hasMethod('campaignCounter')) {
        const count = await this.contract.campaignCounter();
        return count.toNumber();
      } else {
        console.warn('No campaign count method available, will attempt to scan campaigns');
        
        // Fallback is removed as it relied on missing methods.
        // If specific count methods aren't present, we cannot reliably get the total count.
        // Functions needing the count should handle this possibility.
        console.error('No getCampaignCount or campaignCounter method found in ABI.');
        throw new Error('Cannot determine campaign count from contract.');
      }
    } catch (error) {
      console.error('Error getting campaign count:', error);
      return 0;
    }
  }

  /**
   * @description Get campaign IDs created by a specific user using getCreatorCampaigns
   * @param userAddress Address of the creator
   * @returns Array of campaign IDs (as numbers) created by the user
   */
  public async getUserCampaignIds(userAddress: string): Promise<number[]> {
      await this.ensureInitialized();
      if (!this.contract) {
          throw new Error('Contract is not initialized');
      }
      // Use the correct function name from the ABI
      if (!this.hasMethod('getCreatorCampaigns')) {
          console.error('getCreatorCampaigns method not found in ABI.');
          throw new Error('Required method getCreatorCampaigns not available.');
      }

      try {
          console.log(`Fetching campaign IDs for creator: ${userAddress}`);
          // Call the correct function
          const campaignIdBigInts: bigint[] = await this.contract.getCreatorCampaigns(userAddress);
          console.log(`Received ${campaignIdBigInts.length} campaign IDs (BigInt):`, campaignIdBigInts.map(id => id.toString()));
          // Convert BigInt[] to number[] safely
          const campaignIds = campaignIdBigInts.map(id => {
              if (id > BigInt(Number.MAX_SAFE_INTEGER)) {
                  console.warn(`Campaign ID ${id.toString()} exceeds MAX_SAFE_INTEGER, potential precision loss.`);
              }
              return Number(id);
          });
          console.log(`Converted campaign IDs (number):`, campaignIds);
          return campaignIds;
      } catch (error) {
          console.error(`Error fetching creator campaigns for ${userAddress}:`, error);
          throw new Error(`Failed to fetch campaigns for creator ${userAddress}`);
      }
  }

  /**
   * @description Get full campaign details for campaigns created by a user
   * @param userAddress Address of the user
   * @returns Array of full campaign objects created by the user
   */
  public async getUserCampaigns(userAddress: string): Promise<Campaign[]> {
      try {
          // Use the new helper function to get IDs first
          const campaignIds = await this.getUserCampaignIds(userAddress);
          console.log(`Fetching details for ${campaignIds.length} campaigns created by ${userAddress}`);
          
          // Use Promise.all to fetch details concurrently
          const campaignPromises = campaignIds.map(id => this.getCampaign(id.toString()));
          const userCampaigns = await Promise.all(campaignPromises);
          
          // Filter out any null results (if getCampaign failed for some reason)
          const validCampaigns = userCampaigns.filter((campaign): campaign is Campaign => campaign !== null);
          console.log(`Successfully fetched details for ${validCampaigns.length} campaigns.`);
          return validCampaigns;
          
      } catch (error) {
          console.error(`Error getting user campaigns for ${userAddress}:`, error);
          return []; // Return empty array on error
      }
  }

  /**
   * @description Get campaigns contributed to by a user (Placeholder - requires contract support)
   * @param userAddress Address of the user
   * @returns Array of campaigns contributed to by the user
   */
  public async getUserContributedCampaigns(userAddress: string): Promise<Campaign[]> {
      console.warn("getUserContributedCampaigns is not fully implemented - requires 'getContributorCampaigns' or similar in the contract ABI.");
      // Placeholder: Ideally, call a contract function like getContributorCampaigns(userAddress)
      // which returns an array of IDs, then fetch details similar to getUserCampaigns.
      // Example:
      if (this.hasMethod('getContributorCampaigns')) { // Check for the correct function name
         try {
           await this.ensureInitialized();
           if (!this.contract) throw new Error("Contract not initialized");
           const campaignIdBigInts: bigint[] = await this.contract.getContributorCampaigns(userAddress);
           const campaignIds = campaignIdBigInts.map(id => Number(id)); // Add safe conversion if needed
           console.log(`Fetching details for ${campaignIds.length} campaigns contributed to by ${userAddress}`);
           const campaignPromises = campaignIds.map(id => this.getCampaign(id.toString()));
           const contributedCampaigns = await Promise.all(campaignPromises);
           return contributedCampaigns.filter((c): c is Campaign => c !== null);
         } catch (error) {
            console.error(`Error fetching contributed campaigns for ${userAddress}:`, error);
            return [];
         }
      }
      return []; // Return empty array as function is not available or check failed
  }

  /**
   * Gets the contract address from config
   */
  private getContractFromConfig(): string | null {
    // CRITICAL FIX: Always use the correct contract address from contractHelpers
    return WOWZA_RUSH_CONTRACT_ADDRESS;
  }

  /**
   * Gets the contract ABI
   */
  private getContractAbi(): any[] {
    try {
      // Use the full ABI from contractHelpers instead of minimal ABI
      return getWowzaRushABI();
    } catch (e) {
      console.error('Error getting contract ABI:', e);
      throw new Error('Failed to load contract ABI');
    }
  }

  /**
   * Extracts a numeric ID from various campaign ID formats.
   * Uses the imported utility function for consistent handling.
   * 
   * @param id The campaign ID string to process
   * @returns The extracted numeric ID (defaults to 0 if extraction fails)
   */
  public extractNumericId(id: string): number {
    try {
      // Try to extract a numeric ID from various formats
      // Format 1: Plain number string
      if (/^\d+$/.test(id)) {
        return parseInt(id, 10);
      }
      
      // Format 2: String with only the number at the end (e.g., "campaign-123")
      const endMatch = id.match(/(\d+)$/);
      if (endMatch) {
        return parseInt(endMatch[1], 10);
      }
      
      // Format 3: String with the ID as a parameter (e.g., "?id=123")
      const paramMatch = id.match(/[?&]id=(\d+)/);
      if (paramMatch) {
        return parseInt(paramMatch[1], 10);
      }
      
      // Format 4: Full path with ID segment (e.g., "/campaign/123/details")
      const pathMatch = id.match(/\/(\d+)(?:\/|$)/);
      if (pathMatch) {
        return parseInt(pathMatch[1], 10);
      }
      
      // Default to 0 if no match found
      console.warn(`Failed to extract numeric ID from "${id}". Using default ID 0.`);
      return 0;
    } catch (error) {
      console.error('Error extracting numeric ID:', error);
      return 0;
    }
  }

  /**
   * Formats milestones for contract parameters
   * @param milestones Array of milestones
   * @returns Arrays of milestone names and target amounts (as bigints)
   */
  private formatMilestones(milestones: any[]): [string[], bigint[]] { // Updated return type
    if (!Array.isArray(milestones) || milestones.length === 0) {
      return [[], []];
    }
  
    // Ensure all milestone names are valid strings and no nulls
    const names = milestones.map(m => {
      if (!m || !m.name) return "Unnamed Milestone";
      // Sanitize the name to avoid encoding issues
      return typeof m.name === 'string' ? m.name.substring(0, 100) : "Unnamed Milestone";
    });
  
    // Ensure all target amounts are valid bigints
    const amounts = milestones.map(m => { // Use bigint array
      try {
        // Handle potential BigNumber objects from v5 or string/number values
        if (typeof m?.target === 'object' && m.target !== null && typeof m.target.toString === 'function') {
           return BigInt(m.target.toString()); // Convert from BigNumber-like or other objects
        }
        return BigInt(m?.target || '0'); // Convert from string/number, default to 0n
      } catch (e) {
        console.warn(`Error converting milestone target to BigInt:`, m?.target, e);
        return 0n; // Use bigint literal 0n
      }
    });
  
    return [names, amounts];
  }

  /**
   * Checks if the wallet is connected to the blockchain
   * @returns true if the wallet is connected, false otherwise
   */
  public isWalletConnected(): boolean {
    return this.walletState.isConnected;
  }
} // End of class BlockchainServiceFixed

// Create and export a singleton instance and the class
export const BlockchainServiceFixedV3Instance = new BlockchainServiceFixed();
export { BlockchainServiceFixed };
export default BlockchainServiceFixedV3Instance;