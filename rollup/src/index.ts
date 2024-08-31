import { ActionConfirmationStatus } from "@stackr/sdk";
import { Wallet } from "ethers";
import { mru } from "./stackr/mru.ts";
import { UpdateCounterSchema } from "./stackr/schemas.ts";
import { signMessage } from "./utils.ts";
import express, { Request, Response } from "express";
import { machine } from "./stackr/machine.ts";
import cors from "cors";

const app = express();
app.use(cors());

const main = async () => {

  const inputs = {
    timestamp: Date.now(),
  };

  // Create a random wallet
  const wallet = Wallet.createRandom();

  const signature = await signMessage(wallet, UpdateCounterSchema, inputs);
  
  const incrementAction = UpdateCounterSchema.actionFrom({
    inputs,
    signature,
    msgSender: wallet.address,
  });

  const ack = await mru.submitAction("decrement", incrementAction);
  console.log(ack.hash);

  // leverage the ack to wait for C1 and access logs & error from STF execution
  const { logs, errors } = await ack.waitFor(ActionConfirmationStatus.C1);
  console.log({ logs, errors });
};

app.post("/increment", async(_req: Request, res: Response) =>{
  const inputs = {
    timestamp: Date.now(),
  };

  // Create a random wallet
  const wallet = Wallet.createRandom();

  const signature = await signMessage(wallet, UpdateCounterSchema, inputs);
  const incrementAction = UpdateCounterSchema.actionFrom({
    inputs,
    signature,
    msgSender: wallet.address,
  });
  const ack = await mru.submitAction("increment", incrementAction);
  console.log(ack.hash);
  return res.send({ state: machine.state});
});

app.get("/", (_req: Request, res: Response) => {
  return res.send({ state: machine.state });
});

app.listen(4001, () => {
  console.log('Server started on port 4001');
});
