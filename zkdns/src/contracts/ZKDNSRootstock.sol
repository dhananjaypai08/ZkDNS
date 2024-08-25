// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
 
import "@openzeppelin/contracts@4.7.0/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.7.0/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts@4.7.0/access/Ownable.sol";
import "@openzeppelin/contracts@4.7.0/utils/Counters.sol"; 
 
contract ZkDNS is ERC721, ERC721URIStorage, Ownable {
    struct DNSDetails {
        string _addr_resolver;
        string record_type;
        string expiry;
        string contact;
        string tokenuri;
        address owner;
    }

    string[] public DNSRecordNames;
    mapping(string => DNSDetails) public DNSMapping;

    event Mint(address _to, string uri);
    event DNSMap(string domain_name, DNSDetails dns_record);

    using Counters for Counters.Counter;
 
    Counters.Counter private _tokenIdCounter;
 
    constructor() ERC721("ZkDNS", "ZDNS") {}
 
    function safeMint(address to, string memory uri, string memory domain_name, string memory address_resolver,
    string memory dns_recorder_type, string memory expiry, string memory contact
    ) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit Mint(to, uri);

        DNSDetails memory newDNSRecord = DNSDetails(address_resolver, dns_recorder_type, expiry, contact, uri, to);
        DNSMapping[domain_name] = newDNSRecord;
        emit DNSMap(domain_name, newDNSRecord);
    }
 
    // The following functions are overrides required by Solidity.
 
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
        require(from == address(0), "Err: token transfer is BLOCKED");   
        super._beforeTokenTransfer(from, to, tokenId);  
    }
}
 