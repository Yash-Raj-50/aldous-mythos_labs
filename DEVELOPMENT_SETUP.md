# 🔧 Development Setup Guide

## Local Development with ngrok

### 1. Install ngrok
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Start your development server
```bash
cd /Users/yashraj/Desktop/work/web/Mythos\ Labs/aldous
npm run dev
```
Your app will run on `http://localhost:3000`

### 3. In a new terminal, start ngrok
```bash
ngrok http 3000
```

You'll see output like:
```
Session Status    online
Version           3.x.x
Region            United States (us)
Latency           -
Web Interface     http://127.0.0.1:4040
Forwarding        https://abc123.ngrok.io -> http://localhost:3000
```

### 4. Configure Twilio Webhook
1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Develop > Messaging > Settings > WhatsApp Sandbox Settings**
3. Set webhook URL to: `https://abc123.ngrok.io/api/twilio_webhook_whatsapp`
4. Set HTTP method to: `POST`

### 5. Test with WhatsApp
1. Join WhatsApp Sandbox by messaging the sandbox number
2. Send a message to test your webhook

## Production Deployment

### 1. Deploy to Vercel/Netlify
```bash
# For Vercel
vercel

# Your app will be at: https://yourapp.vercel.app
```

### 2. Update Twilio webhook URL
Set webhook to: `https://yourapp.vercel.app/api/twilio_webhook_whatsapp`

### 3. Update environment variables
Make sure your production environment has the correct:
- `NEXT_PUBLIC_TWILIO_ACCOUNT_SID`
- `NEXT_PUBLIC_TWILIO_AUTH_TOKEN`
- `NEXT_PUBLIC_AWS_ACCESS_KEY_ID`
- `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_MONGODB_URI`

## Troubleshooting

### ngrok URL changes
- ngrok free tier gives you a new URL each time you restart
- Update Twilio webhook URL when this happens
- Consider ngrok paid plan for static URLs

### Webhook not receiving messages
1. Check ngrok is running: `http://127.0.0.1:4040`
2. Verify Twilio webhook URL is correct
3. Check your app logs for errors
4. Test webhook health check: `GET https://abc123.ngrok.io/api/twilio_webhook_whatsapp`
