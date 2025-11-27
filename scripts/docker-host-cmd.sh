#!/bin/bash
# Helper script to run commands on docker-host via SSH
# Usage: ./scripts/docker-host-cmd.sh "command to run"

set -e

HOST="docker-host"
CMD="$1"

if [ -z "$CMD" ]; then
    echo "Usage: $0 'command to run'"
    echo "Example: $0 'docker ps'"
    exit 1
fi

ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" "$CMD"
