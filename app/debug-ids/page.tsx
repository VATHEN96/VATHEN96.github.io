'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import BlockchainServiceFixedV3Instance from '@/services/blockchainServiceFixedV3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DebugCampaignIds() {
  const [inputId, setInputId] = useState('');
  const [results, setResults] = useState<{method: string, result: any}[]>([]);
  const [examples, setExamples] = useState<string[]>([]);
  const router = useRouter();

  // Create sample campaign IDs
  useEffect(() => {
    if (!BlockchainServiceFixedV3Instance?.formatCampaignId) return;
    
    const exampleIds = [
      BlockchainServiceFixedV3Instance.formatCampaignId(0),
      BlockchainServiceFixedV3Instance.formatCampaignId(1),
      '0',
      '1',
      'CAMP-0-634478-aa31cd'
    ];
    
    setExamples(exampleIds);
  }, []);

  const testId = (id: string) => {
    const testResults = [];
    
    // Test 1: Direct numeric conversion
    try {
      const numericId = Number(id);
      testResults.push({
        method: 'Direct Number conversion',
        result: isNaN(numericId) ? 'NaN' : numericId
      });
    } catch (err) {
      testResults.push({
        method: 'Direct Number conversion',
        result: `Error: ${err}`
      });
    }
    
    // Test 2: Using regex to check format
    try {
      const matches = id.match(/^CAMP-(\d+)/i);
      testResults.push({
        method: 'Regex /^CAMP-(\\d+)/i',
        result: matches ? `Match: [${matches.join(', ')}]` : 'No match'
      });
    } catch (err) {
      testResults.push({
        method: 'Regex /^CAMP-(\\d+)/i',
        result: `Error: ${err}`
      });
    }
    
    // Test 3: Check full format match
    try {
      const formatMatch = id.match(/^CAMP-\d+-\d+-[a-z0-9]+$/i);
      testResults.push({
        method: 'Regex full format',
        result: formatMatch ? 'Valid format' : 'Invalid format'
      });
    } catch (err) {
      testResults.push({
        method: 'Regex full format',
        result: `Error: ${err}`
      });
    }
    
    // Test 4: Using extractNumericId
    if (BlockchainServiceFixedV3Instance?.extractNumericId) {
      try {
        const extracted = BlockchainServiceFixedV3Instance.extractNumericId(id);
        testResults.push({
          method: 'BlockchainService.extractNumericId',
          result: extracted === null ? 'null' : extracted
        });
      } catch (err) {
        testResults.push({
          method: 'BlockchainService.extractNumericId',
          result: `Error: ${err}`
        });
      }
    }
    
    // Test 5: Split by hyphen
    try {
      const parts = id.split('-');
      testResults.push({
        method: 'String.split("-")',
        result: `Parts: [${parts.join(', ')}]`
      });
      
      if (parts.length >= 2 && parts[0].toUpperCase() === 'CAMP') {
        const numericId = Number(parts[1]);
        testResults.push({
          method: 'Classic parse: parts[1]',
          result: isNaN(numericId) ? 'NaN' : numericId
        });
      }
    } catch (err) {
      testResults.push({
        method: 'String.split("-")',
        result: `Error: ${err}`
      });
    }
    
    setResults(testResults);
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Campaign ID Debug Tool</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Campaign ID Parsing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label htmlFor="campaignId" className="block text-sm font-medium mb-1">
                  Enter Campaign ID to Test
                </label>
                <div className="flex gap-2">
                  <input
                    id="campaignId"
                    type="text"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                    placeholder="CAMP-0-634478-aa31cd"
                    className="flex-1 px-4 py-2 border-2 rounded-md focus:outline-none"
                  />
                  <Button 
                    onClick={() => testId(inputId)}
                    variant="default"
                  >
                    Test
                  </Button>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Example IDs to Test:</h3>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example, i) => (
                    <Button 
                      key={i}
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setInputId(example);
                        testId(example);
                      }}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result, i) => (
                    <div key={i} className="border p-3 rounded-md">
                      <p className="font-medium">{result.method}:</p>
                      <p className="font-mono text-sm">{JSON.stringify(result.result)}</p>
                    </div>
                  ))}
                  
                  <Button 
                    onClick={() => {
                      const numericId = BlockchainServiceFixedV3Instance?.extractNumericId(inputId);
                      if (numericId !== null && numericId !== undefined) {
                        router.push(`/campaign/${numericId}`);
                      }
                    }}
                    className="mt-4 w-full"
                    variant="default"
                  >
                    Navigate to Campaign (if valid)
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">Enter a campaign ID and click "Test" to see results</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 