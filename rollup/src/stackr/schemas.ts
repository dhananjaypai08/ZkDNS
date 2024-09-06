import { ActionSchema, SolidityType } from "@stackr/sdk";
import { SOURCE_ID } from "sqlite3";

// createAccountSchema is a schema for creating an account
export const createRepScoreSchema = new ActionSchema("createRepScore", {
  actionMessage: SolidityType.STRING,
  fid: SolidityType.UINT,
  totalMints: SolidityType.UINT,
  qualityMints: SolidityType.UINT,
  timestamp: SolidityType.UINT,
});

export const updateRepScoreSchema = new ActionSchema("updateRepScore", {
  actionMessage: SolidityType.STRING,
  fid: SolidityType.UINT,
  totalMints: SolidityType.UINT,
  qualityMints: SolidityType.UINT,
  timestamp: SolidityType.UINT,
});

// transferSchema is a collection of all the transfer actions
// that can be performed on the rollup
export const schemas = {
  createRepScore: createRepScoreSchema,
  updateRepScore: updateRepScoreSchema,
};