# WowzaRush Smart Contract

This directory contains the smart contract for the WowzaRush platform, which enables creating and managing crowdfunding campaigns.

## Contract Overview

The WowzaRush contract has been updated with important changes:

- Added a new flattened version of the `createCampaign` function to avoid ABI encoding issues
- Enhanced optimization settings to reduce gas costs
- Improved error handling and validation

## Compilation and Deployment

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Hardhat installed globally (`npm install -g hardhat`)
- A `.env` file with the following variables:
  ```
  PRIVATE_KEY=your_private_key_here
  TELOS_API_KEY=your_telos_api_key_here (optional for verification)
  ```

### Compile the Contract

To compile the contract with the optimized settings:

```bash
cd web3
npm install
npx hardhat compile
```

The compiler will use the settings in `hardhat.config.cjs` and generate artifacts in the `artifacts` directory.

### Deploy the Contract

To deploy to Telos EVM Testnet:

```bash
npx hardhat run scripts/deploy.js --network telos_testnet
```

This will:
1. Deploy the contract to the Telos EVM Testnet
2. Automatically activate the contract
3. Update the contract address in `utils/contractHelpers.ts`
4. Save deployment metadata in the `deployments` directory

### Verify the Contract

The deployment script attempts to verify the contract automatically. If it fails, you can manually verify:

```bash
npx hardhat verify --network telos_testnet [CONTRACT_ADDRESS]
```

### Testing the new createCampaign function

The contract now supports two versions of the `createCampaign` function:

1. **Original (with struct array):**
   ```solidity
   function createCampaign(
       string memory title,
       string memory description,
       string memory category,
       uint256 goalAmount,
       uint256 duration,
       string[] memory media,
       Milestone[] memory milestones,
       string memory beneficiaries,
       address[] memory stakeholders
   )
   ```

2. **Flattened (with separate arrays):**
   ```solidity
   function createCampaign(
       string memory title,
       string memory description,
       string memory category,
       uint256 goalAmount,
       uint256 duration,
       string[] memory media,
       string[] memory milestoneNames,
       string[] memory milestoneDescriptions,
       uint256[] memory milestoneAmounts,
       uint256[] memory milestoneCompletions,
       string memory beneficiaries,
       address[] memory stakeholders
   )
   ```

The frontend will automatically try both versions when creating a campaign.

## Compiler Configuration

The contract is compiled with the following optimization settings:

- Solidity version: 0.8.19
- Optimizer enabled with 200 runs
- IR-based code generation (viaIR: true)
- Yul optimizer with stack allocation optimizations

These settings help manage the complexity of the contract, especially with the two versions of the `createCampaign` function.

## Storage Layout Verification with IPFS

For Upgradeability Safety, this project uses IPFS (via Pinata) to store contract storage layouts to ensure that upgrades are compatible with existing contract states.

### Setting Up Pinata

1. Create a Pinata account at [pinata.cloud](https://www.pinata.cloud/) if you don't have one already
2. Generate an API key in your Pinata dashboard
3. Configure your environment variables in `.env`:
   ```
   PINATA_API_KEY=your_pinata_api_key
   PINATA_API_SECRET=your_pinata_api_secret
   ```

### Using the Storage Verification

To verify storage layout compatibility before an upgrade:

```bash
npx hardhat verify-storage --contract WowzaRush
```

This command will:
1. Extract the storage layout of the contract
2. Upload it to IPFS via Pinata
3. Search for previous storage layouts of the same contract
4. Compare for compatibility
5. Store the comparison results in IPFS

To compare with a specific previous layout:

```bash
npx hardhat verify-storage --contract WowzaRush --oldHash Qm123...
```

Where `Qm123...` is the IPFS hash (CID) of a previously stored layout.

### Deployment and Upgrade Process

The storage layout compatibility check is automatically integrated into the upgrade process. 
The `scripts/upgrade.js` script will:

1. Verify storage compatibility
2. Abort if incompatible (unless FORCE_UPGRADE=true)
3. Deploy the new implementation
4. Upgrade the proxy
5. Store all upgrade information in IPFS for future reference

To force an upgrade even with incompatible storage layouts:

```bash
FORCE_UPGRADE=true npx hardhat run scripts/upgrade.js --network telos_testnet
```

WARNING: Forcing an upgrade with incompatible storage layouts may corrupt contract state!

### Benefits of IPFS Storage

Using IPFS for storage layouts provides several advantages:
- Decentralized and persistent storage
- Content-addressable (layouts can't be modified)
- Accessible from anywhere
- No need to manage your own database
- Immutable record of all past layouts

## Storage Layout Verification

For Upgradeability Safety, this project now uses cloud-based storage of contract storage layouts to ensure that upgrades are compatible with existing contract states.

### Setting Up Cloud Storage

1. Configure your environment variables in `.env`:
   ```
   STORAGE_LAYOUT_API_URL=https://your-cloud-api-url.com/api
   STORAGE_LAYOUT_API_KEY=your_api_key_here
   ```

2. Your API should support the following endpoints:
   - `POST /storage-layouts` - Store a new storage layout
   - `GET /storage-layouts/:id` - Get a specific layout
   - `GET /storage-layouts?contractName=X&network=Y` - List layouts for a contract
   - `POST /storage-layout-comparisons` - Store comparison results
   - `POST /contract-upgrades` - Store upgrade information

### Using the Storage Verification

To verify storage layout compatibility before an upgrade:

```bash
npx hardhat verify-storage --contract WowzaRush
```

To compare with a specific previous layout:

```bash
npx hardhat verify-storage --contract WowzaRush --oldId 12345
```

### Deployment and Upgrade Process

The storage layout compatibility check is automatically integrated into the upgrade process. 
The `scripts/upgrade.js` script will:

1. Verify storage compatibility
2. Abort if incompatible (unless FORCE_UPGRADE=true)
3. Deploy the new implementation
4. Upgrade the proxy
5. Store all upgrade information in cloud storage

To force an upgrade even with incompatible storage layouts:

```bash
FORCE_UPGRADE=true npx hardhat run scripts/upgrade.js --network telos_testnet
```

WARNING: Forcing an upgrade with incompatible storage layouts may corrupt contract state! 