import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, Layers, Activity, DollarSign, RefreshCw } from 'lucide-react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

const networks = {
  "Chillz": ["https://chiliz.hypersync.xyz", 8888],
  "Fhenix": ["https://fhenix-testnet.hypersync.xyz", 42069],
  "Galadriel": ["https://galadrial-devnet.hypersync.xyz", 696969],
  "Morph": ["https://morph-testnet.hypersync.xyz", 2810]
};

// Sample data for ERC20 transfers
const sampleERC20Data = [
  { token: "USDT", value: 1000000 },
  { token: "USDC", value: 750000 },
  { token: "DAI", value: 500000 },
  { token: "WETH", value: 250000 },
  { token: "LINK", value: 100000 },
];

// Sample data for Wei transfers
const sampleWeiData = [
  { category: "DeFi", value: 450000 },
  { category: "NFT", value: 200000 },
  { category: "Gaming", value: 150000 },
  { category: "Social", value: 100000 },
  { category: "Other", value: 100000 },
];

const EnvioMetrics = () => {
  const [data, setData] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState('Fhenix');
  const names = {
    0: "Others",
    1: "Fhenix",
    2: "Morph",
    3: "Chillz",
    4: "Galadriel"
  }

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const blockResponse = await axios.get(`http://localhost:8002/getEnvioblockdata?network=${network}`);
      const contractResponse = await axios.get(`http://localhost:8002/getEnvioContractdata?network=${network}`);
      setData(blockResponse.data[0]);
      setContractData(contractResponse.data);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [network]);

  const aggregateData = () => {
    if (!data || data.length === 0) return {};
    
    const blockCount = data.length;
    const avgTimestamp = data.reduce((sum, block) => sum + parseInt(block['Block Timstamp'], 16), 0) / blockCount;
    const blockRange = `${data[0]['Block Number']} - ${data[blockCount - 1]['Block Number']}`;

    return {
      blockCount,
      avgTimestamp: new Date(avgTimestamp * 1000).toLocaleString(),
      blockRange,
    };
  };

  const aggregatedData = aggregateData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-gray-100 p-8">
      <motion.h1 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
      >
        Envio Metrics Dashboard
      </motion.h1>
      
      <div className="mb-8 flex justify-center items-center space-x-4">
        <select 
          value={network} 
          onChange={(e) => setNetwork(e.target.value)}
          className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:bg-gray-700"
        >
          {Object.keys(networks).map((net) => (
            <option key={net} value={net}>{net}</option>
          ))}
        </select>
        <motion.button 
          onClick={fetchData}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
        >
          <RefreshCw className="mr-2" size={18} />
          Refresh Data
        </motion.button>
      </div>

      {loading && (
        <div className="flex justify-center items-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-t-2 border-b-2 border-indigo-500 rounded-full"
          />
        </div>
      )}
      {error && <p className="text-red-500 text-center text-xl">{error}</p>}

      {!loading && !error && data && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400 flex items-center">
              <Layers className="mr-2" /> Aggregated Metrics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-purple-400">Total Blocks:</span>
                <motion.span 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-2xl font-bold"
                >
                  {aggregatedData.blockCount}
                </motion.span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-purple-400">Avg Timestamp:</span>
                <motion.span 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-sm"
                >
                  {aggregatedData.avgTimestamp}
                </motion.span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-purple-400">Block Range:</span>
                <motion.span 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-sm"
                >
                  {aggregatedData.blockRange}
                </motion.span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400 flex items-center">
              <DollarSign className="mr-2" /> ERC20 Transfer Volume
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleERC20Data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="token" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Transfer Volume" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              This chart shows the transfer volume of different ERC20 tokens on the network. 
              Higher bars indicate more activity for that particular token.
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500 lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400 flex items-center">
              <ArrowUpRight className="mr-2" /> Wei Transfer Distribution by Category
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sampleWeiData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${names[name]} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sampleWeiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              This pie chart illustrates the distribution of Wei transfers across different categories on the network. 
              Each slice represents a category's proportion of total transfer volume, helping identify dominant use cases.
            </p>
          </div>
        </motion.div>
      )}

      {!loading && !error && !data && (
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center text-xl text-yellow-400"
        >
          No data available. Please try refreshing or selecting a different network.
        </motion.p>
      )}
    </div>
  );
};

export default EnvioMetrics;