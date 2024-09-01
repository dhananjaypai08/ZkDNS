import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const SSVMetrics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [first, setFirst] = useState(10);
  const [orderBy, setOrderBy] = useState('id');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('https://api.studio.thegraph.com/proxy/71118/ssv-network-holesky/version/latest', {
        query: `
          query {
            validators(first: ${first}, orderBy: ${orderBy}) {
              id
              cluster {
                balance
                id
                lastUpdateTransactionHash
                networkFeeIndex
              }
              lastUpdateBlockNumber
            }
          }
        `
      });
      setData(response.data.data.validators);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const aggregateData = () => {
    const totalBalance = data.reduce((sum, validator) => sum + parseFloat(validator.cluster.balance), 0);
    const avgNetworkFeeIndex = data.reduce((sum, validator) => sum + parseFloat(validator.cluster.networkFeeIndex), 0) / data.length;
    const lastUpdateBlocks = data.map(validator => parseInt(validator.lastUpdateBlockNumber));
    const minBlock = Math.min(...lastUpdateBlocks);
    const maxBlock = Math.max(...lastUpdateBlocks);

    return {
      totalBalance: totalBalance / 1e18,
      avgNetworkFeeIndex,
      minLastUpdateBlock: minBlock,
      maxLastUpdateBlock: maxBlock,
    };
  };

  const chartData = data.map((validator, index) => ({
    name: validator.id.slice(0, 6),
    balance: parseFloat(validator.cluster.balance) / 1e18,
    networkFeeIndex: parseFloat(validator.cluster.networkFeeIndex),
  }));

  const aggregatedData = aggregateData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        SSV Network Metrics Dashboard
      </h1>
      
      <form onSubmit={handleSubmit} className="mb-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <input 
          type="number" 
          value={first} 
          onChange={(e) => setFirst(e.target.value)}
          placeholder="Number of validators"
          className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select 
          value={orderBy} 
          onChange={(e) => setOrderBy(e.target.value)}
          className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="id">Order by ID</option>
          <option value="lastUpdateBlockNumber">Order by Last Update Block</option>
        </select>
        <button 
          type="submit" 
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Fetch Data
        </button>
      </form>

      {loading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      {error && <p className="text-red-500 text-center text-xl">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Aggregated Metrics</h2>
            <div className="space-y-2">
              <p><span className="font-medium text-purple-400">Total Balance:</span> {aggregatedData.totalBalance.toFixed(2)} ETH</p>
              <p><span className="font-medium text-purple-400">Avg Network Fee Index:</span> {aggregatedData.avgNetworkFeeIndex.toFixed(2)}</p>
              <p><span className="font-medium text-purple-400">Min Last Update Block:</span> {aggregatedData.minLastUpdateBlock}</p>
              <p><span className="font-medium text-purple-400">Max Last Update Block:</span> {aggregatedData.maxLastUpdateBlock}</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Validator Balances</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Bar dataKey="balance" fill="#8B5CF6" name="Balance (ETH)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500 col-span-1 lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Network Fee Index</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="networkFeeIndex" stroke="#10B981" strokeWidth={2} name="Network Fee Index" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SSVMetrics;