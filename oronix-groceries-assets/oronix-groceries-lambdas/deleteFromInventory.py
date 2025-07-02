import json
import boto3
import os

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['ITEMS_TABLE_NAME'])

def lambda_handler(event, context):
    try:
        # Get user claims
        claims = event['requestContext']['authorizer']['claims']
        groups = claims.get('cognito:groups', '')

        # Ensure user is an admin
        if 'admin' not in groups:
            return response_with_cors(403, "Unauthorized – Admins only")

        # Parse itemId from request (either from path or body)
        if event.get('body'):
            body = json.loads(event['body'])
            item_id = body.get('id')
        else:
            item_id = event['queryStringParameters'].get('id')

        if not item_id:
            return response_with_cors(400, "Missing id")

        # Delete the item
        item_id = int(item_id)  # Convert to number to match schema
        table.delete_item(Key={'id': item_id})

        return response_with_cors(200, f"Item {item_id} deleted successfully")

    except Exception as e:
        return response_with_cors(500, "Failed to delete item", str(e))


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
