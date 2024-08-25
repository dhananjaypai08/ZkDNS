import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Sidebar from '../components/Sidebar';
import Landing from './Landing';
import AddDNSRecord from '../components/AddDNSRecord';
import SearchDNSRecord from '../components/SearchDNSRecord';
import ZKProof from '../components/ZKProof';
import abi from "../contracts/ZKDNS.json";

function Home() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isConnected, setConnected] = useState(false);
  const [contractWithSigner, setContractWithSigner] = useState();
  const [contract, setContract] = useState();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const desiredChainId = 31;

  const connectWallet = async () => {
    setLoading(true);
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        const network = await provider.getNetwork();
        if (network.chainId !== desiredChainId) {
          await switchNetwork();
        }
        
        const signer = await provider.getSigner();
        setSigner(signer);
        
        const contract = new ethers.Contract(abi.address, abi.abi, provider);
        const contractWithSigner = contract.connect(signer);
        
        setConnectedAddress(account);
        setConnected(true);
        setContract(contract);
        setContractWithSigner(contractWithSigner);
        
        let owner = await contract.owner();
        console.log("Contract owner:", owner);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    }
    setLoading(false);
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${desiredChainId.toString(16)}` }],
      });
    } catch (switchError) {
      console.error('Error switching network:', switchError);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-8">
        <button
          onClick={connectWallet}
          className="mb-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        >
          {isConnected ? "Connected" : "Connect Wallet"}
        </button>

        {isConnected && (
          <p className="mb-8 text-gray-400">Connected Address: <span className="font-mono text-indigo-400">{connectedAddress}</span></p>
        )}

        {activeTab === 'home' && <Landing />}
        {activeTab === 'add' && <AddDNSRecord contractWithSigner={contractWithSigner} connectedAddress={connectedAddress} />}
        {activeTab === 'search' && <SearchDNSRecord contract={contract} />}
        {activeTab === 'zkproof' && <ZKProof />}

        {loading && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;