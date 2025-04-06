// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v4.8.3/contracts/proxy/utils/Initializable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v4.8.3/contracts/access/OwnableUpgradeable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v4.8.3/contracts/security/ReentrancyGuardUpgradeable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v4.8.3/contracts/security/PausableUpgradeable.sol";

/**
 * @title WowzaRush
 * @author WowzaRush Team
 * @notice Crowdfunding platform with milestone-based fund release and investment functionality
 * @dev Uses OpenZeppelin's upgradeable contracts pattern
 * @custom:security-contact security@wowzarush.io
 */
contract WowzaRush is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    //--------------------------------------------------------------------------
    // State Variables for Activation & Spam Prevention
    //--------------------------------------------------------------------------
    
    /// @notice Fee required to create a campaign (in wei)
    uint256 public constant CAMPAIGN_CREATION_FEE = 0.01 ether;
    
    /// @notice Minimum time between campaign creations by the same user
    uint256 public constant MIN_COOLDOWN_PERIOD = 1 days;
    
    /// @notice Maximum number of active campaigns per user
    uint256 public constant MAX_ACTIVE_CAMPAIGNS_PER_USER = 5;
    
    /// @notice Current number of campaigns
    uint256 private campaignCounter;
    
    /// @notice Mapping of user address to timestamp of their last campaign creation
    mapping(address => uint256) public lastCampaignCreation;
    
    /// @notice Mapping of user address to count of their active campaigns
    mapping(address => uint256) public userActiveCampaignCount;
    
    /// @notice Percentage fee taken from milestone funds (in basis points, e.g. 250 = 2.5%)
    uint256 public milestoneFeeRate;
    
    /// @notice Percentage fee taken from transactions (in basis points)
    uint256 public transactionFeeRate;
    
    /// @notice Whether to apply token discounts on fees
    bool public useTokenDiscounts;
    
    /// @notice Treasury address where fees are sent
    address public treasury;

    //--------------------------------------------------------------------------
    // Events
    //--------------------------------------------------------------------------
    
    /// @notice Emitted when the contract is paused
    event ContractPaused(address indexed operator, uint256 timestamp);
    
    /// @notice Emitted when the contract is unpaused
    event ContractUnpaused(address indexed operator, uint256 timestamp);
    
    /// @notice Emitted when a new campaign is created
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title);
    
    /// @notice Emitted when a campaign is updated
    event CampaignUpdated(uint256 indexed campaignId);
    
    /// @notice Emitted when a donation is received
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);
    
    /// @notice Emitted when a milestone is completed
    event MilestoneCompleted(uint256 indexed campaignId, uint256 milestoneIndex);
    
    /// @notice Emitted when a vote is submitted for a milestone
    event MilestoneVoteSubmitted(uint256 indexed campaignId, uint256 milestoneIndex, address voter, bool isUpvote);
    
    /// @notice Emitted when funds are released for a milestone
    event FundsReleased(uint256 indexed campaignId, uint256 milestoneIndex, uint256 amount, uint256 fee);
    
    /// @notice Emitted when an investment is received
    event InvestmentReceived(uint256 indexed campaignId, address indexed investor, uint256 amount);
    
    /// @notice Emitted when fee rates are updated
    event FeeRatesUpdated(uint256 transactionFee, uint256 milestoneFee, bool useDiscounts);
    
    /// @notice Emitted when treasury address is updated
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    //--------------------------------------------------------------------------
    // Structs
    //--------------------------------------------------------------------------
    
    /**
     * @dev Milestone structure defining a funding goal within a campaign
     * @param name Name of the milestone
     * @param targetAmount Funding target for this milestone
     * @param isCompleted Whether milestone has been marked as completed
     * @param isFunded Whether funds have been released to the creator
     * @param proofOfCompletion IPFS hash or other proof that milestone is complete
     * @param fundsReleased Amount of funds released for this milestone
     * @param isUnderReview Whether milestone is currently under review
     */
    struct Milestone {
        string name;
        uint256 targetAmount;
        bool isCompleted;
        bool isFunded;
        string proofOfCompletion;
        uint256 fundsReleased;
        bool isUnderReview;
    }

    /**
     * @dev Main campaign structure containing all campaign details
     */
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string category;
        uint256 goalAmount;
        uint256 totalFunded;
        uint256 duration;
        uint256 createdAt;
        bool isActive;
        string metadataIPFSHash;      // IPFS hash for extended campaign data
        string mediaIPFSHash;         // IPFS hash for media files
        uint256 currentMilestone;
        Milestone[] milestones;
        address[] donors;
        uint8 campaignType;           // 0 = donation, 1 = investment
        uint256 equityPercentage;
        uint256 minInvestment;
        mapping(address => uint256) investments;
    }

    /**
     * @dev Parameters for campaign creation
     */
    struct CampaignCreationParams {
        string title;
        string description;
        string category;
        uint256 goalAmount;
        uint256 duration;
        string[] media;
        string[] milestoneNames;
        uint256[] milestoneAmounts;
        string beneficiaries;
        address[] stakeholders;
    }

    /**
     * @dev Voting structure for milestone review
     */
    struct Vote {
        bool isUpvote;
        string message;
        address voter;
    }

    /**
     * @dev Structure for returning basic campaign information
     */
    struct CampaignBasicInfo {
        uint256 id;
        address creator;
        string title;
        string description;
        string category;
        uint256 goalAmount;
        uint256 totalFunded;
        uint256 duration;
        uint256 createdAt;
        bool isActive;
    }

    /**
     * @dev Structure for returning investment-specific campaign information
     */
    struct CampaignInvestmentInfo {
        uint8 campaignType;
        uint256 equityPercentage;
        uint256 minInvestment;
    }

    /**
     * @dev Structure for fee rates configuration
     */
    struct FeeRates {
        uint256 transactionFee;
        uint256 milestoneFee;
        bool useDiscounts;
    }

    //--------------------------------------------------------------------------
    // Storage
    //--------------------------------------------------------------------------
    
    /// @notice Mapping of campaign ID to Campaign data
    mapping(uint256 => Campaign) private campaigns;
    
    /// @notice Mapping of campaign ID and milestone index to vote data
    mapping(uint256 => mapping(uint256 => Vote[])) private milestoneVotes;
    
    /// @notice Mapping of user address to array of campaign IDs they created
    mapping(address => uint256[]) private userCampaigns;
    
    /// @notice Mapping of user address to array of campaign IDs they donated to
    mapping(address => uint256[]) private userDonations;

    //--------------------------------------------------------------------------
    // Modifiers
    //--------------------------------------------------------------------------
    
    /// @dev Ensures funds are sufficient for the operation
    /// @param amount The required amount
    modifier hasSufficientFunds(uint256 amount) {
        require(msg.value >= amount, "Insufficient funds");
        _;
    }

    /// @dev Ensures a campaign exists
    /// @param campaignId The ID of the campaign
    modifier campaignExists(uint256 campaignId) {
        require(campaignId < campaignCounter, "Campaign does not exist");
        _;
    }

    /// @dev Ensures a campaign is active
    /// @param campaignId The ID of the campaign
    modifier campaignActive(uint256 campaignId) {
        require(campaigns[campaignId].isActive, "Campaign is not active");
        _;
    }

    /// @dev Ensures the caller is the creator of the campaign
    /// @param campaignId The ID of the campaign
    modifier onlyCreator(uint256 campaignId) {
        require(msg.sender == campaigns[campaignId].creator, "Only campaign creator can call this function");
        _;
    }

    //--------------------------------------------------------------------------
    // Initialization (replaces constructor for upgradeable contracts)
    //--------------------------------------------------------------------------
    
    /**
     * @notice Initializes the contract (replaces constructor for upgradeable contracts)
     * @param _treasury Address where fees will be sent
     * @param _transactionFeeRate Fee percentage for transactions (in basis points)
     * @param _milestoneFeeRate Fee percentage for milestone releases (in basis points)
     */
    function initialize(
        address _treasury,
        uint256 _transactionFeeRate,
        uint256 _milestoneFeeRate
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        require(_treasury != address(0), "Treasury cannot be zero address");
        require(_transactionFeeRate <= 1000, "Transaction fee too high"); // Max 10%
        require(_milestoneFeeRate <= 1000, "Milestone fee too high"); // Max 10%
        
        treasury = _treasury;
        transactionFeeRate = _transactionFeeRate;
        milestoneFeeRate = _milestoneFeeRate;
        useTokenDiscounts = false;
        campaignCounter = 0;
    }

    //--------------------------------------------------------------------------
    // Admin Functions
    //--------------------------------------------------------------------------
    
    /**
     * @notice Pauses all contract operations
     * @dev Can only be called by the contract owner
     */
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Unpauses the contract, allowing operations to continue
     * @dev Can only be called by the contract owner
     */
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Updates fee rates
     * @param _transactionFeeRate New transaction fee rate (in basis points)
     * @param _milestoneFeeRate New milestone fee rate (in basis points)
     * @param _useTokenDiscounts Whether to enable token discounts
     * @dev Can only be called by the contract owner
     */
    function updateFeeRates(
        uint256 _transactionFeeRate,
        uint256 _milestoneFeeRate,
        bool _useTokenDiscounts
    ) external onlyOwner {
        require(_transactionFeeRate <= 1000, "Transaction fee too high"); // Max 10%
        require(_milestoneFeeRate <= 1000, "Milestone fee too high"); // Max 10%
        
        transactionFeeRate = _transactionFeeRate;
        milestoneFeeRate = _milestoneFeeRate;
        useTokenDiscounts = _useTokenDiscounts;
        
        emit FeeRatesUpdated(_transactionFeeRate, _milestoneFeeRate, _useTokenDiscounts);
    }
    
    /**
     * @notice Updates the treasury address
     * @param _newTreasury New treasury address
     * @dev Can only be called by the contract owner
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Treasury cannot be zero address");
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    /**
     * @notice Returns current fee rate configuration
     * @return FeeRates structure with current fee configuration
     */
    function getFeeRates() external view returns (FeeRates memory) {
        return FeeRates({
            transactionFee: transactionFeeRate,
            milestoneFee: milestoneFeeRate,
            useDiscounts: useTokenDiscounts
        });
    }

    //--------------------------------------------------------------------------
    // Create Campaign with Spam Prevention
    //--------------------------------------------------------------------------
    
    /**
     * @notice Creates a new campaign
     * @param title Campaign title
     * @param category Campaign category
     * @param goalAmount Total funding goal
     * @param duration Campaign duration in seconds
     * @param metadataIPFSHash IPFS hash for campaign metadata
     * @param mediaIPFSHash IPFS hash for campaign media
     * @param milestones Array of milestone structures
     * @return Newly created campaign ID
     * @dev Requires payment of campaign creation fee
     */
    function createCampaign(
        string memory title,
        string memory category,
        uint256 goalAmount,
        uint256 duration,
        string memory metadataIPFSHash,
        string memory mediaIPFSHash,
        Milestone[] memory milestones
    ) public payable whenNotPaused nonReentrant hasSufficientFunds(CAMPAIGN_CREATION_FEE) returns (uint256) {
        // Spam prevention checks
        require(
            block.timestamp >= lastCampaignCreation[msg.sender] + MIN_COOLDOWN_PERIOD,
            "Please wait for cooldown period"
        );
        require(
            userActiveCampaignCount[msg.sender] < MAX_ACTIVE_CAMPAIGNS_PER_USER,
            "Too many active campaigns"
        );
        
        // Validation
        require(bytes(title).length > 0, "Title cannot be empty");
        require(goalAmount > 0, "Goal amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(milestones.length > 0, "At least one milestone is required");
        require(bytes(metadataIPFSHash).length > 0, "Metadata IPFS hash required");
        
        // Get campaign ID
        uint256 campaignId = campaignCounter++;
        
        // Create campaign
        Campaign storage campaign = campaigns[campaignId];
        campaign.id = campaignId;
        campaign.creator = msg.sender;
        campaign.title = title;
        campaign.category = category;
        campaign.goalAmount = goalAmount;
        campaign.duration = duration;
        campaign.createdAt = block.timestamp;
        campaign.isActive = true;
        campaign.metadataIPFSHash = metadataIPFSHash;
        campaign.mediaIPFSHash = mediaIPFSHash;
        campaign.campaignType = 0;
        
        // Add milestones
        for (uint i = 0; i < milestones.length; i++) {
            campaign.milestones.push(milestones[i]);
        }

        // Update user campaign tracking
        userCampaigns[msg.sender].push(campaignId);
        userActiveCampaignCount[msg.sender]++;
        lastCampaignCreation[msg.sender] = block.timestamp;
        
        // Transfer campaign creation fee to treasury
        (bool success, ) = payable(treasury).call{value: msg.value}("");
        require(success, "Fee transfer failed");

        emit CampaignCreated(campaignId, msg.sender, title);
        return campaignId;
    }
    
    /**
     * @notice Creates an investment-type campaign
     * @param title Campaign title
     * @param category Campaign category
     * @param goalAmount Total funding goal
     * @param duration Campaign duration in seconds
     * @param metadataIPFSHash IPFS hash for campaign metadata
     * @param mediaIPFSHash IPFS hash for campaign media
     * @param milestones Array of milestone structures
     * @param equityPercentage Equity percentage offered (in basis points, e.g. 500 = 5%)
     * @param minInvestment Minimum investment amount
     * @return Newly created campaign ID
     * @dev Requires payment of campaign creation fee
     */
    function createInvestmentCampaign(
        string memory title,
        string memory category,
        uint256 goalAmount,
        uint256 duration,
        string memory metadataIPFSHash,
        string memory mediaIPFSHash,
        Milestone[] memory milestones,
        uint256 equityPercentage,
        uint256 minInvestment
    ) public payable whenNotPaused nonReentrant hasSufficientFunds(CAMPAIGN_CREATION_FEE) returns (uint256) {
        require(equityPercentage > 0 && equityPercentage <= 10000, "Invalid equity percentage");
        require(minInvestment > 0, "Minimum investment must be greater than 0");
        
        uint256 campaignId = createCampaign(
            title,
            category,
            goalAmount,
            duration,
            metadataIPFSHash,
            mediaIPFSHash,
            milestones
        );
        
        Campaign storage campaign = campaigns[campaignId];
        campaign.campaignType = 1; // Investment type
        campaign.equityPercentage = equityPercentage;
        campaign.minInvestment = minInvestment;
        
        return campaignId;
    }

    //--------------------------------------------------------------------------
    // Campaign Management Functions
    //--------------------------------------------------------------------------
    
    /**
     * @notice Returns the total number of campaigns created
     * @return Current campaign count
     */
    function getCampaignCount() public view returns (uint256) {
        return campaignCounter;
    }
    
    /**
     * @notice Makes a donation to a campaign
     * @param campaignId ID of the campaign to donate to
     * @dev Requires the campaign to be active
     */
    function donate(uint256 campaignId) public payable 
        whenNotPaused 
        nonReentrant 
        campaignExists(campaignId)
        campaignActive(campaignId)
    {
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        Campaign storage campaign = campaigns[campaignId];
        
        // Calculate fee
        uint256 fee = (msg.value * transactionFeeRate) / 10000;
        uint256 donationAmount = msg.value - fee;
        
        // Update campaign
        campaign.totalFunded += donationAmount;
        _addDonorToCampaign(campaign, campaignId);
        
        // Transfer fee to treasury
        if (fee > 0) {
            (bool feeSuccess, ) = payable(treasury).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }

        emit DonationReceived(campaignId, msg.sender, donationAmount);
    }
    
    /**
     * @notice Internal function to add a donor to a campaign
     * @param campaign Campaign to add donor to
     * @param campaignId ID of the campaign
     */
    function _addDonorToCampaign(Campaign storage campaign, uint256 campaignId) private {
        bool isDonorAlreadyAdded = false;
        for (uint i = 0; i < campaign.donors.length; i++) {
            if (campaign.donors[i] == msg.sender) {
                isDonorAlreadyAdded = true;
                break;
            }
        }
        
        if (!isDonorAlreadyAdded) {
            campaign.donors.push(msg.sender);
            userDonations[msg.sender].push(campaignId);
        }
    }
    
    /**
     * @notice Updates an existing campaign's status
     * @param campaignId ID of the campaign to update
     * @param isActive New active status
     * @dev Can only be called by the campaign creator or the contract owner
     */
    function updateCampaignStatus(uint256 campaignId, bool isActive) 
        public 
        campaignExists(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];
        require(
            msg.sender == campaign.creator || msg.sender == owner(),
            "Only campaign creator or contract owner can update status"
        );
        
        campaign.isActive = isActive;
        
        // Update active campaign count if necessary
        if (campaign.creator == msg.sender) {
            if (isActive) {
                userActiveCampaignCount[msg.sender]++;
            } else if (userActiveCampaignCount[msg.sender] > 0) {
                userActiveCampaignCount[msg.sender]--;
            }
        }
        
        emit CampaignUpdated(campaignId);
    }

    //--------------------------------------------------------------------------
    // Milestone Management Functions
    //--------------------------------------------------------------------------
    
    /**
     * @notice Submits proof that a milestone has been completed
     * @param campaignId ID of the campaign
     * @param milestoneIndex Index of the milestone in the campaign
     * @param proofOfCompletion IPFS hash or other proof of milestone completion
     * @dev Can only be called by the campaign creator
     */
    function submitMilestoneCompletion(
        uint256 campaignId,
        uint256 milestoneIndex,
        string memory proofOfCompletion
    ) public 
        whenNotPaused 
        nonReentrant
        campaignExists(campaignId)
        campaignActive(campaignId)
        onlyCreator(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];
        require(milestoneIndex < campaign.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = campaign.milestones[milestoneIndex];
        require(!milestone.isCompleted, "Milestone already completed");
        require(!milestone.isUnderReview, "Milestone already under review");
        require(bytes(proofOfCompletion).length > 0, "Proof of completion required");

        milestone.proofOfCompletion = proofOfCompletion;
        milestone.isUnderReview = true;

        emit MilestoneCompleted(campaignId, milestoneIndex);
    }
    
    /**
     * @notice Votes on a milestone's completion
     * @param campaignId ID of the campaign
     * @param milestoneIndex Index of the milestone in the campaign
     * @param isUpvote Whether this is a positive vote
     * @param message Optional message with the vote
     * @dev Available to anyone while the milestone is under review
     */
    function voteMilestone(
        uint256 campaignId,
        uint256 milestoneIndex,
        bool isUpvote,
        string memory message
    ) public 
        whenNotPaused
        nonReentrant
        campaignExists(campaignId)
        campaignActive(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];
        require(milestoneIndex < campaign.milestones.length, "Invalid milestone index");
        require(campaign.milestones[milestoneIndex].isUnderReview, "Milestone not under review");

        milestoneVotes[campaignId][milestoneIndex].push(Vote({
            isUpvote: isUpvote,
            message: message,
            voter: msg.sender
        }));

        emit MilestoneVoteSubmitted(campaignId, milestoneIndex, msg.sender, isUpvote);
    }
    
    /**
     * @notice Releases funds for a completed milestone
     * @param campaignId ID of the campaign
     * @param milestoneIndex Index of the milestone in the campaign
     * @dev Can only be called by the contract owner to ensure proper validation
     */
    function releaseMilestoneFunds(uint256 campaignId, uint256 milestoneIndex) 
        public
        whenNotPaused
        nonReentrant
        onlyOwner
        campaignExists(campaignId)
        campaignActive(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];
        require(milestoneIndex < campaign.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = campaign.milestones[milestoneIndex];
        require(milestone.isUnderReview, "Milestone not under review");
        require(!milestone.isFunded, "Funds already released");

        uint256 amount = milestone.targetAmount;
        require(address(this).balance >= amount, "Insufficient contract balance");

        // Calculate fee
        uint256 fee = (amount * milestoneFeeRate) / 10000;
        uint256 releaseAmount = amount - fee;
        
        // Update milestone
        milestone.isFunded = true;
        milestone.isCompleted = true;
        milestone.isUnderReview = false;
        milestone.fundsReleased = releaseAmount;
        
        // Increment current milestone if this is the current one
        if (campaign.currentMilestone == milestoneIndex) {
            campaign.currentMilestone++;
        }

        // Transfer amounts
        (bool creatorSuccess, ) = payable(campaign.creator).call{value: releaseAmount}("");
        require(creatorSuccess, "Creator transfer failed");
        
        if (fee > 0) {
            (bool feeSuccess, ) = payable(treasury).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }

        emit FundsReleased(campaignId, milestoneIndex, releaseAmount, fee);
    }

    //--------------------------------------------------------------------------
    // Investment Functions
    //--------------------------------------------------------------------------
    
    /**
     * @notice Invests in a campaign
     * @param campaignId ID of the campaign to invest in
     * @dev Only available for investment-type campaigns
     */
    function invest(uint256 campaignId) public payable 
        whenNotPaused 
        nonReentrant
        campaignExists(campaignId)
        campaignActive(campaignId)
    {
        require(msg.value > 0, "Investment amount must be greater than 0");
        
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.campaignType == 1, "Not an investment campaign");
        require(msg.value >= campaign.minInvestment, "Investment amount below minimum");

        // Calculate fee
        uint256 fee = (msg.value * transactionFeeRate) / 10000;
        uint256 investmentAmount = msg.value - fee;
        
        // Update campaign
        campaign.totalFunded += investmentAmount;
        campaign.investments[msg.sender] += investmentAmount;
        _addDonorToCampaign(campaign, campaignId);
        
        // Transfer fee to treasury
        if (fee > 0) {
            (bool feeSuccess, ) = payable(treasury).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }

        emit InvestmentReceived(campaignId, msg.sender, investmentAmount);
    }
    
    /**
     * @notice Gets the investment amount for a specific investor in a campaign
     * @param campaignId ID of the campaign
     * @param investor Address of the investor
     * @return Amount invested by the investor
     */
    function getInvestmentAmount(uint256 campaignId, address investor) 
        public 
        view 
        campaignExists(campaignId)
        returns (uint256) 
    {
        Campaign storage campaign = campaigns[campaignId];
        return campaign.investments[investor];
    }
    
    /**
     * @notice Gets investment details for a campaign
     * @param campaignId ID of the campaign
     * @return campaignType Type of campaign (0=donation, 1=investment)
     * @return equityPercentage Equity percentage offered (in basis points)
     * @return minInvestment Minimum investment amount
     */
    function getCampaignInvestmentInfo(uint256 campaignId) 
        public 
        view
        campaignExists(campaignId)
        returns (uint8 campaignType, uint256 equityPercentage, uint256 minInvestment) 
    {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.campaignType,
            campaign.equityPercentage,
            campaign.minInvestment
        );
    }

    //--------------------------------------------------------------------------
    // View Functions
    //--------------------------------------------------------------------------
    
    /**
     * @notice Gets basic information about a campaign
     * @param campaignId ID of the campaign
     * @return id Campaign ID
     * @return creator Address of the campaign creator
     * @return title Campaign title
     * @return category Campaign category
     * @return goalAmount Total funding goal
     * @return totalFunded Current total funded amount
     * @return duration Campaign duration in seconds
     */
    function getCampaignBasicInfo(uint256 campaignId) 
        public 
        view
        campaignExists(campaignId)
        returns (
            uint256 id,
            address creator,
            string memory title,
            string memory category,
            uint256 goalAmount,
            uint256 totalFunded,
            uint256 duration
        ) 
    {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.id,
            campaign.creator,
            campaign.title,
            campaign.category,
            campaign.goalAmount,
            campaign.totalFunded,
            campaign.duration
        );
    }
    
    /**
     * @notice Gets extended information about a campaign
     * @param campaignId ID of the campaign
     * @return createdAt Timestamp when the campaign was created
     * @return isActive Whether the campaign is currently active
     * @return metadataIPFSHash IPFS hash for campaign metadata
     * @return mediaIPFSHash IPFS hash for campaign media
     * @return currentMilestone Current milestone index
     * @return campaignType Type of campaign (0=donation, 1=investment)
     */
    function getCampaignExtendedInfo(uint256 campaignId) 
        public 
        view
        campaignExists(campaignId) 
        returns (
            uint256 createdAt,
            bool isActive,
            string memory metadataIPFSHash,
            string memory mediaIPFSHash,
            uint256 currentMilestone,
            uint8 campaignType
        ) 
    {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.createdAt,
            campaign.isActive,
            campaign.metadataIPFSHash,
            campaign.mediaIPFSHash,
            campaign.currentMilestone,
            campaign.campaignType
        );
    }
    
    /**
     * @notice Gets all milestones for a campaign
     * @param campaignId ID of the campaign
     * @return Array of milestone structures
     */
    function getCampaignMilestones(uint256 campaignId) 
        public 
        view
        campaignExists(campaignId)
        returns (Milestone[] memory) 
    {
        return campaigns[campaignId].milestones;
    }
    
    /**
     * @notice Gets all donors for a campaign
     * @param campaignId ID of the campaign
     * @return Array of donor addresses
     */
    function getCampaignDonors(uint256 campaignId) 
        public 
        view
        campaignExists(campaignId)
        returns (address[] memory) 
    {
        return campaigns[campaignId].donors;
    }
    
    /**
     * @notice Gets all campaigns created by a user
     * @param user Address of the user
     * @return Array of campaign IDs
     */
    function getUserCampaigns(address user) public view returns (uint256[] memory) {
        return userCampaigns[user];
    }
    
    /**
     * @notice Gets all campaigns a user has donated to
     * @param user Address of the user
     * @return Array of campaign IDs
     */
    function getUserDonations(address user) public view returns (uint256[] memory) {
        return userDonations[user];
    }
    
    /**
     * @notice Gets all votes for a campaign milestone
     * @param campaignId ID of the campaign
     * @param milestoneIndex Index of the milestone
     * @return Array of vote structures
     */
    function getMilestoneVotes(uint256 campaignId, uint256 milestoneIndex) 
        public 
        view
        campaignExists(campaignId)
        returns (Vote[] memory) 
    {
        require(milestoneIndex < campaigns[campaignId].milestones.length, "Invalid milestone index");
        return milestoneVotes[campaignId][milestoneIndex];
    }
    
    /**
     * @notice Receive function to allow the contract to receive ETH
     * @dev Used for donations not directly tied to a campaign
     */
    receive() external payable {
        // Funds are just accepted into the contract
    }
}
