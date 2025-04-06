/**
 * Web3 Safety Utilities
 * 
 * Helper functions to improve safety of web3 interactions
 */

// Safe contract approval check to prevent malicious contracts
export const isContractSafe = async (
  contractAddress: string, 
  provider: any
): Promise<boolean> => {
  try {
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === '0x' || code === '0x0') {
      return false; // Not a contract
    }
    
    // Check contract on block explorers (placeholder implementation)
    // In a real app, you would call APIs like Etherscan, MetaMask's phishing detection, etc.
    
    return true;
  } catch (error) {
    console.error("Error checking contract safety:", error);
    return false;
  }
};

// Format transaction data for better user understanding
export const formatTransactionData = (
  transaction: any
): string => {
  let formattedMessage = '';
  
  try {
    // Basic info
    formattedMessage += `To: ${shortenAddress(transaction.to)}\n`;
    formattedMessage += `Value: ${transaction.value || 0} ETH\n`;
    
    // Contract interaction?
    if (transaction.data && transaction.data !== '0x') {
      formattedMessage += 'Contract Interaction: Yes\n';
    }
    
    return formattedMessage;
  } catch (error) {
    console.error("Error formatting transaction:", error);
    return 'Error formatting transaction data';
  }
};

// Shorten ethereum address for display
export const shortenAddress = (
  address: string, 
  chars = 4
): string => {
  if (!address || address.length < 10) return address || '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

// Simple phishing check before connecting
export const checkSiteSafety = (): boolean => {
  try {
    // Check URL patterns
    const url = window.location.href.toLowerCase();
    
    // Detect likely phishing patterns
    const suspiciousPatterns = [
      'claim', 'airdrop', 'free', 'giveaway',
      'connect-wallet', 'validate', 'verify-wallet'
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (url.includes(pattern)) {
        console.warn(`Suspicious URL pattern detected: ${pattern}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error checking site safety:", error);
    return false;
  }
};

// Display warnings for high-risk transactions
export const getTransactionRiskLevel = (
  transaction: any
): { riskLevel: 'low' | 'medium' | 'high', warning: string } => {
  // Placeholder implementation
  try {
    const valueInEth = transaction.value ? parseFloat(transaction.value) : 0;
    
    if (valueInEth > 1.0) {
      return {
        riskLevel: 'high',
        warning: 'This transaction involves a large transfer of funds. Verify the recipient carefully!'
      };
    }
    
    if (transaction.data && transaction.data !== '0x') {
      return {
        riskLevel: 'medium',
        warning: 'This transaction interacts with a smart contract. Verify the contract is trusted.'
      };
    }
    
    return {
      riskLevel: 'low',
      warning: 'Standard transaction. Always verify the recipient address.'
    };
  } catch (error) {
    console.error("Error assessing transaction risk:", error);
    return {
      riskLevel: 'high',
      warning: 'Error assessing transaction risk. Proceed with extreme caution.'
    };
  }
}; 