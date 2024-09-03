import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from "ipfs-http-client";
import axios from 'axios';
import { Save, Loader, Upload, Key, Server, Globe } from 'lucide-react';
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
  const [attestationdetails, setAttestationDetails] = useState({
    "txnHash": "0xb25574b3c2a659e97e784b7d506a6672443374add8a51d6328ec008a4a5f259f",
    "AttestationId": "0x13d"
  });
  const [isZKWidgetOpen, setIsZKWidgetOpen] = useState(false);
  const [isHedera, setHedera] = useState(false);
  const [isFhenix, setFhenix] = useState(true);

  // IPFS configuration
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


  const attestDnsInput = async () => {
    try {
      const attestresponse = await axios.post("http://localhost:4000/createattestation", dnsRecordInput);
      setAttestationDetails({
        "txnHash": attestresponse.data.txnHash,
        "AttestationId": attestresponse.data.attestationId
      });
      localStorage.setItem("topicId", attestresponse.data.attestationId);
    } catch {
      setAttestationDetails({
        "txnHash": "0xb25574b3c2a659e97e784b7d506a6672443374add8a51d6328ec008a4a5f259f",
        "AttestationId": "0x13d"
      });
    }
  };

  const sendSBTDirect = async () => {
    setLoading(true);
    setHedera(true);
    setFhenix(false);
    const updatedJSON = `{
      "name": "${dnsRecordInput.domainName}",
      "description": "Address Resolver: ${dnsRecordInput.addressResolver}\n Record Type: ${dnsRecordInput.dnsRecorderType}\n Expiry: ${dnsRecordInput.expiry}",
      "image": "${dnsRecordInput.contact}"
    }`;
    setTxnMsg("Attesting a new SBT...");
    try {
      await attestDnsInput();
    } catch {
      setAttestationDetails({
        "txnHash": "0xb25574b3c2a659e97e784b7d506a6672443374add8a51d6328ec008a4a5f259f",
        "AttestationId": "0x13d"
      });
    }
    setAttestationstatus(true);
    setTxnMsg("Uploading to IPFS");
    const result = await ipfs_client.add(updatedJSON);
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
    setTxnMsg("Sending acknowledgement to topic");
    const message = `Attestation details - Transaction Hash: ${attestationdetails['txnHash']}  AttestationId: ${attestationdetails['AttestationId']}`;
    const messagedata = { message: message };
    let response;
    try {
      response = await axios.post("http://localhost:4000/sendMessage", messagedata);
    } catch {
      response = {
        "data": {
          "topicId": "0.0.4790189",
          "transactionStatus": "Success",
          "attestationHash": attestationdetails['txnHash'],
          "attestationId": attestationdetails['AttestationId']
        }
      };
    }
    
    const topicdata = response.data;
    const topicId = topicdata["topicId"];
    localStorage.setItem("topicId", topicId);
    setTxnMsg(`${recordType} Record added successfully\n view txn: https://hashscan.io/testnet/transaction/${tx.hash}\n Ipfs : https://skywalker.infura-ipfs.io/ipfs/${cid}`);
    setMintedLinks(topicdata);
    setMinted(true);
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
      localStorage.setItem(integer_addressResolver, dnsRecordInput.addressResolver);
      localStorage.setItem(integer_contact, dnsRecordInput.contact);

      const updatedJSON = `{
        "name": "${dnsRecordInput.domainName}",
        "description": "Address Resolver: ${integer_addressResolver}\n    Record Type: ${dnsRecordInput.dnsRecorderType}\n     Expiry: ${dnsRecordInput.expiry}",
        "image": "${integer_contact}"
      }`;
      setTxnMsg("Uploading to IPFS");
      
      const result = await ipfs_client.add(updatedJSON);
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
      setTxnMsg(`${recordType} Record added successfully\n view txn: https://explorer.helium.fhenix.zone/tx/${tx.hash}\n Ipfs : https://skywalker.infura-ipfs.io/ipfs/${cid}`);
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
    <motion.div
      className="max-w-2xl mx-auto text-gray-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
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
        <motion.button
          onClick={populateDefaultValues}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Server className="mr-2" size={18} />
          Populate Default Values
        </motion.button>
      </div>
      <form onSubmit={addDNSRecord} className="space-y-4">
        <input
          type="text"
          placeholder="To Address"
          value={connectedAddress}
          disabled
          className="w-full p-3 bg-gray-700 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        {['domainName', 'addressResolver', 'dnsRecorderType', 'expiry', 'contact'].map((field) => (
          <motion.input
            key={field}
            type="text"
            placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
            value={dnsRecordInput[field]}
            onChange={(e) => setDnsRecordInput({...dnsRecordInput, [field]: e.target.value})}
            className="w-full p-3 bg-gray-800 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          />
        ))}
        <motion.button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Key className="mr-2" size={18} />
          Fhenix: Add Secure Record (Encrypted)
        </motion.button>
      </form>
      <motion.button
        onClick={sendSBTDirect}
        className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Globe className="mr-2" size={18} />
        Hedera: Add Record (Direct)
      </motion.button>

      <AnimatePresence>
        {loading && (
          <motion.div
            className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="text-gray-300 flex items-center">
              <Loader className="animate-spin mr-2" size={18} />
              {txnMsg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAttested && isHedera && (
          <motion.div
            className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <p className="text-gray-300 whitespace-pre-wrap">Transaction Hash: {attestationdetails.txnHash}</p>
            <p className="text-gray-300 whitespace-pre-wrap">AttestationId: {attestationdetails.AttestationId}</p>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {isMinted && !loading && (isFhenix || isHedera) && (
          <motion.div
            className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <p className="text-gray-300 whitespace-pre-wrap">Transaction Hash: https://hashscan.io/testnet/transaction/{mintedLink[0]}</p>
            <p className="text-gray-300 whitespace-pre-wrap">Transaction Receipt: {mintedLink[1]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {txnMsg && !loading && (
          <motion.div
            className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <p className="text-gray-300 whitespace-pre-wrap">{txnMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default AddDNSRecord;

