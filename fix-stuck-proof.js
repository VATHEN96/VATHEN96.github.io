const fs = require('fs');
const path = require('path');

// Get command line arguments
const campaignId = process.argv[2];
const milestoneIndex = parseInt(process.argv[3]);
const newStatus = process.argv[4] || 'confirmed';

// Check required arguments
if (!campaignId || isNaN(milestoneIndex)) {
  console.log('Usage: node fix-stuck-proof.js <campaignId> <milestoneIndex> [newStatus]');
  console.log('Example: node fix-stuck-proof.js 5 0 confirmed');
  console.log('Status options: confirmed, rejected, pending (default: confirmed)');
  process.exit(1);
}

// Path to our JSON file
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'proofs.json');

// Check if file exists
if (!fs.existsSync(DATA_FILE_PATH)) {
  console.log('Proofs database file not found. No proofs to update.');
  process.exit(1);
}

try {
  // Read and parse the file
  const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
  const proofs = JSON.parse(data);
  
  // Find the proof to update
  const proofIndex = proofs.findIndex(
    proof => proof.campaignId === campaignId && proof.milestoneIndex === milestoneIndex
  );
  
  if (proofIndex === -1) {
    console.log(`No proof found for campaign ${campaignId}, milestone ${milestoneIndex}`);
    process.exit(1);
  }
  
  // Show the proof before update
  console.log('Current proof status:');
  console.log(`  Campaign ID: ${proofs[proofIndex].campaignId}`);
  console.log(`  Milestone Index: ${proofs[proofIndex].milestoneIndex}`);
  console.log(`  Status: ${proofs[proofIndex].status}`);
  console.log(`  Transaction Hash: ${proofs[proofIndex].transactionHash || 'None'}`);
  
  // Update the proof
  proofs[proofIndex] = {
    ...proofs[proofIndex],
    status: newStatus,
    updatedAt: Date.now()
  };
  
  // Save the updated proofs
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(proofs, null, 2));
  
  console.log('\nProof updated successfully:');
  console.log(`  New Status: ${newStatus}`);
  console.log(`  Updated At: ${new Date().toLocaleString()}`);
  
} catch (error) {
  console.error('Error updating proof:', error);
} 