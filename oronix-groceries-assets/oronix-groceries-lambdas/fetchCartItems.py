import json
import boto3
import os
from boto3.dynamodb.conditions import Key
from decimal import Decimal

# Convert Decimal to float/int for JSON
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
items_table = dynamodb.Table(os.environ['ITEMS_TABLE_NAME'])

def lambda_handler(event, context):
    try:
        # Try to get userId from Cognito
        user_id = event['requestContext']['authorizer']['claims']['sub']

        # Get cart items for the user
        response = cart_table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        cart_items = response.get('Items', [])

        # Extract item IDs from the cart
        item_ids = [item['itemId'] for item in cart_items]

        # If cart is empty
        if not item_ids:
            return response_with_cors(200, "Cart is empty", [])

        # Extract itemIds from cart
        item_ids = [item['itemId'] for item in cart_items]

        # Fetch item details in batch
        keys = [{'id': item_id} for item_id in item_ids]
        
        batch_response = dynamodb.batch_get_item(
            RequestItems={
                items_table.name: {
                    'Keys': keys
                }
            }
        )

        items_details = batch_response['Responses'].get(items_table.name, [])

        # Filter to include only desired fields
        filtered_items = []
        for item in items_details:
            cart_item = next((c for c in cart_items if c['itemId'] == item['id']), {})
            filtered_items.append({
                "id": item["id"],
                "name": item.get("name", ""),
                "category": item.get("category", ""),
                "price": item.get("price", 0),
                "quantity": cart_item.get("quantity", 1)
            })
                    
        return response_with_cors(200, "Cart items fetched successfully", convert_decimals(filtered_items))


    except Exception as e:
        return response_with_cors(500, "Failed to fetch cart items", str(e))

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