# Setup

This page covers local development setup for the frontend and the Firebase emulators.

## Tooling

- Node.js 22
- Yarn
- Firebase CLI if you want to run emulators manually

## Install

```bash
yarn install
```

Functions dependencies are installed through the repo root workflow and Firebase predeploy steps when needed.

## Root environment

Create `.env` in the repo root. Common values:

```dotenv
VITE_APP_NAME=thetaletribe
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGE_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

VITE_CHAIN_ID=31337
VITE_ANVIL_RPC_URL=http://127.0.0.1:8545
VITE_SEPOLIA_RPC_URL=https://your-sepolia-rpc-url
VITE_MAINNET_RPC_URL=https://your-mainnet-rpc-url

VITE_TIPPING_CONTRACT_ADDRESS_ANVIL=0x...
VITE_TIPPING_CONTRACT_ADDRESS_SEPOLIA=0x...
VITE_TIPPING_CONTRACT_ADDRESS_MAINNET=0x...

VITE_USDC_TOKEN_ADDRESS_ANVIL=0x...
VITE_USDC_TOKEN_ADDRESS_SEPOLIA=0x...
VITE_USDC_TOKEN_ADDRESS_MAINNET=0x...

VITE_RPC_URL=http://127.0.0.1:8545
VITE_TIPPING_CONTRACT_ADDRESS=0x...
VITE_USDC_TOKEN_ADDRESS=
VITE_MAX_AI_USAGE=1000
```

The app supports both per-chain variables and the legacy fallback keys.

## Run the frontend

```bash
yarn dev
```

## Run Firebase emulators

```bash
yarn start:emulator
```

`firebase.json` configures local emulator ports for hosting, auth, functions, firestore, storage, database, and pubsub.

## Functions

Useful commands inside this repo:

```bash
npm run build --prefix functions
npm run emulator --prefix functions
npm run deploy --prefix functions
```

The current Cloud Functions runtime target is Node.js 22.

## Agent service dependency

Some frontend flows depend on the sibling `novelsync-agents` service. Run that service separately from `../novelsync-agents` when testing integrations that hit the agent backend.
