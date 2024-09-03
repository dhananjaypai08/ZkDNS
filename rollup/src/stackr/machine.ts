import { StateMachine } from "@stackr/sdk/machine";

import * as genesisState from "../../genesis-state.json";
import { ReputationSystem } from "./state";
import { transitions } from "./transitions";

const machine = new StateMachine({
  id: "reputation-system",
  stateClass: ReputationSystem,
  initialState: genesisState.state,
  on: transitions,
});

export { machine };
