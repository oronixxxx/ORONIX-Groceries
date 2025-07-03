import os
import json
import boto3
from decimal import Decimal
from boto3.dynamodb.types import TypeSerializer

# Initialize AWS clients
s3 = boto3.client('s3')
dynamo = boto3.client('dynamodb')
serializer = TypeSerializer()

# Environment variable holding the S3 bucket name where seed files reside
BUCKET = os.environ.get('ASSETS_BUCKET_NAME')

# Helper to split a list into chunks of given size
def chunked(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i+size]

# Convert a Python dict to DynamoDB attribute-value format
def serialize_item(item):
    return {k: serializer.serialize(v) for k, v in item.items()}

# Lambda entry point
# Expects event of form:
# {
#   "tables": [
#     { "table": "Colors",     "key": "oronix-groceries-data/colors.json"     },
#     { "table": "Categories", "key": "oronix-groceries-data/categories.json" },
#     { "table": "Items",      "key": "oronix-groceries-data/items.json"      }
#   ]
# }
def lambda_handler(event, context):
    results = {}

    if not BUCKET:
        return { 'statusCode': 500, 'body': 'Missing SEED_BUCKET environment variable.' }

    for mapping in event.get('tables', []):
        table_name = mapping.get('table')
        object_key = mapping.get('key')
        if not table_name or not object_key:
            continue

        # Fetch JSON data from S3
        response = s3.get_object(Bucket=BUCKET, Key=object_key)
        # Parse JSON using Decimal for numeric values to support DynamoDB
        data = json.loads(response['Body'].read(), parse_float=Decimal)

        # Batch write in chunks of 25
        count = 0
        for batch in chunked(data, 25):
            put_requests = []
            for item in batch:
                put_requests.append({ 'PutRequest': { 'Item': serialize_item(item) } })
                count += 1

            dynamo.batch_write_item(RequestItems={ table_name: put_requests })

        results[table_name] = count

    # Return the count of items seeded per table
    return {
        'statusCode': 200,
        'body': json.dumps(results)
    }
