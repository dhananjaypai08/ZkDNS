import { Transitions, STF } from "@stackr/sdk/machine";
import {
  ReputationSystem,
  ReputationSystemTransport as StateWrapper,
  UserReputation,
} from "./state";

const findIndexOfFid = (state: StateWrapper, fid: number) => {
  return state.userRepuations.findIndex((user) => user.fid === fid);
};

export interface calculateRepScoreInputsType {
  totalMints: number;
  qualityMints: number;
}

export interface calculateRepScoreReturnType {
  totalScore: number;
}

const calculateRepScore = (
  inputs: calculateRepScoreInputsType
): calculateRepScoreReturnType => {

  const totalScore = Math.round(
    inputs.qualityMints*1.2 + inputs.totalMints
  );

  return {
    totalScore: totalScore,
  };
};

// --------- State Transition Handlers ---------
const createRepScoreHandler: STF<ReputationSystem> = {
  handler: ({ inputs, state, msgSender }) => {

    if (state.userRepuations.find((user) => user.fid === inputs.fid)) {
      throw new Error("User reputation already exists");
    }

    const repScore = calculateRepScore({
      totalMints: inputs.totalMints,
      qualityMints: inputs.qualityMints
    });
    console.log(repScore);

    const userReputation: UserReputation = {
      fid: inputs.fid,
      address: msgSender,
      lastUpdated: inputs.timestamp,
      totalScore: repScore.totalScore,
    };
    console.log(userReputation);
    state.userRepuations.push(userReputation);
    return state;
  },
};

// --------- State Transition Handlers ---------
const updateRepScoreHandler: STF<ReputationSystem> = {
  handler: ({ inputs, state, msgSender }) => {

    const userRepIndex = findIndexOfFid(state, inputs.fid);
    const userRep = state.userRepuations[userRepIndex];
    if (!userRep) {
      throw new Error("User reputation doesn't exist");
    }

    const repScore = calculateRepScore({
      totalMints: inputs.totalMints,
      qualityMints: inputs.qualityMints
    });
    console.log(repScore);

    const newUserReputation: UserReputation = {
      fid: inputs.fid,
      address: userRep.address,
      lastUpdated: inputs.timestamp,
      totalScore: repScore.totalScore,
    };

    state.userRepuations[userRepIndex] = newUserReputation;

    // possibly record this change
    return state;
  },
};

export const transitions: Transitions<ReputationSystem> = {
  createRepScore: createRepScoreHandler,
  updateRepScore: updateRepScoreHandler,
};