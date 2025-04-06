'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import BlockchainServiceFixedV3Instance from '@/services/blockchainServiceFixedV3';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const DiagnosticButton = () => {
  const [open, setOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isVerifyingContract, setIsVerifyingContract] = useState(false);
  const [contractVerified, setContractVerified] = useState<boolean | null>(null);
  const [isCheckingActivation, setIsCheckingActivation] = useState(false);
  const [isActivated, setIsActivated] = useState<boolean | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const results = await BlockchainServiceFixedV3Instance.runDiagnostics();
      setDiagnostics(results);
      console.log('Diagnostic results:', results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast.error('Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const verifyContractOnExplorer = async () => {
    setIsVerifyingContract(true);
    try {
      const verified = await BlockchainServiceFixedV3Instance.verifyContractOnExplorer();
      setContractVerified(verified);
      if (verified) {
        toast.success('Contract successfully verified on the blockchain!');
      } else {
        toast.error('Contract verification failed. The contract may not exist at the specified address.');
      }
    } catch (error) {
      console.error('Error verifying contract:', error);
      toast.error('Failed to verify contract');
      setContractVerified(false);
    } finally {
      setIsVerifyingContract(false);
    }
  };

  const checkActivation = async () => {
    setIsCheckingActivation(true);
    try {
      const activated = await BlockchainServiceFixedV3Instance.checkAndActivateContract();
      setIsActivated(activated);
      
      if (activated) {
        toast.success('Contract is activated and ready to use.');
      } else {
        toast.warning('Contract may not be activated. Transactions might fail.');
      }
    } catch (error) {
      console.error('Error checking activation:', error);
      toast.error('Failed to check contract activation status');
      setIsActivated(false);
    } finally {
      setIsCheckingActivation(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      runDiagnostics();
    }
  };

  const openExplorer = () => {
    if (diagnostics?.explorerUrl) {
      window.open(diagnostics.explorerUrl, '_blank');
    }
  };

  const reconnectWallet = async () => {
    try {
      toast.loading('Connecting wallet...');
      await BlockchainServiceFixedV3Instance.connectWallet();
      toast.success('Wallet connection attempt completed');
      runDiagnostics();
    } catch (error) {
      console.error('Error reconnecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const switchNetwork = async () => {
    try {
      toast.loading('Switching network...');
      await BlockchainServiceFixedV3Instance.checkAndSwitchNetwork();
      toast.success('Network switch attempt completed');
      runDiagnostics();
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network');
    }
  };

  const reinitializeContract = async () => {
    try {
      BlockchainServiceFixedV3Instance.initializeContracts();
      toast.success('Contract reinitialization attempt completed');
      runDiagnostics();
    } catch (error) {
      console.error('Error reinitializing contract:', error);
      toast.error('Failed to reinitialize contract');
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => handleOpenChange(true)}>
        Troubleshoot
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Contract Connection Diagnostics</DialogTitle>
            <DialogDescription>
              This tool helps identify blockchain contract connection issues
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : diagnostics ? (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Wallet Status</h3>
                  <div className="flex items-center mt-1">
                    {diagnostics.walletConnected ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mr-1" />
                    )}
                    <span>{diagnostics.walletConnected ? 'Connected' : 'Not Connected'}</span>
                  </div>
                  {diagnostics.address && (
                    <div className="text-xs mt-1 text-muted-foreground break-all">
                      {diagnostics.address}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium">Network</h3>
                  <div className="flex items-center mt-1">
                    {diagnostics.networkName === 'Telos EVM Testnet' ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-1" />
                    )}
                    <span>{diagnostics.networkName}</span>
                  </div>
                  <div className="text-xs mt-1 text-muted-foreground">
                    Should be: Telos EVM Testnet
                  </div>
                </div>
              </div>

              {/* Contract Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Contract Status</h3>
                  <div className="flex items-center mt-1">
                    {diagnostics.contractInitialized ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mr-1" />
                    )}
                    <span>
                      {diagnostics.contractInitialized ? 'Initialized' : 'Not Initialized'}
                    </span>
                  </div>
                  <div className="text-xs mt-1 text-muted-foreground break-all">
                    {diagnostics.contractAddress}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Contract Methods</h3>
                  <div className="flex items-center mt-1">
                    {diagnostics.hasCreateCampaign ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mr-1" />
                    )}
                    <span>
                      {diagnostics.hasCreateCampaign
                        ? 'createCampaign Available'
                        : 'createCampaign Not Found'}
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-1">
                    {isActivated === null ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={checkActivation} 
                        disabled={isCheckingActivation}
                        className="text-xs p-0 h-auto"
                      >
                        {isCheckingActivation ? 'Checking...' : 'Check Activation Status'}
                      </Button>
                    ) : isActivated ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                        <span>Contract Activated</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-1" />
                        <span>Contract Not Activated</span>
                      </div>
                    )}
                  </div>
                  
                  {diagnostics.explorerUrl && (
                    <button
                      onClick={openExplorer}
                      className="flex items-center text-xs mt-1 text-blue-500 hover:underline"
                    >
                      View on block explorer
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  )}
                </div>
              </div>

              {/* Issues */}
              {diagnostics.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Issues Detected</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                      {diagnostics.issues.map((issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Suggestions */}
              {diagnostics.suggestions && diagnostics.suggestions.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Suggestions</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                      {diagnostics.suggestions.map((suggestion: string, index: number) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={reconnectWallet} disabled={loading}>
                  Reconnect Wallet
                </Button>
                <Button onClick={switchNetwork} disabled={loading}>
                  Switch Network
                </Button>
                <Button onClick={reinitializeContract} disabled={loading}>
                  Reinitialize Contract
                </Button>
                <Button 
                  onClick={verifyContractOnExplorer} 
                  disabled={loading || isVerifyingContract}
                  variant={contractVerified === true ? "outline" : "default"}
                >
                  {isVerifyingContract ? 'Verifying...' : 
                   contractVerified === true ? '✓ Contract Verified' :
                   contractVerified === false ? 'Verification Failed' : 
                   'Verify Contract'} 
                </Button>
                <Button 
                  onClick={checkActivation}
                  disabled={loading || isCheckingActivation}
                  variant={isActivated === true ? "outline" : "default"}
                >
                  {isCheckingActivation ? 'Checking...' :
                   isActivated === true ? '✓ Contract Activated' :
                   isActivated === false ? 'Activate Contract' :
                   'Check Activation'} 
                </Button>
                <Button onClick={runDiagnostics} variant="outline" disabled={loading}>
                  Run Diagnostics Again
                </Button>
              </div>

              {/* Troubleshooting Steps */}
              {diagnostics.issues.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Troubleshooting Steps</h3>
                  <ol className="list-decimal pl-4 space-y-2 text-sm">
                    <li>Ensure your wallet (MetaMask) is installed and unlocked</li>
                    <li>
                      Connect to the Telos EVM Testnet (Chain ID: 41). Click "Switch Network"
                      button above to try automatically.
                    </li>
                    <li>
                      Verify the contract exists at the address{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {diagnostics.contractAddress}
                      </code>
                    </li>
                    <li>
                      Check if the contract implements the required createCampaign method by
                      viewing it on the block explorer
                    </li>
                    <li>
                      If issues persist, there may be a mismatch between the ABI and the
                      deployed contract
                    </li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="my-4 text-center text-muted-foreground">
              Loading diagnostics...
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DiagnosticButton; 