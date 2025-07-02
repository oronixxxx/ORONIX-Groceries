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
categories_table = dynamodb.Table(os.environ['CATEGORIES_TABLE_NAME'])

def lambda_handler(event, context):
    try:
        response = categories_table.scan()
        categories = response.get('Items', [])
        return response_with_cors(200, "Categories fetched successfully", convert_decimals(categories))
    except Exception as e:
        return response_with_cors(500, "Failed to fetch categories", str(e))

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