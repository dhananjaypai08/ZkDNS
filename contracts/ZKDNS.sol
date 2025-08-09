// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { ZkDNSDetails } from "./types/ZkDNSType.sol";
import { TransferFailed } from "./errors/ZkDNSErrors.sol";

contract ZkDNS is ERC721, ERC721URIStorage, Ownable {
    string[] public DNSRecordNames;
    mapping(string => DNSDetails) public DNSMapping;

    event Mint(address _to, string uri);
    event DNSMap(string domain_name, DNSDetails dns_record);
 
    uint256 private _tokenIdCounter;
 
    constructor() ERC721("ZkDNS", "ZDNS") {}
 
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
 
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
 
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _beforeTokenTransfer(
    address from, 
    address to, 
    uint256 tokenId
    ) internal override virtual {
        if(from != address(0)){
            revert TransferFailed(from);
        }
        super._beforeTokenTransfer(from, to, tokenId);  
    }
}
 