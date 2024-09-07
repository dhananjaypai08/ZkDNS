import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, XCircle, Loader, Globe, Key } from 'lucide-react';
import ZKProofWidget from './ZKProofWidget';

function SearchDNSRecord({ contract }) {
  const [searchDomainName, setSearchDomainName] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txnMsg, setTxnMsg] = useState("");
  const [attested_data, setAttestedData] = useState("Available On the Fhenix Encrypted Global States");
  const [attested_txn, setAttestedTxn] = useState("Sent via Fhenix Encrypted Global States");
  const [isZKWidgetOpen, setIsZKWidgetOpen] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState("Verify ZkProof");
  const [fwdDNSButton, setfwdDNSButton] = useState(false);
  const [final_ip, setFinalIP] = useState("Please verify and then click on DNS Resolver");

  useEffect(() => {
    localStorage.clear("zkproof");
  }, []);

  useEffect(() => {
    const handleStorageChange = async() => {
      const val = localStorage.getItem("zkproof");
      if(val && searchResult){
        await searchDNSRecordDecrypted();
        setVerificationMsg("Verified!");
        setfwdDNSButton(true);
      }
    };

    handleStorageChange();
  }, [isZKWidgetOpen]);

  const searchDNSRecordDecrypted = async () => {
    setLoading(true);
    setTxnMsg("Decrypting DNS Record...");
    try {
      let result = await contract.getDNS(searchDomainName);
      let addr_resolver = localStorage.getItem(parseInt(result[0])) || "0x714f39f40c0d7470803fd1bfd8349747f045a7fe";
      let contact = localStorage.getItem(parseInt(result[3])) || "dhananjay2002pai@gmail.com";
      
      const data = {
        "_addr_resolver": addr_resolver,
        "record_type": result[1],
        "expiry": result[2],
        "contact": contact,
        "tokenuri": result[4],
        "owner": parseInt(result[5].toString())
      };
      setSearchResult(data);
      setTxnMsg("Checking if current query is attested from ZkDNS");
      
      let attested_data = await fetchAttestationData();
      updateAttestationDisplay(attested_data);
    } catch (error) {
      console.error('Error searching DNS Record:', error);
      setSearchResult(null);
    }
    setLoading(false);
  };

  const forwardToDNS = async() => {
    setLoading(true);
    setTxnMsg("Forwarding to DNS Resolver...");
    try {
      const response = await axios.get(`http://localhost:8002/forwardToResolver?domain=${searchDomainName}&address_resolver=${searchResult._addr_resolver}`);
      setFinalIP(response.data);
    } catch (error) {
      console.error('Error forwarding to DNS:', error);
      setFinalIP("Error resolving DNS");
    }
    setLoading(false);
  };

  const searchDNSRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTxnMsg("Searching Transaction");
    try {
      if(verificationMsg !== "Verified!") {
        const result = await contract.getEncryptedDNS(searchDomainName);
        const data = {
          "_addr_resolver": "Unable to showcase address",
          "record_type": result[1],
          "expiry": result[2],
          "contact": "Please Verify Proof",
          "tokenuri": result[4],
          "owner": parseInt(result[5].toString())
        };
        setSearchResult(data);
      } else {
        await searchDNSRecordDecrypted();
      }
      
      setTxnMsg("Checking if current query is attested from ZkDNS");
      let attested_data = await fetchAttestationData();
      updateAttestationDisplay(attested_data);
    } catch (error) {
      console.error('Error searching DNS Record:', error);
      setSearchResult(null);
    }
    setLoading(false);
  };

  const fetchAttestationData = async () => {
    try {
      return await axios.get("http://localhost:4000/queryAttestation");
    } catch {
      return {"data": {"attestations": [{"fullSchemaId": "test", "transactionHash": "TestHash"}]}};
    }
  };

  const updateAttestationDisplay = (attested_data) => {
    const attesteddata = attested_data.data.attestations.map((att, index) => (
      <li key={index} className="text-emerald-400">{att.fullSchemaId}</li>
    ));
    const attestedtxn = attested_data.data.attestations.map((att, index) => (
      <li key={index} className="text-indigo-400">{att.transactionHash}</li>
    ));
    setAttestedTxn(attestedtxn);
    setAttestedData(attesteddata);
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto text-gray-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-6 text-indigo-400">Search DNS Record</h2>
      <form onSubmit={searchDNSRecord} className="flex space-x-4 mb-6">
        <input
          type="text"
          placeholder="Domain Name"
          value={searchDomainName}
          onChange={(e) => setSearchDomainName(e.target.value)}
          className="flex-grow p-3 bg-gray-800 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        <motion.button 
          type="submit" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Search className="inline-block mr-2" size={18} />
          Search
        </motion.button>
      </form>

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
        {searchResult && (
          <motion.div 
            className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3 className="font-bold mb-4 text-xl text-indigo-400">Search Result:</h3>
            {['_addr_resolver', 'record_type', 'expiry', 'contact', 'tokenuri', 'owner'].map((field) => (
              <p key={field} className="mb-2 flex items-center">
                <span className="font-medium text-gray-400 mr-2">{field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}:</span>
                <span className="text-emerald-400">{searchResult[field]}</span>
              </p>
            ))}
            <motion.div 
              className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="mb-2 text-indigo-400">Attestations:</p>
              <ul>{attested_data}</ul>
              <p className="mb-2 mt-4 text-indigo-400">Txn Hash:</p>
              <ul>{attested_txn}</ul>
            </motion.div>
            <motion.div 
              className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="mb-2 text-indigo-400">Source IP of {searchDomainName}:</p>
              <p className="text-emerald-400">{final_ip}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {searchResult && (
        <motion.div 
          className="mt-6 p-4 rounded-lg border border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={() => setIsZKWidgetOpen(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Key className="mr-2" size={18} />
            {verificationMsg}
          </motion.button>
          <ZKProofWidget isOpen={isZKWidgetOpen} onClose={() => setIsZKWidgetOpen(false)} />
        </motion.div>
      )}

      {fwdDNSButton && (
        <motion.div 
          className="mt-6 p-4 rounded-lg border border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={forwardToDNS}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Globe className="mr-2" size={18} />
            Query address resolver DNS Server
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default SearchDNSRecord;