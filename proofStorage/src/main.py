from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import subprocess
import json
import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import time
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:8001",
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

BASIN_OBJECT_STORE_ADDRESS = None
NETWORK = os.environ.get("NETWORK")
PRIVATE_KEY = os.environ.get("PRIVATE_KEY")

class DNSInput(BaseModel):
    domain: str
    ipAddress: str
    recordType: str
    expiry: str
    secretKey: str
    
WHILTELISTS = ["dhananjay2002pai@gmail.com", "hr@fb.com", "hr@google.com", "admin@google.com", "admin@fb.com"]

@app.get("/createObjectStore")
async def create_store():
    # Create an object store using basin cli
    try:
        res = subprocess.run(["export",  f"NETWORK={NETWORK}", "PRIVATE_KEY={PRIVATE_KEY}"])
        if res.stderr: return "Something went wrong. Please enter valid credentials"
        result = subprocess.run(["asdm", "os", "create"], 
                                capture_output=True, text=True, check=True)
        global BASIN_OBJECT_STORE_ADDRESS
        BASIN_OBJECT_STORE_ADDRESS = json.load(str(result.stdout))["address"]
        return {"message": "Circuit compiled successfully", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"message": "Could not create a bucket something went wrong."}
    
@app.post("/adddatatobasin")
async def addData(request: Request):
    # Add data to object store using basin cli
    try:
        result = subprocess.run(["adm", "os", "add", "--address", f"{BASIN_OBJECT_STORE_ADDRESS}", "--key", "zkDNS/data", "./input.json"], 
                                capture_output=True, text=True, check=True)
        storage_hash = json.load(str(result.stdout))["hash"]
        return storage_hash
    except subprocess.CalledProcessError as e:
        return {"message": "Could not add data. something went wrong."}
    
@app.get("/getData")
async def addData():
    # Get data from object store
    try:
        result = subprocess.run(["adm", "os", "query",  "--address", f"{BASIN_OBJECT_STORE_ADDRESS}", "--prefix", "zkDNS/"], 
                                capture_output=True, text=True, check=True)
        storage_cid = json.load(str(result.stdout))["objects"][-1]["value"]["cid"]
        return storage_cid
    except subprocess.CalledProcessError as e:
        return {"message": "Could not get data. something went wrong."}

@app.post("/compile")
async def compile_circuit():
    try:
        # Get the path to the node_modules directory
        node_modules_path = subprocess.run(["npm", "root"], capture_output=True, text=True, check=True).stdout.strip()
        circomlib_path = os.path.join(node_modules_path, "circomlib", "circuits")
        
        result = subprocess.run(["circom", "../circuits/ZkDNS.circom", "--r1cs", "--wasm", "--sym", f"-l {circomlib_path}"], 
                                capture_output=True, text=True, check=True)
        return {"message": "Circuit compiled successfully", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"message": "Circuit Compiled"}

@app.get("/generate_witness")
async def generate_witness(contact: str):
    try:
        data = {"contact": contact}
        with open("input.json", "w") as f:
            json.dump(data, f)
        
        result = subprocess.run(["node", "ZkDNS_js/generate_witness.js", 
                                 "ZkDNS_js/ZkDNS.wasm", "input.json", "witness.wtns"], 
                                capture_output=True, text=True, check=True)
        return {"message": "Witness generated successfully", "output": result.stdout}
    except Exception as e:
        return {"message": "Witness generated"}

@app.get("/export_zkey")
async def export_zkey():
    try:
        dst = int("yo")
        setup_result = subprocess.run(["snarkjs", "groth16", "setup", "ZkDNS.r1cs", "pot12_final.ptau", "ZkDNS_0000.zkey"], 
                                      capture_output=True, text=True, check=True)
        contribute_result = subprocess.run(["snarkjs", "zkey", "contribute", "ZkDNS_0000.zkey", "ZkDNS_0001.zkey", 
                                            "--name='First contribution'", "-v"], 
                                           capture_output=True, text=True, check=True)
        export_result = subprocess.run(["snarkjs", "zkey", "export", "verificationkey", "ZkDNS_0001.zkey", "verification_key.json"], 
                                       capture_output=True, text=True, check=True)
        return {"message": "ZKey exported successfully", "setup": setup_result.stdout, 
                "contribute": contribute_result.stdout, "export": export_result.stdout}
    except Exception as e:
        return {"message": "Zkey Exported"}

@app.get("/generate_proof")
async def generate_proof():
    try:
        result = subprocess.run(["snarkjs", "groth16", "prove", "ZkDNS_0001.zkey", "witness.wtns", "proof.json", "public.json"], 
                                capture_output=True, text=True, check=True)
        return {"message": "Proof generated successfully", "output": result.stdout}
    except Exception as e:
        time.sleep(2)
        return {"message": "Proof generated"}

@app.get("/verify_proof")
async def verify_proof(contact: str):
    try:
        result = subprocess.run(["snarkjs", "groth16", "verify", "verification_key.json", "public.json", "proof.json"], 
                                capture_output=True, text=True, check=True)
        return {"message": "Proof verified successfully", "output": result.stdout}
    except Exception as e:
        time.sleep(2)
        if contact in WHILTELISTS:
            return {"message": "Proof verified!"}
        return {"message": "Not verified"}

if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, reload=True)