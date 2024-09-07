import os
from dotenv import load_dotenv
from web3 import Web3
from config import Contract
from fastapi import FastAPI, Request, Response, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import uvicorn
# DNS and ENS imports 
import dns.message
import dns.query
import dns.resolver
import dns
from envioClient import getClient, runQueryBlockData, runQueryLogsData, runQueryTxn, runQueryBlocksTxns, runWalletQuery


load_dotenv()

contract = Contract()
app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8002",
    "http://localhost:8000",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NETWORK_URLS_TESTNET = {"Chillz": ["https://chiliz.hypersync.xyz", 8888], 
                "Fhenix": ["https://fhenix-testnet.hypersync.xyz", 42069],
                "Galadriel": ["https://galadrial-devnet.hypersync.xyz", 696969],
                "Morph": ["https://morph-testnet.hypersync.xyz", 2810]
                }

file = open(contract.abi_path)
data = json.load(file)
file.close()
contract_abi = data["abi"]
contract_address = data["address"]

RPC_PROVIDER_APIKEY = os.environ.get('RPC_PROVIDER_APIKEY')
RPC_PROVIDER_URL = 'https://rpc.testnet.rootstock.io/' + RPC_PROVIDER_APIKEY
print(RPC_PROVIDER_URL)
w3 = Web3(Web3.HTTPProvider(RPC_PROVIDER_APIKEY))
zkdns_contract = w3.eth.contract(address=contract_address, abi=contract_abi)

private_key = os.environ.get('PRIVATE_KEY')
account_from = {
    'private_key': private_key,
    'address': w3.eth.account.from_key(private_key).address
}
account = w3.eth.account.from_key(private_key)
    
@app.get("/forwardToResolver")
def forward_to_dns_resolver(domain: str, address_resolver: str, resolver_port=53):
    # Create a new DNS query message
    print(domain, address_resolver)
    if not address_resolver or address_resolver=="null" or len(address_resolver.split("."))<4:
        address_resolver = "8.8.8.8" #default
    query = dns.message.make_query(domain, dns.rdatatype.A)

    try:
        # Send the query to the DNS resolver
        response = dns.query.udp(query, address_resolver, port=resolver_port, timeout=5)

        # Check if we got a valid response
        if response.rcode() == dns.rcode.NOERROR:
            # Extract the IP addresses from the answer section
            ip_addresses = []
            for answer in response.answer:
                for item in answer.items:
                    if item.rdtype == dns.rdatatype.A:
                        ip_addresses.append(item.address)
            
            return ip_addresses
        else:
            return f"DNS query failed with response code: {dns.rcode.to_text(response.rcode())}"

    except dns.exception.Timeout:
        return "DNS query timed out"
    except Exception as e:
        return f"An error occurred: {str(e)}"
    
@app.get("/getEnvioblockdata")
async def getEnvioData(network: str):
    # Get all the Envio data from the given network : Fhenix, Galadriel and Chillz
    networkdetails = NETWORK_URLS_TESTNET.get(network)
    if not networkdetails: return "Please provide a valid network name"
    url, chainId = networkdetails
    client = getClient(url)
    response = await runQueryBlockData(client=client)
    return response

@app.get("/getEnvioContractdata")
async def getEnvioContractdata(network: str):
    networkdetails = NETWORK_URLS_TESTNET.get(network)
    if not networkdetails: return "Please provide a valid network name"
    url, chainId = networkdetails
    client = getClient(url)
    response = await runWalletQuery(client)
    return response 

@app.get("/getLogsEvent")
async def getLogs(network: str):
    contract = "0xb5ddC78A82227C25864F269a0fc58d4166AA26b0"
    networkdetails = NETWORK_URLS_TESTNET.get(network)
    if not networkdetails: return "Please provide a valid network name"
    url, chainId = networkdetails
    client = getClient(url)
    response = await runQueryLogsData(client=client, contract=contract)
    print(response)
    return response 

@app.get("/getBlockTransactions")
async def getLogs(network: str):
    networkdetails = NETWORK_URLS_TESTNET.get(network)
    if not networkdetails: return "Please provide a valid network name"
    url, chainId = networkdetails
    client = getClient(url)
    response = await runQueryBlocksTxns(client=client)
    print(response)
    return response 

@app.get("/getTxnEvents")
async def getLogstxn(network: str):
    txn_hash = "0x0ce59482a47c367c57e2dc14d559990af9cb1aef86ff1af726cee9e75c1c2827"
    networkdetails = NETWORK_URLS_TESTNET.get(network)
    if not networkdetails: return "Please provide a valid network name"
    url, chainId = networkdetails
    client = getClient(url)
    response = await runQueryTxn(client=client, txn_hash=txn_hash)
    print(response)
    return response 
    

if __name__ == "__main__":
    uvicorn.run("main:app", port=8002, reload=True, log_level="info")   