const fs = require('fs');
const path = require('path');

// Path to the JSON file
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'proofs.json');

// Check if file exists
if (!fs.existsSync(DATA_FILE_PATH)) {
  console.log('Proofs database file not found. No pending proofs exist.');
  process.exit(0);
}

try {
  // Read and parse the file
  const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
  const proofs = JSON.parse(data);
  
  console.log(`Found ${proofs.length} proof entries:`);
  console.log('------------------------------------');
  
  // Display all proofs with their status
  proofs.forEach((proof, index) => {
    console.log(`Proof #${index + 1}:`);
    console.log(`  Campaign ID: ${proof.campaignId}`);
    console.log(`  Milestone Index: ${proof.milestoneIndex}`);
    console.log(`  Status: ${proof.status}`);
    console.log(`  Transaction Hash: ${proof.transactionHash || 'None'}`);
    console.log(`  Created: ${new Date(proof.createdAt).toLocaleString()}`);
    console.log(`  Last Updated: ${new Date(proof.updatedAt).toLocaleString()}`);
    console.log('------------------------------------');
  });
  
} catch (error) {
  console.error('Error reading proofs file:', error);
} 