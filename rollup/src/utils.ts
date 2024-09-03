import { ActionSchema, AllowedInputTypes } from "@stackr/sdk";
import { HDNodeWallet, Wallet } from "ethers";
import { schemas } from "./stackr/schemas";
import { stackrConfig } from "../stackr.config";

export const signMessage = async (
  wallet: Wallet,
  schema: ActionSchema,
  payload: AllowedInputTypes
) => {
  const signature = await wallet.signTypedData(
    schema.domain,
    schema.EIP712TypedData.types,
    payload
  );
  return signature;
};

type ActionName = keyof typeof schemas;
const { domain } = stackrConfig;

export const getBody = async (actionName: ActionName, wallet: Wallet) => {
  const walletAddress = wallet.address;
  const date = new Date();
  console.log(actionName);
  const payload =
    actionName == "createRepScore"
      ? {
          fid: 1,
          totalMints: 3,
          qualityMints: 1,
          timestamp: Math.round(date.getTime() / 1000),
        }
      : {
          fid: 2,
          totalMints: 3,
          qualityMints: 1,
          timestamp: Math.round(date.getTime() / 1000),
        };
  console.log(payload);
  console.log(schemas[actionName].EIP712TypedData.types);
  console.log(domain);
  const signature = await wallet.signTypedData(
    domain,
    schemas[actionName].EIP712TypedData.types,
    payload
  );
  console.log(signature);
  const body = JSON.stringify({
    msgSender: walletAddress,
    signature,
    payload,
  });

  return body;
};
