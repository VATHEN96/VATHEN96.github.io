# Frontend Integration Guide for Upgradeable Contracts

This document outlines how to properly integrate the React frontend with the WowzaRush upgradeable smart contracts.

## Overview

When working with upgradeable contracts, the frontend needs to interact with the proxy contract address while using the ABI of the implementation contract. This approach allows the contract logic to change while keeping the interaction point (proxy address) stable.

## Basic Setup

### 1. Contract ABIs Configuration

Store the contract ABIs and addresses in a configuration file:

```typescript
// src/config/contracts.ts
export const CONTRACT_ADDRESSES = {
  PROXY: "0x...", // Proxy contract address - stays the same after upgrades
  TOKEN: "0x..."  // Token contract address
};

// Import the latest implementation ABI (not the proxy ABI)
import WowzaRushABI from '../abis/WowzaRushV1.json';
import WowzaRushTokenABI from '../abis/WowzaRushToken.json';

export const CONTRACT_ABIS = {
  WOWZARUSH: WowzaRushABI,
  TOKEN: WowzaRushTokenABI
};
```

### 2. Contract Interaction Hook

Create a custom hook for interacting with the upgradeable contracts:

```typescript
// src/hooks/useWowzaRushContract.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/contracts';
import { useWeb3Provider } from './useWeb3Provider';

export function useWowzaRushContract() {
  const { provider, account } = useWeb3Provider();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  
  useEffect(() => {
    if (!provider || !account) return;
    
    // Connect to the proxy address using the implementation ABI
    const wowzaRushContract = new ethers.Contract(
      CONTRACT_ADDRESSES.PROXY,
      CONTRACT_ABIS.WOWZARUSH,
      provider.getSigner()
    );
    
    const tokenContract = new ethers.Contract(
      CONTRACT_ADDRESSES.TOKEN,
      CONTRACT_ABIS.TOKEN,
      provider.getSigner()
    );
    
    setContract(wowzaRushContract);
    setTokenContract(tokenContract);
  }, [provider, account]);
  
  const createCampaign = useCallback(async (
    title: string, 
    description: string, 
    goal: string,
    deadline: number,
    milestones: any[]
  ) => {
    if (!contract) return null;
    
    try {
      const tx = await contract.createCampaign(
        title,
        description,
        ethers.utils.parseEther(goal),
        deadline,
        milestones.map(m => ({
          title: m.title,
          description: m.description,
          amount: ethers.utils.parseEther(m.amount)
        }))
      );
      
      return await tx.wait();
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error;
    }
  }, [contract]);
  
  // Additional contract methods...
  
  return {
    contract,
    tokenContract,
    createCampaign,
    // Other methods...
  };
}
```

## Handling Contract Upgrades

When the contract is upgraded, you only need to update the ABI import in your configuration:

```typescript
// Before upgrade
import WowzaRushABI from '../abis/WowzaRushV1.json';

// After upgrade to V2
import WowzaRushABI from '../abis/WowzaRushV2.json';
```

The proxy address remains the same, ensuring a seamless experience for users.

## Detecting New Features

V2 contracts may introduce new functions. Create version-specific hooks that include these new features:

```typescript
// src/hooks/useWowzaRushV2Features.ts
import { useCallback } from 'react';
import { useWowzaRushContract } from './useWowzaRushContract';

export function useWowzaRushV2Features() {
  const { contract } = useWowzaRushContract();
  
  const isPlatformPaused = useCallback(async () => {
    if (!contract) return false;
    
    try {
      // This function only exists in V2
      return await contract.isPaused();
    } catch (error) {
      // If the function doesn't exist, we're still on V1
      console.error("Error checking pause status - possibly still on V1:", error);
      return false;
    }
  }, [contract]);
  
  const subscribeToPremiumFeatures = useCallback(async () => {
    if (!contract) return null;
    
    try {
      // V2-specific function
      const tx = await contract.subscribeToPremiumFeatures();
      return await tx.wait();
    } catch (error) {
      console.error("Error subscribing to premium features:", error);
      throw error;
    }
  }, [contract]);
  
  return {
    isPlatformPaused,
    subscribeToPremiumFeatures,
    // Other V2-specific functions...
  };
}
```

## Feature Detection Pattern

Implement a feature detection pattern to gracefully handle different contract versions:

```typescript
// src/utils/contractVersionDetector.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';

export async function detectContractVersion(provider: ethers.providers.Web3Provider) {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.PROXY,
    [
      // Minimal ABI with just the functions we need to detect version
      'function version() view returns (string)',
      'function isPaused() view returns (bool)'
    ],
    provider
  );
  
  try {
    // Try to call V2-specific function
    await contract.isPaused();
    return 'v2';
  } catch {
    try {
      // Try to get version (might be available in both)
      const version = await contract.version();
      return version;
    } catch {
      // Fallback to assuming V1
      return 'v1';
    }
  }
}
```

## UI Components for V2 Features

Create conditional UI components that only appear when V2 features are available:

```tsx
// src/components/PremiumFeatures.tsx
import React, { useState, useEffect } from 'react';
import { useWowzaRushV2Features } from '../hooks/useWowzaRushV2Features';
import { detectContractVersion } from '../utils/contractVersionDetector';
import { useWeb3Provider } from '../hooks/useWeb3Provider';

export function PremiumFeaturesSection() {
  const { provider } = useWeb3Provider();
  const [isV2Available, setIsV2Available] = useState(false);
  const { subscribeToPremiumFeatures } = useWowzaRushV2Features();
  
  useEffect(() => {
    if (!provider) return;
    
    async function checkVersion() {
      const version = await detectContractVersion(provider);
      setIsV2Available(version === 'v2');
    }
    
    checkVersion();
  }, [provider]);
  
  if (!isV2Available) {
    return null; // Don't render this component if V2 is not available
  }
  
  return (
    <div className="premium-features">
      <h3>Premium Features</h3>
      <p>Subscribe to access advanced platform capabilities</p>
      <button 
        onClick={subscribeToPremiumFeatures}
        className="button primary"
      >
        Subscribe Now
      </button>
    </div>
  );
}
```

## Error Handling for Upgrades

Implement proper error handling to detect when a contract upgrade might be in progress:

```typescript
// src/utils/contractErrorHandler.ts
export function handleContractError(error: any) {
  // Check for delegate call errors which might indicate upgrade in progress
  if (error?.message?.includes('execution reverted') || 
      error?.message?.includes('delegate call failed')) {
    return {
      type: 'UPGRADE_IN_PROGRESS',
      message: 'The platform may be undergoing an upgrade. Please try again in a few minutes.'
    };
  }
  
  // Regular contract errors
  return {
    type: 'CONTRACT_ERROR',
    message: error?.message || 'An unknown error occurred'
  };
}
```

## Monitoring Contract Upgrades

Create a service to monitor for upgrade events:

```typescript
// src/services/upgradeMonitor.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';

const UPGRADE_EVENT_SIGNATURE = ethers.utils.id('Upgraded(address)');

export function setupUpgradeListener(provider: ethers.providers.Web3Provider, callback: () => void) {
  const filter = {
    address: CONTRACT_ADDRESSES.PROXY,
    topics: [UPGRADE_EVENT_SIGNATURE]
  };
  
  provider.on(filter, (log) => {
    console.log('Contract upgrade detected!');
    // Refresh ABIs, clear cache, etc.
    callback();
  });
  
  return () => {
    provider.off(filter);
  };
}
```

## Testing Integration

Create tests to verify frontend integration with both V1 and V2 contracts:

```typescript
// Example Jest test for contract integration
test('Should handle different contract versions', async () => {
  // Mock provider with different contract responses
  const mockProviderV1 = {
    // V1 mocks
  };
  
  const mockProviderV2 = {
    // V2 mocks that include newer functions
  };
  
  // Test V1 integration
  // ...
  
  // Test V2 integration with new features
  // ...
});
```

## Conclusion

By following these patterns, your frontend application can handle contract upgrades seamlessly:

1. Always interact with the proxy address
2. Use the latest implementation ABI
3. Implement feature detection for graceful degradation
4. Add version-specific UI components conditionally
5. Monitor for upgrade events to refresh the application state

This approach ensures users experience no disruption when the platform contracts are upgraded, while developers can continue adding new features to the frontend that leverage the latest contract capabilities. 