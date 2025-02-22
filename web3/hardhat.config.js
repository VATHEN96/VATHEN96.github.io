require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// if (!process.env.PRIVATE_KEY) {
//   console.error("ERROR: PRIVATE_KEY is not set in the .env file.");
//   process.exit(1);
// }

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "voltaTestnet",  // Set default network
  solidity: {
    version: "0.8.28",  // Use Solidity 0.8.28
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,  // Enable Yul optimization
        },
      },
      viaIR: true,  // Enable Intermediate Representation optimization
    },
  },
  networks: {
    telosEvmTestnet: {
      url: "https://testnet.telos.net/evm",
      accounts: [`0x56d62a972cce51fa23d31e87782feec46f727d92aea13ec32a23e157458c983f`],
      chainId: 41,
      gasPrice: 1003807803686, // Set custom gas price (20 Gwei)
      gas: 8000000,         // Set custom gas limit
    },
    localhost: {
      url: "http://127.0.0.1:8545", // Local testing with Hardhat/Ganache
      chainId: 31337,
    },
    hardhat: {
      chainId: 1337, // Internal Hardhat network
    },
  },
};
