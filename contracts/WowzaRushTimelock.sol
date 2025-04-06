// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * @title WowzaRushTimelock
 * @dev A timelock controller for WowzaRush governance that holds admin rights to the proxy contracts
 * and enforces a delay before upgrade transactions can be executed.
 * This contract will be used in Phase 3 of the governance timeline.
 */
contract WowzaRushTimelock {
    // Events
    event OperationScheduled(
        bytes32 indexed operationId,
        address indexed target,
        uint256 value,
        bytes data,
        uint256 executionTime,
        bool emergency
    );
    event OperationExecuted(bytes32 indexed operationId);
    event OperationCancelled(bytes32 indexed operationId);
    event EmergencyModeActivated();
    event EmergencyModeDeactivated();
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event GuardianSet(address indexed newGuardian);

    // Structs
    struct Operation {
        address target;      // The address to call
        uint256 value;       // Native token value to send
        bytes data;          // The function call data
        uint256 executionTime; // When the operation can be executed
        bool executed;       // Whether the operation was executed
        bool emergency;      // Whether this is an emergency operation
    }

    // State variables
    mapping(bytes32 => Operation) public operations;
    mapping(address => bool) public proposers;
    mapping(address => bool) public executors;
    
    uint256 public normalDelay;      // Delay for normal operations (in seconds)
    uint256 public emergencyDelay;   // Delay for emergency operations (in seconds)
    bool public emergencyMode;       // Whether emergency mode is active
    
    address public owner;            // Owner of the contract
    address public guardian;         // Security council address that can activate emergency mode
    uint256 public emergencyModeExpiresAt; // When emergency mode expires
    
    uint256 public constant EMERGENCY_MODE_DURATION = 30 days;
    uint256 public constant MAX_NORMAL_DELAY = 30 days;
    uint256 public constant MIN_NORMAL_DELAY = 1 days;
    uint256 public constant MAX_EMERGENCY_DELAY = 3 days;
    uint256 public constant MIN_EMERGENCY_DELAY = 1 hours;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Timelock: caller is not the owner");
        _;
    }
    
    modifier onlyProposer() {
        require(proposers[msg.sender], "Timelock: caller is not a proposer");
        _;
    }
    
    modifier onlyExecutor() {
        require(executors[msg.sender], "Timelock: caller is not an executor");
        _;
    }
    
    modifier onlyGuardian() {
        require(msg.sender == guardian, "Timelock: caller is not the guardian");
        _;
    }

    /**
     * @dev Constructor that sets up the timelock with initial delays and permissions
     * @param _normalDelay Delay for normal operations in seconds
     * @param _emergencyDelay Delay for emergency operations in seconds
     * @param _proposers Array of addresses that can schedule operations
     * @param _executors Array of addresses that can execute operations
     * @param _guardian Address that can activate emergency mode
     */
    constructor(
        uint256 _normalDelay,
        uint256 _emergencyDelay,
        address[] memory _proposers,
        address[] memory _executors,
        address _guardian
    ) {
        require(_normalDelay >= MIN_NORMAL_DELAY && _normalDelay <= MAX_NORMAL_DELAY, "Timelock: invalid normal delay");
        require(_emergencyDelay >= MIN_EMERGENCY_DELAY && _emergencyDelay <= MAX_EMERGENCY_DELAY, "Timelock: invalid emergency delay");
        require(_guardian != address(0), "Timelock: guardian cannot be zero address");
        
        normalDelay = _normalDelay;
        emergencyDelay = _emergencyDelay;
        emergencyMode = false;
        owner = msg.sender;
        guardian = _guardian;
        
        for (uint256 i = 0; i < _proposers.length; i++) {
            proposers[_proposers[i]] = true;
        }
        
        for (uint256 i = 0; i < _executors.length; i++) {
            executors[_executors[i]] = true;
        }
    }

    /**
     * @dev Schedule an operation to be executed after the timelock delay
     * @param target The address to call
     * @param value Native token value to send
     * @param data The function call data
     * @param emergency Whether this is an emergency operation
     * @return operationId The ID of the scheduled operation
     */
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bool emergency
    ) external onlyProposer returns (bytes32 operationId) {
        require(target != address(0), "Timelock: target cannot be zero address");
        
        // Determine delay based on operation type and current mode
        uint256 delay;
        if (emergency) {
            require(emergencyMode, "Timelock: emergency operations only allowed in emergency mode");
            delay = emergencyDelay;
        } else {
            delay = normalDelay;
        }
        
        uint256 executionTime = block.timestamp + delay;
        
        operationId = keccak256(abi.encode(target, value, data, block.number));
        require(operations[operationId].executionTime == 0, "Timelock: operation already scheduled");
        
        operations[operationId] = Operation({
            target: target,
            value: value,
            data: data,
            executionTime: executionTime,
            executed: false,
            emergency: emergency
        });
        
        emit OperationScheduled(operationId, target, value, data, executionTime, emergency);
        return operationId;
    }

    /**
     * @dev Execute a scheduled operation after the timelock delay has passed
     * @param target The address to call
     * @param value Native token value to send
     * @param data The function call data
     * @return success Whether the call was successful
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external payable onlyExecutor returns (bool success) {
        bytes32 operationId = keccak256(abi.encode(target, value, data, block.number));
        Operation storage operation = operations[operationId];
        
        require(operation.executionTime > 0, "Timelock: operation not found");
        require(!operation.executed, "Timelock: operation already executed");
        require(block.timestamp >= operation.executionTime, "Timelock: operation cannot be executed yet");
        
        operation.executed = true;
        
        emit OperationExecuted(operationId);
        
        // Execute the call
        (success, ) = target.call{value: value}(data);
        require(success, "Timelock: execution failed");
        
        return success;
    }

    /**
     * @dev Cancel a scheduled operation
     * @param operationId The ID of the operation to cancel
     */
    function cancel(bytes32 operationId) external onlyProposer {
        Operation storage operation = operations[operationId];
        require(operation.executionTime > 0, "Timelock: operation not found");
        require(!operation.executed, "Timelock: operation already executed");
        
        delete operations[operationId];
        
        emit OperationCancelled(operationId);
    }

    /**
     * @dev Activate emergency mode, enabling emergency operations
     */
    function activateEmergencyMode() external onlyGuardian {
        require(!emergencyMode, "Timelock: emergency mode already active");
        
        emergencyMode = true;
        emergencyModeExpiresAt = block.timestamp + EMERGENCY_MODE_DURATION;
        
        emit EmergencyModeActivated();
    }

    /**
     * @dev Deactivate emergency mode
     */
    function deactivateEmergencyMode() external onlyGuardian {
        require(emergencyMode, "Timelock: emergency mode not active");
        
        emergencyMode = false;
        
        emit EmergencyModeDeactivated();
    }

    /**
     * @dev Check if emergency mode has expired and deactivate if needed
     * @return Whether emergency mode was deactivated
     */
    function checkEmergencyModeExpiry() external returns (bool) {
        if (emergencyMode && block.timestamp > emergencyModeExpiresAt) {
            emergencyMode = false;
            emit EmergencyModeDeactivated();
            return true;
        }
        return false;
    }

    /**
     * @dev Update the normal delay for operations
     * @param newDelay New delay in seconds
     */
    function updateNormalDelay(uint256 newDelay) external onlyOwner {
        require(newDelay >= MIN_NORMAL_DELAY && newDelay <= MAX_NORMAL_DELAY, "Timelock: invalid normal delay");
        normalDelay = newDelay;
    }

    /**
     * @dev Update the emergency delay for operations
     * @param newDelay New delay in seconds
     */
    function updateEmergencyDelay(uint256 newDelay) external onlyOwner {
        require(newDelay >= MIN_EMERGENCY_DELAY && newDelay <= MAX_EMERGENCY_DELAY, "Timelock: invalid emergency delay");
        emergencyDelay = newDelay;
    }

    /**
     * @dev Add a proposer
     * @param proposer Address to add as a proposer
     */
    function addProposer(address proposer) external onlyOwner {
        require(proposer != address(0), "Timelock: proposer cannot be zero address");
        proposers[proposer] = true;
    }

    /**
     * @dev Remove a proposer
     * @param proposer Address to remove as a proposer
     */
    function removeProposer(address proposer) external onlyOwner {
        proposers[proposer] = false;
    }

    /**
     * @dev Add an executor
     * @param executor Address to add as an executor
     */
    function addExecutor(address executor) external onlyOwner {
        require(executor != address(0), "Timelock: executor cannot be zero address");
        executors[executor] = true;
    }

    /**
     * @dev Remove an executor
     * @param executor Address to remove as an executor
     */
    function removeExecutor(address executor) external onlyOwner {
        executors[executor] = false;
    }

    /**
     * @dev Update the guardian address
     * @param newGuardian New guardian address
     */
    function updateGuardian(address newGuardian) external onlyOwner {
        require(newGuardian != address(0), "Timelock: guardian cannot be zero address");
        guardian = newGuardian;
        emit GuardianSet(newGuardian);
    }

    /**
     * @dev Transfer ownership of the timelock
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Timelock: new owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
} 