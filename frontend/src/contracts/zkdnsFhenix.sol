// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhenixprotocol/contracts/FHE.sol";
 
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
        eaddress owner;
    }

    string[] public DNSRecordNames;
    mapping(string => DNSDetails) private DNSMapping;
    mapping(address => uint) private creds;

    event Mint(eaddress _to, string uri);
    event DNSMap(string domain_name, DNSDetails dns_record);

    using Counters for Counters.Counter;
 
    Counters.Counter private _tokenIdCounter;
 
    constructor() ERC721("ZkDNS", "ZDNS") {
        creds[0x5B38Da6a701c568545dCfcB03FcB875f56beddC4] = 1;
    }

    function encryptAddress(address _addr) public pure returns(eaddress){
        return FHE.asEaddress(_addr);
    }

    function encryptInteger(inEuint32 calldata num) public pure returns(euint32){
        return FHE.asEuint32(num);
    }

    function decrypt(eaddress _addr) public pure returns (address) {
        return FHE.decrypt(_addr);
    }

    function getDNS(string memory domain_name) external view returns(string memory, string memory,
    string memory, string memory, string memory,
    address){
        DNSDetails memory newDNSRecord = DNSMapping[domain_name];
        address decrypted_owner = decrypt(newDNSRecord.owner);
        return(newDNSRecord._addr_resolver, newDNSRecord.record_type, newDNSRecord.expiry, newDNSRecord.contact, newDNSRecord.tokenuri, decrypted_owner);
    }

    function getEncryptedDNS(string memory domain_name) external view returns(DNSDetails memory){
        return DNSMapping[domain_name];
    }
 
    function safeMint(address to, string memory uri, string memory domain_name, string memory address_resolver,
    string memory dns_recorder_type, string memory expiry, string memory contact
    ) public {
        uint256 tokenId = _tokenIdCounter.current();
        eaddress encrypted_owner = encryptAddress(to);
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit Mint(encrypted_owner, uri);

        DNSDetails memory newDNSRecord = DNSDetails(address_resolver, dns_recorder_type, expiry, contact, uri, encrypted_owner);
        DNSMapping[domain_name] = newDNSRecord;
        emit DNSMap(domain_name, newDNSRecord);
    }

    function getData(address _addr) public pure returns(eaddress){
        return encryptAddress(_addr);
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
 