import { ethers } from 'ethers';
import { createMockProvider, createMockContract } from '../utils/web3-testing';
import { Page } from 'playwright';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExternalProvider } from '@ethersproject/providers';

// =============================================================================
// SMART CONTRACT TESTING
// =============================================================================

/**
 * Contract Testing Environment
 */
export interface ContractTestEnvironment {
  provider: ethers.providers.JsonRpcProvider;
  deployer: ethers.Wallet;
  users: ethers.Wallet[];
  contracts: Record<string, ethers.Contract>;
  mockERC20: (name: string, symbol: string, decimals: number) => Promise<ethers.Contract>;
  mockERC721: (name: string, symbol: string) => Promise<ethers.Contract>;
  resetNetwork: () => Promise<void>;
}

/**
 * Setup testing environment for smart contracts
 * @param contractsToSetup Array of contract setup params
 * @returns Contract test environment
 */
export async function setupContractTestEnvironment(
  contractsToSetup: {
    name: string;
    artifact: any;
    args?: any[];
  }[] = []
): Promise<ContractTestEnvironment> {
  // Create provider and wallets
  const { provider, wallet: deployer } = createMockProvider();
  
  // Create user wallets
  const users: ethers.Wallet[] = Array.from({ length: 10 }, (_, i) => {
    const privateKey = ethers.utils.randomBytes(32);
    const wallet = new ethers.Wallet(privateKey, provider);
    return wallet;
  });
  
  // Fund wallets
  for (const user of users) {
    await deployer.sendTransaction({
      to: user.address,
      value: ethers.utils.parseEther('100')
    });
  }
  
  // Deploy contracts
  const contracts: Record<string, ethers.Contract> = {};
  
  for (const { name, artifact, args = [] } of contractsToSetup) {
    const contractFactory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      deployer
    );
    
    const contract = await contractFactory.deploy(...args);
    await contract.deployed();
    
    contracts[name] = contract;
  }
  
  /**
   * Create a mock ERC20 token
   */
  const mockERC20 = async (name: string, symbol: string, decimals: number): Promise<ethers.Contract> => {
    const MockERC20 = {
      abi: [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)',
        'function transfer(address to, uint amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint amount) returns (bool)',
        'function transferFrom(address from, address to, uint amount) returns (bool)',
        'event Transfer(address indexed from, address indexed to, uint amount)',
        'event Approval(address indexed owner, address indexed spender, uint amount)',
        'function mint(address to, uint amount)',
      ],
      bytecode: '0x...' // In a real implementation, this would be the bytecode
    };
    
    const contractFactory = new ethers.ContractFactory(
      MockERC20.abi,
      MockERC20.bytecode,
      deployer
    );
    
    const contract = await contractFactory.deploy(name, symbol, decimals);
    await contract.deployed();
    
    return contract;
  };
  
  /**
   * Create a mock ERC721 token
   */
  const mockERC721 = async (name: string, symbol: string): Promise<ethers.Contract> => {
    const MockERC721 = {
      abi: [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function tokenURI(uint256 tokenId) view returns (string)',
        'function balanceOf(address owner) view returns (uint256)',
        'function ownerOf(uint256 tokenId) view returns (address)',
        'function safeTransferFrom(address from, address to, uint256 tokenId)',
        'function transferFrom(address from, address to, uint256 tokenId)',
        'function approve(address to, uint256 tokenId)',
        'function getApproved(uint256 tokenId) view returns (address)',
        'function setApprovalForAll(address operator, bool approved)',
        'function isApprovedForAll(address owner, address operator) view returns (bool)',
        'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
        'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
        'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
        'function mint(address to, uint256 tokenId)',
      ],
      bytecode: '0x...' // In a real implementation, this would be the bytecode
    };
    
    const contractFactory = new ethers.ContractFactory(
      MockERC721.abi,
      MockERC721.bytecode,
      deployer
    );
    
    const contract = await contractFactory.deploy(name, symbol);
    await contract.deployed();
    
    return contract;
  };
  
  /**
   * Reset the network to a clean state
   */
  const resetNetwork = async (): Promise<void> => {
    await provider.send('evm_revert', [await provider.send('evm_snapshot', [])]);
  };
  
  return {
    provider,
    deployer,
    users,
    contracts,
    mockERC20,
    mockERC721,
    resetNetwork
  };
}

/**
 * Execute time-based operations
 */
export const timeOperations = {
  /**
   * Increase time by a number of seconds
   * @param provider Provider
   * @param seconds Seconds to increase
   */
  async increaseTime(provider: ethers.providers.JsonRpcProvider, seconds: number): Promise<void> {
    await provider.send('evm_increaseTime', [seconds]);
    await provider.send('evm_mine', []);
  },
  
  /**
   * Move to a specific block timestamp
   * @param provider Provider
   * @param timestamp Timestamp to move to
   */
  async setNextBlockTimestamp(provider: ethers.providers.JsonRpcProvider, timestamp: number): Promise<void> {
    await provider.send('evm_setNextBlockTimestamp', [timestamp]);
    await provider.send('evm_mine', []);
  },
  
  /**
   * Mine a specific number of blocks
   * @param provider Provider
   * @param blocks Number of blocks to mine
   */
  async mineBlocks(provider: ethers.providers.JsonRpcProvider, blocks: number): Promise<void> {
    for (let i = 0; i < blocks; i++) {
      await provider.send('evm_mine', []);
    }
  }
};

/**
 * Assertion utilities for smart contract testing
 */
export const contractAssertions = {
  /**
   * Assert that a transaction reverts with a specific error
   * @param promise Promise of transaction
   * @param errorMessage Expected error message
   */
  async assertRevert(promise: Promise<any>, errorMessage?: string): Promise<void> {
    try {
      await promise;
      throw new Error('Transaction did not revert');
    } catch (error: any) {
      if (errorMessage) {
        if (!error.message.includes(errorMessage)) {
          throw new Error(`Transaction reverted with unexpected error: ${error.message}`);
        }
      }
    }
  },
  
  /**
   * Assert that an event was emitted
   * @param receipt Transaction receipt
   * @param contract Contract
   * @param eventName Event name
   * @param args Event arguments
   */
  assertEvent(receipt: ethers.ContractReceipt, contract: ethers.Contract, eventName: string, args?: any[]): void {
    const event = receipt.events?.find(e => e.address === contract.address && e.event === eventName);
    
    if (!event) {
      throw new Error(`Event ${eventName} was not emitted`);
    }
    
    if (args) {
      args.forEach((arg, i) => {
        if (arg !== undefined && event.args?.[i] !== arg) {
          throw new Error(`Event ${eventName} argument ${i} mismatch: expected ${arg}, got ${event.args?.[i]}`);
        }
      });
    }
  },
  
  /**
   * Assert that a balance changed by a specific amount
   * @param getBalance Function to get balance
   * @param operation Operation to perform
   * @param expectedChange Expected change
   */
  async assertBalanceChange(
    getBalance: () => Promise<ethers.BigNumber>,
    operation: () => Promise<any>,
    expectedChange: ethers.BigNumberish
  ): Promise<void> {
    const before = await getBalance();
    await operation();
    const after = await getBalance();
    
    const actual = after.sub(before);
    const expected = ethers.BigNumber.from(expectedChange);
    
    if (!actual.eq(expected)) {
      throw new Error(`Balance change mismatch: expected ${expected}, got ${actual}`);
    }
  }
};

// =============================================================================
// UI TESTING WITH MOCKED WEB3
// =============================================================================

/**
 * Web3 UI testing configuration
 */
export interface Web3UITestConfig {
  providerOptions?: any;
  walletOptions?: {
    address?: string;
    chainId?: number;
    balance?: string;
    isConnected?: boolean;
  };
  contractOverrides?: Record<string, any>;
}

/**
 * Creates a mocked Web3 environment for UI testing
 * @param config Web3 UI test configuration
 * @returns Mocked window.ethereum provider
 */
export function createMockWeb3Provider(config: Web3UITestConfig = {}): ExternalProvider {
  const {
    walletOptions = {},
    contractOverrides = {}
  } = config;
  
  const {
    address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    chainId = 1,
    balance = '100000000000000000000',
    isConnected = true
  } = walletOptions;
  
  // Create a mock ethereum provider
  const ethereum: ExternalProvider & { _mockEventListeners?: any } = {
    isMetaMask: true,
    isConnected: () => isConnected,
    request: async ({ method, params }: { method: string; params?: any[] }) => {
      switch (method) {
        case 'eth_chainId':
          return `0x${chainId.toString(16)}`;
        
        case 'eth_accounts':
        case 'eth_requestAccounts':
          return [address];
        
        case 'eth_getBalance':
          return `0x${ethers.BigNumber.from(balance).toHexString().slice(2)}`;
        
        case 'eth_call':
          // Here we would handle contract method calls
          // For simplicity, we'll return empty data for now
          // In a real implementation, you'd parse the contract call and return appropriate data
          return '0x';
        
        case 'eth_sendTransaction':
          // Mock successful transaction
          return '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234';
        
        case 'eth_estimateGas':
          return '0x5208'; // 21000 gas in hex
        
        case 'eth_blockNumber':
          return '0x100'; // Block 256
        
        default:
          console.warn(`Unhandled method: ${method}`);
          return null;
      }
    },
    
    // Event emitter functions
    _mockEventListeners: {},
    
    on: function(event: string, listener: any) {
      if (!this._mockEventListeners) this._mockEventListeners = {};
      if (!this._mockEventListeners[event]) this._mockEventListeners[event] = [];
      this._mockEventListeners[event].push(listener);
      return this;
    },
    
    removeListener: function(event: string, listener: any) {
      if (!this._mockEventListeners?.[event]) return this;
      this._mockEventListeners[event] = this._mockEventListeners[event].filter((l: any) => l !== listener);
      return this;
    },
    
    // Helper method to emit events (for testing)
    _emit: function(event: string, ...args: any[]) {
      if (!this._mockEventListeners?.[event]) return;
      this._mockEventListeners[event].forEach((listener: any) => listener(...args));
    }
  };
  
  return ethereum;
}

/**
 * Injects a mock Web3 provider into the window for testing
 * @param provider Mock provider
 */
export function injectWeb3Provider(provider: ExternalProvider): void {
  if (typeof window !== 'undefined') {
    (window as any).ethereum = provider;
  }
}

/**
 * Cleans up the injected Web3 provider
 */
export function cleanupWeb3Provider(): void {
  if (typeof window !== 'undefined') {
    delete (window as any).ethereum;
  }
}

/**
 * Renders a component with a mocked Web3 provider
 * @param ui UI component to render
 * @param config Web3 UI test configuration
 * @returns Render result
 */
export function renderWithWeb3(ui: React.ReactElement, config: Web3UITestConfig = {}) {
  const mockProvider = createMockWeb3Provider(config);
  injectWeb3Provider(mockProvider);
  
  const result = render(ui);
  
  return {
    ...result,
    mockProvider,
    // Helper function to simulate chain changes
    changeChain: (chainId: number) => {
      (mockProvider as any)._emit('chainChanged', `0x${chainId.toString(16)}`);
    },
    // Helper function to simulate account changes
    changeAccounts: (accounts: string[]) => {
      (mockProvider as any)._emit('accountsChanged', accounts);
    },
    // Helper function to simulate connection
    connect: () => {
      (mockProvider as any)._emit('connect', { chainId: config.walletOptions?.chainId || 1 });
    },
    // Helper function to simulate disconnection
    disconnect: (error: any = { code: 1000, message: 'Disconnected' }) => {
      (mockProvider as any)._emit('disconnect', error);
    }
  };
}

// =============================================================================
// INTEGRATION TESTING WITH PLAYWRIGHT
// =============================================================================

/**
 * Configures a Playwright page with mocked Web3 provider
 * @param page Playwright page
 * @param config Web3 UI test configuration
 */
export async function setupWeb3PlaywrightPage(page: Page, config: Web3UITestConfig = {}): Promise<void> {
  // Serialize the mock configuration to inject into the page
  const configJson = JSON.stringify(config);
  
  // Inject the mock provider into the page
  await page.addInitScript(`
    window.mockWeb3Config = ${configJson};
    
    window.ethereum = {
      isMetaMask: true,
      isConnected: () => window.mockWeb3Config.walletOptions?.isConnected ?? true,
      
      async request({ method, params }) {
        const config = window.mockWeb3Config;
        const walletOptions = config.walletOptions || {};
        const address = walletOptions.address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        const chainId = walletOptions.chainId || 1;
        const balance = walletOptions.balance || '100000000000000000000';
        
        switch (method) {
          case 'eth_chainId':
            return '0x' + chainId.toString(16);
          
          case 'eth_accounts':
          case 'eth_requestAccounts':
            return [address];
          
          case 'eth_getBalance':
            return '0x' + BigInt(balance).toString(16);
          
          case 'eth_call':
            return '0x';
          
          case 'eth_sendTransaction':
            return '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234';
          
          case 'eth_estimateGas':
            return '0x5208';
          
          case 'eth_blockNumber':
            return '0x100';
          
          default:
            console.warn('Unhandled method:', method);
            return null;
        }
      },
      
      // Event emitter storage
      _mockEventListeners: {},
      
      on(event, listener) {
        if (!this._mockEventListeners[event]) this._mockEventListeners[event] = [];
        this._mockEventListeners[event].push(listener);
        return this;
      },
      
      removeListener(event, listener) {
        if (!this._mockEventListeners[event]) return this;
        this._mockEventListeners[event] = this._mockEventListeners[event].filter(l => l !== listener);
        return this;
      }
    };
  `);
  
  // Add helper methods to control Web3 state from tests
  await page.exposeFunction('changeWeb3Chain', async (chainId: number) => {
    await page.evaluate((chainId) => {
      window.ethereum._mockEventListeners['chainChanged']?.forEach(listener => 
        listener('0x' + chainId.toString(16))
      );
    }, chainId);
  });
  
  await page.exposeFunction('changeWeb3Accounts', async (accounts: string[]) => {
    await page.evaluate((accounts) => {
      window.ethereum._mockEventListeners['accountsChanged']?.forEach(listener => 
        listener(accounts)
      );
    }, accounts);
  });
  
  await page.exposeFunction('connectWeb3', async () => {
    await page.evaluate(() => {
      const chainId = window.mockWeb3Config.walletOptions?.chainId || 1;
      window.ethereum._mockEventListeners['connect']?.forEach(listener => 
        listener({ chainId: '0x' + chainId.toString(16) })
      );
    });
  });
  
  await page.exposeFunction('disconnectWeb3', async (error = { code: 1000, message: 'Disconnected' }) => {
    await page.evaluate((error) => {
      window.ethereum._mockEventListeners['disconnect']?.forEach(listener => 
        listener(error)
      );
    }, error);
  });
}

/**
 * Playwright Web3 testing utilities
 */
export const playwrightWeb3Utils = {
  /**
   * Wait for a transaction confirmation message
   * @param page Playwright page
   * @param timeout Timeout in milliseconds
   */
  async waitForTransactionConfirmation(page: Page, timeout = 5000): Promise<void> {
    await page.waitForSelector('[data-testid="tx-success"]', { timeout });
  },
  
  /**
   * Wait for a wallet to be connected
   * @param page Playwright page
   * @param timeout Timeout in milliseconds
   */
  async waitForWalletConnection(page: Page, timeout = 5000): Promise<void> {
    await page.waitForSelector('[data-testid="wallet-connected"]', { timeout });
  },
  
  /**
   * Click connect wallet button and wait for connection
   * @param page Playwright page
   */
  async connectWallet(page: Page): Promise<void> {
    await page.click('[data-testid="connect-wallet-button"]');
    await this.waitForWalletConnection(page);
  },
  
  /**
   * Fill a transaction form and submit
   * @param page Playwright page
   * @param fields Form fields
   */
  async fillTransactionForm(page: Page, fields: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(fields)) {
      await page.fill(`[data-testid="tx-form-${field}"]`, value);
    }
    
    await page.click('[data-testid="tx-form-submit"]');
  }
};

// =============================================================================
// EXAMPLE TEST CASES
// =============================================================================

/*
Example Smart Contract Test:

import { setupContractTestEnvironment, contractAssertions, timeOperations } from './web3-test-framework';
import TokenArtifact from '../artifacts/contracts/Token.sol/Token.json';

describe('Token Contract', () => {
  let env;
  
  beforeEach(async () => {
    env = await setupContractTestEnvironment([
      {
        name: 'token',
        artifact: TokenArtifact,
        args: ['Test Token', 'TEST', 18]
      }
    ]);
  });
  
  it('should have correct name and symbol', async () => {
    const token = env.contracts.token;
    expect(await token.name()).to.equal('Test Token');
    expect(await token.symbol()).to.equal('TEST');
  });
  
  it('should mint tokens to owner', async () => {
    const token = env.contracts.token;
    const user = env.users[0];
    
    await token.mint(user.address, ethers.utils.parseEther('100'));
    
    expect(await token.balanceOf(user.address)).to.equal(ethers.utils.parseEther('100'));
  });
  
  it('should revert when transferring more than balance', async () => {
    const token = env.contracts.token;
    const [user1, user2] = env.users;
    
    await token.mint(user1.address, ethers.utils.parseEther('10'));
    
    const connectedToken = token.connect(user1);
    
    await contractAssertions.assertRevert(
      connectedToken.transfer(user2.address, ethers.utils.parseEther('11')),
      'insufficient balance'
    );
  });
  
  it('should emit Transfer event when transferring tokens', async () => {
    const token = env.contracts.token;
    const [user1, user2] = env.users;
    const amount = ethers.utils.parseEther('5');
    
    await token.mint(user1.address, ethers.utils.parseEther('10'));
    
    const connectedToken = token.connect(user1);
    const tx = await connectedToken.transfer(user2.address, amount);
    const receipt = await tx.wait();
    
    contractAssertions.assertEvent(receipt, token, 'Transfer', [
      user1.address,
      user2.address,
      amount
    ]);
  });
});

Example UI Test:

import { renderWithWeb3 } from './web3-test-framework';
import { WalletConnector } from '../components/WalletConnector';

describe('WalletConnector Component', () => {
  afterEach(() => {
    cleanupWeb3Provider();
  });
  
  it('should display wallet address when connected', () => {
    const { getByText } = renderWithWeb3(<WalletConnector />, {
      walletOptions: {
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      }
    });
    
    expect(getByText('0x1234...7890')).toBeInTheDocument();
  });
  
  it('should display connect button when disconnected', () => {
    const { getByText } = renderWithWeb3(<WalletConnector />, {
      walletOptions: {
        isConnected: false
      }
    });
    
    expect(getByText('Connect Wallet')).toBeInTheDocument();
  });
  
  it('should update UI when account changes', async () => {
    const { getByText, changeAccounts } = renderWithWeb3(<WalletConnector />, {
      walletOptions: {
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true
      }
    });
    
    expect(getByText('0x1234...7890')).toBeInTheDocument();
    
    // Change account
    changeAccounts(['0xabcdef1234567890abcdef1234567890abcdef12']);
    
    // Wait for UI update
    await waitFor(() => {
      expect(getByText('0xabcd...ef12')).toBeInTheDocument();
    });
  });
});

Example Playwright Integration Test:

import { test, expect } from '@playwright/test';
import { setupWeb3PlaywrightPage, playwrightWeb3Utils } from './web3-test-framework';

test.describe('Token Transfer Flow', () => {
  test('should transfer tokens and show confirmation', async ({ page }) => {
    // Configure page with mocked Web3
    await setupWeb3PlaywrightPage(page, {
      walletOptions: {
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        balance: '1000000000000000000' // 1 ETH
      }
    });
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Connect wallet
    await playwrightWeb3Utils.connectWallet(page);
    
    // Navigate to transfer page
    await page.click('text=Transfer');
    
    // Fill transfer form
    await playwrightWeb3Utils.fillTransactionForm(page, {
      'recipient': '0xabcdef1234567890abcdef1234567890abcdef12',
      'amount': '0.1'
    });
    
    // Wait for transaction confirmation
    await playwrightWeb3Utils.waitForTransactionConfirmation(page);
    
    // Verify success message
    expect(await page.textContent('[data-testid="tx-success"]')).toContain('Transfer successful');
  });
});
*/ 