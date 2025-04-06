// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Updated pragma

/**
 * @title WowzaRushStorage
 * @dev Contract that defines the storage layout for WowzaRush.
 * This contract should never be modified to ensure storage compatibility across upgrades.
 * New storage variables should only be added at the end.
 */
contract WowzaRushStorage {
    // Campaign struct
    struct Campaign {
        address creator;
        string title;
        string description;
        uint256 goalAmount;
        uint256 amountRaised;
        uint256 deadline;
        bool completed;
        bool fundsClaimed;
        mapping(address => uint256) contributions;
        address[] contributors;
        Milestone[] milestones;
    }
    
    // Milestone struct
    struct Milestone {
        string title;
        string description;
        uint256 amount;
        uint256 dueDate; // Add dueDate to match ABI tuple
        bool completed;
        bool fundsClaimed;
    }
    
    // Series Funding Structs
    struct SeriesFundingCampaign {
        address creator;
        string title;
        string description;
        uint256 initialValuation;
        address[] investors;
        SeriesFundingRound[] rounds;
    }
    
    struct SeriesFundingRound {
        uint256 targetAmount;
        uint256 minInvestment;
        uint256 equityOffered; // In basis points (1/100 of a percent)
        uint256 amountRaised;
        uint256 startTime;
        uint256 endTime;
        bool completed;
        mapping(address => uint256) investments;
    }
    
    // Storage variables
    uint256 internal _campaignCount;
    uint256 internal _seriesFundingCount;
    
    // Mappings
    mapping(uint256 => Campaign) internal _campaigns;
    mapping(uint256 => SeriesFundingCampaign) internal _seriesFundingCampaigns;
    mapping(address => uint256[]) internal _creatorCampaigns;
    mapping(address => uint256[]) internal _contributorCampaigns;
    mapping(address => uint256[]) internal _creatorSeriesCampaigns;
    mapping(address => uint256[]) internal _investorSeriesCampaigns;
    
    // Platform fee related variables
    address internal _platformOwner;
    uint256 internal _transactionFeePercentage; // In basis points (1/100 of a percent)
    uint256 internal _milestoneFeePercentage;   // In basis points
    mapping(address => uint256) internal _accumulatedFees; // Token address => accumulated fees
    
    // Token system related variables
    address internal _wowzaRushToken;
    bool internal _useTokenDiscounts;
    
    // Reserved storage gap to allow adding new variables in future upgrades
    uint256[50] private __gap;
} 