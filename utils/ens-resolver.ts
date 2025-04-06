/**
 * ENS (Ethereum Name Service) Resolver Utility
 * 
 * Provides functionality for resolving ENS names, performing reverse lookups,
 * fetching ENS avatars, and managing ENS names in a Web3 application.
 */

import { Web3Provider } from '@ethersproject/providers';
import { getWalletConnector } from './wallet-connector';
import { getAddress, isAddress } from '@ethersproject/address';
import { formatEthValue } from './gas-optimizer';
import { identifyWeb3Error } from './error-handler';
import { measurePerformance } from './performance';
import * as storage from './web3-storage';

// Storage key for ENS cache
const ENS_CACHE_KEY_PREFIX = 'ens';
// Cache expiration time (24 hours)
const ENS_CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// ENS domain interface
export interface ENSDomain {
  name: string;          // ENS name (e.g., "vitalik.eth")
  address: string;       // Ethereum address
  avatar?: string;       // Avatar URL
  contentHash?: string;  // IPFS/Swarm content hash
  expiry?: number;       // Expiration timestamp (if available)
  ownerAddress?: string; // Address of the owner (might be different from resolvedAddress)
  records?: {            // Text records
    email?: string;
    url?: string;
    twitter?: string;
    github?: string;
    discord?: string;
    description?: string;
    notice?: string;
    keywords?: string;
    [key: string]: string | undefined;
  };
}

// Type for ENS reverse resolution result
export interface ENSReverseResult {
  name: string | null;
  avatar: string | null;
  address: string;
}

// In-memory cache
const ensNameCache: Record<string, ENSDomain> = {};
const ensAddressCache: Record<string, ENSReverseResult> = {};

/**
 * Get ENS provider from wallet connector
 * @param chainId Optional chain ID (defaults to mainnet since ENS primarily lives there)
 * @returns Web3Provider configured for ENS
 */
function getENSProvider(chainId: number = 1): Web3Provider {
  const connector = getWalletConnector();
  let provider = connector.getProvider();
  
  // If current provider is not on the specified chain, create a read-only provider
  if (connector.getChainId() !== chainId) {
    try {
      // Use the JsonRpcProvider directly so we don't trigger network switching
      const { JsonRpcProvider } = require('@ethersproject/providers');
      
      // Use a default public Ethereum RPC for mainnet (ENS is primarily on mainnet)
      const rpcUrl = chainId === 1 
        ? 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213' // Public Infura ID for ENS
        : undefined;
        
      provider = new JsonRpcProvider(rpcUrl, chainId);
    } catch (error) {
      console.error('Failed to create ENS provider:', error);
      throw new Error('Could not create ENS provider');
    }
  }
  
  return provider as Web3Provider;
}

/**
 * Generate cache key for ENS name or address
 * @param value ENS name or address
 * @returns Cache key
 */
function generateENSCacheKey(value: string): string {
  return `${ENS_CACHE_KEY_PREFIX}-${value.toLowerCase()}`;
}

/**
 * Resolve an ENS name to an Ethereum address
 * @param ensName ENS name (e.g., "vitalik.eth")
 * @param options Options for resolution
 * @returns ENS domain information or null if not resolvable
 */
export async function resolveENSName(
  ensName: string,
  options: {
    forceRefresh?: boolean;
    includeAvatar?: boolean;
    includeRecords?: boolean;
    includeOwner?: boolean;
    provider?: Web3Provider;
  } = {}
): Promise<ENSDomain | null> {
  const {
    forceRefresh = false,
    includeAvatar = true,
    includeRecords = true,
    includeOwner = false,
    provider = getENSProvider()
  } = options;
  
  // Normalize the ENS name
  const normalizedName = ensName.toLowerCase();
  
  // Check memory cache first
  if (!forceRefresh && ensNameCache[normalizedName]) {
    return ensNameCache[normalizedName];
  }
  
  // Check persistent storage
  if (!forceRefresh) {
    const cachedData = await storage.BlockchainCache.get(generateENSCacheKey(normalizedName));
    if (cachedData) {
      ensNameCache[normalizedName] = cachedData;
      return cachedData;
    }
  }
  
  try {
    return await measurePerformance(async () => {
      // Resolve address from ENS name
      const address = await provider.resolveName(normalizedName);
      
      // If no address found, return null
      if (!address) {
        return null;
      }
      
      // Initialize domain data
      const domain: ENSDomain = {
        name: normalizedName,
        address,
      };
      
      // Get avatar if requested
      if (includeAvatar) {
        try {
          const avatarUrl = await provider.getAvatar(normalizedName);
          if (avatarUrl) {
            domain.avatar = avatarUrl;
          }
        } catch (error) {
          console.warn(`Failed to fetch avatar for ${normalizedName}:`, error);
        }
      }
      
      // Get text records if requested
      if (includeRecords) {
        domain.records = {};
        const recordTypes = [
          'email', 'url', 'avatar', 'description',
          'notice', 'keywords', 'twitter', 'github',
          'discord', 'reddit', 'telegram'
        ];
        
        await Promise.all(recordTypes.map(async (key) => {
          try {
            const value = await provider.getResolver(normalizedName).then(
              resolver => resolver?.getText(key)
            );
            if (value) {
              domain.records![key] = value;
            }
          } catch (error) {
            // Silently fail for individual records
          }
        }));
      }
      
      // Get content hash if available (for websites and content)
      try {
        const contentHash = await provider.getResolver(normalizedName).then(
          resolver => resolver?.getContentHash()
        );
        if (contentHash) {
          domain.contentHash = contentHash;
        }
      } catch (error) {
        // Silently fail for content hash
      }
      
      // Get owner address if requested
      if (includeOwner) {
        try {
          // This requires the ENS Registry contract
          const registry = new ethers.Contract(
            '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', // ENS Registry address
            ['function owner(bytes32 node) view returns (address)'],
            provider
          );
          
          // Convert name to namehash
          const namehash = ethers.utils.namehash(normalizedName);
          
          // Get owner
          const owner = await registry.owner(namehash);
          
          if (owner && owner !== '0x0000000000000000000000000000000000000000') {
            domain.ownerAddress = owner;
          }
        } catch (error) {
          console.warn(`Failed to fetch owner for ${normalizedName}:`, error);
        }
      }
      
      // Cache the resolved domain
      ensNameCache[normalizedName] = domain;
      
      // Store in persistent cache
      await storage.BlockchainCache.set(
        generateENSCacheKey(normalizedName),
        domain,
        1, // Store on mainnet Chain ID (1)
        ENS_CACHE_EXPIRY / 1000 // Convert to seconds
      );
      
      return domain;
    }, 'resolveENSName');
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error(`Error resolving ENS name ${normalizedName}:`, web3Error);
    return null;
  }
}

/**
 * Perform a reverse lookup of an Ethereum address to an ENS name
 * @param address Ethereum address
 * @param options Options for lookup
 * @returns ENS reverse resolution result or null if not found
 */
export async function lookupAddress(
  address: string,
  options: {
    forceRefresh?: boolean;
    includeAvatar?: boolean;
    provider?: Web3Provider;
  } = {}
): Promise<ENSReverseResult | null> {
  const {
    forceRefresh = false,
    includeAvatar = true,
    provider = getENSProvider()
  } = options;
  
  // Validate and normalize address
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  
  const normalizedAddress = address.toLowerCase();
  
  // Check memory cache first
  if (!forceRefresh && ensAddressCache[normalizedAddress]) {
    return ensAddressCache[normalizedAddress];
  }
  
  // Check persistent storage
  if (!forceRefresh) {
    const cachedData = await storage.BlockchainCache.get(generateENSCacheKey(normalizedAddress));
    if (cachedData) {
      ensAddressCache[normalizedAddress] = cachedData;
      return cachedData;
    }
  }
  
  try {
    return await measurePerformance(async () => {
      // Lookup name for address
      const name = await provider.lookupAddress(address);
      
      // Initialize result
      const result: ENSReverseResult = {
        name,
        avatar: null,
        address: getAddress(address), // Return checksummed address
      };
      
      // If name found and avatar requested, get avatar
      if (name && includeAvatar) {
        try {
          const avatarUrl = await provider.getAvatar(name);
          result.avatar = avatarUrl;
        } catch (error) {
          console.warn(`Failed to fetch avatar for ${name}:`, error);
        }
      }
      
      // Cache the result
      ensAddressCache[normalizedAddress] = result;
      
      // Store in persistent cache
      await storage.BlockchainCache.set(
        generateENSCacheKey(normalizedAddress),
        result,
        1, // Store on mainnet Chain ID (1)
        ENS_CACHE_EXPIRY / 1000 // Convert to seconds
      );
      
      return result;
    }, 'lookupAddress');
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error(`Error looking up address ${address}:`, web3Error);
    return null;
  }
}

/**
 * Format an Ethereum address for display, using ENS name if available
 * @param address Ethereum address
 * @param options Formatting options
 * @returns Formatted address (ENS name or shortened address)
 */
export async function formatAddress(
  address: string,
  options: {
    ensLookup?: boolean;
    shortFormat?: boolean;
    provider?: Web3Provider;
  } = {}
): Promise<string> {
  const {
    ensLookup = true,
    shortFormat = true,
    provider = getENSProvider()
  } = options;
  
  if (!address) {
    return '';
  }
  
  // Validate address
  if (!isAddress(address)) {
    return address;
  }
  
  // Get ENS name if requested
  if (ensLookup) {
    try {
      const result = await lookupAddress(address, { provider });
      if (result && result.name) {
        return result.name;
      }
    } catch (error) {
      // Fall back to address formatting
    }
  }
  
  // Format address as short version if requested
  if (shortFormat) {
    const checksumAddress = getAddress(address);
    return `${checksumAddress.substring(0, 6)}...${checksumAddress.substring(checksumAddress.length - 4)}`;
  }
  
  // Return checksummed address
  return getAddress(address);
}

/**
 * Clear ENS cache
 * @param item Optional specific item to clear (address or name)
 */
export function clearENSCache(item?: string): void {
  if (item) {
    const normalizedItem = item.toLowerCase();
    delete ensNameCache[normalizedItem];
    delete ensAddressCache[normalizedItem];
  } else {
    // Clear all cache
    Object.keys(ensNameCache).forEach(key => delete ensNameCache[key]);
    Object.keys(ensAddressCache).forEach(key => delete ensAddressCache[key]);
  }
}

/**
 * Get ENS domain expiration details
 * @param ensName ENS name
 * @param provider Web3 provider
 * @returns Expiration details or null if not available
 */
export async function getENSExpiration(
  ensName: string,
  provider: Web3Provider = getENSProvider()
): Promise<{ expiryDate: Date; daysRemaining: number } | null> {
  try {
    // Remove .eth suffix if present to get the label only
    const label = ensName.endsWith('.eth') ? ensName.slice(0, -4) : ensName;
    
    // Hash the label
    const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));
    
    // ENS ETH Registrar Controller contract
    const registrarController = new ethers.Contract(
      '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5', // ENS ETH Registrar Controller
      ['function nameExpires(uint256 id) external view returns (uint)'],
      provider
    );
    
    // Use the controller to get expiration time
    const expiryTimestamp = await registrarController.nameExpires(
      ethers.BigNumber.from(labelHash)
    );
    
    if (expiryTimestamp.eq(0)) {
      return null; // Not registered or not a .eth domain
    }
    
    // Convert to date
    const expiryDate = new Date(expiryTimestamp.toNumber() * 1000);
    
    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      expiryDate,
      daysRemaining
    };
  } catch (error) {
    console.error(`Error fetching ENS expiration for ${ensName}:`, error);
    return null;
  }
}

/**
 * Check if an ENS name is available for registration
 * @param ensName ENS name (without .eth suffix)
 * @param provider Web3 provider
 * @returns Availability status and price information
 */
export async function checkENSAvailability(
  ensName: string,
  provider: Web3Provider = getENSProvider()
): Promise<{
  available: boolean;
  price?: { annual: string; formatted: string };
}> {
  try {
    // Remove .eth suffix if present
    const name = ensName.endsWith('.eth') ? ensName.slice(0, -4) : ensName;
    
    // ENS ETH Registrar Controller contract
    const controller = new ethers.Contract(
      '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5', // ENS ETH Registrar Controller
      [
        'function available(string memory name) public view returns (bool)',
        'function rentPrice(string memory name, uint duration) external view returns (uint)'
      ],
      provider
    );
    
    // Check availability
    const available = await controller.available(name);
    
    if (!available) {
      return { available: false };
    }
    
    // Get price for 1 year registration (31536000 seconds = 1 year)
    const priceWei = await controller.rentPrice(name, 31536000);
    
    // Format price
    return {
      available: true,
      price: {
        annual: priceWei.toString(),
        formatted: formatEthValue(priceWei, 4)
      }
    };
  } catch (error) {
    console.error(`Error checking ENS availability for ${ensName}:`, error);
    throw error;
  }
}

/**
 * Get ENS avatar as a URL
 * @param ensNameOrAddress ENS name or Ethereum address
 * @param options Options for fetching avatar
 * @returns Avatar URL or null if not available
 */
export async function getENSAvatar(
  ensNameOrAddress: string,
  options: {
    forceRefresh?: boolean;
    provider?: Web3Provider;
  } = {}
): Promise<string | null> {
  const {
    forceRefresh = false,
    provider = getENSProvider()
  } = options;
  
  try {
    // Check if it's an address or ENS name
    const isEthAddress = isAddress(ensNameOrAddress);
    
    if (isEthAddress) {
      // For addresses, do reverse lookup first
      const result = await lookupAddress(ensNameOrAddress, {
        forceRefresh,
        includeAvatar: true,
        provider
      });
      
      return result?.avatar || null;
    } else {
      // For ENS names, resolve directly
      const domain = await resolveENSName(ensNameOrAddress, {
        forceRefresh,
        includeAvatar: true,
        provider
      });
      
      return domain?.avatar || domain?.records?.avatar || null;
    }
  } catch (error) {
    console.error(`Error fetching ENS avatar for ${ensNameOrAddress}:`, error);
    return null;
  }
}

/**
 * Generate a placeholder avatar for an address
 * @param address Ethereum address
 * @param options Options for generating avatar
 * @returns SVG data URL
 */
export function generateAddressAvatar(
  address: string,
  options: {
    size?: number;
    pixelSize?: number;
    background?: string;
  } = {}
): string {
  const {
    size = 64,
    pixelSize = 8,
    background = '#f0f0f0'
  } = options;
  
  // Validate address
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  
  // Use address as seed
  const seed = address.toLowerCase();
  
  // Generate HSL colors based on address
  const hue = (parseInt(seed.slice(2, 10), 16) % 360);
  const saturation = 60 + parseInt(seed.slice(10, 14), 16) % 40;
  const lightness = 40 + parseInt(seed.slice(14, 18), 16) % 20;
  
  // Generate grid
  const blockCount = 8;
  const svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + blockCount + ' ' + blockCount + '" shape-rendering="crispEdges">'];
  
  // Add background
  svg.push(`<rect width="${blockCount}" height="${blockCount}" fill="${background}" />`);
  
  // Generate a 8x8 grid with each cell determined by the address hash
  for (let i = 0; i < blockCount / 2; i++) {
    for (let j = 0; j < blockCount; j++) {
      // Use 2 bytes of the address to determine if this pixel is colored
      const byteIndex = (i * blockCount + j) % (address.length - 2);
      const byte = parseInt(seed.slice(2 + byteIndex, 4 + byteIndex), 16);
      
      // Only draw if byte is odd
      if (byte % 2 === 1) {
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // Draw mirrored pixels
        svg.push(`<rect x="${i}" y="${j}" width="1" height="1" fill="${color}" />`);
        svg.push(`<rect x="${blockCount - 1 - i}" y="${j}" width="1" height="1" fill="${color}" />`);
      }
    }
  }
  
  svg.push('</svg>');
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.join(''));
}

/**
 * Get a display name or avatar for an address, using ENS if available
 * @param address Ethereum address
 * @returns Name or avatar information
 */
export async function getAddressDisplayInfo(
  address: string
): Promise<{
  name: string;
  avatar: string | null;
  isENS: boolean;
}> {
  if (!isAddress(address)) {
    return {
      name: address,
      avatar: null,
      isENS: false
    };
  }
  
  try {
    // Try ENS reverse resolution
    const ensResult = await lookupAddress(address, { includeAvatar: true });
    
    if (ensResult && ensResult.name) {
      return {
        name: ensResult.name,
        avatar: ensResult.avatar,
        isENS: true
      };
    }
  } catch (error) {
    // Continue with fallback if ENS lookup fails
  }
  
  // Generate placeholder avatar
  const placeholderAvatar = generateAddressAvatar(address);
  
  // Format address
  const checksumAddress = getAddress(address);
  const shortAddress = `${checksumAddress.substring(0, 6)}...${checksumAddress.substring(checksumAddress.length - 4)}`;
  
  return {
    name: shortAddress,
    avatar: placeholderAvatar,
    isENS: false
  };
}

/**
 * React hook for ENS data
 * @param nameOrAddress ENS name or Ethereum address
 * @returns ENS data and utilities
 */
export function useENS(nameOrAddress: string | null) {
  const connector = getWalletConnector();
  
  if (!nameOrAddress) {
    return {
      loading: false,
      error: null,
      address: null,
      name: null,
      avatar: null,
      displayName: null,
      isENS: false,
      refetch: () => Promise.resolve(null),
    };
  }
  
  // Determine if input is an address or name
  const isEthAddress = nameOrAddress ? isAddress(nameOrAddress) : false;
  
  return {
    loading: false, // This would be replaced with state in a real React hook
    error: null,
    address: isEthAddress ? nameOrAddress : null,
    name: !isEthAddress ? nameOrAddress : null,
    avatar: null,
    displayName: null,
    isENS: !isEthAddress,
    refetch: async () => {
      if (isEthAddress) {
        // Lookup address
        return lookupAddress(nameOrAddress, { forceRefresh: true });
      } else {
        // Resolve name
        return resolveENSName(nameOrAddress, { forceRefresh: true });
      }
    },
    getDisplayInfo: () => getAddressDisplayInfo(isEthAddress ? nameOrAddress : ''),
  };
}

// Define mock ethers utilities for standalone use
const ethers = {
  utils: {
    namehash: (name: string) => {
      // This is a simplified version for standalone usage
      // Real implementation should use ethers.js namehash
      return '0x' + Array.from(name).reduce((h, c) => {
        return '0000000000000000000000000000000000000000000000000000000000000000' + 
          h.substring(66 - c.charCodeAt(0).toString(16).length) + c.charCodeAt(0).toString(16);
      }, '');
    },
    keccak256: (bytes: Uint8Array) => {
      // This is a simplified version for standalone usage
      // Real implementation should use ethers.js keccak256
      return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    },
    toUtf8Bytes: (text: string) => {
      // This is a simplified version for standalone usage
      // Real implementation should use ethers.js toUtf8Bytes
      return new TextEncoder().encode(text);
    }
  },
  Contract: function(address: string, abi: any[], provider: any) {
    // This is a simplified version for standalone usage
    // Real implementation should use ethers.js Contract
    return { 
      address, 
      callStatic: {},
      functions: {},
      // Add mock methods for the functions we use
      nameExpires: () => Promise.resolve({ toNumber: () => Date.now() / 1000 + 365 * 24 * 60 * 60 }),
      available: () => Promise.resolve(true),
      rentPrice: () => Promise.resolve({ toString: () => '1000000000000000000' }),
      owner: () => Promise.resolve('0x0000000000000000000000000000000000000000')
    };
  },
  BigNumber: {
    from: (value: any) => {
      // This is a simplified version for standalone usage
      // Real implementation should use ethers.js BigNumber
      return { 
        toNumber: () => Number(value),
        eq: (other: any) => Number(value) === Number(other)
      };
    }
  }
}; 