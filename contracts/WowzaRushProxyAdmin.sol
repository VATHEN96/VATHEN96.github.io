// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WowzaRushProxyAdmin
 * @dev Admin contract for controlling proxy upgrades
 * Separating the admin functions into this contract provides better security
 * by avoiding direct interaction with the proxy from the implementation owner
 */
contract WowzaRushProxyAdmin is Ownable {
    /**
     * @dev Emitted when the implementation of a proxy is upgraded
     */
    event Upgraded(address indexed proxy, address indexed implementation);
    
    /**
     * @dev Emitted when the admin of a proxy is changed
     */
    event AdminChanged(address indexed proxy, address indexed newAdmin);
    
    /**
     * @dev Constructor that sets the owner of the contract
     * @param initialOwner Address that will own the admin contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Upgrades a proxy to a new implementation
     * @param proxy Address of the proxy to upgrade
     * @param implementation Address of the new implementation
     */
    function upgrade(address proxy, address implementation) external onlyOwner {
        require(proxy != address(0), "Proxy cannot be zero address");
        require(implementation != address(0), "Implementation cannot be zero address");
        require(implementation.code.length > 0, "Implementation must be a contract");
        
        // Call the upgrade function on the proxy
        // This uses the proxy's storage slot for the implementation address
        (bool success, ) = proxy.call(
            abi.encodeWithSignature("upgradeTo(address)", implementation)
        );
        require(success, "Upgrade failed");
        
        emit Upgraded(proxy, implementation);
    }
    
    /**
     * @dev Changes the admin of a proxy
     * @param proxy Address of the proxy
     * @param newAdmin Address of the new admin
     */
    function changeProxyAdmin(address proxy, address newAdmin) external onlyOwner {
        require(proxy != address(0), "Proxy cannot be zero address");
        require(newAdmin != address(0), "New admin cannot be zero address");
        
        // Call the change admin function on the proxy
        (bool success, ) = proxy.call(
            abi.encodeWithSignature("changeAdmin(address)", newAdmin)
        );
        require(success, "Admin change failed");
        
        emit AdminChanged(proxy, newAdmin);
    }
    
    /**
     * @dev Gets the current implementation address of a proxy
     * @param proxy Address of the proxy
     * @return The implementation address
     */
    function getProxyImplementation(address proxy) external view returns (address) {
        require(proxy != address(0), "Proxy cannot be zero address");
        
        // Call the implementation function on the proxy
        (bool success, bytes memory data) = proxy.staticcall(
            abi.encodeWithSignature("implementation()")
        );
        require(success, "Failed to get implementation");
        
        return abi.decode(data, (address));
    }
    
    /**
     * @dev Gets the current admin of a proxy
     * @param proxy Address of the proxy
     * @return The admin address
     */
    function getProxyAdmin(address proxy) external view returns (address) {
        require(proxy != address(0), "Proxy cannot be zero address");
        
        // Call the admin function on the proxy
        (bool success, bytes memory data) = proxy.staticcall(
            abi.encodeWithSignature("admin()")
        );
        require(success, "Failed to get admin");
        
        return abi.decode(data, (address));
    }
} 