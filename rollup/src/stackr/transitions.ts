import { STF, Transitions } from "@stackr/sdk/machine";
import { CounterState } from "./state";

const increment: STF<CounterState> = {
  handler: ({ state, emit }) => {
    state += 1;
    emit({ name: "ValueAfterIncrement", value: state });
    return state;
  },
};

const decrement: STF<CounterState> = {
  handler: ({ state, emit }) => {
    state -= 1;
    emit({ name: "ValueAfterDecrement", value: state });
    return state;
  },
};

export const transitions: Transitions<CounterState> = {
  increment,
  decrement,
};
