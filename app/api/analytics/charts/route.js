import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Directly return mock data for charts
    
    // Mock funding over time data
    const fundingOverTime = [
      { month: 'Jan', amount: 8.2 },
      { month: 'Feb', amount: 10.5 },
      { month: 'Mar', amount: 15.3 },
      { month: 'Apr', amount: 12.7 },
      { month: 'May', amount: 14.1 },
      { month: 'Jun', amount: 16.8 },
      { month: 'Jul', amount: 18.2 },
      { month: 'Aug', amount: 17.5 },
      { month: 'Sep', amount: 21.3 },
      { month: 'Oct', amount: 23.7 },
      { month: 'Nov', amount: 26.8 },
      { month: 'Dec', amount: 32.4 }
    ];

    // Mock category distribution
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'];
    const categoryDistribution = [
      { name: 'Technology', value: 35, color: colors[0] },
      { name: 'Environment', value: 20, color: colors[1] },
      { name: 'Arts', value: 15, color: colors[2] },
      { name: 'Education', value: 10, color: colors[3] },
      { name: 'Health', value: 10, color: colors[4] },
      { name: 'Other', value: 10, color: colors[5] }
    ];

    // Mock governance activity
    const governanceActivity = [
      { month: 'Jan', proposals: 3, votes: 68 },
      { month: 'Feb', proposals: 4, votes: 83 },
      { month: 'Mar', proposals: 5, votes: 112 },
      { month: 'Apr', proposals: 4, votes: 97 },
      { month: 'May', proposals: 6, votes: 134 },
      { month: 'Jun', proposals: 5, votes: 108 },
      { month: 'Jul', proposals: 7, votes: 156 },
      { month: 'Aug', proposals: 8, votes: 172 },
      { month: 'Sep', proposals: 8, votes: 183 },
      { month: 'Oct', proposals: 10, votes: 214 },
      { month: 'Nov', proposals: 12, votes: 248 },
      { month: 'Dec', proposals: 15, votes: 293 }
    ];

    // Updated trending campaigns to match the campaign IDs and titles from the context
    const trendingCampaigns = [
      { id: '1', title: 'Decentralized Education Platform', category: 'Education', fundingPercentage: 40, growth: 12, contributorsCount: 142 },
      { id: '2', title: 'Green Energy Blockchain Solution', category: 'Environment', fundingPercentage: 80, growth: 23, contributorsCount: 267 },
      { id: '3', title: 'Community-Owned Marketplace', category: 'Commerce', fundingPercentage: 40, growth: 8, contributorsCount: 89 }
    ];

    // Return data
    return NextResponse.json({
      fundingOverTime,
      categoryDistribution,
      governanceActivity,
      trendingCampaigns,
      currency: 'TELOS',
      success: true
    });
  } catch (error) {
    console.error('Error fetching analytics chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics chart data', success: false },
      { status: 500 }
    );
  }
} 