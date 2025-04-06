import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { ethers } from 'ethers';
import Head from 'next/head';
import { getWalletConnector, WalletType } from '../utils/wallet-connector';
import { getIdentityManager, formatDid, calculateTrustScore } from '../utils/identity-manager';
import { useWeb3Storage } from '../hooks/useWeb3Storage';
import { BlockchainDashboard } from '../components/analytics/DashboardComponents';
import { ContractInteractionPanel } from '../components/contracts/ContractInteractionPanel';
import { ChainSwitcher, NetworkBadge } from '../components/multichain/ChainSwitcher';
import { OnboardingProvider, StartOnboardingButton } from '../components/onboarding/OnboardingFlow';

// ERC20 ABI (minimal for demo)
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint amount)'
];

// WETH address on Ethereum mainnet
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

// Sample transaction data
const EXAMPLE_TX_DATA = [
  { date: '2023-05-01', count: 837 },
  { date: '2023-05-02', count: 912 },
  { date: '2023-05-03', count: 758 },
  { date: '2023-05-04', count: 1043 },
  { date: '2023-05-05', count: 891 },
  { date: '2023-05-06', count: 674 },
  { date: '2023-05-07', count: 742 }
];

// Component to display user's identity
const IdentityCard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const identityManager = getIdentityManager();
        
        // Try to get existing profile
        let userProfile = await identityManager.getProfile();
        
        // If no profile exists, create one
        if (!userProfile) {
          // Create a DID if wallet is connected
          const walletConnector = getWalletConnector();
          const isConnected = walletConnector.isConnected();
          
          if (isConnected) {
            await identityManager.createDid('ethr');
            userProfile = await identityManager.getProfile();
          }
        }
        
        setProfile(userProfile);
      } catch (error) {
        console.error('Failed to load identity profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    loadProfile();
  }, []);
  
  // When wallet is connected, update profile
  useEffect(() => {
    const walletConnector = getWalletConnector();
    
    const handleAccountChanged = async () => {
      if (walletConnector.isConnected()) {
        try {
          const identityManager = getIdentityManager();
          
          // Check if we have a profile
          const existingProfile = await identityManager.getProfile();
          
          if (!existingProfile) {
            // Create a new DID
            await identityManager.createDid('ethr');
            const newProfile = await identityManager.getProfile();
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Failed to update identity profile:', error);
        }
      }
    };
    
    walletConnector.addAccountChangedListener(handleAccountChanged);
    
    return () => {
      walletConnector.removeAccountChangedListener(handleAccountChanged);
    };
  }, []);
  
  if (isLoadingProfile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-2">Identity</h3>
        <p className="text-gray-600 mb-4">
          Connect your wallet to create a decentralized identity (DID).
        </p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={async () => {
            try {
              const walletConnector = getWalletConnector();
              await walletConnector.connect(WalletType.AUTO);
              
              // Now create a DID
              const identityManager = getIdentityManager();
              await identityManager.createDid('ethr');
              const newProfile = await identityManager.getProfile();
              setProfile(newProfile);
            } catch (error) {
              console.error('Failed to connect wallet and create DID:', error);
            }
          }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }
  
  const trustScore = calculateTrustScore(profile);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Decentralized Identity</h3>
      
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Identifier (DID)</p>
          <p className="font-mono text-sm break-all">{formatDid(profile.did, 30)}</p>
        </div>
        
        <div className="ml-4 flex-shrink-0 bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center">
          <div className="text-blue-800 font-bold text-xl">{trustScore}</div>
          <div className="text-blue-800 text-xs ml-0.5">score</div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Network</p>
        <div className="flex items-center">
          <NetworkBadge />
        </div>
      </div>
      
      {profile.ensName && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">ENS Name</p>
          <p>{profile.ensName}</p>
        </div>
      )}
      
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Credentials</p>
        <p>{profile.credentials.length} verifiable credentials</p>
      </div>
      
      {profile.credentials.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-sm mb-2">Recent Credentials</h4>
          <div className="max-h-40 overflow-y-auto">
            {profile.credentials.slice(0, 3).map((credential: any, index: number) => (
              <div key={index} className="p-2 mb-2 bg-gray-50 border border-gray-100 rounded text-xs">
                <div className="font-medium">{credential.type[1]}</div>
                <div className="text-gray-500">Issued: {new Date(credential.issuanceDate).toLocaleDateString()}</div>
              </div>
            ))}
            
            {profile.credentials.length > 3 && (
              <div className="text-blue-500 text-sm text-center mt-2">
                +{profile.credentials.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Component to display wallet information
const WalletCard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const walletConnector = getWalletConnector();
    
    const updateWalletInfo = async () => {
      setIsConnected(walletConnector.isConnected());
      
      if (walletConnector.isConnected()) {
        const addr = await walletConnector.getAddress();
        setAddress(addr || '');
        
        try {
          const provider = walletConnector.getProvider();
          const bal = await provider.getBalance(addr);
          setBalance(ethers.utils.formatEther(bal));
        } catch (error) {
          console.error('Failed to get balance:', error);
          setBalance('Error');
        }
      } else {
        setAddress('');
        setBalance('');
      }
    };
    
    updateWalletInfo();
    
    const handleAccountChanged = updateWalletInfo;
    walletConnector.addAccountChangedListener(handleAccountChanged);
    
    return () => {
      walletConnector.removeAccountChangedListener(handleAccountChanged);
    };
  }, []);
  
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const walletConnector = getWalletConnector();
      await walletConnector.connect(WalletType.AUTO);
      
      setIsConnected(walletConnector.isConnected());
      const addr = await walletConnector.getAddress();
      setAddress(addr || '');
      
      try {
        const provider = walletConnector.getProvider();
        const bal = await provider.getBalance(addr);
        setBalance(ethers.utils.formatEther(bal));
      } catch (error) {
        console.error('Failed to get balance:', error);
        setBalance('Error');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      const walletConnector = getWalletConnector();
      await walletConnector.disconnect();
      
      setIsConnected(false);
      setAddress('');
      setBalance('');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Wallet</h3>
      
      {isConnected ? (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Address</p>
            <p className="font-mono text-sm break-all">{address}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Balance</p>
            <p>{parseFloat(balance).toFixed(4)} ETH</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Network</p>
            <NetworkBadge />
          </div>
          
          <button
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">
            Connect your wallet to interact with the blockchain.
          </p>
          
          <button
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      )}
    </div>
  );
};

// Main page component
export default function IntegratedWeb3Experience() {
  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Web3 Experience | WowzaRush</title>
          <meta name="description" content="Integrated Web3 experience with blockchain visualization, smart contract interaction, and identity management" />
        </Head>
        
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">WowzaRush Web3 Experience</h1>
            
            <div className="flex items-center space-x-4">
              <NetworkBadge />
              <StartOnboardingButton className="text-sm" />
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top row - Identity and Wallet */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <IdentityCard />
            <WalletCard />
          </div>
          
          {/* Chain Switcher */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Network Selector</h3>
            <p className="text-gray-600 mb-4">
              Switch between different blockchain networks or bridge assets.
            </p>
            
            <ChainSwitcher horizontal={true} />
          </div>
          
          {/* Dashboard */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Blockchain Analytics</h3>
            <BlockchainDashboard />
          </div>
          
          {/* Contract Interaction */}
          <div className="mb-8">
            <ContractInteractionPanel 
              address={WETH_ADDRESS}
              abi={ERC20_ABI}
              title="Contract Interaction: WETH"
              description="Interact with the Wrapped Ether (WETH) contract on Ethereum. This contract allows you to wrap and unwrap ETH."
            />
          </div>
          
          {/* Resources */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <p className="text-gray-600 mb-4">
              Learn more about Web3 and how to use this application.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/docs/getting-started"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h4 className="font-medium mb-2">Getting Started</h4>
                <p className="text-sm text-gray-600">Learn the basics of Web3 and how to use this application.</p>
              </a>
              
              <a 
                href="/docs/identity"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h4 className="font-medium mb-2">Decentralized Identity</h4>
                <p className="text-sm text-gray-600">Learn about DIDs and verifiable credentials.</p>
              </a>
              
              <a 
                href="/docs/multichain"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h4 className="font-medium mb-2">Multi-chain Development</h4>
                <p className="text-sm text-gray-600">Learn how to build applications that work across multiple blockchains.</p>
              </a>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600">
                  &copy; {new Date().getFullYear()} WowzaRush. All rights reserved.
                </p>
              </div>
              
              <div className="flex space-x-6">
                <a href="/terms" className="text-gray-600 hover:text-gray-900">Terms</a>
                <a href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</a>
                <a href="/docs" className="text-gray-600 hover:text-gray-900">Documentation</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </OnboardingProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
}; 