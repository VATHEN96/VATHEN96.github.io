'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';

export default function FixIdTest() {
  const [inputId, setInputId] = useState('CAMP-0-634478-aa31cd');
  const [extractedId, setExtractedId] = useState<number | null>(null);
  const [debug, setDebug] = useState<string>('');
  const router = useRouter();

  const handleDirectNavigation = () => {
    // Direct navigation to campaign/0 without any extraction
    router.push('/campaign/0');
  };

  const handleExtractAndNavigate = () => {
    const id = inputId.trim();
    setDebug(`Starting extraction for: ${id}`);
    
    try {
      // Very simplified extraction - just hardcode it to 0 for this specific ID
      if (id === 'CAMP-0-634478-aa31cd') {
        setExtractedId(0);
        setDebug(`Found exact match for test ID. Extracted ID: 0`);
        router.push('/campaign/0');
        return;
      }
      
      // For any CAMP-0-xxx format
      if (id.startsWith('CAMP-0-')) {
        setExtractedId(0);
        setDebug(`Found CAMP-0-xxx format. Extracted ID: 0`);
        router.push('/campaign/0');
        return;
      }
      
      // Basic CAMP-X-Y-Z format
      if (id.includes('-')) {
        const parts = id.split('-');
        if (parts.length >= 2 && parts[0].toUpperCase() === 'CAMP') {
          const numId = parseInt(parts[1], 10);
          if (!isNaN(numId)) {
            setExtractedId(numId);
            setDebug(`Extracted ID ${numId} from parts: ${parts.join(', ')}`);
            router.push(`/campaign/${numId}`);
            return;
          }
        }
      }
      
      // Fallback for direct numeric input
      if (/^\d+$/.test(id)) {
        const numId = parseInt(id, 10);
        setExtractedId(numId);
        setDebug(`Direct numeric ID: ${numId}`);
        router.push(`/campaign/${numId}`);
        return;
      }
      
      setDebug(`Could not extract ID. Please use the Direct Navigation button.`);
      
    } catch (error) {
      setDebug(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-center">Campaign ID Fixer</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Campaign ID</label>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded mb-2"
            />
            <p className="text-xs text-gray-500">Example: CAMP-0-634478-aa31cd</p>
          </div>
          
          <div className="space-y-3 mb-6">
            <Button 
              onClick={handleExtractAndNavigate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Extract ID and Navigate
            </Button>
            
            <Button 
              onClick={handleDirectNavigation}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Direct Navigation to Campaign 0
            </Button>
          </div>
          
          {debug && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-auto">
              <h3 className="font-medium mb-1">Debug Output:</h3>
              <div className="font-mono text-xs">{debug}</div>
              
              {extractedId !== null && (
                <div className="mt-2 font-semibold">
                  Extracted ID: <span className="text-blue-600">{extractedId}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Use the "Direct Navigation" button to go straight to campaign 0</li>
              <li>This bypasses all ID extraction logic</li>
              <li>If extraction is failing, this is the most reliable option</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
} 