// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {ZkDNS} from "../src/ZKDNS.sol";
import {TransferFailed} from "../src/errors/ZkDNSErrors.sol";

contract ZkDNSTest is Test {
    ZkDNS private dns;
    address private owner = address(0xABCD);
    address private user = address(0xBEEF);
    address private user2 = address(0xCAFE);

    function setUp() public {
        vm.prank(owner);
        dns = new ZkDNS();
    }

    function testSafeMintAndMapping() public {
        vm.startPrank(owner);
        string memory uri = "ipfs://token-metadata";
        string memory domain = "example.zkdns";
        string memory resolver = "1.2.3.4";
        string memory rtype = "A";
        string memory expiry = "2099-12-31";
        string memory contact = "admin@example.com";
        dns.safeMint(user, uri, domain, resolver, rtype, expiry, contact);
        vm.stopPrank();

        assertEq(dns.ownerOf(0), user);
        assertEq(dns.tokenURI(0), uri);

        (
            string memory _resolver,
            string memory _rtype,
            string memory _expiry,
            string memory _contact,
            string memory _tokenuri,
            address _owner
        ) = dns.DNSMapping(domain);

        assertEq(_resolver, resolver);
        assertEq(_rtype, rtype);
        assertEq(_expiry, expiry);
        assertEq(_contact, contact);
        assertEq(_tokenuri, uri);
        assertEq(_owner, user);
    }

    function testTransferBlocked() public {
        // Mint first
        vm.prank(owner);
        dns.safeMint(user, "uri", "blocked.zkdns", "1.1.1.1", "A", "2099", "me");

        // Attempt transfer should revert with custom error
        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(TransferFailed.selector, user));
        dns.transferFrom(user, user2, 0);
        vm.stopPrank();
    }
}
