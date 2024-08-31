import { ActionSchema, SolidityType } from "@stackr/sdk";

export const UpdateCounterSchema = new ActionSchema("update-counter", {
  contact: SolidityType.STRING,
});
