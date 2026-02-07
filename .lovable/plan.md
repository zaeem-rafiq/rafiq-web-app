

# Rafiq — North America's Islamic Wealth Platform

## Overview
A modern, mobile-first single-page React app with 4 pages, a custom Islamic finance color scheme, and AI-powered features. Built with React Router, Tailwind CSS, and Lovable Cloud for backend functionality.

---

## 1. Global Setup & Design System

- **Color scheme**: Forest Green (#2D5A3D) primary, Gold (#C9A227) accent, Cream (#F5F5DC) background, Charcoal text — applied via Tailwind CSS variables
- **Typography**: Clean, modern sans-serif with clear hierarchy
- **Navigation bar**: Rafiq logo/name on the left, links to all 4 pages (Home, Screener, Zakat, Ask Rafiq), responsive hamburger menu on mobile
- **Rounded cards, subtle shadows**, consistent spacing throughout
- **Mobile-first responsive design**

---

## 2. Landing Page (`/`)

- **Hero section**: Headline "Your Islamic Finance Companion" with subheading about halal investing, zakat, and AI guidance for North American Muslims
- **Ramadan 2026 countdown timer**: Live countdown to February 18, 2026 showing days, hours, minutes, seconds in styled pill/card format
- **3 Feature preview cards**: Halal Stock Screener, Zakat Calculator, Ask Rafiq — each with icon, description, and link to the respective page
- **Email waitlist signup**: Input field + "Join the Waitlist" button with success toast on submit (UI only — Firebase integration to be added by user post-export)
- **Footer**: "Launching Ramadan 2026" tagline with app store badge placeholders

---

## 3. Halal Stock Screener (`/screener`)

### Two-tier architecture:
- **Tier 1 — Instant local lookup**: Bundled JSON dataset of 2,127 Shariah-compliant stocks for instant results
- **Tier 2 — Live API fallback**: For stocks not found locally, a backend edge function performs live AAOIFI screening against a financial API

### UI:
- **Search bar**: "Search any stock ticker (e.g. AAPL, MSFT)"
- **Results card**: Stock symbol, name, sector, and compliance status badge (HALAL in green / NOT HALAL in red / QUESTIONABLE in amber)
- **AAOIFI screening criteria section**: 4 ratio cards with progress bars and pass/fail indicators:
  - Debt Ratio (<33%)
  - Interest Income (<5%)
  - Cash & Securities (<33%)
  - Business Activity
- **Empty state**: "Search a stock to check its Shariah compliance"

---

## 4. Zakat Calculator (`/zakat`)

### Multi-step form:
- **Step 1 — Madhab selector**: Pill buttons for Hanafi, Shafi'i, Maliki, Hanbali, Ja'fari
- **Step 2 — Asset input form**: Fields for Cash & Bank Accounts, Gold (grams), Silver (grams), Investments, Business Inventory, Debts Owed
- **Step 3 — Results card**:
  - Total Assets, Nisab Threshold (with live gold/silver prices fetched via API), Zakat Due (2.5%), breakdown by category
  - **Ja'fari special note**: "Cash and investments fall under Khums (20%), not Zakat. Zakat applies to gold, silver, livestock, and crops."
  - **Nisab toggle**: Only shown for Shafi'i/Maliki/Hanbali — toggle between gold and silver standard

### Backend:
- Edge function to fetch live gold/silver prices for accurate Nisab calculation

---

## 5. Ask Rafiq (`/ask`)

### AI-powered chat interface using Lovable AI:
- **Chat bubbles**: User messages on the right, Rafiq responses on the left with green accent
- **Streaming responses**: Real-time token-by-token rendering as AI responds
- **Text input with send button** at the bottom of the screen
- **4 suggested question chips** above input:
  - "Is AAPL halal?"
  - "How do I calculate zakat?"
  - "What's the difference between zakat and sadaqah?"
  - "Can I invest in index funds?"
- **Typing indicator animation** while waiting for response
- **Disclaimer footer**: "Rafiq provides educational guidance, not fatwas. Consult a qualified scholar for complex rulings."

### Backend:
- Edge function connecting to Lovable AI with an Islamic finance-focused system prompt
- Markdown rendering for formatted responses

---

## 6. Backend (Lovable Cloud)

Three edge functions:
1. **`chat`** — Handles Ask Rafiq AI conversations via Lovable AI gateway with streaming
2. **`screen-stock`** — Live AAOIFI stock screening fallback for tickers not in the bundled dataset
3. **`metal-prices`** — Fetches current gold and silver prices for Zakat Nisab calculation

