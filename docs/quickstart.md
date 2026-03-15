# Quickstart

Use this when you need the frontend running locally as quickly as possible.

## Prerequisites

- Node.js 22 for parity with Firebase Functions
- Yarn
- a `.env` file in the repo root

## Install

```bash
yarn install
```

## Minimal local env

Create `.env` and set the Firebase values your app needs, plus the active chain configuration:

```dotenv
VITE_APP_NAME=ScribeOS
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGE_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
VITE_TIPPING_CONTRACT_ADDRESS=0x...
VITE_USDC_TOKEN_ADDRESS=
VITE_MAX_AI_USAGE=1000
```

The codebase also supports per-chain variables such as `VITE_ANVIL_RPC_URL`, `VITE_SEPOLIA_RPC_URL`, `VITE_TIPPING_CONTRACT_ADDRESS_ANVIL`, and the matching token-address variants.

## Start the app

```bash
yarn dev
```

The Vite app runs on `http://localhost:5173`.

## Useful local commands

```bash
yarn lint
yarn build
yarn preview
yarn start:emulator
```

## Related repos

- smart contracts: `../contracts`
- agent service: `../novelsync-agents`

Run the agent service from `../novelsync-agents`; the `start:agent` script in this repo is stale.
