# strava-elevation

A Next.js application that receives Strava webhook callbacks, extracts elevation from activity descriptions, updates the activity elevation, and clears the description.

Inspired by [simmosn/strava-comment-evelation](https://github.com/simmosn/strava-comment-evelation).

## How It Works

1. Connect your Strava account via OAuth
2. Add an activity with elevation in the description (e.g., `300m` or `1000ft`)
3. Strava sends a webhook to this app
4. We parse the elevation from your description, update the activity, and clear the description

## Supported Formats

- `300m` or `300 meters` (meters)
- `1000ft` or `1000 feet` (feet - automatically converted to meters)

## Setup

### 1. Create a Strava API Application

1. Go to [Strava Developers](https://www.strava.com/settings/api)
2. Create an application
3. Set the Authorization Callback Domain to your deployment URL
4. Note your Client ID and Client Secret

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=your_random_verify_token
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### 3. Register Webhook

Create a webhook subscription via Strava API:

```bash
curl -X POST https://api.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F callback_url=https://your-app.vercel.app/api/webhook \
  -F verify_token=YOUR_VERIFY_TOKEN
```

### 4. Deploy to Vercel

```bash
npm install
npm run build
vercel deploy
```

## Development

```bash
npm install
npm run dev
```

## License

MIT
