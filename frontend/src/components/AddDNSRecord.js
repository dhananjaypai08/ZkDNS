import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from "ipfs-http-client";
import { BrowserProvider, Contract } from "ethers";
import axios from 'axios';
import { Save, Loader, Upload, Key, Server, Globe, ExternalLinkIcon, AlarmPlusIcon } from 'lucide-react';
import { useDisconnect, useWeb3Modal } from '@web3modal/ethers/react';
import { Keyring } from "@polkadot/api";
import { SDK } from "avail-js-sdk";
import { WaitFor } from "avail-js-sdk/sdk/transactions";
import { BN } from "@polkadot/util";

function AddDNSRecord({ contractData, connectedAddress, walletProvider, contractWithSigner }) {
  const [recordType, setRecordType] = useState('DNS');
  const [dnsRecordInput, setDnsRecordInput] = useState({
    domainName: '',
    addressResolver: '',
    dnsRecorderType: '',
    expiry: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const [txnMsg, setTxnMsg] = useState('');
  const [isMinted, setMinted] = useState(false);
  const [mintedLink, setMintedLinks] = useState([]);
  const [isAttested, setAttestationstatus] = useState(false);
  const [attestationdetails, setAttestationDetails] = useState();
  const [isZKWidgetOpen, setIsZKWidgetOpen] = useState(false);
  const [isHedera, setHedera] = useState(false);
  const [isFhenix, setFhenix] = useState(true);
  const [avail_data, setAvailData] = useState();
  const [avail_data_hash, setAvailDataHash] = useState(); 
  const [avail_block_hash, setAvailBlockHash] = useState();
  const [avail_source, setAvailSource] = useState(); 
  const [avail_txn_hash, setAvailTxnHash] = useState();
  const [avail_stake_msg, setStakedMessage] = useState();
  const [staked_status, stakedStatus] = useState(false);
  const [transaction_hash, setTransactionHash] = useState();
  const [basinHash, setBasinHash] = useState();

  const [total_mints, setTotalMints] = useState(1); // can only mint one SBT at a time
  const [quality_mints, setQualityMints] = useState(1);
  const [userId, setUserId] = useState(1);
  const [rollupMsg, setrollupMsg] = useState("");

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

  const createReputationRollup = async(id) => {
    const repdata = {id: userId, total_mints: total_mints, quality_mints: quality_mints};
    console.log(repdata);
    if(userId == id){
      const rep = await axios.post("http://localhost:5050/createRepScore", repdata);
      console.log(rep);
      setrollupMsg(rep.data);
    } else{
      const rep = await axios.post("http://localhost:5050/updateRepScore", repdata);
      console.log(rep);
      setrollupMsg(rep.data);
    }
    
  }

  const getAvailAccount = async() =>{
    const providerEndpoint = "wss://turing-rpc.avail.so/ws";
    const sdk = await SDK.New(providerEndpoint);
    const KEY = process.env.REACT_APP_MNEMONIC_KEY;
    const account = new Keyring({ type: "sr25519" }).addFromUri(KEY);
    return {account: account, sdk: sdk};
  }

  const stakeAvail = async() => {
    setStakedMessage("Staking Avail please wait...");
    const {account, sdk} = await getAvailAccount();
    const value = new BN(100).mul(new BN(10).pow(new BN("18")));
    const payee = "Staked";
    const result = await sdk.tx.staking.bond(value, payee, WaitFor.BlockInclusion, account);
    if (result.isErr) {
      console.log(result.reason);
      setStakedMessage(result.reason);
    }

    console.log("TxHash=" + result.txHash + ", BlockHash=" + result.blockHash);
    setStakedMessage("Staked Avail: TxnHash="+result.txHash);
    stakedStatus(true);
  }

  const unbondAvail = async() => {
    setStakedMessage("Adding staked avail back to your account. Please wait...");
    const {account, sdk} = await getAvailAccount();
    const value = new BN(100).mul(new BN(10).pow(new BN("18")));
    const result = await sdk.tx.staking.unbond(value, WaitFor.BlockInclusion, account)
    if (result.isErr) {
      console.log(result.reason);
      setStakedMessage(result.reason);
    }
  
    console.log("TxHash=" + result.txHash + ", BlockHash=" + result.blockHash);
    setStakedMessage("Staked Avail: TxnHash="+result.txHash);
    stakedStatus(false);
  }

  const connectAndSendDataToAvail = async(data) => {
    const providerEndpoint = "wss://turing-rpc.avail.so/ws";
    const sdk = await SDK.New(providerEndpoint);
    console.log(sdk);
    const KEY = process.env.MNEMONIC_KEY;
    const account = new Keyring({ type: "sr25519" }).addFromUri(KEY);
    const result = await sdk.tx.dataAvailability.submitData(data, WaitFor.BlockInclusion, account);
    if (result.isErr) {
      console.log(result.reason);
    } else{
      console.log("Data=" + result.txData.data);
      console.log("Who=" + result.event.who + ", DataHash=" + result.event.dataHash);
      console.log("TxHash=" + result.txHash + ", BlockHash=" + result.blockHash);
      setAvailData(result.txData.data);
      setAvailSource(result.event.who);
      setAvailBlockHash(`https://explorer.avail.so/#/explorer/query/${result.blockHash}`);
      setAvailTxnHash(result.txHash);
      setAvailDataHash(result.event.dataHash);
    }
  }


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
        "txnHash": "Error something went wrong",
        "AttestationId": "Attestation not found"
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
    setTxnMsg("Adding data to Basin Object store");
    const result = await axios.post("http://localhost:8000/adddatatobasin");
    const cid = result.data;
    setTxnMsg("Uploading on-chain via Hedera testnet");
    const newprovider = new BrowserProvider(walletProvider);
    const contract = new Contract(contractData.address, contractData.abi, newprovider);
    const newsigner = await newprovider.getSigner();
    const newcontractWithSigner = contract.connect(newsigner);
    console.log(dnsRecordInput.addressResolver, dnsRecordInput.expiry);
    const tx = await newcontractWithSigner.safeMint(
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
          "topicId": "Can't be found",
          "transactionStatus": "Failure",
          "attestationHash": 0,
          "attestationId": 0
        }
      };
    }
    
    const topicdata = response.data;
    const topicId = topicdata["topicId"];
    setMintedLinks(topicdata);
    localStorage.setItem("topicId", topicId);
    setTxnMsg("Sending data to AVAIL DA");
    await connectAndSendDataToAvail(topicId);
    setTxnMsg(`Adding data to rollup using stackr with Avail DA layer`);
    setTotalMints(1);
    setQualityMints(1); // Domain minting is a one-time one minting process
    await createReputationRollup(userId);
    
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
    // Convert a given string to a unique integer and map on client side for decryption and encrypt 
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
      setTxnMsg("Adding Data to Basin Object store");
      const result = await axios.post("http://localhost:8000/adddatatobasin");
      const cid = result.data;
      setTxnMsg("Sending data to AVAIL DA");
      await connectAndSendDataToAvail(cid);
      setTxnMsg("Uploading on-chain via Fhenix");
      const newprovider = new BrowserProvider(walletProvider);
      const contract = new Contract(contractData.address, contractData.abi, newprovider);
      const newsigner = await newprovider.getSigner();
      const newcontractWithSigner = contract.connect(newsigner);
      console.log(dnsRecordInput.addressResolver, dnsRecordInput.expiry);
      const tx = await newcontractWithSigner.safeMint(
        connectedAddress,
        cid,
        dnsRecordInput.domainName,
        integer_addressResolver,
        dnsRecordInput.dnsRecorderType,
        dnsRecordInput.expiry,
        integer_contact
      );
      await tx.wait();
      setTransactionHash(`https://explorer.helium.fhenix.zone/tx/${tx.hash}`);
      setBasinHash(`https://skywalker.infura-ipfs.io/ipfs/${cid}`);
      setTxnMsg("Attesting a new SBT...");
      try {
        await attestDnsInput();
      } catch {
        setAttestationDetails({
          "txnHash": "Error",
          "AttestationId": "Attestation not found"
        });
      }
      setTxnMsg("Sending acknowledgement to topic");
      const message = `Attestation details - Transaction Hash: ${attestationdetails['txnHash']}  AttestationId: ${attestationdetails['AttestationId']}`;
      const messagedata = { message: message };
      let response;
      try {
        response = await axios.post("http://localhost:4000/sendMessage", messagedata);
      } catch {
        response = {
          "data": {
            "topicId": "Error",
            "transactionStatus": "Failed",
            "attestationHash": 0,
            "attestationId": 0
          }
        };
      }
      
      const topicdata = response.data;
      const topicId = topicdata["topicId"];
      setMintedLinks(topicdata);
      localStorage.setItem("topicId", topicId);
      setTxnMsg(`Adding data to rollup using stackr with Avail DA layer`);
      setTotalMints(1);
      setQualityMints(1); // Domain minting is a one-time one minting process
      await createReputationRollup(userId);
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
      {!staked_status && !loading && <motion.button
        onClick={stakeAvail}
        className="w-full mt-4 bg-yellow-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Upload className="mr-2" size={18} />
        Stake Avail
      </motion.button>}

      {staked_status && !loading &&
      <motion.button
        onClick={unbondAvail}
        className="w-full mt-4 bg-indigo-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Upload className="mr-2" size={18} />
        Unbond Avail
      </motion.button>}

      <AnimatePresence>
        {avail_stake_msg && !loading && (
          <motion.div
            className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <p className="text-gray-300 whitespace-pre-wrap">Done: Avail txn hash: {avail_stake_msg}</p>
            
          </motion.div>
        )}

      </AnimatePresence>
      <br></br>
      <h2 className="text-3xl font-bold mb-6 text-indigo-400">Add {recordType} Record</h2>
      
      <AnimatePresence>
        {staked_status && !loading && (
          <motion.div
            className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <p className="text-gray-300 whitespace-pre-wrap">{avail_stake_msg}</p>
            
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-6 flex items-center space-x-4">
        <select
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
          className="p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="DNS">DNS</option>
          <option value="ENS">ENS</option>
        </select>
        {/* <motion.button
          onClick={defaultValues}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Server className="mr-2" size={18} />
          Populate Default Values
        </motion.button> */}
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
        Add Records via Others(Hedera Default: Direct)
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
        {rollupMsg && !loading && (
          <motion.div
            className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <p className="text-gray-300 whitespace-pre-wrap">
              acknowledgement Hash from stackr rollup: {rollupMsg.ack.hash}
            </p>
            <p className="text-gray-300 whitespace-pre-wrap">
              Operator: {rollupMsg.ack.operator}
            </p>
            <a 
          className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center mb-4" 
          target='_blank' 
          href= {transaction_hash}
          rel="noopener noreferrer"
        >
          Domain Txn on Base Block Explorer <ExternalLinkIcon className="ml-1" size={16} />
        </a>
        <a 
          className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center mb-4" 
          target='_blank' 
          href= {basinHash}
          rel="noopener noreferrer"
        >
          Basin object data Hash <ExternalLinkIcon className="ml-1" size={16} />
        </a>
        <a 
          className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center mb-4" 
          target='_blank' 
          href= {avail_block_hash}
          rel="noopener noreferrer"
        >
          Txn on AVAIL Block Explorer <ExternalLinkIcon className="ml-1" size={16} />
        </a>
        
            <p className="text-gray-300 whitespace-pre-wrap">Avail Data Hash: {avail_data_hash}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default AddDNSRecord;

