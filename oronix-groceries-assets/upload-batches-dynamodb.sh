#!/usr/bin/env bash
set -euo pipefail

# AWS region where your DynamoDB table is deployed
REGION="eu-west-1"

# Directory containing the batch JSON files
BATCH_DIR="data-dynamodb/data-batches-items"

# Loop through each JSON file in the batch directory and upload it
for file in "$BATCH_DIR"/*.json; do
  echo "Uploading batch file: $file..."
  aws dynamodb batch-write-item \
    --request-items file://"$file" \
    --region "$REGION"
done

echo "✅ All batch files uploaded successfully!"

# chmod +x upload-batches-dynamodb.sh
# ./upload-batches-dynamodb.sh