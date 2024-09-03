import { Client } from "@xmtp/xmtp-js";
import { Wallet, JsonRpcProvider } from "ethers";
const newWallet = new Wallet()

const providerUrl = "https://eth-sepolia.g.alchemy.com/v2/YrcRBtPyzQZxWtNt-Cd8sYXh46GSSczW";
const provider = new JsonRpcProvider(providerUrl);
const signer = new Wallet(process.env.PRIVATE_KEY, provider)
console.log(signer.address);
// Create the client with a `Signer` from your application
const xmtp = await Client.create(signer, { env: "dev" });