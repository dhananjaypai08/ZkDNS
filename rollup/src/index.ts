import express, { Request, Response } from "express";

import { ActionEvents } from "@stackr/sdk";
import { Playground } from "@stackr/sdk/plugins";
import { schemas } from "./stackr/schemas.ts";
import { ReputationMachine, mru } from "./stackr/mru.ts";
import { transitions } from "./stackr/transitions.ts";
import { stackrConfig } from "../stackr.config";
import { Wallet } from "ethers";
import { getBody } from "./utils.ts";
const cors = require('cors');

const { domain } = stackrConfig;

console.log("Starting server...");

const reputationMachine =
  mru.stateMachines.get<ReputationMachine>("reputation-system");

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization']
}));

if (process.env.NODE_ENV === "development") {
  const playground = Playground.init(mru);

  playground.addGetMethod(
    "/custom/hello",
    async (_req: Request, res: Response) => {
      res.json({
        message: "Hello from the custom route",
      });
    }
  );
}

const { actions, chain, events } = mru;

app.get("/actions/:hash", async (req: Request, res: Response) => {
  const { hash } = req.params;
  const action = await actions.getByHash(hash);
  if (!action) {
    return res.status(404).send({ message: "Action not found" });
  }
  return res.send(action);
});

app.get("/blocks/:hash", async (req: Request, res: Response) => {
  const { hash } = req.params;
  const block = await chain.getBlockByHash(hash);
  if (!block) {
    return res.status(404).send({ message: "Block not found" });
  }
  return res.send(block);
});

app.post("/:reducerName", async (req: Request, res: Response) => {
  const { reducerName } = req.params;
  const {id, total_mints, quality_mints} = req.body;
  console.log(id, total_mints, quality_mints, req.body);
  const actionReducer = transitions[reducerName];

  if (!actionReducer) {
    res.status(400).send({ message: "no reducer for action" });
    return;
  }
  const action = reducerName as keyof typeof schemas;
  type ActionName = keyof typeof schemas;
  const wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`);
  const response = await getBody(reducerName as ActionName, wallet, id, total_mints, quality_mints);
  const { msgSender, signature, inputs } = response;
  // console.log(msgSender);
  // console.log(signature);
  // console.log(inputs);

  const schema = schemas[action];

  try {
    const newAction = schema.actionFrom({ msgSender, signature, inputs });
    const ack = await mru.submitAction(reducerName, newAction);
    res.status(201).send({ ack });
  } catch (e: any) {
    res.status(400).send({ error: e.message });
  }
  return;
});

events.subscribe(ActionEvents.SUBMIT, (args) => {
  console.log("Submitted an action", args);
});

events.subscribe(ActionEvents.EXECUTION_STATUS, async (action) => {
  console.log("Submitted an action", action);
});

app.get("/", (_req: Request, res: Response) => {
  return res.send({ state: reputationMachine?.state });
});

app.get("/score/:fid", (_req: Request, res: Response) => {
  const { fid } = _req.params;

  const state = reputationMachine?.state;
  const userScore = state?.find((user) => user.fid === Number(fid));
  return res.send({ userScore });
});

type ActionName = keyof typeof schemas;

app.get("/getEIP712Types/:action", (_req: Request, res: Response) => {
  // @ts-ignore
  const { action }: { action: ActionName } = _req.params;

  const eip712Types = schemas[action].EIP712TypedData.types;
  return res.send({ eip712Types });
});

app.listen(5050, () => {
  console.log("listening on port 5050");
});