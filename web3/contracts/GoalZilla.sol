// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GoalZilla {
    // Keep all existing structs
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
    }

    struct Vote {
        bool isUpvote;
        string message;
        address voter;
    }

    // New structs for optimized data retrieval
    struct CampaignMetadata {
        uint256 id;
        address creator;
        string title;
        string category;
        uint256 goalAmount;
        uint256 totalFunded;
        bool isActive;
        uint256 createdAt;
        uint256 duration;
    }

    struct CampaignDetails {
        string description;
        string proofOfWork;
        string beneficiaries;
        string[] media;
    }

    struct MilestoneMetadata {
        string name;
        uint256 targetAmount;
        bool isCompleted;
        bool isFunded;
        bool isUnderReview;
    }

    // Keep all existing state variables
    uint256 public campaignCounter = 0;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public donations;
    mapping(uint256 => mapping(uint256 => Vote[])) public milestoneVotes;
    mapping(string => uint256[]) public categoryToCampaigns;

    // Keep all existing events
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount);
    event MilestoneFunded(uint256 indexed campaignId, uint256 indexed milestoneIndex, uint256 amount);
    event MilestoneCompleted(uint256 indexed campaignId, uint256 indexed milestoneIndex, string proofOfCompletion);
    event MilestoneUnderReview(uint256 indexed campaignId, uint256 indexed milestoneIndex);
    event FundsWithdrawn(uint256 indexed campaignId, address indexed recipient, uint256 amount);
    event VoteSubmitted(uint256 indexed campaignId, uint256 indexed milestoneIndex, address indexed voter, bool isUpvote, string message);
    event MilestoneAccepted(uint256 indexed campaignId, uint256 indexed milestoneIndex);
    event MilestoneRejected(uint256 indexed campaignId, uint256 indexed milestoneIndex);

    // Keep all existing modifiers
    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId < campaignCounter, "GoalZilla: Campaign does not exist");
        _;
    }

    modifier onlyCampaignCreator(uint256 _campaignId) {
        require(campaigns[_campaignId].creator == msg.sender, "GoalZilla: Not campaign creator");
        _;
    }

    modifier campaignActive(uint256 _campaignId) {
        require(campaigns[_campaignId].isActive, "GoalZilla: Campaign is not active");
        require(block.timestamp < campaigns[_campaignId].createdAt + campaigns[_campaignId].duration * 1 days, "GoalZilla: Campaign has ended");
        _;
    }

    modifier validMilestone(uint256 _campaignId, uint256 _milestoneIndex) {
        require(_milestoneIndex < campaigns[_campaignId].milestones.length, "GoalZilla: Invalid milestone index");
        _;
    }

    modifier isStakeholder(uint256 _campaignId) {
        bool isValid = false;
        address[] memory stakeholders = campaigns[_campaignId].stakeholders;
        for (uint256 i = 0; i < stakeholders.length; i++) {
            if (stakeholders[i] == msg.sender) {
                isValid = true;
                break;
            }
        }
        require(isValid, "GoalZilla: Not a stakeholder");
        _;
    }

    // Main functions
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _goalAmount,
        uint256 _duration,
        string[] memory _milestoneNames,
        uint256[] memory _milestoneTargets,
        string memory _proofOfWork,
        string memory _beneficiaries,
        string[] memory _media
    ) external payable returns (uint256) {
        require(_goalAmount > 0, "GoalZilla: Goal amount must be greater than 0");
        require(_duration > 0 && _duration <= 365, "GoalZilla: Duration must be between 1 and 365 days");
        require(_milestoneNames.length == _milestoneTargets.length, "GoalZilla: Milestone arrays length mismatch");
        require(_milestoneNames.length > 0, "GoalZilla: At least one milestone required");

        uint256 campaignId = campaignCounter++;
        Campaign storage campaign = campaigns[campaignId];

        campaign.id = campaignId;
        campaign.creator = msg.sender;
        campaign.title = _title;
        campaign.description = _description;
        campaign.category = _category;
        campaign.goalAmount = _goalAmount;
        campaign.duration = _duration;
        campaign.createdAt = block.timestamp;
        campaign.isActive = true;
        campaign.proofOfWork = _proofOfWork;
        campaign.beneficiaries = _beneficiaries;
        campaign.media = _media;

        // Initialize milestones
        for (uint256 i = 0; i < _milestoneNames.length; i++) {
            campaign.milestones.push(Milestone({
                name: _milestoneNames[i],
                targetAmount: _milestoneTargets[i],
                isCompleted: false,
                isFunded: false,
                proofOfCompletion: "",
                fundsReleased: 0,
                isUnderReview: false
            }));
        }

        categoryToCampaigns[_category].push(campaignId);

        emit CampaignCreated(campaignId, msg.sender, _title, _goalAmount);
        return campaignId;
    }

    function fundMilestone(uint256 _campaignId, uint256 _milestoneIndex) 
        external 
        payable 
        campaignExists(_campaignId)
        campaignActive(_campaignId)
        validMilestone(_campaignId, _milestoneIndex)
    {
        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = campaign.milestones[_milestoneIndex];

        require(!milestone.isFunded, "GoalZilla: Milestone already funded");
        require(msg.value == milestone.targetAmount, "GoalZilla: Incorrect funding amount");

        milestone.isFunded = true;
        campaign.totalFunded += msg.value;

        if (donations[_campaignId][msg.sender] == 0) {
            campaign.donors.push(msg.sender);
            campaign.stakeholders.push(msg.sender); // Add donor to stakeholders
        }
        donations[_campaignId][msg.sender] += msg.value;

        emit MilestoneFunded(_campaignId, _milestoneIndex, msg.value);
    }

    function completeMilestone(
        uint256 _campaignId, 
        uint256 _milestoneIndex,
        string memory _proofOfCompletion
    ) 
        external 
        campaignExists(_campaignId)
        onlyCampaignCreator(_campaignId)
        validMilestone(_campaignId, _milestoneIndex)
    {
        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = campaign.milestones[_milestoneIndex];

        require(milestone.isFunded, "GoalZilla: Milestone not funded");
        require(!milestone.isCompleted, "GoalZilla: Milestone already completed");

        milestone.isCompleted = true;
        milestone.proofOfCompletion = _proofOfCompletion;
        milestone.isUnderReview = true; // Set to under review for voting

        emit MilestoneCompleted(_campaignId, _milestoneIndex, _proofOfCompletion);
        emit MilestoneUnderReview(_campaignId, _milestoneIndex);
    }

    function submitVote(
    uint256 _campaignId, 
    uint256 _milestoneIndex,
    bool _isUpvote, 
    string memory _message
) 
    external 
    campaignExists(_campaignId)
    validMilestone(_campaignId, _milestoneIndex)
    isStakeholder(_campaignId)
{
    milestoneVotes[_campaignId][_milestoneIndex].push(Vote({
        isUpvote: _isUpvote,
        message: _message,
        voter: msg.sender
    }));

    emit VoteSubmitted(_campaignId, _milestoneIndex, msg.sender, _isUpvote, _message);
}


    function reviewMilestone(uint256 _campaignId, uint256 _milestoneIndex) 
        external 
        campaignExists(_campaignId)
        validMilestone(_campaignId, _milestoneIndex)
        onlyCampaignCreator(_campaignId)
    {
        Vote[] storage votes = milestoneVotes[_campaignId][_milestoneIndex];

        uint256 upvotes = 0;
        uint256 downvotes = 0;
        
        // Count the votes
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].isUpvote) {
                upvotes++;
            } else {
                downvotes++;
            }
        }

        if (upvotes > downvotes) {
            // Milestone accepted
            campaigns[_campaignId].milestones[_milestoneIndex].isUnderReview = false;
            emit MilestoneAccepted(_campaignId, _milestoneIndex);
        } else {
            // Milestone rejected
            campaigns[_campaignId].milestones[_milestoneIndex].isUnderReview = false;
            emit MilestoneRejected(_campaignId, _milestoneIndex);
        }
    }

      function getCampaignMetadata(uint256 _campaignId) 
        public 
        view 
        campaignExists(_campaignId) 
        returns (CampaignMetadata memory) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        return CampaignMetadata({
            id: campaign.id,
            creator: campaign.creator,
            title: campaign.title,
            category: campaign.category,
            goalAmount: campaign.goalAmount,
            totalFunded: campaign.totalFunded,
            isActive: campaign.isActive,
            createdAt: campaign.createdAt,
            duration: campaign.duration
        });
    }

    function getCampaignDetails(uint256 _campaignId) 
        public 
        view 
        campaignExists(_campaignId) 
        returns (CampaignDetails memory) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        return CampaignDetails({
            description: campaign.description,
            proofOfWork: campaign.proofOfWork,
            beneficiaries: campaign.beneficiaries,
            media: campaign.media
        });
    }

    function getCampaignParticipants(uint256 _campaignId)
        public
        view
        campaignExists(_campaignId)
        returns (address[] memory donors, address[] memory stakeholders)
    {
        Campaign storage campaign = campaigns[_campaignId];
        return (campaign.donors, campaign.stakeholders);
    }

    // Enhanced milestone retrieval functions
    function getMilestoneMetadata(uint256 _campaignId, uint256 _milestoneIndex)
        public
        view
        campaignExists(_campaignId)
        validMilestone(_campaignId, _milestoneIndex)
        returns (MilestoneMetadata memory)
    {
        Milestone storage milestone = campaigns[_campaignId].milestones[_milestoneIndex];
        return MilestoneMetadata({
            name: milestone.name,
            targetAmount: milestone.targetAmount,
            isCompleted: milestone.isCompleted,
            isFunded: milestone.isFunded,
            isUnderReview: milestone.isUnderReview
        });
    }

    function getMilestoneProof(uint256 _campaignId, uint256 _milestoneIndex)
        public
        view
        campaignExists(_campaignId)
        validMilestone(_campaignId, _milestoneIndex)
        returns (string memory proofOfCompletion, uint256 fundsReleased)
    {
        Milestone storage milestone = campaigns[_campaignId].milestones[_milestoneIndex];
        return (milestone.proofOfCompletion, milestone.fundsReleased);
    }

    // Enhanced category retrieval
    function getCategoryStats(string memory _category)
        public
        view
        returns (uint256 totalCampaigns, uint256 activeCampaigns)
    {
        uint256[] storage campaignIds = categoryToCampaigns[_category];
        uint256 active = 0;
        for (uint256 i = 0; i < campaignIds.length; i++) {
            if (campaigns[campaignIds[i]].isActive) {
                active++;
            }
        }
        return (campaignIds.length, active);
    }

    // Batch retrieval functions
    function getCampaignsByRange(uint256 _start, uint256 _end)
        public
        view
        returns (uint256[] memory)
    {
        require(_end >= _start, "GoalZilla: Invalid range");
        uint256 length = _end - _start + 1;
        uint256[] memory result = new uint256[](length);
        for (uint256 i = 0; i < length && (_start + i) < campaignCounter; i++) {
            result[i] = _start + i;
        }
        return result;
    }

    function getMilestoneStatus(uint256 _campaignId, uint256 _milestoneIndex)
        public
        view
        campaignExists(_campaignId)
        validMilestone(_campaignId, _milestoneIndex)
        returns (bool isCompleted, bool isFunded, bool isUnderReview, uint256 voteCount)
    {
        Milestone storage milestone = campaigns[_campaignId].milestones[_milestoneIndex];
        return (
            milestone.isCompleted,
            milestone.isFunded,
            milestone.isUnderReview,
            milestoneVotes[_campaignId][_milestoneIndex].length
        );
    }

}
