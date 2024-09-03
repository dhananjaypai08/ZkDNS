import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, X, Shield, CheckCircle } from 'lucide-react';

const ZKProofWidget = ({ isOpen, onClose }) => {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((oldProgress) => {
          const newProgress = oldProgress + 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const verifyProof = async () => {
    setLoading(true);
    setMessages([]);
    setProgress(0);

    const steps = [
      { action: () => axios.get(`http://localhost:8000/generate_witness?contact=${contact}`), message: 'Generating witness...' },
      { action: () => axios.get('http://localhost:8000/export_zkey'), message: 'Exporting zkey...' },
      { action: () => axios.get('http://localhost:8000/generate_proof'), message: 'Generating proof...' },
      { action: () => axios.get(`http://localhost:8000/verify_proof?contact=${contact}`), message: 'Verifying proof...' },
    ];

    for (const [index, step] of steps.entries()) {
      try {
        setMessages(prev => [...prev, { text: step.message, status: 'loading' }]);
        const res = await step.action();
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[index] = { text: res.data.message, status: 'success' };
          return newMessages;
        });
        setProgress((index + 1) * 25);

        if (index === steps.length - 1 && res.data.message === "Proof verified!") {
          localStorage.setItem("zkproof", true);
          setTimeout(() => onClose(true), 2000);
        }
      } catch (error) {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[index] = { text: 'Error occurred', status: 'error' };
          return newMessages;
        });
        console.error('Error:', error);
        break;
      }
    }

    setLoading(false);
    setContact("");
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 w-96 max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-indigo-400">ZK Proof Generator</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            <X size={24} />
          </motion.button>
        </div>

        <input
          type="text"
          placeholder="Contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          className="w-full p-3 mb-4 bg-gray-700 text-gray-300 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={verifyProof}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 mb-4 flex items-center justify-center"
        >
          {loading ? <Loader className="animate-spin mr-2" size={18} /> : <Shield className="mr-2" size={18} />}
          {loading ? 'Verifying Proof...' : 'Verify'}
        </motion.button>

        {loading && (
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
            <motion.div
              className="bg-indigo-600 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-2 p-3 rounded-md flex items-center ${
                message.status === 'success' ? 'bg-green-800 text-green-200' :
                message.status === 'error' ? 'bg-red-800 text-red-200' :
                'bg-gray-700 text-gray-300'
              }`}
            >
              {message.status === 'success' && <CheckCircle className="mr-2" size={18} />}
              {message.status === 'error' && <X className="mr-2" size={18} />}
              {message.status === 'loading' && <Loader className="animate-spin mr-2" size={18} />}
              {message.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ZKProofWidget;