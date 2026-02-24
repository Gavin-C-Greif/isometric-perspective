#!/bin/bash
# Minimal Ralph loop: each run asks Cursor to read CURSOR.md and do one iteration.
# Usage: ./ralph.sh [max_iterations]

set -e

MAX_ITERATIONS="${1:-10}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT="Read CURSOR.md in this directory and follow the instructions exactly."

AGENT_CMD=""
if command -v agent >/dev/null 2>&1; then
  AGENT_CMD="$(command -v agent)"
elif command -v cursor-agent >/dev/null 2>&1; then
  AGENT_CMD="$(command -v cursor-agent)"
elif [ -n "${LOCALAPPDATA:-}" ]; then
  for candidate in \
    "$LOCALAPPDATA/cursor-agent/agent.exe" \
    "$LOCALAPPDATA/cursor-agent/agent.cmd" \
    "$LOCALAPPDATA/cursor-agent/agent" \
    "$LOCALAPPDATA/cursor-agent/cursor-agent.exe" \
    "$LOCALAPPDATA/cursor-agent/cursor-agent.cmd" \
    "$LOCALAPPDATA/cursor-agent/cursor-agent"; do
    if [ -x "$candidate" ] || [ -f "$candidate" ]; then
      AGENT_CMD="$candidate"
      break
    fi
  done
fi

if [ -z "$AGENT_CMD" ]; then
  echo "Error: Could not find Cursor CLI command ('agent' or 'cursor-agent')."
  exit 1
fi

echo "Starting Ralph - Max iterations: $MAX_ITERATIONS"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  (
    cd "$SCRIPT_DIR"
    printf '%s\n' "$PROMPT" | "$AGENT_CMD" -p --force --output-format stream-json || true
  )
done
