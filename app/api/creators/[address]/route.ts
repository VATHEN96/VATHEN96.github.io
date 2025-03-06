import { NextRequest, NextResponse } from 'next/server';
import { VerificationLevel } from '@/context/wowzarushContext';

// In a real implementation, this would use a database
// For this example, we'll use in-memory storage
const creatorProfiles = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();
  
  // Get the creator profile
  const profile = creatorProfiles.get(address);
  
  if (!profile) {
    return NextResponse.json(
      { error: 'Creator not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(profile);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();
  
  try {
    const data = await request.json();
    
    // Validate the request data
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    // Get the existing profile or create a new one
    let profile = creatorProfiles.get(address);
    
    if (!profile) {
      // Create a new profile
      profile = {
        address,
        displayName: `Creator ${address.substring(0, 6)}`,
        bio: "",
        profileImageUrl: "",
        verificationLevel: VerificationLevel.UNVERIFIED,
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
    }
    
    // Update the profile with the new data
    // Note: In a real implementation, you would validate and sanitize the input
    const updatedProfile = {
      ...profile,
      ...data,
      // Ensure these fields aren't overridden
      address,
      verificationLevel: data.verificationLevel || profile.verificationLevel,
      stats: {
        ...profile.stats,
        ...(data.stats || {})
      }
    };
    
    // Save the updated profile
    creatorProfiles.set(address, updatedProfile);
    
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating creator profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 