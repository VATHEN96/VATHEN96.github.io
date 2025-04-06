import React, { useState, useEffect, useMemo } from 'react';
import { getWalletConnector } from '../../utils/wallet-connector';
import { getIdentityManager } from '../../utils/identity-manager';
import { logEvent } from '../../utils/analytics';
import Image from 'next/image';

// Define blockchain network types
interface ChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconUrl: string;
}

interface BridgeConfig {
  name: string;
  sourceChainId: number;
  targetChainId: number;
  url: string;
  logoUrl: string;
  supportedTokens?: string[]; // Optional list of supported token addresses
}

// Supported chains configuration
const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  // Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3/${INFURA_API_KEY}'],
    blockExplorerUrls: ['https://etherscan.io'],
    iconUrl: '/assets/networks/ethereum.svg'
  },
  // Polygon
  137: {
    chainId: 137,
    name: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    iconUrl: '/assets/networks/polygon.svg'
  },
  // Optimism
  10: {
    chainId: 10,
    name: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    iconUrl: '/assets/networks/optimism.svg'
  },
  // Arbitrum
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    iconUrl: '/assets/networks/arbitrum.svg'
  },
  // Base
  8453: {
    chainId: 8453,
    name: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    iconUrl: '/assets/networks/base.svg'
  }
};

// Bridge configurations
const BRIDGE_CONFIGS: BridgeConfig[] = [
  {
    name: 'Polygon Bridge',
    sourceChainId: 1,
    targetChainId: 137,
    url: 'https://wallet.polygon.technology/bridge',
    logoUrl: '/assets/bridges/polygon-bridge.svg'
  },
  {
    name: 'Optimism Bridge',
    sourceChainId: 1,
    targetChainId: 10,
    url: 'https://app.optimism.io/bridge',
    logoUrl: '/assets/bridges/optimism-bridge.svg'
  },
  {
    name: 'Arbitrum Bridge',
    sourceChainId: 1,
    targetChainId: 42161,
    url: 'https://bridge.arbitrum.io',
    logoUrl: '/assets/bridges/arbitrum-bridge.svg'
  },
  {
    name: 'Base Bridge',
    sourceChainId: 1,
    targetChainId: 8453,
    url: 'https://bridge.base.org',
    logoUrl: '/assets/bridges/base-bridge.svg'
  },
  {
    name: 'Hop Protocol',
    sourceChainId: 1,
    targetChainId: 137,
    url: 'https://app.hop.exchange/#/send?token=ETH&sourceNetwork=ethereum&destNetwork=polygon',
    logoUrl: '/assets/bridges/hop.svg'
  },
  {
    name: 'Hop Protocol',
    sourceChainId: 1,
    targetChainId: 10,
    url: 'https://app.hop.exchange/#/send?token=ETH&sourceNetwork=ethereum&destNetwork=optimism',
    logoUrl: '/assets/bridges/hop.svg'
  },
  {
    name: 'Hop Protocol',
    sourceChainId: 1,
    targetChainId: 42161,
    url: 'https://app.hop.exchange/#/send?token=ETH&sourceNetwork=ethereum&destNetwork=arbitrum',
    logoUrl: '/assets/bridges/hop.svg'
  }
];

interface ChainSwitcherProps {
  onChainSwitch?: (chainId: number) => void;
  showBridgeOptions?: boolean;
  horizontal?: boolean;
}

/**
 * ChainSwitcher Component
 * A UI for switching between different blockchain networks
 */
export function ChainSwitcher({
  onChainSwitch,
  showBridgeOptions = true,
  horizontal = false
}: ChainSwitcherProps) {
  // Current chain ID
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Bridge modal state
  const [showBridgeModal, setShowBridgeModal] = useState<boolean>(false);
  
  // Selected target chain for bridge
  const [bridgeTargetChain, setBridgeTargetChain] = useState<number | null>(null);
  
  // Get all chain IDs
  const chainIds = useMemo(() => Object.keys(SUPPORTED_CHAINS).map(id => parseInt(id)), []);
  
  // Get current chain on component mount
  useEffect(() => {
    const fetchCurrentChain = async () => {
      try {
        const walletConnector = getWalletConnector();
        const chainId = await walletConnector.getChainId();
        setCurrentChainId(chainId);
      } catch (err) {
        console.error('Error fetching current chain:', err);
      }
    };
    
    fetchCurrentChain();
    
    // Listen for chain changes
    const walletConnector = getWalletConnector();
    const onChainChanged = (chainId: number) => {
      setCurrentChainId(chainId);
      if (onChainSwitch) {
        onChainSwitch(chainId);
      }
    };
    
    walletConnector.addChainChangedListener(onChainChanged);
    
    return () => {
      walletConnector.removeChainChangedListener(onChainChanged);
    };
  }, [onChainSwitch]);
  
  // Handle chain switch
  const handleChainSwitch = async (chainId: number) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const walletConnector = getWalletConnector();
      await walletConnector.switchNetwork(chainId);
      
      setCurrentChainId(chainId);
      
      // Log event
      logEvent('chain_switch', {
        chainId: chainId.toString(),
        chainName: SUPPORTED_CHAINS[chainId]?.name || 'Unknown'
      });
      
      // Create a credential for chain usage
      try {
        const identityManager = getIdentityManager();
        const profile = await identityManager.getProfile();
        
        if (profile) {
          await identityManager.addCredential({
            '@context': [
              'https://www.w3.org/2018/credentials/v1',
              'https://www.w3.org/2018/credentials/examples/v1'
            ],
            type: ['VerifiableCredential', 'NetworkUsageCredential'],
            issuer: profile.did,
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
              id: profile.did,
              network: {
                chainId: chainId,
                name: SUPPORTED_CHAINS[chainId]?.name || 'Unknown'
              },
              action: 'networked_on',
              timestamp: Date.now()
            }
          });
        }
      } catch (vcError) {
        console.warn('Failed to create VC for network usage:', vcError);
      }
      
      // Call onChainSwitch callback
      if (onChainSwitch) {
        onChainSwitch(chainId);
      }
    } catch (err: any) {
      console.error('Error switching chain:', err);
      setError(err.message || 'Failed to switch network');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle bridge option click
  const handleBridgeClick = (targetChainId: number) => {
    setBridgeTargetChain(targetChainId);
    setShowBridgeModal(true);
  };
  
  // Get available bridges for current chain
  const availableBridges = useMemo(() => {
    if (!currentChainId) return [];
    
    return BRIDGE_CONFIGS.filter(
      bridge => bridge.sourceChainId === currentChainId
    );
  }, [currentChainId]);
  
  // Get bridge options for a specific target chain
  const getBridgeOptionsForChain = (targetChainId: number) => {
    if (!currentChainId) return [];
    
    return BRIDGE_CONFIGS.filter(
      bridge => 
        bridge.sourceChainId === currentChainId && 
        bridge.targetChainId === targetChainId
    );
  };
  
  // Bridge modal component
  const BridgeModal = () => {
    if (!bridgeTargetChain || !showBridgeModal) return null;
    
    const bridgeOptions = getBridgeOptionsForChain(bridgeTargetChain);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold mb-4">
            Bridge to {SUPPORTED_CHAINS[bridgeTargetChain]?.name}
          </h3>
          
          <p className="text-gray-600 mb-4">
            Select a bridge provider to move your assets from {
              SUPPORTED_CHAINS[currentChainId!]?.name
            } to {SUPPORTED_CHAINS[bridgeTargetChain]?.name}.
          </p>
          
          {bridgeOptions.length > 0 ? (
            <div className="space-y-3">
              {bridgeOptions.map((bridge, index) => (
                <a
                  key={index}
                  href={bridge.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    logEvent('bridge_selected', {
                      bridgeName: bridge.name,
                      sourceChain: SUPPORTED_CHAINS[currentChainId!]?.name,
                      targetChain: SUPPORTED_CHAINS[bridgeTargetChain]?.name
                    });
                  }}
                >
                  <div className="w-10 h-10 mr-3 relative">
                    <Image
                      src={bridge.logoUrl}
                      alt={bridge.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{bridge.name}</h4>
                    <p className="text-sm text-gray-500">
                      {SUPPORTED_CHAINS[currentChainId!]?.name} → {SUPPORTED_CHAINS[bridgeTargetChain]?.name}
                    </p>
                  </div>
                  <span className="ml-auto text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
              No direct bridges found between these networks. Try using a general bridge like Hop Protocol or Connext.
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              onClick={() => setShowBridgeModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Chain button component
  const ChainButton = ({ chainId }: { chainId: number }) => {
    const chain = SUPPORTED_CHAINS[chainId];
    const isActive = currentChainId === chainId;
    const bridges = getBridgeOptionsForChain(chainId);
    const hasBridge = bridges.length > 0;
    
    return (
      <div className="flex flex-col items-center">
        <button
          className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
            isActive 
              ? 'ring-2 ring-blue-500 ring-offset-2' 
              : 'hover:bg-gray-100'
          }`}
          onClick={() => handleChainSwitch(chainId)}
          disabled={isLoading || isActive}
          title={`Switch to ${chain.name}`}
        >
          <Image
            src={chain.iconUrl}
            alt={chain.name}
            width={36}
            height={36}
            className="rounded-full"
          />
          
          {isActive && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        
        <span className="mt-1 text-xs font-medium">{chain.name}</span>
        
        {showBridgeOptions && hasBridge && !isActive && (
          <button
            className="mt-1 text-xs text-blue-500 hover:text-blue-700"
            onClick={() => handleBridgeClick(chainId)}
          >
            Bridge
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div className="relative">
      <div className={`flex ${horizontal ? 'flex-row space-x-4' : 'flex-col space-y-4'} items-center`}>
        {chainIds.map(chainId => (
          <ChainButton key={chainId} chainId={chainId} />
        ))}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {/* Bridge Modal */}
      {showBridgeModal && <BridgeModal />}
    </div>
  );
}

/**
 * Simple Network Badge Component
 */
export function NetworkBadge() {
  const [chainId, setChainId] = useState<number | null>(null);
  
  useEffect(() => {
    const fetchCurrentChain = async () => {
      try {
        const walletConnector = getWalletConnector();
        const chainId = await walletConnector.getChainId();
        setChainId(chainId);
      } catch (err) {
        console.error('Error fetching current chain:', err);
      }
    };
    
    fetchCurrentChain();
    
    // Listen for chain changes
    const walletConnector = getWalletConnector();
    walletConnector.addChainChangedListener(setChainId);
    
    return () => {
      walletConnector.removeChainChangedListener(setChainId);
    };
  }, []);
  
  if (!chainId || !SUPPORTED_CHAINS[chainId]) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">
        Unknown Network
      </span>
    );
  }
  
  const chain = SUPPORTED_CHAINS[chainId];
  
  return (
    <div className="flex items-center space-x-1.5">
      <div className="w-4 h-4 relative">
        <Image
          src={chain.iconUrl}
          alt={chain.name}
          width={16}
          height={16}
          className="rounded-full"
        />
      </div>
      <span className="text-xs font-medium">{chain.name}</span>
    </div>
  );
} 