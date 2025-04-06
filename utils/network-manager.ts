/**
 * Network Manager Utilities
 * 
 * Support for multi-chain functionality and network switching
 */

// Network specific configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  displayName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconUrl?: string;
  isTestnet: boolean;
}

// Supported networks configuration
export const NETWORKS: { [key: string]: NetworkConfig } = {
  // Mainnet Networks
  ETHEREUM: {
    chainId: 1,
    name: 'ethereum',
    displayName: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://mainnet.infura.io/v3/${INFURA_API_KEY}',
      'https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}',
    ],
    blockExplorerUrls: ['https://etherscan.io'],
    iconUrl: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-diamond-black.png',
    isTestnet: false,
  },
  POLYGON: {
    chainId: 137,
    name: 'polygon',
    displayName: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.network',
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    isTestnet: false,
  },
  ARBITRUM: {
    chainId: 42161,
    name: 'arbitrum',
    displayName: 'Arbitrum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}',
    ],
    blockExplorerUrls: ['https://arbiscan.io'],
    iconUrl: 'https://arbitrum.io/wp-content/uploads/2021/01/Arbitrum_Symbol-Full-color-White-background.png',
    isTestnet: false,
  },
  OPTIMISM: {
    chainId: 10,
    name: 'optimism',
    displayName: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}',
    ],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    iconUrl: 'https://optimism.io/images/optimism.svg',
    isTestnet: false,
  },
  
  // Testnet Networks
  GOERLI: {
    chainId: 5,
    name: 'goerli',
    displayName: 'Goerli Testnet',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://goerli.infura.io/v3/${INFURA_API_KEY}',
      'https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}',
    ],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
    iconUrl: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-diamond-black.png',
    isTestnet: true,
  },
  SEPOLIA: {
    chainId: 11155111,
    name: 'sepolia',
    displayName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://sepolia.infura.io/v3/${INFURA_API_KEY}',
      'https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    iconUrl: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-diamond-black.png',
    isTestnet: true,
  },
  MUMBAI: {
    chainId: 80001,
    name: 'mumbai',
    displayName: 'Mumbai Testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: [
      'https://rpc-mumbai.maticvigil.com',
      'https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}',
    ],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    isTestnet: true,
  },
};

/**
 * Get network by chain ID
 * @param chainId Chain ID
 * @returns Network configuration or undefined if not found
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(network => network.chainId === chainId);
}

/**
 * Get all supported mainnet networks
 * @returns Array of mainnet network configurations
 */
export function getAllMainnetNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network => !network.isTestnet);
}

/**
 * Get all supported testnet networks
 * @returns Array of testnet network configurations
 */
export function getAllTestnetNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network => network.isTestnet);
}

/**
 * Format chain ID to hexadecimal (required for EIP-3085)
 * @param chainId Chain ID
 * @returns Hexadecimal chain ID
 */
export function formatChainIdToHex(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

/**
 * Switch network in MetaMask or other EIP-3085 compliant wallets
 * @param chainId Chain ID to switch to
 * @returns Promise resolving to true if successful
 */
export async function switchNetwork(chainId: number): Promise<boolean> {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found');
  }
  
  const hexChainId = formatChainIdToHex(chainId);
  
  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        return await addNetwork(chainId);
      } catch (addError) {
        console.error('Error adding network:', addError);
        throw addError;
      }
    }
    
    console.error('Error switching network:', switchError);
    throw switchError;
  }
}

/**
 * Add network to wallet
 * @param chainId Chain ID to add
 * @returns Promise resolving to true if successful
 */
export async function addNetwork(chainId: number): Promise<boolean> {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found');
  }
  
  const network = getNetworkByChainId(chainId);
  
  if (!network) {
    throw new Error(`Network with chain ID ${chainId} not supported`);
  }
  
  // Replace API key placeholders in RPC URLs
  const rpcUrls = network.rpcUrls.map(url => {
    if (url.includes('${INFURA_API_KEY}')) {
      return url.replace('${INFURA_API_KEY}', process.env.NEXT_PUBLIC_INFURA_API_KEY || '');
    }
    if (url.includes('${ALCHEMY_API_KEY}')) {
      return url.replace('${ALCHEMY_API_KEY}', process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '');
    }
    return url;
  });
  
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: formatChainIdToHex(network.chainId),
          chainName: network.displayName,
          nativeCurrency: network.nativeCurrency,
          rpcUrls,
          blockExplorerUrls: network.blockExplorerUrls,
        },
      ],
    });
    
    return true;
  } catch (error) {
    console.error('Error adding network:', error);
    throw error;
  }
}

/**
 * Get block explorer URL for transaction
 * @param txHash Transaction hash
 * @param chainId Chain ID
 * @returns Block explorer URL
 */
export function getExplorerTxUrl(txHash: string, chainId: number): string {
  const network = getNetworkByChainId(chainId);
  
  if (!network || !network.blockExplorerUrls || network.blockExplorerUrls.length === 0) {
    // Default to Etherscan
    return `https://etherscan.io/tx/${txHash}`;
  }
  
  return `${network.blockExplorerUrls[0]}/tx/${txHash}`;
}

/**
 * Get block explorer URL for address
 * @param address Ethereum address
 * @param chainId Chain ID
 * @returns Block explorer URL
 */
export function getExplorerAddressUrl(address: string, chainId: number): string {
  const network = getNetworkByChainId(chainId);
  
  if (!network || !network.blockExplorerUrls || network.blockExplorerUrls.length === 0) {
    // Default to Etherscan
    return `https://etherscan.io/address/${address}`;
  }
  
  return `${network.blockExplorerUrls[0]}/address/${address}`;
}

/**
 * Get block explorer URL for token
 * @param tokenAddress Token contract address
 * @param chainId Chain ID
 * @returns Block explorer URL
 */
export function getExplorerTokenUrl(tokenAddress: string, chainId: number): string {
  const network = getNetworkByChainId(chainId);
  
  if (!network || !network.blockExplorerUrls || network.blockExplorerUrls.length === 0) {
    // Default to Etherscan
    return `https://etherscan.io/token/${tokenAddress}`;
  }
  
  return `${network.blockExplorerUrls[0]}/token/${tokenAddress}`;
}

/**
 * Create a contract address link with appropriate block explorer
 * @param address Contract address
 * @param chainId Chain ID
 * @param label Optional label
 * @returns HTML anchor element
 */
export function createContractLink(
  address: string,
  chainId: number,
  label?: string
): string {
  const url = getExplorerAddressUrl(address, chainId);
  const displayLabel = label || `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${displayLabel}</a>`;
}

/**
 * Create a transaction link with appropriate block explorer
 * @param txHash Transaction hash
 * @param chainId Chain ID
 * @param label Optional label
 * @returns HTML anchor element
 */
export function createTxLink(
  txHash: string,
  chainId: number,
  label?: string
): string {
  const url = getExplorerTxUrl(txHash, chainId);
  const displayLabel = label || `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`;
  
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${displayLabel}</a>`;
} 