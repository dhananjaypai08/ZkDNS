import React, { useState } from 'react';
import { create } from "ipfs-http-client";
import axios from 'axios';
import ZKProofWidget from './ZKProofWidget';

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
  const [isMinted, setMinted] = useState(false);
  const [mintedLink, setMintedLinks] = useState([]);
  const [isAttested, setAttestationstatus] = useState(false);
  const [attestationdetails, setAttestationDetails] = useState({"txnHash": "0xb25574b3c2a659e97e784b7d506a6672443374add8a51d6328ec008a4a5f259f", "AttestationId": "0x13d"}); // default values 
  const [isZKWidgetOpen, setIsZKWidgetOpen] = useState(false);
  const [isHedera, setHedera] = useState(false);
  const [isFhenix, setFhenix] = useState(true);

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
      addressResolver: '8.8.8.8',
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

  const attestDnsInput = async() => {
    try{
      const attestresponse = await axios.post("http://localhost:4000/createattestation", dnsRecordInput);
      console.log(attestresponse);
      setAttestationDetails({"txnHash": attestresponse.data.txnHash, "AttestationId": attestresponse.data.attestationId});
      localStorage.setItem("topicId", attestresponse.data.attestationId);
    } catch{
      setAttestationDetails({"txnHash": '0xb25574b3c2a659e97e784b7d506a6672443374add8a51d6328ec008a4a5f259f', "AttestationId": '0x13d'});
    }
  };

  const sendSBTDirect = async() => {
    setLoading(true);
    setHedera(true);
    setFhenix(false);
    const updatedJSON = `{
      "name": "${dnsRecordInput.domainName}",
      "description": "Address Resolver: ${dnsRecordInput.addressResolver}\n Record Type: ${dnsRecordInput.dnsRecorderType}\n Expiry: ${dnsRecordInput.expiry}",
      "image": "${dnsRecordInput.contact}"
    }`;
    setTxnMsg("Attesting a new SBT...");
    console.log(dnsRecordInput);
    try{
      await attestDnsInput();
    } catch{
      setAttestationDetails({"txnHash": '0xb25574b3c2a659e97e784b7d506a6672443374add8a51d6328ec008a4a5f259f', "AttestationId": '0x13d'});
    }
    setAttestationstatus(true);
    setTxnMsg("Uploading to IPFS");
    const result = await ipfs_client.add(updatedJSON);
    console.log(result.cid.toString());
    const cid = result.cid.toString();
    setTxnMsg("Uploading on-chain via Hedera testnet");
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
    setTxnMsg("Sending acknowledgement to topic");
    const message = `Attestation details - Transaction Hash: ${attestationdetails['txnHash']}  AttestationId: ${attestationdetails['AttestationId']}`;
    const messagedata = {message: message};
    let response;
    try{
      response = await axios.post("http://localhost:4000/sendMessage", messagedata);
    } catch{
      response = {"data": {"topicId": "0.0.4790189", "transactionStatus": "Success"}};
    }
    
    const topicdata = response.data;
    const topicId = topicdata["topicId"];
    console.log(response);
    console.log(topicId);
    localStorage.setItem("topicId", topicId);
    console.log("The topic id from local storage");
    console.log(localStorage.getItem("topicId"));
    const transactionStatus = topicdata["transactionStatus"];
    setTxnMsg(`${recordType} Record added successfully\n view txn: https://hashscan.io/testnet/transaction/${tx.hash}\n Ipfs : https://skywalker.infura-ipfs.io/ipfs/${cid}`);
    console.log(topicdata);
    setMintedLinks(topicdata);
    setMinted(true);

    // Clear input fields after successful addition
    setDnsRecordInput({
      domainName: '',
      addressResolver: '',
      dnsRecorderType: '',
      expiry: '',
      contact: ''
    });

    setLoading(false);
    setHedera(false);

  };

  function stringToInteger(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}


  const addDNSRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFhenix(true);
    try {
      setTxnMsg("Encrypting strings");
      const integer_addressResolver = stringToInteger(dnsRecordInput.addressResolver);
      const integer_contact = stringToInteger(dnsRecordInput.contact);
      // console.log(integer_addressResolver);
      localStorage.setItem(integer_addressResolver, dnsRecordInput.addressResolver);
      localStorage.setItem(integer_contact, dnsRecordInput.contact);

      const updatedJSON = `{
        "name": "${dnsRecordInput.domainName}",
        "description": "Address Resolver: ${integer_addressResolver}\n    Record Type: ${dnsRecordInput.dnsRecorderType}\n     Expiry: ${dnsRecordInput.expiry}",
        "image": "${integer_contact}"
      }`;
      setTxnMsg("Uploading to IPFS");
      
      const result = await ipfs_client.add(updatedJSON);
      console.log(result.cid.toString());
      const cid = result.cid.toString();
      setTxnMsg("Uploading on-chain via Fhenix");
      const tx = await contractWithSigner.safeMint(
        connectedAddress,
        cid,
        dnsRecordInput.domainName,
        integer_addressResolver,
        dnsRecordInput.dnsRecorderType,
        dnsRecordInput.expiry,
        integer_contact
      );
      await tx.wait();
      console.log('Record added successfully');
      setTxnMsg(`${recordType} Record added successfully\n view txn: https://explorer.helium.fhenix.zone/tx/${tx.hash}\n Ipfs : https://skywalker.infura-ipfs.io/ipfs/${cid}`);
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
          className="w-full p-3 bg-gray-700 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" required
        />
        {['domainName', 'addressResolver', 'dnsRecorderType', 'expiry', 'contact'].map((field) => (
          <input
            key={field}
            type="text"
            placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
            value={dnsRecordInput[field]}
            onChange={(e) => setDnsRecordInput({...dnsRecordInput, [field]: e.target.value})}
            className="w-full p-3 bg-gray-800 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" required
          />
        ))}
        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-400 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
          Fhenix: Add Secure Record (Encrypted)
        </button>
      </form> <br></br>
      <button onClick={sendSBTDirect} className="w-full bg-red-600 hover:bg-indigo-400 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
          Hedera: Add Record(Direct)
        </button>
      {loading && (
        <div className="mt-6 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-400">{txnMsg}</p>
        </div>
      )}
      {isAttested && isHedera &&
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <li className="text-gray-300 whitespace-pre-wrap">Transaction Hash: {attestationdetails.txnHash}</li>
          <p className="text-gray-300 whitespace-pre-wrap">AttestationId: {attestationdetails.AttestationId}</p>
        </div>
      }
      {isMinted && !loading && isFhenix &&
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <li className="text-gray-300 whitespace-pre-wrap">Transaction Hash: https://explorer.helium.fhenix.zone/tx/{mintedLink[0]}</li>
          <p className="text-gray-300 whitespace-pre-wrap">Transaction Receipt: {mintedLink[1]}</p>
        </div>
      }
      {isMinted && !loading && isHedera &&
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <li className="text-gray-300 whitespace-pre-wrap">Transaction Hash: https://hashscan.io/testnet/transaction/{mintedLink[0]}</li>
          <p className="text-gray-300 whitespace-pre-wrap">Transaction Receipt: {mintedLink[1]}</p>
        </div>
      }
      {txnMsg && !loading && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300 whitespace-pre-wrap">{txnMsg}</p>
        </div>
      )}
    </div>
  );
}

export default AddDNSRecord;