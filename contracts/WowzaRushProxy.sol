// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title WowzaRushProxy
 * @dev This contract implements a proxy pattern that allows for upgradeability of the WowzaRush platform.
 * It delegates all calls to an implementation contract that can be upgraded by the platform admin.
 */
contract WowzaRushProxy {
    // Address of the current implementation contract
    address private _implementation;
    
    // Address of the admin who can upgrade the implementation
    address private _admin;
    
    // Storage slot for the implementation address
    // Using a specific storage slot ensures storage layout doesn't conflict with implementation contract
    bytes32 private constant IMPLEMENTATION_SLOT = keccak256("org.wowzarush.proxy.implementation");
    
    // Storage slot for the admin address
    bytes32 private constant ADMIN_SLOT = keccak256("org.wowzarush.proxy.admin");
    
    // Events
    event Upgraded(address indexed implementation);
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);
    
    /**
     * @dev Initializes the proxy with the initial implementation and admin address
     * @param initialImplementation Address of the initial implementation contract
     * @param initialAdmin Address of the initial admin
     */
    constructor(address initialImplementation, address initialAdmin) {
        require(initialImplementation != address(0), "WowzaRushProxy: implementation cannot be zero address");
        require(initialAdmin != address(0), "WowzaRushProxy: admin cannot be zero address");
        
        _setImplementation(initialImplementation);
        _setAdmin(initialAdmin);
    }
    
    /**
     * @dev Modifier to ensure only the admin can call certain functions
     */
    modifier onlyAdmin() {
        require(msg.sender == _getAdmin(), "WowzaRushProxy: caller is not the admin");
        _;
    }
    
    /**
     * @dev Updates the implementation address
     * @param newImplementation Address of the new implementation contract
     */
    function upgradeTo(address newImplementation) external onlyAdmin {
        require(newImplementation != address(0), "WowzaRushProxy: implementation cannot be zero address");
        require(newImplementation != _getImplementation(), "WowzaRushProxy: cannot upgrade to the same implementation");
        
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }
    
    /**
     * @dev Changes the admin address
     * @param newAdmin Address of the new admin
     */
    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "WowzaRushProxy: admin cannot be zero address");
        
        address previousAdmin = _getAdmin();
        _setAdmin(newAdmin);
        emit AdminChanged(previousAdmin, newAdmin);
    }
    
    /**
     * @dev Returns the current implementation address
     * @return Current implementation address
     */
    function implementation() external view returns (address) {
        return _getImplementation();
    }
    
    /**
     * @dev Returns the current admin address
     * @return Current admin address
     */
    function admin() external view returns (address) {
        return _getAdmin();
    }
    
    /**
     * @dev Fallback function that delegates calls to the implementation contract
     */
    fallback() external payable {
        _delegate(_getImplementation());
    }
    
    /**
     * @dev Receive function to accept ETH payments
     */
    receive() external payable {
        _delegate(_getImplementation());
    }
    
    /**
     * @dev Delegates the current call to the implementation contract
     * @param implementation Address of the implementation contract
     */
    function _delegate(address implementation) internal {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code.
            calldatacopy(0, 0, calldatasize())
            
            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)
            
            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())
            
            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
    
    /**
     * @dev Sets the implementation address in a specific storage slot
     * @param newImplementation Address of the new implementation contract
     */
    function _setImplementation(address newImplementation) private {
        bytes32 slot = IMPLEMENTATION_SLOT;
        
        assembly {
            sstore(slot, newImplementation)
        }
    }
    
    /**
     * @dev Gets the implementation address from a specific storage slot
     * @return implementation Address of the current implementation contract
     */
    function _getImplementation() private view returns (address implementation) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        
        assembly {
            implementation := sload(slot)
        }
    }
    
    /**
     * @dev Sets the admin address in a specific storage slot
     * @param newAdmin Address of the new admin
     */
    function _setAdmin(address newAdmin) private {
        bytes32 slot = ADMIN_SLOT;
        
        assembly {
            sstore(slot, newAdmin)
        }
    }
    
    /**
     * @dev Gets the admin address from a specific storage slot
     * @return admin Address of the current admin
     */
    function _getAdmin() private view returns (address admin) {
        bytes32 slot = ADMIN_SLOT;
        
        assembly {
            admin := sload(slot)
        }
    }
} 