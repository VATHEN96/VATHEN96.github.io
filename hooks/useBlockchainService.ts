import { useState, useEffect } from 'react';
import BlockchainServiceInstance from '@/services/blockchainServiceFixedV3';
import { BlockchainServiceFixed } from '@/services/blockchainServiceFixedV3';

// Use any type to avoid TypeScript errors with the service
type AnyBlockchainService = any;

export function useBlockchainService() {
  const [blockchainService, setBlockchainService] = useState<AnyBlockchainService>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initializeBlockchainService = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the service
        await BlockchainServiceInstance.initialize();
        
        if (isMounted) {
          setBlockchainService(BlockchainServiceInstance);
          setError(null);
        }
      } catch (err) {
        console.error('Error initializing blockchain service:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize blockchain service'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeBlockchainService();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return { blockchainService, isLoading, error };
} 