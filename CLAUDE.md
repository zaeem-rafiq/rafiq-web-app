# CLAUDE.md — Rafiq Web App

This file provides guidance to Claude Code when working with the Rafiq web application.

---

## Product Overview

**Rafiq** ("companion" in Arabic) is North America's Islamic Wealth Platform. This web app is the **public-facing companion** to the native iOS app, providing free Islamic finance tools:

1. **Halal Stock Screener** — AAOIFI-compliant stock screening with live financial data
2. **Zakat Calculator** — Madhab-aware zakat obligation calculator (5 Islamic schools)
3. **Khums Calculator** — For Ja'fari (Shia) users
4. **Tatheer (Purification) Calculator** — Dividend purification with haram stock detection
5. **Ask Rafiq** — AI assistant for Islamic finance questions (Claude API)
6. **Landing Page** — Marketing site with waitlist signup

---

## Build Commands

```bash
# Development server (port 8080)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Tests
npm run test
npm run test:watch

# Cloud Functions build
cd functions && npm run build

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:getTatheerData
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 (SWC compiler) |
| **Routing** | React Router DOM v6 |
| **UI Components** | shadcn/ui (49 components, Radix UI primitives) |
| **Styling** | Tailwind CSS v3 + custom theme |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod validation |
| **Data Fetching** | TanStack React Query v5 |
| **Backend** | Firebase Cloud Functions (Node 20, TypeScript) |
| **Stock Data API** | FMP (Financial Modeling Prep) `/stable/` endpoints |
| **Hosting** | Firebase Hosting (SPA rewrite) |
| **Testing** | Vitest |

---

## Project Structure

```
rafiq-web-app/
├── src/
│   ├── pages/                    # Route pages
│   │   ├── Index.tsx             # Landing page (hero, features, waitlist)
│   │   ├── Screener.tsx          # Halal stock screener (~821 lines)
│   │   ├── Zakat.tsx             # Multi-tab calculator (~1,460 lines)
│   │   ├── AskRafiq.tsx          # AI chat assistant
│   │   └── NotFound.tsx          # 404 page
│   ├── components/
│   │   ├── landing/              # Homepage sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeatureCards.tsx
│   │   │   ├── WaitlistSection.tsx
│   │   │   └── FooterSection.tsx
│   │   ├── ui/                   # shadcn/ui components (49)
│   │   ├── Navbar.tsx            # Top navigation bar
│   │   ├── NavLink.tsx           # Navigation link component
│   │   └── CountdownTimer.tsx    # Countdown display
│   ├── data/                     # Stock & Islamic finance data
│   │   ├── halal-stocks.ts       # 42 curated stocks + Shariah index search
│   │   └── djim-stocks.ts        # 62 DJIM stocks + loader
│   ├── lib/                      # Utility libraries
│   │   ├── firebase.ts           # Firebase init + httpsCallable
│   │   ├── zakat-utils.ts        # Madhab-aware zakat engine (~174 lines)
│   │   └── utils.ts              # General utilities (cn, etc.)
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-mobile.tsx        # Mobile detection
│   │   └── use-toast.ts          # Toast notification hook
│   ├── assets/                   # Static images
│   │   └── rafiq-logo.png
│   ├── test/                     # Vitest tests
│   │   ├── setup.ts
│   │   ├── example.test.ts
│   │   └── zakat-utils.test.ts   # Zakat calculation unit tests
│   ├── App.tsx                   # Root component with routing
│   ├── main.tsx                  # React DOM entry point
│   └── index.css                 # Global styles (Tailwind + CSS vars)
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts              # Exports getTatheerData
│   │   └── getTatheerData.ts     # Tatheer calculator CF (~285 lines)
│   ├── package.json              # firebase-admin, firebase-functions
│   └── tsconfig.json
├── public/
│   ├── halal_screener_data.json  # 2,127-stock Shariah index dataset
│   ├── rafiq-logo.png
│   ├── favicon.ico
│   └── robots.txt
├── .github/
│   └── workflows/
│       └── auto-pr.yml           # Auto-PR + auto-merge for claude/** branches
├── package.json                  # 52 dependencies, 21 dev deps
├── vite.config.ts                # Vite config (port 8080, @ alias)
├── vitest.config.ts              # Vitest test configuration
├── tailwind.config.ts            # Custom brand colors + animations
├── postcss.config.js             # PostCSS configuration
├── eslint.config.js              # ESLint flat config
├── components.json               # shadcn/ui configuration
├── firebase.json                 # Hosting (dist/) + Functions config
├── .firebaserc                   # Firebase project: cs-host-d16e2e0b46424fee9ba64f
├── tsconfig.json                 # TypeScript config (loose mode)
├── tsconfig.app.json             # App-specific TS config
└── tsconfig.node.json            # Node.js TS config
```

---

## Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Index.tsx` | Landing page — hero, features, waitlist |
| `/screener` | `Screener.tsx` | Halal stock screener with live AAOIFI screening |
| `/zakat` | `Zakat.tsx` | Multi-tab calculator (Zakat, Khums, Tatheer, Sadaqah) |
| `/ask` | `AskRafiq.tsx` | AI chat assistant (Claude via Cloud Function) |
| `*` | `NotFound.tsx` | 404 fallback |

---

## Key Features

### Zakat Calculator (`Zakat.tsx`)
The largest page (~1,460 lines) with 4 tabs:

1. **Zakat Tab** — Madhab-aware calculation using `zakat-utils.ts`
   - 5 madhabs: Hanafi, Shafi'i, Maliki, Hanbali, Ja'fari
   - Hanafi enforces silver nisab; Ja'fari enforces gold
   - Ja'fari shows only gold/silver/livestock/crops (cash → Khums)
   - Live gold/silver prices for nisab threshold
   - Asset breakdown with per-category zakat amounts
   - **Asset categories:** cash, gold, silver, investments (1/3 zakatable), business inventory, crypto, livestock, crops, personal jewelry, retirement accounts
   - **Madhab-specific deductions:** Hanafi deducts debts + living expenses; Shafi'i no debt deduction (gross assets); Maliki/Hanbali debts only
   - **Jewelry handling:** Hanafi always included; Shafi'i/Maliki/Hanbali opt-in toggle; Ja'fari excluded
   - **Retirement accounts:** Shafi'i/Hanbali opt-in toggle (1/3 zakatable ratio)

2. **Khums Tab** — 20% annual surplus income (Ja'fari only)
   - Income, expenses, property deductions
   - Sahm al-Imam + Sahm al-Sadat split

3. **Tatheer Tab** — Dividend purification calculator
   - Calls `getTatheerData` Cloud Function (FMP API)
   - 3-layer ticker resolution: client Shariah index → djimStocks → CF FMP search
   - Autocomplete from 2,127-stock Shariah index with company names
   - Resolution confirmation banner when company name → ticker
   - **Haram stock detection**: backend `NOT_HALAL_SYMBOLS` + client `findStock()` fallback
   - Haram stocks: red warning, 100% dividend donation, cost basis gains calculator
   - Normal stocks: ratio-based purification (non-compliant % × dividends)

4. **Sadaqah Tab** — Voluntary charity tracker
   - Quick-add presets, purpose selection, history log

### Halal Stock Screener (`Screener.tsx`)
- Search 2,127+ stocks from curated Shariah index
- Live AAOIFI screening via `askRafiqWeb` Cloud Function
- 4 screening criteria: debt ratio (<33%), interest income (<5%), cash/securities (<33%), business activity
- AI-generated compliance explanations
- Curated 45-stock detail view with ratios

### Ask Rafiq (`AskRafiq.tsx`)
- Chat interface with Claude AI via `askRafiqWeb` Cloud Function
- Suggested questions for quick start
- Stock symbol detection in messages (auto-lookup halal status)
- Markdown rendering for AI responses

---

## Data Architecture

### Client-Side Data (Offline-Ready)

| File | Entries | Purpose |
|------|---------|---------|
| `halal-stocks.ts` → `halalStocks[]` | 45 | Curated stocks with `HALAL/NOT HALAL/QUESTIONABLE` status + AAOIFI ratios |
| `djim-stocks.ts` → `djimStocks[]` | 52 | DJIM index stocks with name/sector |
| `halal_screener_data.json` | 2,127 | Full Shariah index with `{symbol, name?, sector, region}` |

**Search Priority:**
1. `halalStocks` — instant, has full status + ratios
2. `djimStocks` — instant, has name/sector
3. `halal_screener_data.json` — loaded lazily via `loadShariahIndex()`, cached in memory

**Key Functions:**
- `findStock(symbol)` — Lookup in `halalStocks` by symbol
- `searchExtended(query, index)` — Search across halalStocks + full Shariah index
- `searchShariahByName(query, index)` — Search full index by company name (for Tatheer autocomplete)
- `findInIndex(symbol, index)` — Find stock in Shariah index
- `isHalalStock(item)` — Type guard: `HalalStock` vs `ShariahIndexEntry`

### Cloud Function — `getTatheerData`

**File:** `functions/src/getTatheerData.ts`
**Type:** Firebase `onCall` (v2)
**Secret:** `FMP_API_KEY`

**Input:** `{ symbol: string, shares: number }`
**Output:**
```typescript
{
  companyName: string,
  annualDividend: number,
  quarterlyDividend: number,
  frequency: string,
  totalAnnualDividends: number,
  totalQuarterlyDividends: number,
  nonCompliantRatio: number,
  annualPurification: number,
  quarterlyPurification: number,
  shares: number,
  dataSource: "fmp",
  hasDividend: boolean,
  resolvedTicker: string,
  inputWasResolved: boolean,
  currentPrice: number,
  isNotHalal: boolean,
}
```

**Logic Flow:**
1. If input is ticker format (1-5 uppercase letters) → use directly
2. If input is company name → FMP `/stable/search-symbol` → `/stable/search-name` (with US exchange priority + name validation)
3. Fetch in parallel: FMP profile, dividends, income-statement
4. Check `NOT_HALAL_SYMBOLS` set for haram classification
5. Calculate non-compliant ratio from income statement
6. Return dividend + purification data

**FMP Endpoints Used:**
- `/stable/search-symbol?query=...` — Ticker search
- `/stable/search-name?query=...` — Company name search (limit 10, US exchange filter)
- `/stable/profile?symbol=...` — Company profile, price, last dividend
- `/stable/dividends?symbol=...` — Historical dividend data
- `/stable/income-statement?symbol=...` — Revenue, interest income/expense for non-compliant ratio

**Haram Detection:**
```
NOT_HALAL_SYMBOLS: JPM, BAC, WFC, GS, MS, C, USB, PNC, COF, SCHW,
  BRK.B, AIG, MET, PRU, ALL, TRV, DEO, BUD, STZ, PM, MO, BATS,
  MGM, LVS, WYNN, DKNG, CZR
```

---

## Environment Variables

### Frontend (Vite — prefix with `VITE_`)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Cloud Functions (Firebase Secrets)
```
FMP_API_KEY          # Financial Modeling Prep API key
```

Set via: `firebase functions:secrets:set FMP_API_KEY`

---

## Firebase Configuration

- **Project ID:** `cs-host-d16e2e0b46424fee9ba64f`
- **Hosting:** Serves `dist/` directory, SPA rewrite (`** → /index.html`)
- **Functions:** Source in `functions/`, Node 20 runtime
- **No Firestore/Auth** in the web app (those are in the iOS app's Firebase project)

---

## Brand & Theme

### Colors (Tailwind CSS Variables)
- `forest` — Primary green (trust, Islamic association)
- `gold` — Accent (premium, prosperity)
- `cream` — Background warmth
- `sage` — Secondary green
- `halal` — Green for compliant stocks
- `haram` — Red for non-compliant stocks
- `questionable` — Orange/amber for questionable stocks

### Typography
- **Body:** Inter (system fallback)
- **Headings/UI:** Plus Jakarta Sans (system fallback)

### Animations
- `fade-in-up` — Card entry animation
- `pulse-dot` — AI typing indicator
- `accordion-down/up` — Expandable sections
- Framer Motion `AnimatePresence` for route transitions and conditional UI

---

## Code Patterns

- **Path alias:** `@/` maps to `src/` (configured in tsconfig + vite)
- **Component imports:** `import { Button } from "@/components/ui/button"`
- **Firebase calls:** `httpsCallable(functions, "functionName")` from `@/lib/firebase`
- **Lazy data loading:** `loadShariahIndex()` returns cached Promise for 2,127-stock index
- **Dual-layer detection:** Backend classification (primary) + client-side `findStock()` (fallback)
- **TypeScript:** Loose mode (`strict: false`, `noImplicitAny: false`) — focus on speed over type safety
- **shadcn/ui pattern:** Components in `src/components/ui/`, imported individually
- **Toast notifications:** `useToast()` hook from `@/hooks/use-toast`

---

## Relationship to iOS App

The web app and iOS app share the same Firebase project but are **separate codebases**:

| | Web App | iOS App |
|---|---------|---------|
| **Repo** | `rafiq-web-app` | `rafiq-ios` |
| **Stack** | React + TypeScript + Vite | SwiftUI + Firebase |
| **Auth** | None (public tools) | Firebase Auth |
| **Firestore** | None | Full user data |
| **Cloud Functions** | `getTatheerData` (1 function) | 17 functions |
| **Purpose** | Free public tools + marketing | Full personal finance app |

The web app's `getTatheerData` is a **separate Cloud Function** from the iOS app's. They share the same FMP API key secret.

The `halal_screener_data.json` file exists in both repos (identical content — 2,127 DJIM stocks).

---

## Deployment

```bash
# Build frontend + functions, then deploy
npm run build && cd functions && npm run build && cd .. && firebase deploy

# Or deploy separately
firebase deploy --only hosting
firebase deploy --only functions:getTatheerData
```

**Hosting URL:** Configured in Firebase Console
**Functions Region:** Default (us-central1)

---

## CI/CD

### GitHub Actions — Auto PR (`.github/workflows/auto-pr.yml`)

Automatically creates PRs and enables auto-merge for branches matching `claude/**`:

- **Trigger:** Push to any `claude/**` branch
- **Action:** Creates a PR to `main` (or skips if one already exists), then enables squash auto-merge
- **Token:** Uses `GITHUB_TOKEN` (default GitHub Actions token)

---

## Recent Changes

### February 8, 2026: Comprehensive Zakat Calculator Enhancement

Major expansion of zakat calculation logic (`zakat-utils.ts`) and UI (`Zakat.tsx`):

- **New asset categories**: crypto, retirement accounts, personal jewelry, living expenses
- **Stock zakatable ratio**: Investments use 1/3 ratio (tangible fixed assets exempt)
- **Madhab-specific deduction rules**: Shafi'i (no debt deduction), Hanafi (debts + living expenses), Maliki/Hanbali (debts only)
- **Jewelry handling**: Hanafi always included, Shafi'i/Maliki/Hanbali opt-in, Ja'fari excluded
- **Retirement accounts**: Shafi'i/Hanbali opt-in with 1/3 zakatable ratio
- **Unit tests**: Added `src/test/zakat-utils.test.ts` for calculation logic

### February 8, 2026: Haram Stock Warning + Cost Basis Gains Calculator in Tatheer

Added haram stock detection and cost basis gains calculator to the Tatheer tab:

- **Backend** (`getTatheerData.ts`): Added `NOT_HALAL_SYMBOLS` set (25 stocks), `currentPrice` from FMP profile, `isNotHalal` boolean in response
- **Frontend** (`Zakat.tsx`): Red warning banner for haram stocks, 100% dividend donation override, expandable cost basis calculator with unrealized gains/loss, "Total Recommended Donation" (dividends + gains), CharitySection amount override
- **Dual-layer detection**: Backend `NOT_HALAL_SYMBOLS` (primary) + client `findStock()` status check (fallback)

### February 8, 2026: Fix Tatheer Company Name → Ticker Resolution (VZ vs Verizon)

3-layer fix for company names returning different data than their tickers:

- **Data enrichment**: Ran `enrich-djim-names.ts` script to add company names to all 2,127 Shariah index entries via FMP profile API
- **CF validation**: Added `isReasonableNameMatch()` to validate FMP search results match user query (prevents "Verizon" → "Vertiv")
- **UI**: Added resolution confirmation banner ("Showing results for VZ (Verizon Communications Inc.)")

### February 8, 2026: Fix Tatheer Showing "No Dividends" for Valid Tickers

- Migrated FMP endpoints from deprecated `/api/v3/` to `/stable/`
- Fixed dividend response parsing (flat array vs `{historical}` wrapper)
- Added proper income statement fields for non-compliant ratio calculation

### February 7, 2026: Tatheer Calculator — Live FMP Integration

- Built `getTatheerData` Cloud Function with FMP dividend + income statement lookups
- Added stock ticker autocomplete with DJIM data
- Quarterly and annual purification calculations
- Non-compliant ratio from income statement interest fields
