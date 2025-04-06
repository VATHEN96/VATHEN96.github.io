import React, { useEffect, useRef, useState } from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

/**
 * Component that handles wallet connection state changes to prevent
 * "Breaking Browser Locker Behavior" errors. It detects when wallet
 * connection state changes during rendering and provides a controlled
 * way to reload the component that depends on wallet state.
 */
interface WalletConnectionHandlerProps {
  children: React.ReactNode;
  fallbackWhileChanging?: React.ReactNode;
}

const WalletConnectionHandler: React.FC<WalletConnectionHandlerProps> = ({
  children,
  fallbackWhileChanging
}) => {
  const { isWalletConnected, userAddress, chainId } = useWowzaRush();
  const [isStable, setIsStable] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);
  
  // Store previous values to detect changes
  const prevConnectedRef = useRef(isWalletConnected);
  const prevAddressRef = useRef(userAddress);
  const prevChainIdRef = useRef(chainId);
  
  // Timeout to reset stability after a change
  const stabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Skip first render check to avoid unnecessary rerender
    if (isFirstRender) {
      setIsFirstRender(false);
      prevConnectedRef.current = isWalletConnected;
      prevAddressRef.current = userAddress;
      prevChainIdRef.current = chainId;
      return;
    }
    
    // Check if wallet state has changed
    const connectionChanged = prevConnectedRef.current !== isWalletConnected;
    const addressChanged = prevAddressRef.current !== userAddress;
    const chainChanged = prevChainIdRef.current !== chainId;
    
    // If any changes detected, mark as unstable
    if (connectionChanged || addressChanged || chainChanged) {
      console.log('Wallet connection state changed, stabilizing...');
      
      // Update refs to current values
      prevConnectedRef.current = isWalletConnected;
      prevAddressRef.current = userAddress;
      prevChainIdRef.current = chainId;
      
      // Mark as unstable
      setIsStable(false);
      
      // Clear any existing timeout
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current);
      }
      
      // Set a timeout to mark as stable again after a brief delay
      stabilityTimeoutRef.current = setTimeout(() => {
        setIsStable(true);
        console.log('Wallet connection state stabilized');
        
        // Show toast notification for certain changes
        if (connectionChanged) {
          if (isWalletConnected) {
            toast.success('Wallet connected');
          } else {
            toast.info('Wallet disconnected');
          }
        } else if (chainChanged) {
          toast.info('Network changed');
        }
      }, 300); // Short delay to allow React to settle
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current);
      }
    };
  }, [isWalletConnected, userAddress, chainId, isFirstRender]);
  
  // If state is unstable, show a loading indicator or custom fallback
  if (!isStable) {
    if (fallbackWhileChanging) {
      return <>{fallbackWhileChanging}</>;
    }
    
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Updating wallet connection...</span>
      </div>
    );
  }
  
  // Once stable, render children
  return <>{children}</>;
};

export default WalletConnectionHandler; 