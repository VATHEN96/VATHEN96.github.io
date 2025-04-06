require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const { main: verifyStorageLayout } = require("./scripts/verify_storage_layout");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// Task to verify storage layout compatibility for upgradeability
task("verify-storage", "Verifies storage layout compatibility for upgradeability")
  .addParam("contract", "Contract name to verify")
  .addOptionalParam("oldHash", "IPFS hash of the old storage layout")
  .setAction(verifyStorageLayout);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      viaIR: true,  // Enable viaIR for handling stack too deep errors
      outputSelection: {
        "*": {
          "*": [
            "abi",
            "evm.bytecode",
            "evm.deployedBytecode",
            "evm.methodIdentifiers",
            "metadata",
            "storageLayout"  // Add storage layout output for upgrade safety checks
          ],
          "": ["ast"]
        }
      }
    }
  },
  networks: {
    telos_testnet: {
      url: "https://testnet.telos.net/evm",
      chainId: 41,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gas: 8000000,  // Increased gas limit for complex transactions
      gasPrice: 25000000000,  // 25 gwei
      timeout: 60000  // 60 seconds
    },
    hardhat: {
      chainId: 1337,
      mining: {
        auto: true,
        interval: 5000
      }
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  etherscan: {
    apiKey: {
      telosTestnet: process.env.TELOS_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "telosTestnet",
        chainId: 41,
        urls: {
          apiURL: "https://testnet.telos.net/evm/api",
          browserURL: "https://testnet.teloscan.io"
        }
      }
    ]
  }
}; 