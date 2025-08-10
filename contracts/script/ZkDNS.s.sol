// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import { ZkDNS } from "../src/ZKDNS.sol";

contract DeployZkDNS is Script {
    ZkDNS zkDNS;

    function run() external {
        vm.startBroadcast();
        console.log("Deploying zkDNS...");
    zkDNS = new ZkDNS();
        vm.stopBroadcast();
    }
}