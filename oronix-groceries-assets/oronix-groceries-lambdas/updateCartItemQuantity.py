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
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj

# Initialize DynamoDB connection
dynamodb = boto3.resource('dynamodb')
cart_table = dynamodb.Table(os.environ['CART_TABLE'])

def lambda_handler(event, context):
    try:
        # Extract userId from Cognito token
        user_id = event['requestContext']['authorizer']['claims']['sub']
        body = json.loads(event['body'])

        item_id = body.get('itemId')
        quantity = body.get('quantity')

        if not item_id or quantity is None:
            return response_with_cors(400, "Missing itemId or quantity")

        # Convert to int
        item_id = int(item_id)
        quantity = int(quantity)

        if quantity <= 0:
            # Remove item if quantity is 0 or negative
            cart_table.delete_item(
                Key={'userId': user_id, 'itemId': item_id}
            )
            return response_with_cors(200, "Item removed from cart due to zero or negative quantity")

        # Update item quantity
        cart_table.update_item(
            Key={'userId': user_id, 'itemId': item_id},
            UpdateExpression='SET quantity = :q',
            ExpressionAttributeValues={':q': quantity}
        )

        return response_with_cors(200, "Cart item quantity updated", {
            'userId': user_id,
            'itemId': item_id,
            'quantity': quantity
        })

    except Exception as e:
        return response_with_cors(500, "Failed to update quantity", str(e))

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