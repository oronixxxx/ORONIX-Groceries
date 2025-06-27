import json

def response_with_cors(status_code, message, body=None):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": json.dumps({"message": message, "data": body} if body else {"message": message})
    }

def lambda_handler(event, context):
    try:
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        groups = claims.get("cognito:groups", "")

        is_admin = "admins" in groups

        return response_with_cors(200, "role check successful", {
            "isAdmin": is_admin
        })

    except Exception as e:
        return response_with_cors(500, f"Error checking role: {str(e)}")
