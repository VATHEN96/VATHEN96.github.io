/**
 * Transaction Tracker Utility
 * 
 * Advanced transaction tracking and monitoring for Web3 applications
 */

import { Web3Provider } from '@ethersproject/providers';
import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider';
import { getExplorerTxUrl } from './network-manager';

// Storage key for transactions
const TX_STORAGE_KEY = 'wowzarush_transactions';

// Transaction status
export enum TxStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  DROPPED = 'DROPPED',
  SPEED_UP = 'SPEED_UP',
  REPLACED = 'REPLACED',
}

// Transaction metadata
export interface TxMetadata {
  title: string;
  description?: string;
  type: string;
  asset?: string;
  amount?: string;
  counterparty?: string;
  contractAddress?: string;
  chainId: number;
  timestamp: number;
}

// Transaction data structure
export interface TrackedTransaction {
  hash: string;
  status: TxStatus;
  metadata: TxMetadata;
  createdAt: number;
  updatedAt: number;
  confirmedAt?: number;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  totalCost?: string;
  replacedBy?: string;
  error?: string;
  receipt?: TransactionReceipt;
  confirmations?: number;
  nonce?: number;
}

// Transaction storage
class TransactionStore {
  private transactions: Map<string, TrackedTransaction> = new Map();
  private initialized = false;

  /**
   * Initialize the transaction store
   */
  initialize(): void {
    if (this.initialized) return;
    
    try {
      const storedData = localStorage.getItem(TX_STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        Object.entries(parsed).forEach(([hash, tx]) => {
          this.transactions.set(hash, tx as TrackedTransaction);
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize transaction store:', error);
    }
  }

  /**
   * Save transactions to local storage
   */
  private save(): void {
    try {
      const data: Record<string, TrackedTransaction> = {};
      this.transactions.forEach((tx, hash) => {
        data[hash] = tx;
      });
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save transactions:', error);
    }
  }

  /**
   * Add or update a transaction
   * @param tx Transaction to add or update
   */
  set(tx: TrackedTransaction): void {
    this.transactions.set(tx.hash, tx);
    this.save();
  }

  /**
   * Get a transaction by hash
   * @param hash Transaction hash
   * @returns Transaction or undefined
   */
  get(hash: string): TrackedTransaction | undefined {
    return this.transactions.get(hash);
  }

  /**
   * Get all transactions
   * @returns All transactions
   */
  getAll(): TrackedTransaction[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Get all pending transactions
   * @returns Pending transactions
   */
  getPending(): TrackedTransaction[] {
    return this.getAll().filter(tx => tx.status === TxStatus.PENDING);
  }

  /**
   * Get recent transactions (last 7 days)
   * @param limit Maximum number of transactions to return
   * @returns Recent transactions
   */
  getRecent(limit = 10): TrackedTransaction[] {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.getAll()
      .filter(tx => tx.createdAt > sevenDaysAgo)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Update transaction status
   * @param hash Transaction hash
   * @param status New status
   * @param updates Additional updates
   */
  updateStatus(
    hash: string,
    status: TxStatus,
    updates: Partial<TrackedTransaction> = {}
  ): void {
    const tx = this.get(hash);
    if (!tx) return;

    const updatedTx = {
      ...tx,
      status,
      updatedAt: Date.now(),
      ...updates,
    };

    if (status === TxStatus.CONFIRMED && !updatedTx.confirmedAt) {
      updatedTx.confirmedAt = Date.now();
    }

    this.set(updatedTx);
  }

  /**
   * Mark transaction as replaced
   * @param oldHash Original transaction hash
   * @param newHash New transaction hash
   */
  replaceTransaction(oldHash: string, newHash: string): void {
    const oldTx = this.get(oldHash);
    if (!oldTx) return;

    // Update old transaction
    this.updateStatus(oldHash, TxStatus.REPLACED, { replacedBy: newHash });
    
    // Check if new transaction is already being tracked
    const newTx = this.get(newHash);
    if (!newTx) {
      // Create new transaction with the same metadata
      this.set({
        hash: newHash,
        status: TxStatus.PENDING,
        metadata: oldTx.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nonce: oldTx.nonce,
      });
    }
  }

  /**
   * Clear old transactions (older than 30 days)
   */
  clearOldTransactions(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let hasRemoved = false;

    this.transactions.forEach((tx, hash) => {
      if (tx.createdAt < thirtyDaysAgo) {
        this.transactions.delete(hash);
        hasRemoved = true;
      }
    });

    if (hasRemoved) {
      this.save();
    }
  }
}

// Transaction tracker
export default class TransactionTracker {
  private provider: Web3Provider;
  private store = new TransactionStore();
  private pollingInterval = 15000; // 15 seconds
  private maxConfirmations = 12;
  private listeners: Map<string, Set<(tx: TrackedTransaction) => void>> = new Map();
  private globalListeners: Set<(tx: TrackedTransaction) => void> = new Set();
  private pollingTimer: any = null;

  constructor(provider: Web3Provider) {
    this.provider = provider;
    this.store.initialize();
    this.startPolling();
  }

  /**
   * Start polling for transaction updates
   */
  private startPolling(): void {
    // Clear any existing polling
    this.stopPolling();
    
    // Start new polling
    this.pollingTimer = setInterval(() => this.checkPendingTransactions(), this.pollingInterval);
    
    // Clean up old transactions
    this.store.clearOldTransactions();
  }

  /**
   * Stop polling for transaction updates
   */
  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Check all pending transactions
   */
  private async checkPendingTransactions(): Promise<void> {
    const pendingTxs = this.store.getPending();
    if (pendingTxs.length === 0) return;

    await Promise.all(
      pendingTxs.map(tx => this.checkTransaction(tx.hash))
    );
  }

  /**
   * Check a single transaction
   * @param hash Transaction hash
   */
  private async checkTransaction(hash: string): Promise<void> {
    try {
      const tx = this.store.get(hash);
      if (!tx || tx.status !== TxStatus.PENDING) return;

      const receipt = await this.provider.getTransactionReceipt(hash);
      
      if (receipt) {
        // Transaction has been mined
        const confirmed = receipt.confirmations >= this.maxConfirmations;
        const success = receipt.status === 1;
        
        const updates: Partial<TrackedTransaction> = {
          receipt,
          confirmations: receipt.confirmations,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice.toString(),
          totalCost: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
        };
        
        if (confirmed) {
          this.store.updateStatus(
            hash,
            success ? TxStatus.CONFIRMED : TxStatus.FAILED,
            updates
          );
          
          // Notify listeners
          this.notifyListeners(hash);
        } else {
          // Update but keep as pending
          this.store.updateStatus(hash, TxStatus.PENDING, updates);
          
          // Notify listeners of updates
          this.notifyListeners(hash);
        }
      } else {
        // Check if transaction is still in the mempool
        try {
          const transaction = await this.provider.getTransaction(hash);
          if (!transaction) {
            // Transaction has been dropped
            const possibleReplacementTx = await this.findReplacementTransaction(tx);
            if (possibleReplacementTx) {
              // Transaction was replaced
              this.store.replaceTransaction(hash, possibleReplacementTx.hash);
              
              // Track the new transaction
              await this.trackTransaction(
                possibleReplacementTx,
                tx.metadata
              );
              
              // Notify listeners
              this.notifyListeners(hash);
            } else {
              // Transaction was dropped
              this.store.updateStatus(hash, TxStatus.DROPPED);
              
              // Notify listeners
              this.notifyListeners(hash);
            }
          }
        } catch (error) {
          console.warn(`Error checking transaction ${hash}:`, error);
          // We don't update the status here, will try again next poll
        }
      }
    } catch (error) {
      console.error(`Failed to check transaction ${hash}:`, error);
    }
  }

  /**
   * Find a replacement transaction with the same nonce
   * @param tx Original transaction
   * @returns Possible replacement transaction
   */
  private async findReplacementTransaction(
    tx: TrackedTransaction
  ): Promise<TransactionResponse | null> {
    if (!tx.nonce) return null;
    
    try {
      const address = await this.provider.getSigner().getAddress();
      const currentNonce = await this.provider.getTransactionCount(address, 'latest');
      
      // If the nonce is already used, look for a transaction that used it
      if (currentNonce > tx.nonce) {
        const blockNumber = await this.provider.getBlockNumber();
        
        // Check last 50 blocks for the replacement
        for (let i = 0; i < 50; i++) {
          const block = await this.provider.getBlockWithTransactions(blockNumber - i);
          
          for (const transaction of block.transactions) {
            if (
              transaction.from.toLowerCase() === address.toLowerCase() &&
              transaction.nonce === tx.nonce
            ) {
              return transaction;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error finding replacement transaction:', error);
    }
    
    return null;
  }

  /**
   * Track a transaction
   * @param txResponse Transaction response
   * @param metadata Transaction metadata
   * @returns Tracked transaction
   */
  async trackTransaction(
    txResponse: TransactionResponse,
    metadata: TxMetadata
  ): Promise<TrackedTransaction> {
    const now = Date.now();
    
    // Create tracked transaction
    const trackedTx: TrackedTransaction = {
      hash: txResponse.hash,
      status: TxStatus.PENDING,
      metadata: {
        ...metadata,
        timestamp: metadata.timestamp || now,
      },
      createdAt: now,
      updatedAt: now,
      nonce: txResponse.nonce,
    };
    
    // Save to store
    this.store.set(trackedTx);
    
    // Notify listeners
    this.notifyListeners(txResponse.hash);
    
    // Return the tracked transaction
    return trackedTx;
  }

  /**
   * Track a transaction from hash (for recovering tracking)
   * @param hash Transaction hash
   * @param metadata Transaction metadata
   * @returns Tracked transaction promise
   */
  async trackTransactionByHash(
    hash: string,
    metadata: TxMetadata
  ): Promise<TrackedTransaction> {
    // Check if already tracking
    const existing = this.store.get(hash);
    if (existing) return existing;
    
    try {
      // Get transaction details
      const txResponse = await this.provider.getTransaction(hash);
      if (!txResponse) {
        throw new Error(`Transaction ${hash} not found`);
      }
      
      return await this.trackTransaction(txResponse, metadata);
    } catch (error) {
      console.error(`Failed to track transaction ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Add transaction listener
   * @param hash Transaction hash
   * @param listener Listener function
   */
  addTransactionListener(
    hash: string,
    listener: (tx: TrackedTransaction) => void
  ): void {
    let txListeners = this.listeners.get(hash);
    if (!txListeners) {
      txListeners = new Set();
      this.listeners.set(hash, txListeners);
    }
    txListeners.add(listener);
  }

  /**
   * Remove transaction listener
   * @param hash Transaction hash
   * @param listener Listener function
   */
  removeTransactionListener(
    hash: string,
    listener: (tx: TrackedTransaction) => void
  ): void {
    const txListeners = this.listeners.get(hash);
    if (txListeners) {
      txListeners.delete(listener);
      if (txListeners.size === 0) {
        this.listeners.delete(hash);
      }
    }
  }

  /**
   * Add global transaction listener
   * @param listener Listener function
   */
  addGlobalListener(listener: (tx: TrackedTransaction) => void): void {
    this.globalListeners.add(listener);
  }

  /**
   * Remove global transaction listener
   * @param listener Listener function
   */
  removeGlobalListener(listener: (tx: TrackedTransaction) => void): void {
    this.globalListeners.delete(listener);
  }

  /**
   * Notify listeners of transaction update
   * @param hash Transaction hash
   */
  private notifyListeners(hash: string): void {
    const tx = this.store.get(hash);
    if (!tx) return;
    
    // Notify transaction-specific listeners
    const txListeners = this.listeners.get(hash);
    if (txListeners) {
      txListeners.forEach(listener => {
        try {
          listener(tx);
        } catch (error) {
          console.error(`Error in transaction listener for ${hash}:`, error);
        }
      });
    }
    
    // Notify global listeners
    this.globalListeners.forEach(listener => {
      try {
        listener(tx);
      } catch (error) {
        console.error(`Error in global transaction listener for ${hash}:`, error);
      }
    });
  }

  /**
   * Get a transaction
   * @param hash Transaction hash
   * @returns Transaction or undefined
   */
  getTransaction(hash: string): TrackedTransaction | undefined {
    return this.store.get(hash);
  }

  /**
   * Get all transactions
   * @returns All transactions
   */
  getAllTransactions(): TrackedTransaction[] {
    return this.store.getAll();
  }

  /**
   * Get recent transactions
   * @param limit Maximum number of transactions to return
   * @returns Recent transactions
   */
  getRecentTransactions(limit = 10): TrackedTransaction[] {
    return this.store.getRecent(limit);
  }

  /**
   * Get pending transactions
   * @returns Pending transactions
   */
  getPendingTransactions(): TrackedTransaction[] {
    return this.store.getPending();
  }

  /**
   * Get transaction URL for block explorer
   * @param hash Transaction hash
   * @returns URL string
   */
  getTransactionUrl(hash: string): string {
    const tx = this.store.get(hash);
    if (!tx) return '';
    
    return getExplorerTxUrl(hash, tx.metadata.chainId);
  }

  /**
   * Speed up a transaction
   * @param hash Transaction hash
   * @param gasMultiplier Gas price multiplier (e.g., 1.1 for 10% higher)
   * @returns New transaction hash
   */
  async speedUpTransaction(hash: string, gasMultiplier = 1.1): Promise<string> {
    const tx = this.store.get(hash);
    if (!tx) {
      throw new Error(`Transaction ${hash} not found`);
    }
    
    if (tx.status !== TxStatus.PENDING) {
      throw new Error(`Transaction ${hash} is not pending`);
    }
    
    try {
      const originalTx = await this.provider.getTransaction(hash);
      if (!originalTx) {
        throw new Error(`Original transaction ${hash} not found`);
      }
      
      // Prepare replacement transaction with higher gas price
      const signer = this.provider.getSigner();
      
      const newGasPrice = originalTx.gasPrice
        ? originalTx.gasPrice.mul(Math.floor(gasMultiplier * 100)).div(100)
        : undefined;
      
      const newMaxFeePerGas = originalTx.maxFeePerGas
        ? originalTx.maxFeePerGas.mul(Math.floor(gasMultiplier * 100)).div(100)
        : undefined;
      
      const newMaxPriorityFeePerGas = originalTx.maxPriorityFeePerGas
        ? originalTx.maxPriorityFeePerGas.mul(Math.floor(gasMultiplier * 100)).div(100)
        : undefined;
      
      // Create transaction with same parameters but higher gas price
      const speedUpTx = await signer.sendTransaction({
        to: originalTx.to,
        from: originalTx.from,
        nonce: originalTx.nonce,
        data: originalTx.data,
        value: originalTx.value,
        chainId: originalTx.chainId,
        type: originalTx.type,
        gasLimit: originalTx.gasLimit,
        gasPrice: newGasPrice,
        maxFeePerGas: newMaxFeePerGas,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      });
      
      // Mark original as replaced
      this.store.updateStatus(hash, TxStatus.SPEED_UP, { replacedBy: speedUpTx.hash });
      
      // Track new transaction
      await this.trackTransaction(
        speedUpTx,
        {
          ...tx.metadata,
          title: `Speed up: ${tx.metadata.title}`,
        }
      );
      
      // Notify listeners
      this.notifyListeners(hash);
      
      return speedUpTx.hash;
    } catch (error) {
      console.error(`Failed to speed up transaction ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a transaction
   * @param hash Transaction hash
   * @param gasMultiplier Gas price multiplier (e.g., 1.1 for 10% higher)
   * @returns New transaction hash
   */
  async cancelTransaction(hash: string, gasMultiplier = 1.1): Promise<string> {
    const tx = this.store.get(hash);
    if (!tx) {
      throw new Error(`Transaction ${hash} not found`);
    }
    
    if (tx.status !== TxStatus.PENDING) {
      throw new Error(`Transaction ${hash} is not pending`);
    }
    
    try {
      const originalTx = await this.provider.getTransaction(hash);
      if (!originalTx) {
        throw new Error(`Original transaction ${hash} not found`);
      }
      
      // Prepare cancellation transaction with higher gas price
      const signer = this.provider.getSigner();
      const sender = await signer.getAddress();
      
      const newGasPrice = originalTx.gasPrice
        ? originalTx.gasPrice.mul(Math.floor(gasMultiplier * 100)).div(100)
        : undefined;
      
      const newMaxFeePerGas = originalTx.maxFeePerGas
        ? originalTx.maxFeePerGas.mul(Math.floor(gasMultiplier * 100)).div(100)
        : undefined;
      
      const newMaxPriorityFeePerGas = originalTx.maxPriorityFeePerGas
        ? originalTx.maxPriorityFeePerGas.mul(Math.floor(gasMultiplier * 100)).div(100)
        : undefined;
      
      // Create transaction to self with 0 value but same nonce
      const cancelTx = await signer.sendTransaction({
        to: sender,
        from: sender,
        nonce: originalTx.nonce,
        value: 0,
        chainId: originalTx.chainId,
        type: originalTx.type,
        gasLimit: 21000, // Minimum gas for a transfer
        gasPrice: newGasPrice,
        maxFeePerGas: newMaxFeePerGas,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      });
      
      // Mark original as replaced
      this.store.updateStatus(hash, TxStatus.REPLACED, { replacedBy: cancelTx.hash });
      
      // Track cancellation transaction
      await this.trackTransaction(
        cancelTx,
        {
          ...tx.metadata,
          title: `Cancel: ${tx.metadata.title}`,
          type: 'cancel',
        }
      );
      
      // Notify listeners
      this.notifyListeners(hash);
      
      return cancelTx.hash;
    } catch (error) {
      console.error(`Failed to cancel transaction ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Format transaction status for display
   * @param status Transaction status
   * @returns Formatted status
   */
  static formatStatus(status: TxStatus): string {
    switch (status) {
      case TxStatus.PENDING:
        return 'Pending';
      case TxStatus.CONFIRMED:
        return 'Confirmed';
      case TxStatus.FAILED:
        return 'Failed';
      case TxStatus.DROPPED:
        return 'Dropped';
      case TxStatus.SPEED_UP:
        return 'Sped Up';
      case TxStatus.REPLACED:
        return 'Replaced';
      default:
        return status;
    }
  }

  /**
   * Format time difference for display
   * @param timestamp Timestamp
   * @returns Formatted time difference
   */
  static formatTimeDifference(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    
    // More than a day
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
}

// Singleton instance
let instance: TransactionTracker | null = null;

/**
 * Initialize transaction tracker
 * @param provider Web3 provider
 * @returns Transaction tracker instance
 */
export function initTransactionTracker(provider: Web3Provider): TransactionTracker {
  if (!instance) {
    instance = new TransactionTracker(provider);
  } else {
    // Update provider if it has changed
    instance = new TransactionTracker(provider);
  }
  
  return instance;
}

/**
 * Get transaction tracker instance
 * @returns Transaction tracker instance
 */
export function getTransactionTracker(): TransactionTracker {
  if (!instance) {
    throw new Error('Transaction tracker not initialized');
  }
  
  return instance;
}

/**
 * React hook for tracking a transaction
 * @param hash Transaction hash
 * @returns Transaction data and status
 */
export function useTransaction(hash: string | null): {
  transaction: TrackedTransaction | undefined;
  status: TxStatus | undefined;
  url: string;
  isPending: boolean;
  isConfirmed: boolean;
  isFailed: boolean;
} {
  if (!hash) {
    return {
      transaction: undefined,
      status: undefined,
      url: '',
      isPending: false,
      isConfirmed: false,
      isFailed: false,
    };
  }
  
  try {
    const tracker = getTransactionTracker();
    const tx = tracker.getTransaction(hash);
    
    return {
      transaction: tx,
      status: tx?.status,
      url: tracker.getTransactionUrl(hash),
      isPending: tx?.status === TxStatus.PENDING,
      isConfirmed: tx?.status === TxStatus.CONFIRMED,
      isFailed: 
        tx?.status === TxStatus.FAILED || 
        tx?.status === TxStatus.DROPPED,
    };
  } catch (error) {
    console.error('Error in useTransaction hook:', error);
    
    return {
      transaction: undefined,
      status: undefined,
      url: '',
      isPending: false,
      isConfirmed: false,
      isFailed: false,
    };
  }
} 