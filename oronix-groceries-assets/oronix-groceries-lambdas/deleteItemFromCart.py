import json
import boto3
import os
from boto3.dynamodb.conditions import Key
from decimal import Decimal

# Convert decimals
def convert_decimals(obj):
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj

# Initialize DynamoDB connection 
dynamodb = boto3.resource('dynamodb')
cart_table = dynamodb.Table(os.environ['CART_TABLE_NAME'])

def lambda_handler(event, context):
    try:
        # Get userId from Cognito
        user_id = event['requestContext']['authorizer']['claims']['sub']

        # Extract item id
        item_id = None
        if event['httpMethod'] == 'DELETE':
            body = json.loads(event.get('body', '{}'))
            item_id = body.get('itemId')

        if not item_id:
            return response_with_cors(400, "Missing itemId")

        # Delet item from user cart
        cart_table.delete_item(
            Key={
                'userId': user_id,
                'itemId': int(item_id)
            }
        )

        return response_with_cors(200, "Item deleted from cart successfully")

    except Exception as e:
        return response_with_cors(500, "Failed to delete item from cart", str(e))

# Standard CORS response
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