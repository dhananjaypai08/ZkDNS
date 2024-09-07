import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Sidebar from '../components/Sidebar';
import Landing from './Landing';
import AddDNSRecord from '../components/AddDNSRecord';
import SearchDNSRecord from '../components/SearchDNSRecord';
import TopicMessages from '../components/TopicMessages';
import SSVMetrics from '../components/SSVMetrics';
import EnvioMetrics from '../components/EnvioHypersyncDashboard';
import abiFhenix from "../contracts/ZKDNSFhenix.json";
import abiHedera from "../contracts/ZKDNS.json";
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { useWeb3ModalProvider, useWeb3ModalAccount, useDisconnect, useWeb3Modal } from '@web3modal/ethers/react';
import ChatAI from '../components/ChatAI';
import chatABI from "../contracts/ChatAI.json";

// Web3Modal configuration
const projectId = 'a7a2557c75d9558a9c932d5f99559799';

const testnet1 = {
  chainId: 296,
  name: 'Hedera Testnetwork',
  currency: 'HBAR',
  rpcUrl: 'https://testnet.hashio.io/api'
};

const testnet2 = {
  chainId: 696969,
  name: 'Galadriel Devnet',
  currency: 'GAL',
  rpcUrl: 'https://devnet.galadriel.com'
}

const testnet = {
  chainId: 8008135,
  name: 'Fhenix Helium',
  currency: 'tFHE',
  explorerUrl: 'https://testnet.bscscan.com',
  rpcUrl: 'https://api.helium.fhenix.zone'
}

const testnet3 = {
  chainId: 88882,
  name: 'Chiliz Spicy Testnet',
  currency: 'CHZ',
  explorerUrl: 'https://testnet.chiliscan.com/',
  rpcUrl: 'https://spicy-rpc.chiliz.com/'
}

const testnet4 = {
  chainId: 2810,
  name: 'Morph Holesky Testnet',
  currency: 'ETH',
  explorerUrl: 'https://explorer-holesky.morphl2.io/',
  rpcUrl: 'https://rpc-quicknode-holesky.morphl2.io'
}

const metadata = {
  name: 'ZkDNS',
  description: 'Private and secure DNS/ENS Lookups',
  url: 'https://ZkDNS.com',
  icons: ['https://example.com/icon.png']
};

const ethersConfig = defaultConfig({
  metadata,
  defaultChainId: 8008135,
  auth: {
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook', 'farcaster'],
    showWallets: true,
    walletFeatures: true
  }
});

createWeb3Modal({
  ethersConfig,
  chains: [testnet, testnet1, testnet2, testnet3, testnet4],
  projectId,
  enableAnalytics: true,
  themeMode: 'dark'
});

function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState();
  const [contractWithSigner, setContractWithSigner] = useState();
  const [contractData, setContractData] = useState();

  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  const desiredChainId = 8008135;

  const defaultAttestationHash = "0xb25574b3c2a659e97e784b7d506a6672443374add8a51d6328ec008a4a5f259f";
  const defaultAttestationId = "0x13d";
  const defaultTopicId = "0.0.4808707";
  const defaultSchemaId = "onchain_evm_11155111_0x76";

  useEffect(() => {
    localStorage.setItem("topicId", defaultTopicId);
    localStorage.setItem("attestationId", defaultAttestationId);
    localStorage.setItem("attestationHash", defaultAttestationHash);
    localStorage.setItem("schemaId", defaultSchemaId);
  }, [])

  useEffect(() => {
    const setupContract = async () => {
      if (isConnected && walletProvider) {
        setLoading(true);
        try {
          const ethersProvider = new ethers.BrowserProvider(walletProvider);
          const network = await ethersProvider.getNetwork();
          
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
          setContractData(abi)
          console.log(contractWithSigner);
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

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-8">
        <w3m-button /> 
        {isConnected && (
          <p className="mb-8 text-gray-400">Connected Address: <span className="font-mono text-indigo-400">{address}</span></p>
        )}

        {activeTab === 'home' && <Landing />}
        {activeTab === 'add' && <AddDNSRecord contractData={contractData} connectedAddress={address} walletProvider={walletProvider} />}
        {activeTab === 'search' && <SearchDNSRecord contract={contract}/>}
        {activeTab === 'topicmessages' && <TopicMessages topicId="0.0.4790189" />}
        {activeTab === 'ssvmetrics' && <SSVMetrics />}
        {activeTab === 'enviometrics' && <EnvioMetrics />}
        {activeTab === 'chatai' && <ChatAI contractAddress={chatABI.address} contractABI={chatABI.abi} walletProvider={walletProvider} chainId={testnet2.chainId} contractWithSigner={contractWithSigner}/>}

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