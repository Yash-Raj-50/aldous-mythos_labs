# Aldous Documentation

This document provides a deep dive into the architecture, services, and setup of the Aldous application.

## 1. System Architecture

The application is built on a modern, serverless architecture using Next.js, which allows for a combination of server-side rendering (SSR), static site generation (SSG), and API routes in a single project.

### 1.1. Core Framework: Next.js

-   **App Router**: The project uses the Next.js App Router (`src/app`), which enables component-level data fetching and a more organized project structure.
-   **API Routes**: Server-side logic, particularly for webhooks from external services, is handled in API routes located at `src/app/api/`. For example, `src/app/api/twilio_webhook_whatsapp/route.ts` handles incoming messages from WhatsApp.
-   **Server Actions**: For database mutations and data fetching from the client, the application uses Next.js Server Actions (in `src/actions/`). This reduces the need to create separate API endpoints for many CRUD operations.

### 1.2. Database: MongoDB

-   **Connection**: The application connects to a MongoDB database using the `mongoose` library. The connection logic is centralized in `src/lib/dbConnect.ts`.
-   **Connection Caching**: To improve performance and avoid creating a new database connection on every request in a serverless environment, the connection is cached globally. The code checks for an existing cached connection and reuses it if available.
-   **Schemas**: All database schemas are defined in `src/models/databaseSchemas.ts` using Mongoose, providing a clear structure for the data.

### 1.3. Cloud Services: AWS

The application is deeply integrated with several AWS services for its advanced features.

-   **S3 (Simple Storage Service)**: Used for storing file uploads, such as agent profile pictures or media sent in chats. The `src/services/s3Service.ts` file contains helpers for:
    -   Uploading files directly from the server.
    -   Generating pre-signed URLs for secure, direct client-side uploads.
-   **Rekognition**: For image analysis. When a user sends an image, the application can use AWS Rekognition to detect objects, faces, text, and sentiment within the image.
-   **Transcribe**: For audio message transcription. Voice notes sent by users are processed by AWS Transcribe to convert speech to text, which can then be understood and processed by the AI.
-   **Bedrock**: Provides access to a variety of large language models, which are used alongside Anthropic's Claude for generating conversational responses.

### 1.4. Messaging Platforms

The application is designed to be a multi-platform conversational agent.

-   **Twilio for WhatsApp**: The integration is handled via a webhook defined in `src/app/api/twilio_webhook_whatsapp/route.ts`. When a user sends a message to the designated WhatsApp number, Twilio forwards it to this endpoint.
-   **Facebook Messenger**: Similarly, a webhook at `src/app/api/webhook_fb/route.ts` handles incoming messages from Facebook Messenger. It includes security checks like signature verification to ensure that requests are genuinely from Facebook.

## 2. Detailed Setup Guides

This section combines the setup instructions for local development and platform integrations.

### 2.1. Local Development with ngrok

To test webhook integrations on a local machine, you need a way to expose your local server to the internet. `ngrok` is the recommended tool for this.

1.  **Install ngrok**:
    ```bash
    # On macOS with Homebrew
    brew install ngrok
    # Or download from https://ngrok.com/download
    ```

2.  **Start your local development server**:
    ```bash
    npm run dev
    ```
    Your application will be running at `http://localhost:3000`.

3.  **Start ngrok**:
    In a new terminal window, run:
    ```bash
    ngrok http 3000
    ```
    `ngrok` will provide you with a public HTTPS URL (e.g., `https://abc123.ngrok.io`) that forwards to your local server.

### 2.2. Facebook Messenger Setup

1.  **Prerequisites**:
    -   A Facebook Developer Account.
    -   A Facebook Page that your bot will operate from.
    -   Your application deployed or exposed via `ngrok`.

2.  **Environment Variables**:
    Ensure these variables are in your `.env.local` file:
    ```env
    FACEBOOK_APP_SECRET=your_facebook_app_secret_here
    FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_access_token_here
    FACEBOOK_VERIFY_TOKEN=your_custom_verify_token_here
    ```

3.  **Facebook App Configuration**:
    -   Go to [Facebook Developers](https://developers.facebook.com/) and create a new app.
    -   Add the "Messenger" product.
    -   In the Messenger settings, generate a Page Access Token for your Facebook Page and add it to your environment variables.
    -   Set up the webhook by providing the `ngrok` or deployment URL (e.g., `https://your-url.com/api/webhook_fb`).
    -   Set your verify token (the same one from your `.env.local`).
    -   Subscribe to the `messages` and `messaging_postbacks` fields.

4.  **Agent Configuration**:
    In your database, an agent needs to be associated with the Facebook Page via the `socialID` field, which should contain the full URL of the Facebook Page.

### 2.3. Twilio for WhatsApp Setup

1.  **Twilio Account**:
    -   Sign up for a Twilio account.
    -   Activate the WhatsApp Sandbox.

2.  **Configure Webhook**:
    -   In your Twilio Console, navigate to **Messaging > Settings > WhatsApp Sandbox Settings**.
    -   Set the webhook URL for "When a message comes in" to your `ngrok` or deployment URL (e.g., `https://your-url.com/api/twilio_webhook_whatsapp`).
    -   Set the HTTP method to `POST`.

## 3. Things to Keep in Mind

-   **ngrok URLs**: The free tier of `ngrok` generates a new URL every time you restart it. You will need to update the webhook URLs in the Twilio and Facebook dashboards whenever this happens.
-   **Environment Variables**: The application relies heavily on environment variables for configuration. Ensure that all required variables are present and correct in both your local `.env.local` file and your production environment.
-   **Security**: Webhook endpoints are protected by signature verification (`FACEBOOK_APP_SECRET` for Facebook) or other mechanisms. Ensure these secrets are kept secure.
-   **Database Seeding**: The `src/actions/python_scripts` directory contains scripts and sample data (`.json` files) that can be used to seed the database with initial data for users, agents, and chat sessions.

## 4. Future Updates

- Change the 'Update Analysis' feature to use AWS Bedrock instead of the current anthropic API being called.
- Add client one time password login feature.