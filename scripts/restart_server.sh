#!/usr/bin/env bash
# Safe restart script: kill only processes running server.js and start again with nohup
set -euo pipefail
WORKDIR="/var/www/html/cukong/be"
cd "$WORKDIR"
# Find PIDs of node processes running server.js (exact match)
PIDS=$(pgrep -af "node .*server.js" | awk '{print $1}') || true
if [ -n "$PIDS" ]; then
  echo "Stopping server.js PIDs: $PIDS"
  echo "$PIDS" | xargs -r kill
  sleep 1
fi
# Start server with nohup
nohup node server.js > server.log 2>&1 &
NEWPID=$!
echo "$NEWPID"
# Optionally tail the last few lines of log
sleep 0.5
if [ -f server.log ]; then
  tail -n 20 server.log
fi
