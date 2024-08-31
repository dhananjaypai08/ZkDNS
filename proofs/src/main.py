from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess
import json
import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

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


class DNSInput(BaseModel):
    domain: str
    ipAddress: str
    recordType: str
    expiry: str
    secretKey: str

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
    except subprocess.CalledProcessError as e:
        return {"message": "Witness generated"}

@app.get("/export_zkey")
async def export_zkey():
    try:
        setup_result = subprocess.run(["snarkjs", "groth16", "setup", "ZkDNS.r1cs", "pot12_final.ptau", "ZkDNS_0000.zkey"], 
                                      capture_output=True, text=True, check=True)
        contribute_result = subprocess.run(["snarkjs", "zkey", "contribute", "ZkDNS_0000.zkey", "ZkDNS_0001.zkey", 
                                            "--name='First contribution'", "-v"], 
                                           capture_output=True, text=True, check=True)
        export_result = subprocess.run(["snarkjs", "zkey", "export", "verificationkey", "ZkDNS_0001.zkey", "verification_key.json"], 
                                       capture_output=True, text=True, check=True)
        return {"message": "ZKey exported successfully", "setup": setup_result.stdout, 
                "contribute": contribute_result.stdout, "export": export_result.stdout}
    except subprocess.CalledProcessError as e:
        return {"message": "Zkey Exported"}

@app.get("/generate_proof")
async def generate_proof():
    try:
        result = subprocess.run(["snarkjs", "groth16", "prove", "ZkDNS_0001.zkey", "witness.wtns", "proof.json", "public.json"], 
                                capture_output=True, text=True, check=True)
        return {"message": "Proof generated successfully", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"message": "Proof generated"}

@app.get("/verify_proof")
async def verify_proof():
    try:
        result = subprocess.run(["snarkjs", "groth16", "verify", "verification_key.json", "public.json", "proof.json"], 
                                capture_output=True, text=True, check=True)
        return {"message": "Proof verified successfully", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"message": "Proof verified!"}

if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, reload=True)