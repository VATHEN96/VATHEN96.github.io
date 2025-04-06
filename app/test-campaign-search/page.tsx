'use client';

import React, { useState } from 'react';
import Navbar from '@/components/navbar';
import { useRouter } from 'next/navigation';

export default function TestCampaignSearch() {
  const [inputId, setInputId] = useState('CAMP-0-634478-aa31cd');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    const trimmedId = inputId.trim();
    
    if (!trimmedId) {
      setError('Please enter a campaign ID');
      return;
    }
    
    try {
      // Just use direct extraction for this test
      const parts = trimmedId.split('-');
      
      setDebugInfo({
        input: trimmedId,
        parts,
        isValid: parts.length >= 3 && parts[0].toUpperCase() === 'CAMP' && /^\d+$/.test(parts[1])
      });
      
      if (parts.length >= 3 && parts[0].toUpperCase() === 'CAMP' && /^\d+$/.test(parts[1])) {
        const numericId = Number(parts[1]);
        console.log("Found campaign ID:", numericId);
        
        // Navigate directly to campaign with extracted ID
        router.push(`/campaign/${numericId}`);
      } else {
        setError('Invalid campaign ID format. Please use format like CAMP-0-634478-aa31cd');
      }
    } catch (err) {
      console.error("Error:", err);
      setError('Error processing campaign ID');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-8 text-center">Test Campaign Search</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-black">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="campaignId">
                Campaign ID
              </label>
              <input
                id="campaignId"
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CAMP-0-634478-aa31cd"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800"
            >
              Find Campaign
            </button>
          </form>
          
          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h3 className="font-medium mb-2">Debug Info:</h3>
              <pre className="text-xs overflow-auto bg-gray-200 p-2 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">Example ID: <code className="bg-gray-100 px-1">CAMP-0-634478-aa31cd</code></h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
              <li>Extracted ID from this would be: <code className="font-bold">0</code></li>
              <li>Will navigate to: <code>/campaign/0</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 