import express, { Request, Response } from "express";

import { ActionEvents } from "@stackr/sdk";
import { Playground } from "@stackr/sdk/plugins";
import { ActionConfirmationStatus } from "@stackr/sdk";
import { Wallet } from "ethers";
import { mru, ReputationMachine } from "./stackr/mru.ts";
import { schemas } from "./stackr/schemas.ts";
import { signMessage, getBody } from "./utils.ts";
import { stackrConfig } from "../stackr.config";
import { transitions } from "./stackr/transitions.ts";

const { domain } = stackrConfig;
const reputationMachine = mru.stateMachines.get<ReputationMachine>("reputation-system");
const app = express();
app.use(express.json());

const walletOne = new Wallet(
  "0x7f305a127c3ef0fc01ade48d279ff75b26bf1c70b102da7e0ce096cd9b3a3d74"
);
const walletTwo = new Wallet(
  "0x0123456789012345678901234567890123456789012345678901234567890124"
);
type ActionName = keyof typeof schemas;

console.log("Starting server...");
if (process.env.NODE_ENV === "development") {
  const playground = Playground.init(mru);

  playground.addGetMethod(
    "/custom/check",
    async (_req: Request, res: Response) => {
      res.json({
        message: "Playground working!",
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

app.post("/test/:actionName", async (req: Request, res: Response) => {
  const { actionName } = req.params;
  const actionReducer = transitions[actionName];
  console.log(actionName);
  const body = await getBody(actionName as ActionName, walletOne);
  console.log('body');
  console.log(body);
  const response = await fetch(`http://localhost:5001/${actionName}`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log(response);
  const json = await response.json();
  console.log(json);
  res.json(json);

});


app.post("/:actionName", async (req: Request, res: Response) => {
  const { actionName } = req.params;
  const actionReducer = transitions[actionName];
  const body = await getBody(actionName as ActionName, walletOne);


  if (!actionReducer) {
    res.status(400).send({ message: "no reducer for action" });
    return;
  }
  const action = actionName as keyof typeof schemas;

  const { msgSender, signature, payload } = req.body as {
    msgSender: string;
    signature: string;
    payload: any;
  };

  const schema = schemas[action];
  console.log(schema);
  console.log(msgSender, signature, payload);
  try {
    const newAction = schema.actionFrom({
      msgSender,
      signature,
      inputs: payload,
    });
    const ack = await mru.submitAction(actionName, newAction);
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


app.get("/getEIP712Types/:action", (_req: Request, res: Response) => {
  // @ts-ignore
  const { action }: { action: ActionName } = _req.params;

  const eip712Types = schemas[action].EIP712TypedData.types;
  return res.send({ eip712Types });
});

app.listen(5001, () => {
  console.log("listening on port 5001");
});