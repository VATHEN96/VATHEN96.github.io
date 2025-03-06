import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

// Define the proof data structure
export interface ProofEntry {
  id: string;
  campaignId: string;
  milestoneIndex: number;
  proofContent: string;
  submitter: string;
  status: 'pending' | 'confirmed' | 'rejected';
  transactionHash?: string;
  createdAt: number;
  updatedAt: number;
}

// Path to our JSON file that will serve as a simple database
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'proofs.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Get all proofs from the JSON file
const getProofs = (): ProofEntry[] => {
  ensureDataDirectory();
  
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([]));
    return [];
  }
  
  try {
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading proofs file:', error);
    return [];
  }
};

// Save proofs to the JSON file
const saveProofs = (proofs: ProofEntry[]) => {
  ensureDataDirectory();
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(proofs, null, 2));
};

// GET handler - retrieve proofs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    
    const allProofs = getProofs();
    
    // Filter proofs by campaignId if provided
    const filteredProofs = campaignId 
      ? allProofs.filter(proof => proof.campaignId === campaignId)
      : allProofs;
    
    return NextResponse.json(filteredProofs);
  } catch (error) {
    console.error('Error fetching proofs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proofs' },
      { status: 500 }
    );
  }
}

// POST handler - create new proof or update existing
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.campaignId || data.milestoneIndex === undefined || !data.proofContent) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, milestoneIndex, proofContent' },
        { status: 400 }
      );
    }
    
    const allProofs = getProofs();
    
    // Check if a proof already exists for this campaign and milestone
    const existingProofIndex = allProofs.findIndex(
      proof => proof.campaignId === data.campaignId && 
              proof.milestoneIndex === data.milestoneIndex
    );
    
    const now = Date.now();
    
    if (existingProofIndex >= 0) {
      // Update existing proof
      allProofs[existingProofIndex] = {
        ...allProofs[existingProofIndex],
        proofContent: data.proofContent || allProofs[existingProofIndex].proofContent,
        submitter: data.submitter || allProofs[existingProofIndex].submitter,
        status: data.status || allProofs[existingProofIndex].status,
        transactionHash: data.transactionHash || allProofs[existingProofIndex].transactionHash,
        updatedAt: now
      };
      
      saveProofs(allProofs);
      
      return NextResponse.json({
        message: 'Proof updated successfully',
        proof: allProofs[existingProofIndex]
      });
    } else {
      // Create new proof
      const newProof: ProofEntry = {
        id: nanoid(),
        campaignId: data.campaignId,
        milestoneIndex: data.milestoneIndex,
        proofContent: data.proofContent,
        submitter: data.submitter || 'anonymous',
        status: data.status || 'pending',
        transactionHash: data.transactionHash,
        createdAt: now,
        updatedAt: now
      };
      
      allProofs.push(newProof);
      saveProofs(allProofs);
      
      return NextResponse.json({
        message: 'Proof created successfully',
        proof: newProof
      });
    }
  } catch (error) {
    console.error('Error creating/updating proof:', error);
    return NextResponse.json(
      { error: 'Failed to create/update proof' },
      { status: 500 }
    );
  }
}

// PATCH handler - update proof status
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.campaignId || data.milestoneIndex === undefined || !data.status) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, milestoneIndex, status' },
        { status: 400 }
      );
    }
    
    const allProofs = getProofs();
    
    // Find the proof to update
    const proofIndex = allProofs.findIndex(
      proof => proof.campaignId === data.campaignId && 
              proof.milestoneIndex === data.milestoneIndex
    );
    
    if (proofIndex === -1) {
      return NextResponse.json(
        { error: 'Proof not found' },
        { status: 404 }
      );
    }
    
    // Update the proof
    allProofs[proofIndex] = {
      ...allProofs[proofIndex],
      status: data.status,
      transactionHash: data.transactionHash || allProofs[proofIndex].transactionHash,
      updatedAt: Date.now()
    };
    
    saveProofs(allProofs);
    
    return NextResponse.json({
      message: 'Proof status updated successfully',
      proof: allProofs[proofIndex]
    });
  } catch (error) {
    console.error('Error updating proof status:', error);
    return NextResponse.json(
      { error: 'Failed to update proof status' },
      { status: 500 }
    );
  }
}

// DELETE handler - remove a proof
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const milestoneIndex = searchParams.get('milestoneIndex');
    
    if (!campaignId || !milestoneIndex) {
      return NextResponse.json(
        { error: 'Missing required query parameters: campaignId, milestoneIndex' },
        { status: 400 }
      );
    }
    
    const allProofs = getProofs();
    
    // Filter out the proof to be deleted
    const filteredProofs = allProofs.filter(
      proof => !(proof.campaignId === campaignId && 
                proof.milestoneIndex === parseInt(milestoneIndex))
    );
    
    // Check if we actually removed any proof
    if (filteredProofs.length === allProofs.length) {
      return NextResponse.json(
        { error: 'Proof not found' },
        { status: 404 }
      );
    }
    
    saveProofs(filteredProofs);
    
    return NextResponse.json({
      message: 'Proof deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting proof:', error);
    return NextResponse.json(
      { error: 'Failed to delete proof' },
      { status: 500 }
    );
  }
} 