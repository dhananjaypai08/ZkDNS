// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { DNSDetails } from "./types/ZkDNSType.sol";
import { TransferFailed } from "./errors/ZkDNSErrors.sol";

contract ZkDNS is ERC721, ERC721URIStorage, Ownable {
    string[] public DNSRecordNames;
    mapping(string => DNSDetails) public DNSMapping;

    event Mint(address _to, string uri);
    event DNSMap(string domain_name, DNSDetails dns_record);
 
    uint256 private _tokenIdCounter;
 
    constructor() ERC721("ZkDNS", "ZDNS") Ownable(msg.sender) {}
 
    function safeMint(address to, string memory uri, string memory domain_name, string memory address_resolver,
    string memory dns_recorder_type, string memory expiry, string memory contact
    ) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit Mint(to, uri);

        DNSDetails memory newDNSRecord = DNSDetails(address_resolver, dns_recorder_type, expiry, contact, uri, to);
        DNSMapping[domain_name] = newDNSRecord;
        emit DNSMap(domain_name, newDNSRecord);
    }
 
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // OpenZeppelin v5 uses _update instead of transfer hooks; block all non-mint updates
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address from)
    {
        from = super._update(to, tokenId, auth);
        if (from != address(0)) {
            revert TransferFailed(from);
        }
        return from;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
 