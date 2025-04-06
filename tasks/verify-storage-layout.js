const fs = require('fs');
const path = require('path');
const { task } = require('hardhat/config');

task('verify-storage-layout', 'Verifies storage layout compatibility between contract versions')
  .addParam('contract1', 'The first contract to compare')
  .addParam('contract2', 'The second contract to compare')
  .setAction(async (taskArgs, hre) => {
    console.log(`Comparing storage layout between ${taskArgs.contract1} and ${taskArgs.contract2}`);
    
    // Generate storage layouts
    await hre.run('compile');
    
    // Build storage layout for first contract
    await hre.run('compile:solidity:get-storage-layout', {
      contractName: taskArgs.contract1,
    });
    
    // Build storage layout for second contract
    await hre.run('compile:solidity:get-storage-layout', {
      contractName: taskArgs.contract2,
    });
    
    // Read storage layout files
    const artifactsPath = path.join(hre.config.paths.artifacts, 'build-info');
    const files = fs.readdirSync(artifactsPath);
    
    // Find the latest build info files
    const buildInfoFiles = files.filter(file => file.endsWith('.json'));
    const latestBuildInfo = buildInfoFiles.sort((a, b) => {
      return fs.statSync(path.join(artifactsPath, b)).mtime.getTime() - 
             fs.statSync(path.join(artifactsPath, a)).mtime.getTime();
    })[0];
    
    const buildInfoPath = path.join(artifactsPath, latestBuildInfo);
    const buildInfo = require(buildInfoPath);
    
    // Extract storage layouts
    const contract1StorageLayout = extractStorageLayout(buildInfo, taskArgs.contract1);
    const contract2StorageLayout = extractStorageLayout(buildInfo, taskArgs.contract2);
    
    if (!contract1StorageLayout || !contract2StorageLayout) {
      console.error('Failed to extract storage layouts. Make sure the contract names are correct.');
      return;
    }
    
    // Compare storage layouts
    const incompatibilities = compareStorageLayouts(contract1StorageLayout, contract2StorageLayout);
    
    if (incompatibilities.length === 0) {
      console.log('✅ Storage layouts are compatible!');
    } else {
      console.log('❌ Storage layouts are NOT compatible:');
      incompatibilities.forEach(issue => {
        console.log(`- ${issue}`);
      });
      console.log('\nMake sure you only add new variables at the end of storage contracts and don\'t modify existing ones.');
    }
  });

function extractStorageLayout(buildInfo, contractName) {
  const { output } = buildInfo;
  const contractKeys = Object.keys(output.contracts);
  
  for (const file of contractKeys) {
    const contracts = output.contracts[file];
    if (contracts[contractName]) {
      const storageLayout = output.contracts[file][contractName].storageLayout;
      if (storageLayout) {
        return storageLayout;
      }
    }
  }
  
  return null;
}

function compareStorageLayouts(layout1, layout2) {
  const issues = [];
  
  // Compare storage slots
  const slots1 = layout1.storage;
  const slots2 = layout2.storage;
  
  // Check for missing variables in the second contract
  slots1.forEach((slot1, index) => {
    const slot2 = slots2.find(s => s.label === slot1.label);
    
    if (!slot2) {
      issues.push(`Variable '${slot1.label}' exists in the first contract but is missing in the second`);
      return;
    }
    
    // Check if storage slots are different
    if (slot1.slot !== slot2.slot) {
      issues.push(`Variable '${slot1.label}' is at slot ${slot1.slot} in the first contract but at slot ${slot2.slot} in the second`);
    }
    
    // Check if variable types are different
    if (slot1.type !== slot2.type) {
      issues.push(`Variable '${slot1.label}' is of type '${slot1.type}' in the first contract but '${slot2.type}' in the second`);
    }
    
    // Check if offsets are different
    if (slot1.offset !== slot2.offset) {
      issues.push(`Variable '${slot1.label}' has offset ${slot1.offset} in the first contract but offset ${slot2.offset} in the second`);
    }
  });
  
  // Check for variables in the second contract that might modify storage layout
  // (except for appended variables, which are allowed)
  const maxSlot1 = Math.max(...slots1.map(s => parseInt(s.slot)));
  
  slots2.forEach(slot2 => {
    // Variables in slots beyond the max slot of the first contract are allowed (appending)
    if (parseInt(slot2.slot) <= maxSlot1) {
      const slot1 = slots1.find(s => s.label === slot2.label);
      
      // If this variable exists in the first contract with a different slot, it was already reported above
      if (!slot1) {
        issues.push(`Variable '${slot2.label}' exists in the second contract but not in the first, possibly disrupting storage layout`);
      }
    }
  });
  
  // Compare storage types
  const types1 = layout1.types;
  const types2 = layout2.types;
  
  // Check for types that changed
  Object.keys(types1).forEach(typeKey => {
    const type1 = types1[typeKey];
    const type2 = types2[typeKey];
    
    if (!type2) {
      issues.push(`Type '${typeKey}' exists in the first contract but is missing in the second`);
      return;
    }
    
    // Check if the type definition changed in a breaking way
    if (type1.numberOfBytes !== type2.numberOfBytes) {
      issues.push(`Type '${typeKey}' has ${type1.numberOfBytes} bytes in the first contract but ${type2.numberOfBytes} bytes in the second`);
    }
  });
  
  return issues;
}

module.exports = {}; 