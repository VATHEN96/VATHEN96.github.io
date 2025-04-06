/**
 * Blockchain Connectivity Monitor
 * 
 * Monitors connectivity to blockchain networks and provides status information
 */

import { NetworkConfig } from './network-manager';
import { Web3Provider } from '@ethersproject/providers';

// Connection status types
export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  DEGRADED = 'DEGRADED',
  ERROR = 'ERROR',
}

// Network health metrics
export interface NetworkHealth {
  latency: number; // in ms
  blockHeight: number;
  lastBlockTime: number; // timestamp
  syncStatus: 'SYNCED' | 'SYNCING' | 'UNKNOWN';
  reliability: number; // 0-100%
  gasPrice: string;
  timeReference: number; // timestamp of when metrics were collected
}

// Connection monitoring options
export interface MonitoringOptions {
  pollingInterval?: number; // ms
  maxFailedAttempts?: number;
  pingTimeout?: number; // ms
  pingEndpoints?: string[];
  onStatusChange?: (status: ConnectionStatus, health?: NetworkHealth) => void;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

// Default monitoring options
const DEFAULT_OPTIONS: MonitoringOptions = {
  pollingInterval: 30000, // 30 seconds
  maxFailedAttempts: 3,
  pingTimeout: 5000, // 5 seconds
  logLevel: 'warn',
};

/**
 * Blockchain connectivity monitor
 */
export default class ConnectivityMonitor {
  private provider: Web3Provider;
  private network: NetworkConfig;
  private options: Required<MonitoringOptions>;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private health: NetworkHealth | null = null;
  private failedAttempts = 0;
  private lastBlock = 0;
  private lastBlockCheckTime = 0;
  private pollTimer: any = null;
  private listeners: Set<(status: ConnectionStatus, health?: NetworkHealth) => void> = new Set();
  private lastLatencies: number[] = [];
  private isRunning = false;
  private isOnline: boolean = true;

  /**
   * Create a new connectivity monitor
   * @param provider Web3 provider
   * @param network Network configuration
   * @param options Monitoring options
   */
  constructor(provider: Web3Provider, network: NetworkConfig, options: MonitoringOptions = {}) {
    this.provider = provider;
    this.network = network;
    
    // Apply default options
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      onStatusChange: options.onStatusChange || (() => {}),
    } as Required<MonitoringOptions>;
    
    // Add the default listener
    this.addStatusListener(this.options.onStatusChange);
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.log('info', `Starting connectivity monitor for ${this.network.displayName}`);
    
    // Set initial status
    this.updateStatus(ConnectionStatus.CONNECTING);
    
    // Perform initial check
    this.checkConnectivity();
    
    // Start polling
    this.pollTimer = setInterval(() => this.checkConnectivity(), this.options.pollingInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.log('info', `Stopping connectivity monitor for ${this.network.displayName}`);
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    
    this.updateStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Check connectivity to the blockchain network
   */
  private async checkConnectivity(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Try to get the current block number
      const blockNumber = await this.provider.getBlockNumber();
      
      // Measure latency
      const latency = Date.now() - startTime;
      this.lastLatencies.push(latency);
      
      // Keep only the last 10 latencies for averaging
      if (this.lastLatencies.length > 10) {
        this.lastLatencies.shift();
      }
      
      // Reset failed attempts counter
      this.failedAttempts = 0;
      
      // Get additional network health metrics
      const health = await this.collectHealthMetrics(blockNumber, latency);
      
      // Determine status based on health metrics
      let newStatus = ConnectionStatus.CONNECTED;
      
      if (latency > 2000 || health.reliability < 70) {
        newStatus = ConnectionStatus.DEGRADED;
      }
      
      // Update status and health metrics
      this.health = health;
      this.updateStatus(newStatus, health);
      
      this.log('debug', `Connectivity check successful: ${newStatus}`, health);
    } catch (error) {
      this.failedAttempts++;
      
      this.log('warn', `Connectivity check failed (attempt ${this.failedAttempts}/${this.options.maxFailedAttempts}):`, error);
      
      if (this.failedAttempts >= this.options.maxFailedAttempts) {
        this.updateStatus(ConnectionStatus.ERROR);
      } else if (this.status !== ConnectionStatus.DEGRADED) {
        this.updateStatus(ConnectionStatus.DEGRADED);
      }
    }
  }

  /**
   * Collect network health metrics
   * @param currentBlock Current block number
   * @param latency Network latency
   * @returns Network health metrics
   */
  private async collectHealthMetrics(currentBlock: number, latency: number): Promise<NetworkHealth> {
    const now = Date.now();
    let syncStatus: 'SYNCED' | 'SYNCING' | 'UNKNOWN' = 'UNKNOWN';
    let lastBlockTime = 0;
    let reliability = 100;
    
    try {
      // Try to get sync status
      const sync = await this.provider.send('eth_syncing', []);
      syncStatus = sync ? 'SYNCING' : 'SYNCED';
      
      // Get the latest block with timestamp
      const latestBlock = await this.provider.getBlock(currentBlock);
      
      if (latestBlock) {
        lastBlockTime = latestBlock.timestamp * 1000; // Convert to ms
        
        // If we have a previous block check, calculate block time reliability
        if (this.lastBlock > 0 && this.lastBlockCheckTime > 0) {
          const expectedBlocks = (now - this.lastBlockCheckTime) / 15000; // Assuming 15s block time
          const actualBlocks = currentBlock - this.lastBlock;
          
          reliability = Math.min(100, Math.max(0, (actualBlocks / expectedBlocks) * 100));
        }
      }
    } catch (error) {
      this.log('warn', 'Error collecting additional health metrics:', error);
    }
    
    // Update last checked values
    this.lastBlock = currentBlock;
    this.lastBlockCheckTime = now;
    
    // Get gas price
    let gasPrice = '0';
    try {
      const gasPriceResult = await this.provider.getGasPrice();
      gasPrice = gasPriceResult.toString();
    } catch (error) {
      this.log('warn', 'Error getting gas price:', error);
    }
    
    // Calculate average latency
    const avgLatency = this.lastLatencies.reduce((sum, lat) => sum + lat, 0) / this.lastLatencies.length;
    
    return {
      latency: Math.round(avgLatency),
      blockHeight: currentBlock,
      lastBlockTime,
      syncStatus,
      reliability: Math.round(reliability),
      gasPrice,
      timeReference: now,
    };
  }

  /**
   * Update connection status and notify listeners
   * @param status New connection status
   * @param health Network health metrics
   */
  private updateStatus(status: ConnectionStatus, health?: NetworkHealth): void {
    // Only notify if the status has changed
    if (status !== this.status || health) {
      this.status = status;
      
      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(status, health || this.health || undefined);
        } catch (error) {
          this.log('error', 'Error in status listener:', error);
        }
      });
    }
  }

  /**
   * Add a status change listener
   * @param listener Status change listener function
   */
  addStatusListener(listener: (status: ConnectionStatus, health?: NetworkHealth) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a status change listener
   * @param listener Status change listener function
   */
  removeStatusListener(listener: (status: ConnectionStatus, health?: NetworkHealth) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Get current connection status
   * @returns Current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get latest network health metrics
   * @returns Network health metrics or null if not available
   */
  getNetworkHealth(): NetworkHealth | null {
    return this.health;
  }

  /**
   * Format network health as a human-readable status
   * @returns Status summary
   */
  getStatusSummary(): {
    status: ConnectionStatus;
    statusText: string;
    latency: string;
    blocksBehind: number;
    lastBlockAge: string;
    reliability: string;
  } {
    const statusText = this.getStatusText();
    const latency = this.health ? `${this.health.latency}ms` : 'Unknown';
    
    let blocksBehind = 0;
    let lastBlockAge = 'Unknown';
    let reliability = 'Unknown';
    
    if (this.health) {
      // Calculate how long since the last block
      const secondsSinceLastBlock = this.health.lastBlockTime 
        ? Math.floor((Date.now() - this.health.lastBlockTime) / 1000)
        : 0;
      
      // Format the block age
      if (secondsSinceLastBlock < 60) {
        lastBlockAge = `${secondsSinceLastBlock}s ago`;
      } else if (secondsSinceLastBlock < 3600) {
        lastBlockAge = `${Math.floor(secondsSinceLastBlock / 60)}m ago`;
      } else {
        lastBlockAge = `${Math.floor(secondsSinceLastBlock / 3600)}h ago`;
      }
      
      // Estimate blocks behind if applicable
      if (secondsSinceLastBlock > 15) { // Assuming 15s block time
        blocksBehind = Math.floor(secondsSinceLastBlock / 15);
      }
      
      // Format reliability
      reliability = `${this.health.reliability}%`;
    }
    
    return {
      status: this.status,
      statusText,
      latency,
      blocksBehind,
      lastBlockAge,
      reliability,
    };
  }

  /**
   * Get human-readable status text
   * @returns Status text
   */
  private getStatusText(): string {
    switch (this.status) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.CONNECTING:
        return 'Connecting';
      case ConnectionStatus.DISCONNECTED:
        return 'Disconnected';
      case ConnectionStatus.DEGRADED:
        return 'Degraded Performance';
      case ConnectionStatus.ERROR:
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  }

  /**
   * Log a message based on log level
   * @param level Log level
   * @param message Message
   * @param data Additional data
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      none: 4,
    };
    
    if (levels[level] >= levels[this.options.logLevel]) {
      const prefix = `[ConnectivityMonitor:${this.network.name}]`;
      
      switch (level) {
        case 'debug':
          console.debug(prefix, message, data || '');
          break;
        case 'info':
          console.info(prefix, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, message, data || '');
          break;
        case 'error':
          console.error(prefix, message, data || '');
          break;
      }
    }
  }
}

// Map of active monitors by chain ID
const activeMonitors: Record<number, ConnectivityMonitor> = {};

/**
 * Initialize a connectivity monitor for a network
 * @param provider Web3 provider
 * @param network Network configuration
 * @param options Monitoring options
 * @returns Connectivity monitor instance
 */
export function initConnectivityMonitor(
  provider: Web3Provider,
  network: NetworkConfig,
  options: MonitoringOptions = {}
): ConnectivityMonitor {
  if (activeMonitors[network.chainId]) {
    // Stop existing monitor
    activeMonitors[network.chainId].stop();
  }
  
  // Create new monitor
  const monitor = new ConnectivityMonitor(provider, network, options);
  
  // Store in active monitors map
  activeMonitors[network.chainId] = monitor;
  
  // Start monitoring
  monitor.start();
  
  return monitor;
}

/**
 * Get an active connectivity monitor for a chain ID
 * @param chainId Chain ID
 * @returns Connectivity monitor instance or undefined if not found
 */
export function getConnectivityMonitor(chainId: number): ConnectivityMonitor | undefined {
  return activeMonitors[chainId];
}

/**
 * React hook for monitoring connection status
 * @param chainId Chain ID
 * @returns Connection status and health
 */
export function useConnectionStatus(chainId: number): {
  status: ConnectionStatus;
  health: NetworkHealth | null;
  summary: ReturnType<ConnectivityMonitor['getStatusSummary']> | null;
} {
  const monitor = getConnectivityMonitor(chainId);
  
  if (!monitor) {
    return {
      status: ConnectionStatus.DISCONNECTED,
      health: null,
      summary: null,
    };
  }
  
  return {
    status: monitor.getStatus(),
    health: monitor.getNetworkHealth(),
    summary: monitor.getStatusSummary(),
  };
} 