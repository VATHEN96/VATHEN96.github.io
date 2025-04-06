// Script to verify storage layout compatibility between implementations
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");
const axios = require('axios');
const FormData = require('form-data');

/**
 * Verifies that the storage layout of a contract is compatible with a previous implementation
 * for safe upgradeability.
 * 
 * @param {Object} taskArgs Arguments from Hardhat task
 * @param {string} taskArgs.contract Contract name to verify
 * @param {string} taskArgs.oldHash IPFS hash of old layout (optional)
 * @returns {Object} Result with compatibility status and details
 */
async function main(taskArgs = {}) {
  try {
    const contractName = taskArgs.contract;
    if (!contractName) {
      throw new Error("Contract name must be provided with --contract");
    }

    // Check for Pinata API credentials
    const PINATA_API_KEY = process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const PINATA_API_SECRET = process.env.PINATA_API_SECRET || process.env.NEXT_PUBLIC_PINATA_API_SECRET;
    
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      throw new Error("Pinata API credentials not found. Set PINATA_API_KEY and PINATA_API_SECRET in your .env file.");
    }

    // Get build info for the contract
    await ethers.getContractFactory(contractName);
    
    // Path to cache directory where Hardhat stores build info
    const cachePath = path.resolve(__dirname, '../artifacts/build-info');
    
    // Find the most recent build-info file
    const buildInfoFiles = fs.readdirSync(cachePath).filter(f => f.endsWith('.json'));
    if (buildInfoFiles.length === 0) {
      throw new Error("No build info files found. Run 'npx hardhat compile' first.");
    }
    
    // Sort by modification time (newest first)
    buildInfoFiles.sort((a, b) => {
      return fs.statSync(path.join(cachePath, b)).mtime.getTime() - 
             fs.statSync(path.join(cachePath, a)).mtime.getTime();
    });
    
    // Read the storage layout from the build-info file
    const buildInfoPath = path.join(cachePath, buildInfoFiles[0]);
    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
    
    // Extract storage layout for the target contract
    const output = buildInfo.output.contracts;
    let currentLayout = null;
    
    // Find the contract in the output
    for (const sourcePath in output) {
      if (output[sourcePath][contractName] && 
          output[sourcePath][contractName].storageLayout) {
        currentLayout = output[sourcePath][contractName].storageLayout;
        break;
      }
    }
    
    if (!currentLayout) {
      throw new Error(`Storage layout not found for ${contractName}. Make sure storageLayout is enabled in hardhat.config.cjs.`);
    }
    
    // Create data to save to IPFS
    const layoutData = {
      contractName,
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      timestamp: new Date().toISOString(),
      layout: currentLayout
    };
    
    // Upload current layout to IPFS via Pinata
    console.log(`Uploading current storage layout for ${contractName} to IPFS via Pinata...`);
    
    const formData = new FormData();
    const fileContent = JSON.stringify(layoutData, null, 2);
    formData.append('file', Buffer.from(fileContent), {
      filename: `${contractName}-${hre.network.name}-${new Date().toISOString()}.json`,
      contentType: 'application/json',
    });
    
    // Add pinata metadata
    formData.append('pinataMetadata', JSON.stringify({
      name: `StorageLayout-${contractName}-${hre.network.name}`,
      keyvalues: {
        contractName,
        network: hre.network.name,
        chainId: hre.network.config.chainId?.toString(),
        timestamp: new Date().toISOString()
      }
    }));
    
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1
    }));
    
    // Upload to Pinata
    const uploadResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET
      }
    });
    
    if (!uploadResponse.data || !uploadResponse.data.IpfsHash) {
      throw new Error("Failed to upload layout to IPFS via Pinata");
    }
    
    const currentLayoutHash = uploadResponse.data.IpfsHash;
    console.log(`✅ Storage layout uploaded successfully with IPFS hash: ${currentLayoutHash}`);
    
    let isCompatible = true;
    let incompatibleChanges = [];
    
    // If an old hash is provided, compare with that specific layout
    const oldLayoutHash = taskArgs.oldHash;
    if (oldLayoutHash) {
      console.log(`Comparing with previous layout from IPFS hash: ${oldLayoutHash}`);
      
      try {
        // Fetch the old layout from IPFS
        const oldLayoutResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${oldLayoutHash}`);
        
        if (oldLayoutResponse.data && oldLayoutResponse.data.layout) {
          const result = compareStorageLayouts(oldLayoutResponse.data.layout, currentLayout);
          isCompatible = result.compatible;
          incompatibleChanges = result.incompatibleChanges;
          
          if (isCompatible) {
            console.log("✅ Storage layout is compatible for upgrading");
          } else {
            console.log("❌ Storage layout has incompatible changes:");
            incompatibleChanges.forEach(change => {
              console.log(`- ${change}`);
            });
          }
        } else {
          console.log(`Could not retrieve layout from IPFS hash: ${oldLayoutHash}`);
        }
      } catch (error) {
        console.error(`Error fetching previous layout: ${error.message}`);
      }
    } else {
      // Try to find a previous layout by querying Pinata
      try {
        const filters = {
          status: 'pinned',
          metadata: {
            name: { $regex: `StorageLayout-${contractName}-${hre.network.name}` }
          }
        };
        
        const filterResponse = await axios.get('https://api.pinata.cloud/data/pinList', {
          params: {
            status: 'pinned',
            metadata: JSON.stringify(filters.metadata)
          },
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_API_SECRET
          }
        });
        
        const pins = filterResponse.data.rows || [];
        
        // Filter out the current pin and sort by timestamp (newest first)
        const previousPins = pins
          .filter(pin => pin.ipfs_pin_hash !== currentLayoutHash)
          .sort((a, b) => new Date(b.metadata.keyvalues.timestamp) - new Date(a.metadata.keyvalues.timestamp));
        
        if (previousPins.length > 0) {
          const previousPin = previousPins[0];
          const previousHash = previousPin.ipfs_pin_hash;
          
          console.log(`Found previous layout with IPFS hash: ${previousHash}`);
          
          // Fetch the previous layout
          const oldLayoutResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${previousHash}`);
          
          if (oldLayoutResponse.data && oldLayoutResponse.data.layout) {
            const result = compareStorageLayouts(oldLayoutResponse.data.layout, currentLayout);
            isCompatible = result.compatible;
            incompatibleChanges = result.incompatibleChanges;
            
            if (isCompatible) {
              console.log("✅ Storage layout is compatible for upgrading");
            } else {
              console.log("❌ Storage layout has incompatible changes:");
              incompatibleChanges.forEach(change => {
                console.log(`- ${change}`);
              });
            }
          }
        } else {
          console.log("No previous layout found to compare with");
        }
      } catch (error) {
        console.error(`Error searching for previous layouts: ${error.message}`);
      }
    }
    
    // Store comparison results in IPFS if there are incompatible changes
    if (incompatibleChanges.length > 0) {
      try {
        const comparisonData = {
          contractName,
          network: hre.network.name,
          chainId: hre.network.config.chainId,
          currentLayoutHash,
          previousLayoutHash: oldLayoutHash || (previousPins && previousPins[0]?.ipfs_pin_hash),
          compatible: isCompatible,
          incompatibleChanges,
          timestamp: new Date().toISOString()
        };
        
        const comparisonFormData = new FormData();
        const comparisonContent = JSON.stringify(comparisonData, null, 2);
        
        comparisonFormData.append('file', Buffer.from(comparisonContent), {
          filename: `LayoutComparison-${contractName}-${new Date().toISOString()}.json`,
          contentType: 'application/json',
        });
        
        comparisonFormData.append('pinataMetadata', JSON.stringify({
          name: `LayoutComparison-${contractName}`,
          keyvalues: {
            contractName,
            network: hre.network.name,
            compatible: isCompatible.toString(),
            timestamp: new Date().toISOString()
          }
        }));
        
        await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', comparisonFormData, {
          maxBodyLength: Infinity,
          headers: {
            'Content-Type': `multipart/form-data; boundary=${comparisonFormData._boundary}`,
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_API_SECRET
          }
        });
        
        console.log("Comparison results saved to IPFS");
      } catch (error) {
        console.error(`Error storing comparison results: ${error.message}`);
      }
    }
    
    return { 
      compatible: isCompatible, 
      incompatibleChanges,
      currentLayoutHash
    };
  } catch (error) {
    console.error("Error during storage layout verification:", error);
    throw error;
  }
}

/**
 * Compares two storage layouts for upgrade compatibility
 * 
 * @param {Object} oldLayout Previous storage layout
 * @param {Object} newLayout Current storage layout
 * @returns {Object} Compatibility result with details
 */
function compareStorageLayouts(oldLayout, newLayout) {
  const incompatibleChanges = [];
  
  // Check storage slots
  const oldSlots = oldLayout.storage || [];
  const newSlots = newLayout.storage || [];
  
  // Create maps for easier lookup
  const oldSlotMap = {};
  oldSlots.forEach(slot => {
    oldSlotMap[slot.label] = slot;
  });
  
  // Check if any existing slots were changed or removed
  for (const oldSlot of oldSlots) {
    const newSlot = newSlots.find(s => s.label === oldSlot.label);
    
    // Slot removed
    if (!newSlot) {
      incompatibleChanges.push(`Slot removed: ${oldSlot.label}`);
      continue;
    }
    
    // Type changed
    if (oldSlot.type !== newSlot.type) {
      incompatibleChanges.push(`Type changed for ${oldSlot.label}: ${oldSlot.type} -> ${newSlot.type}`);
    }
    
    // Storage slot changed
    if (oldSlot.slot !== newSlot.slot) {
      incompatibleChanges.push(`Storage slot changed for ${oldSlot.label}: ${oldSlot.slot} -> ${newSlot.slot}`);
    }
    
    // Offset changed
    if (oldSlot.offset !== newSlot.offset) {
      incompatibleChanges.push(`Offset changed for ${oldSlot.label}: ${oldSlot.offset} -> ${newSlot.offset}`);
    }
  }
  
  // Check if struct definitions have changed
  const oldTypes = oldLayout.types || {};
  const newTypes = newLayout.types || {};
  
  for (const typeName in oldTypes) {
    const oldType = oldTypes[typeName];
    const newType = newTypes[typeName];
    
    // Type removed
    if (!newType) {
      incompatibleChanges.push(`Type removed: ${typeName}`);
      continue;
    }
    
    // Type kind changed
    if (oldType.label !== newType.label) {
      incompatibleChanges.push(`Type kind changed for ${typeName}: ${oldType.label} -> ${newType.label}`);
    }
    
    // If struct, check members
    if (oldType.members && newType.members) {
      const oldMembers = {};
      oldType.members.forEach(member => {
        oldMembers[member.label] = member;
      });
      
      // Check if members were changed or removed
      for (const oldMember of oldType.members) {
        const newMember = newType.members.find(m => m.label === oldMember.label);
        
        // Member removed
        if (!newMember) {
          incompatibleChanges.push(`Struct member removed from ${typeName}: ${oldMember.label}`);
          continue;
        }
        
        // Member type changed
        if (oldMember.type !== newMember.type) {
          incompatibleChanges.push(`Type changed for ${typeName}.${oldMember.label}: ${oldMember.type} -> ${newMember.type}`);
        }
        
        // Member slot changed
        if (oldMember.slot !== newMember.slot) {
          incompatibleChanges.push(`Slot changed for ${typeName}.${oldMember.label}: ${oldMember.slot} -> ${newMember.slot}`);
        }
      }
    }
  }
  
  return {
    compatible: incompatibleChanges.length === 0,
    incompatibleChanges
  };
}

// Execute verification when run directly
if (require.main === module) {
  main()
    .then((result) => {
      if (!result.compatible) {
        console.log("\n⚠️ Warning: Storage layout has incompatible changes! Review before deploying.\n");
        process.exit(1);
      }
      console.log("\nStorage layout verification completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Storage layout verification failed:", error);
      process.exit(1);
    });
}

// Export for use as a module
module.exports = { main }; 