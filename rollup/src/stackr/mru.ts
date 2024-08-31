import { MicroRollup } from "@stackr/sdk";
import { stackrConfig } from "../../stackr.config";
import { machine } from "./machine";
import { UpdateCounterSchema } from "./schemas";

const mru = await MicroRollup({
  config: stackrConfig,
  actionSchemas: [UpdateCounterSchema],
  stateMachines: [machine],
});

await mru.init();

export { mru };
