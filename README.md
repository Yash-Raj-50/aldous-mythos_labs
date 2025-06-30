# Aldous: AI-Powered Conversational Platform 🚀

Aldous is an intelligent, multi-platform conversational AI application built with Next.js, designed to provide insightful analysis and engage in human-like conversations across various messaging platforms.

---

## ✨ Key Features

- **Multi-Platform Integration:** WhatsApp (via Twilio) & Facebook Messenger
- **Advanced AI:** Anthropic Claude, AWS Bedrock, multimodal analysis (images/audio)
- **Rich Insights:** Emotional trajectory, inflection points, and more
- **Secure & Scalable:** MongoDB, AWS, JWT, and robust error handling

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **AI/ML:** Anthropic Claude, AWS Bedrock, Rekognition, Transcribe
- **Cloud Storage:** AWS S3
- **Messaging:** Twilio (WhatsApp), Facebook Messenger
- **UI:** React, Material-UI, Chart.js

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v20+)
- npm or yarn
- MongoDB instance (local/cloud)
- AWS Account
- Twilio Account (WhatsApp enabled)
- Facebook Developer Account & Page

### Installation
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd aldous
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   Create a `.env.local` file in the root of the project and add the following:

---

## 🔑 Environment Variables

| Variable Name                        | Description                                 |
|--------------------------------------|---------------------------------------------|
| `NEXT_PUBLIC_MONGODB_URI`            | MongoDB connection string                   |
| `NEXT_PUBLIC_MONGODB_USERNAME`       | (Optional) MongoDB username                 |
| `NEXT_PUBLIC_MONGODB_PASSWORD`       | (Optional) MongoDB password                 |
| `NEXT_PUBLIC_AWS_REGION`             | AWS region (e.g., `us-east-1`)              |
| `NEXT_PUBLIC_AWS_ACCESS_KEY_ID`      | AWS access key                              |
| `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY`  | AWS secret key                              |
| `NEXT_PUBLIC_AWS_S3_BUCKET`          | AWS S3 bucket name                          |
| `NEXT_PUBLIC_TWILIO_ACCOUNT_SID`     | Twilio Account SID                          |
| `NEXT_PUBLIC_TWILIO_AUTH_TOKEN`      | Twilio Auth Token                           |
| `NEXT_PUBLIC_FACEBOOK_APP_SECRET`    | Facebook App Secret                         |
| `NEXT_PUBLIC_FACEBOOK_PAGE_ACCESS_TOKEN` | Facebook Page Access Token              |
| `NEXT_PUBLIC_FACEBOOK_VERIFY_TOKEN`  | Facebook Webhook Verify Token               |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY`      | Anthropic Claude API Key                    |
| `NEXT_PUBLIC_JWT_SECRET`             | JWT secret for authentication               |
| `NODE_ENV`                           | `development` or `production`               |

> **Note:** Some variables may be optional depending on your deployment and database setup. Always keep your secrets safe!

---

## 🏃 Running the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

- `src/app/api/`         – API routes (webhooks, etc.)
- `src/app/dashboard/`   – User dashboard
- `src/actions/`         – Server actions (data, mutations)
- `src/components/`      – Reusable React components
- `src/lib/`             – Core libraries/utilities
- `src/models/`          – Mongoose schemas
- `src/services/`        – AWS & external service helpers
- `src/types/`           – TypeScript types

---

## 💡 Tips & Best Practices
- Keep your `.env.local` file out of version control.
- Update webhook URLs if using ngrok (free tier changes on restart).
- Check `DOCUMENTATION.md` for deep-dive architecture and setup.

---

## 🚧 Future Updates
- Real-time dashboard (WebSockets)
- More messaging platforms (Slack, Telegram)
- Enhanced admin panel
- More advanced AI integrations

---

## 📚 More Info
- See `DOCUMENTATION.md` for detailed architecture, setup, and troubleshooting.
- For platform-specific setup, check the relevant sections in the documentation.

---

> Made with ❤️ by Mythos Labs
