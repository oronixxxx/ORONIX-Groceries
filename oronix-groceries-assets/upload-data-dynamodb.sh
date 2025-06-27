#!/usr/bin/env bash
set -euo pipefail

# AWS region and table configuration
REGION="eu-west-1"
TABLE="Items"

# Path to the DynamoDB JSON batch file
BATCH_FILE="data-dynamodb/oronix_items_ddb.json"

# How long to pause between each PutItem call (seconds)
SLEEP_INTERVAL=0.2

# Maximum number of retries per item on throttling errors
MAX_RETRIES=5

# Extract the plain Item objects and upload one by one
jq -c ".\"$TABLE\"[] .PutRequest.Item" "$BATCH_FILE" | while read -r ITEM; do
  echo "Uploading item: $ITEM"
  attempt=1

  # Retry loop with exponential backoff
  until aws dynamodb put-item \
         --table-name "$TABLE" \
         --item "$ITEM" \
         --region "$REGION" \
         --retry-mode adaptive \
         --max-attempts 3; do
    if (( attempt >= MAX_RETRIES )); then
      echo "❌ Failed to upload item after $attempt attempts: $ITEM"
      break
    fi
    backoff=$(( 2**attempt ))
    echo "⚠️ Throttled or error, retry #$attempt after $backoff sec"
    sleep "$backoff"
    ((attempt++))
  done

  # brief pause to avoid bursting too many requests
  sleep "$SLEEP_INTERVAL"
done

echo "✅ All items processed."

# chmod +x upload-data-dynamodb.sh
# ./upload-data-dynamodb.sh