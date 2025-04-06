// scripts/upgrade_contracts.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Upgrading WowzaRush implementation...");

  // You would replace these addresses with the actual deployed addresses
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS;
  const PROXY_ADMIN_ADDRESS = process.env.PROXY_ADMIN_ADDRESS;
  
  if (!PROXY_ADDRESS || !PROXY_ADMIN_ADDRESS) {
    console.error("Please set PROXY_ADDRESS and PROXY_ADMIN_ADDRESS environment variables");
    process.exit(1);
  }

  // Deploy the new implementation contract (this would be WowzaRushV2)
  // For this example, we'll just use WowzaRushV1 again
  const WowzaRushV1 = await ethers.getContractFactory("WowzaRushV1");
  console.log("Deploying new implementation...");
  const newImplementation = await WowzaRushV1.deploy();
  await newImplementation.deployed();
  console.log("New implementation deployed to:", newImplementation.address);

  // Get the proxy admin contract
  const WowzaRushProxyAdmin = await ethers.getContractFactory("WowzaRushProxyAdmin");
  const proxyAdmin = WowzaRushProxyAdmin.attach(PROXY_ADMIN_ADDRESS);

  // Check the current implementation
  const currentImplementation = await proxyAdmin.getProxyImplementation(PROXY_ADDRESS);
  console.log("Current implementation:", currentImplementation);

  // Upgrade the proxy to the new implementation
  console.log("Upgrading proxy...");
  const tx = await proxyAdmin.upgrade(PROXY_ADDRESS, newImplementation.address);
  await tx.wait();
  console.log("Proxy upgraded successfully");

  // Verify the new implementation
  const updatedImplementation = await proxyAdmin.getProxyImplementation(PROXY_ADDRESS);
  console.log("New implementation:", updatedImplementation);

  if (updatedImplementation === newImplementation.address) {
    console.log("Upgrade verified successfully!");
  } else {
    console.error("Upgrade verification failed!");
    process.exit(1);
  }

  // Now we can interact with the proxy with the new implementation
  const wowzaRush = WowzaRushV1.attach(PROXY_ADDRESS);
  
  // Verify the fee rates are preserved
  const feeRates = await wowzaRush.getPlatformFeeRates();
  console.log("Transaction fee rate:", feeRates[0].toString(), "basis points");
  console.log("Milestone fee rate:", feeRates[1].toString(), "basis points");
  console.log("Token discounts enabled:", feeRates[2]);

  console.log("Upgrade complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 