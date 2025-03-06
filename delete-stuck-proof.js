const fs = require('fs');
const path = require('path');

// Get command line arguments
const campaignId = process.argv[2];
const milestoneIndex = parseInt(process.argv[3]);

// Check required arguments
if (!campaignId || isNaN(milestoneIndex)) {
  console.log('Usage: node delete-stuck-proof.js <campaignId> <milestoneIndex>');
  console.log('Example: node delete-stuck-proof.js 5 0');
  process.exit(1);
}

// Path to our JSON file
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'proofs.json');

// Check if file exists
if (!fs.existsSync(DATA_FILE_PATH)) {
  console.log('Proofs database file not found. No proofs to delete.');
  process.exit(1);
}

try {
  // Read and parse the file
  const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
  const proofs = JSON.parse(data);
  
  // Find the proof to delete
  const proofIndex = proofs.findIndex(
    proof => proof.campaignId === campaignId && proof.milestoneIndex === milestoneIndex
  );
  
  if (proofIndex === -1) {
    console.log(`No proof found for campaign ${campaignId}, milestone ${milestoneIndex}`);
    process.exit(1);
  }
  
  // Show the proof before deletion
  console.log('About to delete this proof:');
  console.log(`  Campaign ID: ${proofs[proofIndex].campaignId}`);
  console.log(`  Milestone Index: ${proofs[proofIndex].milestoneIndex}`);
  console.log(`  Status: ${proofs[proofIndex].status}`);
  console.log(`  Transaction Hash: ${proofs[proofIndex].transactionHash || 'None'}`);
  console.log(`  Created: ${new Date(proofs[proofIndex].createdAt).toLocaleString()}`);
  
  // Ask for confirmation
  console.log('\nAre you sure you want to delete this proof? This action cannot be undone.');
  console.log('To confirm deletion, run this command with --confirm at the end');
  
  if (process.argv.includes('--confirm')) {
    // Remove the proof
    const filteredProofs = proofs.filter(
      proof => !(proof.campaignId === campaignId && proof.milestoneIndex === milestoneIndex)
    );
    
    // Save the updated proofs
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(filteredProofs, null, 2));
    
    console.log('\nProof deleted successfully.');
  }
  
} catch (error) {
  console.error('Error deleting proof:', error);
} 