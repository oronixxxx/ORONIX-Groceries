# ORONIX Groceries

**ORONIX Groceries** is a modern, cloud-based online grocery shopping platform designed to simplify and enhance the user experience of purchasing food and household items from home. The system is optimized for performance, accessibility, and scalability using serverless AWS technologies.

## 🛒 Project Overview

**ORONIX Groceries** provides a seamless and intuitive shopping experience with the following core features:

- **Dynamic Product Catalog**: View products with images, descriptions, categories, and prices.
- **Advanced Search and Filtering**: Easily find products by name or category.
- **Smart Shopping Cart**: Add/remove items, update quantities, and view the total cost in real time.
- **User Management**: Sign up and log in securely.
- **Admin Panel**: Add, edit, and delete products through a dedicated admin interface.
- **Subscription**: Use your email to enter our freinds list and recieve 5% discount to **any** futher purchase.

---

## 🚀 Tech Stack

The project is built using the following AWS services and cloud technologies:

| Technology             | Purpose                                                |
|------------------------|--------------------------------------------------------|
| **Amazon S3**          | Hosting static front-end files                         |
| **AWS Lambda**         | Serverless business logic (backend functions)          |
| **Amazon API Gateway** | Routing HTTP requests to Lambda functions              |
| **Amazon DynamoDB**    | NoSQL database for storing user and product data       |
| **Amazon Cognito**     | User authentication and authorization                  |
| **Amazon SNS**         | Sending real-time notifications (optional)             |

---

## 🔧 How It Works

1. Users access the website hosted on **Amazon S3**.
2. The front-end communicates with **API Gateway** to trigger **Lambda** functions.
3. The Lambda functions handle logic such as adding items to the cart or fetching product data.
4. All user and product data is stored in **Amazon DynamoDB**.
5. Authentication is managed via **Amazon Cognito**, which secures user access.
6. To recieve the discount code users register with their mail and get the discount code using **Amazon SNS**.

---

# Oronix-Groceries AWS Deployment

This project contains everything you need to stand up the **Oronix-Groceries** backend (Lambda + API Gateway + DynamoDB + Cognito), load initial data, and deploy the static frontend in S3 using CloudFormation.

---

## Prerequisites

1. **AWS CLI v2** installed and configured
   Ensure `aws sts get-caller-identity` returns your account, and `aws configure get region` is set.

2. **IAM permissions**
   You need rights to create S3 buckets, Lambda functions, Cognito user pools, API Gateway, DynamoDB tables, and CloudFormation stacks with `CAPABILITY_NAMED_IAM`.

3. **Zip utility**
   For packaging Lambda code, if you rebuild it locally.

4. **jq** (optional)
   For inspecting JSON payloads in the deploy script.

---

## Project Structure

```
.
├── oronix-groceries-assets/
│   ├── oronix-groceries-main-template.json       # Main stack with nested stacks
│   ├── oronix-groceries-lambdas.zip              # ZIP archive of all Lambda functions
│   ├── oronix-groceries-api-template.json        # Nested API Gateway template
│   ├── oronix-groceries-cognito-template.json    # Nested Cognito template
│   ├── oronix-groceries-dynamodb-template.json   # Nested DynamoDB template
│   ├── oronix-groceries-lambdas-template.json    # Nested Lambda template
│   └── oronix-groceries-website-bucket-template.json  # Nested S3 website template
│
├── oronix-groceries-frontend/                    # Static website files
│   ├── homePage.html
│   ├── index.html
│   ├── admin.html
│   ├── thankyou.html
│   ├── error.html
│   ├── config.json                               # Populated by deploy script
│   ├── js/
│   ├── css/
│   └── images/
│
├── data/                                         # Seed data for DynamoDB
│   ├── categories.json
│   ├── colors.json
│   └── items.json
│
├── scripts/
│   ├── invoke_load_initial_data.sh               # Invoke loader Lambda
│   └── initial_data_payload.json                 # Generated payload for data loader
│
└── oronix-groceries-deploy.sh                    # Deployment helper script
```

---

## Deployment Steps

1. **Review and configure the deploy script**
   Open `oronix-groceries-deploy.sh` and adjust:

   ```bash
   # ENV_NAME: leave empty ("") for base, or set "-staging", "-prod", etc.
   RAW_ENV=""

   # STAGE_NAME: API Gateway stage (e.g., prod)
   STAGE_NAME="prod"
   ```

2. **Ensure Lambda ZIP is present**
   The script expects `oronix-groceries-lambdas.zip` under `oronix-groceries-assets/`.
   If you rebuild your Lambdas:

   ```bash
   cd oronix-groceries-assets
   zip oronix-groceries-lambdas.zip path/to/handlers/*.py
   cd ..
   ```

3. **Make scripts executable**

   ```bash
   chmod +x oronix-groceries-deploy.sh scripts/invoke_load_initial_data.sh
   ```

4. **Run the deployment**

   ```bash
   ./oronix-groceries-deploy.sh
   ```

   This script will:

   1. Create/confirm the assets & frontend S3 buckets.
   2. Upload assets (templates, Lambda ZIP, seed data).
   3. Create the main CloudFormation stack.
   4. Generate and upload the payload JSON for initial data.
   5. Invoke the `LoadInitialDataToDynamoDB` Lambda to seed categories, colors, and items.
   6. Upload the static website and create the config.json.
   7. Create Cognito admin & test users, then insert the test user record into DynamoDB.

---

## Testing & Verification

* **Initial data**: After deployment, verify DynamoDB tables (`Categories`, `Colors`, `Items`) are populated.

* **Cognito users**: The script creates:

  * **Admin**: `admin@example.com` / `AdminPassword123!` (Admins group)
  * **Test User**: `user@example.com` / `UserPassword123!` (Users group)

* **Frontend**: Open the static site URL printed by the script and attempt login via Cognito Hosted UI.

* **API**: Use the endpoints printed (e.g., `/items`, `/categories`, `/colors`, `/cart`, `/order`, `/admin/*`).

---

## Cleanup

To tear down all resources:

```bash
aws cloudformation delete-stack --stack-name oronix-groceries-stack${RAW_ENV:+-\$RAW_ENV}
```

This will delete the main stack and all nested stacks.
Optionally, empty and delete the S3 buckets (`*-assets`, `*-website`).

---

Happy deploying **Oronix-Groceries**! 🎉


