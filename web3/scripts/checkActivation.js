import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider('https://rpc1.eu.telos.net/evm');
const abi = [{
  inputs: [],
  name: 'getActivationStatus',
  outputs: [{ type: 'bool' }],
  stateMutability: 'view',
  type: 'function'
}];

const contract = new ethers.Contract('0x5A753D7202444a8CbDa821aadc7E3743B8aE37E5', abi, provider);

async function checkActivation() {
  try {
    const status = await contract.getActivationStatus();
    console.log('Contract is', status ? 'activated' : 'not activated');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkActivation();