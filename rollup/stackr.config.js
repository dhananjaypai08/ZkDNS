"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stackrConfig = void 0;
var sdk_1 = require("@stackr/sdk");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var stackrConfig = {
    isSandbox: true,
    sequencer: {
        blockSize: 16,
        blockTime: 10,
    },
    syncer: {
        vulcanRPC: process.env.VULCAN_RPC,
        L1RPC: process.env.L1_RPC,
    },
    operator: {
        accounts: [
            {
                privateKey: process.env.PRIVATE_KEY,
                purpose: sdk_1.KeyPurpose.BATCH,
                scheme: sdk_1.SignatureScheme.ECDSA,
            },
        ],
    },
    domain: {
        name: "Reputation Rollup",
        version: "1",
        salt: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    },
    datastore: {
        type: "sqlite",
        uri: process.env.DATABASE_URI,
    },
    registryContract: process.env.REGISTRY_CONTRACT,
    preferredDA: sdk_1.DA.AVAIL,
    logLevel: "log",
};
exports.stackrConfig = stackrConfig;
