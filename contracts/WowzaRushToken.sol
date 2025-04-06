// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Update to use npm package paths (assuming installed)
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol"; // Import EIP712

/**
 * @title WowzaRushToken
 * @dev ERC20 token for the WowzaRush platform with voting and staking capabilities
 */
contract WowzaRushToken is ERC20, ERC20Burnable, ERC20Votes, Ownable, ReentrancyGuard {
    // Staking variables
    struct StakingPosition {
        uint256 amount;
        uint256 startTime;
        uint256 duration;
        bool claimed;
    }
    
    mapping(address => StakingPosition[]) private _stakingPositions;
    uint256 private _totalStaked;
    
    // Fee discount related constants
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant MIN_STAKE_DURATION = 30 days;
    uint256 private constant MID_STAKE_DURATION = 90 days;
    uint256 private constant MAX_STAKE_DURATION = 180 days;
    
    uint256 private constant SHORT_STAKE_REWARD_RATE = 500;  // 5% APY
    uint256 private constant MID_STAKE_REWARD_RATE = 1000;   // 10% APY
    uint256 private constant LONG_STAKE_REWARD_RATE = 1500;  // 15% APY
    
    // Fee discount tiers based on token holdings
    uint256 private constant TIER1_THRESHOLD = 1000 * 10**18;  // 1,000 tokens
    uint256 private constant TIER2_THRESHOLD = 10000 * 10**18; // 10,000 tokens
    uint256 private constant TIER3_THRESHOLD = 50000 * 10**18; // 50,000 tokens
    
    uint256 private constant TIER1_DISCOUNT = 1000; // 10% discount
    uint256 private constant TIER2_DISCOUNT = 2000; // 20% discount
    uint256 private constant TIER3_DISCOUNT = 3000; // 30% discount
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 duration, uint256 positionIndex);
    event UnstakedAndRewardClaimed(address indexed user, uint256 amount, uint256 reward, uint256 positionIndex);
    event FeeDiscountApplied(address indexed user, uint256 discount);

    // Add EIP712 constructor arguments required by ERC20Votes
    constructor()
        ERC20("WowzaRush Token", "WZR")
        EIP712("WowzaRush Token", "1") // Restore EIP712 call
        Ownable(msg.sender)
    {
        _mint(msg.sender, 100000000 * 10**decimals()); // 100 million tokens initial supply
    }

    // --- Add required _update override ---
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes) // Specify both base contracts
    {
        super._update(from, to, value);
    }
    // --- End _update override ---


    /**
     * @dev Stake tokens for a specified duration
     * @param amount The amount to stake
     * @param durationDays The staking duration in days
     */
    function stake(uint256 amount, uint256 durationDays) external nonReentrant {
        require(amount > 0, "WZR: Cannot stake zero amount");
        require(
            durationDays * 1 days >= MIN_STAKE_DURATION,
            "WZR: Staking duration below minimum"
        );
        require(
            balanceOf(msg.sender) >= amount,
            "WZR: Insufficient balance"
        );
        
        // Transfer tokens to the contract
        _transfer(msg.sender, address(this), amount);
        
        // Create staking position
        StakingPosition memory position = StakingPosition({
            amount: amount,
            startTime: block.timestamp,
            duration: durationDays * 1 days,
            claimed: false
        });
        
        // Add position to user's staking positions
        _stakingPositions[msg.sender].push(position);
        
        // Update total staked amount
        _totalStaked += amount;
        
        emit Staked(msg.sender, amount, durationDays * 1 days, _stakingPositions[msg.sender].length - 1);
    }
    
    /**
     * @dev Unstake tokens and claim rewards
     * @param positionIndex The index of the staking position
     */
    function unstakeAndClaimRewards(uint256 positionIndex) external nonReentrant {
        require(
            positionIndex < _stakingPositions[msg.sender].length,
            "WZR: Invalid position index"
        );
        
        StakingPosition storage position = _stakingPositions[msg.sender][positionIndex];
        require(!position.claimed, "WZR: Position already claimed");
        require(
            block.timestamp >= position.startTime + position.duration,
            "WZR: Staking period not completed"
        );
        
        uint256 reward = calculateReward(position);
        uint256 amount = position.amount;
        
        // Mark as claimed
        position.claimed = true;
        
        // Update total staked amount
        _totalStaked -= amount;
        
        // Transfer staked amount back to user
        _transfer(address(this), msg.sender, amount);
        
        // Mint reward tokens to user
        _mint(msg.sender, reward);
        
        emit UnstakedAndRewardClaimed(msg.sender, amount, reward, positionIndex);
    }
    
    /**
     * @dev Calculate reward based on staking duration and amount
     * @param position The staking position
     * @return The reward amount
     */
    function calculateReward(StakingPosition memory position) internal pure returns (uint256) {
        uint256 rewardRate;
        
        if (position.duration >= MAX_STAKE_DURATION) {
            rewardRate = LONG_STAKE_REWARD_RATE;
        } else if (position.duration >= MID_STAKE_DURATION) {
            rewardRate = MID_STAKE_REWARD_RATE;
        } else {
            rewardRate = SHORT_STAKE_REWARD_RATE;
        }
        
        // Calculate reward: amount * rate * (duration / 365 days) / BASIS_POINTS
        return (position.amount * rewardRate * position.duration) / (365 days * BASIS_POINTS);
    }
    
    /**
     * @dev Get the fee discount percentage based on user's token holdings
     * @param user The user address
     * @return The discount percentage in basis points
     */
    function getFeeDiscount(address user) external view returns (uint256) {
        uint256 stakedBalance = getTotalStakedAmount(user);
        uint256 totalBalance = balanceOf(user) + stakedBalance;
        
        if (totalBalance >= TIER3_THRESHOLD) {
            return TIER3_DISCOUNT;
        } else if (totalBalance >= TIER2_THRESHOLD) {
            return TIER2_DISCOUNT;
        } else if (totalBalance >= TIER1_THRESHOLD) {
            return TIER1_DISCOUNT;
        } else {
            return 0;
        }
    }
    
    /**
     * @dev Get the total amount a user has staked across all positions
     * @param user The user address
     * @return The total staked amount
     */
    function getTotalStakedAmount(address user) public view returns (uint256) {
        uint256 totalStaked = 0;
        StakingPosition[] memory positions = _stakingPositions[user];
        
        for (uint256 i = 0; i < positions.length; i++) {
            if (!positions[i].claimed) {
                totalStaked += positions[i].amount;
            }
        }
        
        return totalStaked;
    }
    
    /**
     * @dev Get the number of staking positions for a user
     * @param user The user address
     * @return The number of staking positions
     */
    function getStakingPositionCount(address user) external view returns (uint256) {
        return _stakingPositions[user].length;
    }
    
    /**
     * @dev Get details of a specific staking position
     * @param user The user address
     * @param positionIndex The position index
     * @return amount The staked amount
     * @return startTime The start time of staking
     * @return duration The staking duration
     * @return claimed Whether rewards have been claimed
     * @return canUnstake Whether the position can be unstaked now
     * @return reward The current calculated reward
     */
    function getStakingPosition(address user, uint256 positionIndex) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 duration,
        bool claimed,
        bool canUnstake,
        uint256 reward
    ) {
        require(
            positionIndex < _stakingPositions[user].length,
            "WZR: Invalid position index"
        );
        
        StakingPosition memory position = _stakingPositions[user][positionIndex];
        bool canUnstakeNow = block.timestamp >= position.startTime + position.duration;
        uint256 currentReward = canUnstakeNow && !position.claimed ? calculateReward(position) : 0;
        
        return (
            position.amount,
            position.startTime,
            position.duration,
            position.claimed,
            canUnstakeNow,
            currentReward
        );
    }
    
    /**
     * @dev Get the total staked amount across all users
     * @return The total staked amount
     */
    function getTotalStaked() external view returns (uint256) {
        return _totalStaked;
    }
    
    // Required overrides for ERC20Votes compatibility

    // Required overrides for ERC20Votes compatibility

    // Remove _afterTokenTransfer, _mint, _burn overrides as they only call super
    // and cause compilation issues due to non-virtual base functions in the specific OZ version.
    // The inherited versions from ERC20Votes should handle the necessary logic.

    // function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual override {
    //     super._afterTokenTransfer(from, to, amount);
    // }

    // function _mint(address to, uint256 amount) internal virtual override {
    //     super._mint(to, amount);
    // }

    // function _burn(address account, uint256 amount) internal virtual override {
    //     super._burn(account, amount);
    // }
} 