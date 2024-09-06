import { StateMachine } from "@stackr/sdk/machine";

import * as genesisState from "../../genesis-state.json";
import { ReputationSystem } from "./state";
import { transitions } from "./transitions";

const STATE_MACHINES = {
  Reputation: "reputation-system",
};


const reputationStateMachine = new StateMachine({
  id: STATE_MACHINES.Reputation,
  stateClass: ReputationSystem,
  initialState: genesisState.state,
  on: transitions,
});

export { STATE_MACHINES, reputationStateMachine };
