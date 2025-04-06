require('dotenv').config();
const { ethers } = require('hardhat');
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log('\n🚀 Initializing WowzaRush upgradeable contract deployment...\n');

    // Get the deployer's signer
    const [deployer] = await ethers.getSigners();
    console.log('👤 Deployer address:', deployer.address);

    // Check deployer balance
    const initialBalance = await ethers.provider.getBalance(deployer.address);
    const balanceInTLOS = ethers.formatEther(initialBalance);
    console.log('💰 Initial balance:', balanceInTLOS, 'TLOS');
    
    // Ensure sufficient balance
    if (parseFloat(balanceInTLOS) < 1) {
      throw new Error('Insufficient TLOS balance for deployment');
    }

    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log('🌐 Deploying to network:', network.name);
    // Ensure we have a valid chain ID
    if (typeof network.chainId === 'string' && network.chainId.endsWith('n')) {
      network.chainId = parseInt(network.chainId);
    }
    console.log('⛓️  Chain ID:', network.chainId);

    // Get network config for gas settings
    const networkConfig = hre.config.networks[network.name] || {};
    const gasPrice = networkConfig.gasPrice || ethers.parseUnits('50', 'gwei');
    const gasLimit = networkConfig.gas || 4000000;

    console.log('⛽ Gas settings:');
    console.log('   Price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
    console.log('   Limit:', gasLimit);

    // Step 1: Deploy the storage contract (if not deployed already)
    console.log('\n📦 Deploying WowzaRushStorage contract...');
    const WowzaRushStorage = await ethers.getContractFactory('WowzaRushStorage');
    let storageContract;
    try {
      storageContract = await WowzaRushStorage.deploy({
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });
      await storageContract.deployed();
      console.log('✅ WowzaRushStorage deployed to:', storageContract.address);
    } catch (error) {
      console.error('❌ Failed to deploy WowzaRushStorage:', error.message);
      throw error;
    }

    // Step 2: Deploy token contract
    console.log('\n📦 Deploying WowzaRushToken contract...');
    const WowzaRushToken = await ethers.getContractFactory('WowzaRushToken');
    let tokenContract;
    try {
      tokenContract = await WowzaRushToken.deploy({
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });
      await tokenContract.deployed();
      console.log('✅ WowzaRushToken deployed to:', tokenContract.address);
    } catch (error) {
      console.error('❌ Failed to deploy WowzaRushToken:', error.message);
      throw error;
    }

    // Step 3: Deploy the proxy admin
    console.log('\n📦 Deploying WowzaRushProxyAdmin contract...');
    const WowzaRushProxyAdmin = await ethers.getContractFactory('WowzaRushProxyAdmin');
    let proxyAdmin;
    try {
      proxyAdmin = await WowzaRushProxyAdmin.deploy({
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });
      await proxyAdmin.deployed();
      console.log('✅ WowzaRushProxyAdmin deployed to:', proxyAdmin.address);
    } catch (error) {
      console.error('❌ Failed to deploy WowzaRushProxyAdmin:', error.message);
      throw error;
    }

    // Step 4: Deploy the implementation contract
    console.log('\n📦 Deploying WowzaRush implementation contract...');
    const WowzaRush = await ethers.getContractFactory('WowzaRush');
    let implementation;
    try {
      implementation = await WowzaRush.deploy({
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });
      await implementation.deployed();
      console.log('✅ WowzaRush implementation deployed to:', implementation.address);
    } catch (error) {
      console.error('❌ Failed to deploy WowzaRush implementation:', error.message);
      throw error;
    }

    // Step 5: Deploy the proxy contract
    console.log('\n📦 Deploying WowzaRushProxy contract...');
    const WowzaRushProxy = await ethers.getContractFactory('WowzaRushProxy');
    let proxy;
    try {
      proxy = await WowzaRushProxy.deploy(
        implementation.address, 
        proxyAdmin.address,
        {
          gasLimit: gasLimit,
          gasPrice: gasPrice
        }
      );
      await proxy.deployed();
      console.log('✅ WowzaRushProxy deployed to:', proxy.address);
    } catch (error) {
      console.error('❌ Failed to deploy WowzaRushProxy:', error.message);
      throw error;
    }

    // Step 6: Create an instance of the WowzaRush contract at the proxy address
    const wowzaRush = WowzaRush.attach(proxy.address);
    
    // Step 7: Initialize the implementation through the proxy
    console.log('\n🔧 Initializing WowzaRush contract...');
    try {
      const initTx = await wowzaRush.initialize(deployer.address, {
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });
      await initTx.wait();
      console.log('✅ WowzaRush contract initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WowzaRush contract:', error.message);
      throw error;
    }

    // Step 8: Set the token contract
    console.log('\n🔧 Setting token contract...');
    try {
      const setTokenTx = await wowzaRush.setTokenContract(tokenContract.address, {
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });
      await setTokenTx.wait();
      console.log('✅ Token contract set');
    } catch (error) {
      console.error('❌ Failed to set token contract:', error.message);
      throw error;
    }

    // Step 9: Verify fee rates
    console.log('\n🔍 Verifying contract settings...');
    try {
      const feeRates = await wowzaRush.getFeeRates();
      console.log('Transaction fee rate:', feeRates.transactionFee.toString(), 'basis points');
      console.log('Milestone fee rate:', feeRates.milestoneFee.toString(), 'basis points');
      console.log('Token discounts enabled:', feeRates.useDiscounts);
    } catch (error) {
      console.error('❌ Failed to verify fee rates:', error.message);
      throw error;
    }

    // Get final balance
    const finalBalance = await deployer.getBalance();
    console.log('\n📊 Deployment Summary:');
    console.log('💰 Final balance:', ethers.formatEther(finalBalance), 'TLOS');

    // Update contractHelpers.ts with the new address (proxy address)
    console.log("\n📝 Updating contract address in utils/contractHelpers.ts...");
    try {
      const contractHelpersPath = path.join(__dirname, '../../utils/contractHelpers.ts');
      
      if (fs.existsSync(contractHelpersPath)) {
        let content = fs.readFileSync(contractHelpersPath, 'utf8');
        
        // Replace the contract address with the proxy address
        const addressRegex = /WOWZA_RUSH_CONTRACT_ADDRESS\s*=\s*['"]([^'"]+)['"]/;
        const newContent = content.replace(
          addressRegex, 
          `WOWZA_RUSH_CONTRACT_ADDRESS = '${proxy.address}'`
        );
        
        if (content !== newContent) {
          fs.writeFileSync(contractHelpersPath, newContent);
          console.log("✅ Proxy address updated successfully in contractHelpers.ts");
        } else {
          console.warn("⚠️ No changes made to contractHelpers.ts (address pattern not found)");
        }
      } else {
        console.warn("⚠️ contractHelpers.ts file not found at expected path");
      }
    } catch (error) {
      console.error("Error updating contractHelpers.ts:", error.message);
    }
    
    // Verify contracts on explorer
    console.log("\n🔍 Verifying contracts on explorer...");
    try {
      // Verify implementation
      console.log("Verifying WowzaRush implementation...");
      await hre.run("verify:verify", {
        address: implementation.address,
        constructorArguments: [],
      });
      
      // Verify proxy
      console.log("Verifying WowzaRushProxy...");
      await hre.run("verify:verify", {
        address: proxy.address,
        constructorArguments: [implementation.address, proxyAdmin.address],
      });
      
      // Verify proxy admin
      console.log("Verifying WowzaRushProxyAdmin...");
      await hre.run("verify:verify", {
        address: proxyAdmin.address,
        constructorArguments: [],
      });
      
      // Verify token
      console.log("Verifying WowzaRushToken...");
      await hre.run("verify:verify", {
        address: tokenContract.address,
        constructorArguments: [],
      });
      
      console.log("✅ Contracts verified successfully on explorer!");
    } catch (error) {
      console.log("⚠️ Error verifying contracts:", error.message);
      console.log("You may need to manually verify the contracts on the explorer.");
    }

    // Generate deployment metadata
    const deploymentInfo = {
      network: {
        name: network.name,
        chainId: network.chainId
      },
      deployer: deployer.address,
      contracts: {
        proxy: proxy.address,
        implementation: implementation.address,
        proxyAdmin: proxyAdmin.address,
        token: tokenContract.address,
        storage: storageContract.address
      },
      timestamp: new Date().toISOString(),
      finalBalance: ethers.formatEther(finalBalance)
    };

    // Save deployment info to a file
    const deploymentMetaPath = path.join(__dirname, '../deployments', `${network.name}.json`);
    fs.mkdirSync(path.dirname(deploymentMetaPath), { recursive: true });
    fs.writeFileSync(
      deploymentMetaPath,
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log(`\n📋 Deployment metadata saved to ${deploymentMetaPath}`);
    
    console.log("\n⭐ Deployment Instructions for Frontend ⭐");
    console.log("1. Use the PROXY address for all contract interactions:", proxy.address);
    console.log("2. Use the WowzaRush ABI (not the proxy ABI) for contract interactions");
    console.log("3. The proxy pattern allows for future upgrades without changing the contract address");

    return deploymentInfo;

  } catch (error) {
    console.error('\n❌ Deployment failed!');
    console.error('🚨 Error:', error.message);
    console.error('Stack trace:', error.stack);

    if (error.error?.body) {
      try {
        const errorBody = JSON.parse(error.error.body);
        console.error('📝 Detailed error:', errorBody);
      } catch {}
    }

    if (error.code === 'NETWORK_ERROR') {
      console.error('🌐 Network connection failed. Please check your network configuration.');
    } else if (error.code === 'NONCE_EXPIRED') {
      console.error('🔄 Transaction nonce expired. Please try again.');
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('💰 Insufficient funds for gas * price + value.');
    } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      console.error('⚠️ Unable to estimate gas. The transaction may fail.');
    }

    throw error;
  }
}

// Execute deployment
main()
  .then((deploymentInfo) => {
    console.log('\n✅ Deployment script executed successfully!');
    console.log('📋 Deployment information:', deploymentInfo);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });

