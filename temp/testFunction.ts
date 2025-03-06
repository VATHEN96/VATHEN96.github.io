interface Campaign {
  campaignType: string;
  equityPercentage: string;
  goalAmount: string;
}

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

// Test the function
const testCampaign = {
  campaignType: "1",
  equityPercentage: "1000", // 10%
  goalAmount: "100000"
};

console.log(calculateValuation(testCampaign)); 