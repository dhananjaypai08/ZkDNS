# rollup

Project initialized using [@stackr/sdk](https://www.stackrlabs.xyz/)

## Project structure

```bash
.
├── .env.example
├── .gitignore
├── Dockerfile
├── genesis-state.json
├── package-lock.json
├── package.json
├── src
│   ├── index.ts ## -> starting point, everything gets imported here.
│   ├── server.ts ## -> server setup if any in the example.
│   ├── cli.ts ## -> CLI interaction setup if any in the example.
│   ├── contract ## -> place to keep your utility Contracts like Hook and Bridge
│   │   └──Contract.sol 
│   ├── stackr
│       ├── machine.ts ## -> preferred place to keep your State Machine(s) and export from
│       ├── mru.ts ## -> place to initialize your MicroRollup
│       ├── schemas.ts ## -> one place to create and export all schemas from
│       ├── state.ts ## -> file to define your State class, can be omitted if state is trivial.
│       └── transitions.ts ## -> one place to store all your transitions & hooks _(hooks can have seaprate hooks.ts file too.)_
├── stackr.config.ts
├── tests
│   └── some.test.ts
└── tsconfig.json
```

Note: Some files are specific to certain examples, as mentioned in the tree above.

## How to run?

### Run using Node.js :rocket:

```bash
npm start
```

### Run using Docker :whale:

- Build the image using the following command:

```bash
# For Linux
docker build -t rollup:latest .

# For Mac with Apple Silicon chips
docker buildx build --platform linux/amd64,linux/arm64 -t rollup:latest .
```

- Run the Docker container using the following command:

```bash
# If using SQLite as the datastore
docker run --env-file .env -v ./db.sqlite:/app/db.sqlite -p <HOST_PORT>:<CONTAINER_PORT> --name=rollup -it rollup:latest

# If using other URI based datastores
docker run --env-file .env -p <HOST_PORT>:<CONTAINER_PORT> --name=rollup -it rollup:latest
```

## Playground Plugin

To leverage examples and test the SDK, you can use Stackr's Playground hosted at: [https://playground.stackrlabs.xyz](https://playground.stackrlabs.xyz).

In you application, add Playground by importing the following:

```ts
import { Playground } from "@stackr/sdk/plugins";
 
const rollup = ...
await rollup.init();
 
Playground.init(rollup);
// this will start a server at http://localhost:42069, which is taken as input by the Playground
```

Full instructions can be found at [here](https://docs.stf.xyz/build/plugins/playground)

## Vulcan Explorer

To explore your submitted blocks and batches, you can use the Vulcan Explorer hosted at: [https://explorer.vulcan.stf.xyz/](https://explorer.vulcan.stf.xyz/).
