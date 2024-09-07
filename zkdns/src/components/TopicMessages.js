import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader, Database, File, ExternalLink } from 'lucide-react';

const TopicMessages = ({ topicId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schemaData, setSchemaData] = useState(null);
  const [attestationData, setAttestationData] = useState(null);
  const [activeTab, setActiveTab] = useState('messages');
  const [reputation_state, setReputationState] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const newtopic = localStorage.getItem("topicId");
        console.log(newtopic);
        const attestationHash = localStorage.getItem("attestationHash");
        const attestationId = localStorage.getItem("attestationId");
        const schemaId = localStorage.getItem("schemaId");

        const messagesResponse = await axios.get(`https://testnet.mirrornode.hedera.com/api/v1/topics/${newtopic}/messages`);
        const messagesData = messagesResponse.data.messages;
        for (let i = 0; i < messagesData.length; i++) {
          messagesData[i].message = messagesData[i].message.slice(0, 25);
        }
        messagesData[0]["attestationId"] = attestationId;
        messagesData[0]["attestationHash"] = attestationHash;
        setMessages(messagesData);

        const schemaResponse = await axios.get(`http://localhost:4000/querySchema?id=${schemaId}`);
        setSchemaData(schemaResponse.data);

        const attestationResponse = await axios.get(`http://localhost:4000/queryAttestations?id=${schemaId}`);
        setAttestationData(attestationResponse.data);

        let reputationState = await axios.get('http://localhost:5050');
        console.log(reputationState.data);
        setReputationState(reputationState.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topicId]);

  const renderDataSection = (title, data) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg mt-8"
    >
      <h3 className="text-xl font-semibold text-indigo-400 mb-4 flex items-center">
        {title === "Schema Indexing Data" ? <Database className="mr-2" size={20} /> : <File className="mr-2" size={20} />}
        {title}
      </h3>
      {title === "Schema Indexing Data" && (
        <a 
          className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center mb-4" 
          target='_blank' 
          href="https://testnet-scan.sign.global/schema/onchain_evm_11155111_0x76"
          rel="noopener noreferrer"
        >
          Schema Link <ExternalLink className="ml-1" size={16} />
        </a>
      )}
      {data && Object.entries(data).map(([key, value]) => (
        <motion.div 
          key={key} 
          className="mb-3 bg-gray-900 p-3 rounded-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-gray-400 font-medium">{key}: </span>
          <pre className="text-gray-200 mt-1 overflow-x-auto">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          </pre>
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <motion.div 
      className="max-w-4xl mx-auto text-gray-300 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-6 text-indigo-400">
        Sign protocol's Attestation using schema & Hedera's Consensus Service for publishing topic
      </h2>

      <div className="flex space-x-4 mb-6">
        {['messages', 'schema', 'attestation', 'stackrReputation'].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md transition duration-200 ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            className="flex justify-center items-center h-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader className="animate-spin text-indigo-500" size={32} />
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'messages' && (
              messages.length === 0 ? (
                <p className="text-gray-400">No messages found for this topic.</p>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <motion.div 
                      key={index} 
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center mb-2 text-indigo-400">
                        <MessageSquare className="mr-2" size={18} />
                        <span className="text-sm">
                          {new Date(parseFloat(msg.consensus_timestamp) * 1000).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-200">Message: {msg.message}</div>
                      <div className="text-gray-200">AttestationId: {msg.attestationId}</div>
                      <div className="text-gray-200">Attestation Txn Hash: {msg.attestationHash}</div>
                      <div className="text-gray-200">TopicId: {msg.topic_id}</div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
            {activeTab === 'schema' && renderDataSection("Schema Indexing Data", schemaData)}
            {activeTab === 'attestation' && renderDataSection("Attestation Indexing Data", attestationData)}
            {activeTab === 'stackrReputation' && renderDataSection("Domain user Reputation via Stackr MRU", reputation_state)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TopicMessages;