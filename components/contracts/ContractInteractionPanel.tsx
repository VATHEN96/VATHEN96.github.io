import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { getWalletConnector } from '../../utils/wallet-connector';
import { getGasSettings, GasSpeed } from '../../utils/gas-optimizer';
import { logEvent } from '../../utils/analytics';
import { formatEther, formatUnits } from 'ethers/lib/utils';
import { useWeb3Storage } from '../../hooks/useWeb3Storage';
import { getIdentityManager } from '../../utils/identity-manager';

// Types for contract interaction
type FunctionParam = {
  name: string;
  type: string;
  value: string;
};

type ContractFunction = {
  name: string;
  stateMutability: 'view' | 'pure' | 'nonpayable' | 'payable';
  inputs: Array<{
    name: string;
    type: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
  }>;
};

type ContractEvent = {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    indexed: boolean;
  }>;
};

interface ContractInteractionPanelProps {
  address: string;
  abi: any[];
  title?: string;
  description?: string;
  showEvents?: boolean;
  showStorage?: boolean;
  showVerification?: boolean;
  onTransactionComplete?: (receipt: ethers.ContractReceipt) => void;
}

/**
 * Contract Interaction Panel Component
 * A flexible UI for interacting with any smart contract
 */
export function ContractInteractionPanel({
  address,
  abi,
  title = 'Contract Interaction',
  description,
  showEvents = true,
  showStorage = true,
  showVerification = true,
  onTransactionComplete
}: ContractInteractionPanelProps) {
  // State for selected function
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  
  // State for function parameters
  const [functionParams, setFunctionParams] = useState<FunctionParam[]>([]);
  
  // State for value to send (for payable functions)
  const [value, setValue] = useState<string>('');
  
  // State for gas settings
  const [gasSpeed, setGasSpeed] = useState<GasSpeed>(GasSpeed.STANDARD);
  
  // State for function result
  const [result, setResult] = useState<any>(null);
  
  // State for transaction status
  const [txStatus, setTxStatus] = useState<'none' | 'pending' | 'success' | 'error'>('none');
  
  // State for transaction hash
  const [txHash, setTxHash] = useState<string>('');
  
  // State for transaction receipt
  const [txReceipt, setTxReceipt] = useState<ethers.ContractReceipt | null>(null);
  
  // State for error message
  const [error, setError] = useState<string>('');
  
  // State for events
  const [events, setEvents] = useState<Array<{name: string, args: any, blockNumber: number, transactionHash: string}>>([]);
  
  // Web3 storage for caching
  const { cacheContractData, getCachedContractData } = useWeb3Storage();
  
  // Parse ABI to get functions and events
  const contractFunctions = useMemo(() => {
    return abi
      .filter(item => item.type === 'function')
      .map(item => ({
        name: item.name,
        stateMutability: item.stateMutability,
        inputs: item.inputs || [],
        outputs: item.outputs || []
      })) as ContractFunction[];
  }, [abi]);
  
  const contractEvents = useMemo(() => {
    return abi
      .filter(item => item.type === 'event')
      .map(item => ({
        name: item.name,
        inputs: item.inputs || []
      })) as ContractEvent[];
  }, [abi]);
  
  // Extract read and write functions
  const readFunctions = useMemo(() => {
    return contractFunctions.filter(
      fn => fn.stateMutability === 'view' || fn.stateMutability === 'pure'
    );
  }, [contractFunctions]);
  
  const writeFunctions = useMemo(() => {
    return contractFunctions.filter(
      fn => fn.stateMutability === 'nonpayable' || fn.stateMutability === 'payable'
    );
  }, [contractFunctions]);
  
  // Create contract instance
  const getContract = () => {
    const walletConnector = getWalletConnector();
    const provider = walletConnector.getProvider();
    const signer = walletConnector.getSigner();
    
    if (signer) {
      return new ethers.Contract(address, abi, signer);
    } else {
      return new ethers.Contract(address, abi, provider);
    }
  };
  
  // Handle function selection
  const handleFunctionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const functionName = e.target.value;
    setSelectedFunction(functionName);
    
    // Find function in ABI
    const selectedFn = contractFunctions.find(fn => fn.name === functionName);
    
    if (selectedFn) {
      // Initialize params
      const initialParams = selectedFn.inputs.map(input => ({
        name: input.name || 'param',
        type: input.type,
        value: ''
      }));
      
      setFunctionParams(initialParams);
      
      // Reset values
      setValue('');
      setResult(null);
      setError('');
      setTxStatus('none');
      setTxHash('');
      setTxReceipt(null);
    }
  };
  
  // Handle parameter change
  const handleParamChange = (index: number, value: string) => {
    const newParams = [...functionParams];
    newParams[index].value = value;
    setFunctionParams(newParams);
  };
  
  // Handle value change (for payable functions)
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  
  // Handle gas speed change
  const handleGasSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGasSpeed(e.target.value as GasSpeed);
  };
  
  // Call read function
  const callReadFunction = async () => {
    try {
      setError('');
      setResult(null);
      
      const contract = getContract();
      const fn = contract.functions[selectedFunction];
      
      if (!fn) {
        throw new Error(`Function ${selectedFunction} not found`);
      }
      
      // Check if we have cached data first
      const cacheKey = `${address}_${selectedFunction}_${functionParams.map(p => p.value).join('_')}`;
      const cachedData = await getCachedContractData(cacheKey);
      
      if (cachedData) {
        setResult(cachedData);
        return;
      }
      
      // Format params
      const params = functionParams.map(param => {
        // For arrays, split by comma and parse
        if (param.type.includes('[')) {
          return param.value.split(',').map(v => v.trim());
        }
        return param.value;
      });
      
      // Call function
      const result = await fn(...params);
      
      // Cache result
      await cacheContractData(cacheKey, result);
      
      setResult(result);
      
      // Log event
      logEvent('contract_read', {
        contractAddress: address,
        function: selectedFunction,
        params: JSON.stringify(params)
      });
    } catch (err: any) {
      console.error('Error calling function:', err);
      setError(err.message || 'Error calling function');
    }
  };
  
  // Call write function
  const callWriteFunction = async () => {
    try {
      setError('');
      setTxStatus('pending');
      setTxHash('');
      setTxReceipt(null);
      
      const contract = getContract();
      const fn = contract.functions[selectedFunction];
      
      if (!fn) {
        throw new Error(`Function ${selectedFunction} not found`);
      }
      
      // Format params
      const params = functionParams.map(param => {
        // For arrays, split by comma and parse
        if (param.type.includes('[')) {
          return param.value.split(',').map(v => v.trim());
        }
        return param.value;
      });
      
      // Get gas settings
      const gasSettings = await getGasSettings(gasSpeed);
      
      // Options for transaction
      const options: any = {
        ...gasSettings
      };
      
      // Add value for payable functions
      const selectedFn = contractFunctions.find(fn => fn.name === selectedFunction);
      if (selectedFn?.stateMutability === 'payable' && value) {
        options.value = ethers.utils.parseEther(value);
      }
      
      // Send transaction
      const tx = await fn(...params, options);
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      setTxReceipt(receipt);
      setTxStatus('success');
      
      // Call onTransactionComplete callback
      if (onTransactionComplete) {
        onTransactionComplete(receipt);
      }
      
      // Create a VC for the transaction
      try {
        const identityManager = getIdentityManager();
        const profile = await identityManager.getProfile();
        
        if (profile) {
          // Simple credential that proves the user executed this transaction
          await identityManager.addCredential({
            '@context': [
              'https://www.w3.org/2018/credentials/v1',
              'https://www.w3.org/2018/credentials/examples/v1'
            ],
            type: ['VerifiableCredential', 'TransactionCredential'],
            issuer: profile.did,
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
              id: profile.did,
              transaction: tx.hash,
              contract: address,
              function: selectedFunction,
              timestamp: Date.now()
            },
            proof: {
              type: 'EcdsaSecp256k1RecoverySignature2020',
              created: new Date().toISOString(),
              proofPurpose: 'assertionMethod',
              verificationMethod: `${profile.did}#keys-1`,
              proofValue: receipt.transactionHash
            }
          });
        }
      } catch (vcError) {
        console.warn('Failed to create VC for transaction:', vcError);
      }
      
      // Log event
      logEvent('contract_write', {
        contractAddress: address,
        function: selectedFunction,
        params: JSON.stringify(params),
        txHash: tx.hash
      });
    } catch (err: any) {
      console.error('Error calling function:', err);
      setError(err.message || 'Error calling function');
      setTxStatus('error');
    }
  };
  
  // Fetch past events on component mount
  useEffect(() => {
    if (showEvents && address) {
      const fetchEvents = async () => {
        try {
          const contract = getContract();
          
          // Fetch the last 1000 blocks of events
          const provider = getWalletConnector().getProvider();
          const currentBlock = await provider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 1000);
          
          // For each event in the contract
          const allEvents: any[] = [];
          
          for (const event of contractEvents) {
            try {
              const filter = contract.filters[event.name]();
              const events = await contract.queryFilter(filter, fromBlock);
              
              events.forEach(evt => {
                allEvents.push({
                  name: event.name,
                  args: evt.args,
                  blockNumber: evt.blockNumber,
                  transactionHash: evt.transactionHash
                });
              });
            } catch (err) {
              console.warn(`Failed to fetch ${event.name} events:`, err);
            }
          }
          
          // Sort by block number (descending)
          allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
          
          setEvents(allEvents);
        } catch (err) {
          console.error('Error fetching events:', err);
        }
      };
      
      fetchEvents();
    }
  }, [address, contractEvents, showEvents]);
  
  // Listen for new events
  useEffect(() => {
    if (showEvents && address) {
      const contract = getContract();
      
      // Event listeners
      const eventListeners: ethers.Contract[] = [];
      
      contractEvents.forEach(event => {
        try {
          contract.on(event.name, (...args) => {
            const evt = args[args.length - 1];
            
            setEvents(prev => [
              {
                name: event.name,
                args: evt.args,
                blockNumber: evt.blockNumber,
                transactionHash: evt.transactionHash
              },
              ...prev
            ]);
          });
          
          eventListeners.push(contract);
        } catch (err) {
          console.warn(`Failed to listen to ${event.name} events:`, err);
        }
      });
      
      // Cleanup
      return () => {
        eventListeners.forEach(contract => {
          contract.removeAllListeners();
        });
      };
    }
  }, [address, contractEvents, showEvents]);
  
  // Format result for display
  const formatResult = (result: any): string => {
    if (result === null || result === undefined) {
      return 'null';
    }
    
    if (ethers.BigNumber.isBigNumber(result)) {
      // Try to format as ether
      try {
        return `${formatEther(result)} ETH (${result.toString()})`;
      } catch {
        return result.toString();
      }
    }
    
    if (Array.isArray(result)) {
      return `[${result.map(item => formatResult(item)).join(', ')}]`;
    }
    
    if (typeof result === 'object') {
      if (result.hash && result.blockNumber) {
        // Looks like a transaction
        return `Transaction: ${result.hash}`;
      }
      
      try {
        return JSON.stringify(result, (_, value) => 
          ethers.BigNumber.isBigNumber(value) ? value.toString() : value
        , 2);
      } catch {
        return Object.prototype.toString.call(result);
      }
    }
    
    return String(result);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      
      {description && (
        <p className="text-gray-600 mb-6">{description}</p>
      )}
      
      {/* Contract Address */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Contract Address</h3>
        <div className="flex items-center">
          <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono overflow-x-auto flex-1">
            {address}
          </code>
          
          {showVerification && (
            <div className="ml-3">
              <a 
                href={`https://etherscan.io/address/${address}#code`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Verify on Etherscan
              </a>
            </div>
          )}
        </div>
      </div>
      
      {/* Function Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Functions</h3>
        
        <div className="flex flex-col md:flex-row md:space-x-4">
          {/* Read Functions */}
          <div className="flex-1 mb-4 md:mb-0">
            <h4 className="font-medium mb-2">Read Functions</h4>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              value={selectedFunction}
              onChange={handleFunctionChange}
            >
              <option value="">Select a read function</option>
              {readFunctions.map(fn => (
                <option key={fn.name} value={fn.name}>
                  {fn.name}
                </option>
              ))}
            </select>
            
            {selectedFunction && readFunctions.find(fn => fn.name === selectedFunction) && (
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={callReadFunction}
              >
                Read
              </button>
            )}
          </div>
          
          {/* Write Functions */}
          <div className="flex-1">
            <h4 className="font-medium mb-2">Write Functions</h4>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              value={selectedFunction}
              onChange={handleFunctionChange}
            >
              <option value="">Select a write function</option>
              {writeFunctions.map(fn => (
                <option key={fn.name} value={fn.name}>
                  {fn.name} {fn.stateMutability === 'payable' ? '(payable)' : ''}
                </option>
              ))}
            </select>
            
            {selectedFunction && writeFunctions.find(fn => fn.name === selectedFunction) && (
              <div className="flex space-x-2">
                <select
                  className="border border-gray-300 rounded px-3 py-2"
                  value={gasSpeed}
                  onChange={handleGasSpeedChange}
                >
                  <option value={GasSpeed.SLOW}>Slow</option>
                  <option value={GasSpeed.STANDARD}>Standard</option>
                  <option value={GasSpeed.FAST}>Fast</option>
                  <option value={GasSpeed.FASTEST}>Fastest</option>
                </select>
                
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={callWriteFunction}
                  disabled={txStatus === 'pending'}
                >
                  {txStatus === 'pending' ? 'Pending...' : 'Write'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Function Parameters */}
      {selectedFunction && functionParams.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Parameters</h3>
          
          {functionParams.map((param, index) => (
            <div key={index} className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {param.name} ({param.type})
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={param.value}
                onChange={(e) => handleParamChange(index, e.target.value)}
                placeholder={`Enter ${param.type} value`}
              />
            </div>
          ))}
          
          {/* Value input for payable functions */}
          {selectedFunction && 
           writeFunctions.find(fn => fn.name === selectedFunction)?.stateMutability === 'payable' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value (ETH)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={value}
                onChange={handleValueChange}
                placeholder="Enter ETH amount"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Result */}
      {result !== null && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Result</h3>
          <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm">
            {formatResult(result)}
          </pre>
        </div>
      )}
      
      {/* Transaction Status */}
      {txStatus !== 'none' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Transaction Status</h3>
          
          <div className={`p-3 rounded ${
            txStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            txStatus === 'success' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {txStatus === 'pending' && 'Transaction pending...'}
            {txStatus === 'success' && 'Transaction successful!'}
            {txStatus === 'error' && 'Transaction failed'}
          </div>
          
          {txHash && (
            <div className="mt-2">
              <p className="font-medium">Transaction Hash:</p>
              <a 
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                {txHash}
              </a>
            </div>
          )}
          
          {txReceipt && (
            <div className="mt-2">
              <p className="font-medium">Gas Used:</p>
              <p>{txReceipt.gasUsed.toString()}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <div className="bg-red-100 p-3 rounded text-red-800">
            {error}
          </div>
        </div>
      )}
      
      {/* Events */}
      {showEvents && events.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Recent Events</h3>
          
          <div className="max-h-96 overflow-y-auto">
            {events.map((event, index) => (
              <div 
                key={`${event.transactionHash}-${index}`} 
                className="mb-3 p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="font-medium">{event.name}</div>
                <div className="text-sm text-gray-500">
                  Block: {event.blockNumber} | TX: 
                  <a 
                    href={`https://etherscan.io/tx/${event.transactionHash}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    {event.transactionHash.substring(0, 10)}...
                  </a>
                </div>
                
                <div className="mt-2">
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.args, (_, value) => 
                      ethers.BigNumber.isBigNumber(value) ? value.toString() : value
                    , 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Storage */}
      {showStorage && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Contract Storage</h3>
          <p className="text-sm text-gray-600">
            Storage data and state variables need to be exposed through view functions.
            Use the read functions above to access the contract's state.
          </p>
        </div>
      )}
    </div>
  );
} 