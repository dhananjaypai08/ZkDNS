import { Wallet } from "ethers";
import { schemas } from "./stackr/schemas";
import { stackrConfig } from "../stackr.config";

const domain = {
    name: "Stackr MVP v0",
    version: "1",
    salt: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    chainId: 11155111,
    verifyingContract: "0x62321E96D28cebe2445E33aFA0D72E1EA58Eac30"
}

export const getBody = async (actionName, wallet) => {
  const walletAddress = wallet.address;
  const date = new Date();
  const inputs =
    actionName == "createRepScore"
      ? {
          actionMessage: "0x",
          fid: 2,
          totalMints: 3,
          qualityMints: 1,
          timestamp: Math.round(date.getTime() / 1000),
        }
      : {
        actionMessage: "0x",
        fid: 2,
        totalMints: 3,
        qualityMints: 1,
        timestamp: Math.round(date.getTime() / 1000),
        };

  console.log(inputs);
  console.log(schemas[actionName].EIP712TypedData.types);

  const signature = await wallet.signTypedData(
    domain,
    schemas[actionName].EIP712TypedData.types,
    inputs
    );
  console.log(signature);

  const body = {
    msgSender: walletAddress,
    signature,
    inputs,
  };

  return body;
};
