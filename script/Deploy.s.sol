// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/OrderBookDEX.sol";

contract DeployScript is Script {
    function run() external {
        // Use the private key directly from environment
        string memory privateKey = vm.envString("PRIVATE_KEY");
        // Add 0x prefix if not present
        if (bytes(privateKey)[0] != 0x30) { // Check if it doesn't start with '0'
            privateKey = string(abi.encodePacked("0x", privateKey));
        }
        uint256 deployerPrivateKey = vm.parseUint(privateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy OrderBookDEX only (using native MONAD)
        OrderBookDEX dex = new OrderBookDEX();
        console.log("OrderBookDEX deployed at:", address(dex));
        
        vm.stopBroadcast();
        
        // Save deployment addresses
        string memory deploymentInfo = string(abi.encodePacked(
            "OrderBookDEX: ", vm.toString(address(dex)), "\n",
            "Native Token: 0x0000000000000000000000000000000000000000", "\n"
        ));
        
        vm.writeFile("deployment.txt", deploymentInfo);
        console.log("Deployment addresses saved to deployment.txt");
    }
} 