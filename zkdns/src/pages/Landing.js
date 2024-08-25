import React from 'react';

function Landing() {
    return (
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-indigo-400">Welcome to ZKDNS</h2>
          <p className="mb-6 text-lg text-gray-300">
            ZKDNS is a revolutionary decentralized DNS system that leverages zero-knowledge proofs to enhance privacy and security in domain name resolution.
          </p>
          <h3 className="text-2xl font-semibold mb-4 text-indigo-300">Key Features:</h3>
          <ul className="list-disc list-inside mb-6 text-gray-300 space-y-2">
            <li>Decentralized DNS management</li>
            <li>Enhanced privacy with zero-knowledge proofs</li>
            <li>Secure and transparent record updates</li>
            <li>Immutable and tamper-proof DNS records</li>
          </ul>
          <p className="mb-6 text-lg text-gray-300">
            Explore the power of blockchain and zero-knowledge technology in revolutionizing the way we handle domain names and DNS records.
          </p>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h4 className="text-xl font-semibold mb-3 text-indigo-400">Get Started</h4>
            <p className="text-gray-300">Connect your wallet and start managing your DNS records with unparalleled security and privacy.</p>
          </div>
        </div>
      );
}

export default Landing;