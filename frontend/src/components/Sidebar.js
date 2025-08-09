import React from 'react';
import { motion } from 'framer-motion';
import { Home, Plus, Search, MessageSquare, BarChart2, Activity, MessageSquareText } from 'lucide-react';

function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'add', name: 'Add DNS Record', icon: Plus },
    { id: 'search', name: 'Search and Query DNS Record', icon: Search },
    { id: 'topicmessages', name: 'Mirror nodes  Attestations  Schemas  Reputation', icon: MessageSquare },
    { id: 'ssvmetrics', name: 'SSV Metrics', icon: BarChart2 },
    { id: 'enviometrics', name: 'Aggregated Envio Hyper Sync Metrics', icon: Activity },
    { id: 'chatai', name: 'Chat with our AI knowledge Base', icon: MessageSquareText },
  ];

  return (
    <div className="w-64 bg-gray-900 text-gray-100 p-6 shadow-lg">
      <motion.h1 
        className="text-3xl font-bold mb-8 text-indigo-400"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        ZKDNS
      </motion.h1>
      <nav>
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center w-full text-left py-3 px-4 rounded-lg mb-2 transition duration-200 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <tab.icon className="mr-3 h-5 w-5" />
            {tab.name}
          </motion.button>
        ))}
      </nav>
      {/* <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </motion.div> */}
    </div>
  );
}

export default Sidebar;