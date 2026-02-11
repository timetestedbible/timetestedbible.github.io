#!/bin/bash
# run-batch.sh — Process all pending queue items sequentially
# Usage: cd timetested && ./pipeline/run-batch.sh

set -e
export $(cat .env | xargs)

echo "=== Pipeline Batch Runner ==="
echo ""

ITEMS_PROCESSED=0
MAX_ITEMS=${1:-20}  # default max 20 items, pass a number to override

while [ $ITEMS_PROCESSED -lt $MAX_ITEMS ]; do
  # Check if there are pending items
  PENDING=$(node -e "
    const q = JSON.parse(require('fs').readFileSync('pipeline/queue.json','utf-8'));
    console.log(q.items.filter(i => i.status === 'pending').length);
  ")
  
  if [ "$PENDING" = "0" ]; then
    echo ""
    echo "=== Queue empty. All items processed. ==="
    break
  fi
  
  echo ""
  echo "--- Item $((ITEMS_PROCESSED + 1)) (${PENDING} remaining) ---"
  
  node pipeline/run-agent.js
  
  ITEMS_PROCESSED=$((ITEMS_PROCESSED + 1))
  
  # Brief pause between API calls
  sleep 2
done

echo ""
echo "=== Batch complete. $ITEMS_PROCESSED items processed. ==="
echo ""
node pipeline/run-agent.js --status
