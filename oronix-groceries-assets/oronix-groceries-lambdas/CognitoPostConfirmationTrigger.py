# Cognito Post Confirmation Trigger - Lambda Function
import boto3
from datetime import datetime
import os

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['USERS_TABLE_NAME']
users_table = dynamodb.Table(table_name)

USER_GROUP_NAME = os.environ['USER_GROUP_NAME']

# Initialize Cognito client
cognito_client = boto3.client('cognito-idp')

def lambda_handler(event, context):
    # Extract user details from the event
    user_id = event['userName']  # Cognito "sub"
    user_attributes = event['request']['userAttributes']
    email = user_attributes.get('email')
    given_name = user_attributes.get('given_name', '') # Default if name is not provided
    family_name = user_attributes.get('family_name', '') # Default if name is not provided
    created_at = datetime.utcnow().isoformat()  # Current UTC timestamp

    # Insert user into DynamoDB
    try:
        users_table.put_item(
            Item={
                'userId': user_id,         # Partition Key
                'email': email,            # User email
                'firstName':  given_name,  # User first name
                'lastName': family_name,   # User last name
                'createdAt': created_at    # Timestamp
            }
        )
        print(f"User {user_id} added to DynamoDB.")
    except Exception as e:
        print(f"Error adding user to DynamoDB: {e}")

    # Add user to the 'Users' group in Cognito
    try:
        cognito_client.admin_add_user_to_group(
            UserPoolId=event['userPoolId'],
            Username=user_id,
            GroupName=USER_GROUP_NAME  # The group to add the user to
        )
        print(f"User {user_id} added to the '{USER_GROUP_NAME}' group.")
    except Exception as e:
        print(f"Error adding user to the '{USER_GROUP_NAME}' group: {e}")

    # Return the event to ensure Cognito completes the flow
    return event
