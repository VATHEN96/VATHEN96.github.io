'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function ContractTestPage() {
  const [address, setAddress] = useState('0xf97cb339e663eb826093e44bafd1383615c48ae1');
  const [network, setNetwork] = useState('https://testnet.telos.net/evm');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [browserTest, setBrowserTest] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  // Check for active MetaMask connection
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.listAccounts();
          setConnected(accounts.length > 0);
          
          if (accounts.length > 0) {
            const network = await provider.getNetwork();
            setChainId(network.chainId);
          }
        } catch (err) {
          console.error("Error checking wallet:", err);
        }
      }
    };
    
    checkWallet();
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnected(true);
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        setChainId(network.chainId);
      } catch (err) {
        console.error("Error connecting wallet:", err);
      }
    }
  };

  const testContract = async () => {
    setLoading(true);
    try {
      // Server-side test
      const response = await fetch(`/api/contract-test?address=${address}&network=${network}`);
      const data = await response.json();
      setResult(data);
      
      // Browser-side test
      await testInBrowser();
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testInBrowser = async () => {
    try {
      const browserResults = { connected: false, chainId: null, contractExists: false, functions: [], errors: [] };
      
      // Test MetaMask connection
      if (typeof window.ethereum !== 'undefined') {
        browserResults.connected = true;
        
        // Get provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        browserResults.chainId = network.chainId;
        
        // Check if contract exists
        try {
          const code = await provider.getCode(address);
          browserResults.contractExists = code !== '0x' && code !== '0x0';
          
          // Try to interact with contract
          if (browserResults.contractExists) {
            // Define a simple ABI
            const basicAbi = [
              "function name() view returns (string)",
              "function symbol() view returns (string)",
              "function getCampaigns() view returns (string)",
              "function getAllCampaigns() view returns (string)",
              "function listCampaigns() view returns (string)",
            ];
            
            const contract = new ethers.Contract(address, basicAbi, provider);
            browserResults.functions = Object.keys(contract.functions)
              .filter(key => !key.includes('('));
            
            // Try to call some functions
            for (const func of browserResults.functions) {
              try {
                const result = await contract.functions[func]();
                browserResults[func] = result;
              } catch (error) {
                browserResults.errors.push({ function: func, error: error.message });
              }
            }
          }
        } catch (error) {
          browserResults.errors.push({ step: 'contract-check', error: error.message });
        }
      }
      
      setBrowserTest(browserResults);
    } catch (error) {
      setBrowserTest({ error: error.message });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Contract Test Utility</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-xl font-bold mb-2">Wallet Connection</h2>
        {connected ? (
          <div className="text-green-600">
            ✅ Connected to MetaMask (Chain ID: {chainId})
          </div>
        ) : (
          <div>
            <p className="text-red-600 mb-2">❌ Not connected to MetaMask</p>
            <button 
              onClick={connectWallet}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <div className="mb-4">
          <label className="block mb-1">Contract Address</label>
          <input 
            type="text" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Network RPC URL</label>
          <input 
            type="text" 
            value={network} 
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button 
          onClick={testContract} 
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          {loading ? 'Testing...' : 'Test Contract'}
        </button>
      </div>
      
      {browserTest && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Browser Test Results</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(browserTest, null, 2)}
          </pre>
        </div>
      )}
      
      {result && (
        <div className="p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Server Test Results</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 