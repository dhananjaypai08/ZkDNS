const express = require('express');
const { SignProtocolClient, SpMode, EvmChains, IndexService } = require("@ethsign/sp-sdk");
const { ApiPromise, WsProvider } = require('@polkadot/api');

require('dotenv').config();
const { privateKeyToAccount } = require("viem/accounts");
const axios = require("axios");
const ethers = require("ethers");
const {
  AccountId,
  PrivateKey,
  Client,
  TopicCreateTransaction,
  TopicMessageQuery,
  TopicMessageSubmitTransaction,
} = require("@hashgraph/sdk");

//AVAIL Setup
const wsProvider = new WsProvider('wss://rpc.polkadot.io');

// Grab the OPERATOR_ID and OPERATOR_KEY from the .env file
const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;
const sepoliaPrivatekey = process.env.PRIVATE_KEY;

// Build Hedera testnet and mirror node client
const Hederaclient = Client.forTestnet();
let TopicID = "0.0.4790189"; // Initial default value

// Set the operator account ID and operator private key
Hederaclient.setOperator(myAccountId, myPrivateKey);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const privateKey = process.env.PRIVATE_KEY;
const account = privateKeyToAccount(privateKey);
const sepAccount = privateKeyToAccount(sepoliaPrivatekey);
console.log(account, account.address, sepAccount.address);
const client = new SignProtocolClient(SpMode.OnChain, {
  chain: EvmChains.sepolia,
  account: sepAccount, // Optional, depending on environment
  transport: "https://sepolia.infura.io/v3/2WCbZ8YpmuPxUtM6PzbFOfY5k4B"
});

async function createNotaryAttestation(domain_name, address_resolver, recorder_type, expiry, contact) {
    const res = await client.createAttestation({
      schemaId: "0x76",
      data: {
        domain_name,
        address_resolver, 
        recorder_type, 
        expiry, 
        contact
      },
      indexingValue: recorder_type.toLowerCase()
    });
    return res;
}

async function makeAttestationRequest(endpoint, options) {
    const url = `https://testnet-rpc.sign.global/api/${endpoint}`;
    const res = await axios.request({
      url,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      ...options,
    });
    // Throw API errors
    if (res.status !== 200) {
      throw new Error(JSON.stringify(res));
    }
    // Return original response
    return res.data;
}

async function queryAttestations() {
    const response = await makeAttestationRequest("index/attestations", {
      method: "GET",
      params: {
        mode: "onchain", // Data storage location
        schemaId: "onchain_evm_11155111_0x76", // Your full schema's ID
        attester: "0x8c9c46f67d5061c63829fdF37EAdF51E213BFEcb", // Alice's address
        indexingValue: "A".toLowerCase(), // Bob's address
      },
    });
  
    // Make sure the request was successfully processed.
    if (!response.success) {
      return {
        success: false,
        message: response?.message ?? "Attestation query failed.",
      };
    }
  
    // Return a message if no attestations are found.
    if (response.data?.total === 0) {
      return {
        success: false,
        message: "No attestation for this address found.",
      };
    }
  
    // Return all attestations that match our query.
    return {
      success: true,
      attestations: response.data.rows,
    };
}

app.get('/checkAvail', async(req, res) => {
  // Retrieve user data from your database or data source
  const api = await ApiPromise.create({ provider: wsProvider });
  console.log(api.genesisHash.toHex());
  // The actual address that we will use
  const ADDR = '5G95nun8kzRo8W9iP35EA9xzpFUGbyikHeYVCpHtwp7i8h6e';

  // Retrieve the chain name
  const chain = await api.rpc.system.chain();
  // console.log(chain);
  // Retrieve the latest header
  const lastHeader = await api.rpc.chain.getHeader();
  //console.log(lastHeader);
  // The actual address that we will use
  const newADDR = '5DTestUPts3kjeXSTMyerHihn1uwMfLj8vU8sqF7qYrFabHE';

  // Retrieve the last timestamp
  const now = await api.query.timestamp.now();

  // Retrieve the account balance & nonce via the system module
  const { nonce, data: balance } = await api.query.system.account(newADDR);
  console.log('balance');
  console.log(balance);

  console.log(`${now}: balance of ${balance.free} and a nonce of ${nonce}`);

  res.json("Done");
});


app.get('/queryAttestation', async(req, res) => {
    // Retrieve user data from your database or data source
    const response = await queryAttestations();
    console.log(response);
    res.json(response);
});

app.get('/users/:id', (req, res) => {
    // Retrieve user data from your database or data source
    const userId = req.params.id;
    console.log(userId);
    const userData = "user ka data"; // Replace with your actual data retrieval logic
    res.json(userData);
});

// Sign protocol's attesting data based on a given schema Id
app.post('/createattestation', async(req, res) => {
    // Retrieve user data from your database or data source
    console.log(req.body);
    const name = req.body.domainName;
    const address_resolver = req.body.addressResolver;
    const recorder_type = req.body.dnsRecorderType;
    const expiry = req.body.expiry;
    const contact = req.body.contact;
    console.log(name, address_resolver, expiry);
    const response = await createNotaryAttestation(name, address_resolver, recorder_type, expiry, contact);
    console.log(response);
    res.json(response);
});

app.get("/querySchema", async(req, res) => {
  const schemaId = req.query.id;
  console.log(schemaId);
  const indexService = new IndexService("testnet");
  const response = await indexService.querySchema(schemaId);
  res.json(response);
});

app.get("/queryAttestations", async(req, res) => {
  const schemaId = req.query.id;
  console.log(schemaId);
  const indexService = new IndexService("testnet");
  const response = await indexService.queryAttestation(schemaId);
  res.json(response);
})


// Used only once for creating schema to store zksbt metadata
app.post('/createschema', async(req, res) => {
    // Retrieve user data from your database or data source
    const name = req.body.domain_name;
    
    const response = await client.createSchema({
        name: name,
        data : [
            { name: "domain_name", type: "string" },
            { name: "address_resolver", type: "string" },
            { name: "recorder_type", type: "string" },
            { name: "expiry", type: "string" },
            { name: "contact", type: "string" },
        ],
      });
    console.log(response);
    res.json(response);
});


// Hedera network's Topic 
app.post("/createTopic", async(req, res) => {
  // Retrieve user data from your database or data source
  // Create a new topic
  let txResponse = await new TopicCreateTransaction().execute(Hederaclient);

  // Grab the newly generated topic ID
  let receipt = await txResponse.getReceipt(Hederaclient);
  let topicIdnew = receipt.topicId;
  console.log(`Your topic ID is: ${topicIdnew}`);
  TopicID = topicIdnew;
  console.log(TopicID.toString());
  res.json(topicIdnew);
});


async function submitFirstMessage(message) {
  
  let txResponse = await new TopicCreateTransaction().execute(Hederaclient);

  // Grab the newly generated topic ID
  let receipt = await txResponse.getReceipt(Hederaclient);
  let giventopicId = receipt.topicId;
  console.log(`Your topic ID is: ${giventopicId}`);
  TopicID = giventopicId;
  console.log(TopicID.toString());

  // Wait 5 seconds between consensus topic creation and subscription creation
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Create the topic
  new TopicMessageQuery()
    .setTopicId(giventopicId)
    .subscribe(Hederaclient, null, (message) => {
      let messageAsString = Buffer.from(message.contents, "utf8").toString();
      console.log(
        `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
      );
    });

  // Send message to topic
  let sendResponse = await new TopicMessageSubmitTransaction({
    topicId: giventopicId,
    message: message,
  }).execute(Hederaclient);
  const getReceipt = await sendResponse.getReceipt(Hederaclient);

  // Get the status of the transaction
  const transactionStatus = getReceipt.status;
  
  console.log("The message transaction status: " + transactionStatus.toString());
  return {"transactionStatus": transactionStatus.toString(), "topicId": giventopicId.toString()};
}


// Hedera network's send message to a topic
app.post('/sendMessage', async(req, res) => {
  // Retrieve user data from your database or data source
  const message = req.body.message;
  console.log(message);
  const response = await submitFirstMessage(message);
  console.log(response);
  res.json(response);
});

app.get('/getMessages', async(req, res) => {
  // Retrieve user data from your database or data source
  let topicIdgiven = req.params.topicId;
  console.log(topicIdgiven)
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicIdgiven}/messages`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(data["messages"]);
  res.json(data["messages"]);
});

app.post('/getSSVdata', async(req, res) =>{
  let ssvquery = req.body.query;
  console.log(ssvquery);
  const url = "https://api.studio.thegraph.com/proxy/71118/ssv-network-holesky/version/latest";
  const response = await axios.post(url, JSON.stringify({ ssvquery }));
  console.log(response.data);
  res.json(response.data);
});


const port = 4000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});