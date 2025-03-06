import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Updated platform stats to align with the campaign data in the context
    const platformStats = {
      totalFundsRaised: 13, // Sum of totalFunded from the 3 campaigns (converted from wei)
      totalCampaigns: 3, // Number of campaigns in the context
      totalContributors: 9, // Sum of donors arrays length from all campaigns
      totalProposals: 10, // Approximate based on milestones
      avgContributionSize: 1.44, // totalFundsRaised / totalContributors
      successRate: 66, // 2 out of 3 campaigns are on track
      topCategory: 'Education', // Most common category
      activeUsers: 9, // Same as contributors for now
      currency: 'TELOS'
    };

    // Return data
    return NextResponse.json({
      platformStats,
      success: true
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', success: false },
      { status: 500 }
    );
  }
} 