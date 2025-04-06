import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return empty data arrays instead of mock data
    return NextResponse.json({
      success: true,
      data: {
        fundingOverTime: [],
        categoryDistribution: [],
        governanceActivity: []
      },
      message: 'No chart data available'
    });
  } catch (error) {
    console.error('Error in analytics charts API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chart data'
    }, { status: 500 });
  }
} 