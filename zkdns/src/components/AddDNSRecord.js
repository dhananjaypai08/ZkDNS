import React, { useState } from 'react';
import { create } from "ipfs-http-client";

function AddDNSRecord({ contractWithSigner, connectedAddress }) {
  const [recordType, setRecordType] = useState('DNS');
  const [dnsRecordInput, setDnsRecordInput] = useState({
    domainName: '',
    addressResolver: '',
    dnsRecorderType: '',
    expiry: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [txnMsg, setTxnMsg] = useState('');

  const projectId = '2WCbZ8YpmuPxUtM6PzbFOfY5k4B';
  const projectSecretKey = 'c8b676d8bfe769b19d88d8c77a9bd1e2';
  const authorization = "Basic " + btoa(projectId + ":" + projectSecretKey);
  const ipfs_client = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    apiPath: "/api/v0",
    headers: {
      authorization: authorization
    },
  });

  const defaultValues = {
    DNS: {
      domainName: 'google.com',
      addressResolver: '172.217.167.78',
      dnsRecorderType: 'A',
      expiry: '2025-12-31',
      contact: 'admin@google.com'
    },
    ENS: {
      domainName: 'vitalik.eth',
      addressResolver: '0x714f39f40c0d7470803fd1bfd8349747f045a7fe',
      dnsRecorderType: 'ETH',
      expiry: '2030-01-01',
      contact: 'vitalik@ethereum.org'
    }
  };

  const populateDefaultValues = () => {
    setDnsRecordInput(defaultValues[recordType]);
  };

  const addDNSRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedJSON = `{
        "name": "${dnsRecordInput.domainName}",
        "description": "Address Resolver: ${dnsRecordInput.addressResolver}\n Record Type: ${dnsRecordInput.dnsRecorderType}\n Expiry: ${dnsRecordInput.expiry}",
        "image": "${dnsRecordInput.contact}"
      }`;
      setTxnMsg("Uploading to IPFS");
      const result = await ipfs_client.add(updatedJSON);
      console.log(result.cid.toString());
      const cid = result.cid.toString();
      setTxnMsg("Uploading on-chain");
      const tx = await contractWithSigner.safeMint(
        connectedAddress,
        cid,
        dnsRecordInput.domainName,
        dnsRecordInput.addressResolver,
        dnsRecordInput.dnsRecorderType,
        dnsRecordInput.expiry,
        dnsRecordInput.contact
      );
      await tx.wait();
      console.log('Record added successfully');
      setTxnMsg(`${recordType} Record added successfully\n view txn: ${tx.hash}\n Ipfs : https://skywalker.infura-ipfs.io/ipfs/${cid}`);
      // Clear input fields after successful addition
      setDnsRecordInput({
        domainName: '',
        addressResolver: '',
        dnsRecorderType: '',
        expiry: '',
        contact: ''
      });
    } catch (error) {
      console.error('Error adding Record:', error);
      setTxnMsg(`Error adding ${recordType} Record. Please try again.`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-indigo-400">Add {recordType} Record</h2>
      <div className="mb-6 flex items-center space-x-4">
        <select
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
          className="p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="DNS">DNS</option>
          <option value="ENS">ENS</option>
        </select>
        <button
          onClick={populateDefaultValues}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          Populate Default Values
        </button>
      </div>
      <form onSubmit={addDNSRecord} className="space-y-4">
        <input
          type="text"
          placeholder="To Address"
          value={connectedAddress}
          disabled
          className="w-full p-3 bg-gray-700 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {['domainName', 'addressResolver', 'dnsRecorderType', 'expiry', 'contact'].map((field) => (
          <input
            key={field}
            type="text"
            placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
            value={dnsRecordInput[field]}
            onChange={(e) => setDnsRecordInput({...dnsRecordInput, [field]: e.target.value})}
            className="w-full p-3 bg-gray-800 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ))}
        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
          Add Record
        </button>
      </form>
      {loading && (
        <div className="mt-6 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-400">{txnMsg}</p>
        </div>
      )}
      {txnMsg && !loading && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300 whitespace-pre-wrap">{txnMsg}</p>
        </div>
      )}
    </div>
  );
}

export default AddDNSRecord;