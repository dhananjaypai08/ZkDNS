// src/components/SearchDNSRecord.js
import React, { useState } from 'react';

function SearchDNSRecord({ contract }) {
  const [searchDomainName, setSearchDomainName] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchDNSRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result = await contract.getDNS(searchDomainName);
      const data = {
        "_addr_resolver": result[0],
        "record_type": result[1],
        "expiry": result[2],
        "contact": result[3],
        "tokenuri": result[4],
        "owner": result[5]
      }
    //   const result = await contract.getEncryptedDNS(searchDomainName);
    //   console.log(result1[5].toBigNumber(), typeof(result1[5]));
      setSearchResult(data);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-400">Searching...</p>
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
        </div>
      )}
    </div>
  );
}

export default SearchDNSRecord;