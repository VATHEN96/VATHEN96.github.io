/**
 * Token Utilities
 * 
 * Comprehensive utilities for working with different token standards
 * (ERC-20, ERC-721, ERC-1155) in a web3 application
 */

import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { Web3Provider } from '@ethersproject/providers';
import { getWalletConnector } from './wallet-connector';
import { getExplorerTokenUrl } from './network-manager';
import { identifyWeb3Error, retryWeb3Operation } from './error-handler';
import { measurePerformance } from './performance';
import * as storage from './web3-storage';

// Common ERC-20 ABI fragments
const ERC20_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  // Write functions
  'function transfer(address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Common ERC-721 ABI fragments
const ERC721_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  // Write functions
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
];

// Common ERC-1155 ABI fragments
const ERC1155_ABI = [
  // Read-only functions
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function uri(uint256 id) view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  // Write functions
  'function setApprovalForAll(address operator, bool approved)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
  // Events
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
  'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
  'event URI(string value, uint256 indexed id)'
];

// Token metadata
export interface TokenMetadata {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  standard: 'ERC20' | 'ERC721' | 'ERC1155';
  balance?: string;
  formattedBalance?: string;
  totalSupply?: string;
  formattedTotalSupply?: string;
}

// NFT metadata
export interface NFTMetadata {
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  standard: 'ERC721' | 'ERC1155';
  tokenURI?: string;
  owner?: string;
  contractAddress: string;
  chainId: number;
  [key: string]: any; // Allow for additional metadata properties
}

// Token cache - used to avoid repeated network calls
const tokenCache: Record<string, TokenMetadata> = {};
const nftCache: Record<string, NFTMetadata> = {};

/**
 * Generate a cache key for a token
 * @param address Token contract address
 * @param chainId Chain ID
 * @returns Cache key
 */
function generateTokenCacheKey(address: string, chainId: number): string {
  return `${chainId}-${address.toLowerCase()}`;
}

/**
 * Generate a cache key for an NFT
 * @param contractAddress NFT contract address
 * @param tokenId Token ID
 * @param chainId Chain ID
 * @returns Cache key
 */
function generateNFTCacheKey(contractAddress: string, tokenId: string, chainId: number): string {
  return `${chainId}-${contractAddress.toLowerCase()}-${tokenId}`;
}

/**
 * Create an ERC-20 contract instance
 * @param tokenAddress Token contract address
 * @param provider Web3 provider
 * @returns Contract instance
 */
export function getERC20Contract(tokenAddress: string, provider: Web3Provider): Contract {
  return new Contract(tokenAddress, ERC20_ABI, provider);
}

/**
 * Create an ERC-721 contract instance
 * @param tokenAddress NFT contract address
 * @param provider Web3 provider
 * @returns Contract instance
 */
export function getERC721Contract(tokenAddress: string, provider: Web3Provider): Contract {
  return new Contract(tokenAddress, ERC721_ABI, provider);
}

/**
 * Create an ERC-1155 contract instance
 * @param tokenAddress NFT contract address
 * @param provider Web3 provider
 * @returns Contract instance
 */
export function getERC1155Contract(tokenAddress: string, provider: Web3Provider): Contract {
  return new Contract(tokenAddress, ERC1155_ABI, provider);
}

/**
 * Detect if a contract implements ERC-20
 * @param address Contract address
 * @param provider Web3 provider
 * @returns True if the contract implements ERC-20
 */
export async function isERC20(address: string, provider: Web3Provider): Promise<boolean> {
  try {
    const contract = getERC20Contract(address, provider);
    await Promise.all([
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Detect if a contract implements ERC-721
 * @param address Contract address
 * @param provider Web3 provider
 * @returns True if the contract implements ERC-721
 */
export async function isERC721(address: string, provider: Web3Provider): Promise<boolean> {
  try {
    const contract = getERC721Contract(address, provider);
    // Check if the contract supports the ERC-721 interface
    const isSupported = await contract.supportsInterface('0x80ac58cd');
    return isSupported;
  } catch (error) {
    return false;
  }
}

/**
 * Detect if a contract implements ERC-1155
 * @param address Contract address
 * @param provider Web3 provider
 * @returns True if the contract implements ERC-1155
 */
export async function isERC1155(address: string, provider: Web3Provider): Promise<boolean> {
  try {
    const contract = getERC1155Contract(address, provider);
    // Check if the contract supports the ERC-1155 interface
    const isSupported = await contract.supportsInterface('0xd9b67a26');
    return isSupported;
  } catch (error) {
    return false;
  }
}

/**
 * Detect token standard for a contract
 * @param address Contract address
 * @param provider Web3 provider
 * @returns Token standard or null if not a token
 */
export async function detectTokenStandard(address: string, provider: Web3Provider): Promise<'ERC20' | 'ERC721' | 'ERC1155' | null> {
  try {
    // Try ERC-721 and ERC-1155 first since they have supportsInterface
    if (await isERC721(address, provider)) {
      return 'ERC721';
    }
    
    if (await isERC1155(address, provider)) {
      return 'ERC1155';
    }
    
    // Finally try ERC-20
    if (await isERC20(address, provider)) {
      return 'ERC20';
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting token standard:', error);
    return null;
  }
}

/**
 * Get ERC-20 token metadata
 * @param tokenAddress Token contract address
 * @param chainId Chain ID
 * @param forceRefresh Force refresh from blockchain
 * @returns Token metadata
 */
export async function getERC20TokenMetadata(
  tokenAddress: string,
  chainId: number,
  forceRefresh = false
): Promise<TokenMetadata> {
  const cacheKey = generateTokenCacheKey(tokenAddress, chainId);
  
  // Check cache first
  if (!forceRefresh && tokenCache[cacheKey]) {
    return tokenCache[cacheKey];
  }
  
  // Check persistent storage
  if (!forceRefresh) {
    const cachedData = await storage.BlockchainCache.get(`token-${cacheKey}`);
    if (cachedData) {
      tokenCache[cacheKey] = cachedData;
      return cachedData;
    }
  }
  
  // Get the wallet connector
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  try {
    return await measurePerformance(async () => {
      const contract = getERC20Contract(tokenAddress, provider);
      
      // Fetch token metadata
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);
      
      // Create metadata object
      const metadata: TokenMetadata = {
        address: tokenAddress,
        chainId,
        name,
        symbol,
        decimals,
        standard: 'ERC20',
        totalSupply: totalSupply.toString(),
        formattedTotalSupply: formatUnits(totalSupply, decimals)
      };
      
      // If connected, get balance
      if (connector.isConnected() && connector.getAddress()) {
        const balance = await contract.balanceOf(connector.getAddress());
        metadata.balance = balance.toString();
        metadata.formattedBalance = formatUnits(balance, decimals);
      }
      
      // Cache the result
      tokenCache[cacheKey] = metadata;
      
      // Store in persistent cache
      await storage.BlockchainCache.set(`token-${cacheKey}`, metadata, chainId, 60 * 60 * 24); // 24 hours
      
      return metadata;
    }, 'getERC20TokenMetadata');
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error fetching ERC-20 metadata:', web3Error);
    throw error;
  }
}

/**
 * Get ERC-20 token balance
 * @param tokenAddress Token contract address
 * @param ownerAddress Token owner address
 * @param chainId Chain ID
 * @returns Token balance as string (formatted and raw)
 */
export async function getERC20Balance(
  tokenAddress: string,
  ownerAddress: string,
  chainId: number
): Promise<{ raw: string; formatted: string }> {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  try {
    // Get token metadata to get decimals
    const metadata = await getERC20TokenMetadata(tokenAddress, chainId);
    
    // Get token contract
    const contract = getERC20Contract(tokenAddress, provider);
    
    // Get balance
    const balance = await contract.balanceOf(ownerAddress);
    
    return {
      raw: balance.toString(),
      formatted: formatUnits(balance, metadata.decimals)
    };
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error fetching ERC-20 balance:', web3Error);
    throw error;
  }
}

/**
 * Transfer ERC-20 tokens
 * @param tokenAddress Token contract address
 * @param toAddress Recipient address
 * @param amount Amount to transfer (in token units)
 * @param options Additional options
 * @returns Transaction hash
 */
export async function transferERC20(
  tokenAddress: string,
  toAddress: string,
  amount: string,
  options: {
    chainId?: number;
    decimals?: number;
    onSuccess?: (txHash: string) => void;
  } = {}
): Promise<string> {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  const signer = connector.getSigner();
  
  if (!provider || !signer) {
    throw new Error('No provider or signer available');
  }
  
  // Determine chainId
  const chainId = options.chainId || connector.getChainId() || 1;
  
  // Switch network if needed
  if (connector.getChainId() !== chainId) {
    await connector.switchToNetwork(chainId);
  }
  
  try {
    // Get token metadata if decimals not provided
    let decimals = options.decimals;
    if (decimals === undefined) {
      const metadata = await getERC20TokenMetadata(tokenAddress, chainId);
      decimals = metadata.decimals;
    }
    
    // Get token contract with signer
    const contract = getERC20Contract(tokenAddress, provider).connect(signer);
    
    // Parse amount with the correct decimals
    const parsedAmount = parseUnits(amount, decimals);
    
    // Send transaction
    const tx = await contract.transfer(toAddress, parsedAmount);
    
    // Wait for transaction confirmation
    // Note: we don't await this to return the tx hash immediately
    tx.wait().then(() => {
      if (options.onSuccess) {
        options.onSuccess(tx.hash);
      }
    }).catch(console.error);
    
    return tx.hash;
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error transferring ERC-20 tokens:', web3Error);
    throw error;
  }
}

/**
 * Approve ERC-20 tokens for spending by another address
 * @param tokenAddress Token contract address
 * @param spenderAddress Spender address
 * @param amount Amount to approve (in token units)
 * @param options Additional options
 * @returns Transaction hash
 */
export async function approveERC20(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  options: {
    chainId?: number;
    decimals?: number;
    onSuccess?: (txHash: string) => void;
  } = {}
): Promise<string> {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  const signer = connector.getSigner();
  
  if (!provider || !signer) {
    throw new Error('No provider or signer available');
  }
  
  // Determine chainId
  const chainId = options.chainId || connector.getChainId() || 1;
  
  // Switch network if needed
  if (connector.getChainId() !== chainId) {
    await connector.switchToNetwork(chainId);
  }
  
  try {
    // Get token metadata if decimals not provided
    let decimals = options.decimals;
    if (decimals === undefined) {
      const metadata = await getERC20TokenMetadata(tokenAddress, chainId);
      decimals = metadata.decimals;
    }
    
    // Get token contract with signer
    const contract = getERC20Contract(tokenAddress, provider).connect(signer);
    
    // Parse amount with the correct decimals
    const parsedAmount = parseUnits(amount, decimals);
    
    // Send transaction
    const tx = await contract.approve(spenderAddress, parsedAmount);
    
    // Wait for transaction confirmation
    // Note: we don't await this to return the tx hash immediately
    tx.wait().then(() => {
      if (options.onSuccess) {
        options.onSuccess(tx.hash);
      }
    }).catch(console.error);
    
    return tx.hash;
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error approving ERC-20 tokens:', web3Error);
    throw error;
  }
}

/**
 * Get ERC-20 token allowance
 * @param tokenAddress Token contract address
 * @param ownerAddress Token owner address
 * @param spenderAddress Spender address
 * @param chainId Chain ID
 * @returns Allowance as string (formatted and raw)
 */
export async function getERC20Allowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  chainId: number
): Promise<{ raw: string; formatted: string }> {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  try {
    // Get token metadata to get decimals
    const metadata = await getERC20TokenMetadata(tokenAddress, chainId);
    
    // Get token contract
    const contract = getERC20Contract(tokenAddress, provider);
    
    // Get allowance
    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    
    return {
      raw: allowance.toString(),
      formatted: formatUnits(allowance, metadata.decimals)
    };
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error fetching ERC-20 allowance:', web3Error);
    throw error;
  }
}

/**
 * Get an NFT's metadata
 * @param contractAddress NFT contract address
 * @param tokenId Token ID
 * @param chainId Chain ID
 * @param forceRefresh Force refresh from blockchain
 * @returns NFT metadata
 */
export async function getNFTMetadata(
  contractAddress: string,
  tokenId: string,
  chainId: number,
  forceRefresh = false
): Promise<NFTMetadata> {
  const cacheKey = generateNFTCacheKey(contractAddress, tokenId, chainId);
  
  // Check cache first
  if (!forceRefresh && nftCache[cacheKey]) {
    return nftCache[cacheKey];
  }
  
  // Check persistent storage
  if (!forceRefresh) {
    const cachedData = await storage.BlockchainCache.get(`nft-${cacheKey}`);
    if (cachedData) {
      nftCache[cacheKey] = cachedData;
      return cachedData;
    }
  }
  
  // Get the wallet connector
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  
  if (!provider) {
    throw new Error('No provider available');
  }
  
  try {
    return await measurePerformance(async () => {
      // Detect token standard
      const standard = await detectTokenStandard(contractAddress, provider);
      
      if (standard !== 'ERC721' && standard !== 'ERC1155') {
        throw new Error('Contract is not an NFT');
      }
      
      // Initialize metadata
      const metadata: NFTMetadata = {
        tokenId,
        contractAddress,
        chainId,
        standard,
      };
      
      // Get contract based on standard
      const contract = standard === 'ERC721'
        ? getERC721Contract(contractAddress, provider)
        : getERC1155Contract(contractAddress, provider);
      
      // Get token URI
      let tokenURI: string;
      if (standard === 'ERC721') {
        // For ERC-721, we can get the token URI directly
        tokenURI = await contract.tokenURI(tokenId);
        
        // Get owner for ERC-721
        metadata.owner = await contract.ownerOf(tokenId);
      } else {
        // For ERC-1155, we need to call uri() and replace the ID
        const baseURI = await contract.uri(tokenId);
        tokenURI = baseURI.replace('{id}', tokenId);
      }
      
      // Store the token URI
      metadata.tokenURI = tokenURI;
      
      // Fetch metadata from URI
      const fetchedMetadata = await fetchNFTMetadataFromURI(tokenURI);
      
      // Merge fetched metadata with our metadata
      const result = {
        ...metadata,
        ...fetchedMetadata,
      };
      
      // Cache the result
      nftCache[cacheKey] = result;
      
      // Store in persistent cache
      await storage.BlockchainCache.set(`nft-${cacheKey}`, result, chainId, 60 * 60 * 24); // 24 hours
      
      return result;
    }, 'getNFTMetadata');
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error fetching NFT metadata:', web3Error);
    throw error;
  }
}

/**
 * Fetch NFT metadata from a URI
 * @param uri Token URI
 * @returns Metadata from URI
 */
async function fetchNFTMetadataFromURI(uri: string): Promise<Partial<NFTMetadata>> {
  try {
    // Convert IPFS URI to HTTPS if needed
    const httpsURI = convertIPFStoHTTPS(uri);
    
    // Fetch the metadata
    const response = await fetch(httpsURI);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert IPFS image URL to HTTPS if needed
    if (data.image) {
      data.image = convertIPFStoHTTPS(data.image);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching NFT metadata from URI:', error);
    return {};
  }
}

/**
 * Convert IPFS URI to HTTPS URI
 * @param uri IPFS URI
 * @returns HTTPS URI
 */
function convertIPFStoHTTPS(uri: string): string {
  if (!uri) return uri;
  
  // Handle ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // Handle ipfs:/ protocol (sometimes found in the wild)
  if (uri.startsWith('ipfs:/')) {
    return uri.replace('ipfs:/', 'https://ipfs.io/ipfs/');
  }
  
  // Handle /ipfs/ path
  if (uri.startsWith('/ipfs/')) {
    return `https://ipfs.io${uri}`;
  }
  
  return uri;
}

/**
 * Transfer an ERC-721 NFT
 * @param contractAddress NFT contract address
 * @param toAddress Recipient address
 * @param tokenId Token ID
 * @param options Additional options
 * @returns Transaction hash
 */
export async function transferERC721(
  contractAddress: string,
  toAddress: string,
  tokenId: string,
  options: {
    chainId?: number;
    safe?: boolean;
    onSuccess?: (txHash: string) => void;
  } = {}
): Promise<string> {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  const signer = connector.getSigner();
  
  if (!provider || !signer) {
    throw new Error('No provider or signer available');
  }
  
  // Determine chainId
  const chainId = options.chainId || connector.getChainId() || 1;
  
  // Switch network if needed
  if (connector.getChainId() !== chainId) {
    await connector.switchToNetwork(chainId);
  }
  
  // Get owner address
  const fromAddress = connector.getAddress();
  if (!fromAddress) {
    throw new Error('No wallet connected');
  }
  
  try {
    // Get contract with signer
    const contract = getERC721Contract(contractAddress, provider).connect(signer);
    
    // Send transaction - use safeTransferFrom if requested
    const tx = options.safe !== false
      ? await contract.safeTransferFrom(fromAddress, toAddress, tokenId)
      : await contract.transferFrom(fromAddress, toAddress, tokenId);
    
    // Wait for transaction confirmation
    // Note: we don't await this to return the tx hash immediately
    tx.wait().then(() => {
      if (options.onSuccess) {
        options.onSuccess(tx.hash);
      }
    }).catch(console.error);
    
    return tx.hash;
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error transferring ERC-721 NFT:', web3Error);
    throw error;
  }
}

/**
 * Transfer an ERC-1155 NFT
 * @param contractAddress NFT contract address
 * @param toAddress Recipient address
 * @param tokenId Token ID
 * @param amount Amount to transfer
 * @param options Additional options
 * @returns Transaction hash
 */
export async function transferERC1155(
  contractAddress: string,
  toAddress: string,
  tokenId: string,
  amount: string,
  options: {
    chainId?: number;
    data?: string;
    onSuccess?: (txHash: string) => void;
  } = {}
): Promise<string> {
  const connector = getWalletConnector();
  const provider = connector.getProvider();
  const signer = connector.getSigner();
  
  if (!provider || !signer) {
    throw new Error('No provider or signer available');
  }
  
  // Determine chainId
  const chainId = options.chainId || connector.getChainId() || 1;
  
  // Switch network if needed
  if (connector.getChainId() !== chainId) {
    await connector.switchToNetwork(chainId);
  }
  
  // Get owner address
  const fromAddress = connector.getAddress();
  if (!fromAddress) {
    throw new Error('No wallet connected');
  }
  
  try {
    // Get contract with signer
    const contract = getERC1155Contract(contractAddress, provider).connect(signer);
    
    // Convert amount to BigNumber
    const amountBN = BigNumber.from(amount);
    
    // Send transaction
    const tx = await contract.safeTransferFrom(
      fromAddress,
      toAddress,
      tokenId,
      amountBN,
      options.data || '0x'
    );
    
    // Wait for transaction confirmation
    // Note: we don't await this to return the tx hash immediately
    tx.wait().then(() => {
      if (options.onSuccess) {
        options.onSuccess(tx.hash);
      }
    }).catch(console.error);
    
    return tx.hash;
  } catch (error) {
    const web3Error = identifyWeb3Error(error);
    console.error('Error transferring ERC-1155 NFT:', web3Error);
    throw error;
  }
}

/**
 * Format a token amount for display
 * @param amount Raw token amount
 * @param decimals Token decimals
 * @param maxDecimals Maximum decimals to display
 * @param symbol Token symbol to append
 * @returns Formatted amount string
 */
export function formatTokenAmount(
  amount: string | BigNumber,
  decimals: number,
  maxDecimals = 4,
  symbol?: string
): string {
  // Convert to string if BigNumber
  const amountStr = typeof amount === 'string' ? amount : amount.toString();
  
  // Format units
  const formatted = formatUnits(amountStr, decimals);
  
  // Parse to a number
  const value = parseFloat(formatted);
  
  // Format with the appropriate precision
  const formattedValue = value < 0.0001
    ? '< 0.0001'
    : value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      });
  
  // Append symbol if provided
  return symbol ? `${formattedValue} ${symbol}` : formattedValue;
}

/**
 * Get token explorer URL
 * @param tokenAddress Token contract address
 * @param chainId Chain ID
 * @returns Token explorer URL
 */
export function getTokenExplorerUrl(tokenAddress: string, chainId: number): string {
  return getExplorerTokenUrl(tokenAddress, chainId);
}

/**
 * Clear token cache
 * @param address Token address (optional, clears all if not provided)
 * @param chainId Chain ID (optional, clears all chains if not provided)
 */
export function clearTokenCache(address?: string, chainId?: number): void {
  if (!address && !chainId) {
    // Clear all cache
    Object.keys(tokenCache).forEach(key => delete tokenCache[key]);
    Object.keys(nftCache).forEach(key => delete nftCache[key]);
    return;
  }
  
  // Clear specific token or chain
  Object.keys(tokenCache).forEach(key => {
    const [cacheChainId, cacheAddress] = key.split('-');
    
    if (
      (chainId && parseInt(cacheChainId) === chainId) ||
      (address && cacheAddress === address.toLowerCase())
    ) {
      delete tokenCache[key];
    }
  });
  
  // Clear specific NFT or chain
  Object.keys(nftCache).forEach(key => {
    const [cacheChainId, cacheAddress] = key.split('-');
    
    if (
      (chainId && parseInt(cacheChainId) === chainId) ||
      (address && cacheAddress === address.toLowerCase())
    ) {
      delete nftCache[key];
    }
  });
}

/**
 * React hook for token data
 * @param tokenAddress Token contract address
 * @param chainId Chain ID
 * @returns Token data and utilities
 */
export function useToken(tokenAddress: string | null, chainId?: number) {
  const connector = getWalletConnector();
  const actualChainId = chainId || connector.getChainId() || 1;
  
  if (!tokenAddress) {
    return {
      loading: false,
      error: null,
      token: null,
      refetch: () => Promise.resolve(null),
      transfer: () => Promise.reject(new Error('No token address')),
      approve: () => Promise.reject(new Error('No token address')),
    };
  }
  
  return {
    loading: false, // This would be replaced with state in a real React hook
    error: null,
    token: tokenCache[generateTokenCacheKey(tokenAddress, actualChainId)] || null,
    refetch: () => getERC20TokenMetadata(tokenAddress, actualChainId, true),
    transfer: (to: string, amount: string) => transferERC20(tokenAddress, to, amount, { chainId: actualChainId }),
    approve: (spender: string, amount: string) => approveERC20(tokenAddress, spender, amount, { chainId: actualChainId }),
  };
}

/**
 * React hook for NFT data
 * @param contractAddress NFT contract address
 * @param tokenId Token ID
 * @param chainId Chain ID
 * @returns NFT data and utilities
 */
export function useNFT(contractAddress: string | null, tokenId: string | null, chainId?: number) {
  const connector = getWalletConnector();
  const actualChainId = chainId || connector.getChainId() || 1;
  
  if (!contractAddress || !tokenId) {
    return {
      loading: false,
      error: null,
      nft: null,
      refetch: () => Promise.resolve(null),
      transfer: () => Promise.reject(new Error('No NFT address or token ID')),
    };
  }
  
  return {
    loading: false, // This would be replaced with state in a real React hook
    error: null,
    nft: nftCache[generateNFTCacheKey(contractAddress, tokenId, actualChainId)] || null,
    refetch: () => getNFTMetadata(contractAddress, tokenId, actualChainId, true),
    transfer: (to: string) => {
      const nft = nftCache[generateNFTCacheKey(contractAddress, tokenId, actualChainId)];
      if (!nft) {
        return Promise.reject(new Error('NFT metadata not loaded'));
      }
      
      if (nft.standard === 'ERC721') {
        return transferERC721(contractAddress, to, tokenId, { chainId: actualChainId });
      } else {
        return transferERC1155(contractAddress, to, tokenId, '1', { chainId: actualChainId });
      }
    },
  };
} 