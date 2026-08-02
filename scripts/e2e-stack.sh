#!/usr/bin/env bash
#
# Bring up the full NovelSync stack against local emulators and run the Cypress
# E2E suite headlessly, then tear everything down. Mirrors story/dev.sh but is
# non-interactive and CI-friendly.
#
#   Firestore emulator : 8080      creditProxy gateway : 8090 (mock LLM)
#   Auth emulator      : 9099      agent (FastAPI)      : 8000
#   Functions emulator : 5001      Vite dev server      : 5173
#
# Usage:
#   ./scripts/e2e-stack.sh                 # run all specs headless
#   ./scripts/e2e-stack.sh --open          # leave stack up + open Cypress UI
#   CYPRESS_SPEC=cypress/e2e/ai_chat.cy.ts ./scripts/e2e-stack.sh
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$FRONTEND_DIR/.." && pwd)"
AGENTS_DIR="$ROOT_DIR/taleTribe-agents"
CREDIT_DIR="$ROOT_DIR/creditProxy"

CREDIT_PROXY_PORT="${CREDIT_PROXY_PORT:-8090}"
OPEN_MODE="false"
[ "${1:-}" = "--open" ] && OPEN_MODE="true"

PIDS=()
STARTED_CREDIT="false"  # only tear down docker if we brought it up

cleanup() {
  echo ""
  echo "Shutting down E2E stack..."
  for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  if [ "$STARTED_CREDIT" = "true" ]; then
    (cd "$CREDIT_DIR" && CREDIT_PROXY_PORT="$CREDIT_PROXY_PORT" docker compose \
      -f docker-compose.yml -f docker-compose.override.yml down 2>/dev/null || true)
  fi
}
trap cleanup EXIT

# Returns 0 if the service is already responding (reuse it, don't start a new one).
is_up() {
  curl -sf "$1" >/dev/null 2>&1
}

wait_for() {
  local url="$1" label="$2" tries="${3:-120}"
  echo "Waiting for $label..."
  until curl -sf "$url" >/dev/null 2>&1; do
    tries=$((tries - 1))
    [ "$tries" -le 0 ] && { echo "Timed out waiting for $label ($url)"; exit 1; }
    sleep 1
  done
  echo "$label ready."
}

# 1. creditProxy — gateway on :8090 (avoids the Firestore emulator's :8080),
#    LLM_PROVIDER=mock => deterministic, key-free generations.
if is_up "http://localhost:$CREDIT_PROXY_PORT/health"; then
  echo "creditProxy already up on :$CREDIT_PROXY_PORT — reusing it."
else
  echo "Starting creditProxy (mock LLM) on :$CREDIT_PROXY_PORT..."
  STARTED_CREDIT="true"
  CREDIT_PROXY_PORT="$CREDIT_PROXY_PORT" LLM_PROVIDER=mock docker compose \
    -f "$CREDIT_DIR/docker-compose.yml" \
    -f "$CREDIT_DIR/docker-compose.override.yml" \
    up --build -d
  wait_for "http://localhost:$CREDIT_PROXY_PORT/health" "creditProxy gateway"
fi

# 2. Firebase emulators (functions/firestore/auth/storage + UI on :4000).
if is_up "http://localhost:4000"; then
  echo "Firebase emulators already up on :4000 — reusing them."
else
  echo "Starting Firebase emulators..."
  (cd "$FRONTEND_DIR" && yarn start:emulator) &
  PIDS+=($!)
  wait_for "http://localhost:4000" "Firebase emulators"
fi

# 3. taleTribe-agents — USE_MOCK=true keeps embeddings deterministic/offline;
#    AGENT_SERVICE_URL on the functions side defaults to localhost:8000.
if is_up "http://localhost:8000/health"; then
  echo "taleTribe-agents already up on :8000 — reusing it."
else
  echo "Starting taleTribe-agents on :8000..."
  (
    cd "$AGENTS_DIR"
    # shellcheck disable=SC1091
    [ -f venv/bin/activate ] && source venv/bin/activate
    CREDIT_PROXY_URL="http://localhost:$CREDIT_PROXY_PORT" \
    GOOGLE_CLOUD_PROJECT=story-6f89f \
    USE_MOCK=true \
    FIRESTORE_EMULATOR_HOST=localhost:8080 \
    CORS_ORIGINS='["http://localhost:5173"]' \
    python server.py
  ) &
  PIDS+=($!)
  wait_for "http://localhost:8000/health" "taleTribe-agents"
fi

# 4. Vite dev server (development mode => Firebase Web SDK wires to emulators).
if is_up "http://localhost:5173"; then
  echo "Vite dev server already up on :5173 — reusing it."
else
  echo "Starting Vite dev server on :5173..."
  (cd "$FRONTEND_DIR" && yarn dev) &
  PIDS+=($!)
  wait_for "http://localhost:5173" "Vite dev server"
fi

# 5. Cypress.
cd "$FRONTEND_DIR"
if [ "$OPEN_MODE" = "true" ]; then
  echo "Stack is up. Opening Cypress UI (Ctrl+C to tear down)..."
  yarn cy:open
else
  if [ -n "${CYPRESS_SPEC:-}" ]; then
    yarn cy:run --spec "$CYPRESS_SPEC"
  else
    yarn cy:run
  fi
fi
