"use client";

import React from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CampaignWizard from '@/components/campaign/CampaignWizard';
import Navbar from '@/components/navbar';

export default function CreateCampaignPage() {
  const { isWalletConnected, connectWallet } = useWowzaRush();
  
  // If wallet is not connected, show a prompt to connect
    if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="container mx-auto py-20 px-4">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription>
                You need to connect your wallet to create a campaign.
              </AlertDescription>
            </Alert>
            
              <Button
              onClick={connectWallet} 
              className="w-full"
              size="lg"
            >
              Connect Wallet to Continue
            </Button>
          </div>
        </div>
    </div>
  );
  }
  
  // If wallet is connected, show the campaign creation wizard
  return <CampaignWizard />;
}
