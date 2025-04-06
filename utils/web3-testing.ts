/**
 * Web3 Testing Utilities
 * 
 * Helper functions to test blockchain interactions without using real networks
 */

import { ethers } from 'ethers';

/**
 * Create a mock Ethereum provider for testing
 * @returns Mock provider instance
 */
export function createMockProvider() {
  // Create a random account for ganache
  const privateKey = ethers.Wallet.createRandom().privateKey;
  const mockProvider = new ethers.providers.JsonRpcProvider();
  const wallet = new ethers.Wallet(privateKey, mockProvider);
  
  return { provider: mockProvider, wallet };
}

/**
 * Mock transaction response
 * @returns Mock transaction response and wait function
 */
export function mockTransactionResponse(
  overrides: Partial<ethers.providers.TransactionResponse> = {}
): ethers.providers.TransactionResponse {
  const txResponse = {
    hash: '0x' + '1'.repeat(64),
    confirmations: 0,
    from: '0x' + '2'.repeat(40),
    wait: jest.fn(() => Promise.resolve({
      status: 1,
      events: [],
      logs: [],
      blockNumber: 123456,
      confirmations: 1,
      cumulativeGasUsed: ethers.BigNumber.from(100000),
      gasUsed: ethers.BigNumber.from(50000),
      contractAddress: null,
      to: '0x' + '3'.repeat(40),
      transactionIndex: 0,
      ...overrides
    })),
    nonce: 1,
    gasLimit: ethers.BigNumber.from(100000),
    gasPrice: ethers.BigNumber.from(20000000000),
    data: '0x',
    value: ethers.BigNumber.from(0),
    chainId: 1,
    blockHash: null,
    blockNumber: null,
    timestamp: Date.now(),
    creates: null,
    accessList: null,
    type: 0,
    ...overrides
  } as unknown as ethers.providers.TransactionResponse;
  
  return txResponse;
}

/**
 * Create mock contract for testing
 * @param abi Contract ABI
 * @param overrides Function overrides
 * @returns Mock contract
 */
export function createMockContract(
  abi: any[],
  overrides: Record<string, Function> = {}
) {
  const mockContract = {
    address: '0x' + '1'.repeat(40),
    interface: new ethers.utils.Interface(abi),
    signer: {
      getAddress: () => Promise.resolve('0x' + '2'.repeat(40))
    },
    callStatic: {},
    estimateGas: {},
    functions: {},
    populateTransaction: {},
    filters: {},
    ...overrides
  };
  
  // Create mock functions from ABI
  abi.forEach(item => {
    if (item.type === 'function') {
      const name = item.name;
      if (!overrides[name]) {
        mockContract[name] = jest.fn(() => {
          const isView = item.stateMutability === 'view' || item.stateMutability === 'pure';
          if (isView) {
            // For view functions, return a simple value based on output type
            return Promise.resolve(getMockReturnValue(item.outputs));
          } else {
            // For non-view functions, return a transaction response
            return Promise.resolve(mockTransactionResponse());
          }
        });
      }
      
      // Add to callStatic
      if (!mockContract.callStatic[name]) {
        mockContract.callStatic[name] = jest.fn(() => {
          return Promise.resolve(getMockReturnValue(item.outputs));
        });
      }
      
      // Add to estimateGas
      if (!mockContract.estimateGas[name]) {
        mockContract.estimateGas[name] = jest.fn(() => {
          return Promise.resolve(ethers.BigNumber.from(100000));
        });
      }
      
      // Add to populateTransaction
      if (!mockContract.populateTransaction[name]) {
        mockContract.populateTransaction[name] = jest.fn(() => {
          return Promise.resolve({
            to: mockContract.address,
            data: '0x',
            value: ethers.BigNumber.from(0)
          });
        });
      }
    }
  });
  
  return mockContract;
}

/**
 * Get mock return value based on output types
 * @param outputs ABI outputs
 * @returns Mocked return value
 */
function getMockReturnValue(outputs: any[] = []) {
  if (!outputs || outputs.length === 0) {
    return null;
  }
  
  if (outputs.length === 1) {
    return getMockValueForType(outputs[0].type);
  }
  
  // Return array for multiple outputs
  return outputs.map(output => getMockValueForType(output.type));
}

/**
 * Get mock value for a solidity type
 * @param type Solidity type
 * @returns Mocked value
 */
function getMockValueForType(type: string) {
  if (type.includes('uint')) {
    return ethers.BigNumber.from(1000);
  }
  
  if (type.includes('int')) {
    return ethers.BigNumber.from(1000);
  }
  
  if (type.includes('bool')) {
    return true;
  }
  
  if (type.includes('address')) {
    return '0x' + '1'.repeat(40);
  }
  
  if (type.includes('string')) {
    return 'mock-string';
  }
  
  if (type.includes('byte')) {
    return '0x1234';
  }
  
  if (type.includes('[]')) {
    // Array type
    const baseType = type.replace('[]', '');
    return [getMockValueForType(baseType)];
  }
  
  return null;
}

/**
 * Create a mock wallet for testing
 */
export function createMockWallet() {
  const privateKey = ethers.Wallet.createRandom().privateKey;
  const address = ethers.Wallet.createRandom().address;
  
  return {
    address,
    privateKey,
    signMessage: jest.fn((message: string) => {
      return Promise.resolve('0x1234567890');
    }),
    signTransaction: jest.fn((tx: any) => {
      return Promise.resolve('0x1234567890');
    }),
    connect: jest.fn(() => {
      return createMockWallet();
    })
  };
}

/**
 * Create mock blockchain data for testing
 */
export function createMockBlockchainData() {
  return {
    // Mock campaign data
    campaigns: Array(5).fill(null).map((_, index) => ({
      id: `campaign-${index}`,
      title: `Campaign ${index}`,
      description: `Description for campaign ${index}`,
      creator: {
        address: '0x' + (index + 1).toString().padStart(40, '0'),
        displayName: `Creator ${index}`,
      },
      currentAmount: ethers.utils.parseEther((Math.random() * 10).toFixed(2)),
      goalAmount: ethers.utils.parseEther('10'),
      status: index % 2 === 0 ? 'active' : 'completed',
      backers: Math.floor(Math.random() * 100),
      createdAt: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
      milestones: Array(3).fill(null).map((_, mIndex) => ({
        id: `milestone-${index}-${mIndex}`,
        title: `Milestone ${mIndex + 1}`,
        description: `Description for milestone ${mIndex + 1}`,
        amount: ethers.utils.parseEther((2 + mIndex).toString()),
        completed: mIndex === 0,
        approved: mIndex === 0,
      })),
    })),
    
    // Mock user profiles
    profiles: Array(10).fill(null).map((_, index) => ({
      address: '0x' + (index + 1).toString().padStart(40, '0'),
      displayName: `User ${index}`,
      bio: `Bio for user ${index}`,
      profileImageUrl: `https://example.com/avatar/${index}.png`,
      stats: {
        campaignsCreated: Math.floor(Math.random() * 5),
        successfulCampaigns: Math.floor(Math.random() * 3),
        totalFundsRaised: (Math.random() * 20).toFixed(2),
        followers: Math.floor(Math.random() * 100),
        following: Math.floor(Math.random() * 50),
      },
      verificationLevel: Math.floor(Math.random() * 3),
    })),
  };
} 