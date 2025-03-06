import { ethers } from 'ethers';

const RPC_ENDPOINTS = [
  'https://testnet.telos.net/evm',
  'https://telos-testnet.rpc.thirdweb.com',
  'https://testnet.telos.caleos.io/evm'
];

const privateKey = '353765cfc142ef9704e6e62ba99d82e6cbaec94bbbd7443ec5bd319513b597f1';

const abi = [
  {
    inputs: [],
    name: 'activate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getActivationStatus',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
];

async function tryProvider(rpcUrl) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  try {
    await provider.getNetwork();
    console.log(`Successfully connected to ${rpcUrl}`);
    return provider;
  } catch (error) {
    console.log(`Failed to connect to ${rpcUrl}:`, error.message);
    return null;
  }
}

async function activateContract() {
  let provider = null;

  // Try each RPC endpoint until one works
  for (const rpcUrl of RPC_ENDPOINTS) {
    provider = await tryProvider(rpcUrl);
    if (provider) break;
  }

  if (!provider) {
    throw new Error('Failed to connect to any Telos RPC endpoint');
  }

  // First check if the contract is already activated
  const readOnlyContract = new ethers.Contract('0x7144Da8697ec83F9f820460C6498DcA90fF20901', abi, provider);

  const isActivated = await readOnlyContract.getActivationStatus();
  if (isActivated) {
    console.log('Contract is already activated.');
    return;
  }

  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Check if the wallet has the correct permissions (is owner)
    const contractOwner = await readOnlyContract.owner();
    if (contractOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('This wallet does not have permission to activate the contract. Only the owner can activate.');
    }

    // Check wallet balance
    const balance = await wallet.getBalance();
    const requiredBalance = ethers.utils.parseUnits('0.1', 'ether'); // Minimum 0.1 TLOS for safety
    if (balance.lt(requiredBalance)) {
      throw new Error(`Insufficient balance. Minimum required: 0.1 TLOS, Current balance: ${ethers.utils.formatEther(balance)} TLOS`);
    }

    console.log('Pre-activation checks passed:');
    console.log(`- Wallet balance: ${ethers.utils.formatEther(balance)} TLOS`);
    console.log('- Permissions: Wallet is the contract owner');
    console.log('- Contract status: Not activated\n');

    const contract = new ethers.Contract('0x7144Da8697ec83F9f820460C6498DcA90fF20901', abi, wallet);

    // Add debug logging
    console.log('Debug info:');
    console.log('- Contract address:', contract.address);
    console.log('- Wallet address:', wallet.address);
    console.log('- Network:', await provider.getNetwork());

    // Get the wallet's current nonce
    const nonce = await wallet.getTransactionCount();

    // Use fixed gas limit for Telos network
    const gasLimit = ethers.BigNumber.from('500000'); // Standard gas limit for contract activation
    const gasPrice = ethers.utils.parseUnits('1', 'gwei'); // Set fixed gas price to 1 Gwei for Telos

    console.log('Transaction configuration:');
    console.log('- Gas Limit:', gasLimit.toString());
    console.log('- Gas Price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');
    console.log('- Nonce:', nonce);

    console.log('\nActivating contract...');
    const tx = await contract.activate({
      gasLimit: gasLimit.mul(120).div(100), // Add 20% buffer
      gasPrice: gasPrice,
      nonce: nonce
    });

    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('\nTransaction confirmed!');
    console.log('- Block number:', receipt.blockNumber);
    console.log('- Gas used:', receipt.gasUsed.toString());
    console.log('Contract activated successfully!');
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.message.includes('already activated')) {
      console.log('Note: The contract is already activated.');
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('Note: Please ensure you have enough TLOS for gas fees.');
    } else if (error.code === 'NONCE_EXPIRED') {
      console.log('Note: Transaction nonce has expired. Please try again.');
    } else if (error.code === 'NETWORK_ERROR') {
      console.log('Note: Network connection issue. Please check your internet connection.');
    }
  }
}

activateContract();