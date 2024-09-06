import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { Search, AlertCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react';

const SSVMetrics = () => {
  const [accountData, setAccountData] = useState([]);
  const [clusterDepositData, setClusterDepositData] = useState([]);
  const [validatorData, setValidatorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numAccounts, setNumAccounts] = useState(3);
  const [numClusters, setNumClusters] = useState(3);
  const [numValidators, setNumValidators] = useState(3);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch account data
      const accountResponse = await axios.post('https://api.studio.thegraph.com/proxy/71118/ssv-network-holesky/version/latest', {
        query: `query {
          accounts(orderBy: id, first: ${numAccounts}) {
            clusters {
              balance
              validatorCount
            }
          }
        }`
      });
      setAccountData(accountResponse.data.data.accounts);

      // Fetch cluster deposit data
      const clusterResponse = await axios.post('https://api.studio.thegraph.com/proxy/71118/ssv-network-holesky/version/latest', {
        query: `query {
          clusterDepositeds(first: ${numClusters}, orderBy: id) {
            cluster_balance
            cluster_networkFeeIndex
            value
          }
        }`
      });
      setClusterDepositData(clusterResponse.data.data.clusterDepositeds);

      // Fetch validator data
      const validatorResponse = await axios.post('https://api.studio.thegraph.com/proxy/71118/ssv-network-holesky/version/latest', {
        query: `query {
          validators(first: ${numValidators}, orderBy: id) {
            operators {
              validatorCount
              previousFee
              active
            }
          }
        }`
      });
      setValidatorData(validatorResponse.data.data.validators);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [numAccounts, numClusters, numValidators]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const accountChartData = accountData.map((account) => ({
    name: `Account ${account.clusters[0]?.validatorCount || 0}`,
    balance: parseFloat(account.clusters[0]?.balance) / 1e18,
    validatorCount: account.clusters[0]?.validatorCount || 0,
  }));

  const clusterChartData = clusterDepositData.map((cluster) => ({
    name: `Cluster ${cluster.cluster_balance.slice(0, 6)}`,
    balance: parseFloat(cluster.cluster_balance) / 1e18,
    networkFeeIndex: parseFloat(cluster.cluster_networkFeeIndex),
    deposit: parseFloat(cluster.value) / 1e18,
  }));

  const validatorChartData = validatorData.flatMap((validator, index) =>
    validator.operators.map((operator, operatorIndex) => ({
      name: `Validator ${index + 1}-${operatorIndex + 1}`,
      validatorCount: operator.validatorCount,
      previousFee: parseFloat(operator.previousFee) / 1e9,
      active: operator.active,
    }))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        SSV Network Metrics Dashboard
      </h1>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <input
          type="number"
          value={numAccounts}
          onChange={(e) => setNumAccounts(e.target.value)}
          placeholder="Number of accounts"
          className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="number"
          value={numClusters}
          onChange={(e) => setNumClusters(e.target.value)}
          placeholder="Number of clusters"
          className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="number"
          value={numValidators}
          onChange={(e) => setNumValidators(e.target.value)}
          placeholder="Number of validators"
          className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Search className="inline-block mr-2" size={18} />
          Fetch Data
        </button>
      </form>

      {loading && (
        <div className="flex justify-center items-center">
          <motion.div
            className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, ease: 'easeInOut', loop: Infinity }}
          />
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center">
          <div className="bg-red-500 p-4 rounded-md flex items-center space-x-2">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Account Balances</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accountChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Bar dataKey="balance" fill="#8B5CF6" name="Balance (ETH)" />
                  <Bar dataKey="validatorCount" fill="#10B981" name="Validator Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Cluster Deposits</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clusterChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#8B5CF6" strokeWidth={2} name="Balance (ETH)" />
                  <Line type="monotone" dataKey="networkFeeIndex" stroke="#10B981" strokeWidth={2} name="Network Fee Index" />
                  <Line type="monotone" dataKey="deposit" stroke="#FCD34D" strokeWidth={2} name="Deposit (ETH)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-800 rounded-lg shadow-lg p-6 border border-indigo-500 col-span-1 lg:col-span-2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Validator Status</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={validatorChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Legend />
                  <Bar dataKey="validatorCount" fill="#8B5CF6" name="Validator Count" />
                  <Bar dataKey="previousFee" fill="#10B981" name="Previous Fee (Gwei)" />
                  <Bar dataKey="active" fill={({ active }) => (active ? '#FCD34D' : '#EF4444')} name="Active" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SSVMetrics;