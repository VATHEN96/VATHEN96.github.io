// Global type declarations

interface Window {
  ethereum?: any;
  WOWZARUSH_CONFIG?: {
    USE_MOCK_DATA?: boolean;
    CAMPAIGN_CONTRACT_ADDRESS?: string;
    [key: string]: any;
  };
}

// Declare global variables
declare global {
  interface Window {
    ethereum?: any;
    WOWZARUSH_CONFIG?: {
      USE_MOCK_DATA?: boolean;
      CAMPAIGN_CONTRACT_ADDRESS?: string;
      [key: string]: any;
    };
  }
}

export {}; 