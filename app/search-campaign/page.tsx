"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import extractNumericId from '@/utils/extractNumericId';

export default function SearchCampaignPage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if we need to populate with a formatted ID
  useEffect(() => {
    if (searchParams?.get('formatted') === 'true') {
      setInput('CAMP-0-046394-ea31cd');
    } else if (searchParams?.get('q')) {
      // Set input from query parameter
      setInput(searchParams.get('q') || '');
      // Automatically trigger search if query was provided
      if (searchParams.get('q')?.trim()) {
        handleSearchWithValue(searchParams.get('q') || '');
      }
    }
  }, [searchParams]);
  
  // Separate function to handle search with a specific value
  const handleSearchWithValue = (inputValue: string) => {
    setIsSearching(true);
    setError('');
    
    if (!inputValue.trim()) {
      setError('Please enter a campaign ID');
      setIsSearching(false);
      return;
    }
    
    // Special case for formatted Campaign 0 IDs
    if (inputValue.match(/camp-0-[\w-]+/i)) {
      router.push("/campaign/0?formatted=true");
      return;
    }
    
    // Handle numeric input
    if (/^\d+$/.test(inputValue)) {
      router.push(`/campaign/${inputValue}`);
      return;
    }
    
    // Handle CAMP-X-... format by extracting the numeric portion
    const campMatch = inputValue.match(/camp-(\d+)/i);
    if (campMatch && campMatch[1]) {
      router.push(`/campaign/${campMatch[1]}`);
      return;
    }
    
    // Last resort, try to extract any numeric ID
    try {
      const numericId = extractNumericId(inputValue);
      if (numericId !== null) {
        router.push(`/campaign/${numericId}`);
        return;
      }
      
      setError("Unable to process this ID format. Please enter a numeric ID or formatted ID like CAMP-X-XXXXXX-XXXXXX");
      setIsSearching(false);
    } catch (err) {
      setError("An error occurred processing the campaign ID");
      setIsSearching(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchWithValue(input);
  };
  
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl font-bold mb-6 text-center text-black dark:text-white">
              Find Campaign by ID
            </h1>
            
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label 
                  htmlFor="campaignId" 
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Campaign ID
                </label>
                <div className="relative">
                  <input
                    id="campaignId"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter campaign ID or number"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md 
                              bg-white dark:bg-gray-900 text-black dark:text-white
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
                
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter a numeric ID (e.g., 0) or formatted ID (e.g., CAMP-0-046394-ea31cd)
                  </p>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Find Campaign'}
              </button>
            </form>
            
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <Link
                  href="/"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 