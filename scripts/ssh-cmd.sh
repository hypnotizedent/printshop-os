#!/bin/bash
# Quick SSH command runner with timeout
# Usage: ./ssh-cmd.sh <host> <command>

HOST="${1:-docker-host}"
shift
CMD="$*"

if [ -z "$CMD" ]; then
  echo "Usage: $0 <host> <command>"
  exit 1
fi

timeout 15 ssh -o BatchMode=yes -o ConnectTimeout=5 -o ServerAliveInterval=5 -o ServerAliveCountMax=2 "$HOST" "$CMD"
EXIT_CODE=$?

if [ $EXIT_CODE -eq 124 ]; then
  echo "⏱️ Command timed out after 15 seconds"
elif [ $EXIT_CODE -ne 0 ]; then
  echo "❌ SSH failed with exit code $EXIT_CODE"
fi

exit $EXIT_CODE
