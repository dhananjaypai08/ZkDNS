# ZkDNS

A secure and transparent way of querying DNS servers using zero-knowledge proofs (zkProofs).

## Table of Contents

* [Project Description](#project-description)
* [Theoretical Overview](#theoretical-overview)
* [Local Setup Instructions](#local-setup-instructions)
* [Contributions](#contributions)

## Project Description

ZkDNS addresses common vulnerabilities in web2/web3 systems such as phishing attacks, DoS attacks, and data breaches by providing an on-chain private computing protocol for DNS lookups.

The system enables secure and privacy-preserving DNS record management where:

* Domain owners can register and manage DNS records on-chain.
* Zero-knowledge proofs ensure that DNS queries and updates are verifiable without exposing sensitive data.
* A staking-based mechanism deters malicious entries and incentivizes honest participation.

This approach enhances transparency, privacy, and security in DNS infrastructure, bridging the gap between traditional DNS and decentralized web technologies.

## Theoretical Overview

ZkDNS operates on the principle of verifiable computation using zkProofs:

1. **DNS Record Management** – Domain owners create records (e.g., resolver address, record type, expiry date, contact info) stored securely and verifiably.
2. **Zero-Knowledge Proofs** – Queries and updates are accompanied by proofs that validate correctness without revealing underlying sensitive information.
3. **On-Chain Registry** – All records are kept in a decentralized registry, ensuring transparency and immutability.
4. **Staking and Incentives** – Users must stake tokens to add records, and malicious entries can result in slashing.
5. **Privacy Preservation** – Sensitive information is stored in an encrypted form, with decryption possible only by authorized entities.

**Inspiration and References:**

* [zkProofs Introduction – ZKProof.org](https://zkproof.org)
* [Decentralized Identifiers (W3C)](https://www.w3.org/TR/did-core/)
* [Ethereum Name Service Concepts](https://docs.ens.domains/)

## Local Setup Instructions

Before starting, ensure you have **Node.js**, **Python 3**, **yarn**, and **pip** installed.

1. **Signattestations Service** (handles attestations and off-chain verification) Optional Step

```sh
cd Signattestations
cp .env.example .env
yarn install
nodemon src/index.js
```

2. **Off-chain Service** (performs traditional DNS lookups and off-chain processing)

```sh
cd Off-chain
cp .env.example .env
python -m venv env
source env/bin/activate  # or env/Scripts/activate on Windows
pip install -r requirements.txt
cd compute
python main.py
```

3. **Rollup Service** (state management and aggregation)

```sh
cd rollup
cp .env.example .env
npm install
npm start
```

4. **Proof Storage Service** (stores zkProof data, Linux/WSL recommended)

```sh
cd proofStorage
wsl
cp .env.example .env
python -m venv env
source env/bin/activate
pip install -r requirements.txt
cd src
python main.py
```

5. **Frontend Interface** (main ZkDNS UI)

```sh
cd zkdns
cp .env.example .env
yarn install
yarn start
```

## Contributions

We welcome contributions from the community. Fork the repository, make your changes, and open a pull request describing your modifications.
