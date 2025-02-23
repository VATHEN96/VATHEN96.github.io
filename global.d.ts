

declare global {
  interface Window {
    ethereum: {
      isMetaMask?: boolean;
      isBraveWallet?: boolean;
      request: (request: { method: string; params?: Array<any> }) => Promise<any>;
      on: (eventName: string, callback: (...args: any[]) => void) => void;
      removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
      selectedAddress?: string | null;
      networkVersion?: string;
      chainId?: string;
    };
  }
}

export {};
  

