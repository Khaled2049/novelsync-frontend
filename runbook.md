# Local E2E Runbook

Order to reproduce a working local ETH tip flow.

## One-command flow (Anvil + deploy)

From `novelsync-frontend`:

```bash
./scripts/local-anvil-deploy.sh --kill-port
```

This will:

- kill any process on port `8545` (if running),
- start Anvil on `127.0.0.1:8545`,
- deploy `TippingPlatform` from `../contracts`,
- print the deployed contract address and frontend `.env` values to use.

If you only want to start Anvil (no deploy):

```bash
./scripts/local-anvil-deploy.sh --kill-port --no-deploy
```

If you only want to kill the Anvil port and exit:

```bash
./scripts/local-anvil-deploy.sh --kill-only
```

## 1) Start a fresh Anvil session

```bash
anvil --host 127.0.0.1 --port 8545
```

Keep this terminal open. If this process stops, your local chain state is gone.

## 2) Deploy contract from `../contracts`

In another terminal:

```bash
cd ../contracts
```

Set deploy env in `../contracts/.env` (or export in shell):

```dotenv
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
INITIAL_FEE_BPS=1000
MINIMUM_TIP_AMOUNT=1000000000000000
```

Deploy:

```bash
bun run deploy:broadcast
```

You should see:

- `TippingPlatform deployed at: 0x...`
- `Platform fee bps: 1000`
- `Minimum tip amount: 1000000000000000`

## 3) Verify deployment quickly

Still in `../contracts`:

```bash
set -a; . ./.env; set +a
CONTRACT_ADDRESS=<PASTE_DEPLOYED_ADDRESS>

cast call $CONTRACT_ADDRESS "owner()(address)" --rpc-url $RPC_URL
cast call $CONTRACT_ADDRESS "platformFeeBps()(uint256)" --rpc-url $RPC_URL
cast call $CONTRACT_ADDRESS "minimumTipAmount()(uint256)" --rpc-url $RPC_URL
```

Expected:

- owner = Anvil account `#0` (`0xf39F...2266`)
- fee bps = `1000`
- min tip = `1000000000000000`

## 4) Wire frontend env to the same chain/contract

In `novelsync-frontend/.env`:

```dotenv
VITE_TIPPING_CONTRACT_ADDRESS=<PASTE_DEPLOYED_ADDRESS>
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
VITE_USDC_TOKEN_ADDRESS=
```

Notes:

- Keep `VITE_USDC_TOKEN_ADDRESS` empty for ETH-only local testing.
- This avoids ERC20 metadata calls (`decimals()`) on wrong addresses.
- Restart Vite after any `.env` changes.

## 5) Start frontend

```bash
cd ../novelsync-frontend
yarn dev
```

In wallet:

- Network must be chain `31337`
- Sender should be funded Anvil account (for example account `#2`)

## 6) Verify 20 ETH tip on-chain (deterministic check)

This reproduces the same contract call the frontend ETH tip uses (`tipAuthor`).

Quick path (recommended):

```bash
./scripts/local-e2e-tip.sh --contract <DEPLOYED_CONTRACT_ADDRESS>
```

Manual path:

```bash
RPC=http://127.0.0.1:8545
CONTRACT=<DEPLOYED_CONTRACT_ADDRESS>
SENDER=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
SENDER_PK=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
AUTHOR=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
OWNER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

cast balance $SENDER --rpc-url $RPC
cast balance $AUTHOR --rpc-url $RPC
cast balance $OWNER --rpc-url $RPC

cast send $CONTRACT "tipAuthor(address,string)" $AUTHOR "story-e2e-20eth" \
  --value 20ether \
  --private-key $SENDER_PK \
  --rpc-url $RPC

cast balance $SENDER --rpc-url $RPC
cast balance $AUTHOR --rpc-url $RPC
cast balance $OWNER --rpc-url $RPC
```

Expected result for a successful 20 ETH tip with 10% fee:

- author balance increases by `18 ETH`
- owner (platform) balance increases by `2 ETH`
- sender decreases by `20 ETH + gas`
