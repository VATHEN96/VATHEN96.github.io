// Script to upgrade the WowzaRush implementation
const { ethers, run } = require("hardhat");
const axios = require('axios');

async function main() {
  try {
    console.log("Starting WowzaRush contract upgrade process...");
    
    // Get the necessary addresses from environment variables or deployment file
    const proxyAddress = process.env.PROXY_ADDRESS;
    const proxyAdminAddress = process.env.PROXY_ADMIN_ADDRESS;
    
    if (!proxyAddress) {
      console.error("Error: PROXY_ADDRESS environment variable not set");
      process.exit(1);
    }
    
    if (!proxyAdminAddress) {
      console.error("Error: PROXY_ADMIN_ADDRESS environment variable not set");
      process.exit(1);
    }
    
    console.log(`Proxy Address: ${proxyAddress}`);
    console.log(`Proxy Admin Address: ${proxyAdminAddress}`);
    
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log(`Using deployer account: ${deployer.address}`);
    
    // Connect to proxy admin
    console.log("Connecting to proxy admin...");
    const ProxyAdmin = await ethers.getContractFactory("WowzaRushProxyAdmin");
    const proxyAdmin = ProxyAdmin.attach(proxyAdminAddress);
    
    // Get current implementation
    const currentImplementation = await proxyAdmin.getProxyImplementation(proxyAddress);
    console.log(`Current implementation: ${currentImplementation}`);
    
    // First verify storage layout compatibility
    console.log("Verifying storage layout compatibility...");
    const verifyStorage = await run("verify-storage", {
      contract: "WowzaRush"
    });
    
    if (!verifyStorage.compatible) {
      console.error("❌ Storage layout incompatibility detected!");
      console.error("The following incompatible changes were found:");
      verifyStorage.incompatibleChanges.forEach(change => {
        console.error(`- ${change}`);
      });
      
      const forceUpgrade = process.env.FORCE_UPGRADE === "true";
      if (!forceUpgrade) {
        console.error("Upgrade aborted due to storage layout incompatibility.");
        console.error("Set FORCE_UPGRADE=true to override this check.");
        process.exit(1);
      } else {
        console.warn("⚠️ WARNING: Forcing upgrade despite storage layout incompatibility!");
        console.warn("This may corrupt contract state!");
      }
    } else {
      console.log("✅ Storage layout is compatible for upgrading");
    }
    
    // Deploy new implementation
    console.log("Deploying new WowzaRush implementation...");
    const WowzaRush = await ethers.getContractFactory("WowzaRush");
    const newImplementation = await WowzaRush.deploy();
    await newImplementation.deployed();
    
    console.log(`New implementation deployed to: ${newImplementation.address}`);
    
    // Upgrade the proxy
    console.log("Upgrading proxy to new implementation...");
    const upgradeTx = await proxyAdmin.upgrade(proxyAddress, newImplementation.address);
    await upgradeTx.wait();
    
    console.log("Upgrade successful!");
    
    // Verify the new implementation has been set
    const updatedImplementation = await proxyAdmin.getProxyImplementation(proxyAddress);
    console.log(`Updated implementation: ${updatedImplementation}`);
    
    if (updatedImplementation === newImplementation.address) {
      console.log("✅ Upgrade verification successful");
    } else {
      console.log("❌ Upgrade verification failed");
      process.exit(1);
    }
    
    // Connect to the proxy with the new implementation ABI
    const upgradedContract = WowzaRush.attach(proxyAddress);
    
    // Verify contract is working properly after upgrade
    console.log("Verifying contract functionality after upgrade...");
    
    // Verify fee rates are preserved
    const feeRates = await upgradedContract.getFeeRates();
    console.log("Transaction fee rate:", feeRates.transactionFee.toString(), "basis points");
    console.log("Milestone fee rate:", feeRates.milestoneFee.toString(), "basis points");
    console.log("Token discounts enabled:", feeRates.useDiscounts);
    
    console.log("Contract upgrade complete! Users can continue to interact with the contract at the same address.");
    
    // Save upgrade information to IPFS via Pinata
    try {
      const PINATA_API_KEY = process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY;
      const PINATA_API_SECRET = process.env.PINATA_API_SECRET || process.env.NEXT_PUBLIC_PINATA_API_SECRET;
      
      if (PINATA_API_KEY && PINATA_API_SECRET) {
        const FormData = require('form-data');
        
        // Create upgrade record data
        const upgradeData = {
          proxyAddress,
          previousImplementation: currentImplementation,
          newImplementation: newImplementation.address,
          timestamp: new Date().toISOString(),
          network: hre.network.name,
          chainId: hre.network.config.chainId,
          storageLayoutHash: verifyStorage.currentLayoutHash,
          compatible: verifyStorage.compatible
        };
        
        // Create form data for Pinata
        const formData = new FormData();
        const fileContent = JSON.stringify(upgradeData, null, 2);
        formData.append('file', Buffer.from(fileContent), {
          filename: `ContractUpgrade-${hre.network.name}-${new Date().toISOString()}.json`,
          contentType: 'application/json',
        });
        
        // Add pinata metadata
        formData.append('pinataMetadata', JSON.stringify({
          name: `ContractUpgrade-${new Date().toISOString()}`,
          keyvalues: {
            proxyAddress,
            compatible: verifyStorage.compatible.toString(),
            network: hre.network.name,
            timestamp: new Date().toISOString()
          }
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
        
        if (uploadResponse.data && uploadResponse.data.IpfsHash) {
          const upgradeRecordHash = uploadResponse.data.IpfsHash;
          console.log(`✅ Upgrade record saved to IPFS with hash: ${upgradeRecordHash}`);
          
          // Add the IPFS hash to our return object
          upgradeData.ipfsHash = upgradeRecordHash;
        }
      } else {
        console.log("Pinata API credentials not found. Skipping IPFS record.");
      }
    } catch (error) {
      console.error("Error storing upgrade information to IPFS:", error.message);
    }
    
    // Attempt to verify the new implementation on etherscan
    try {
      console.log("Verifying implementation contract on explorer...");
      await hre.run("verify:verify", {
        address: newImplementation.address,
        constructorArguments: [],
      });
      console.log("Implementation verified on explorer!");
    } catch (error) {
      console.log("Error verifying implementation:", error.message);
      console.log("You may need to manually verify the implementation on the explorer.");
    }
    
    return {
      proxy: proxyAddress,
      newImplementation: newImplementation.address,
      previousImplementation: currentImplementation,
      compatible: verifyStorage.compatible,
      storageLayoutHash: verifyStorage.currentLayoutHash
    };
  } catch (error) {
    console.error("Error during upgrade process:", error);
    process.exit(1);
  }
}

// Execute upgrade
main()
  .then((result) => {
    console.log("Upgrade summary:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Upgrade failed:", error);
    process.exit(1);
  }); 