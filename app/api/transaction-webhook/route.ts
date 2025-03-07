import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ProofEntry } from '../proofs/route';

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

// Update proof status by transaction hash
const updateProofStatus = (transactionHash: string, status: 'pending' | 'confirmed' | 'rejected'): boolean => {
  const allProofs = getProofs();
  let updated = false;
  
  const updatedProofs = allProofs.map(proof => {
    if (proof.transactionHash === transactionHash) {
      updated = true;
      return {
        ...proof,
        status,
        updatedAt: Date.now()
      };
    }
    return proof;
  });
  
  if (updated) {
    saveProofs(updatedProofs);
  }
  
  return updated;
};

// POST handler for transaction webhook
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log the received webhook data
    console.log('Received transaction webhook:', data);
    
    // Validate required fields
    if (!data.transactionHash || !data.status) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionHash, status' },
        { status: 400 }
      );
    }
    
    // Map external status to our internal status
    let internalStatus: 'pending' | 'confirmed' | 'rejected';
    switch (data.status.toLowerCase()) {
      case 'confirmed':
      case 'success':
      case 'completed':
        internalStatus = 'confirmed';
        break;
      case 'failed':
      case 'error':
      case 'rejected':
        internalStatus = 'rejected';
        break;
      default:
        internalStatus = 'pending';
    }
    
    // Update the proof status
    const updated = updateProofStatus(data.transactionHash, internalStatus);
    
    if (updated) {
      return NextResponse.json({
        message: `Transaction status updated to ${internalStatus}`,
        transactionHash: data.transactionHash
      });
    } else {
      return NextResponse.json({
        message: 'No proofs found with the provided transaction hash',
        transactionHash: data.transactionHash
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error processing transaction webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction webhook' },
      { status: 500 }
    );
  }
} 