#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/local-anvil-deploy.sh [options]

Options:
  --kill-port                 Kill existing process(es) bound to the Anvil port before start
  --kill-only                 Kill existing process(es) on the port, then exit
  --host <host>               Anvil host (default: 127.0.0.1)
  --port <port>               Anvil port (default: 8545)
  --contracts-dir <path>      Contracts directory (default: ../contracts)
  --private-key <hex>         Deployer private key (default: Anvil account #0 key)
  --initial-fee-bps <num>     Platform fee bps (default: 1000)
  --minimum-tip-amount <wei>  Minimum tip amount in wei (default: 1000000000000000)
  --anvil-log <path>          Anvil log path (default: /tmp/anvil-<port>.log)
  --no-deploy                 Only start Anvil, skip deployment
  -h, --help                  Show this help

Examples:
  scripts/local-anvil-deploy.sh --kill-only
  scripts/local-anvil-deploy.sh --kill-port
  scripts/local-anvil-deploy.sh --kill-port --port 8545 --contracts-dir ../contracts
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

HOST="127.0.0.1"
PORT="8545"
CONTRACTS_DIR="../contracts"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
INITIAL_FEE_BPS="1000"
MINIMUM_TIP_AMOUNT="1000000000000000"
ANVIL_LOG=""
KILL_PORT="false"
NO_DEPLOY="false"
KILL_ONLY="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --kill-port)
      KILL_PORT="true"
      shift
      ;;
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --kill-only)
      KILL_ONLY="true"
      KILL_PORT="true"
      shift
      ;;
    --port)
      PORT="${2:-}"
      shift 2
      ;;
    --contracts-dir)
      CONTRACTS_DIR="${2:-}"
      shift 2
      ;;
    --private-key)
      PRIVATE_KEY="${2:-}"
      shift 2
      ;;
    --initial-fee-bps)
      INITIAL_FEE_BPS="${2:-}"
      shift 2
      ;;
    --minimum-tip-amount)
      MINIMUM_TIP_AMOUNT="${2:-}"
      shift 2
      ;;
    --anvil-log)
      ANVIL_LOG="${2:-}"
      shift 2
      ;;
    --no-deploy)
      NO_DEPLOY="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_cmd anvil
require_cmd curl

if [[ "$NO_DEPLOY" != "true" ]]; then
  require_cmd bun
fi

if [[ -z "$ANVIL_LOG" ]]; then
  ANVIL_LOG="/tmp/anvil-${PORT}.log"
fi

if [[ ! -d "$CONTRACTS_DIR" ]]; then
  echo "Contracts directory not found: $CONTRACTS_DIR" >&2
  exit 1
fi

if [[ "$KILL_PORT" == "true" ]]; then
  if command -v lsof >/dev/null 2>&1; then
    EXISTING_PIDS="$(lsof -ti tcp:"$PORT" || true)"
    if [[ -n "$EXISTING_PIDS" ]]; then
      echo "Killing process(es) on port $PORT: $EXISTING_PIDS"
      kill $EXISTING_PIDS || true
      sleep 1
      # force kill leftovers if needed
      LEFTOVER_PIDS="$(lsof -ti tcp:"$PORT" || true)"
      if [[ -n "$LEFTOVER_PIDS" ]]; then
        echo "Force killing remaining process(es): $LEFTOVER_PIDS"
        kill -9 $LEFTOVER_PIDS || true
      fi
    else
      echo "No process currently using port $PORT"
    fi
  else
    echo "lsof not found; cannot auto-kill port $PORT" >&2
    exit 1
  fi
fi

if [[ "$KILL_ONLY" == "true" ]]; then
  echo "Kill-only mode complete."
  exit 0
fi

if command -v lsof >/dev/null 2>&1; then
  if lsof -ti tcp:"$PORT" >/dev/null 2>&1; then
    echo "Port $PORT is already in use. Re-run with --kill-port." >&2
    exit 1
  fi
fi

echo "Starting Anvil on $HOST:$PORT"
nohup anvil --host "$HOST" --port "$PORT" >"$ANVIL_LOG" 2>&1 &
ANVIL_PID=$!
echo "Anvil PID: $ANVIL_PID"
echo "Anvil log: $ANVIL_LOG"

RPC_URL="http://${HOST}:${PORT}"
echo "Waiting for Anvil RPC at $RPC_URL ..."
for _ in $(seq 1 40); do
  if curl -sS "$RPC_URL" \
    -H 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
    >/dev/null 2>&1; then
    echo "Anvil is ready"
    break
  fi
  sleep 0.25
done

if ! curl -sS "$RPC_URL" \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  >/dev/null 2>&1; then
  echo "Anvil failed to become ready. Check logs: $ANVIL_LOG" >&2
  exit 1
fi

if [[ "$NO_DEPLOY" == "true" ]]; then
  echo "Skipping deploy (--no-deploy set)"
  exit 0
fi

echo "Deploying contract from: $CONTRACTS_DIR"
DEPLOY_OUTPUT="$(
  cd "$CONTRACTS_DIR"
  RPC_URL="$RPC_URL" \
  PRIVATE_KEY="$PRIVATE_KEY" \
  INITIAL_FEE_BPS="$INITIAL_FEE_BPS" \
  MINIMUM_TIP_AMOUNT="$MINIMUM_TIP_AMOUNT" \
  bun run deploy:broadcast
)"
echo "$DEPLOY_OUTPUT"

DEPLOYED_ADDRESS="$(
  printf "%s\n" "$DEPLOY_OUTPUT" \
    | sed -n 's/.*TippingPlatform deployed at:[[:space:]]*\(0x[a-fA-F0-9]\{40\}\).*/\1/p' \
    | head -n1
)"

if [[ -z "$DEPLOYED_ADDRESS" ]]; then
  DEPLOYED_ADDRESS="$(
    printf "%s\n" "$DEPLOY_OUTPUT" \
      | sed -n 's/.*deployed: contract TippingPlatform[[:space:]]*\(0x[a-fA-F0-9]\{40\}\).*/\1/p' \
      | head -n1
  )"
fi

if [[ -z "$DEPLOYED_ADDRESS" ]]; then
  echo "Deployment completed, but could not parse contract address from output." >&2
  exit 1
fi

echo
echo "Deployment successful."
echo "CONTRACT_ADDRESS=$DEPLOYED_ADDRESS"
echo
echo "Frontend .env values:"
echo "VITE_TIPPING_CONTRACT_ADDRESS=$DEPLOYED_ADDRESS"
echo "VITE_CHAIN_ID=31337"
echo "VITE_RPC_URL=$RPC_URL"
echo "VITE_USDC_TOKEN_ADDRESS="
