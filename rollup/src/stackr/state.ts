import { State } from "@stackr/sdk/machine";
import { solidityPackedKeccak256 } from "ethers";

export class CounterState extends State<number> {
  constructor(state: number) {
    super(state);
  }

  // Here since the state is simple and doesn't need wrapping, we skip the transformers to wrap and unwrap the state

  // transformer() {
  //   return {
  //     wrap: () => this.state,
  //     unwrap: (wrappedState: number) => wrappedState,
  //   };
  // }

  getRootHash() {
    return solidityPackedKeccak256(["uint256"], [this.state]);
  }
}
