import json
import boto3
import os
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['ITEMS_TABLE'])

def lambda_handler(event, context):
    try:
        # Get Cognito group claims
        claims = event['requestContext']['authorizer']['claims']
        groups = claims.get('cognito:groups', '')

        # Ensure the user is an admin
        if 'admin' not in groups:
            return response_with_cors(403, "Unauthorized – Admins only")

        # Parse the body of the request
        body = json.loads(event['body'])

        # Extract fields (but don't include id)
        name = body['name']
        price = Decimal(str(body['price']))
        category = body['category']
        color = body['color']
        description = body.get('description', '')

        # Scan the table to find the max id
        response = table.scan(ProjectionExpression="id")
        items = response.get('Items', [])
        max_id = max([int(item['id']) for item in items], default=0)
        new_id = max_id + 1

        # Add the item to DynamoDB
        table.put_item(Item={
            'id': new_id,
            'name': name,
            'price': price,
            'category': category,
            'color': color,
            'description': description
        })

        return response_with_cors(200, f"Item '{name}' added successfully with id {new_id}")

    except Exception as e:
        return response_with_cors(500, "Failed to add item", str(e))


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
