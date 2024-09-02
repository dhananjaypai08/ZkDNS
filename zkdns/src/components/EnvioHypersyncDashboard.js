import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const EnvioMetrics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState('Fhenix');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8002/getEnvioblockdata?network=${network}`);
      setData(response.data[0]); // Assuming the block data is in the first array
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

  const chartData = data ? data.map((block) => ({
    blockNumber: block['Block Number'],
    timestamp: parseInt(block['Block Timstamp'], 16),
  })) : [];

  const aggregatedData = aggregateData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        Envio Metrics Dashboard
      </h1>
      
      <div className="mb-8 flex justify-center items-center space-x-4">
        <select 
          value={network} 
          onChange={(e) => setNetwork(e.target.value)}
          className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="Fhenix">Fhenix</option>
          <option value="Galadriel">Galadriel</option>
          <option value="Chillz">Chillz</option>
        </select>
        <button 
          onClick={fetchData}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Refresh Data
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      {error && <p className="text-red-500 text-center text-xl">{error}</p>}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Aggregated Metrics</h2>
            <div className="space-y-2">
              <p><span className="font-medium text-purple-400">Total Blocks:</span> {aggregatedData.blockCount}</p>
              <p><span className="font-medium text-purple-400">Average Timestamp:</span> {aggregatedData.avgTimestamp}</p>
              <p><span className="font-medium text-purple-400">Block Range:</span> {aggregatedData.blockRange}</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Block Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="blockNumber" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Bar dataKey="timestamp" fill="#8B5CF6" name="Block Timestamp" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500 col-span-1 lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Block Timestamp Trend</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="blockNumber" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="timestamp" stroke="#10B981" strokeWidth={2} name="Block Timestamp" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !data && (
        <p className="text-center text-xl text-yellow-400">No data available. Please try refreshing or selecting a different network.</p>
      )}
    </div>
  );
};

export default EnvioMetrics;