# Nira

> get a date every wednesday

A minimalist black-and-white dating landing page built with Next.js 14, TypeScript, and Tailwind CSS. Features WeChat OAuth login, email signup, real-time countdown timer, and full SEO.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Auth.js (NextAuth v5) + WeChat Provider
- **Database**: Supabase (Postgres)
- **Deployment**: Vercel

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Fill in your .env.local values (see below)

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXTAUTH_SECRET` | Random string for Auth.js encryption |
| `NEXTAUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `WECHAT_APP_ID` | WeChat Open Platform App ID |
| `WECHAT_APP_SECRET` | WeChat Open Platform App Secret |

## Supabase Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wechat_openid TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Vercel Deployment

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Vercel auto-detects Next.js — no build config needed
4. Add all environment variables from `.env.example` in the Vercel dashboard
5. Click **Deploy**

## WeChat Open Platform Setup

1. Register at [open.weixin.qq.com](https://open.weixin.qq.com)
2. Create a **Website Application**
3. Set the **Authorization Callback Domain** to your Vercel domain
4. Copy the **AppID** and **AppSecret** to your Vercel environment variables
5. Redeploy after setting the variables

## Project Structure

```
app/
  layout.tsx          Root layout + SEO metadata
  page.tsx            Main landing page
  globals.css         Tailwind + custom styles
  sitemap.ts          Dynamic sitemap
  api/
    signup/route.ts   Email signup endpoint
    auth/[...nextauth]/route.ts  Auth.js handler

components/
  Navbar.tsx          Fixed navigation bar
  HeroSection.tsx     Hero with countdown
  CountdownTimer.tsx  Real-time countdown
  HowItWorks.tsx      4-step explainer
  RealDatesSection.tsx  Stats section
  MatchmakerSection.tsx  AI features
  GallerySection.tsx  Photo carousel
  ComparisonSection.tsx  vs competitors
  SafetySection.tsx   Safety features
  FAQSection.tsx      Accordion FAQ
  Footer.tsx          Footer + marquee
  JoinModal.tsx       Signup modal
  MobileMenu.tsx      Mobile slide-out nav
  WeChatLoginButton.tsx  WeChat OAuth

lib/
  supabase.ts         Supabase client
  countdown.ts        Countdown utilities
  auth.ts             Auth.js + WeChat provider
```
