// src/components/Sidebar.js
import React from 'react';

function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', name: 'Home' },
    { id: 'add', name: 'Add DNS Record' },
    { id: 'search', name: 'Search DNS Record' },
    { id: 'topicmessages', name: 'Hedera Mirror node"s minting Messages' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8 text-indigo-400">ZKDNS</h1>
      <nav>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`block w-full text-left py-2 px-4 rounded-md mb-2 transition duration-200 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;