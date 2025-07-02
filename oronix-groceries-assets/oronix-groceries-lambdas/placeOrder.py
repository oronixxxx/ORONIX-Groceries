import json
import boto3
import os
import uuid
from decimal import Decimal
from boto3.dynamodb.conditions import Key
from datetime import datetime

# Conver deciamls
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
orders_table = dynamodb.Table(os.environ['ORDERS_TABLE_NAME'])
cart_table = dynamodb.Table(os.environ['CART_TABLE_NAME'])

def lambda_handler(event, context):
    try:
        # Extract user ID from Cognito token
        user_id = event['requestContext']['authorizer']['claims']['sub']
        body = json.loads(event['body'])
        order_data = body.get("order", {})

        # Retrieve cart items for the user
        response = cart_table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        cart_items = response['Items']

        if not cart_items:
            return response_with_cors(400, "Cart is empty. Cannot place order.")

        order_items = [
            {
                "itemId": int(item["itemId"]),
                "quantity": int(item.get("quantity", 1))
            }
            for item in convert_decimals(cart_items)
            if "itemId" in item
        ]

        # Scan all orders to find the highest orderId
        orders_response = orders_table.scan()
        existing_orders = orders_response.get('Items', [])
        order_ids = [int(order['orderId']) for order in convert_decimals(existing_orders) if 'orderId' in order]
        next_order_id = max(order_ids, default=0) + 1

        # Build order item
        #order = {
        #    "userId": user_id,
        #    "orderId": next_order_id,
        #    "items": item_ids,
        #    "createdAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        #    "status": "PROCESSING"
        #}

        order = {
            "userId": user_id,
            "orderId": next_order_id,
            "firstName": order_data.get("firstName", ""),
            "lastName": order_data.get("lastName", ""),
            "phone": order_data.get("phone", ""),
            "address": order_data.get("address", ""),
            "items": order_items,
            "createdAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
            "status": "PROCESSING"
        }

        # Save order as a single record
        orders_table.put_item(Item=order)

        # Clear the cart after placing the order
        with cart_table.batch_writer() as batch:
            for item in cart_items:
                batch.delete_item(
                    Key={
                        'userId': item['userId'],
                        'itemId': item['itemId']
                    }
                )

        return response_with_cors(200, "Order placed successfully.", convert_decimals(order))

    except Exception as e:
        return response_with_cors(500, "Failed to place order.", str(e))
        
# Standardized response with CORS headers
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