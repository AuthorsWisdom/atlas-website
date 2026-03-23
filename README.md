# ATLAS Website

Landing page for atlasapp.io — built with Next.js 14, TypeScript, Tailwind CSS.

## Setup

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

Open http://localhost:3000

## Project Structure

```
app/
  layout.tsx      ← Root layout + SEO metadata
  page.tsx        ← Main page (assembles all sections)
  globals.css     ← Base styles + CSS variables (light/dark mode)

components/
  Nav.tsx         ← Top navigation bar
  Hero.tsx        ← Hero section + waitlist email form
  Features.tsx    ← 6-feature grid
  Pricing.tsx     ← Free / Pro / Institutional tiers
  Footer.tsx      ← Footer with legal disclaimer
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Vercel auto-detects Next.js — click Deploy
4. Add your custom domain `atlasapp.io` in Project Settings → Domains

## Connect a real email list (Waitlist)

The form in `Hero.tsx` currently increments a local counter.
To capture real emails, add [Resend](https://resend.com):

1. `npm install resend`
2. Create `app/api/waitlist/route.ts` with a POST handler
3. Call the API route from `Hero.tsx` on form submit

## Environment Variables

Create `.env.local` for any API keys:

```
RESEND_API_KEY=re_...
```

Never commit `.env.local` to git.
