import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Sidebar from '../components/Sidebar';
import Landing from './Landing';
import AddDNSRecord from '../components/AddDNSRecord';
import SearchDNSRecord from '../components/SearchDNSRecord';
import TopicMessages from '../components/TopicMessages';
import abiFhenix from "../contracts/ZKDNSFhenix.json";
import abiHedera from "../contracts/ZKDNS.json";
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { useWeb3ModalProvider, useWeb3ModalAccount, useDisconnect, useWeb3ModalTheme, useWeb3Modal } from '@web3modal/ethers/react';

// Web3Modal configuration
const projectId = 'a7a2557c75d9558a9c932d5f99559799';

const testnet1 = {
  chainId: 296,
  name: 'Hedera Testnetwork',
  currency: 'HBAR',
  // explorerUrl: 'https://testnet.hashscan.io/',
  rpcUrl: 'https://testnet.hashio.io/api'
};

const testnet = {
  chainId: 8008135,
  name: 'Fhenix Helium',
  currency: 'tFHE',
  explorerUrl: 'https://testnet.bscscan.com',
  rpcUrl: 'https://api.helium.fhenix.zone'
}

const metadata = {
  name: 'ZkDNS',
  description: 'Private and secure DNS/ENS Lookups',
  url: 'https://ZkDNS.com',
  icons: ['https://example.com/icon.png']
};

const ethersConfig = defaultConfig({
  metadata,
  defaultChainId: 11155111,
  auth: {
    email: true, // default to true
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook', 'farcaster'],
    showWallets: true, // default to true
    walletFeatures: true // default to true
  }
});

createWeb3Modal({
  ethersConfig,
  chains: [testnet, testnet1],
  projectId,
  enableAnalytics: true,
  themeMode: 'dark'
});

function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState();
  const [contractWithSigner, setContractWithSigner] = useState();

  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  const desiredChainId = 8008135;

  useEffect(() => {
    const setupContract = async () => {
      if (isConnected && walletProvider) {
        setLoading(true);
        try {
          const ethersProvider = new ethers.BrowserProvider(walletProvider);
          const network = await ethersProvider.getNetwork();
          
          // if (network.chainId !== BigInt(desiredChainId)) {
          //   // You may want to prompt the user to switch networks here
          //   console.log("Please switch to the correct network");
          //   setLoading(false);
          //   return;
          // }
          let abi;
          console.log(network.chainId, parseInt(network.chainId) === 296);
          if(parseInt(network.chainId) == 296){
            abi = abiHedera;
          } else{
            abi = abiFhenix;
          }

          const signer = await ethersProvider.getSigner();
          const contract = new ethers.Contract(abi.address, abi.abi, ethersProvider);
          const contractWithSigner = contract.connect(signer);

          setContract(contract);
          setContractWithSigner(contractWithSigner);

          let owner = await contract.owner();
          console.log("Contract owner:", owner);
        } catch (error) {
          console.error("Error setting up contract:", error);
        }
        setLoading(false);
      }
    };

    setupContract();
  }, [isConnected, walletProvider]);

  // const handleConnectWallet = async () => {
  //   if (isConnected) {
  //     await disconnect();
  //   } else {
  //     await open();
  //   }
  // };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-8">
      <w3m-button /> 
      {/* <button
          onClick={disconnect}
          className="mb-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-2 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        >
          {isConnected ? "Disconnect" : "Connect Wallet"}
        </button> */}

        {isConnected && (
          <p className="mb-8 text-gray-400">Connected Address: <span className="font-mono text-indigo-400">{address}</span></p>
        )}

        {activeTab === 'home' && <Landing />}
        {activeTab === 'add' && <AddDNSRecord contractWithSigner={contractWithSigner} connectedAddress={address} />}
        {activeTab === 'search' && <SearchDNSRecord contract={contract} />}
        {activeTab === 'topicmessages' && <TopicMessages topicId="0.0.4790189" />}

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