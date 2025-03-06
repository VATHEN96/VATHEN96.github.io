require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('\n🚀 Initializing WowzaRush contract deployment...\n');

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

    // Get the contract factory
    console.log('📄 Retrieving contract factory...');
    const WowzaRush = await ethers.getContractFactory('WowzaRush');
    console.log('✅ Contract factory retrieved successfully\n');

    // Deploy with basic configuration
    console.log('📦 Deploying contract...');
    // Get network config for gas settings
    const networkConfig = hre.config.networks[network.name] || {};
    const gasPrice = networkConfig.gasPrice || ethers.parseUnits('50', 'gwei');
    const gasLimit = networkConfig.gas || 4000000;
    
    // Additional checks for Telos network
    if (network.name === 'telosEvmTestnet') {
      console.log('🔍 Performing Telos-specific checks...');
      try {
        await ethers.provider.getBlock('latest');
        console.log('✅ RPC endpoint is responsive');
      } catch (error) {
        console.error('Stack trace:', error.stack);
        throw new Error('Failed to connect to Telos RPC endpoint. Please check your network configuration.');
      }
    }

    console.log('⛽ Gas settings:');
    console.log('   Price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
    console.log('   Limit:', gasLimit);

    // Implement retry mechanism for deployment
    let wowzaRush;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      try {
        // Create legacy transaction for better Telos compatibility
        wowzaRush = await WowzaRush.connect(deployer).deploy({
          gasLimit: gasLimit,
          gasPrice: gasPrice,
          nonce: await ethers.provider.getTransactionCount(deployer.address),
          chainId: network.chainId
        });

        console.log('⏳ Waiting for deployment confirmation...');
        await wowzaRush.deployed();
        break; // Successful deployment
      } catch (error) {
        retryCount++;
        console.error(`\n❌ Deployment attempt ${retryCount} failed:`);
        console.error('Stack trace:', error.stack);

        if (retryCount === maxRetries) {
          throw new Error(`Failed to deploy after ${maxRetries} attempts: ${error.message}`);
        }

        console.log(`Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    console.log('\n✨ Contract deployed successfully!');
    console.log('📍 Contract Address:', wowzaRush.address);

    // Verify deployment
    const code = await ethers.provider.getCode(wowzaRush.address);
    if (code === '0x') {
      throw new Error('Contract deployment verification failed');
    }

    // Get final balance
    const finalBalance = await deployer.getBalance();
    console.log('\n📊 Deployment Summary:');
    console.log('💰 Final balance:', ethers.formatEther(finalBalance), 'TLOS');

    return {
      contractAddress: wowzaRush.address,
      finalBalance: ethers.formatEther(finalBalance)
    };

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

