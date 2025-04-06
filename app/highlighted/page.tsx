"use client";

import Navbar from "@/components/navbar";
import HighlightedCampaigns from "@/components/HighlightedCampaigns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function HighlightedCampaignsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Back button and header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-black dark:text-white">Top 10 Highlighted Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            The most popular and highly voted campaigns on WowzaRush
          </p>
        </div>
        
        {/* Information card */}
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-8 border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200">
            Highlighted campaigns are selected based on community votes, funding success, and engagement metrics.
          </p>
        </div>
        
        {/* Campaigns grid */}
        <HighlightedCampaigns />
      </main>
    </div>
  );
} 