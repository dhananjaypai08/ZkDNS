const express = require('express');
const { SignProtocolClient, SpMode, EvmChains, IndexService } = require("@ethsign/sp-sdk");

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


// async function createNotaryAttestation(domain_name, address_resolver, recorder_type, expiry, contact) {
//     let address = "0x878c92FD89d8E0B93Dc0a3c907A2adc7577e39c5"; // Alice's address. Will need Alice's account to send the tx.
//     let schemaData = ethers.utils.defaultAbiCoder.encode(
//       ["string", "string", "string", "string", "string"],
//       [domain_name, address_resolver, recorder_type, expiry, contact]
//     );
    
//     // Standard setup for the contract
//     const provider = new ethers.BrowserProvider("https://eth-sepolia.g.alchemy.com/v2/YrcRBtPyzQZxWtNt-Cd8sYXh46GSSczW")
//       // Get an RPC URL (such as an infura link) to connect to the network);
//     // Get the contract address from the Address Book in docs.sign.global
//     const contract = new Contract(CONTRACT_ADDRESS(84532), ISPABI.abi, provider);
//     // Get the provider from the currently connected wallet
//     const library = new Web3Provider(await connector.getProvider());
//     // Create writable contract instance
//     const instance = contract.connect(library.getSigner());
    
//     // Send the attestation transaction
//     try {
//       await instance[
//         "attest((uint64,uint64,uint64,uint64,address,uint64,uint8,bool,bytes[],bytes),string,bytes,bytes)"
//       ](
//         {
//           schemaId: BigNumber.from("0x34"), // The final number from our schema's ID.
//           linkedAttestationId: 0, // We are not linking an attestation.
//           attestTimestamp: 0, // Will be generated for us.
//           revokeTimestamp: 0, // Attestation is not revoked.
//           attester: address, // Alice's address.
//           validUntil: 0, // We are not setting an expiry date.
//           dataLocation: 0, // We are placing data on-chain.
//           revoked: false, // The attestation is not revoked.
//           recipients: [signer], // Bob is our recipient.
//           data: schemaData // The encoded schema data.
//         },
//         signer.toLowerCase(), // Bob's lowercase address will be our indexing key.
//         "0x", // No delegate signature.
//         "0x00" // No extra data.
//       )
//         .then(
//           async (tx) =>
//             await tx.wait(1).then((res) => {
//               console.log("success", res);
//               // You can find the attestation's ID using the following path:
//               // res.events[0].args.attestationId
//             })
//         )
//         .catch((err) => {
//           console.log(err?.message ? err.message : err);
//         });
//     } catch (err) {
//       console.log(err?.message ? err.message : err);
//     }
// }

const port = 4000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});