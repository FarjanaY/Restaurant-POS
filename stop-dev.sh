#!/usr/bin/env bash
# Force-stops whatever is listening on the dev ports. A standalone companion to
# start-dev.sh — on Windows/Git Bash, Ctrl+C's signal doesn't reliably reach a
# backgrounded npm/nodemon/vite process tree (verified: even a direct SIGTERM to
# start-dev.sh's own PID didn't trigger its cleanup trap), so this is the
# dependable way to actually free the ports rather than relying on the trap.
set -uo pipefail

PORTS=(4000 5173 5174)

for port in "${PORTS[@]}"; do
  pids=$(netstat -ano 2>/dev/null | grep ":${port} " | grep LISTENING | awk '{print $NF}' | sort -u)
  if [[ -z "$pids" ]]; then
    continue
  fi
  for pid in $pids; do
    echo "Stopping PID $pid on port $port"
    taskkill //F //PID "$pid" >/dev/null 2>&1
  done
done

echo "Done."
