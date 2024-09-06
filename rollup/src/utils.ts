import { ActionSchema, AllowedInputTypes } from "@stackr/sdk";
import { HDNodeWallet } from "ethers";
import { Wallet } from "ethers";
import { schemas } from "./stackr/schemas";
import { stackrConfig } from "../stackr.config";

const { domain } = stackrConfig;

// export const signMessage = async (
//   wallet: HDNodeWallet,
//   schema: ActionSchema,
//   payload: AllowedInputTypes
// ) => {
//   const signature = await wallet.signTypedData(
//     schema.domain,
//     schema.EIP712TypedData.types,
//     payload
//   );
//   return signature;
// };
type ActionName = keyof typeof schemas;


export const getBody = async (actionName: ActionName, wallet: Wallet, id: number, total_mints: number, quality_mints: number) => {
  const walletAddress = wallet.address;
  const date = new Date();
  const inputs =
    actionName == "createRepScore"
      ? {
          actionMessage: "0x",
          fid: id,
          totalMints: total_mints,
          qualityMints: quality_mints,
          timestamp: Math.round(date.getTime() / 1000),
        }
      : {
        actionMessage: "0x",
        fid: id,
        totalMints: total_mints,
        qualityMints: quality_mints,
        timestamp: Math.round(date.getTime() / 1000),
        };

  console.log(inputs);
  console.log(schemas[actionName].EIP712TypedData.types);

  const signature = await wallet.signTypedData(
    {
      chainId: 11155111,
      verifyingContract: "0x62321E96D28cebe2445E33aFA0D72E1EA58Eac30",
      ...domain,
    },
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
