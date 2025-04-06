const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WowzaRush Upgradeable", function () {
  let wowzaRushProxy;
  let wowzaRush;
  let newImplementation;
  let proxyAdmin;
  let token;
  let owner;
  let user1;
  let user2;
  let admin;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, admin] = await ethers.getSigners();

    // Deploy token
    const WowzaRushToken = await ethers.getContractFactory("WowzaRushToken");
    token = await WowzaRushToken.deploy();
    await token.deployed();

    // Deploy proxy admin
    const WowzaRushProxyAdmin = await ethers.getContractFactory("WowzaRushProxyAdmin");
    proxyAdmin = await WowzaRushProxyAdmin.deploy(owner.address);
    await proxyAdmin.deployed();

    // Deploy implementation
    const WowzaRushFactory = await ethers.getContractFactory("WowzaRush");
    const wowzaRushImplementation = await WowzaRushFactory.deploy();
    await wowzaRushImplementation.deployed();

    // Get initialization data
    const initData = WowzaRushFactory.interface.encodeFunctionData("initialize", [owner.address]);

    // Deploy proxy
    const WowzaRushProxy = await ethers.getContractFactory("WowzaRushProxy");
    wowzaRushProxy = await WowzaRushProxy.deploy(
      wowzaRushImplementation.address,
      proxyAdmin.address,
      initData
    );
    await wowzaRushProxy.deployed();

    // Connect to the proxy with the implementation ABI
    wowzaRush = WowzaRushFactory.attach(wowzaRushProxy.address);

    // Set token in WowzaRush
    await wowzaRush.setTokenContract(token.address);
  });

  describe("Initial functionality", function () {
    it("Should initialize with correct owner and fee rates", async function () {
      const feeRates = await wowzaRush.getFeeRates();
      expect(feeRates.transactionFee).to.equal(100); // 1% transaction fee
      expect(feeRates.milestoneFee).to.equal(50);  // 0.5% milestone fee
      expect(feeRates.useDiscounts).to.equal(true); // Token discounts enabled after setting token
    });

    it("Should create a campaign", async function () {
      // Create a campaign
      await wowzaRush.createCampaign(
        "Test Campaign",
        "Test Description",
        ethers.utils.parseEther("10"),
        30, // 30 days
        [] // No milestones
      );

      // Get campaign details
      const campaign = await wowzaRush.getCampaignDetails(0);
      expect(campaign.creator).to.equal(owner.address);
      expect(campaign.title).to.equal("Test Campaign");
      expect(campaign.description).to.equal("Test Description");
      expect(campaign.fundingGoal).to.equal(ethers.utils.parseEther("10"));
    });

    it("Should contribute to a campaign", async function () {
      // Create a campaign
      await wowzaRush.createCampaign(
        "Test Campaign",
        "Test Description",
        ethers.utils.parseEther("10"),
        30, // 30 days
        [] // No milestones
      );

      // Contribute to the campaign
      await wowzaRush.connect(user1).contributeToCompaign(0, {
        value: ethers.utils.parseEther("5")
      });

      // Get campaign details
      const campaign = await wowzaRush.getCampaignDetails(0);
      
      // 1% fee is taken, so we expect 4.95 ETH
      expect(campaign.fundedAmount).to.be.closeTo(
        ethers.utils.parseEther("4.95"),
        ethers.utils.parseEther("0.01") // Allow for small rounding differences
      );
    });
  });

  describe("Upgrade functionality", function () {
    beforeEach(async function () {
      // Create a campaign in the original implementation
      await wowzaRush.createCampaign(
        "Original Campaign",
        "Created before upgrade",
        ethers.utils.parseEther("10"),
        30, // 30 days
        [] // No milestones
      );

      // Deploy new implementation
      const WowzaRushFactory = await ethers.getContractFactory("WowzaRush");
      newImplementation = await WowzaRushFactory.deploy();
      await newImplementation.deployed();

      // Upgrade proxy to new implementation
      await proxyAdmin.upgrade(wowzaRushProxy.address, newImplementation.address);

      // Connect to the proxy with the implementation ABI (should still work with the same contract)
      wowzaRush = WowzaRushFactory.attach(wowzaRushProxy.address);
    });

    it("Should preserve state after upgrade", async function () {
      // Check fee rates are preserved
      const feeRates = await wowzaRush.getFeeRates();
      expect(feeRates.transactionFee).to.equal(100); // 1% transaction fee
      expect(feeRates.milestoneFee).to.equal(50);  // 0.5% milestone fee
      expect(feeRates.useDiscounts).to.equal(true); // Token discounts still enabled
    });

    it("Should have campaigns created before upgrade accessible after upgrade", async function () {
      // Check the campaign is accessible after upgrade
      const campaign = await wowzaRush.getCampaignDetails(0);
      expect(campaign.creator).to.equal(owner.address);
      expect(campaign.title).to.equal("Original Campaign");
      expect(campaign.description).to.equal("Created before upgrade");
      expect(campaign.fundingGoal).to.equal(ethers.utils.parseEther("10"));
    });

    it("Should be able to create campaigns after upgrade", async function () {
      // Create a new campaign after upgrade
      await wowzaRush.createCampaign(
        "Post-Upgrade Campaign",
        "Created after upgrade",
        ethers.utils.parseEther("15"),
        45, // 45 days
        [] // No milestones
      );

      // Check that campaign was created
      const campaign = await wowzaRush.getCampaignDetails(1); // This should be the second campaign
      expect(campaign.title).to.equal("Post-Upgrade Campaign");
      expect(campaign.description).to.equal("Created after upgrade");
      expect(campaign.fundingGoal).to.equal(ethers.utils.parseEther("15"));
    });

    it("Should allow changing fee rates after upgrade", async function () {
      // Change fee rates
      await wowzaRush.setTransactionFeeRate(150); // 1.5%
      await wowzaRush.setMilestoneFeeRate(75);   // 0.75%
      
      // Check that fee rates were updated
      const feeRates = await wowzaRush.getFeeRates();
      expect(feeRates.transactionFee).to.equal(150);
      expect(feeRates.milestoneFee).to.equal(75);
    });

    it("Should calculate fees correctly after fee rate changes", async function () {
      // Change fee rates
      await wowzaRush.setTransactionFeeRate(200); // 2%
      
      // Create a new campaign
      await wowzaRush.createCampaign(
        "Fee Test Campaign",
        "Testing new fee rates",
        ethers.utils.parseEther("10"),
        30,
        []
      );
      
      // Contribute to the campaign
      await wowzaRush.connect(user1).contributeToCompaign(1, {
        value: ethers.utils.parseEther("5")
      });
      
      // Get campaign details
      const campaign = await wowzaRush.getCampaignDetails(1);
      
      // 2% fee is taken, so we expect 4.9 ETH
      expect(campaign.fundedAmount).to.be.closeTo(
        ethers.utils.parseEther("4.9"),
        ethers.utils.parseEther("0.01") // Allow for small rounding differences
      );
    });
  });
}); 