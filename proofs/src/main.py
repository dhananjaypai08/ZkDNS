from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import subprocess
import time 
import os 
import json
import re 

app = FastAPI()

origins = [
    "http://localhost",
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Yoyo this started")
    yield
    print("Yo shutting down yo")
    
def strip_ansi_codes(s):
    if not s: return s
    s = re.sub(r'\x1b\[[0-9;]*m', '', s)
    s = re.sub(r'\n', '', s)
    return s    

@app.get("/compile")
async def main():
    print('compiling circuit')
    file = "../circuits/AgeVerification.circom"
    response = compile_circuit(file)
    print(response)
    return response

def compile_circuit(file: str):
    COMPILE_COMMAND = f"circom {file} --r1cs --wasm --sym --c"
    print(COMPILE_COMMAND)
    response = subprocess.run(COMPILE_COMMAND, shell=True, capture_output=True, text=True)
    print(response, type(response))
    return strip_ansi_codes(response.stdout), strip_ansi_codes(response.stderr)

@app.get("/generate_witness")
async def run_compute_command_and_wait_for_file(curr_age, age_threshold):
    input_file = './input.json'
    data = {"privateAge" : curr_age, "ageThreshold": age_threshold}
    with open(input_file, "w") as f:
        json.dump(data, f, indent=4)
    print('dumped inputs in json file')
    command = f"node ./AgeVerification_js/generate_witness.js ./AgeVerification_js/AgeVerification.wasm {input_file} AgeVerification_js/witness.wtns"
    output_file = "AgeVerification_js/witness.wtns"
    response = subprocess.run(command, shell=True, capture_output=True, text=True)
    print(response, type(response))
    return strip_ansi_codes(str(response.stdout))

@app.get("/export_zkey")
async def generate_and_export_zkey():
    command = 'snarkjs groth16 setup AgeVerification.r1cs pot12_final.ptau AgeVerification_0000.zkey'
    command2 = 'snarkjs zkey contribute AgeVerification_0000.zkey AgeVerification_0001.zkey --name="Dhananjay Pai" -v'
    response = subprocess.run(command, shell=True, capture_output=True, text=True)
    print(response)
    response = subprocess.run(command2, shell=True, capture_output=True, text=True)
    print(response)
    command3 = 'snarkjs zkey export verificationkey AgeVerification_0001.zkey verification_key.json'
    response = subprocess.run(command3, shell=True, capture_output=True, text=True)
    return strip_ansi_codes(response.stdout)

@app.get("/generate_proof")
async def generate_proof():
    command = 'snarkjs groth16 prove AgeVerification_0001.zkey AgeVerification_js/witness.wtns proof.json public.json'
    response = subprocess.run(command, shell=True, capture_output=True, text=True)
    return response.stdout

@app.get("/verify_proof")
async def verify_proof():
    command = 'snarkjs groth16 verify verification_key.json public.json proof.json'
    response = subprocess.run(command, shell=True, capture_output=True, text=True)
    print(response)
    return strip_ansi_codes(response.stdout)

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True, port=8001, log_level="info")