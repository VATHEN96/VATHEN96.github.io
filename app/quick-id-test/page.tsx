'use client';

import React, { useState, useEffect } from 'react';
import BlockchainServiceFixedV3Instance from '@/services/blockchainServiceFixedV3';
import Navbar from '@/components/navbar';
import Link from 'next/link';

export default function QuickIdTest() {
  const [testId, setTestId] = useState('CAMP-0-634478-aa31cd');
  const [numericResult, setNumericResult] = useState<number | null>(null);
  const [navigateUrl, setNavigateUrl] = useState<string>('');
  
  const testExtraction = () => {
    try {
      console.log("Testing extraction for:", testId);
      // Use the service directly
      const result = BlockchainServiceFixedV3Instance.extractNumericId(testId);
      setNumericResult(result);
      setNavigateUrl(`/campaign/${result}`);
    } catch (e) {
      console.error("Error during test:", e);
    }
  };
  
  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Quick ID Extraction Test</h1>
        
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-black">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Test ID
            </label>
            <input
              type="text"
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <button
            onClick={testExtraction}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium mb-4"
          >
            Test ID Extraction
          </button>
          
          {numericResult !== null && (
            <div className="border border-gray-200 rounded p-4 bg-gray-50 dark:bg-gray-700">
              <h3 className="font-medium mb-2">Result:</h3>
              <p className="mb-1">Input: <span className="font-mono">{testId}</span></p>
              <p className="mb-1">Extracted ID: <span className="font-mono font-bold">{numericResult}</span></p>
              <p className="mb-4">Navigate URL: <span className="font-mono text-blue-600">{navigateUrl}</span></p>
              
              <Link
                href={navigateUrl}
                className="block text-center bg-black text-white dark:bg-white dark:text-black py-2 rounded font-medium"
              >
                Go To Campaign
              </Link>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-500">
            <p>This test uses the actual blockchain service extraction logic:</p>
            <p className="font-mono mt-1">BlockchainServiceFixedV3Instance.extractNumericId()</p>
          </div>
        </div>
      </div>
    </div>
  );
} 