#!/usr/bin/env bash
# scripts/invoke_load_initial_data.sh

set -euo pipefail

# ---------------- Variables ----------------

# Get the FUNCTION_NAME from the first argument
if [ $# -lt 1 ]; then
  echo "Usage: $0 <LoadInitialDataFunctionName>"
  exit 1
fi
FUNCTION_NAME="$1"
PAYLOAD_FILE="scripts/initial_data_payload.json"

# FUNCTION_NAME="LoadInitialDataToDynamoDB"
PAYLOAD_FILE="scripts/initial_data_payload.json"
OUTPUT_FILE="scripts/lambda_output.json"
AWS_REGION=$(aws configure get region)

echo "→ Invoking Lambda: $FUNCTION_NAME"

# 1) Invoke the Lambda function:
#    - save the JSON payload to OUTPUT_FILE
#    - extract only the StatusCode into the STATUS_CODE variable
STATUS_CODE=$(aws lambda invoke \
  --function-name "$FUNCTION_NAME" \
  --invocation-type RequestResponse \
  --cli-binary-format raw-in-base64-out \
  --payload file://"$PAYLOAD_FILE" \
  --region "$AWS_REGION" \
  --query 'StatusCode' \
  --output text \
  "$OUTPUT_FILE")
AWS_EXIT=$?

# 2) Check if the AWS CLI invocation failed
if [ $AWS_EXIT -ne 0 ]; then
  echo "✖ AWS CLI error (exit code $AWS_EXIT)"
  exit $AWS_EXIT
fi

# 3) Display the StatusCode and the function payload
echo "✔ Lambda returned status code: $STATUS_CODE"
echo "Function payload (raw JSON):"
if command -v jq >/dev/null; then
  # pretty-print with jq if available
  jq . "$OUTPUT_FILE"
else
  # fallback: just cat the raw file
  cat "$OUTPUT_FILE"
fi

# 4) Determine overall success based on the HTTP status code
if [ "$STATUS_CODE" -eq 200 ]; then
  exit 0
else
  exit 1
fi


# chmod +x scripts/invoke_load_initial_data.sh
# ./scripts/invoke_load_initial_data.sh