// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract WowzaRush {
    //--------------------------------------------------------------------------
    // State Variables for Activation
    //--------------------------------------------------------------------------
    bool private isActivated;
    address private owner;

    //--------------------------------------------------------------------------
    // Events for Activation
    //--------------------------------------------------------------------------
    event ContractActivated(address indexed activator, uint256 timestamp);
    event ContractDeactivated(address indexed deactivator, uint256 timestamp);

    //--------------------------------------------------------------------------
    // Owner-Only & Activation Modifiers
    //--------------------------------------------------------------------------
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier whenActivated() {
        require(isActivated, "Contract is not activated");
        _;
    }

    //--------------------------------------------------------------------------
    // Constructor (Initializes Owner & Deactivation)
    //--------------------------------------------------------------------------
    constructor() {
        owner = msg.sender;
        isActivated = false;
        campaignCounter = 0;
    }

    //--------------------------------------------------------------------------
    // Activation Functions
    //--------------------------------------------------------------------------
    function activate() external onlyOwner {
        require(!isActivated, "Contract is already activated");
        isActivated = true;
        emit ContractActivated(msg.sender, block.timestamp);
    }

    function deactivate() external onlyOwner {
        require(isActivated, "Contract is already deactivated");
        isActivated = false;
        emit ContractDeactivated(msg.sender, block.timestamp);
    }

    function getActivationStatus() public view returns (bool) {
        return isActivated;
    }

    //--------------------------------------------------------------------------
    // Structs
    //--------------------------------------------------------------------------
    struct Milestone {
        string name;
        uint256 targetAmount;
        bool isCompleted;
        bool isFunded;
        string proofOfCompletion;
        uint256 fundsReleased;
        bool isUnderReview;
    }

    struct Campaign {
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
        string[] media;
        address[] donors;
        Milestone[] milestones;
        uint256 currentMilestone;
        string proofOfWork;
        string beneficiaries;
        address[] stakeholders;
        uint8 campaignType; // 0 for funding, 1 for investing
        // Investment specific fields
        uint256 equityPercentage; // Percentage of equity offered to investors (in basis points, 100 = 1%)
        uint256 minInvestment; // Minimum investment amount
        mapping(address => uint256) investments; // Track individual investments for investing campaigns
    }

    struct Vote {
        bool isUpvote;
        string message;
        address voter;
    }

    struct CampaignMetadata {
        uint256 id;
        address creator;
        string title;
        string category;
        uint256 goalAmount;
        uint256 totalFunded;
        bool isActive;
    }

    //--------------------------------------------------------------------------
    // State Variables
    //--------------------------------------------------------------------------
    uint256 private campaignCounter;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(uint256 => Vote[])) public milestoneVotes;
    mapping(address => uint256[]) public userCampaigns;
    mapping(address => uint256[]) public userDonations;

    //--------------------------------------------------------------------------
    // Events
    //--------------------------------------------------------------------------
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title);
    event CampaignUpdated(uint256 indexed campaignId);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event MilestoneCompleted(uint256 indexed campaignId, uint256 milestoneIndex);
    event MilestoneVoteSubmitted(uint256 indexed campaignId, uint256 milestoneIndex, address voter, bool isUpvote);
    event FundsReleased(uint256 indexed campaignId, uint256 milestoneIndex, uint256 amount);
    event InvestmentReceived(uint256 indexed campaignId, address indexed investor, uint256 amount);

    //--------------------------------------------------------------------------
    // Getter: Campaign Count
    //--------------------------------------------------------------------------
    function getCampaignCount() public view returns (uint256) {
        return campaignCounter;
    }

    //--------------------------------------------------------------------------
    // Create Campaign (Requires Activation)
    //--------------------------------------------------------------------------
    function createCampaign(
        string memory title,
        string memory description,
        string memory category,
        uint256 goalAmount,
        uint256 duration,
        string[] memory media,
        Milestone[] memory milestones,
        string memory beneficiaries,
        address[] memory stakeholders,
        uint8 campaignType,
        uint256 equityPercentage,
        uint256 minInvestment
    ) public whenActivated returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(goalAmount > 0, "Goal amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(milestones.length > 0, "At least one milestone is required");
        require(campaignType <= 1, "Invalid campaign type");
        
        // Validation for investment campaigns
        if (campaignType == 1) {
            require(equityPercentage > 0 && equityPercentage <= 10000, "Equity percentage must be between 0.01% and 100%");
            require(minInvestment > 0, "Minimum investment must be greater than 0");
        }

        uint256 campaignId = campaignCounter++;

        Campaign storage campaign = campaigns[campaignId];
        campaign.id = campaignId;
        campaign.creator = msg.sender;
        campaign.title = title;
        campaign.description = description;
        campaign.category = category;
        campaign.goalAmount = goalAmount;
        campaign.duration = duration;
        campaign.createdAt = block.timestamp;
        campaign.isActive = true;
        campaign.media = media;
        campaign.beneficiaries = beneficiaries;
        campaign.stakeholders = stakeholders;
        campaign.campaignType = campaignType;
        
        // Set investment-specific fields if it's an investment campaign
        if (campaignType == 1) {
            campaign.equityPercentage = equityPercentage;
            campaign.minInvestment = minInvestment;
        }

        // Initialize milestones
        for (uint i = 0; i < milestones.length; i++) {
            campaign.milestones.push(milestones[i]);
        }

        userCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(campaignId, msg.sender, title);
        return campaignId;
    }

    //--------------------------------------------------------------------------
    // Donate
    //--------------------------------------------------------------------------
    function donate(uint256 campaignId) public payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.isActive, "Campaign is not active");
        // Commenting out the campaign end check to allow donations regardless of end date
        // require(block.timestamp < campaign.createdAt + campaign.duration, "Campaign has ended");

        campaign.totalFunded += msg.value;
        campaign.donors.push(msg.sender);
        userDonations[msg.sender].push(campaignId);

        emit DonationReceived(campaignId, msg.sender, msg.value);
    }

    //--------------------------------------------------------------------------
    // Submit Milestone Completion
    //--------------------------------------------------------------------------
    function submitMilestoneCompletion(
        uint256 campaignId,
        uint256 milestoneIndex,
        string memory proofOfCompletion
    ) public {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.creator, "Only campaign creator can submit milestone completion");
        require(milestoneIndex < campaign.milestones.length, "Invalid milestone index");
        require(!campaign.milestones[milestoneIndex].isCompleted, "Milestone already completed");

        campaign.milestones[milestoneIndex].proofOfCompletion = proofOfCompletion;
        campaign.milestones[milestoneIndex].isUnderReview = true;

        emit MilestoneCompleted(campaignId, milestoneIndex);
    }

    //--------------------------------------------------------------------------
    // Vote on Milestone
    //--------------------------------------------------------------------------
    function voteMilestone(
        uint256 campaignId,
        uint256 milestoneIndex,
        bool isUpvote,
        string memory message
    ) public {
        Campaign storage campaign = campaigns[campaignId];
        require(milestoneIndex < campaign.milestones.length, "Invalid milestone index");
        require(campaign.milestones[milestoneIndex].isUnderReview, "Milestone not under review");

        Vote memory vote = Vote({
            isUpvote: isUpvote,
            message: message,
            voter: msg.sender
        });

        milestoneVotes[campaignId][milestoneIndex].push(vote);

        emit MilestoneVoteSubmitted(campaignId, milestoneIndex, msg.sender, isUpvote);
    }

    //--------------------------------------------------------------------------
    // Release Milestone Funds
    //--------------------------------------------------------------------------
    function releaseMilestoneFunds(uint256 campaignId, uint256 milestoneIndex) public {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.creator, "Only campaign creator can release funds");
        require(milestoneIndex < campaign.milestones.length, "Invalid milestone index");
        require(!campaign.milestones[milestoneIndex].isFunded, "Funds already released");

        uint256 amount = campaign.milestones[milestoneIndex].targetAmount;
        require(address(this).balance >= amount, "Insufficient contract balance");

        campaign.milestones[milestoneIndex].isFunded = true;
        campaign.milestones[milestoneIndex].fundsReleased = amount;

        payable(campaign.creator).transfer(amount);

        emit FundsReleased(campaignId, milestoneIndex, amount);
    }

    //--------------------------------------------------------------------------
    // Invest in Campaign
    //--------------------------------------------------------------------------
    function invest(uint256 campaignId) public payable {
        require(msg.value > 0, "Investment amount must be greater than 0");
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(campaign.campaignType == 1, "Not an investment campaign");
        require(msg.value >= campaign.minInvestment, "Investment amount below minimum");

        // Update campaign funding
        campaign.totalFunded += msg.value;
        campaign.donors.push(msg.sender);
        
        // Track the investment amount for this investor
        campaign.investments[msg.sender] += msg.value;
        
        // Add to user donations list (reusing for tracking investments)
        userDonations[msg.sender].push(campaignId);

        emit InvestmentReceived(campaignId, msg.sender, msg.value);
    }
    
    //--------------------------------------------------------------------------
    // Get investment details
    //--------------------------------------------------------------------------
    function getInvestmentDetails(uint256 campaignId, address investor) public view returns (uint256 investmentAmount, uint256 equityShare) {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.campaignType == 1, "Not an investment campaign");
        
        uint256 investment = campaign.investments[investor];
        
        // Calculate equity share - proportional to investment amount
        uint256 totalEquity = 0;
        if (campaign.totalFunded > 0) {
            totalEquity = (investment * campaign.equityPercentage) / campaign.totalFunded;
        }
        
        return (investment, totalEquity);
    }

    //--------------------------------------------------------------------------
    // View Functions
    //--------------------------------------------------------------------------
    function getCampaign(uint256 campaignId) public view returns (Campaign memory) {
        return campaigns[campaignId];
    }

    function getCampaignMetadata(uint256 campaignId) public view returns (CampaignMetadata memory) {
        Campaign storage campaign = campaigns[campaignId];
        return CampaignMetadata({
            id: campaign.id,
            creator: campaign.creator,
            title: campaign.title,
            category: campaign.category,
            goalAmount: campaign.goalAmount,
            totalFunded: campaign.totalFunded,
            isActive: campaign.isActive
        });
    }

    function getUserCampaigns(address user) public view returns (uint256[] memory) {
        return userCampaigns[user];
    }

    function getUserDonations(address user) public view returns (uint256[] memory) {
        return userDonations[user];
    }

    function getMilestoneVotes(uint256 campaignId, uint256 milestoneIndex) public view returns (Vote[] memory) {
        return milestoneVotes[campaignId][milestoneIndex];
    }

    function getCampaignDetails(uint256 campaignId) public view returns (
        string memory description,
        string memory proofOfWork,
        string memory beneficiaries,
        string[] memory media
    ) {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.description,
            campaign.proofOfWork,
            campaign.beneficiaries,
            campaign.media
        );
    }
}
