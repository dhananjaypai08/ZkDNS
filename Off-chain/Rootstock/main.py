import os
from dotenv import load_dotenv
from web3 import Web3
from config import Contract
from fastapi import FastAPI, Request, Response, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import uvicorn

load_dotenv()

contract = Contract()
app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8001",
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
w3 = Web3(Web3.HTTPProvider(RPC_PROVIDER_URL))
zkdns_contract = w3.eth.contract(address=contract_address, abi=contract_abi)

private_key = os.environ.get('PRIVATE_KEY')
account_from = {
    'private_key': private_key,
    'address': w3.eth.account.from_key(private_key).address
}
account = w3.eth.account.from_key(private_key)

@app.post("/addDNS")
async def home(request: Request):
    body = await request.json()
    to, uri, domain_name, addressResolver, dnstype, expiry, contact = body["to"], body["uri"], body["domainName"], body["addressResolver"], body["dnsRecorderType"], body["expiry"], body["contact"]
    print(body)
    to = w3.to_checksum_address(to)
    nonce = w3.eth.get_transaction_count(account.address)
    # Build the transaction
    transaction = zkdns_contract.functions.safeMint(to, uri, domain_name, addressResolver, dnstype, expiry, contact).build_transaction({
        'from': account_from["address"],
        'nonce': nonce,
        'gasPrice': w3.eth.gas_price # Set an appropriate gas limit
    })

    # Sign the transaction
    signed_txn = w3.eth.account.sign_transaction(transaction, account_from['private_key'])
    print(signed_txn)
    # Send the transaction
    txn_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    try:
        txn_hash_hex = txn_hash.hex()
        print(txn_hash_hex)
    except Exception as e:
        print(e)
    try:
        txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
        print(txn_receipt.status)
        print(f"Transaction successful with hash: { txn_receipt.transactionHash.hex() }")
        print(txn_hash_hex, txn_receipt.blockHash.hex())
        transaction_details = {
            "transaction_hash": txn_hash_hex,
            "block_hash": txn_receipt.blockHash.hex(),
            "status": txn_receipt.status,
            "gas_used": txn_receipt.gasUsed,
            "block_number": txn_receipt.blockNumber
        }
        
        return transaction_details
    except Exception as e:
        print(e)
    return txn_hash, txn_receipt.blockHash.hex()
    
    
if __name__ == "__main__":
    uvicorn.run("main:app", reload=True, log_level="info")   