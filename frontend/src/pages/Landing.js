import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Globe, Lock, Database } from 'lucide-react';

function Landing() {
  const features = [
    { icon: Lock, text: "Secure and transparent DNS Lookups record updates" },
    { icon: Globe, text: "Decentralized DNS management" },
    { icon: Shield, text: "Enhanced privacy with zero-knowledge proofs" },
    { icon: Database, text: "Query DNS servers with an additional layer of security" },
  ];

  return (
    <motion.div 
      className="max-w-4xl mx-auto text-gray-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2 
        className="text-4xl font-bold mb-6 text-indigo-400"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
      >
        Welcome to ZKDNS
      </motion.h2>
      <motion.p 
        className="mb-8 text-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        ZKDNS is a revolutionary decentralized DNS system that leverages zero-knowledge proofs to enhance privacy and security in domain name resolution.
      </motion.p>

      <motion.h3 
        className="text-2xl font-semibold mb-6 text-emerald-400"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Key Features:
      </motion.h3>
      <motion.ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {features.map((feature, index) => (
          <motion.li 
            key={index}
            className="flex items-center space-x-3 bg-gray-800 p-4 rounded-lg shadow-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <feature.icon className="text-indigo-400 h-6 w-6" />
            <span>{feature.text}</span>
          </motion.li>
        ))}
      </motion.ul>

      <motion.p 
        className="mb-8 text-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        Explore the power of blockchain and zero-knowledge technology in revolutionizing the way we handle domain names and DNS records.
      </motion.p>

      <motion.div 
        className="bg-gray-800 p-6 rounded-lg shadow-lg border border-indigo-500"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.02 }}
      >
        <h4 className="text-xl font-semibold mb-3 text-emerald-400">Get Started</h4>
        <p>DNS Lookups in a privacy preserving compute environment</p>
        {/* <motion.button 
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Connect Wallet
        </motion.button> */}
      </motion.div>
    </motion.div>
  );
}

export default Landing;