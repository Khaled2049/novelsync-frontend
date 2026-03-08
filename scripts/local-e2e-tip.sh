#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/local-e2e-tip.sh --contract <address> [options]

Options:
  --contract <address>     Deployed TippingPlatform address (required)
  --rpc-url <url>          RPC URL (default: http://127.0.0.1:8545)
  --amount-eth <amount>    ETH amount to tip (default: 20)
  --story-id <id>          Story ID string (default: story-e2e-20eth)
  --sender <address>       Sender address (default: Anvil account #2)
  --sender-pk <hex>        Sender private key (default: Anvil account #2 key)
  --author <address>       Author/recipient address (default: Anvil account #1)
  --owner <address>        Platform owner address (default: Anvil account #0)
  -h, --help               Show this help

Example:
  scripts/local-e2e-tip.sh \
    --contract 0x5FbDB2315678afecb367f032d93F642f64180aa3
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

RPC_URL="http://127.0.0.1:8545"
CONTRACT=""
AMOUNT_ETH="20"
STORY_ID="story-e2e-20eth"
SENDER="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
SENDER_PK="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
AUTHOR="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
OWNER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --contract)
      CONTRACT="${2:-}"
      shift 2
      ;;
    --rpc-url)
      RPC_URL="${2:-}"
      shift 2
      ;;
    --amount-eth)
      AMOUNT_ETH="${2:-}"
      shift 2
      ;;
    --story-id)
      STORY_ID="${2:-}"
      shift 2
      ;;
    --sender)
      SENDER="${2:-}"
      shift 2
      ;;
    --sender-pk)
      SENDER_PK="${2:-}"
      shift 2
      ;;
    --author)
      AUTHOR="${2:-}"
      shift 2
      ;;
    --owner)
      OWNER="${2:-}"
      shift 2
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

if [[ -z "$CONTRACT" ]]; then
  echo "--contract is required" >&2
  usage
  exit 1
fi

require_cmd cast
require_cmd node

echo "== Local E2E Tip Check =="
echo "rpc_url=$RPC_URL"
echo "contract=$CONTRACT"
echo "sender=$SENDER"
echo "author=$AUTHOR"
echo "owner=$OWNER"
echo "amount_eth=$AMOUNT_ETH"
echo "story_id=$STORY_ID"
echo

echo "== Contract Config =="
cast call "$CONTRACT" "owner()(address)" --rpc-url "$RPC_URL" | sed 's/^/owner_onchain=/' 
cast call "$CONTRACT" "platformFeeBps()(uint256)" --rpc-url "$RPC_URL" | sed 's/^/platform_fee_bps=/' 
cast call "$CONTRACT" "minimumTipAmount()(uint256)" --rpc-url "$RPC_URL" | sed 's/^/minimum_tip_wei=/' 
echo

echo "== Balances Before =="
SB=$(cast balance "$SENDER" --rpc-url "$RPC_URL")
AB=$(cast balance "$AUTHOR" --rpc-url "$RPC_URL")
OB=$(cast balance "$OWNER" --rpc-url "$RPC_URL")
echo "sender_before_wei=$SB"
echo "author_before_wei=$AB"
echo "owner_before_wei=$OB"
echo

echo "== Sending tipAuthor tx =="
TX_OUTPUT=$(cast send "$CONTRACT" "tipAuthor(address,string)" "$AUTHOR" "$STORY_ID" \
  --value "${AMOUNT_ETH}ether" \
  --private-key "$SENDER_PK" \
  --rpc-url "$RPC_URL")
echo "$TX_OUTPUT"
echo

echo "== Balances After =="
SA=$(cast balance "$SENDER" --rpc-url "$RPC_URL")
AA=$(cast balance "$AUTHOR" --rpc-url "$RPC_URL")
OA=$(cast balance "$OWNER" --rpc-url "$RPC_URL")
echo "sender_after_wei=$SA"
echo "author_after_wei=$AA"
echo "owner_after_wei=$OA"
echo

echo "== Deltas =="
SB="$SB" AB="$AB" OB="$OB" SA="$SA" AA="$AA" OA="$OA" node <<'NODE'
const sb = BigInt(process.env.SB)
const ab = BigInt(process.env.AB)
const ob = BigInt(process.env.OB)
const sa = BigInt(process.env.SA)
const aa = BigInt(process.env.AA)
const oa = BigInt(process.env.OA)

const weiPerEth = 10n ** 18n
const formatEth = (v) => {
  const neg = v < 0n
  const x = neg ? -v : v
  const intPart = x / weiPerEth
  const fracPart = (x % weiPerEth).toString().padStart(18, "0").replace(/0+$/, "") || "0"
  return `${neg ? "-" : ""}${intPart}.${fracPart}`
}

const ds = sa - sb
const da = aa - ab
const do_ = oa - ob

console.log(`delta_sender_wei=${ds}`)
console.log(`delta_sender_eth=${formatEth(ds)}`)
console.log(`delta_author_wei=${da}`)
console.log(`delta_author_eth=${formatEth(da)}`)
console.log(`delta_owner_wei=${do_}`)
console.log(`delta_owner_eth=${formatEth(do_)}`)
NODE
echo

echo "Done."
echo "Expected for 10% fee: author +90% of tip, owner +10% of tip, sender -(tip + gas)."
