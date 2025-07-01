#!/bin/bash
set -euo pipefail

# =======================================================================
#                       ORONIX Groceries Deployment
# =======================================================================

# ============================ CONFIGURATION ============================
# Get account id and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
echo "📌 Account ID: $ACCOUNT_ID"
echo "📌 AWS Region: $AWS_REGION"

# Set parameters for CF template creation
ENV_NAME="-test" # for every resource
STAGE_NAME="test" # only for the API Stage Name

PROJECT_NAME="oronix-groceries"
echo "📌 Project name: $PROJECT_NAME"

STACK_NAME="$PROJECT_NAME-stack$ENV_NAME"
echo "📌 CloudFormation stack name: $STACK_NAME"

# S3 bucket name (project assets)
ASSETS_BUCKET_NAME="$PROJECT_NAME-assets$ENV_NAME"
# S3 bucket name (project frontend)
WEBSITE_BUCKET_NAME="$PROJECT_NAME-website$ENV_NAME" # Created by CF template

# Base URL to the CF template fils stored in S3 bucket (project assets)
TEMPLATE_BASE_URL="https://$ASSETS_BUCKET_NAME.s3.amazonaws.com"

# Assets files 
LAMBDA_ZIP_NAME="$PROJECT_NAME-lambdas.zip"
MAIN_TEMPLATE_NAME="$PROJECT_NAME-main-template.json"
WEBSITE_BUCKET_TEMPLATE_NAME="$PROJECT_NAME-website-bucket-template.json"
COGNITO_TEMPLATE_NAME="$PROJECT_NAME-cognito-template.json"
API_TEMPLATE_NAME="$PROJECT_NAME-api-template.json"
LAMBDA_FUNCTIONS_TEMPLATE_NAME="$PROJECT_NAME-lambdas-template.json"
DYNAMODB_TEMPLATE_NAME="$PROJECT_NAME-dynamodb-template.json"

# Website files 
WEBSITE_DIR_NAME="$PROJECT_NAME-frontend"

# Redirect URLs for Authentication and logout (Cognito Hosted UI - uses only https)
LOGIN_CALLBACK_URL="https://${WEBSITE_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/index.html"
LOGOUT_URL="https://${WEBSITE_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/homePage.html"

# Lab IAM role arn
LAB_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/LabRole"

# DynamoDB table names
CART_TABLE="Cart"
CATEGORIES_TABLE="Categories"
COLORS_TABLE="Colors"
ITEMS_TABLE="Items"
ORDERS_TABLE="Orders"
USERS_TABLE_NAME="Users"

# Cognito user group names
COGNITO_ADMIN_GROUP_NAME="admins"
COGNITO_USER_GROUP_NAME="users"

# ========================= STARTING DEPLOYMENT =========================
echo "🚀 Starting ORONIX Groeries deployment in $ENV_NAME environment"

# ============================== S3 BUCKET ==============================
echo "Checking if the buckets were created"

echo "🔍 Looking for assets bucket -> '$ASSETS_BUCKET_NAME'..."
if aws s3api head-bucket --bucket "$ASSETS_BUCKET_NAME" >/dev/null 2>&1; then
    echo "✅ Assets bucket '$ASSETS_BUCKET_NAME' exists"
else 
    echo "⚠️ Assets bucket '$ASSETS_BUCKET_NAME' not found"
    echo "🪣 Creating assets bucket '$ASSETS_BUCKET_NAME' in region '$AWS_REGION'..."
    
    if [[ "$AWS_REGION" == "us-east-1" ]]; then
        if aws s3api create-bucket --bucket "$ASSETS_BUCKET_NAME"; then
            echo "✅ Assets bucket '$ASSETS_BUCKET_NAME' created"
        else
            echo "❌ Failed to create assets bucket '$ASSETS_BUCKET_NAME'"
            exit 1
        fi
    else
        if aws s3api create-bucket \
            --bucket "$ASSETS_BUCKET_NAME" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"; then
            echo "✅ Assets bucket '$ASSETS_BUCKET_NAME' created"
        else
            echo "❌ Failed to create assets bucket '$ASSETS_BUCKET_NAME'"
            exit 1
        fi    
    fi
fi

# Upload assets file to assets bucket
echo "⤴️ Uploading assets files to -> '$ASSETS_BUCKET_NAME'..."
ASSETS_FILES=(
    "$LAMBDA_ZIP_NAME"
    "$MAIN_TEMPLATE_NAME"
    "$WEBSITE_BUCKET_TEMPLATE_NAME"
    "$COGNITO_TEMPLATE_NAME"
    "$API_TEMPLATE_NAME"
    "$LAMBDA_FUNCTIONS_TEMPLATE_NAME"
    "$DYNAMODB_TEMPLATE_NAME"
)

for FILE in "${ASSETS_FILES[@]}"; do
    LOCAL_PATH="$PROJECT_NAME-assets/$FILE"
    echo "📤 Uploading $FILE to -> bucket '$ASSETS_BUCKET_NAME'..."

    if [ -f $LOCAL_PATH ]; then
        if aws s3 cp "$LOCAL_PATH" "s3://$ASSETS_BUCKET_NAME/$FILE"; then
            echo "✅ Uploaded successfully file -> '$FILE' to -> bucket '$ASSETS_BUCKET_NAME'"
        else
            echo "❌ Failed to upload file -> '$FILE' to bucket -> '$ASSETS_BUCKET_NAME'"
            exit 1
        fi
    else 
        echo "❌ File -> '$LOCAL_PATH' not found"
        exit 1
    fi
done

# =========================== CLOUD FORMATION ===========================
echo "🚀 Deploying main CloudFormation stack..."
if aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-url "$TEMPLATE_BASE_URL/$MAIN_TEMPLATE_NAME" \
    --parameters    ParameterKey=EnvName,ParameterValue="$ENV_NAME" \
                    ParameterKey=AssetsBucketName,ParameterValue="$ASSETS_BUCKET_NAME" \
                    ParameterKey=WebsiteBucketName,ParameterValue="$WEBSITE_BUCKET_NAME" \
                    ParameterKey=WebsiteBucketTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$WEBSITE_BUCKET_TEMPLATE_NAME" \
                    ParameterKey=CognitoTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$COGNITO_TEMPLATE_NAME" \
                    ParameterKey=PostLoginCallbackURLs,ParameterValue="$LOGIN_CALLBACK_URL" \
                    ParameterKey=PostLogoutURLs,ParameterValue="$LOGOUT_URL" \
                    ParameterKey=PostConfirmationLambdaS3Key,ParameterValue="$LAMBDA_ZIP_NAME" \
                    ParameterKey=CognitoAdminGroupName,ParameterValue="$COGNITO_ADMIN_GROUP_NAME" \
                    ParameterKey=CognitoUserGroupName,ParameterValue="$COGNITO_USER_GROUP_NAME" \
                    ParameterKey=LambdaFunctionsTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$LAMBDA_FUNCTIONS_TEMPLATE_NAME" \
                    ParameterKey=LambdaCodeS3Key,ParameterValue="$LAMBDA_ZIP_NAME" \
                    ParameterKey=ApiTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$API_TEMPLATE_NAME" \
                    ParameterKey=StageName,ParameterValue="$STAGE_NAME" \
                    ParameterKey=DynamoDBTablesTemplateURL,ParameterValue="$TEMPLATE_BASE_URL/$DYNAMODB_TEMPLATE_NAME" \
                    ParameterKey=LabRoleArn,ParameterValue="$LAB_ROLE_ARN" \
    --capabilities CAPABILITY_NAMED_IAM; then
        echo "⌛ Waiting for the stack to finish creating..."
        aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
        echo "✅ CloudFormation stack -> '$STACK_NAME' created successfully"
else 
    echo "❌ Failed to create CloudFormation stack -> '$STACK_NAME'"
    exit 1
fi

# =========================== WEBSITE SETUP ===========================
# Look for website bucket after stack creation
echo "🔍 looking for website bucket -> '$WEBSITE_BUCKET_NAME'..."
if aws s3api head-bucket --bucket "$WEBSITE_BUCKET_NAME" >/dev/null 2>&1; then
    echo "✅ Website bucket '$WEBSITE_BUCKET_NAME' exists"
else 
    echo "❌ Website bucket '$WEBSITE_BUCKET_NAME' not found after stack creation"
fi

# ====== Build the website's config.json file ======
# Get stack outputs

# Output: CognitoUserPoolId
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" \
  --output text)
echo "📌 User Pool ID: $USER_POOL_ID"

# Output: CognitoUserPoolDomainPrefix
USER_POOL_DOMAIN_PREFIX=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolDomainPrefix'].OutputValue" \
  --output text)
echo "📌 User Pool Domain Prefix: $USER_POOL_DOMAIN_PREFIX"

# Output: CognitoUserPoolClientId
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolClientId'].OutputValue" \
  --output text)
echo "📌 User Pool Client Id: $USER_POOL_CLIENT_ID"

# Output: ApiId
API_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiId'].OutputValue" \
  --output text)
echo "📌 Api Id: $API_ID"

# Build Cognito Hosted UI login URL
LOGIN_URL="https://${USER_POOL_DOMAIN_PREFIX}.auth.${AWS_REGION}.amazoncognito.com/login?client_id=${USER_POOL_CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${LOGIN_CALLBACK_URL}"
echo "🌐 Cognito Login page URL: $LOGIN_URL"

# Build API URLs
API_BASE_URL="https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/${STAGE_NAME}"
echo "🌐 API base URL: $API_BASE_URL"

# Build website's Front-End Base URL
FRONTEND_BASE_URL="https://${WEBSITE_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com"
echo "🌐 Front-End base URL: $FRONTEND_BASE_URL"

# Build S3 Static Website Base URL
STATIC_WEBSITE_BASE_URL="http://${WEBSITE_BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"

# Create config.json file
CONFIG_JSON_PATH="$WEBSITE_DIR_NAME/config.json"

cat > "$CONFIG_JSON_PATH" <<EOF
{
  "api": {
    "fetchAllItems": "${API_BASE_URL}/items",
    "fetchItemDetails": "${API_BASE_URL}/items/item",
    "fetchAllCategories": "${API_BASE_URL}/categories",
    "fetchAllColors": "${API_BASE_URL}/colors",
    "cart": {
      "fetchCartItems": "${API_BASE_URL}/cart",
      "addItemToCart": "${API_BASE_URL}/cart/add",
      "updateCartItemQuantity": "${API_BASE_URL}/cart/update",
      "deleteItemFromCart": "${API_BASE_URL}/cart/remove"
    },
    "placeOrder": "${API_BASE_URL}/order",
    "checkUserRole": "${API_BASE_URL}/users",
    "admin": {
      "addItemToInventory": "${API_BASE_URL}/admin/add-item",
      "deleteFromInventory": "${API_BASE_URL}/admin/remove-item"
    }
  },
  "cognito": {
    "loginUrl": "${LOGIN_URL}"
  },
  "app": {
    "homePageUrl": "${FRONTEND_BASE_URL}/homePage.html",
    "indexPageUrl": "${FRONTEND_BASE_URL}/index.html",
    "thankyouPageUrl": "${FRONTEND_BASE_URL}/thankyou.html",
    "adminPageUrl": "${FRONTEND_BASE_URL}/admin.html",
    "errorPageUrl": "${FRONTEND_BASE_URL}/error.html",
    "imagesBaseUrl": "${FRONTEND_BASE_URL}/images"
  }
}
EOF

echo "✅ Created config.json at $CONFIG_JSON_PATH (locally)"

# Upload website files
echo "⤴️ Uploading website files to -> bucket '$WEBSITE_BUCKET_NAME'..."

if aws s3 cp "$WEBSITE_DIR_NAME" "s3://$WEBSITE_BUCKET_NAME/" --recursive; then
  echo "✅ Website files uploaded successfully to $WEBSITE_BUCKET_NAME"
  echo "🌐 Static Website URL: $STATIC_WEBSITE_BASE_URL"
else
  echo "❌ Failed to upload website files"
  exit 1
fi

echo "Oronix Groceries deployed successfully (environment: '$ENV_NAME')."

# Creating Test Users
echo "👤 Creating admin user..."

aws cognito-idp admin-create-user \
  --region "$AWS_REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --username "admin@example.com" \
  --user-attributes Name="email",Value="admin@example.com" Name="email_verified",Value="true" Name="name",Value="Admin User" \
  --message-action SUPPRESS


aws cognito-idp admin-set-user-password \
  --region "$AWS_REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --username "admin@example.com" \
  --password "AdminPassword123!" \
  --permanent

aws cognito-idp admin-add-user-to-group \
  --region "$AWS_REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --username "admin@example.com" \
  --group-name "$ADMIN_GROUP_NAME"

echo "✅ Admin user created."
echo ""
echo "👤 Creating Test user..."

aws cognito-idp admin-create-user \
  --region "$AWS_REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --username "user@example.com" \
  --user-attributes Name="email",Value="user@example.com" Name="email_verified",Value="true" Name="name",Value="Regular User" \
  --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --region "$AWS_REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --username "user@example.com" \
  --password "UserPassword123!" \
  --permanent

aws cognito-idp admin-add-user-to-group \
  --region "$AWS_REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --username "user@example.com" \
  --group-name "$USER_GROUP_NAME"

echo "✅ Test user created."

echo ""
echo "🎉 Setup complete!"
echo "🌐 Check out the Oronix-Groceries website:"
echo "🔗 Website URL: $STATIC_WEBSITE_BASE_URL"
echo ""

echo "You can test the system with the following test users details:"
echo "------------------------------"
echo "👤 Admin User:"
echo "📧 Email: admin@example.com"
echo "🔑 Password: AdminPassword123!"
echo "📌 Group: $ADMIN_GROUP_NAME"
echo "------------------------------"
echo "👤 Test User:"
echo "📧 Email: user@example.com"
echo "🔑 Password: UserPassword123!"
echo "📌 Group: $USER_GROUP_NAME"
echo "------------------------------"

