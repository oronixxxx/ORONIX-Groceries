import json
import boto3
import os
from decimal import Decimal

# Convert decimals
def convert_decimals(obj):
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    else:
        return obj

# Initialize dynamoDB
dynamodb = boto3.resource('dynamodb')
items_table = dynamodb.Table(os.environ['ITEMS_TABLE_NAME'])

def lambda_handler(event, context):
    try:
        query_params = event.get('queryStringParameters', {})
        item_id = query_params.get('id') if query_params else None

        if not item_id:
            return response_with_cors(400, "Missing item ID")

        item_id = int(item_id)
        response = items_table.get_item(Key={'id': item_id})
        item = response.get('Item')

        if not item:
            return response_with_cors(404, "Item not found")

        return response_with_cors(200, "Item fetched successfully", convert_decimals(item))
    except Exception as e:
        return response_with_cors(500, "Failed to fetch item details", str(e))

def response_with_cors(status_code, message, body=None):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE"
        },
        "body": json.dumps({"message": message, "data": body} if body else {"message": message})
    }