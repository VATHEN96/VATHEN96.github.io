import { NextResponse } from 'next/server';

// In a real implementation, this would use a database
// For this example, we'll use in-memory storage
const creatorProfiles = new Map();

// Simplified API routes with minimal type annotations for Next.js 15
export async function GET(request: Request, context: any) {
  const address = context.params.address.toLowerCase();
  
  // Get the creator profile
  const profile = creatorProfiles.get(address) || {
    address,
    displayName: `Creator ${address.substring(0, 6)}`,
    bio: "No bio available",
    profileImageUrl: "",
    verificationLevel: "UNVERIFIED",
    socialLinks: {},
    stats: {
      campaignsCreated: 0,
      successfulCampaigns: 0,
      totalFundsRaised: "0",
      completedMilestones: 0,
      totalContributors: 0
    },
    badges: []
  };
  
  return NextResponse.json(profile);
}

export async function PUT(request: Request, context: any) {
  const address = context.params.address.toLowerCase();
  
  try {
    const data = await request.json();
    
    const profile = {
      address,
      displayName: data.displayName || `Creator ${address.substring(0, 6)}`,
      bio: data.bio || "",
      profileImageUrl: data.profileImageUrl || "",
      verificationLevel: data.verificationLevel || "UNVERIFIED",
      socialLinks: data.socialLinks || {},
      stats: {
        campaignsCreated: data.stats?.campaignsCreated || 0,
        successfulCampaigns: data.stats?.successfulCampaigns || 0,
        totalFundsRaised: data.stats?.totalFundsRaised || "0",
        completedMilestones: data.stats?.completedMilestones || 0,
        totalContributors: data.stats?.totalContributors || 0
      },
      badges: data.badges || []
    };
    
    // Save the updated profile
    creatorProfiles.set(address, profile);
    
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 