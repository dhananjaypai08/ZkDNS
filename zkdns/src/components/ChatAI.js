import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader, MessageCircle, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import HTMLContentRenderer from '../helpers/HTMLContentRenderer';
import { AlertTriangle } from 'lucide-react';

const ChatAI = ({ contractAddress, contractABI, walletProvider, chainId }) => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [txnMsg, setTxnMsg] = useState('');
  const [signer, setSigner] = useState();
  
  const formatMessage = (content) => {
    // Convert ** to <strong> tags
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert newlines to <br> tags
    content = content.replace(/\n/g, '<br>');

    // Convert numbered lists
    content = content.replace(/(\d+\.\s.*?)(?=\n\d+\.|\n\n|$)/gs, '<ol><li>$1</li></ol>');
    content = content.replace(/<\/li>\n<li>/g, '</li><li>');

    return content;
  };

  useEffect(() => {
    const initializeContract = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const chatContract = new ethers.Contract(contractAddress, contractABI, provider);
          setContract(chatContract);
          setSigner(signer);
        } catch (error) {
          console.error('Failed to initialize contract:', error);
        }
      } else {
        console.log('Please install MetaMask!');
      }
    };

    initializeContract();
  }, [contractAddress, contractABI]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !contract) return;

    setLoading(true);
    setTxnMsg('Sending message to AI...');

    try {
      const connectedcontract = await contract.connect(signer);
      const tx = await connectedcontract.sendMessage(message);
      setTxnMsg('Waiting for transaction confirmation...');
      await tx.wait();
      setTxnMsg('Transaction confirmed. Waiting for AI response...');

      // Poll for response
      const pollInterval = setInterval(async () => {
        const aiResponse = await contract.response();
        if (aiResponse && aiResponse !== '') {
          clearInterval(pollInterval);
          const formatted_response = formatMessage(aiResponse);
          setResponse(formatted_response);
          setLoading(false);
          setTxnMsg('');
        }
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
      setTxnMsg('Error: ' + error.message);
    }
  };

  const clearChat = () => {
    setMessage('');
    setResponse('');
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto text-gray-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{  opacity: 1, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md shadow-md"
      role="alert"
    >
      <div className="flex items-center">
        <AlertTriangle className="h-6 w-6 text-yellow-500 mr-4" />
        <div>
          <p className="font-bold">Check Network</p>
          <p>Make sure your walletConnect wallet is connected to Galadriel Devnet on {chainId} chainId</p>
        </div>
      </div>
    </motion.div>
      <h2 className="text-3xl font-bold mb-6 text-indigo-400">Chat with AI</h2>
      
      <form onSubmit={sendMessage} className="mb-6">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow p-3 bg-gray-800 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <motion.button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            <Send className="inline-block mr-2" size={18} />
            Send
          </motion.button>
        </div>
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
        {response && (
          <motion.div 
            className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3 className="font-bold mb-4 text-xl text-indigo-400">AI Response:</h3>
            <HTMLContentRenderer content={response} />
          </motion.div>
        )}
      </AnimatePresence>

      {response && (
        <motion.div 
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={clearChat}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="mr-2" size={18} />
            Clear Chat
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatAI;