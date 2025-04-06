// Script to upgrade the WowzaRush implementation
const { ethers } = require("hardhat");

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
    
    // Deploy new implementation
    console.log("Deploying new WowzaRush implementation...");
    const WowzaRush = await ethers.getContractFactory("WowzaRush");
    const newImplementation = await WowzaRush.deploy();
    await newImplementation.deployed();
    
    console.log(`New implementation deployed to: ${newImplementation.address}`);
    
    // Connect to proxy admin
    console.log("Connecting to proxy admin...");
    const ProxyAdmin = await ethers.getContractFactory("WowzaRushProxyAdmin");
    const proxyAdmin = ProxyAdmin.attach(proxyAdminAddress);
    
    // Get current implementation
    const currentImplementation = await proxyAdmin.getProxyImplementation(proxyAddress);
    console.log(`Current implementation: ${currentImplementation}`);
    
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
      previousImplementation: currentImplementation
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