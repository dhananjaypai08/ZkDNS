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
  totalMints: number,
  qualityMints: number,
}

export interface calculateRepScoreReturnType {
  totalScore: number;
}

const calculateRepScore = (
  inputs: calculateRepScoreInputsType
): calculateRepScoreReturnType => {


  const totalScore = Math.round(
    inputs.totalMints + (1.2)*inputs.qualityMints
  );

  return {
    totalScore: totalScore,
  };
};


const createRepScoreHandler: STF<ReputationSystem> = {
  handler: ({ inputs, state, msgSender }) => {
    // Check the Frame signed action message verification
    // if (!verifyFrameActionMessage(inputs.actionMessage)) {
    //   throw new Error("Frame Action Invalid");
    // }

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
      totalScore: repScore.totalScore,
      lastUpdated: inputs.timestamp,
    };
    // console.log(userReputation);
    state.userRepuations.push(userReputation);
    return state;
  },
};

const updateRepScoreHandler: STF<ReputationSystem> = {
  handler: ({ inputs, state, msgSender }) => {
    // Check the Frame signed action message verification
    // if (!verifyFrameActionMessage(inputs.actionMessage)) {
    //   throw new Error("Frame Action Invalid");
    // }

    if (
      inputs.engagementRankPercentile > 100 ||
      inputs.castFrequency > 150 ||
      inputs.postQuality > 50 ||
      inputs.followingRankPercentile > 100
    ) {
      throw new Error("Invalid inputs");
    }

    const userRepIndex = findIndexOfFid(state, inputs.fid);
    const userRep = state.userRepuations[userRepIndex];
    if (!userRep) {
      throw new Error("User reputation doesn't exist");
    }

    // if (msgSender != userRep.address) {
    //   throw new Error("Only Owner Can updater reputation score");
    // }

    const repScore = calculateRepScore({
      totalMints: inputs.totalMints,
      qualityMints: inputs.qualityMints
    });
    console.log(repScore);

    const newUserReputation: UserReputation = {
      fid: inputs.fid,
      address: userRep.address,
      totalScore: repScore.totalScore,
      lastUpdated: inputs.timestamp,
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