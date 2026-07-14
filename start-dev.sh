#!/usr/bin/env bash
# Starts the backend and frontend dev servers together and waits for the
# backend to actually be ready. Tries to clean up on Ctrl+C, but signal
# delivery to a backgrounded npm/nodemon/vite tree is unreliable on Windows/Git
# Bash (verified: even a direct SIGTERM to this script's own PID didn't
# trigger the trap below) — if Ctrl+C leaves something running, use
# ./stop-dev.sh, which kills by port instead of relying on signals at all.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_PORT=4000
FRONTEND_PORT=5173

BACKEND_PID=""
FRONTEND_PID=""

# `kill $!` only stops the immediate shell Git Bash spawned — nodemon/vite fork
# further node.exe children that survive it and keep the port bound. Killing by
# whatever's actually LISTENING on the port is what reliably works on Windows.
kill_port() {
  local port=$1
  local pids
  pids=$(netstat -ano 2>/dev/null | grep ":${port} " | grep LISTENING | awk '{print $NF}' | sort -u)
  for p in $pids; do
    taskkill //F //PID "$p" >/dev/null 2>&1
  done
}

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill_port "$BACKEND_PORT"
  kill_port "$FRONTEND_PORT"
  kill_port "$((FRONTEND_PORT + 1))" # Vite's most common fallback port if 5173 was busy
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" 2>/dev/null
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  exit 0
}
trap cleanup INT TERM

# A stray process squatting on 5173 has broken KDS realtime before (Vite falls
# back to 5174, which the backend's CLIENT_ORIGIN CORS setting doesn't allow) —
# warn early instead of leaving that to be rediscovered via a silent failure.
check_port() {
  local port=$1
  local label=$2
  if command -v netstat >/dev/null 2>&1; then
    # Column order is Proto/Local/Foreign/State — port comes BEFORE "LISTENING",
    # so match the port first, then confirm LISTENING appears anywhere in that line.
    if netstat -ano 2>/dev/null | grep ":${port} " | grep -q LISTENING; then
      echo "Warning: port $port ($label) already appears to be in use." >&2
      echo "  If this is a leftover process, free it first: netstat -ano | grep \":$port \" then taskkill //F //PID <pid>" >&2
    fi
  fi
}
check_port "$BACKEND_PORT" backend
check_port "$FRONTEND_PORT" frontend

echo "Starting backend on http://localhost:$BACKEND_PORT ..."
(cd "$BACKEND_DIR" && npm run dev) &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:$FRONTEND_PORT ..."
(cd "$FRONTEND_DIR" && npm run dev) &
FRONTEND_PID=$!

echo -n "Waiting for backend to respond"
for _ in $(seq 1 30); do
  if curl -sf "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
    echo " ready."
    break
  fi
  echo -n "."
  sleep 1
done

echo ""
echo "Backend:  http://localhost:$BACKEND_PORT"
echo "Frontend: http://localhost:$FRONTEND_PORT (check its own log line above — Vite may pick a different port if 5173 was busy)"
echo ""
echo "Press Ctrl+C to stop both (or run ./stop-dev.sh from another terminal if that doesn't fully stop them)."

wait
