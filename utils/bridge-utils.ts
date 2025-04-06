/**
 * Cross-Chain Bridge Utilities
 * 
 * Provides functionality for transferring assets between different blockchain networks
 * Supports popular bridges like Polygon Bridge, Arbitrum Bridge, Optimism Bridge, etc.
 */

import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { getWalletConnector } from './wallet-connector';
import { getNetworkByChainId, NetworkConfig, switchNetwork } from './network-manager';
import { identifyWeb3Error, retryWeb3Operation } from './error-handler';
import { getERC20TokenMetadata, TokenMetadata, getERC20Contract } from './token-utils';
import { getOptimalGasSettings, GasPriceLevel } from './gas-optimizer';
import { measurePerformance } from './performance';
import * as storage from './web3-storage';

// Bridge types
export enum BridgeType {
  POLYGON = 'POLYGON',
  ARBITRUM = 'ARBITRUM',
  OPTIMISM = 'OPTIMISM',
  GNOSIS = 'GNOSIS',
  GENERIC_ERC20 = 'GENERIC_ERC20',
}

// Bridge direction
export enum BridgeDirection {
  TO_L2 = 'TO_L2',   // Mainnet to L2
  FROM_L2 = 'FROM_L2', // L2 to Mainnet
  CROSS_L2 = 'CROSS_L2', // L2 to L2 (if supported)
}

// Bridge token type
export enum BridgeTokenType {
  NATIVE = 'NATIVE',
  ERC20 = 'ERC20',
}

// Bridge configurations
interface BridgeConfiguration {
  type: BridgeType;
  name: string;
  description: string;
  sourceChainIds: number[];
  destinationChainIds: number[];
  supportedTokenTypes: BridgeTokenType[];
  contractAddresses: { [chainId: number]: string };
  websiteUrl: string;
  minimumAmount: string; // in token units
  maximumAmount?: string; // in token units
  estimatedTime: { [key in BridgeDirection]?: string };
  isThirdParty: boolean;
}

// Bridge quota information
export interface BridgeQuota {
  remainingQuota: string;
  refreshTime: Date;
  waitingPeriod: string; // e.g., "7 days"
  formattedQuota: string;
}

// Bridge fee information
export interface BridgeFee {
  percentage?: number;
  fixedFee?: string;
  estimatedFee: string;
  estimatedGasCost: string;
  totalCost: string;
  formattedTotalCost: string;
  token: string;
}

// Bridge transaction information
export interface BridgeTx {
  sourceChainId: number;
  destinationChainId: number;
  sourceHash: string;
  destinationHash?: string;
  token: string;
  tokenAddress?: string;
  amount: string;
  formattedAmount: string;
  status: 'PENDING' | 'CONFIRMED' | 'CLAIMED' | 'FAILED';
  timestamp: number;
  estimatedCompletionTime?: number;
  bridgeType: BridgeType;
  direction: BridgeDirection;
  sender: string;
  recipient: string;
  fee?: BridgeFee;
}

// Bridge configurations for major bridges
const BRIDGE_CONFIGS: { [key in BridgeType]: BridgeConfiguration } = {
  [BridgeType.POLYGON]: {
    type: BridgeType.POLYGON,
    name: 'Polygon PoS Bridge',
    description: 'Official Polygon (formerly Matic) bridge for transferring assets between Ethereum and Polygon',
    sourceChainIds: [1, 137], // Ethereum, Polygon
    destinationChainIds: [1, 137], // Ethereum, Polygon
    supportedTokenTypes: [BridgeTokenType.NATIVE, BridgeTokenType.ERC20],
    contractAddresses: {
      1: '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77', // Ethereum RootChainManager
      137: '0xBbD7CbFA79faee899Eaf900F13C9065bF03B1A74', // Polygon Predicate
    },
    websiteUrl: 'https://wallet.polygon.technology/bridge/',
    minimumAmount: '0',
    estimatedTime: {
      [BridgeDirection.TO_L2]: '10-30 minutes',
      [BridgeDirection.FROM_L2]: '1-3 hours',
    },
    isThirdParty: false,
  },
  
  [BridgeType.ARBITRUM]: {
    type: BridgeType.ARBITRUM,
    name: 'Arbitrum Bridge',
    description: 'Official Arbitrum bridge for transferring assets between Ethereum and Arbitrum',
    sourceChainIds: [1, 42161], // Ethereum, Arbitrum
    destinationChainIds: [1, 42161], // Ethereum, Arbitrum
    supportedTokenTypes: [BridgeTokenType.NATIVE, BridgeTokenType.ERC20],
    contractAddresses: {
      1: '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef', // Ethereum L1 Bridge
      42161: '0x0000000000000000000000000000000000000000', // Not needed for Arbitrum side
    },
    websiteUrl: 'https://bridge.arbitrum.io/',
    minimumAmount: '0',
    estimatedTime: {
      [BridgeDirection.TO_L2]: '10-20 minutes',
      [BridgeDirection.FROM_L2]: '7 days',
    },
    isThirdParty: false,
  },
  
  [BridgeType.OPTIMISM]: {
    type: BridgeType.OPTIMISM,
    name: 'Optimism Bridge',
    description: 'Official Optimism bridge for transferring assets between Ethereum and Optimism',
    sourceChainIds: [1, 10], // Ethereum, Optimism
    destinationChainIds: [1, 10], // Ethereum, Optimism
    supportedTokenTypes: [BridgeTokenType.NATIVE, BridgeTokenType.ERC20],
    contractAddresses: {
      1: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1', // Ethereum L1 Standard Bridge
      10: '0x4200000000000000000000000000000000000010', // Optimism L2 Standard Bridge
    },
    websiteUrl: 'https://app.optimism.io/bridge/',
    minimumAmount: '0',
    estimatedTime: {
      [BridgeDirection.TO_L2]: '1-5 minutes',
      [BridgeDirection.FROM_L2]: '7 days',
    },
    isThirdParty: false,
  },
  
  [BridgeType.GNOSIS]: {
    type: BridgeType.GNOSIS,
    name: 'Gnosis Bridge',
    description: 'Official Gnosis bridge for transferring assets between Ethereum and Gnosis Chain (formerly xDai)',
    sourceChainIds: [1, 100], // Ethereum, Gnosis
    destinationChainIds: [1, 100], // Ethereum, Gnosis
    supportedTokenTypes: [BridgeTokenType.NATIVE, BridgeTokenType.ERC20],
    contractAddresses: {
      1: '0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016', // Ethereum Foreign Bridge
      100: '0x7301CFA0e1756B71869E93d4e4Dca5c7d0eb0AA6', // Gnosis Home Bridge
    },
    websiteUrl: 'https://bridge.gnosischain.com/',
    minimumAmount: '0',
    estimatedTime: {
      [BridgeDirection.TO_L2]: '5-20 minutes',
      [BridgeDirection.FROM_L2]: '5-20 minutes',
    },
    isThirdParty: false,
  },
  
  [BridgeType.GENERIC_ERC20]: {
    type: BridgeType.GENERIC_ERC20,
    name: 'Generic ERC20 Bridge',
    description: 'A generic bridge interface for ERC20 tokens between any supported chains',
    sourceChainIds: [1, 10, 42161, 137, 100], // Ethereum, Optimism, Arbitrum, Polygon, Gnosis
    destinationChainIds: [1, 10, 42161, 137, 100], // Ethereum, Optimism, Arbitrum, Polygon, Gnosis
    supportedTokenTypes: [BridgeTokenType.ERC20],
    contractAddresses: {}, // Uses the appropriate bridge based on chains
    websiteUrl: '',
    minimumAmount: '0',
    estimatedTime: {
      [BridgeDirection.TO_L2]: '10-30 minutes',
      [BridgeDirection.FROM_L2]: '1-7 days',
      [BridgeDirection.CROSS_L2]: '1-3 hours',
    },
    isThirdParty: false,
  },
};

// ABI fragments for various bridges
const POLYGON_ROOT_CHAIN_MANAGER_ABI = [
  'function depositEtherFor(address user) payable',
  'function depositFor(address user, address rootToken, bytes calldata depositData)',
];

const POLYGON_ERC20_PREDICATE_ABI = [
  'function lockTokens(address depositor, address depositReceiver, address rootToken, bytes calldata depositData)',
];

const ARBITRUM_L1_BRIDGE_ABI = [
  'function depositEth() payable',
  'function outboundTransfer(address _l1Token, address _to, uint256 _amount, bytes calldata _data) payable returns (bytes)',
];

const OPTIMISM_L1_BRIDGE_ABI = [
  'function depositETH(uint256 _amount, uint32 _l2Gas, bytes calldata _data) payable',
  'function depositERC20(address _l1Token, address _l2Token, uint256 _amount, uint32 _l2Gas, bytes calldata _data)',
];

const GNOSIS_BRIDGE_ABI = [
  'function relayTokens(address token, address _receiver, uint256 _value)',
];

// ERC20 interface for approvals
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
];

/**
 * Get bridge configuration by type
 * @param bridgeType Bridge type
 * @returns Bridge configuration
 */
export function getBridgeConfig(bridgeType: BridgeType): BridgeConfiguration {
  return BRIDGE_CONFIGS[bridgeType];
}

/**
 * Get all available bridges
 * @returns Array of all bridge configurations
 */
export function getAllBridges(): BridgeConfiguration[] {
  return Object.values(BRIDGE_CONFIGS);
}

/**
 * Get available bridges for a specific token type between chains
 * @param sourceChainId Source chain ID
 * @param destinationChainId Destination chain ID
 * @param tokenType Token type to bridge
 * @returns Array of available bridge configurations
 */
export function getAvailableBridges(
  sourceChainId: number,
  destinationChainId: number,
  tokenType: BridgeTokenType
): BridgeConfiguration[] {
  return Object.values(BRIDGE_CONFIGS).filter(bridge => 
    bridge.sourceChainIds.includes(sourceChainId) &&
    bridge.destinationChainIds.includes(destinationChainId) &&
    bridge.supportedTokenTypes.includes(tokenType)
  );
}

/**
 * Calculate bridge direction based on chain IDs
 * @param sourceChainId Source chain ID
 * @param destinationChainId Destination chain ID
 * @returns Bridge direction
 */
export function calculateBridgeDirection(
  sourceChainId: number,
  destinationChainId: number
): BridgeDirection {
  // Define mainnet chain ID
  const MAINNET_CHAIN_ID = 1;
  
  // L2 to L2 direct bridging (if both are not mainnet)
  if (sourceChainId !== MAINNET_CHAIN_ID && destinationChainId !== MAINNET_CHAIN_ID) {
    return BridgeDirection.CROSS_L2;
  }
  
  // L2 to Mainnet
  if (sourceChainId !== MAINNET_CHAIN_ID && destinationChainId === MAINNET_CHAIN_ID) {
    return BridgeDirection.FROM_L2;
  }
  
  // Mainnet to L2
  return BridgeDirection.TO_L2;
}

/**
 * Bridge ETH between chains
 * @param amount Amount to bridge in ETH
 * @param sourceChainId Source chain ID
 * @param destinationChainId Destination chain ID
 * @param bridgeType Bridge type
 * @param recipient Recipient address (defaults to sender)
 * @returns Transaction hash and details
 */
export async function bridgeETH(
  amount: string,
  sourceChainId: number,
  destinationChainId: number,
  bridgeType: BridgeType,
  recipient?: string
): Promise<BridgeTx> {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  const signer = connector.getSigner();
  
  if (!provider || !signer) {
    throw new Error('No provider or signer available');
  }
  
  // Get sender address
  const sender = connector.getAddress();
  if (!sender) {
    throw new Error('No wallet connected');
  }
  
  // Use sender as recipient if not provided
  const actualRecipient = recipient || sender;
  
  // Check if we need to switch networks
  if (connector.getChainId() !== sourceChainId) {
    await switchNetwork(sourceChainId);
  }
  
  // Get bridge configuration
  const bridgeConfig = getBridgeConfig(bridgeType);
  
  // Validate that this bridge supports the source and destination chains
  if (!bridgeConfig.sourceChainIds.includes(sourceChainId) || 
      !bridgeConfig.destinationChainIds.includes(destinationChainId)) {
    throw new Error(`Bridge ${bridgeConfig.name} does not support transfer from chain ${sourceChainId} to chain ${destinationChainId}`);
  }
  
  // Parse amount
  const parsedAmount = parseUnits(amount, 18); // ETH has 18 decimals
  
  // Calculate direction
  const direction = calculateBridgeDirection(sourceChainId, destinationChainId);
  
  try {
    return await measurePerformance(async () => {
      // Get optimal gas settings
      const gasSettings = await getOptimalGasSettings(provider, GasPriceLevel.STANDARD);
      
      let tx;
      
      switch (bridgeType) {
        case BridgeType.POLYGON: {
          const contract = new Contract(
            bridgeConfig.contractAddresses[sourceChainId],
            POLYGON_ROOT_CHAIN_MANAGER_ABI,
            signer
          );
          
          if (direction === BridgeDirection.TO_L2) {
            tx = await contract.depositEtherFor(actualRecipient, {
              ...gasSettings,
              value: parsedAmount,
            });
          } else {
            throw new Error("Withdrawing ETH from Polygon requires using the Polygon Bridge UI");
          }
          break;
        }
        
        case BridgeType.ARBITRUM: {
          if (direction === BridgeDirection.TO_L2) {
            const contract = new Contract(
              bridgeConfig.contractAddresses[sourceChainId],
              ARBITRUM_L1_BRIDGE_ABI,
              signer
            );
            
            tx = await contract.depositEth({
              ...gasSettings,
              value: parsedAmount,
            });
          } else {
            throw new Error("Withdrawing ETH from Arbitrum requires using the Arbitrum Bridge UI");
          }
          break;
        }
        
        case BridgeType.OPTIMISM: {
          if (direction === BridgeDirection.TO_L2) {
            const contract = new Contract(
              bridgeConfig.contractAddresses[sourceChainId],
              OPTIMISM_L1_BRIDGE_ABI,
              signer
            );
            
            // Using default gas limit for L2
            const l2Gas = 200000;
            
            tx = await contract.depositETH(parsedAmount, l2Gas, '0x', {
              ...gasSettings,
              value: parsedAmount,
            });
          } else {
            throw new Error("Withdrawing ETH from Optimism requires using the Optimism Bridge UI");
          }
          break;
        }
        
        default:
          throw new Error(`Bridging ETH with ${bridgeType} bridge is not supported directly through this interface`);
      }
      
      // Wait for transaction to be mined
      const receipt = await tx.wait(1);
      
      // Format the result
      const bridgeTx: BridgeTx = {
        sourceChainId,
        destinationChainId,
        sourceHash: tx.hash,
        token: 'ETH',
        amount: parsedAmount.toString(),
        formattedAmount: formatUnits(parsedAmount, 18),
        status: 'PENDING',
        timestamp: Date.now(),
        bridgeType,
        direction,
        sender,
        recipient: actualRecipient,
        estimatedCompletionTime: calculateEstimatedCompletionTime(bridgeType, direction),
      };
      
      // Store bridge transaction in storage
      await storeBridgeTransaction(bridgeTx);
      
      return bridgeTx;
    }, 'bridgeETH');
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error bridging ETH:', web3Error);
    throw error;
  }
}

/**
 * Bridge ERC20 tokens between chains
 * @param tokenAddress ERC20 token address on source chain
 * @param amount Amount to bridge in token units
 * @param sourceChainId Source chain ID
 * @param destinationChainId Destination chain ID
 * @param bridgeType Bridge type
 * @param recipient Recipient address (defaults to sender)
 * @returns Transaction hash and details
 */
export async function bridgeERC20(
  tokenAddress: string,
  amount: string,
  sourceChainId: number,
  destinationChainId: number,
  bridgeType: BridgeType,
  recipient?: string
): Promise<BridgeTx> {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  const signer = connector.getSigner();
  
  if (!provider || !signer) {
    throw new Error('No provider or signer available');
  }
  
  // Get sender address
  const sender = connector.getAddress();
  if (!sender) {
    throw new Error('No wallet connected');
  }
  
  // Use sender as recipient if not provided
  const actualRecipient = recipient || sender;
  
  // Check if we need to switch networks
  if (connector.getChainId() !== sourceChainId) {
    await switchNetwork(sourceChainId);
  }
  
  // Get bridge configuration
  const bridgeConfig = getBridgeConfig(bridgeType);
  
  // Validate that this bridge supports the source and destination chains
  if (!bridgeConfig.sourceChainIds.includes(sourceChainId) || 
      !bridgeConfig.destinationChainIds.includes(destinationChainId)) {
    throw new Error(`Bridge ${bridgeConfig.name} does not support transfer from chain ${sourceChainId} to chain ${destinationChainId}`);
  }
  
  // Get token metadata
  const tokenMetadata = await getERC20TokenMetadata(tokenAddress, sourceChainId);
  
  // Parse amount using token decimals
  const parsedAmount = parseUnits(amount, tokenMetadata.decimals);
  
  // Calculate direction
  const direction = calculateBridgeDirection(sourceChainId, destinationChainId);
  
  try {
    return await measurePerformance(async () => {
      // Get optimal gas settings
      const gasSettings = await getOptimalGasSettings(provider, GasPriceLevel.STANDARD);
      
      // Token contract for approvals
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      
      // Bridge contract
      let bridgeContract;
      let tx;
      
      switch (bridgeType) {
        case BridgeType.POLYGON: {
          bridgeContract = new Contract(
            bridgeConfig.contractAddresses[sourceChainId],
            POLYGON_ROOT_CHAIN_MANAGER_ABI,
            signer
          );
          
          if (direction === BridgeDirection.TO_L2) {
            // Approve tokens for bridge
            const approveTx = await tokenContract.approve(bridgeConfig.contractAddresses[sourceChainId], parsedAmount);
            await approveTx.wait(1);
            
            // Deposit tokens to bridge
            tx = await bridgeContract.depositFor(
              actualRecipient,
              tokenAddress,
              ethers.utils.defaultAbiCoder.encode(['uint256'], [parsedAmount]),
              gasSettings
            );
          } else {
            throw new Error("Withdrawing tokens from Polygon requires using the Polygon Bridge UI");
          }
          break;
        }
        
        case BridgeType.ARBITRUM: {
          if (direction === BridgeDirection.TO_L2) {
            bridgeContract = new Contract(
              bridgeConfig.contractAddresses[sourceChainId],
              ARBITRUM_L1_BRIDGE_ABI,
              signer
            );
            
            // Approve tokens for bridge
            const approveTx = await tokenContract.approve(bridgeConfig.contractAddresses[sourceChainId], parsedAmount);
            await approveTx.wait(1);
            
            // Deposit tokens to bridge
            tx = await bridgeContract.outboundTransfer(
              tokenAddress,
              actualRecipient,
              parsedAmount,
              '0x',
              gasSettings
            );
          } else {
            throw new Error("Withdrawing tokens from Arbitrum requires using the Arbitrum Bridge UI");
          }
          break;
        }
        
        case BridgeType.OPTIMISM: {
          if (direction === BridgeDirection.TO_L2) {
            bridgeContract = new Contract(
              bridgeConfig.contractAddresses[sourceChainId],
              OPTIMISM_L1_BRIDGE_ABI,
              signer
            );
            
            // Approve tokens for bridge
            const approveTx = await tokenContract.approve(bridgeConfig.contractAddresses[sourceChainId], parsedAmount);
            await approveTx.wait(1);
            
            // Get the L2 token address (usually it's the same address as L1)
            const l2TokenAddress = tokenAddress;
            
            // Using default gas limit for L2
            const l2Gas = 200000;
            
            // Deposit tokens to bridge
            tx = await bridgeContract.depositERC20(
              tokenAddress,
              l2TokenAddress,
              parsedAmount,
              l2Gas,
              '0x',
              gasSettings
            );
          } else {
            throw new Error("Withdrawing tokens from Optimism requires using the Optimism Bridge UI");
          }
          break;
        }
        
        case BridgeType.GNOSIS: {
          bridgeContract = new Contract(
            bridgeConfig.contractAddresses[sourceChainId],
            GNOSIS_BRIDGE_ABI,
            signer
          );
          
          // Approve tokens for bridge
          const approveTx = await tokenContract.approve(bridgeConfig.contractAddresses[sourceChainId], parsedAmount);
          await approveTx.wait(1);
          
          // Relay tokens to bridge
          tx = await bridgeContract.relayTokens(
            tokenAddress,
            actualRecipient,
            parsedAmount,
            gasSettings
          );
          break;
        }
        
        default:
          throw new Error(`Bridging tokens with ${bridgeType} bridge is not supported directly through this interface`);
      }
      
      // Wait for transaction to be mined
      const receipt = await tx.wait(1);
      
      // Format the result
      const bridgeTx: BridgeTx = {
        sourceChainId,
        destinationChainId,
        sourceHash: tx.hash,
        token: tokenMetadata.symbol,
        tokenAddress,
        amount: parsedAmount.toString(),
        formattedAmount: formatUnits(parsedAmount, tokenMetadata.decimals),
        status: 'PENDING',
        timestamp: Date.now(),
        bridgeType,
        direction,
        sender,
        recipient: actualRecipient,
        estimatedCompletionTime: calculateEstimatedCompletionTime(bridgeType, direction),
      };
      
      // Store bridge transaction in storage
      await storeBridgeTransaction(bridgeTx);
      
      return bridgeTx;
    }, 'bridgeERC20');
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error bridging ERC20 tokens:', web3Error);
    throw error;
  }
}

/**
 * Calculate estimated completion time for a bridge transaction
 * @param bridgeType Bridge type
 * @param direction Bridge direction
 * @returns Estimated completion time in milliseconds
 */
function calculateEstimatedCompletionTime(bridgeType: BridgeType, direction: BridgeDirection): number {
  const bridgeConfig = getBridgeConfig(bridgeType);
  const estimatedTimeStr = bridgeConfig.estimatedTime[direction];
  
  if (!estimatedTimeStr) {
    return Date.now() + 60 * 60 * 1000; // Default: 1 hour
  }
  
  // Parse the time string (e.g., "10-30 minutes", "1-3 hours", "7 days")
  const timeValues = estimatedTimeStr.match(/(\d+)(?:-(\d+))?\s+(minutes|hours|days)/i);
  
  if (!timeValues) {
    return Date.now() + 60 * 60 * 1000; // Default: 1 hour
  }
  
  const minValue = parseInt(timeValues[1]);
  const maxValue = timeValues[2] ? parseInt(timeValues[2]) : minValue;
  const unit = timeValues[3].toLowerCase();
  
  // Use the maximum value for a conservative estimate
  let milliseconds = 0;
  
  switch (unit) {
    case 'minutes':
      milliseconds = maxValue * 60 * 1000;
      break;
    case 'hours':
      milliseconds = maxValue * 60 * 60 * 1000;
      break;
    case 'days':
      milliseconds = maxValue * 24 * 60 * 60 * 1000;
      break;
    default:
      milliseconds = 60 * 60 * 1000; // Default: 1 hour
  }
  
  return Date.now() + milliseconds;
}

/**
 * Store bridge transaction in storage
 * @param bridgeTx Bridge transaction
 */
async function storeBridgeTransaction(bridgeTx: BridgeTx): Promise<void> {
  try {
    // Generate a unique ID for the transaction
    const txId = `bridge-${bridgeTx.sourceChainId}-${bridgeTx.destinationChainId}-${bridgeTx.sourceHash}`;
    
    // Store in local storage
    const bridgeTxs = getBridgeTransactions();
    bridgeTxs.push(bridgeTx);
    localStorage.setItem('bridge-transactions', JSON.stringify(bridgeTxs));
    
    // Store in IndexedDB for persistence
    await storage.BlockchainCache.set(
      txId,
      bridgeTx,
      bridgeTx.sourceChainId, // Store on source chain
      60 * 60 * 24 * 30 // 30 days expiry
    );
  } catch (error) {
    console.error('Error storing bridge transaction:', error);
  }
}

/**
 * Get all bridge transactions from storage
 * @returns Array of bridge transactions
 */
export function getBridgeTransactions(): BridgeTx[] {
  try {
    const txsJson = localStorage.getItem('bridge-transactions');
    if (!txsJson) return [];
    
    return JSON.parse(txsJson);
  } catch (error) {
    console.error('Error getting bridge transactions:', error);
    return [];
  }
}

/**
 * Get bridge transaction by source hash
 * @param sourceHash Source transaction hash
 * @returns Bridge transaction or null if not found
 */
export function getBridgeTransactionByHash(sourceHash: string): BridgeTx | null {
  const transactions = getBridgeTransactions();
  return transactions.find(tx => tx.sourceHash === sourceHash) || null;
}

/**
 * Update bridge transaction status
 * @param sourceHash Source transaction hash
 * @param status New status
 * @param destinationHash Optional destination transaction hash
 */
export async function updateBridgeTransactionStatus(
  sourceHash: string,
  status: BridgeTx['status'],
  destinationHash?: string
): Promise<void> {
  try {
    const transactions = getBridgeTransactions();
    const txIndex = transactions.findIndex(tx => tx.sourceHash === sourceHash);
    
    if (txIndex === -1) {
      return;
    }
    
    // Update status
    transactions[txIndex].status = status;
    
    // Update destination hash if provided
    if (destinationHash) {
      transactions[txIndex].destinationHash = destinationHash;
    }
    
    // Save updated transactions
    localStorage.setItem('bridge-transactions', JSON.stringify(transactions));
    
    // Update in IndexedDB
    const txId = `bridge-${transactions[txIndex].sourceChainId}-${transactions[txIndex].destinationChainId}-${sourceHash}`;
    await storage.BlockchainCache.set(
      txId,
      transactions[txIndex],
      transactions[txIndex].sourceChainId, // Store on source chain
      60 * 60 * 24 * 30 // 30 days expiry
    );
  } catch (error) {
    console.error('Error updating bridge transaction status:', error);
  }
}

/**
 * Check bridge quota for an address on a specific bridge
 * @param address User address
 * @param bridgeType Bridge type
 * @param sourceChainId Source chain ID
 * @param destinationChainId Destination chain ID
 * @returns Bridge quota information
 */
export async function checkBridgeQuota(
  address: string,
  bridgeType: BridgeType,
  sourceChainId: number,
  destinationChainId: number
): Promise<BridgeQuota | null> {
  // Currently only Arbitrum has a quota system
  if (bridgeType !== BridgeType.ARBITRUM || 
      sourceChainId !== 42161 || 
      destinationChainId !== 1) {
    return null;
  }
  
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  try {
    // Note: This is a placeholder implementation
    // In a real application, you would query the Arbitrum Outbox contract
    // to get the actual remaining quota
    
    // For now, return a mock quota
    return {
      remainingQuota: '1000000000000000000', // 1 ETH
      refreshTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      waitingPeriod: '7 days',
      formattedQuota: '1.0 ETH',
    };
  } catch (error) {
    console.error('Error checking bridge quota:', error);
    return null;
  }
}

/**
 * Estimate bridge fee for a specific bridge
 * @param bridgeType Bridge type
 * @param sourceChainId Source chain ID
 * @param destinationChainId Destination chain ID
 * @param amount Amount to bridge in token units
 * @param tokenAddress Token address (or null for native token)
 * @returns Bridge fee information
 */
export async function estimateBridgeFee(
  bridgeType: BridgeType,
  sourceChainId: number,
  destinationChainId: number,
  amount: string,
  tokenAddress?: string
): Promise<BridgeFee> {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  try {
    // This is a placeholder implementation
    // In a real application, you would query the bridge contracts
    // to get the actual fee estimation
    
    // Default token is the native token
    let token = 'ETH';
    let tokenDecimals = 18;
    
    // If token address is provided, get the token info
    if (tokenAddress) {
      const tokenMetadata = await getERC20TokenMetadata(tokenAddress, sourceChainId);
      token = tokenMetadata.symbol;
      tokenDecimals = tokenMetadata.decimals;
    }
    
    // Parse the amount
    const parsedAmount = parseUnits(amount, tokenDecimals);
    
    // Different bridges have different fee structures
    let feePercentage = 0;
    let fixedFee = '0';
    let estimatedGasCost = '5000000000000000'; // 0.005 ETH as a placeholder
    
    switch (bridgeType) {
      case BridgeType.POLYGON:
        // Polygon has no fees on the bridge itself, just gas
        break;
      case BridgeType.ARBITRUM:
        // Arbitrum has no fees on the bridge itself, just gas
        if (sourceChainId === 1) {
          estimatedGasCost = '15000000000000000'; // Higher gas for L1 to L2
        }
        break;
      case BridgeType.OPTIMISM:
        // Optimism has no fees on the bridge itself, just gas
        if (sourceChainId === 1) {
          estimatedGasCost = '10000000000000000'; // Higher gas for L1 to L2
        }
        break;
      case BridgeType.GNOSIS:
        // Gnosis has a small fee
        feePercentage = 0.1; // 0.1%
        break;
      default:
        // Generic bridge with a small fee
        feePercentage = 0.2; // 0.2%
    }
    
    // Calculate fee based on percentage
    const feeAmount = parsedAmount.mul(Math.floor(feePercentage * 10000)).div(1000000);
    
    // Calculate total cost (fee + gas)
    const totalCost = feeAmount.add(fixedFee || '0').add(estimatedGasCost);
    
    return {
      percentage: feePercentage,
      fixedFee: fixedFee,
      estimatedFee: feeAmount.toString(),
      estimatedGasCost,
      totalCost: totalCost.toString(),
      formattedTotalCost: formatUnits(totalCost, tokenDecimals),
      token,
    };
  } catch (error) {
    console.error('Error estimating bridge fee:', error);
    throw error;
  }
}

/**
 * React hook for bridge transactions
 * @returns Bridge utilities and transaction history
 */
export function useBridgeTransactions() {
  return {
    transactions: getBridgeTransactions(),
    bridgeETH,
    bridgeERC20,
    updateStatus: updateBridgeTransactionStatus,
    getByHash: getBridgeTransactionByHash,
    estimateFee: estimateBridgeFee,
    checkQuota: checkBridgeQuota,
    getAvailableBridges,
  };
}

// Mock ethers utilities for standalone module
const ethers = {
  utils: {
    defaultAbiCoder: {
      encode: (types: string[], values: any[]) => {
        // This is a simplified version for standalone usage
        return '0x0000000000000000000000000000000000000000000000000000000000000000';
      }
    }
  }
}; 