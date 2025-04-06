/**
 * Wallet Connector
 *
 * Comprehensive wallet connection and management system for Web3 applications
 * Integrates with all other utilities for a complete solution
 */

import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { NETWORKS, NetworkConfig, getNetworkByChainId, switchNetwork } from './network-manager';
import { initTransactionTracker, getTransactionTracker, TxMetadata, TrackedTransaction } from './tx-tracker';
import { Web3ErrorType, identifyWeb3Error, formatErrorForUser, retryWeb3Operation } from './error-handler';
import { ConnectionStatus, initConnectivityMonitor } from './connectivity-monitor';
import { getOptimalGasSettings, getTelosGasSettings, GasPriceLevel } from './gas-optimizer';
import * as storage from './web3-storage';
import { measurePerformance } from './performance';

// Supported wallet types
export enum WalletType {
  METAMASK = 'METAMASK',
  WALLET_CONNECT = 'WALLET_CONNECT',
  COINBASE = 'COINBASE',
  BRAVE = 'BRAVE',
  INJECTED = 'INJECTED', // Generic injected wallet
  READ_ONLY = 'READ_ONLY' // Read-only mode (no wallet)
}

// Connection state
export interface ConnectionState {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  walletType: WalletType | null;
  address: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  networkName: string | null;
  shortAddress: string | null;
  balance: string | null;
  error: Error | null;
}

// Initial connection state
const initialConnectionState: ConnectionState = {
  status: 'disconnected',
  walletType: null,
  address: null,
  chainId: null,
  isCorrectNetwork: false,
  networkName: null,
  shortAddress: null,
  balance: null,
  error: null,
};

// Wallet connection options
export interface ConnectionOptions {
  preferredChainId?: number;
  requiredChainId?: number;
  rpcUrl?: string;
  autoConnect?: boolean;
  pollInterval?: number;
  localStorageKey?: string;
  onAccountsChanged?: (accounts: string[]) => void;
  onChainChanged?: (chainId: number) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

// Default connection options
const defaultConnectionOptions: ConnectionOptions = {
  preferredChainId: 1, // Default to Ethereum mainnet
  autoConnect: true,
  pollInterval: 10000, // 10 seconds
  localStorageKey: 'walletconnection',
};

/**
 * Wallet Connection Manager
 */
export default class WalletConnector {
  private provider: Web3Provider | null = null;
  private signer: JsonRpcSigner | null = null;
  private options: Required<ConnectionOptions>;
  private state: ConnectionState = { ...initialConnectionState };
  private networkConfig: NetworkConfig | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private supportedWallets: WalletType[] = [];
  private lastBalance: BigNumber | null = null;
  private listeners: Set<(state: ConnectionState) => void> = new Set();
  private initialized = false;
  private walletConnectProvider: any = null; // WalletConnect provider instance

  constructor(options: ConnectionOptions = {}) {
    // Merge options with defaults
    this.options = {
      ...defaultConnectionOptions,
      ...options,
    } as Required<ConnectionOptions>;

    // Detect supported wallets
    this.detectSupportedWallets();
  }

  /**
   * Initialize wallet connector
   */
  async initialize(): Promise<ConnectionState> {
    if (this.initialized) return this.state;

    this.initialized = true;
    
    // Initialize storage
    await storage.initStorage();

    // Check for saved connection
    if (this.options.autoConnect) {
      try {
        await this.autoConnect();
      } catch (error) {
        console.warn('Failed to auto-connect wallet:', error);
      }
    }

    return this.state;
  }

  /**
   * Auto-connect to previously connected wallet
   */
  private async autoConnect(): Promise<void> {
    // Check localStorage for saved connection
    const savedConnection = this.getSavedConnection();
    if (!savedConnection) return;

    try {
      // Try to connect with saved wallet type
      if (savedConnection.walletType === WalletType.METAMASK || savedConnection.walletType === WalletType.INJECTED) {
        if (window.ethereum) {
          await this.connectToInjected();
        }
      } else if (savedConnection.walletType === WalletType.WALLET_CONNECT) {
        await this.connectToWalletConnect();
      } else if (savedConnection.walletType === WalletType.COINBASE) {
        await this.connectToCoinbase();
      }
    } catch (error) {
      console.warn('Auto-connect failed:', error);
      this.clearSavedConnection();
    }
  }

  /**
   * Detect supported wallet types
   */
  private detectSupportedWallets(): void {
    // Always support read-only mode
    this.supportedWallets = [WalletType.READ_ONLY];

    // Check for injected Ethereum provider
    if (window.ethereum) {
      // Check for MetaMask
      if (window.ethereum.isMetaMask) {
        this.supportedWallets.push(WalletType.METAMASK);
      }

      // Check for Brave wallet
      if (window.ethereum.isBraveWallet) {
        this.supportedWallets.push(WalletType.BRAVE);
      }

      // Generic injected provider
      if (!this.supportedWallets.includes(WalletType.METAMASK) && !this.supportedWallets.includes(WalletType.BRAVE)) {
        this.supportedWallets.push(WalletType.INJECTED);
      }
    }

    // WalletConnect and Coinbase are assumed to be available via import
    this.supportedWallets.push(WalletType.WALLET_CONNECT);
    this.supportedWallets.push(WalletType.COINBASE);
  }

  /**
   * Get supported wallet types
   * @returns List of supported wallet types
   */
  getSupportedWallets(): WalletType[] {
    return [...this.supportedWallets];
  }

  /**
   * Connect to a wallet
   * @param walletType Wallet type to connect to
   * @returns Connection state
   */
  async connect(walletType: WalletType): Promise<ConnectionState> {
    try {
      // Update state to connecting
      this.updateState({
        status: 'connecting',
        walletType,
        error: null,
      });

      // Connect to the specified wallet
      switch (walletType) {
        case WalletType.METAMASK:
        case WalletType.BRAVE:
        case WalletType.INJECTED:
          await this.connectToInjected();
          break;

        case WalletType.WALLET_CONNECT:
          await this.connectToWalletConnect();
          break;

        case WalletType.COINBASE:
          await this.connectToCoinbase();
          break;

        case WalletType.READ_ONLY:
          await this.connectToReadOnly();
          break;

        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      // Save the connection if successful
      this.saveConnection();

      // Start polling for updates
      this.startPolling();

      return this.state;
    } catch (error: any) {
      const web3Error = identifyWeb3Error(error);
      
      this.updateState({
        status: 'error',
        error: new Error(web3Error.message),
      });

      // Notify error handler
      if (this.options.onError) {
        this.options.onError(error);
      }

      throw error;
    }
  }

  /**
   * Connect to an injected wallet (MetaMask, Brave, etc.)
   */
  private async connectToInjected(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No injected Ethereum provider found');
    }

    try {
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }

      // Create provider and signer
      this.provider = new Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();

      // Get network information
      const network = await this.provider.getNetwork();
      const chainId = network.chainId;

      // Determine wallet type
      let walletType = WalletType.INJECTED;
      if (window.ethereum.isMetaMask) walletType = WalletType.METAMASK;
      if (window.ethereum.isBraveWallet) walletType = WalletType.BRAVE;

      // Check if on correct network
      const isCorrectNetwork = this.options.requiredChainId ? chainId === this.options.requiredChainId : true;
      
      // Get network configuration
      this.networkConfig = getNetworkByChainId(chainId) || null;
      const networkName = this.networkConfig?.displayName || `Chain ID ${chainId}`;

      // Format address
      const address = accounts[0];
      const shortAddress = this.formatShortAddress(address);

      // Get balance
      const balance = await this.provider.getBalance(address);
      const formattedBalance = this.formatBalance(balance);

      // Update state
      this.updateState({
        status: 'connected',
        walletType,
        address,
        chainId,
        isCorrectNetwork,
        networkName,
        shortAddress,
        balance: formattedBalance,
        error: null,
      });

      // Initialize transaction tracker
      if (this.provider) {
        initTransactionTracker(this.provider);
      }

      // Initialize connectivity monitor
      if (this.provider && this.networkConfig) {
        initConnectivityMonitor(this.provider, this.networkConfig);
      }

      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      // Clean up if connection fails
      this.provider = null;
      this.signer = null;
      throw error;
    }
  }

  /**
   * Connect to WalletConnect
   * Note: This requires the WalletConnect package to be installed
   */
  private async connectToWalletConnect(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const { WalletConnectProvider } = await import('@walletconnect/web3-provider');

      // Create WalletConnect Provider
      this.walletConnectProvider = new WalletConnectProvider({
        rpc: Object.values(NETWORKS).reduce((acc, network) => {
          // Use the first RPC URL for each network
          if (network.rpcUrls.length > 0) {
            acc[network.chainId] = network.rpcUrls[0];
          }
          return acc;
        }, {} as Record<number, string>),
        chainId: this.options.preferredChainId,
      });

      // Enable session (triggers QR Code modal)
      await this.walletConnectProvider.enable();

      // Create ethers provider
      this.provider = new Web3Provider(this.walletConnectProvider);
      this.signer = this.provider.getSigner();

      // Get account
      const accounts = await this.provider.listAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from WalletConnect');
      }

      // Get network information
      const network = await this.provider.getNetwork();
      const chainId = network.chainId;

      // Check if on correct network
      const isCorrectNetwork = this.options.requiredChainId ? chainId === this.options.requiredChainId : true;
      
      // Get network configuration
      this.networkConfig = getNetworkByChainId(chainId) || null;
      const networkName = this.networkConfig?.displayName || `Chain ID ${chainId}`;

      // Format address
      const address = accounts[0];
      const shortAddress = this.formatShortAddress(address);

      // Get balance
      const balance = await this.provider.getBalance(address);
      const formattedBalance = this.formatBalance(balance);

      // Update state
      this.updateState({
        status: 'connected',
        walletType: WalletType.WALLET_CONNECT,
        address,
        chainId,
        isCorrectNetwork,
        networkName,
        shortAddress,
        balance: formattedBalance,
        error: null,
      });

      // Initialize transaction tracker
      if (this.provider) {
        initTransactionTracker(this.provider);
      }

      // Initialize connectivity monitor
      if (this.provider && this.networkConfig) {
        initConnectivityMonitor(this.provider, this.networkConfig);
      }

      // Set up WalletConnect event listeners
      this.walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else if (accounts[0] !== this.state.address) {
          this.updateOnAccountChange(accounts[0]);
        }
      });

      this.walletConnectProvider.on('chainChanged', (chainId: number) => {
        this.updateOnChainChange(chainId);
      });

      this.walletConnectProvider.on('disconnect', () => {
        this.disconnect();
      });

    } catch (error) {
      // Clean up if connection fails
      this.provider = null;
      this.signer = null;
      this.walletConnectProvider = null;
      throw error;
    }
  }

  /**
   * Connect to Coinbase Wallet
   * Note: This requires the Coinbase Wallet SDK to be installed
   */
  private async connectToCoinbase(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const CoinbaseWalletSDK = (await import('@coinbase/wallet-sdk')).default;

      // Initialize Coinbase Wallet SDK
      const coinbaseWallet = new CoinbaseWalletSDK({
        appName: document.title || 'Web3 App',
        appLogoUrl: '', // Add your app logo URL here
        darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
      });

      // Create Ethereum provider
      const coinbaseProvider = coinbaseWallet.makeWeb3Provider(
        this.options.rpcUrl || NETWORKS.ETHEREUM.rpcUrls[0],
        this.options.preferredChainId || 1
      );

      // Request accounts
      await coinbaseProvider.request({ method: 'eth_requestAccounts' });

      // Create ethers provider
      this.provider = new Web3Provider(coinbaseProvider);
      this.signer = this.provider.getSigner();

      // Get account
      const accounts = await this.provider.listAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from Coinbase Wallet');
      }

      // Get network information
      const network = await this.provider.getNetwork();
      const chainId = network.chainId;

      // Check if on correct network
      const isCorrectNetwork = this.options.requiredChainId ? chainId === this.options.requiredChainId : true;
      
      // Get network configuration
      this.networkConfig = getNetworkByChainId(chainId) || null;
      const networkName = this.networkConfig?.displayName || `Chain ID ${chainId}`;

      // Format address
      const address = accounts[0];
      const shortAddress = this.formatShortAddress(address);

      // Get balance
      const balance = await this.provider.getBalance(address);
      const formattedBalance = this.formatBalance(balance);

      // Update state
      this.updateState({
        status: 'connected',
        walletType: WalletType.COINBASE,
        address,
        chainId,
        isCorrectNetwork,
        networkName,
        shortAddress,
        balance: formattedBalance,
        error: null,
      });

      // Initialize transaction tracker
      if (this.provider) {
        initTransactionTracker(this.provider);
      }

      // Initialize connectivity monitor
      if (this.provider && this.networkConfig) {
        initConnectivityMonitor(this.provider, this.networkConfig);
      }

      // Set up Coinbase event listeners
      coinbaseProvider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else if (accounts[0] !== this.state.address) {
          this.updateOnAccountChange(accounts[0]);
        }
      });

      coinbaseProvider.on('chainChanged', (chainId: string) => {
        this.updateOnChainChange(parseInt(chainId, 16));
      });

      coinbaseProvider.on('disconnect', () => {
        this.disconnect();
      });

    } catch (error) {
      // Clean up if connection fails
      this.provider = null;
      this.signer = null;
      throw error;
    }
  }

  /**
   * Connect in read-only mode (no wallet)
   * Uses a custom provider with the specified RPC URL
   */
  private async connectToReadOnly(): Promise<void> {
    try {
      // Import JsonRpcProvider
      const { JsonRpcProvider } = await import('@ethersproject/providers');

      // Get RPC URL for the preferred chain
      const preferredChainId = this.options.preferredChainId || 1;
      const network = getNetworkByChainId(preferredChainId);

      if (!network) {
        throw new Error(`Network with chain ID ${preferredChainId} not found`);
      }

      // Use the configured RPC URL or the first one from the network
      const rpcUrl = this.options.rpcUrl || network.rpcUrls[0];
      
      // Create JSON RPC provider
      this.provider = new JsonRpcProvider(rpcUrl, preferredChainId);
      this.signer = null; // No signer in read-only mode

      // Get network information (to confirm)
      const connectedNetwork = await this.provider.getNetwork();
      const chainId = connectedNetwork.chainId;

      // Get network configuration
      this.networkConfig = getNetworkByChainId(chainId) || null;
      const networkName = this.networkConfig?.displayName || `Chain ID ${chainId}`;

      // Update state for read-only mode
      this.updateState({
        status: 'connected',
        walletType: WalletType.READ_ONLY,
        address: null, // No address in read-only mode
        chainId,
        isCorrectNetwork: true, // Always true since we specify the network
        networkName,
        shortAddress: null, // No address in read-only mode
        balance: null, // No balance in read-only mode
        error: null,
      });

      // Initialize connectivity monitor for read-only mode
      if (this.provider && this.networkConfig) {
        initConnectivityMonitor(this.provider, this.networkConfig);
      }

    } catch (error) {
      // Clean up if connection fails
      this.provider = null;
      this.signer = null;
      throw error;
    }
  }

  /**
   * Set up event listeners for the provider
   */
  private setupEventListeners(): void {
    if (!window.ethereum) return;

    // Listen for accounts changed
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        this.disconnect();
      } else if (accounts[0] !== this.state.address) {
        // Account changed
        this.updateOnAccountChange(accounts[0]);
      }
    });

    // Listen for chain changed
    window.ethereum.on('chainChanged', (chainId: string) => {
      // Chain ID is returned as a hex string
      this.updateOnChainChange(parseInt(chainId, 16));
    });

    // Listen for disconnect
    window.ethereum.on('disconnect', () => {
      this.disconnect();
    });
  }

  /**
   * Update state when the account changes
   * @param newAddress New wallet address
   */
  private async updateOnAccountChange(newAddress: string): Promise<void> {
    if (!this.provider) return;

    try {
      // Get new balance
      const balance = await this.provider.getBalance(newAddress);
      const formattedBalance = this.formatBalance(balance);

      // Update state
      this.updateState({
        address: newAddress,
        shortAddress: this.formatShortAddress(newAddress),
        balance: formattedBalance,
      });

      // Notify callback
      if (this.options.onAccountsChanged) {
        this.options.onAccountsChanged([newAddress]);
      }

      // Update signer
      this.signer = this.provider.getSigner();
    } catch (error) {
      console.error('Error updating on account change:', error);
    }
  }

  /**
   * Update state when the chain changes
   * @param newChainId New chain ID
   */
  private async updateOnChainChange(newChainId: number): Promise<void> {
    if (!this.provider) return;

    try {
      // Get network configuration
      this.networkConfig = getNetworkByChainId(newChainId) || null;
      const networkName = this.networkConfig?.displayName || `Chain ID ${newChainId}`;

      // Check if on correct network
      const isCorrectNetwork = this.options.requiredChainId ? newChainId === this.options.requiredChainId : true;

      // Update balance for the new chain
      let formattedBalance = null;
      if (this.state.address) {
        const balance = await this.provider.getBalance(this.state.address);
        formattedBalance = this.formatBalance(balance);
      }

      // Update state
      this.updateState({
        chainId: newChainId,
        isCorrectNetwork,
        networkName,
        balance: formattedBalance,
      });

      // Notify callback
      if (this.options.onChainChanged) {
        this.options.onChainChanged(newChainId);
      }

      // Reinitialize connectivity monitor for the new chain
      if (this.provider && this.networkConfig) {
        initConnectivityMonitor(this.provider, this.networkConfig);
      }
    } catch (error) {
      console.error('Error updating on chain change:', error);
    }
  }

  /**
   * Disconnect the wallet
   */
  async disconnect(): Promise<void> {
    // Stop polling
    this.stopPolling();

    // Close WalletConnect session if active
    if (this.walletConnectProvider && this.walletConnectProvider.close) {
      await this.walletConnectProvider.close();
      this.walletConnectProvider = null;
    }

    // Clear saved connection
    this.clearSavedConnection();

    // Reset state
    this.updateState({ ...initialConnectionState });

    // Clear provider and signer
    this.provider = null;
    this.signer = null;
    this.networkConfig = null;

    // Notify callback
    if (this.options.onDisconnect) {
      this.options.onDisconnect();
    }
  }

  /**
   * Get the current connection state
   * @returns Connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Get the provider instance
   * @returns Web3 provider or null if not connected
   */
  getProvider(): Web3Provider | null {
    return this.provider;
  }

  /**
   * Get the signer instance
   * @returns Signer or null if not connected or in read-only mode
   */
  getSigner(): JsonRpcSigner | null {
    return this.signer;
  }

  /**
   * Check if the wallet is connected
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.state.status === 'connected';
  }

  /**
   * Check if a wallet is connected in read-only mode
   * @returns True if in read-only mode
   */
  isReadOnly(): boolean {
    return this.state.status === 'connected' && this.state.walletType === WalletType.READ_ONLY;
  }

  /**
   * Check if wallet is on the correct network
   * @returns True if on correct network
   */
  isOnCorrectNetwork(): boolean {
    return this.state.isCorrectNetwork;
  }

  /**
   * Get the current chain ID
   * @returns Chain ID or null if not connected
   */
  getChainId(): number | null {
    return this.state.chainId;
  }

  /**
   * Get the current wallet address
   * @returns Wallet address or null if not connected
   */
  getAddress(): string | null {
    return this.state.address;
  }

  /**
   * Switch to a different network
   * @param chainId Chain ID to switch to
   * @returns True if successful
   */
  async switchToNetwork(chainId: number): Promise<boolean> {
    if (!this.provider || !this.state.address) {
      throw new Error('Wallet not connected');
    }

    if (this.state.walletType === WalletType.READ_ONLY) {
      throw new Error('Cannot switch networks in read-only mode');
    }

    // Use the network manager to switch networks
    const success = await switchNetwork(chainId);
    
    // Update will happen via chainChanged event listener
    return success;
  }

  /**
   * Add a state change listener
   * @param listener Function to call when state changes
   */
  addStateListener(listener: (state: ConnectionState) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a state change listener
   * @param listener Function to remove
   */
  removeStateListener(listener: (state: ConnectionState) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Send a transaction with optimal gas settings and tracking
   * @param tx Transaction request object
   * @param metadata Transaction metadata for tracking
   * @returns Transaction response with hash and tracking info
   */
  async sendTransaction(
    tx: {
      to: string;
      value?: BigNumber | string;
      data?: string;
      gasLimit?: BigNumber | string;
    },
    metadata: Omit<TxMetadata, 'chainId' | 'timestamp'>
  ): Promise<{
    hash: string;
    transaction: TrackedTransaction;
  }> {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet not connected');
    }

    if (this.state.walletType === WalletType.READ_ONLY) {
      throw new Error('Cannot send transactions in read-only mode');
    }

    // Ensure we're on the correct network if required
    if (this.options.requiredChainId && this.state.chainId !== this.options.requiredChainId) {
      await this.switchToNetwork(this.options.requiredChainId);
    }

    // Ensure we have a transaction tracker
    const txTracker = getTransactionTracker();

    // Performance measurement
    return await measurePerformance(async () => {
      try {
        // Get optimal gas settings (this will automatically use Telos-specific settings if on Telos)
        const gasSettings = await getOptimalGasSettings(this.provider, GasPriceLevel.STANDARD);
        
        // Check if we're on Telos network (chainId 41 for testnet, 40 for mainnet)
        const network = await this.provider.getNetwork();
        if (network.chainId === 41 || network.chainId === 40) {
          // For Telos transactions, always use our dedicated function for consistent gas settings
          // This ensures we override any network-provided gas price with our fixed value
          const telosGasSettings = getTelosGasSettings();
          // Use all settings from telosGasSettings to ensure consistency
          gasSettings.gasPrice = telosGasSettings.gasPrice;
          // Use the gas limit from telosGasSettings
          gasSettings.gasLimit = telosGasSettings.gasLimit || ethers.utils.hexlify(8000000);
          
          console.log('Using Telos gas settings:', 
            'Gas Price:', gasSettings.gasPrice.toString(), 'wei',
            'Gas Limit:', ethers.utils.formatUnits(gasSettings.gasLimit, 0));
          
          // Verify the gas price is within acceptable range for Telos
          if (gasSettings.gasPrice.lt(BigNumber.from('50000')) || gasSettings.gasPrice.gt(BigNumber.from('200000'))) {
            console.warn('Gas price for Telos may be out of optimal range:', gasSettings.gasPrice.toString(), 'wei');
            console.log('Using configured Telos gas price from getTelosGasSettings()');
          }
          
          // Add nonce management for Telos transactions to prevent transaction failures
          try {
            const address = await this.signer.getAddress();
            const nonce = await this.provider.getTransactionCount(address, 'latest');
            gasSettings.nonce = nonce;
            console.log('Setting explicit nonce for Telos transaction:', nonce);
          } catch (error) {
            console.warn('Failed to set nonce for Telos transaction:', error);
          }
        }

        // Create transaction object
        const txRequest = {
          to: tx.to,
          value: tx.value || 0,
          data: tx.data || '0x',
          ...gasSettings, // Add gas settings
        };

        // Add gas limit if provided
        if (tx.gasLimit) {
          txRequest.gasLimit = tx.gasLimit;
        }

        // Send transaction
        const txResponse = await this.signer!.sendTransaction(txRequest);

        // Track the transaction
        const trackedTx = await txTracker.trackTransaction(txResponse, {
          ...metadata,
          chainId: this.state.chainId!,
          timestamp: Date.now(),
        });

        return {
          hash: txResponse.hash,
          transaction: trackedTx,
        };
      } catch (error) {
        // Convert to Web3Error for better error handling
        const web3Error = identifyWeb3Error(error);
        console.error('Transaction error:', web3Error);
        throw error;
      }
    }, 'sendTransaction');
  }

  /**
   * Retry a failed transaction with adjusted gas settings
   * @param hash Hash of the failed transaction
   * @param gasMultiplier Multiplier for gas price
   * @returns New transaction hash
   */
  async retryTransaction(hash: string, gasMultiplier = 1.5): Promise<string> {
    // Get transaction tracker
    const txTracker = getTransactionTracker();

    // Get the transaction
    const tx = txTracker.getTransaction(hash);
    if (!tx) {
      throw new Error(`Transaction ${hash} not found`);
    }

    // Speed up transaction
    return await txTracker.speedUpTransaction(hash, gasMultiplier);
  }

  /**
   * Get a formatted balance string
   * @param balance Balance in wei
   * @returns Formatted balance string (e.g., "1.23 ETH")
   */
  private formatBalance(balance: BigNumber): string {
    // Cache the balance
    this.lastBalance = balance;

    // Convert to ETH (18 decimals)
    const eth = parseFloat(balance.toString()) / 1e18;

    // Format based on value
    if (eth < 0.001) {
      return `< 0.001 ETH`;
    } else if (eth < 1) {
      return `${eth.toFixed(3)} ETH`;
    } else {
      return `${eth.toFixed(2)} ETH`;
    }
  }

  /**
   * Format address to short form
   * @param address Ethereum address
   * @returns Shortened address (e.g., "0x1234...5678")
   */
  private formatShortAddress(address: string): string {
    try {
      // Ensure it's a valid address and checksummed
      const checksummed = getAddress(address);
      return `${checksummed.substring(0, 6)}...${checksummed.substring(checksummed.length - 4)}`;
    } catch (error) {
      return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }
  }

  /**
   * Start polling for updates
   */
  private startPolling(): void {
    // Clear any existing poll timer
    this.stopPolling();

    // Set up new poll timer
    this.pollTimer = setInterval(() => this.pollForUpdates(), this.options.pollInterval);
  }

  /**
   * Stop polling for updates
   */
  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Poll for updates to balance and network status
   */
  private async pollForUpdates(): Promise<void> {
    if (!this.provider || !this.state.address || this.state.status !== 'connected') {
      return;
    }

    try {
      // Check balance
      const balance = await this.provider.getBalance(this.state.address);
      
      // Only update if balance has changed
      if (!this.lastBalance || !balance.eq(this.lastBalance)) {
        this.updateState({
          balance: this.formatBalance(balance),
        });
      }
    } catch (error) {
      console.warn('Error polling for updates:', error);
    }
  }

  /**
   * Update connection state and notify listeners
   * @param stateUpdates Partial state updates
   */
  private updateState(stateUpdates: Partial<ConnectionState>): void {
    // Update state
    this.state = {
      ...this.state,
      ...stateUpdates,
    };

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Save connection state to localStorage
   */
  private saveConnection(): void {
    if (!this.state.walletType || this.state.walletType === WalletType.READ_ONLY) {
      return;
    }

    try {
      const savedData = {
        walletType: this.state.walletType,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.options.localStorageKey, JSON.stringify(savedData));
    } catch (error) {
      console.warn('Failed to save connection:', error);
    }
  }

  /**
   * Get saved connection from localStorage
   * @returns Saved connection data or null
   */
  private getSavedConnection(): { walletType: WalletType; timestamp: number } | null {
    try {
      const savedData = localStorage.getItem(this.options.localStorageKey);
      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);
      
      // Check if data is stale (older than 1 day)
      if (parsedData.timestamp && Date.now() - parsedData.timestamp > 24 * 60 * 60 * 1000) {
        this.clearSavedConnection();
        return null;
      }

      return parsedData;
    } catch (error) {
      console.warn('Failed to get saved connection:', error);
      return null;
    }
  }

  /**
   * Clear saved connection from localStorage
   */
  private clearSavedConnection(): void {
    try {
      localStorage.removeItem(this.options.localStorageKey);
    } catch (error) {
      console.warn('Failed to clear saved connection:', error);
    }
  }
}

// Singleton instance for easy access
let instance: WalletConnector | null = null;

/**
 * Initialize and get the wallet connector instance
 * @param options Connection options
 * @returns Wallet connector instance
 */
export function initWalletConnector(options: ConnectionOptions = {}): WalletConnector {
  if (!instance) {
    instance = new WalletConnector(options);
  }
  return instance;
}

/**
 * Get the wallet connector instance
 * @returns Wallet connector instance
 * @throws Error if not initialized
 */
export function getWalletConnector(): WalletConnector {
  if (!instance) {
    throw new Error('Wallet connector not initialized. Call initWalletConnector first.');
  }
  return instance;
}

/**
 * React hook for connection state
 * @returns Connection state and methods
 */
export function useWalletConnection(): {
  state: ConnectionState;
  connect: (walletType: WalletType) => Promise<ConnectionState>;
  disconnect: () => Promise<void>;
  sendTransaction: WalletConnector['sendTransaction'];
  switchNetwork: (chainId: number) => Promise<boolean>;
  isConnected: () => boolean;
  isReadOnly: () => boolean;
  isOnCorrectNetwork: () => boolean;
  getSupportedWallets: () => WalletType[];
} {
  const connector = getWalletConnector();
  
  return {
    state: connector.getState(),
    connect: (walletType) => connector.connect(walletType),
    disconnect: () => connector.disconnect(),
    sendTransaction: (tx, metadata) => connector.sendTransaction(tx, metadata),
    switchNetwork: (chainId) => connector.switchToNetwork(chainId),
    isConnected: () => connector.isConnected(),
    isReadOnly: () => connector.isReadOnly(),
    isOnCorrectNetwork: () => connector.isOnCorrectNetwork(),
    getSupportedWallets: () => connector.getSupportedWallets(),
  };
}