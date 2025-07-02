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
    return obj

# Initialize DynamoDB connection
dynamodb = boto3.resource('dynamodb')
cart_table = dynamodb.Table(os.environ['CART_TABLE_NAME'])

def lambda_handler(event, context):
    try:
        # Try to extract userId from Cognito token
        user_id = event['requestContext']['authorizer']['claims']['sub']

        # Parse request body
        body = json.loads(event['body'])
        item_id = body.get('itemId')

        if not item_id:
            return response_with_cors(400, "Missing itemId")
        
        # Convert to int if required by the table schema
        item_id = int(item_id)

        # Check if item already exists in the cart
        response = cart_table.get_item(Key={
            'userId': user_id,
            'itemId': item_id
        })

        if 'Item' in response:
            # Item exists → update quantity (+1)
            current_quantity = response['Item'].get('quantity', 1)
            new_quantity = current_quantity + 1
        else:
            # Item does not exist → set quantity = 1
            new_quantity = 1

        # Put the item with updated quantity
        cart_table.put_item(Item={
            'userId': user_id,
            'itemId': item_id,
            'quantity': new_quantity
        })

        return response_with_cors(200, "Item added to cart", convert_decimals({
            'userId': user_id,
            'itemId': item_id,
            'quantity': new_quantity
        }))

    except Exception as e:
        return response_with_cors(500, "Failed to add item to cart", str(e))

# Standardized CORS response
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