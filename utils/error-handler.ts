/**
 * Web3 Error Handler
 * 
 * Advanced error handling and recovery for blockchain interactions
 */

// Common transaction errors
export enum Web3ErrorType {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  REJECTED_BY_USER = 'REJECTED_BY_USER',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  EXECUTION_REVERTED = 'EXECUTION_REVERTED',
  OUT_OF_GAS = 'OUT_OF_GAS',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NONCE_TOO_LOW = 'NONCE_TOO_LOW',
  REPLACEMENT_UNDERPRICED = 'REPLACEMENT_UNDERPRICED',
  GAS_PRICE_TOO_LOW = 'GAS_PRICE_TOO_LOW',
  
  // Network errors
  WRONG_NETWORK = 'WRONG_NETWORK',
  NETWORK_CONGESTION = 'NETWORK_CONGESTION',
  
  // Validation errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
}

// Standard error structure
export interface Web3Error {
  type: Web3ErrorType;
  message: string;
  originalError?: any;
  data?: any;
  code?: number | string;
  reason?: string;
  transactionHash?: string;
  methodName?: string;
  params?: any[];
}

// Error codes from providers
const ERROR_CODES = {
  // MetaMask / EIP-1193 error codes
  REJECTED_BY_USER: [4001, 'ACTION_REJECTED'],
  UNAUTHORIZED: [4100, -32603, 'UNAUTHORIZED'],
  NETWORK_ERROR: [-32603, -32010, 'NETWORK_ERROR'],
  CHAIN_DISCONNECTED: [4901, 'CHAIN_DISCONNECTED'],
  INVALID_PARAMS: [-32602, 'INVALID_PARAMS'],
  
  // Transaction error codes
  REPLACEMENT_UNDERPRICED: [-32603, 'REPLACEMENT_UNDERPRICED'],
  INSUFFICIENT_FUNDS: [-32603, 'INSUFFICIENT_FUNDS'],
  EXECUTION_REVERTED: [-32016, -32603, 'EXECUTION_REVERTED', 'UNPREDICTABLE_GAS_LIMIT'],
  NONCE_TOO_LOW: [-32603, 'NONCE_TOO_LOW'],
  GAS_PRICE_TOO_LOW: [-32603, 'GAS_PRICE_TOO_LOW'],
};

// Error messages
const ERROR_MESSAGES = {
  [Web3ErrorType.UNKNOWN_ERROR]: 'An unknown error occurred',
  [Web3ErrorType.REJECTED_BY_USER]: 'Transaction rejected by user',
  [Web3ErrorType.UNAUTHORIZED]: 'Not authorized. Please connect your wallet',
  [Web3ErrorType.CONNECTION_ERROR]: 'Failed to connect to the network',
  [Web3ErrorType.PROVIDER_ERROR]: 'Provider error',
  
  [Web3ErrorType.TRANSACTION_FAILED]: 'Transaction failed',
  [Web3ErrorType.CONTRACT_ERROR]: 'Smart contract error',
  [Web3ErrorType.EXECUTION_REVERTED]: 'Transaction reverted during execution',
  [Web3ErrorType.OUT_OF_GAS]: 'Transaction ran out of gas',
  [Web3ErrorType.INSUFFICIENT_FUNDS]: 'Insufficient funds for transaction',
  [Web3ErrorType.NONCE_TOO_LOW]: 'Transaction nonce is too low',
  [Web3ErrorType.REPLACEMENT_UNDERPRICED]: 'Replacement transaction underpriced',
  [Web3ErrorType.GAS_PRICE_TOO_LOW]: 'Gas price too low for the network',
  
  [Web3ErrorType.WRONG_NETWORK]: 'Connected to the wrong network',
  [Web3ErrorType.NETWORK_CONGESTION]: 'Network is congested, try again later',
  
  [Web3ErrorType.INVALID_ADDRESS]: 'Invalid Ethereum address',
  [Web3ErrorType.INVALID_AMOUNT]: 'Invalid amount',
};

// Recovery suggestions
const RECOVERY_SUGGESTIONS = {
  [Web3ErrorType.UNKNOWN_ERROR]: 'Please try again or contact support if the issue persists.',
  [Web3ErrorType.REJECTED_BY_USER]: 'You rejected the transaction. Try again when you\'re ready to approve.',
  [Web3ErrorType.UNAUTHORIZED]: 'Please connect your wallet to proceed.',
  [Web3ErrorType.CONNECTION_ERROR]: 'Check your internet connection and try again.',
  [Web3ErrorType.PROVIDER_ERROR]: 'Try refreshing the page or reconnecting your wallet.',
  
  [Web3ErrorType.TRANSACTION_FAILED]: 'The transaction failed. Check the transaction details and try again.',
  [Web3ErrorType.CONTRACT_ERROR]: 'The smart contract execution failed. The operation may not be valid.',
  [Web3ErrorType.EXECUTION_REVERTED]: 'The transaction was reverted by the smart contract. The operation may not be valid.',
  [Web3ErrorType.OUT_OF_GAS]: 'Try again with a higher gas limit.',
  [Web3ErrorType.INSUFFICIENT_FUNDS]: 'Add more funds to your wallet to cover the transaction cost.',
  [Web3ErrorType.NONCE_TOO_LOW]: 'Your transaction nonce is outdated. Try refreshing the page.',
  [Web3ErrorType.REPLACEMENT_UNDERPRICED]: 'Try again with a higher gas price.',
  [Web3ErrorType.GAS_PRICE_TOO_LOW]: 'Increase the gas price and try again.',
  
  [Web3ErrorType.WRONG_NETWORK]: 'Please switch to the correct network in your wallet.',
  [Web3ErrorType.NETWORK_CONGESTION]: 'The network is experiencing high demand. Try again later or increase gas price.',
  
  [Web3ErrorType.INVALID_ADDRESS]: 'Please enter a valid Ethereum address.',
  [Web3ErrorType.INVALID_AMOUNT]: 'Please enter a valid amount.',
};

/**
 * Identify and classify Web3 errors
 * @param error Any error from Web3 interaction
 * @returns Classified Web3Error
 */
export function identifyWeb3Error(error: any): Web3Error {
  if (!error) {
    return {
      type: Web3ErrorType.UNKNOWN_ERROR,
      message: ERROR_MESSAGES[Web3ErrorType.UNKNOWN_ERROR],
      originalError: error,
    };
  }
  
  // Handle if error is already a Web3Error
  if (error.type && Object.values(Web3ErrorType).includes(error.type)) {
    return error as Web3Error;
  }
  
  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);
  
  // Check for user rejection
  if (
    errorCode === 4001 ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user denied') ||
    errorMessage.includes('was rejected')
  ) {
    return {
      type: Web3ErrorType.REJECTED_BY_USER,
      message: ERROR_MESSAGES[Web3ErrorType.REJECTED_BY_USER],
      originalError: error,
      code: errorCode,
    };
  }
  
  // Check for authorization issues
  if (
    errorCode === 4100 ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('not authorized') ||
    errorMessage.includes('not connected')
  ) {
    return {
      type: Web3ErrorType.UNAUTHORIZED,
      message: ERROR_MESSAGES[Web3ErrorType.UNAUTHORIZED],
      originalError: error,
      code: errorCode,
    };
  }
  
  // Check for wrong network
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('chain') ||
    errorCode === 4902 ||
    errorCode === 4901
  ) {
    return {
      type: Web3ErrorType.WRONG_NETWORK,
      message: ERROR_MESSAGES[Web3ErrorType.WRONG_NETWORK],
      originalError: error,
      code: errorCode,
    };
  }
  
  // Check for insufficient funds
  if (
    errorMessage.includes('insufficient funds') ||
    errorMessage.includes('not enough funds') ||
    errorMessage.includes('insufficient balance')
  ) {
    return {
      type: Web3ErrorType.INSUFFICIENT_FUNDS,
      message: ERROR_MESSAGES[Web3ErrorType.INSUFFICIENT_FUNDS],
      originalError: error,
      code: errorCode,
    };
  }
  
  // Check for nonce issues
  if (
    errorMessage.includes('nonce too low') ||
    errorMessage.includes('nonce is too low')
  ) {
    return {
      type: Web3ErrorType.NONCE_TOO_LOW,
      message: ERROR_MESSAGES[Web3ErrorType.NONCE_TOO_LOW],
      originalError: error,
      code: errorCode,
    };
  }
  
  // Check for replacement transaction underpriced
  if (
    errorMessage.includes('replacement transaction underpriced') ||
    errorMessage.includes('transaction underpriced')
  ) {
    return {
      type: Web3ErrorType.REPLACEMENT_UNDERPRICED,
      message: ERROR_MESSAGES[Web3ErrorType.REPLACEMENT_UNDERPRICED],
      originalError: error,
      code: errorCode,
    };
  }
  
  // Check for gas price too low
  if (
    errorMessage.includes('gas price too low') ||
    errorMessage.includes('max fee per gas less than block') ||
    errorMessage.includes('fee too low') ||
    errorMessage.includes('underpriced') ||
    errorMessage.includes('gas too low')
  ) {
    // Check if this is a Telos transaction
    const isTelos = errorMessage.includes('telos') || 
                   (error.chainId && (error.chainId === 40 || error.chainId === 41));
    
    return {
      type: Web3ErrorType.GAS_PRICE_TOO_LOW,
      message: isTelos ? 'Telos transaction failed due to gas price issues. Retrying with optimized settings.' : 
                        ERROR_MESSAGES[Web3ErrorType.GAS_PRICE_TOO_LOW],
      originalError: error,
      code: errorCode,
      data: { isTelos, retryWithLowerGasPrice: isTelos }
    };
  }
  
  // Check for Telos-specific errors
  if (
    errorMessage.includes('telos') ||
    (error.chainId && (error.chainId === 40 || error.chainId === 41))
  ) {
    console.log('Detected Telos-specific error:', errorMessage);
    
    // Provide more specific error messages based on error content
    let telosMessage = 'Telos transaction failed. This may be due to network conditions or gas settings.';
    
    if (errorMessage.includes('gas') || errorMessage.includes('Gas')) {
      telosMessage = 'Telos transaction failed due to gas issues. The transaction will be retried with ultra-low gas settings.';
    } else if (errorMessage.includes('revert') || errorMessage.includes('Revert')) {
      telosMessage = 'Telos transaction was reverted. This may be due to contract conditions not being met.';
    } else if (errorMessage.includes('nonce')) {
      telosMessage = 'Telos transaction failed due to nonce issues. The transaction will be retried with the correct nonce.';
    }
    
    return {
      type: Web3ErrorType.TRANSACTION_FAILED,
      message: telosMessage,
      originalError: error,
      code: errorCode,
      data: { 
        isTelos: true, 
        retryWithLowerGasPrice: true, 
        errorDetails: errorMessage,
        specificError: telosMessage
      }
    };
  }
  
  // Check for out of gas
  if (
    errorMessage.includes('out of gas') ||
    errorMessage.includes('gas limit exceeded')
  ) {
    return {
      type: Web3ErrorType.OUT_OF_GAS,
      message: ERROR_MESSAGES[Web3ErrorType.OUT_OF_GAS],
      originalError: error,
      code: errorCode,
    };
  }
  
  // Check for execution revert
  if (
    errorMessage.includes('execution reverted') ||
    errorMessage.includes('revert') ||
    errorMessage.includes('reverted with reason')
  ) {
    // Try to extract revert reason
    const reason = extractRevertReason(error);
    
    return {
      type: Web3ErrorType.EXECUTION_REVERTED,
      message: reason 
        ? `Transaction reverted: ${reason}` 
        : ERROR_MESSAGES[Web3ErrorType.EXECUTION_REVERTED],
      originalError: error,
      code: errorCode,
      reason,
    };
  }
  
  // Check for general connection error
  if (
    errorMessage.includes('connection') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout')
  ) {
    return {
      type: Web3ErrorType.CONNECTION_ERROR,
      message: ERROR_MESSAGES[Web3ErrorType.CONNECTION_ERROR],
      originalError: error,
      code: errorCode,
    };
  }
  
  // Check for contract errors (fallback for other contract related errors)
  if (
    errorMessage.includes('contract') ||
    error.method || 
    error.transaction
  ) {
    return {
      type: Web3ErrorType.CONTRACT_ERROR,
      message: ERROR_MESSAGES[Web3ErrorType.CONTRACT_ERROR],
      originalError: error,
      code: errorCode,
      data: error.data,
    };
  }
  
  // Default to transaction failed
  if (error.transactionHash || error.hash) {
    return {
      type: Web3ErrorType.TRANSACTION_FAILED,
      message: ERROR_MESSAGES[Web3ErrorType.TRANSACTION_FAILED],
      originalError: error,
      code: errorCode,
      transactionHash: error.transactionHash || error.hash,
    };
  }
  
  // Default fallback
  return {
    type: Web3ErrorType.UNKNOWN_ERROR,
    message: errorMessage || ERROR_MESSAGES[Web3ErrorType.UNKNOWN_ERROR],
    originalError: error,
    code: errorCode,
  };
}

/**
 * Format an error for user display
 * @param error Web3Error or any error
 * @returns Formatted error message suitable for display
 */
export function formatErrorForUser(error: Web3Error | any): {
  title: string;
  message: string;
  suggestion: string;
} {
  const web3Error = error.type ? error as Web3Error : identifyWeb3Error(error);
  
  let title = 'Error';
  
  switch (web3Error.type) {
    case Web3ErrorType.REJECTED_BY_USER:
      title = 'Transaction Cancelled';
      break;
    case Web3ErrorType.UNAUTHORIZED:
      title = 'Authentication Required';
      break;
    case Web3ErrorType.CONNECTION_ERROR:
      title = 'Connection Error';
      break;
    case Web3ErrorType.PROVIDER_ERROR:
      title = 'Wallet Provider Error';
      break;
    case Web3ErrorType.TRANSACTION_FAILED:
    case Web3ErrorType.CONTRACT_ERROR:
    case Web3ErrorType.EXECUTION_REVERTED:
      title = 'Transaction Failed';
      break;
    case Web3ErrorType.OUT_OF_GAS:
    case Web3ErrorType.INSUFFICIENT_FUNDS:
      title = 'Insufficient Resources';
      break;
    case Web3ErrorType.WRONG_NETWORK:
      title = 'Network Error';
      break;
    case Web3ErrorType.INVALID_ADDRESS:
    case Web3ErrorType.INVALID_AMOUNT:
      title = 'Invalid Input';
      break;
    default:
      title = 'Unexpected Error';
  }
  
  // Get the recovery suggestion
  const suggestion = RECOVERY_SUGGESTIONS[web3Error.type] || RECOVERY_SUGGESTIONS[Web3ErrorType.UNKNOWN_ERROR];
  
  return {
    title,
    message: web3Error.message,
    suggestion,
  };
}

/**
 * Extract error message from various error formats
 * @param error Any error object
 * @returns Error message string
 */
function getErrorMessage(error: any): string {
  if (!error) return '';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.reason) return error.reason;
  
  if (error.error) {
    if (typeof error.error === 'string') return error.error;
    if (error.error.message) return error.error.message;
    if (error.error.reason) return error.error.reason;
  }
  
  if (error.data) {
    if (typeof error.data === 'string') return error.data;
    if (error.data.message) return error.data.message;
  }
  
  return JSON.stringify(error);
}

/**
 * Extract error code from various error formats
 * @param error Any error object
 * @returns Error code
 */
function getErrorCode(error: any): number | string {
  if (!error) return 0;
  
  if (error.code !== undefined) return error.code;
  
  if (error.error && error.error.code !== undefined) return error.error.code;
  
  return 0;
}

/**
 * Extract revert reason from contract error
 * @param error Contract error
 * @returns Revert reason if available
 */
function extractRevertReason(error: any): string | undefined {
  if (!error) return undefined;
  
  // Check direct reason property
  if (error.reason) return error.reason;
  
  // Check for nested reason
  if (error.error && error.error.reason) return error.error.reason;
  
  // Check error message for pattern "reverted with reason string 'X'"
  const message = getErrorMessage(error);
  const reasonMatch = message.match(/reverted with reason string ['"](.+)['"]/i);
  if (reasonMatch && reasonMatch[1]) return reasonMatch[1];
  
  // Check error message for pattern "execution reverted: X"
  const executionMatch = message.match(/execution reverted:?\s*(.+)/i);
  if (executionMatch && executionMatch[1]) return executionMatch[1];
  
  // Check data property for custom error
  if (error.data && typeof error.data === 'string') {
    // Some providers encode the revert reason in the data field
    try {
      // Check for common formats
      if (error.data.startsWith('0x08c379a0')) {
        // This is an Error(string) revert
        const abiCoder = new ethers.utils.AbiCoder();
        const data = '0x' + error.data.slice(10); // Remove the error selector
        const [reason] = abiCoder.decode(['string'], data);
        return reason;
      }
    } catch (e) {
      // If we can't decode, just return undefined
    }
  }
  
  return undefined;
}

/**
 * Check if an error is recoverable
 * @param error Web3Error or any error
 * @returns Whether the error is recoverable
 */
export function isRecoverableError(error: Web3Error | any): boolean {
  const web3Error = error.type ? error as Web3Error : identifyWeb3Error(error);
  
  // These errors are recoverable by retrying or changing parameters
  const recoverableErrors = [
    Web3ErrorType.CONNECTION_ERROR,
    Web3ErrorType.PROVIDER_ERROR,
    Web3ErrorType.OUT_OF_GAS,
    Web3ErrorType.NONCE_TOO_LOW,
    Web3ErrorType.REPLACEMENT_UNDERPRICED,
    Web3ErrorType.GAS_PRICE_TOO_LOW,
    Web3ErrorType.NETWORK_CONGESTION,
  ];
  
  return recoverableErrors.includes(web3Error.type);
}

/**
 * Get recovery action for an error
 * @param error Web3Error
 * @returns Recovery action if available
 */
export function getRecoveryAction(error: Web3Error): {
  type: 'RETRY' | 'ADJUST_GAS' | 'SWITCH_NETWORK' | 'ADD_FUNDS' | 'REFRESH' | 'NONE';
  params?: any;
} {
  switch (error.type) {
    case Web3ErrorType.OUT_OF_GAS:
      return {
        type: 'ADJUST_GAS',
        params: { multiplier: 1.5 },
      };
    case Web3ErrorType.GAS_PRICE_TOO_LOW:
    case Web3ErrorType.REPLACEMENT_UNDERPRICED:
      return {
        type: 'ADJUST_GAS',
        params: { multiplier: 1.2 },
      };
    case Web3ErrorType.NONCE_TOO_LOW:
      return { type: 'REFRESH' };
    case Web3ErrorType.WRONG_NETWORK:
      return { type: 'SWITCH_NETWORK' };
    case Web3ErrorType.INSUFFICIENT_FUNDS:
      return { type: 'ADD_FUNDS' };
    case Web3ErrorType.CONNECTION_ERROR:
    case Web3ErrorType.PROVIDER_ERROR:
    case Web3ErrorType.NETWORK_CONGESTION:
      return { type: 'RETRY' };
    default:
      return { type: 'NONE' };
  }
}

/**
 * Create a retry strategy for failed transactions
 * @param operation Function to retry
 * @param options Retry options
 * @returns Promise that resolves when the operation succeeds or max retries reached
 */
export async function retryWeb3Operation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryableErrors?: Web3ErrorType[];
    onRetry?: (error: Web3Error, retryCount: number, delay: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryableErrors = [
      Web3ErrorType.CONNECTION_ERROR,
      Web3ErrorType.PROVIDER_ERROR,
      Web3ErrorType.NETWORK_CONGESTION,
      Web3ErrorType.NONCE_TOO_LOW,
      Web3ErrorType.GAS_PRICE_TOO_LOW,
      Web3ErrorType.REPLACEMENT_UNDERPRICED,
    ],
    onRetry = () => {},
  } = options;
  
  let retryCount = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      const web3Error = identifyWeb3Error(error);
      
      // If we've reached max retries or the error is not retryable, throw
      if (
        retryCount >= maxRetries ||
        !retryableErrors.includes(web3Error.type)
      ) {
        throw web3Error;
      }
      
      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay);
      
      // Notify about retry
      onRetry(web3Error, retryCount + 1, delay);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      retryCount++;
    }
  }
}

/**
 * Error logger for Web3 errors
 * @param error Error to log
 * @param context Additional context
 */
export function logWeb3Error(error: any, context: Record<string, any> = {}): void {
  const web3Error = error.type ? error as Web3Error : identifyWeb3Error(error);
  
  const logData = {
    errorType: web3Error.type,
    message: web3Error.message,
    code: web3Error.code,
    transactionHash: web3Error.transactionHash,
    reason: web3Error.reason,
    methodName: web3Error.methodName,
    params: web3Error.params,
    ...context,
    timestamp: new Date().toISOString(),
  };
  
  console.error('Web3 Error:', logData);
  
  // In production, you might want to send this to a logging service
  // await sendToLoggingService(logData);
}

// Define a mock ethers utils for the standalone module
const ethers = {
  utils: {
    AbiCoder: class {
      decode(types: string[], data: string) {
        // This is a mock implementation for the standalone module
        // In a real application, you would use the actual ethers AbiCoder
        console.warn('Mock AbiCoder.decode called - this would normally use ethers.js');
        return ['Unknown reason (mock decoder)'];
      }
    }
  }
};