// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
 
import "@openzeppelin/contracts@4.7.0/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.7.0/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts@4.7.0/access/Ownable.sol";
import "@openzeppelin/contracts@4.7.0/utils/Counters.sol"; 
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
 
contract ZkDNS is ERC721, ERC721URIStorage, Ownable, AutomationCompatibleInterface {
    struct DNSDetails {
        string _addr_resolver;
        string record_type;
        string expiry;
        string contact;
        string tokenuri;
        address owner;
    }

    uint256 public immutable interval = 30;
    uint256 public lastTimeStamp = block.timestamp;
    uint256 counter = 0;
    bytes public upkeepData;


    string[] public DNSRecordNames;
    mapping(string => DNSDetails) public DNSMapping;

    event Mint(address _to, string uri);
    event DNSMap(string domain_name, DNSDetails dns_record);

    event UpkeepCheck(uint256 _timestamp);
    event PerformUpkeep(uint256 _timestamp, uint256 _counter);

    using Counters for Counters.Counter;
 
    Counters.Counter private _tokenIdCounter;
 
    constructor() ERC721("ZkDNS", "ZDNS") {}

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
        emit UpkeepCheck(1);
        return (upkeepNeeded, _checkMint(performData));
    }

    function performUpkeep(bytes calldata performData) external override {
        if ((block.timestamp - lastTimeStamp) > interval) {
            lastTimeStamp = block.timestamp;
            counter = counter + 1;
            emit PerformUpkeep(lastTimeStamp, counter);
        }
        _performMint(performData);
        
    }

    function _checkMint(bytes memory performData) public pure returns(bytes memory){
        return performData;
    }

    function _performMint(bytes calldata performData) public {
        upkeepData = performData;
    }
 
    function safeMint(address to, string memory uri, string memory domain_name, string memory address_resolver,
    string memory dns_recorder_type, string memory expiry, string memory contact
    ) public {
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
 