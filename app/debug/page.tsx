'use client';

import React from 'react';
import { useWowzaRush } from '@/context/wowzarushContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const { 
    campaigns, 
    loading,
    connectWallet,
    disconnectWallet
  } = useWowzaRush();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>
              Connect or disconnect your wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Wallet:</strong> Control your wallet connection</p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={connectWallet}>
              Connect Wallet
            </Button>
            <Button onClick={disconnectWallet} variant="outline">
              Disconnect
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Data Status</h2>
        <div className="space-y-2">
          <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
          <p><strong>Campaign Count:</strong> {campaigns.length}</p>
          <p><strong>Data Source:</strong> Blockchain</p>
        </div>
      </div>
    </div>
  );
} 