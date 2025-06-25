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
6. To recieve the discount code users register with their mail and get the discount code using **Amazon SNS**. (optional) 


