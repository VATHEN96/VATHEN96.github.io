// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Using local imports now, assuming OZ contracts are installed via npm/yarn
// If using GitHub imports, update version tag to v4.9.3 or later
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "./WowzaRushStorage.sol";
import "./WowzaRushToken.sol"; // Restore import for type casting

/**
 * @title WowzaRush
 * @dev Main contract for the WowzaRush platform. Inherits from WowzaRushStorage
 * to ensure storage compatibility with the proxy pattern.
 */
contract WowzaRush is WowzaRushStorage {
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_TRANSACTION_FEE = 1000; // 10% max
    uint256 public constant MAX_MILESTONE_FEE = 500;   // 5% max
    
    // Events
    event CampaignCreated(uint256 indexed id, address indexed creator, string title);
    event CampaignUpdated(uint256 indexed id);
    event ContributionMade(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event FundsClaimed(uint256 indexed campaignId, address indexed recipient, uint256 amount);
    event MilestoneCompleted(uint256 indexed campaignId, uint256 milestoneIndex, uint256 amount);
    event MilestoneAdded(uint256 indexed campaignId, string title, uint256 amount);
    event FundingRoundCreated(uint256 indexed campaignId, uint8 series, uint256 targetAmount, uint256 valuation);
    event FundingRoundCompleted(uint256 indexed campaignId, uint8 series, uint256 amountRaised);
    event InvestmentMade(uint256 indexed campaignId, uint256 seriesIndex, address investor, uint256 amount);
    event MilestoneApproved(uint256 indexed campaignId, uint256 milestoneIndex, bool approved);
    event FundingMilestoneReleased(uint256 indexed campaignId, uint8 series, uint256 milestoneIndex, uint256 amount);
    event PlatformFeesCollected(uint256 amount, address token);
    event FeeRateUpdated(string feeType, uint256 newRate);
    event TokenContractSet(address tokenContract);
    event TokenDiscountsToggled(bool enabled);
    event DebugDeadlineValue(uint256 campaignId, uint256 deadlineStored); // New debug event
    
    // Modifier to restrict certain functions to platform owner
    modifier onlyPlatformOwner() {
        require(msg.sender == _platformOwner, "Only platform owner can call this function");
        _;
    }

    /**
     * @dev Initializes the contract instead of using a constructor
     * @param owner Address of the platform owner
     */
    function initialize(address owner) external {
        require(_platformOwner == address(0), "Contract already initialized");
        _platformOwner = owner;
        _transactionFeePercentage = 100; // Default 1% fee
        _milestoneFeePercentage = 50;    // Default 0.5% fee
        _useTokenDiscounts = false;      // Disabled by default until token is set
    }
    
    /**
     * @dev Function to update platform owner
     * @param newOwner New owner address
     */
    function transferPlatformOwnership(address newOwner) external onlyPlatformOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        _platformOwner = newOwner;
    }
    
    /**
     * @dev Functions to update fee percentages
     * @param newFeePercent New fee percentage in basis points
     */
    function setTransactionFee(uint256 newFeePercent) external onlyPlatformOwner {
        require(newFeePercent <= MAX_TRANSACTION_FEE, "Fee too high");
        _transactionFeePercentage = newFeePercent;
        emit FeeRateUpdated("Transaction", newFeePercent);
    }
    
    /**
     * @dev Set milestone fee percentage
     * @param newFeePercent New fee percentage in basis points
     */
    function setMilestoneFee(uint256 newFeePercent) external onlyPlatformOwner {
        require(newFeePercent <= MAX_MILESTONE_FEE, "Fee too high");
        _milestoneFeePercentage = newFeePercent;
        emit FeeRateUpdated("Milestone", newFeePercent);
    }
    
    /**
     * @dev Calculate fee amount
     * @param amount Amount to calculate fee on
     * @param feePercent Fee percentage in basis points
     * @return Fee amount
     */
    function calculateFee(uint256 amount, uint256 feePercent) internal pure returns (uint256) {
        return amount * feePercent / BASIS_POINTS;
    }
    
    /**
     * @dev Withdraw collected platform fees
     */
    function withdrawPlatformFees() external onlyPlatformOwner {
        uint256 amount = _accumulatedFees[address(0)]; // Fees in native token
        require(amount > 0, "No fees to withdraw");
        
        _accumulatedFees[address(0)] = 0;
        payable(_platformOwner).transfer(amount);
        
        emit PlatformFeesCollected(amount, address(0));
    }

    /**
     * @dev Set token contract
     * @param tokenAddress Address of the token contract
     */
    function setTokenContract(address tokenAddress) external onlyPlatformOwner {
        require(tokenAddress != address(0), "Invalid token address");
        _wowzaRushToken = tokenAddress;
        _useTokenDiscounts = true;
        emit TokenContractSet(tokenAddress);
    }
    
    /**
     * @dev Toggle token discounts
     * @param enabled Whether token discounts are enabled
     */
    function toggleTokenDiscounts(bool enabled) external onlyPlatformOwner {
        _useTokenDiscounts = enabled;
        emit TokenDiscountsToggled(enabled);
    }
    
    /**
     * @dev Calculate fee with possible discount
     * @param amount Amount to calculate fee on
     * @param feePercent Fee percentage in basis points
     * @param user User address to check for discounts
     * @return Fee amount with possible discount
     */
    function calculateFeeWithDiscount(uint256 amount, uint256 feePercent, address user) internal view returns (uint256) {
        uint256 baseFee = amount * feePercent / BASIS_POINTS;
        
        // Apply token discount if enabled and token contract is set
        if (_useTokenDiscounts && _wowzaRushToken != address(0)) {
            try WowzaRushToken(_wowzaRushToken).getFeeDiscount(user) returns (uint256 discount) {
                if (discount > 0) {
                    uint256 discountAmount = baseFee * discount / BASIS_POINTS;
                    return baseFee - discountAmount;
                }
            } catch {
                // Fall back to base fee if call fails
            }
        }
        
        return baseFee;
    }

    /**
     * @dev Create a new campaign
     * @param title Campaign title
     * @param description Campaign description
     * @param goalAmount Goal amount in wei
     * @param deadline Campaign deadline timestamp
     */
    function createCampaign(
        string memory title,
        string memory description,
        uint256 goalAmount,
        uint256 deadline,
        Milestone[] memory /* milestones */
    ) external returns (uint256 campaignId) { // Add return value
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(goalAmount > 0, "Goal amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        // require(milestones.length > 0, "At least one milestone is required");
        
        uint256 newCampaignId = _campaignCount; // Rename local variable
        _campaignCount++;
        
        // Campaign storage campaign = _campaigns[newCampaignId]; // Commented out
        // --- DEBUG: Simplify storage writes ---
        // campaign.creator = msg.sender; // Commented out
        // campaign.title = title; // Commented out
        // campaign.description = description; // Commented out
        // campaign.goalAmount = goalAmount; // Commented out
        // campaign.deadline = deadline; // Commented out
        // emit DebugDeadlineValue(newCampaignId, campaign.deadline); // Commented out
        // --- END DEBUG ---
        // --- DEBUG: Temporarily comment out milestone saving ---
        // for (uint256 i = 0; i < milestones.length; i++) {
        //     campaign.milestones.push(milestones[i]);
        // }
        // --- END DEBUG ---

        _creatorCampaigns[msg.sender].push(newCampaignId); // Use renamed variable

        // --- DEBUG: Read back storage immediately after write ---
        require(_campaigns[newCampaignId].creator == msg.sender, "Storage write failed: creator mismatch");
        // --- END DEBUG ---

        emit CampaignCreated(newCampaignId, msg.sender, title);
        return newCampaignId; // Return the new ID
    }
    
    /**
     * @dev Contribute to a campaign
     * @param campaignId ID of the campaign
     */
    function contribute(uint256 campaignId) external payable {
        Campaign storage campaign = _campaigns[campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(!campaign.completed, "Campaign is already completed");
        require(msg.value > 0, "Contribution must be greater than 0");
        
        // Calculate and apply fee
        uint256 fee = calculateFeeWithDiscount(msg.value, _transactionFeePercentage, msg.sender);
        uint256 contributionAmount = msg.value - fee;
        
        // Update platform fees
        _accumulatedFees[address(0)] += fee;
        
        // Update contribution record
        if (campaign.contributions[msg.sender] == 0) {
            campaign.contributors.push(msg.sender);
            _contributorCampaigns[msg.sender].push(campaignId);
        }
        
        campaign.contributions[msg.sender] += contributionAmount;
        campaign.amountRaised += contributionAmount;
        
        emit ContributionMade(campaignId, msg.sender, contributionAmount);
    }
    
    /**
     * @dev Claim funds for a completed campaign
     * @param campaignId ID of the campaign
     */
    function claimFunds(uint256 campaignId) external {
        Campaign storage campaign = _campaigns[campaignId];
        require(msg.sender == campaign.creator, "Only creator can claim funds");
        require(!campaign.fundsClaimed, "Funds already claimed");
        require(campaign.completed || block.timestamp > campaign.deadline, "Campaign not complete");
        
        campaign.fundsClaimed = true;
        uint256 amount = campaign.amountRaised;
        
        payable(campaign.creator).transfer(amount);
        
        emit FundsClaimed(campaignId, campaign.creator, amount);
    }
    
    /**
     * @dev Approve and release funds for a milestone
     * @param campaignId ID of the campaign
     * @param milestoneIndex Index of the milestone
     */
    function approveMilestone(uint256 campaignId, uint256 milestoneIndex) external {
        Campaign storage campaign = _campaigns[campaignId];
        require(msg.sender == campaign.creator, "Only creator can approve milestones");
        require(milestoneIndex < campaign.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = campaign.milestones[milestoneIndex];
        require(!milestone.completed, "Milestone already completed");
        
        milestone.completed = true;
        
        emit MilestoneApproved(campaignId, milestoneIndex, true);
    }
    
    /**
     * @dev Get campaign details
     * @param campaignId ID of the campaign
     * @return creator Address of the creator
     * @return title Campaign title
     * @return description Campaign description
     * @return goalAmount Total funding goal
     * @return amountRaised Current total funded amount
     * @return deadline Campaign deadline timestamp
     * @return completed Whether the campaign funding goal was met or deadline passed
     * @return fundsClaimed Whether the creator has claimed the funds
     * @return milestoneCount Number of milestones
     * @return contributorCount Number of unique contributors
     */
    function getCampaignDetails(uint256 campaignId) external view returns (
        address creator,
        string memory title,
        string memory description,
        uint256 goalAmount,
        uint256 amountRaised,
        uint256 deadline,
        bool completed,
        bool fundsClaimed,
        uint256 milestoneCount,
        uint256 contributorCount
    ) {
        Campaign storage campaign = _campaigns[campaignId];
        return (
            campaign.creator,
            campaign.title,
            campaign.description,
            campaign.goalAmount,
            campaign.amountRaised,
            campaign.deadline,
            campaign.completed,
            campaign.fundsClaimed,
            campaign.milestones.length,
            campaign.contributors.length
        );
    }
    
    /**
     * @dev Get milestone details
     * @param campaignId ID of the campaign
     * @param milestoneIndex Index of the milestone
     * @return title Milestone title
     * @return description Milestone description
     * @return amount Milestone target amount
     * @return completed Whether the milestone is marked complete
     * @return fundsClaimed Whether funds for this milestone have been claimed
     */
    function getMilestoneDetails(uint256 campaignId, uint256 milestoneIndex) external view returns (
        string memory title,
        string memory description,
        uint256 amount,
        bool completed,
        bool fundsClaimed
    ) {
        Campaign storage campaign = _campaigns[campaignId];
        require(milestoneIndex < campaign.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = campaign.milestones[milestoneIndex];
        return (
            milestone.title,
            milestone.description,
            milestone.amount,
            milestone.completed,
            milestone.fundsClaimed
        );
    }

    /**
     * @dev Get user contribution to a campaign
     * @param campaignId ID of the campaign
     * @param contributor Address of the contributor
     * @return Contribution amount
     */
    function getUserContribution(uint256 campaignId, address contributor) external view returns (uint256) {
        Campaign storage campaign = _campaigns[campaignId];
        return campaign.contributions[contributor];
    }
    
    /**
     * @dev Get campaigns created by a user
     * @param creator Address of the creator
     * @return Array of campaign IDs
     */
    function getCreatorCampaigns(address creator) external view returns (uint256[] memory) {
        return _creatorCampaigns[creator];
    }
    
    /**
     * @dev Get campaigns contributed to by a user
     * @param contributor Address of the contributor
     * @return Array of campaign IDs
     */
    function getContributorCampaigns(address contributor) external view returns (uint256[] memory) {
        return _contributorCampaigns[contributor];
    }
    
    /**
     * @dev Get platform fee rates
     * @return transactionFee Transaction fee in basis points
     * @return milestoneFee Milestone fee in basis points
     * @return useDiscounts Whether token discounts are enabled
     */
    function getFeeRates() external view returns (
        uint256 transactionFee,
        uint256 milestoneFee,
        bool useDiscounts
    ) {
        return (
            _transactionFeePercentage,
            _milestoneFeePercentage,
            _useTokenDiscounts
        );
    }
} 