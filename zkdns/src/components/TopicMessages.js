import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TopicMessages = ({ topicId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schemaData, setSchemaData] = useState(null);
  const [attestationData, setAttestationData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const newtopic = localStorage.getItem("topicId");
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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topicId]);

  const renderDataSection = (title, data) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md mt-8">
      <h3 className="text-xl font-semibold text-indigo-400 mb-4">{title}</h3>
      {title==="Schema Indexing Data" && <a className="text-indigo-600" target='_blank' href="https://testnet-scan.sign.global/schema/onchain_evm_11155111_0x76">Schema Link: Click Here</a>}
      {data && Object.entries(data).map(([key, value]) => (
        <div key={key} className="mb-2">
          <span className="text-gray-400">{key}: </span>
          <pre className="text-gray-200">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          </pre>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 divide-y-4">
      <h2 className="text-2xl font-bold text-indigo-400 mb-4">Sign protocol's Attestation using schema & Hedera's Consensus Service for publishing topic</h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : messages.length === 0 ? (
        <p className="text-gray-400">No messages found for this topic.</p>
      ) : (
        <>
          {messages.map((msg, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
              <div className="text-sm text-gray-400 mb-2">
                Timestamp: {new Date(parseFloat(msg.consensus_timestamp) * 1000).toLocaleString()}
              </div>
              <div className="text-gray-200">Message: {msg.message}</div>
              <div className="text-gray-200">AttestationId: {msg.attestationId}</div>
              <div className="text-gray-200">Attestation Txn Hash: {msg.attestationHash}</div>
              <div className="text-gray-200">TopicId: {msg.topic_id}</div>
            </div>
          ))}
          {renderDataSection("Schema Indexing Data", schemaData)}
          {renderDataSection("Attestation Indexing Data", attestationData)}
        </>
      )}
    </div>
  );
};

export default TopicMessages;