import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TopicMessages = ({ topicId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        console.log("The topic id from local storage");
        const newtopic = localStorage.getItem("topicId");
        console.log(newtopic);
        const response = await axios.get(`https://testnet.mirrornode.hedera.com/api/v1/topics/${newtopic}/messages`);
        const data = response.data.messages;
        for(let i=0 ; i<data.length; i++){
          console.log(data[i]);
          data[i].message = data[i].message.slice(0,25);
        }
        console.log(data);
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [topicId]);

  const decodeMessage = (base64) => {
    try {
      return atob(base64);
    } catch {
      return 'Unable to decode message';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-indigo-400 mb-4">Topic Messages</h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : messages.length === 0 ? (
        <p className="text-gray-400">No messages found for this topic.</p>
      ) : (
        messages.map((msg, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
            <div className="text-sm text-gray-400 mb-2">
              Timestamp: {new Date(parseFloat(msg.consensus_timestamp) * 1000).toLocaleString()}
            </div>
            <div className="text-gray-200">
              Message: {msg.message}
            </div>
            <div className="text-gray-200">
              TopicId: {msg.topic_id}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TopicMessages;