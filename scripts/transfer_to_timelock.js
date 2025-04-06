// Script to transfer proxy admin rights to the timelock contract
// This will be used when transitioning to Phase 3 of the governance timeline

const { ethers } = require("hardhat");

async function main() {
  console.log("Starting transfer of proxy admin rights to timelock contract...");
  
  // Load environment variables or set defaults
  const proxyAdminAddress = process.env.PROXY_ADMIN_ADDRESS || "";
  const proxyAddress = process.env.PROXY_ADDRESS || "";
  
  if (!proxyAdminAddress) {
    console.error("Error: PROXY_ADMIN_ADDRESS environment variable not set");
    process.exit(1);
  }
  
  if (!proxyAddress) {
    console.error("Error: PROXY_ADDRESS environment variable not set");
    process.exit(1);
  }
  
  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer account: ${deployer.address}`);
  
  // Deploy the timelock contract
  console.log("Deploying WowzaRushTimelock contract...");
  
  // Setup initial timelock parameters
  const normalDelay = 2 * 24 * 60 * 60; // 2 days in seconds
  const emergencyDelay = 24 * 60 * 60; // 1 day in seconds
  
  // Setup initial proposers (core team multi-sig)
  const proposers = [
    process.env.PROPOSER_ADDRESS || deployer.address,
    // Add more proposers as needed
  ];
  
  // Setup initial executors (core team multi-sig + security council)
  const executors = [
    process.env.EXECUTOR_ADDRESS || deployer.address,
    // Add more executors as needed
  ];
  
  // Setup initial guardian (security council multi-sig)
  const guardian = process.env.GUARDIAN_ADDRESS || deployer.address;
  
  const TimelockFactory = await ethers.getContractFactory("WowzaRushTimelock");
  const timelock = await TimelockFactory.deploy(
    normalDelay,
    emergencyDelay,
    proposers,
    executors,
    guardian
  );
  
  await timelock.deployed();
  console.log(`WowzaRushTimelock deployed to: ${timelock.address}`);
  
  // Connect to the proxy admin contract
  console.log("Connecting to WowzaRushProxyAdmin...");
  const ProxyAdminFactory = await ethers.getContractFactory("WowzaRushProxyAdmin");
  const proxyAdmin = await ProxyAdminFactory.attach(proxyAdminAddress);
  
  // Transfer ownership of the proxy admin to the timelock
  console.log("Transferring ownership of WowzaRushProxyAdmin to timelock...");
  const transferTx = await proxyAdmin.transferOwnership(timelock.address);
  await transferTx.wait();
  
  // Verify the new owner
  const newOwner = await proxyAdmin.owner();
  console.log(`New owner of WowzaRushProxyAdmin: ${newOwner}`);
  
  if (newOwner === timelock.address) {
    console.log("✅ Ownership transfer successful!");
  } else {
    console.log("❌ Ownership transfer failed!");
    process.exit(1);
  }
  
  // Create a function call data for testing the timelock
  const proxyImplementation = await proxyAdmin.getProxyImplementation(proxyAddress);
  console.log(`Current implementation of proxy: ${proxyImplementation}`);
  
  // Create example operation for timelock testing (e.g., scheduling a function call)
  // This is just for demonstration purposes
  console.log("\nExample: Scheduling an operation through timelock");
  console.log("-----------------------------------------------");
  console.log("To schedule an upgrade through the timelock, you would:");
  console.log("1. Deploy a new implementation contract");
  console.log("2. Have a proposer schedule the upgrade operation through the timelock");
  console.log(`3. Wait for the delay period (${normalDelay / (24 * 60 * 60)} days for normal operations)`);
  console.log("4. Have an executor execute the operation after the delay");
  
  // Create a sample operation data (example of how to upgrade through timelock)
  const newImplementationAddress = process.env.NEW_IMPLEMENTATION_ADDRESS || proxyImplementation;
  const upgradeCallData = proxyAdmin.interface.encodeFunctionData("upgrade", [
    proxyAddress,
    newImplementationAddress
  ]);
  
  console.log("\nExample operation data:");
  console.log(`Target: ${proxyAdminAddress}`);
  console.log(`Function: upgrade(${proxyAddress}, ${newImplementationAddress})`);
  console.log(`Calldata: ${upgradeCallData}`);
  
  console.log("\nTo schedule this operation:");
  console.log(`await timelock.schedule(
    "${proxyAdminAddress}",
    0,
    "${upgradeCallData}",
    false
  );`);
  
  console.log("\nTo execute after the delay:");
  console.log(`await timelock.execute(
    "${proxyAdminAddress}",
    0,
    "${upgradeCallData}"
  );`);
  
  console.log("\nTransfer to timelock complete! WowzaRush has now entered Phase 3 of governance.");
  console.log("All future upgrade operations will need to go through the timelock.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 