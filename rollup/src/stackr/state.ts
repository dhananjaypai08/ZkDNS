import { State } from "@stackr/sdk/machine";
import {
  AddressLike,
  BytesLike,
  ZeroHash,
  solidityPackedKeccak256,
} from "ethers";
import { MerkleTree } from "merkletreejs";

export type UserReputation = {
  fid: number;
  address: AddressLike;
  totalScore: number;
  lastUpdated: number;
};


export type ReputationState = UserReputation[];

export class ReputationSystemTransport {
  public merkleTree: MerkleTree;
  public userRepuations: UserReputation[];
  // public reputationChangeEvents: reputationChangeEvent[];

  constructor(leaves: UserReputation[]) {
    this.merkleTree = this.createTree(leaves);
    this.userRepuations = leaves;
  }

  createTree(leaves: UserReputation[]) {
    const hashedLeaves = leaves.map((leaf) => {
      return solidityPackedKeccak256(
        [
          "uint256",
          "address",
          "uint256",
          "uint256",
        ],
        [
          leaf.fid,
          leaf.address,
          leaf.totalScore,
          leaf.lastUpdated,
        ]
      );
    });
    return new MerkleTree(hashedLeaves);
  }
}

export class ReputationSystem extends State<
  ReputationState,
  ReputationSystemTransport
> {
  constructor(state: ReputationState) {
    super(state);
  }

  transformer() {
    return {
      wrap: () => {
        return new ReputationSystemTransport(this.state);
      },
      unwrap: (wrappedState: ReputationSystemTransport): ReputationState => {
        return wrappedState.userRepuations;
      },
    };
  }

  getRootHash(): string {
    if (this.state.length === 0) {
      return ZeroHash;
    }
    return this.transformer().wrap().merkleTree.getHexRoot();
  }
}