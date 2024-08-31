import { StateMachine } from "@stackr/sdk/machine";

import * as genesisState from "../../genesis-state.json";
import { CounterState } from "./state";
import { transitions } from "./transitions";

const machine = new StateMachine({
  id: "counter",
  stateClass: CounterState,
  initialState: genesisState.state,
  on: transitions,
});

export { machine };
