# AI Lyrics Generator

A professional AI-powered lyrics generator supporting multiple languages and styles, integrated with Paddle payment system.

## Features

- **AI Lyrics Generation**: Generate professional-quality lyrics using advanced AI technology
- **Multi-language Support**: Support lyrics generation in 100+ languages
- **Multiple Styles**: Support Pop, Hip-Hop/Rap, R&B, Rock, Country, and more music styles
- **Agent Mode**: Chat-based AI agent that understands your creative vision and generates lyrics accordingly
- **Subscription System**: Integrated Paddle payment with monthly and annual subscriptions
- **Secure Authentication**: Complete user authentication and authorization system
- **Responsive Design**: Support desktop and mobile devices
- **High Performance**: Built on Next.js 15 with SSR and static generation

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini 2.5 (Flash & Pro)
- **Payment**: Paddle
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Paddle account

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file and configure the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google AI API
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Paddle Payment Configuration
NEXT_PUBLIC_PADDLE_CLIENT_ID=your-paddle-client-id
PADDLE_API_KEY=your-paddle-api-key
PADDLE_WEBHOOK_SECRET=your-paddle-webhook-secret
NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID=your-monthly-price-id
NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID=your-yearly-price-id
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_API_BASE_URL=https://sandbox-api.paddle.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Database Setup

1. Create a new project in Supabase
2. Run the database migration scripts (refer to `Database.md`)
3. Configure RLS policies and permissions

### Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## Paddle Payment Integration

### Features

- Overlay Checkout using Paddle.js
- Environment switching (sandbox/production)
- Complete webhook event handling
- Subscription management (create, cancel, pause, resume)
- HMAC signature verification for webhook security

### Webhook Configuration

Configure the webhook endpoint in Paddle Dashboard:

```
https://your-domain.com/api/webhook/paddle
```

Supported webhook events:
- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.paused`
- `subscription.resumed`
- `transaction.completed`
- `transaction.billing_failed`

## Project Structure

```
app/                    # Next.js App Router
  api/                  # API routes
    generate-stream/    # Streaming lyrics generation
    rewrite/            # Lyrics rewrite
    webhook/            # Webhook handling
    subscription/       # Subscription management
  auth/                 # Authentication pages
  dashboard/            # User dashboard
  generate/             # Lyrics generation (Agent mode)
  edit/                 # Lyrics editor
  pricing/              # Pricing page
components/             # React components
  layout/               # Layout components
  pricing/              # Pricing components
  ui/                   # UI components
lib/                    # Utility library
  hooks/                # Custom hooks
  ai-service.ts         # AI service (Gemini integration)
  supabase.ts           # Supabase client
public/                 # Static assets
```

## Deployment

### Vercel Deployment

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License

## Support

If you have questions, please contact us through:
- Submit a GitHub Issue
- Send email to support@your-domain.com
