# Facebook Messenger Webhook Setup Guide

This guide explains how to set up the Facebook Messenger webhook for your Aldous application.

## Prerequisites

1. Facebook Developer Account
2. Facebook Page for your bot
3. Your application deployed and accessible via HTTPS

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# Facebook Messenger Configuration
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_access_token_here
FACEBOOK_VERIFY_TOKEN=your_custom_verify_token_here

# AWS Configuration (already existing)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_aws_access_key
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
NEXT_PUBLIC_AWS_S3_BUCKET=your_s3_bucket_name

# Database Configuration (already existing)
MONGODB_URI=your_mongodb_connection_string
```

## Step-by-Step Setup

### 1. Create Facebook App and Page

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (select "Consumer" or "Business" depending on your use case)
3. Add the "Messenger" product to your app
4. Create a Facebook Page or use an existing one

### 2. Configure Messenger Product

1. In your Facebook App dashboard, go to Messenger → Settings
2. Generate a Page Access Token for your Facebook Page
3. Copy this token and add it to your environment variables as `FACEBOOK_PAGE_ACCESS_TOKEN`

### 3. Set Up Webhook

1. In Messenger Settings, find the "Webhooks" section
2. Click "Add Callback URL"
3. Enter your webhook URL: `https://yourdomain.com/api/twilio_webhook_fb`
4. Enter your verify token (create a custom string and add it to your env as `FACEBOOK_VERIFY_TOKEN`)
5. Select these subscription fields:
   - `messages`
   - `messaging_postbacks`
   - `messaging_optins`
   - `message_deliveries`

### 4. Get App Secret

1. In your Facebook App dashboard, go to Settings → Basic
2. Copy the "App Secret" and add it to your environment variables as `FACEBOOK_APP_SECRET`

### 5. Configure Agent in Database

You need to create or update an agent in your database to handle Facebook messages. The agent should have:

```javascript
{
  name: "Your Bot Name",
  aiModel: "claude-sonnet-4", // or your preferred model
  prompt: "Your bot's personality and instructions",
  socialID: "https://www.facebook.com/profile.php?id=61577236324159", // Full Facebook Page URL
  activeStatus: true
}
```

### 6. Extract Facebook Page ID

From a URL like `https://www.facebook.com/profile.php?id=61577236324159`, the Page ID is `61577236324159`.

You can also find it by:
1. Going to your Facebook Page
2. Going to Settings → Page Info
3. The Page ID will be listed there

**Important**: Store the full URL in the `socialID` field, not just the ID. The system will automatically extract and match IDs when needed.

## Features Supported

### ✅ Text Messages
- Full conversation history
- Context-aware responses
- Human-like response patterns

### ✅ Image Support
- Image analysis using AWS Rekognition
- Vision capabilities using Claude
- Automatic object and text detection

### ✅ Audio Support
- Audio transcription using AWS Transcribe
- Support for various audio formats

### ✅ Video Support
- Video file acknowledgment
- Metadata extraction

### ✅ Advanced Features
- Session management with timeouts
- Profile creation and management
- Conversation analytics
- Multi-modal AI responses
- Fallback responses for errors

## Webhook Security

The webhook includes signature validation for production environments. Facebook signs all webhook requests using your App Secret, and the webhook validates these signatures to ensure authenticity.

## Testing

1. **Local Development**: Use ngrok or similar tools to expose your local server
2. **Verification**: Facebook will send a GET request to verify your webhook
3. **Message Testing**: Send a message to your Facebook Page to test the bot

## Error Handling

The webhook includes comprehensive error handling:
- Database connection failures
- Media processing errors
- AI model failures
- Network timeouts
- Invalid signatures

## Monitoring

Monitor these logs for issues:
- Facebook webhook verification
- Message processing
- AI response generation
- Database operations

## Facebook Messenger Limitations

- Message size: 320 characters for text (longer messages may be truncated)
- Media size: 25MB maximum
- Rate limits: 1000 messages per user per day
- Attachment types: Images, videos, audio, files

## Troubleshooting

### Common Issues

1. **Webhook Verification Fails**
   - Check your `FACEBOOK_VERIFY_TOKEN` matches what you set in Facebook
   - Ensure your webhook URL is accessible via HTTPS

2. **Messages Not Received**
   - Verify webhook subscription fields are selected
   - Check Facebook Page permissions
   - Ensure your app is not in development mode restrictions

3. **Agent Not Found**
   - Verify agent exists in database with correct Facebook Page ID
   - Check socialID field matches your Facebook Page ID
   - Ensure activeStatus is true

4. **Media Processing Fails**
   - Check AWS credentials and permissions
   - Verify S3 bucket exists and is accessible
   - Check media file size and format

## Production Deployment

1. Set `NODE_ENV=production` for signature validation
2. Use HTTPS for all webhook URLs
3. Monitor error rates and response times
4. Set up proper logging and alerting

## Support

For additional help:
- Check Facebook Messenger Platform documentation
- Review AWS service documentation for media processing
- Monitor application logs for specific error messages
