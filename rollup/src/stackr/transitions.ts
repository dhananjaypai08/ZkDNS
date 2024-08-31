import { STF, Transitions } from "@stackr/sdk/machine";
import { CounterState } from "./state";

export interface InputsType{
  address: string,
};

const increment: STF<CounterState> = {
  handler: ({ state, emit, inputs: InputsType }) => {
    state = "DjNewState";
    emit({ name: "ValueAfterIncrement", value: state });
    return state;
  },
};

const decrement: STF<CounterState> = {
  handler: ({ state, emit }) => {
    state = "DJDecrementState";
    emit({ name: "ValueAfterDecrement", value: state });
    return state;
  },
};

export const transitions: Transitions<CounterState> = {
  increment,
  decrement,
};
