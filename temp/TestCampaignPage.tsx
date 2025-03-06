'use client'

import React, { useState } from 'react'

interface Campaign {
  campaignType: string;
  equityPercentage: string;
  goalAmount: string;
  title: string;
}

export default function TestCampaignPage() {
  const [campaign] = useState<Campaign>({
    campaignType: "1",
    equityPercentage: "1000", // 10%
    goalAmount: "100000",
    title: "Test Campaign"
  });

  // Calculate estimated valuation for investment campaigns
  const calculateValuation = (campaign: Campaign): string => {
    if (campaign.campaignType !== "1" || !campaign.equityPercentage || !campaign.goalAmount) {
      return 'N/A';
    }
    
    // Convert equity percentage from basis points (e.g., 550 = 5.5%) to decimal (0.055)
    const equityDecimal = parseFloat(campaign.equityPercentage) / 10000;
    
    if (equityDecimal === 0) return 'N/A';
    
    // Calculate valuation: goalAmount / equityDecimal
    const goalAmountValue = parseFloat(campaign.goalAmount);
    const valuation = goalAmountValue / equityDecimal;
    
    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(valuation);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-100 p-4">
        <h1>WowzaRush</h1>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold">{campaign.title}</h2>
          
          {campaign.campaignType === "1" && (
            <div className="bg-blue-50 p-4 rounded-lg my-4">
              <h3 className="font-semibold">Investment Details</h3>
              <p>Equity Offered: {parseFloat(campaign.equityPercentage) / 100}%</p>
              <p>Valuation: {calculateValuation(campaign)}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 