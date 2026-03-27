# LOCKED DECISIONS — READ BEFORE TOUCHING ANY CODE

Parent Protocol: https://github.com/AuthorsWisdom/nexus-protocol

---

## 🔴 HARD LOCKS

- Browser NEVER calls Railway or external APIs directly (CSP)
  → All external data via /api/* proxy or SSE stream
- No PWA — sw.js and manifest.json DELETED, do not recreate
- No order execution UI — signals and intelligence display only

## 🟡 ARCHITECTURE LOCKS

- Supabase client: singleton via getSupabase() in lib/supabase.ts
  → Never call createClient() in components
  → audit: grep -rn "createClient" app/ lib/

- Live prices: SSE via /api/stream → Railway
  → Never direct WebSocket to Binance/Alpaca from browser
  → audit: grep -rn "new WebSocket" app/ hooks/

- Quote proxy: /api/quote/[symbol] handles stocks AND crypto
  → Single unified route, no separate crypto/stock routing in frontend

- NEXT_PUBLIC_ vars baked at build time
  → Always redeploy after adding new NEXT_PUBLIC_ vars

- News proxy: /api/news → Railway /news/*
  → 5-minute cache, always returns array never error

## 🟢 PRODUCT LOCKS

- Supabase Site URL: https://xatlas.io (never mobile deep link)
- Waitlist OTP creates accounts → signIn fallback (not signUp)
- Nav label: "Dashboard" for /app route (not "App" or "Terminal")
- BYOK copy: "Billed directly by your chosen AI provider. No markup."
- Free tier sees: FRED macro, conviction score number, basic prices
- Pro tier unlocks: AI text, options flow, breakdown bars, unlimited watchlist
- Model selector: in AI chat window only, filtered by user's available keys
- Benzinga blur for free users is intentional — shows premium content exists

## Infrastructure

- Frontend: Vercel (xatlas.io)
- Backend: Fly.io (atlas-backend-silent-log-2366.fly.dev)
- Region: fra (Frankfurt) — required for Binance WebSocket (US IPs blocked)
- Database/Auth: Supabase
- GitHub: AuthorsWisdom/atlas-website

Last updated: 2026-03-27
Nexus Protocol: https://github.com/AuthorsWisdom/nexus-protocol

## Proxy Route Map (browser never calls Fly.io directly)
- /api/score/[symbol]    → FLY_URL/score/{symbol}
- /api/quote/[symbol]    → FLY_URL/quote/{symbol}
- /api/chart/[symbol]    → FLY_URL/chart/{symbol}
- /api/news              → FLY_URL/news/{type}
- /api/ai/chat           → FLY_URL/ai/chat
- /api/options/*         → FLY_URL/options/*
- /api/stream            → FLY_URL/stream/quotes (SSE)
