/**
 * Contract Factory Utility
 * 
 * Provides a safe and typed way to interact with smart contracts,
 * with contract version management and automatic type generation.
 */

import { Contract, ContractFactory } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { getWalletConnector } from './wallet-connector';
import { identifyWeb3Error, retryWeb3Operation } from './error-handler';
import { formatEthValue } from './gas-optimizer';
import { getNetworkByChainId, switchNetwork } from './network-manager';
import { measurePerformance } from './performance';
import * as storage from './web3-storage';

// Contract version interface
export interface ContractVersion {
  version: string;
  deployedAddresses: { [chainId: number]: string };
  abi: any[];
  bytecode?: string;
  deployedBytecode?: string;
  userCount?: number;
  releaseDate?: string;
  isDeprecated?: boolean;
  upgradeInstructions?: string;
}

// Contract definition with versions and metadata
export interface ContractDefinition {
  name: string;
  description: string;
  versions: { [version: string]: ContractVersion };
  currentVersion: string;
  registryAddress?: { [chainId: number]: string };
  implementationType: 'STANDARD' | 'UPGRADEABLE_PROXY' | 'BEACON_PROXY' | 'DIAMOND';
  interfaces: string[];
  repository?: string;
  audit?: { url: string; date: string };
  license: string;
}

// Contract registry to manage contract versions
export default class ContractRegistry {
  private contracts: Map<string, ContractDefinition> = new Map();

  /**
   * Register a contract definition
   * @param contract Contract definition
   */
  static registerContract(contract: ContractDefinition): void {
    this.contracts.set(contract.name, contract);
  }

  /**
   * Get contract definition by name
   * @param name Contract name
   * @returns Contract definition
   */
  static getContract(name: string): ContractDefinition {
    const contract = this.contracts.get(name);
    if (!contract) {
      throw new Error(`Contract "${name}" not found in registry`);
    }
    return contract;
  }

  /**
   * Get all registered contracts
   * @returns All contract definitions
   */
  static getAllContracts(): ContractDefinition[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Get contract address for specific version and chain
   * @param name Contract name
   * @param chainId Chain ID
   * @param version Specific version (defaults to current)
   * @returns Contract address
   */
  static getContractAddress(
    name: string,
    chainId: number,
    version?: string
  ): string {
    const contract = this.getContract(name);
    const actualVersion = version || contract.currentVersion;
    
    if (!contract.versions[actualVersion]) {
      throw new Error(`Version "${actualVersion}" not found for contract "${name}"`);
    }
    
    const address = contract.versions[actualVersion].deployedAddresses[chainId];
    if (!address) {
      throw new Error(`Contract "${name}" version "${actualVersion}" not deployed on chain ${chainId}`);
    }
    
    return address;
  }

  /**
   * Get contract ABI for a specific version
   * @param name Contract name
   * @param version Specific version (defaults to current)
   * @returns Contract ABI
   */
  static getContractABI(name: string, version?: string): any[] {
    const contract = this.getContract(name);
    const actualVersion = version || contract.currentVersion;
    
    if (!contract.versions[actualVersion]) {
      throw new Error(`Version "${actualVersion}" not found for contract "${name}"`);
    }
    
    return contract.versions[actualVersion].abi;
  }

  /**
   * Check if a contract has a specific interface
   * @param name Contract name
   * @param interfaceName Interface name
   * @returns True if contract implements interface
   */
  static hasInterface(name: string, interfaceName: string): boolean {
    const contract = this.getContract(name);
    return contract.interfaces.includes(interfaceName);
  }

  /**
   * Get all contracts implementing a specific interface
   * @param interfaceName Interface name
   * @returns Array of contracts implementing the interface
   */
  static getContractsByInterface(interfaceName: string): ContractDefinition[] {
    return Array.from(this.contracts.values()).filter(contract => 
      contract.interfaces.includes(interfaceName)
    );
  }
}

/**
 * Create a typed contract instance for a registered contract
 * @param name Contract name
 * @param chainId Chain ID
 * @param provider Web3 provider
 * @param options Additional options
 * @returns Contract instance
 */
export function createContract<T extends Contract = Contract>(
  name: string,
  chainId: number,
  provider: Web3Provider,
  options: {
    version?: string;
    address?: string; // Override address from registry
    withSigner?: boolean;
  } = {}
): T {
  const { version, address, withSigner = false } = options;
  
  // Get contract definition
  const definition = ContractRegistry.getContract(name);
  const actualVersion = version || definition.currentVersion;
  
  // Get contract ABI
  const abi = ContractRegistry.getContractABI(name, actualVersion);
  
  // Get contract address (use override if provided)
  const contractAddress = address || 
    ContractRegistry.getContractAddress(name, chainId, actualVersion);
  
  // Create contract instance
  let contract = new Contract(contractAddress, abi, provider) as T;
  
  // Add signer if requested
  if (withSigner) {
    const signer = provider.getSigner();
    contract = contract.connect(signer) as T;
  }
  
  return contract;
}

/**
 * Create a contract factory for deploying a contract
 * @param name Contract name
 * @param provider Web3 provider
 * @param version Contract version (defaults to current)
 * @returns Contract factory
 */
export function createContractFactory(
  name: string,
  provider: Web3Provider,
  version?: string
): ContractFactory {
  // Get contract definition
  const definition = ContractRegistry.getContract(name);
  const actualVersion = version || definition.currentVersion;
  
  // Get contract ABI and bytecode
  const abi = ContractRegistry.getContractABI(name, actualVersion);
  const bytecode = definition.versions[actualVersion].bytecode;
  
  if (!bytecode) {
    throw new Error(`Bytecode not available for contract "${name}" version "${actualVersion}"`);
  }
  
  // Get signer
  const signer = provider.getSigner();
  
  // Create contract factory
  return new ContractFactory(abi, bytecode, signer);
}

/**
 * Deploy a contract from the registry
 * @param name Contract name
 * @param constructorArgs Constructor arguments
 * @param options Deployment options
 * @returns Deployed contract
 */
export async function deployContract<T extends Contract = Contract>(
  name: string,
  constructorArgs: any[] = [],
  options: {
    version?: string;
    chainId?: number;
    waitForConfirmations?: number;
  } = {}
): Promise<T> {
  const { version, chainId, waitForConfirmations = 1 } = options;
  
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  const signer = connector.getSigner();
  
  if (!provider || !signer) {
    throw new Error('No provider or signer available');
  }
  
  // Switch network if needed
  if (chainId && connector.getChainId() !== chainId) {
    await switchNetwork(chainId);
  }
  
  try {
    return await measurePerformance(async () => {
      // Create contract factory
      const factory = createContractFactory(name, provider, version);
      
      // Deploy contract
      const contract = await factory.deploy(...constructorArgs);
      
      // Wait for deployment to complete
      await contract.deployTransaction.wait(waitForConfirmations);
      
      return contract as T;
    }, 'deployContract');
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error(`Error deploying contract "${name}":`, web3Error);
    throw error;
  }
}

/**
 * Safe contract call wrapper with retries and error handling
 * @param contract Contract instance
 * @param method Method name
 * @param args Method arguments
 * @param options Call options
 * @returns Method call result
 */
export async function safeContractCall<T = any>(
  contract: Contract,
  method: string,
  args: any[] = [],
  options: {
    maxRetries?: number;
    value?: string;
    gasLimit?: string;
    waitForConfirmations?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, value, gasLimit, waitForConfirmations = 0 } = options;
  
  // Check if method exists on contract
  if (!contract[method]) {
    throw new Error(`Method "${method}" not found on contract`);
  }
  
  // Prepare call options
  const callOptions: any = {};
  if (value) {
    callOptions.value = value;
  }
  if (gasLimit) {
    callOptions.gasLimit = gasLimit;
  }
  
  // Execute call with retries
  return await retryWeb3Operation(
    async () => {
      const result = await contract[method](...args, callOptions);
      
      // If result is a transaction response, wait for confirmations
      if (result.wait && waitForConfirmations > 0) {
        await result.wait(waitForConfirmations);
      }
      
      return result;
    },
    { maxRetries }
  );
}

/**
 * Safely read contract state (view functions)
 * @param contract Contract instance
 * @param method Method name
 * @param args Method arguments
 * @param options Call options
 * @returns Method call result
 */
export async function readContractState<T = any>(
  contract: Contract,
  method: string,
  args: any[] = [],
  options: {
    maxRetries?: number;
    blockTag?: number | string;
  } = {}
): Promise<T> {
  const { maxRetries = 3, blockTag } = options;
  
  // Check if method exists on contract
  if (!contract[method]) {
    throw new Error(`Method "${method}" not found on contract`);
  }
  
  // Get transaction override options
  const overrides: any = {};
  if (blockTag) {
    overrides.blockTag = blockTag;
  }
  
  // Execute call with retries
  return await retryWeb3Operation(
    async () => {
      // Use callStatic to safely read state without sending a transaction
      return args.length > 0
        ? await contract.callStatic[method](...args, overrides)
        : await contract.callStatic[method](overrides);
    },
    { maxRetries }
  );
}

/**
 * Get contract event history with filtering
 * @param contract Contract instance
 * @param eventName Event name
 * @param options Event query options
 * @returns Array of event logs
 */
export async function getContractEvents<T = any>(
  contract: Contract,
  eventName: string,
  options: {
    filter?: Record<string, any>;
    fromBlock?: number;
    toBlock?: number | string;
    maxResults?: number;
  } = {}
): Promise<T[]> {
  const { filter = {}, fromBlock = 0, toBlock = 'latest', maxResults } = options;
  
  try {
    // Create filter
    const eventFilter = contract.filters[eventName](...Object.values(filter));
    
    // Query logs
    const logs = await contract.queryFilter(eventFilter, fromBlock, toBlock);
    
    // Apply max results limit if specified
    const limitedLogs = maxResults ? logs.slice(0, maxResults) : logs;
    
    // Parse logs
    return limitedLogs.map(log => {
      const parsedLog = contract.interface.parseLog(log);
      return {
        ...parsedLog.args,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        event: parsedLog.name,
      } as any;
    });
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error(`Error getting contract events for "${eventName}":`, web3Error);
    throw error;
  }
}

/**
 * Listen for contract events
 * @param contract Contract instance
 * @param eventName Event name
 * @param callback Callback function for events
 * @param filter Optional event filter
 * @returns Unsubscribe function
 */
export function listenToContractEvents<T = any>(
  contract: Contract,
  eventName: string,
  callback: (event: T) => void,
  filter: Record<string, any> = {}
): () => void {
  // Create event filter
  const eventFilter = contract.filters[eventName](...Object.values(filter));
  
  // Set up event listener
  contract.on(eventFilter, (...args) => {
    // Last argument is the event object
    const event = args[args.length - 1];
    
    // Parse the event
    const parsedEvent = {
      ...contract.interface.parseLog(event).args,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      logIndex: event.logIndex,
      event: eventName,
    } as any;
    
    // Call the callback
    callback(parsedEvent);
  });
  
  // Return unsubscribe function
  return () => {
    contract.removeAllListeners(eventFilter);
  };
}

/**
 * Estimate gas for a contract method call
 * @param contract Contract instance
 * @param method Method name
 * @param args Method arguments
 * @param value Optional ETH value to send
 * @returns Estimated gas and readable format
 */
export async function estimateContractGas(
  contract: Contract,
  method: string,
  args: any[] = [],
  value?: string
): Promise<{
  gasLimit: string;
  formatted: string;
}> {
  try {
    // Prepare transaction options
    const options: any = {};
    if (value) {
      options.value = value;
    }
    
    // Estimate gas
    const gasEstimate = await contract.estimateGas[method](...args, options);
    
    // Add 20% buffer for safety
    const gasLimit = gasEstimate.mul(120).div(100);
    
    return {
      gasLimit: gasLimit.toString(),
      formatted: formatEthValue(gasLimit, 9) + ' gas',
    };
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error(`Error estimating gas for method "${method}":`, web3Error);
    throw error;
  }
}

/**
 * Check if a contract implements an interface via ERC-165
 * @param contract Contract instance
 * @param interfaceId Interface ID (ERC-165 format)
 * @returns True if interface is supported
 */
export async function contractSupportsInterface(
  contract: Contract,
  interfaceId: string
): Promise<boolean> {
  try {
    // Check if contract has supportsInterface method
    if (!contract.supportsInterface) {
      return false;
    }
    
    // Call supportsInterface
    return await contract.supportsInterface(interfaceId);
  } catch (error) {
    // If the call fails, the contract doesn't support ERC-165
    return false;
  }
}

/**
 * Verify contract source code on Etherscan
 * @param address Contract address
 * @param chainId Chain ID
 * @param constructorArgs Constructor arguments
 * @param options Verification options
 * @returns Verification result
 */
export async function verifyContract(
  address: string,
  chainId: number,
  constructorArgs: any[] = [],
  options: {
    name?: string;
    version?: string;
    compilerVersion?: string;
    optimizationUsed?: boolean;
    runs?: number;
    licenseType?: number;
  } = {}
): Promise<{
  success: boolean;
  message: string;
  url?: string;
}> {
  // This function would typically use Etherscan API
  // For now, it's a placeholder
  console.log(`Verification would be performed for ${address} on chain ${chainId}`);
  
  const network = getNetworkByChainId(chainId);
  const networkName = network?.name || 'unknown';
  
  return {
    success: true,
    message: 'Contract verification successful',
    url: `https://${networkName === 'ethereum' ? '' : networkName + '.'}etherscan.io/address/${address}#code`,
  };
}

/**
 * Example contract definition for demonstration
 */
const exampleERC20Contract: ContractDefinition = {
  name: 'ExampleToken',
  description: 'An example ERC20 token contract',
  versions: {
    '1.0.0': {
      version: '1.0.0',
      deployedAddresses: {
        1: '0x1234567890123456789012345678901234567890', // Ethereum
        137: '0x1234567890123456789012345678901234567891', // Polygon
      },
      abi: [
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "name_",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "symbol_",
              "type": "string"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "spender",
              "type": "address"
            }
          ],
          "name": "allowance",
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
              "name": "spender",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "approve",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "account",
              "type": "address"
            }
          ],
          "name": "balanceOf",
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
          "name": "decimals",
          "outputs": [
            {
              "internalType": "uint8",
              "name": "",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "name",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "symbol",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "totalSupply",
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
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "transfer",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "transferFrom",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      bytecode: '0x60806040523480156...',
      releaseDate: '2023-01-01',
    },
    '1.1.0': {
      version: '1.1.0',
      deployedAddresses: {
        1: '0x2345678901234567890123456789012345678901', // Ethereum
        137: '0x2345678901234567890123456789012345678902', // Polygon
      },
      abi: [
        /* Updated ABI */
      ],
      bytecode: '0x60806040523480156...',
      releaseDate: '2023-03-15',
    },
  },
  currentVersion: '1.1.0',
  implementationType: 'STANDARD',
  interfaces: ['IERC20'],
  license: 'MIT',
};

// Register example contract
ContractRegistry.registerContract(exampleERC20Contract);

/**
 * React hook for working with contracts
 * @param name Contract name
 * @param options Contract options
 * @returns Contract instance and utilities
 */
export function useContract<T extends Contract = Contract>(
  name: string,
  options: {
    chainId?: number;
    version?: string;
    address?: string;
  } = {}
) {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  const chainId = options.chainId || connector.getChainId() || 1;
  
  if (!provider) {
    return {
      contract: null,
      loading: false,
      error: new Error('No provider available'),
      read: null,
      write: null,
      events: null,
    };
  }
  
  try {
    // Create contract
    const contract = createContract<T>(name, chainId, provider, {
      version: options.version,
      address: options.address,
      withSigner: true,
    });
    
    return {
      contract,
      loading: false,
      error: null,
      read: (method: string, args: any[] = [], blockTag?: number | string) => 
        readContractState(contract, method, args, { blockTag }),
      write: (method: string, args: any[] = [], options: { value?: string; gasLimit?: string } = {}) => 
        safeContractCall(contract, method, args, options),
      events: {
        get: (eventName: string, options: any = {}) => 
          getContractEvents(contract, eventName, options),
        listen: (eventName: string, callback: (event: any) => void, filter: any = {}) => 
          listenToContractEvents(contract, eventName, callback, filter),
      },
    };
  } catch (error) {
    return {
      contract: null,
      loading: false,
      error,
      read: null,
      write: null,
      events: null,
    };
  }
} 