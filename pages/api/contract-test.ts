import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ApiResponse {
  success: boolean;
  message?: string;
  result?: any;
  error?: any;
  details?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    // Get contract address from query or use default
    const contractAddress = (req.query.address as string) || '0xf97cb339e663eb826093e44bafd1383615c48ae1';
    
    // Get network from query or use default (Telos testnet)
    const network = (req.query.network as string) || 'https://testnet.telos.net/evm';
    
    console.log(`Testing contract at ${contractAddress} on ${network}`);
    
    // Setup provider
    const provider = new ethers.providers.JsonRpcProvider(network);
    
    // Basic test: check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === '0x' || code === '0x0') {
      return res.status(200).json({
        success: false,
        message: 'No contract found at this address',
        details: {
          contractAddress,
          network,
          code
        }
      });
    }
    
    // Define a basic ABI for testing - just a few standard ERC functions
    const basicAbi = [
      // Basic ERC functions
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function balanceOf(address) view returns (uint)",
      // Basic contract functions
      "function owner() view returns (address)",
      // Common getters
      "function getInfo() view returns (string)",
      "function getCampaigns() view returns (string)",
      "function getAllCampaigns() view returns (string)",
      "function listCampaigns() view returns (string)",
    ];
    
    const contract = new ethers.Contract(contractAddress, basicAbi, provider);
    
    // Collect all available functions
    const availableFunctions = Object.keys(contract.functions)
      .filter(key => !key.includes('('));
    
    // Try to call basic functions
    const results = {};
    for (const func of availableFunctions) {
      try {
        console.log(`Trying to call ${func}()`);
        // Only call functions that don't need parameters
        if (!func.includes('(')) {
          const result = await contract.functions[func]();
          results[func] = result;
        }
      } catch (error) {
        results[func] = { error: error.message };
      }
    }
    
    // Get network information
    const networkInfo = await provider.getNetwork();
    
    // Return success with all the data we collected
    return res.status(200).json({
      success: true,
      message: 'Contract test completed',
      details: {
        contractAddress,
        network,
        networkInfo,
        codeExists: code !== '0x',
        codeLength: code.length,
        availableFunctions,
      },
      result: results
    });
    
  } catch (error) {
    console.error('Error testing contract:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing contract',
      error: error.message,
      details: error
    });
  }
} 