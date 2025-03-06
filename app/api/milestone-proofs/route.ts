import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Define interfaces for our data structure
interface ProofEntry {
  campaignId: string;
  milestoneIndex: number;
  proofContent: string;
  transactionHash?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  timestamp: number;
  account: string;
}

interface ProofsDatabase {
  proofs: ProofEntry[];
}

// Helper function to get the path to our JSON database file
function getDbFilePath() {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Create the data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return path.join(dataDir, 'milestone-proofs.json');
}

// Helper function to read the database
function readProofsDb(): ProofsDatabase {
  const filePath = getDbFilePath();
  
  // Create default structure if file doesn't exist
  if (!fs.existsSync(filePath)) {
    const defaultDb: ProofsDatabase = { proofs: [] };
    fs.writeFileSync(filePath, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  
  // Read and parse the file
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as ProofsDatabase;
  } catch (error) {
    console.error('Error reading proof database:', error);
    return { proofs: [] };
  }
}

// Helper function to write to the database
function writeProofsDb(db: ProofsDatabase) {
  const filePath = getDbFilePath();
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
}

// Handler for GET requests to get proof status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const milestoneIndex = searchParams.get('milestoneIndex');
    const transactionHash = searchParams.get('transactionHash');
    
    const db = readProofsDb();
    
    // Filter proofs based on query parameters
    let filteredProofs = db.proofs;
    
    if (campaignId) {
      filteredProofs = filteredProofs.filter(p => p.campaignId === campaignId);
    }
    
    if (milestoneIndex) {
      filteredProofs = filteredProofs.filter(p => p.milestoneIndex === parseInt(milestoneIndex));
    }
    
    if (transactionHash) {
      filteredProofs = filteredProofs.filter(p => p.transactionHash === transactionHash);
    }
    
    // Return filtered proofs
    return NextResponse.json({ proofs: filteredProofs }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/milestone-proofs:', error);
    return NextResponse.json({ error: error.message || 'Failed to retrieve proof status' }, { status: 500 });
  }
}

// Handler for POST requests to save or update a proof
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, milestoneIndex, proofContent, transactionHash, status, account } = body;
    
    // Validate required fields
    if (!campaignId || milestoneIndex === undefined || !proofContent || !account) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Read the current database
    const db = readProofsDb();
    
    // Check if there's already an entry for this campaign and milestone
    const existingIndex = db.proofs.findIndex(p => 
      p.campaignId === campaignId && p.milestoneIndex === milestoneIndex
    );
    
    const proofEntry: ProofEntry = {
      campaignId,
      milestoneIndex,
      proofContent,
      transactionHash,
      status: status || 'pending',
      timestamp: Date.now(),
      account
    };
    
    // Update or add the entry
    if (existingIndex >= 0) {
      db.proofs[existingIndex] = proofEntry;
    } else {
      db.proofs.push(proofEntry);
    }
    
    // Save the updated database
    writeProofsDb(db);
    
    return NextResponse.json({ success: true, proof: proofEntry }, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST /api/milestone-proofs:', error);
    return NextResponse.json({ error: error.message || 'Failed to save proof' }, { status: 500 });
  }
}

// Handler for PUT requests to update a proof's status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, milestoneIndex, transactionHash, status } = body;
    
    // Validate required fields
    if ((!campaignId || milestoneIndex === undefined) && !transactionHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Read the current database
    const db = readProofsDb();
    
    // Find the entry to update
    let updated = false;
    db.proofs = db.proofs.map(proof => {
      // Match by transaction hash or by campaign + milestone
      if (
        (transactionHash && proof.transactionHash === transactionHash) || 
        (campaignId && proof.campaignId === campaignId && milestoneIndex !== undefined && proof.milestoneIndex === milestoneIndex)
      ) {
        updated = true;
        return { ...proof, status };
      }
      return proof;
    });
    
    if (!updated) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }
    
    // Save the updated database
    writeProofsDb(db);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in PUT /api/milestone-proofs:', error);
    return NextResponse.json({ error: error.message || 'Failed to update proof status' }, { status: 500 });
  }
}

// Handler for DELETE requests to remove a proof
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const milestoneIndex = searchParams.get('milestoneIndex');
    const transactionHash = searchParams.get('transactionHash');
    
    // Validate required fields
    if ((!campaignId || !milestoneIndex) && !transactionHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Read the current database
    const db = readProofsDb();
    
    // Find and remove the entry
    const initialLength = db.proofs.length;
    
    if (transactionHash) {
      db.proofs = db.proofs.filter(p => p.transactionHash !== transactionHash);
    } else {
      db.proofs = db.proofs.filter(p => 
        !(p.campaignId === campaignId && p.milestoneIndex === parseInt(milestoneIndex!))
      );
    }
    
    if (db.proofs.length === initialLength) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }
    
    // Save the updated database
    writeProofsDb(db);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/milestone-proofs:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete proof' }, { status: 500 });
  }
} 