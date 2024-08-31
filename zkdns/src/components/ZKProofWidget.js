import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ZKProofWidget = ({ isOpen, onClose }) => {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const verifyProof = async (e) => {
    setLoading(true);
    setMessage('Generating proof...');
    try {
      console.log('testing', contact);
      let res = await axios.get(`http://localhost:8000/generate_witness?contact=${contact}`);
      console.log(res);
      console.log(res.data);
      setMessage(res.data["message"]);
      res = await axios.get('http://localhost:8000/export_zkey');
      setMessage(res.data["message"]);
      res = await axios.get('http://localhost:8000/generate_proof');
      setMessage(res.data["message"]);
      res = await axios.get('http://localhost:8000/verify_proof');
      setMessage(`${res.data["message"]}`);
      setContact("");
      if(res.data["message"] == "Proof verified!"){
        localStorage.setItem("zkproof", true);
        setMessage("");
        onClose(true);
      }
    } catch (error) {
      setMessage('Error generating or verifying proof');
      console.error('Error:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 w-96">
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">ZK Proof Generator</h2>
        <input
          type="text"
          placeholder="Contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)} required
          className="w-full p-3 mb-3 bg-gray-700 text-gray-300 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={verifyProof}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 mb-3"
        >
          {loading ? 'Verifying Proof...' : 'Verify'}
        </button>
        
        {message && (
          <div className="mt-3 p-3 bg-gray-700 rounded-md text-gray-300">
            {message}
          </div>
    
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ZKProofWidget;