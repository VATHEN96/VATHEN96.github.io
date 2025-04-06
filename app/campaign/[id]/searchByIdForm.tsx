"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import extractNumericId from "../../../utils/extractNumericId";

export default function CampaignSearchById() {
  const [campaignId, setCampaignId] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const currentId = params?.id || "";
  
  // Set formatted ID if we're on campaign 0
  useEffect(() => {
    if (currentId === "0" || searchParams?.get("formatted") === "true") {
      setCampaignId("CAMP-0-046394-ea31cd");
    }
  }, [currentId, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setError("");

    const inputId = campaignId.trim();
    
    if (!inputId) {
      setError("Please enter a campaign ID");
      setIsSearching(false);
      return;
    }

    // Special case for formatted Campaign 0 IDs
    if (inputId.match(/camp-0-[\w-]+/i)) {
      router.push("/campaign/0?formatted=true");
      return;
    }

    // Handle numeric input
    if (/^\d+$/.test(inputId)) {
      router.push(`/campaign/${inputId}`);
      return;
    }

    // Handle CAMP-X-... format by extracting the numeric portion
    const campMatch = inputId.match(/camp-(\d+)/i);
    if (campMatch && campMatch[1]) {
      router.push(`/campaign/${campMatch[1]}`);
      return;
    }

    // Last resort, try to extract any numeric ID
    try {
      const numericId = extractNumericId(inputId);
      if (numericId !== null) {
        router.push(`/campaign/${numericId}`);
        return;
      }
      
      setError("Unable to process this ID format. Please enter a numeric ID or formatted ID like CAMP-0-XXXXXX-XXXXXX");
      setIsSearching(false);
    } catch (err) {
      setError("An error occurred processing the campaign ID");
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h2 className="text-xl font-bold text-black dark:text-white mb-4">
        Find Campaign by ID
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="campaignId" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Campaign ID
          </label>
          <div className="relative">
            <input
              id="campaignId"
              type="text"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="Enter campaign ID or number"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-900 text-black dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Enter a numeric ID (e.g., 0) or formatted ID (e.g., CAMP-0-046394-ea31cd)
          </p>
        </div>
        
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : 'Find Campaign'}
        </button>
      </form>
    </div>
  );
} 