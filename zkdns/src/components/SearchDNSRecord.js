// src/components/SearchDNSRecord.js
import React, { useState } from 'react';
import axios from 'axios';

function SearchDNSRecord({ contract }) {
  const [searchDomainName, setSearchDomainName] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txnMsg, setTxnMsg] = useState("");
  const [attested_data, setAttestedData] = useState();
  const [attested_txn, setAttestedTxn] = useState();

  const searchDNSRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTxnMsg("Searching Transaction");
    try {
      // let result = await contract.getDNS(searchDomainName);
      const result = await contract.getEncryptedDNS(searchDomainName);
      console.log(result);
      const addr_resolver = localStorage.getItem(parseInt(result[0]));
      const contact = localStorage.getItem(parseInt(result[3]));
      const data = {
        "_addr_resolver": addr_resolver,
        "record_type": result[1],
        "expiry": result[2],
        "contact": contact,
        "tokenuri": result[4],
        "owner": parseInt(result[5].toString())
      }
      console.log(data);
      setSearchResult(data);
      setTxnMsg("Checking if current query is attestated from ZkDNS");
      const attested_data = await axios.get("http://localhost:4000/queryAttestation");
      console.log(attested_data.data);
      const attesteddata = attested_data.data.attestations.map((att) => <li>{att.fullSchemaId}</li>);
      const attestedtxn = attested_data.data.attestations.map((att) => <li>{att.transactionHash}</li>);
      const attestedsbtdata = attested_data.data.attestations.map((att) => <li>{att.attestTimestamp}</li>);
      setAttestedTxn(attestedtxn);
      setAttestedData(attesteddata);
    } catch (error) {
      console.error('Error searching DNS Record:', error);
      setSearchResult(null);
      
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-indigo-400">Search DNS Record</h2>
      <form onSubmit={searchDNSRecord} className="flex space-x-4 mb-6">
        <input
          type="text"
          placeholder="Domain Name"
          value={searchDomainName}
          onChange={(e) => setSearchDomainName(e.target.value)}
          className="flex-grow p-3 bg-gray-800 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
          Search
        </button>
      </form>
      {loading && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300 whitespace-pre-wrap">{txnMsg}</p>
        </div>
      )}
      {searchResult && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="font-bold mb-4 text-xl text-indigo-400">Search Result:</h3>
          {['_addr_resolver', 'record_type', 'expiry', 'contact', 'tokenuri', 'owner'].map((field) => (
            <p key={field} className="mb-2">
              <span className="font-medium text-gray-400">{field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}:</span>{' '}
              <span className="text-gray-300">{searchResult[field]}</span>
            </p>
          ))}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <p className="mb-2 text-gray-300">Attestations:</p>{attested_data}<br></br>
            <p className="mb-2 text-gray-300">Txn Hash:</p>{attested_txn}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchDNSRecord;