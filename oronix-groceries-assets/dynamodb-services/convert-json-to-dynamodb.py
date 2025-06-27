import os
import json
from decimal import Decimal
from boto3.dynamodb.types import TypeSerializer

# oronix_items.json, oronix_categories.json, oronix_colors.json

# Path to your input JSON (array of plain Python objects)
input_file = '../../data/oronix_items.json'
# Desired output file with DynamoDB JSON format
output_file = '../data-dynamodb/oronix_items_ddb.json'
# Name of your DynamoDB table
table_name = 'Items'

# Serializer to convert Python types to DynamoDB attribute values
serializer = TypeSerializer()

# Load the JSON, parsing any floats into Decimal
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f, parse_float=Decimal)

# Transform each item to DynamoDB JSON for batch-write-item
ddb_items = []
for item in data:
    # serializer.serialize(item) -> {'M': {'attr1': {'S': '...'}, ...}}
    ddb_item = serializer.serialize(item)['M']
    ddb_items.append({
        "PutRequest": {
            "Item": ddb_item
        }
    })

# Wrap in the batch-write format under the table name
batch_request = {table_name: ddb_items}

# Write to output file
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(batch_request, f, indent=2, ensure_ascii=False)

print(f"Converted {len(ddb_items)} items to DynamoDB JSON format and saved to:\n  {output_file}")

# python convert-json-to-dynamodb.py
