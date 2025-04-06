const { ethers } = require('ethers');

// Configuration
// Use the CORRECT contract address from contractHelpers.ts
const CONTRACT_ADDRESS = '0xc5e9cCbCf3afC2a6a468c6244BCd30fCe48A48f8';
const TELOS_TESTNET_RPC = 'https://testnet.telos.net/evm';

// Minimal ABI definition with just function signatures to verify
const MINIMAL_ABI = [
  // The createCampaign function we're looking for
  {
    "inputs": [
      {"name": "title", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "category", "type": "string"},
      {"name": "goalAmount", "type": "uint256"},
      {"name": "duration", "type": "uint256"},
      {"name": "media", "type": "string[]"},
      {"name": "milestoneNames", "type": "string[]"},
      {"name": "milestoneDescriptions", "type": "string[]"},
      {"name": "milestoneAmounts", "type": "uint256[]"},
      {"name": "milestoneCompletions", "type": "bool[]"},
      {"name": "beneficiaries", "type": "string"},
      {"name": "stakeholders", "type": "address[]"}
    ],
    "name": "createCampaign",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Some common getter functions to check
  {
    "inputs": [],
    "name": "campaignCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "campaignId", "type": "uint256"}],
    "name": "getCampaign",
    "outputs": [
      {"name": "id", "type": "uint256"},
      {"name": "creator", "type": "address"},
      {"name": "title", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "category", "type": "string"},
      {"name": "goalAmount", "type": "uint256"},
      {"name": "totalFunded", "type": "uint256"},
      {"name": "duration", "type": "uint256"},
      {"name": "createdAt", "type": "uint256"},
      {"name": "isActive", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function verifyContract() {
  try {
    console.log('Starting contract verification...');
    console.log(`Contract address: ${CONTRACT_ADDRESS}`);
    console.log(`RPC URL: ${TELOS_TESTNET_RPC}`);
    
    // Connect to the network
    const provider = new ethers.providers.JsonRpcProvider(TELOS_TESTNET_RPC);
    console.log('Connected to provider');
    
    // Check if we can get network info
    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Verify the contract exists
    console.log('Checking if contract is deployed...');
    const bytecode = await provider.getCode(CONTRACT_ADDRESS);
    if (bytecode === '0x' || bytecode === '') {
      console.error('ERROR: No contract found at specified address!');
      return false;
    }
    console.log(`Contract bytecode found - length: ${bytecode.length} bytes`);
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, MINIMAL_ABI, provider);
    console.log('Contract instance created. Available functions:');
    
    // Check if createCampaign exists
    const hasCreateCampaign = !!contract.functions.createCampaign;
    console.log(`createCampaign method available: ${hasCreateCampaign}`);
    
    // List all available functions
    console.log('All available functions:');
    for (const fnName in contract.functions) {
      if (fnName.includes('(')) continue; // Skip non-method properties
      console.log(`- ${fnName}`);
    }
    
    // Try to call a view function
    try {
      console.log('Attempting to call campaignCount()...');
      const count = await contract.campaignCount();
      console.log(`Campaign count: ${count.toString()}`);
    } catch (error) {
      console.error('Error calling campaignCount:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Contract verification failed:', error);
    return false;
  }
}

// Execute verification
verifyContract()
  .then(result => {
    console.log(`Verification ${result ? 'PASSED' : 'FAILED'}`);
  })
  .catch(error => {
    console.error('Fatal error during verification:', error);
  }); 