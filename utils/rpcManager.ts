import { ethers } from 'ethers';

class RPCManager {
  private endpoints: string[] = [
    'https://rpc.testnet.telos.net',   // Primary endpoint - latest official RPC URL
    'https://testnet.telos.net/evm',
    'https://telos-testnet.rpc.thirdweb.com',
    'https://telos-evm-testnet.rpc.ambitio.us',
    'https://testnet.telos.caleos.io/evm',
    'https://testnet.telos.goodblock.io/evm',
    'https://api.testnet.telos.kitchen/evm'
  ];
  
  // Provider cache to avoid repeated instantiation
  private providerCache: Map<string, ethers.providers.JsonRpcProvider> = new Map();
  
  // Track endpoints that have failed recently to deprioritize them
  private failedEndpoints: Map<string, { failCount: number, lastFailed: number }> = new Map();
  
  // Track the last successful health check time for each endpoint
  private endpointHealth: Map<string, { lastSuccess: number, responseTime: number }> = new Map();
  
  constructor() {
    // Try to restore last known working endpoint from localStorage
    if (typeof window !== 'undefined') {
      try {
        const lastWorking = localStorage.getItem('last_working_rpc_endpoint');
        
        if (lastWorking && !this.endpoints.includes(lastWorking)) {
          // If we have a working endpoint that's not in our list, add it to the front
          this.endpoints.unshift(lastWorking);
        } else if (lastWorking) {
          // Move last working endpoint to the front of the list
          this.endpoints = this.endpoints.filter(ep => ep !== lastWorking);
          this.endpoints.unshift(lastWorking);
        }
        
        // Also try to restore health data
        const healthData = localStorage.getItem('rpc_endpoints_health');
        if (healthData) {
          try {
            this.endpointHealth = new Map(JSON.parse(healthData));
          } catch (e) {
            console.warn('Failed to parse saved RPC health data', e);
          }
        }
      } catch (e) {
        console.warn('Error accessing localStorage for RPC endpoint history', e);
      }
    }
    
    // Start health check loop in background
    if (typeof window !== 'undefined') {
      // Don't run health checks immediately, wait a bit for app to stabilize
      setTimeout(() => this.startHealthChecks(), 5000);
    }
  }
  
  /**
   * Perform periodic health checks on all endpoints
   */
  private startHealthChecks() {
    const healthCheck = async () => {
      // Don't run health checks if the page is not visible
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      
      console.log('Running RPC endpoint health checks...');
      
      for (const endpoint of this.endpoints) {
        this.checkEndpointHealth(endpoint).catch(e => {
          console.warn(`Health check failed for ${endpoint}:`, e);
        });
      }
      
      // Save health data to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rpc_endpoints_health', JSON.stringify(Array.from(this.endpointHealth.entries())));
        } catch (e) {
          console.warn('Failed to save RPC health data', e);
        }
      }
    };
    
    // Run health checks periodically
    healthCheck();
    setInterval(healthCheck, 5 * 60 * 1000); // Every 5 minutes
  }
  
  /**
   * Check health of a specific endpoint
   */
  private async checkEndpointHealth(endpoint: string): Promise<boolean> {
    const provider = new ethers.providers.JsonRpcProvider(endpoint);
    
    try {
      const startTime = Date.now();
      // Get current block is a good health check
      const blockNum = await provider.getBlockNumber();
      const responseTime = Date.now() - startTime;
      
      // Update health data
      this.endpointHealth.set(endpoint, {
        lastSuccess: Date.now(),
        responseTime
      });
      
      console.log(`RPC endpoint ${endpoint} is healthy (block ${blockNum}, response time ${responseTime}ms)`);
      return true;
    } catch (e) {
      console.warn(`RPC endpoint ${endpoint} health check failed:`, e);
      
      // Update failure count
      const failRecord = this.failedEndpoints.get(endpoint) || { failCount: 0, lastFailed: 0 };
      this.failedEndpoints.set(endpoint, {
        failCount: failRecord.failCount + 1,
        lastFailed: Date.now()
      });
      
      return false;
    }
  }
  
  /**
   * Sort endpoints by health data
   */
  private getHealthSortedEndpoints(): string[] {
    return [...this.endpoints].sort((a, b) => {
      // First factor: Recent failures (most important)
      const aFailRecord = this.failedEndpoints.get(a);
      const bFailRecord = this.failedEndpoints.get(b);
      
      // If one has failed recently and the other hasn't, prioritize the one without recent failure
      const aRecentFail = aFailRecord && (Date.now() - aFailRecord.lastFailed < 5 * 60 * 1000);
      const bRecentFail = bFailRecord && (Date.now() - bFailRecord.lastFailed < 5 * 60 * 1000);
      
      if (aRecentFail && !bRecentFail) return 1;
      if (!aRecentFail && bRecentFail) return -1;
      
      // Second factor: Failure count
      const aFailCount = aFailRecord?.failCount || 0;
      const bFailCount = bFailRecord?.failCount || 0;
      
      if (aFailCount !== bFailCount) {
        return aFailCount - bFailCount;
      }
      
      // Third factor: Response time from health checks
      const aHealth = this.endpointHealth.get(a);
      const bHealth = this.endpointHealth.get(b);
      
      // If we have health data for both, compare response times
      if (aHealth && bHealth) {
        return aHealth.responseTime - bHealth.responseTime;
      }
      
      // If we only have health data for one, prioritize that one
      if (aHealth) return -1;
      if (bHealth) return 1;
      
      // Default to original order
      return this.endpoints.indexOf(a) - this.endpoints.indexOf(b);
    });
  }
  
  /**
   * Get a reliable provider with automatic fallback and retry logic
   */
  async getProvider(): Promise<ethers.providers.JsonRpcProvider> {
    console.log('Getting reliable RPC provider...');
    
    // Use health-sorted endpoints
    const sortedEndpoints = this.getHealthSortedEndpoints();
    console.log('Prioritized endpoints:', sortedEndpoints);
    
    // Try each endpoint until one works
    let lastError: Error | null = null;
    let errorDetails: string[] = [];
    
    for (const endpoint of sortedEndpoints) {
      try {
        // Check if this endpoint has failed too many times recently
        const failRecord = this.failedEndpoints.get(endpoint);
        if (failRecord && failRecord.failCount > 5) {
          const timeSinceFail = Date.now() - failRecord.lastFailed;
          
          // If it's been less than 5 minutes since last failure and it's failed multiple times,
          // skip this endpoint unless we're running out of options
          if (timeSinceFail < 5 * 60 * 1000 && sortedEndpoints.length > 1) {
            console.log(`Skipping frequently failing endpoint: ${endpoint}`);
            continue;
          }
        }
        
        // Get or create provider for this endpoint
        let provider: ethers.providers.JsonRpcProvider;
        
        if (this.providerCache.has(endpoint)) {
          provider = this.providerCache.get(endpoint)!;
          
          // Check if the cached provider is still working
          try {
            // Use getNetwork as a quick check - if it's not working this will throw
            await provider.getNetwork();
          } catch (e) {
            console.warn(`Cached provider for ${endpoint} is no longer working, creating new instance`);
            // If the cached provider is no longer working, create a new one
            provider = new ethers.providers.JsonRpcProvider(endpoint);
            this.providerCache.set(endpoint, provider);
          }
        } else {
          provider = new ethers.providers.JsonRpcProvider(endpoint);
          this.providerCache.set(endpoint, provider);
        }
        
        // Test the provider with a timeout
        const startTime = Date.now();
        
        try {
          const networkPromise = provider.getNetwork();
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Connection to ${endpoint} timed out`)), 5000)
          );
          
          await Promise.race([networkPromise, timeoutPromise]);
          
          const responseTime = Date.now() - startTime;
          console.log(`Connected to RPC endpoint: ${endpoint} (response time: ${responseTime}ms)`);
          
          // Update health data
          this.endpointHealth.set(endpoint, {
            lastSuccess: Date.now(),
            responseTime
          });
          
          // Save this as the last working endpoint
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('last_working_rpc_endpoint', endpoint);
              // Also save updated health data
              localStorage.setItem('rpc_endpoints_health', 
                JSON.stringify(Array.from(this.endpointHealth.entries()))
              );
            } catch (e) {
              console.warn('Error saving RPC endpoint data', e);
            }
          }
          
          // Reset the fail count for this endpoint
          if (this.failedEndpoints.has(endpoint)) {
            this.failedEndpoints.set(endpoint, { failCount: 0, lastFailed: 0 });
          }
          
          return provider;
        } catch (timeoutError) {
          // Specific handling for timeout errors
          console.warn(`Timeout connecting to RPC endpoint ${endpoint}:`, timeoutError);
          lastError = timeoutError as Error;
          errorDetails.push(`${endpoint}: Timeout after 5000ms`);
          
          // Remove from cache if it timed out
          this.providerCache.delete(endpoint);
          
          // Record this failure
          const failRecord = this.failedEndpoints.get(endpoint) || { failCount: 0, lastFailed: 0 };
          this.failedEndpoints.set(endpoint, {
            failCount: failRecord.failCount + 1,
            lastFailed: Date.now()
          });
        }
      } catch (error) {
        console.warn(`Failed to connect to RPC endpoint ${endpoint}:`, error);
        lastError = error as Error;
        errorDetails.push(`${endpoint}: ${(error as Error).message}`);
        
        // Record this failure
        const failRecord = this.failedEndpoints.get(endpoint) || { failCount: 0, lastFailed: 0 };
        this.failedEndpoints.set(endpoint, {
          failCount: failRecord.failCount + 1,
          lastFailed: Date.now()
        });
        
        // If this provider was cached, remove it so we create a fresh one next time
        if (this.providerCache.has(endpoint)) {
          this.providerCache.delete(endpoint);
        }
        
        // Add exponential backoff delay based on fail count
        const delay = Math.min(2 ** (failRecord.failCount) * 100, 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All endpoints failed, provide detailed error message
    const errorMessage = `Failed to connect to any RPC endpoint:\n${errorDetails.join('\n')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  /**
   * Clear the provider cache to force fresh connections
   */
  clearCache(): void {
    this.providerCache.clear();
    console.log('RPC provider cache cleared');
  }
  
  /**
   * Get health metrics for all endpoints
   */
  getEndpointMetrics(): { 
    endpoint: string; 
    healthy: boolean; 
    lastSuccess?: number; 
    responseTime?: number; 
    failCount: number;
    lastFailed?: number;
  }[] {
    return this.endpoints.map(endpoint => {
      const health = this.endpointHealth.get(endpoint);
      const failures = this.failedEndpoints.get(endpoint);
      
      return {
        endpoint,
        healthy: !!(health && Date.now() - health.lastSuccess < 10 * 60 * 1000),
        lastSuccess: health?.lastSuccess,
        responseTime: health?.responseTime,
        failCount: failures?.failCount || 0,
        lastFailed: failures?.lastFailed
      };
    });
  }
}

// Create a singleton instance
const rpcManager = new RPCManager();
export default rpcManager; 