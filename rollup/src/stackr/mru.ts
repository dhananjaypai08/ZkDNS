import { MicroRollup } from "@stackr/sdk";
import { stackrConfig } from "../../stackr.config";
import { machine } from "./machine";
import { UpdateCounterSchema } from "./schemas";
import { Playground } from "@stackr/sdk/plugins";

const mru = await MicroRollup({
  config: stackrConfig,
  actionSchemas: [UpdateCounterSchema],
  stateMachines: [machine],
});

Playground.init(mru); 
await mru.init();

export { mru };
