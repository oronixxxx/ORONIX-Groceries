#!/bin/bash

# =======================================================================
#                       ORONIX Groceries Deployment
# =======================================================================

# ============================ CONFIGURATION ============================
# Get account id and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
echo "Account ID: $ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"

# Set parameters for CF template creation
ENV_NAME="-test"
STAGE_NAME="test"

PROJECT_NAME="oronix-groceries"
REGION="us-east-1"

STACK_NAME="$PROJECT_NAME-stack$ENV_NAME"
echo "CloudFormation stack name: $STACK_NAME"

# S3 bucket name (project assets)
ASSETS_BUCKET_NAME="$PROJECT_NAME-assets$ENV_NAME"
# S3 bucket name (project frontend)
WEBSITE_BUCKET_NAME="$PROJECT_NAME-website$ENV_NAME" # Created by CF template

# Base URL to the CF template fils stored in S3 bucket
TEMPLATE_BASE_URL="https://$ASSETS_BUCKET_NAME.s3.amazonaws.com"

# Assets files 
LAMBDA_ZIP_NAME="oronix-groceries-lambdas.zip"
MAIN_TEMPLATE_NAME="oronix-groceries-main-template.json"
WEBSITE_BUCKET_TEMPLATE_NAME="oronix-groceries-website-bucket-template.json"
COGNITO_TEMPLATE_NAME="oronix-groceries-cognito-template.json"
API_TEMPLATE_NAME="oronix-groceries-api-template.json"
LAMBDA_FUNCTIONS_TEMPLATE_NAME="oronix-groceries-lambdas-template.json"
DYNAMODB_TEMPLATE_NAME="oronix-groceries-dynamodb-template.json"

# Redirect URLs for Authentication and logout
LOGIN_CALLBACK_URL="https://${WEBSITE_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/index.html"
LOGOUT_URL="https://${WEBSITE_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/homePage.html"

# Lab IAM role arn
LAB_ROLE_ARN="arn:aws:iam:${ACCOUNT_ID}:role/LabRole"

# ========================= STARTING DEPLOYMENT =========================
echo "Starting ORONIX GRoeries deployment in $ENV_NAME environment"

# ============================== S3 BUCKET ==============================
echo "Checking if the buckets were created"

echo "Looking for assets bucket -> '$ASSETS_BUCKET_NAME'..."
if aws s3api head-bucket --bucket "$ASSETS_BUCKET_NAME" >/dev/null 2>&1; then
    echo "Assets bucket '$ASSETS_BUCKET_NAME' exists"
else 
    echo "Assets bucket '$ASSETS_BUCKET_NAME' not found"
    echo "Creating assets bucket '$ASSETS_BUCKET_NAME'"
    
    if aws s3api create-bucket --bucket "$ASSETS_BUCKET_NAME"; then
        echo "Assets bucket '$ASSETS_BUCKET_NAME' created"
    else
        echo "Failed to create assets bucket '$ASSETS_BUCKET_NAME'"
        exit 1
    fi
fi

# Upload assets file to assets bucket
echo "Uploading assets files to -> '$ASSETS_BUCKET_NAME'..."
ASSETS_FILES=(
    "$LAMBDA_ZIP_NAME"
    "$MAIN_TEMPLATE_NAME"
    "$WEBSITE_BUCKET_TEMPLATE_NAME"
    "$COGNITO_TEMPLATE_NAME"
    "$API_TEMPLATE_NAME"
    "$LAMBDA_FUNCTIONS_TEMPLATE_NAME"
    "$DYNAMODB_TEMPLATE_NAME"
)

for FILE in "${ASSET_FILES[@]}"; do
    LOCAL_PATH="$PROJECT_NAME-assets/$FILE"
    echo "Uploading $FILE to -> bucket '$ASSETS_BUCKET_NAME'..."

    if [ -f $LOCAL_PATH ]; then
        if aws s3 cp "$LOCAL_PATH" "s3://$ASSETS_BUCKET_NAME/$FILE"; then
            echo "Uploaded successfully file -> '$FILE' to -> bucket '$ASSETS_BUCKET_NAME'"
        else
            echo "Failed to upload file -> '$FILE' to bucket -> '$ASSETS_BUCKET_NAME'"
            exit 1
        fi
    else 
        echo "File -> '$LOCAL_PATH' not found"
        exit 1
    fi
done

# =========================== CLOUD FORMATION ===========================
echo "Deploying main CloudFormation stack..."
if aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-url "$TEMPLATE_BASE_URL/$MAIN_TEMPLATE_NAME" \
    --parameters    ParameterKey=EnvName,ParameterValue="$ENV_NAME" \
                    ParameterKey=AssetsBucketName,ParameterValue="$ASSETS_BUCKET_NAME" \
                    ParameterKey=WebsiteBucketName,ParameterValue="$WEBSITE_BUCKET_NAME" \
                    ParameterKey=WebsiteBucketTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$WEBSITE_BUCKET_TEMPLATE_NAME" \
                    ParameterKey=CognitoTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$COGNITO_TEMPLATE_NAME" \
                    ParameterKey=PostLoginCallbackURLs,ParameterValue="$LOGIN_CALLBACK_URL" \
                    ParameterKey=PostLogOutURLs,ParameterValue="$LOGOUT_URL" \
                    ParameterKey=PostConfirmationLambdaS3Key,ParameterValue="$LAMBDA_ZIP_NAME" \
                    ParameterKey=LambdaFunctionsTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$LAMBDA_FUNCTIONS_TEMPLATE_NAME" \
                    ParameterKey=LambdaCodeS3Key,ParameterValue="$LAMBDA_ZIP_NAME" \
                    ParameterKey=ApiTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$API_TEMPLATE_NAME" \
                    ParameterKey=StageName,ParameterValue="$STAGE_NAME" \
                    ParameterKey=DynamoDBTablesTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$DYNAMODB_TEMPLATE_NAME" \
                    ParameterKey=LabRoleArn,ParameterValue="$LAB_ROLE_ARN" \
    --capabilities CAPABILITY_NAMED_IAM; then
        echo "Waiting for the stack to finish creating..."
        aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
        echo "CloudFormation stack -> '$STACK_NAME' created successfully"
else 
    echo "Failed to create CloudFormation stack -> '$STACK_NAME'"
    exit 1
fi

# Look for website bucket after stack creation
echo "looking for website bucket -> '$WEBSITE_BUCKET_NAME'..."
if aws s3api head-bucket --bucket "$WEBSITE_BUCKET_NAME" >/dev/null 2>&1; then
    echo "Assets bucket '$WEBSITE_BUCKET_NAME' exists"
else 
    echo "Website bucket '$WEBSITE_BUCKET_NAME' not found after stack creation"
fi