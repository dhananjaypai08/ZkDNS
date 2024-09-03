import { MicroRollup } from "@stackr/sdk";
import { stackrConfig } from "../../stackr.config";
import { machine } from "./machine";
import { schemas } from "./schemas";

type ReputationMachine = typeof machine;

const mru = await MicroRollup({
  config: stackrConfig,
  actionSchemas: [schemas.createRepScore, schemas.updateRepScore],
  stateMachines: [machine],
  stfSchemaMap: {
    createRepScore: schemas.createRepScore,
    updateRepScore: schemas.updateRepScore,
  },
});

await mru.init();

export { ReputationMachine, mru };
