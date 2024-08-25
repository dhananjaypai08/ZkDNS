// src/components/ZKProof.js
import React, { useState } from 'react';

function ZKProof() {
  const [zkProof, setZkProof] = useState('');
  const [zkVerificationResult, setZkVerificationResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generateZKProof = async () => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('your-api-endpoint/generate-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Include necessary data for proof generation
        }),
      });
      const data = await response.json();
      setZkProof(data.proof);
    } catch (error) {
      console.error('Error generating ZK proof:', error);
    }
    setLoading(false);
  };

  const verifyZKProof = async () => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('your-api-endpoint/verify-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof: zkProof,
          // Include any other necessary verification data
        }),
      });
      const data = await response.json();
      setZkVerificationResult(data.verified ? 'Proof Verified' : 'Proof Invalid');
    } catch (error) {
      console.error('Error verifying ZK proof:', error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-indigo-400">ZK Proof</h2>
      <button 
        onClick={generateZKProof} 
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md mb-6 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
      >
        Generate Proof
      </button>
      {zkProof && (
        <div className="mb-6">
          <h3 className="font-bold mb-3 text-xl text-indigo-300">Generated Proof:</h3>
          <textarea
            value={zkProof}
            readOnly
            className="w-full p-3 bg-gray-800 text-gray-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows="4"
          />
        </div>
      )}
      <button 
        onClick={verifyZKProof} 
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
      >
        Verify Proof
      </button>
      {zkVerificationResult && (
        <p className="mt-4 font-bold text-xl text-indigo-400">{zkVerificationResult}</p>
      )}
      {loading && (
        <div className="mt-6 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-400">Processing...</p>
        </div>
      )}
    </div>
  );
}

export default ZKProof;