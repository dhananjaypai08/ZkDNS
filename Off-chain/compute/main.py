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

file = open(contract.abi_path)
data = json.load(file)
file.close()
contract_abi = data["abi"]
contract_address = data["address"]

RPC_PROVIDER_APIKEY = os.environ.get('RPC_PROVIDER_APIKEY')
RPC_PROVIDER_URL = 'https://rpc.testnet.rootstock.io/' + RPC_PROVIDER_APIKEY
print(RPC_PROVIDER_URL)
w3 = Web3(Web3.HTTPProvider(RPC_PROVIDER_URL))
zkdns_contract = w3.eth.contract(address=contract_address, abi=contract_abi)

# ABI for the ENS Resolver contract
RESOLVER_ABI = json.loads('[{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"}],"name":"addr","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"}]')
# def setup_web3_and_ens():
#     # Connect to an Ethereum node (replace with your own node URL)
#     w3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID'))
    
#     # Initialize ENS
#     ns = ENS.fromWeb3(w3)
    
#     return w3, ns

private_key = os.environ.get('PRIVATE_KEY')
account_from = {
    'private_key': private_key,
    'address': w3.eth.account.from_key(private_key).address
}
account = w3.eth.account.from_key(private_key)
# print('gas estimated')
# print(w3.eth.estimate_gas())

@app.post("/addDNS")
async def home(request: Request):
    body = await request.json()
    to, uri, domain_name, addressResolver, dnstype, expiry, contact = body["to"], body["uri"], body["domainName"], body["addressResolver"], body["dnsRecorderType"], body["expiry"], body["contact"]
    print(body)
    to = w3.to_checksum_address(to)
    nonce = w3.eth.get_transaction_count(account_from['address'])
    gasprice = w3.eth.gas_price
    print(to, nonce, gasprice)
    
    # Build the transaction
    transaction = zkdns_contract.functions.safeMint(to, uri, domain_name, addressResolver, dnstype, expiry, contact).build_transaction({
        'from': w3.eth.account.from_key(private_key).address,
        'gasPrice': w3.to_wei("20", "gwei"),
        'gas': 20000000,
        'nonce': nonce,
    })
    
    print('transaction built')
    print(transaction)
    # Sign the transaction
    signed_txn = w3.eth.account.sign_transaction(transaction, account_from['private_key'])
    hash = w3.to_hex(w3.keccak(signed_txn.raw_transaction))
    print('signed transaction hash')
    print(hash)
    # Send the transaction
    txn_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    try:
        print(txn_hash)
        # txn_hash_hex = txn_hash.hex()
        # print("Transaction Hash:", txn_hash.hex())
    except Exception as e:
        print(e)
    try:
        txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
        print(txn_receipt.status)
        print("Transaction Receipt:", txn_receipt)
        #print(txn_hash_hex, txn_receipt.blockHash.hex())
        transaction_details = {
            "transaction_hash": txn_hash.hex(),
            "block_hash": txn_receipt.blockHash.hex(),
            "status": txn_receipt.status,
            "gas_used": txn_receipt.gasUsed,
            "block_number": txn_receipt.blockNumber
        }
        
        return transaction_details
    except Exception as e:
        print(e)
        return e
    
@app.get("/forwardToResolver")
def forward_to_dns_resolver(domain: str, address_resolver: str, resolver_port=53):
    # Create a new DNS query message
    print(domain, address_resolver)
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
    
    
if __name__ == "__main__":
    uvicorn.run("main:app", port=8002, reload=True, log_level="info")   