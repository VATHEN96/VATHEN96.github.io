'use client';

import React, { useState } from 'react';
import Navbar from '@/components/navbar';
import { useRouter } from 'next/navigation';

export default function DirectFormatSearchTest() {
  const [inputId, setInputId] = useState('CAMP-0-634478-aa31cd');
  const [extractedId, setExtractedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Direct test function - doesn't redirect, just shows results
  const testExtraction = () => {
    setError('');
    setExtractedId(null);
    
    const id = inputId.trim();
    console.log("Testing ID extraction for:", id);
    
    if (!id) {
      setError('Please enter a campaign ID');
      return;
    }
    
    // Direct numeric ID
    if (/^\d+$/.test(id)) {
      const numericId = parseInt(id, 10);
      setExtractedId(numericId);
      return;
    }
    
    // Handle CAMP-X-... format
    if (id.includes('-')) {
      try {
        const parts = id.split('-');
        console.log("Split parts:", parts);
        
        if (parts.length >= 3 && parts[0].toUpperCase() === 'CAMP' && /^\d+$/.test(parts[1])) {
          const numericId = parseInt(parts[1], 10);
          console.log("Extracted numeric ID:", numericId);
          setExtractedId(numericId);
          return;
        }
      } catch (e) {
        console.error("Error during extraction:", e);
      }
    }
    
    setError('Could not extract a valid numeric ID from the input');
  };
  
  // Actually navigate to the campaign if the extraction was successful
  const goToCampaign = () => {
    if (extractedId !== null) {
      router.push(`/campaign/${extractedId}`);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-8 text-center">Direct Format Search Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-black">
          <div className="space-y-6">
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
            
            <div className="flex space-x-3">
              <button
                onClick={testExtraction}
                className="flex-1 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800"
              >
                Test Extraction
              </button>
              
              <button
                onClick={goToCampaign}
                disabled={extractedId === null}
                className={`flex-1 py-3 font-medium rounded-md ${
                  extractedId === null 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Go to Campaign
              </button>
            </div>
          </div>
          
          {extractedId !== null && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h3 className="font-medium mb-2">Extraction Result:</h3>
              <div className="bg-white p-3 rounded border">
                <p>Input: <code className="bg-gray-100 px-1">{inputId}</code></p>
                <p>Extracted ID: <code className="bg-gray-100 px-1 font-bold">{extractedId}</code></p>
                <p>Would navigate to: <code className="bg-blue-100 px-1">/campaign/{extractedId}</code></p>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">Supported Format Examples:</h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
              <li>Direct numeric: <code className="bg-gray-100 px-1">0</code>, <code className="bg-gray-100 px-1">42</code></li>
              <li>Formatted: <code className="bg-gray-100 px-1">CAMP-0-634478-aa31cd</code></li>
            </ul>
            <p className="text-xs text-gray-500 mt-1">
              This test page extracts the second number after "CAMP-" when using the formatted ID
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 