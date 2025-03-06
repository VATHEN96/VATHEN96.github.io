import { NextRequest, NextResponse } from 'next/server';
import { VerificationLevel } from '@/context/wowzarushContext';

// In a real implementation, this would connect to a KYC/verification service
// For this example, we'll use in-memory storage
const verificationRequests = new Map();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate the request data
    if (!data.address || !data.level) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    const { address, level } = data;
    const normalizedAddress = address.toLowerCase();
    
    // Validate the verification level
    if (!Object.values(VerificationLevel).includes(level)) {
      return NextResponse.json(
        { error: 'Invalid verification level' },
        { status: 400 }
      );
    }
    
    // Create a new verification request
    const requestId = `VER-${Date.now()}-${normalizedAddress.substring(0, 6)}`;
    
    verificationRequests.set(requestId, {
      id: requestId,
      address: normalizedAddress,
      requestedLevel: level,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // In a real implementation, this would trigger a verification flow
    // For this example, we'll simulate a successful verification after a delay
    setTimeout(() => {
      // Simulate successful verification (90% success rate)
      if (Math.random() < 0.9) {
        verificationRequests.set(requestId, {
          ...verificationRequests.get(requestId),
          status: 'approved',
          updatedAt: new Date()
        });
        
        // Update the creator profile in a real implementation
        console.log(`Verification request ${requestId} approved`);
      } else {
        verificationRequests.set(requestId, {
          ...verificationRequests.get(requestId),
          status: 'rejected',
          reason: 'Verification failed. Please try again.',
          updatedAt: new Date()
        });
        
        console.log(`Verification request ${requestId} rejected`);
      }
    }, 5000); // Simulate a 5-second verification process
    
    return NextResponse.json({
      requestId,
      status: 'pending',
      message: 'Verification request submitted successfully'
    });
  } catch (error) {
    console.error('Error processing verification request:', error);
    return NextResponse.json(
      { error: 'Failed to process verification request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');
  
  if (!requestId) {
    return NextResponse.json(
      { error: 'Request ID is required' },
      { status: 400 }
    );
  }
  
  const verificationRequest = verificationRequests.get(requestId);
  
  if (!verificationRequest) {
    return NextResponse.json(
      { error: 'Verification request not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(verificationRequest);
} 