# Scout India — Complete Project Documentation

> **AI-Powered IPL Cricket Auction Strategy Platform**
> Last updated: June 2026
> Status: Phase 1 complete · Phase 2.1 in progress

---

## Table of Contents

1. [Project Overview](#chapter-1--project-overview)
2. [Vision & Target Users](#chapter-2--vision--target-users)
3. [Technology Stack](#chapter-3--technology-stack)
4. [System Architecture](#chapter-4--system-architecture)
5. [Database Schema](#chapter-5--database-schema)
6. [Data Pipeline](#chapter-6--data-pipeline)
7. [AI Integration](#chapter-7--ai-integration)
8. [Feature Catalogue (Pages)](#chapter-8--feature-catalogue-pages)
9. [Component Library](#chapter-9--component-library)
10. [Project File Structure](#chapter-10--project-file-structure)
11. [Setup & Local Development](#chapter-11--setup--local-development)
12. [Phase 1 Summary](#chapter-12--phase-1-summary)
13. [Phase 2 Roadmap](#chapter-13--phase-2-roadmap)
14. [Glossary](#chapter-14--glossary)

---

## Chapter 1 — Project Overview

### What is Scout India?

Scout India is a full-stack web application that helps cricket franchise owners, analysts, and serious fans make smarter decisions at the **IPL auction**. Every year, IPL teams spend hundreds of crores buying players, and the teams that win are the ones with the best data and the smartest strategy.

The platform combines:
- A **massive ball-by-ball cricket database** (1.5 million+ deliveries across 5,500+ matches)
- An **AI strategist** (powered by Anthropic's Claude) that gives bid recommendations, player comparisons, squad-balance analysis, and price predictions
- **Interactive visualisations** that turn raw stats into actionable insights
- A **live mock auction simulator** so users can practice their strategy

### What's in this document?

This documentation is intended for **future developers, collaborators, mentors, and reviewers** who want to understand:
- What the project does
- How it's built
- Why each technology was chosen
- What's been delivered (Phase 1)
- What's planned next (Phase 2)

Every chapter is self-contained. Read top-to-bottom for a full walkthrough, or jump to a chapter by topic.

---

## Chapter 2 — Vision & Target Users

### The Vision

> *"Bring elite franchise-level cricket scouting to everyone with a laptop."*

Traditional auction scouting is locked behind:
- Expensive analytics firms
- Proprietary spreadsheets owned by IPL teams
- Years of cricket-watching experience

Scout India democratises this — through **clean data, AI assistance, and clear visualisations** — into a product anyone can use.

### Target Users

| User | Why they care |
|---|---|
| **Franchise owners & decision-makers** | Sanity-check scouting picks with independent AI analysis |
| **Cricket analysts / journalists** | Quickly pull player data across formats and seasons |
| **Fantasy league players** | Identify undervalued players before public hype |
| **Aspiring cricket professionals** | Learn how IPL auction strategy actually works |
| **Serious cricket fans** | Run mock auctions for fun and bragging rights |

---

## Chapter 3 — Technology Stack

### Layer-by-Layer

| Layer | Technology | Why It Was Chosen |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript | Industry standard for interactive UIs; TypeScript catches bugs at compile time |
| **Build Tool** | Vite | Faster cold-start and hot-reload than Webpack; great DX |
| **Styling** | Tailwind CSS | Utility-first styling lets one developer ship a polished UI fast |
| **UI Components** | shadcn/ui + custom | Headless, accessible primitives — no opinions imposed |
| **Visualisations** | Recharts | React-native charting library, declarative API |
| **State Management** | Zustand | Lightweight global store, simpler than Redux |
| **Routing** | React Router | The de-facto routing solution for React SPAs |
| **Database & Auth** | Supabase (PostgreSQL) | Production-grade DB + realtime + auth out of the box, no server management |
| **AI Provider** | Anthropic Claude API (`claude-haiku-4-5`) | Reliable, well-reasoned answers; follows complex instructions |
| **AI Fallback** | Grok API (xAI) | Used only if Anthropic key is missing |
| **Data Pipeline** | Python 3 (stdlib only) | Standard for data work; no extra dependencies needed |
| **Data Source** | Cricsheet.org | Open-source ball-by-ball JSON; free to use |
| **Hosting (planned)** | Vercel / Netlify | Zero-config React deployment |

### Why this combination?

Every layer was chosen so that **one developer with AI assistance** could ship a production-quality product. Supabase removes DevOps. Vite removes build hell. Tailwind removes CSS hell. Claude removes the need for a data-science team.

---

## Chapter 4 — System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │   React + TypeScript + Tailwind + Vite SPA       │   │
│  │   - 20 pages                                     │   │
│  │   - Auction / Scout / Compare / Analytics        │   │
│  │   - Recharts visualisations                      │   │
│  │   - Zustand state                                │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────┬────────────────────────┬────────────────┘
                │                        │
                ▼                        ▼
┌────────────────────────┐   ┌──────────────────────────┐
│      SUPABASE          │   │   ANTHROPIC CLAUDE API   │
│  - PostgreSQL          │   │  - Bid recommendations   │
│  - 1.5M+ deliveries    │   │  - Player scouting       │
│  - 5,500+ matches      │   │  - Squad analysis        │
│  - Realtime channels   │   │  - Price prediction      │
│  - Auth                │   │  - Natural-language       │
│  - RPC functions       │   │    player search         │
└────────────────────────┘   └──────────────────────────┘
                ▲
                │ (one-time data load)
                │
┌────────────────────────┐
│   PYTHON PIPELINE      │
│  - clean_tournament.py │
│  - upload_tournament.py│
│  - Source: Cricsheet   │
└────────────────────────┘
```

### Request Lifecycle Example — "Get bid advice for Bumrah"

1. User clicks **"Ask AI"** on the auction page.
2. React calls Supabase RPC to fetch Bumrah's career stats.
3. React builds a prompt with the stats + squad context.
4. React calls Claude API directly from the browser.
5. Claude returns a structured recommendation (FAIR VALUE, BID CEILING, REASONING).
6. React renders the response in a card next to the auction timer.

### Why call Claude from the browser?

The current architecture uses `anthropic-dangerous-direct-browser-access: true` to call Claude directly from React. This is fine for development and demo deployments. **In production, calls would be proxied through a backend** (Phase 2 will add FastAPI for LangChain agents).

---

## Chapter 5 — Database Schema

### Core Tables

The schema lives at `supabase/schema.sql`. Key tables:

| Table | Purpose | Approx Rows |
|---|---|---|
| `players` | Player registry with role, batting/bowling style | ~6,000 |
| `teams` | Franchises + state teams + international sides | ~80 |
| `venues` | Stadiums with cities | ~150 |
| `seasons` | Year + raw label (e.g. 2024, "2023/24") | ~25 |
| `matches` | One row per match | 6,678 (planned) |
| `innings` | One row per innings (1 or 2 per match, sometimes 3-4) | ~13,000 |
| `deliveries` | **Ball-by-ball** — the big one | ~1.5 million |
| `wickets` | One row per wicket fallen | ~60,000 |
| `player_match_stats` | Aggregated per-player-per-match stats | ~150,000 |
| `tournaments` | Tournament registry (IPL, SMAT, BBL, PSL, CPL, T20I) | 6 |

### Relationships

```
seasons ──┐
          ├──> matches ──> innings ──> deliveries
teams ────┤              └──────────> wickets
venues ───┘
players ──> player_match_stats
```

### Multi-Tournament Design

Every match-level table has a `tournament` column (`'IPL'`, `'SMAT'`, `'BBL'`, etc.). Combined with indexes, this lets the UI filter all queries by tournament without duplicating tables.

### Important Schema Decisions

- **`players.id` is TEXT** (Cricsheet's 8-char hex UUID) — lets a player exist in multiple tournaments without duplication
- **`deliveries.id` is BIGSERIAL** — needed because row count can grow into millions
- **`UNIQUE(match_id, player_id)`** on `player_match_stats` — prevents accidental double-counting
- **Per-tournament ID offsets** — innings/deliveries/wickets IDs are offset by tournament (IPL: 0+, SMAT: 100K+, BBL: 200K+, etc.) to prevent collisions

---

## Chapter 6 — Data Pipeline

### Source: Cricsheet.org

Cricsheet provides free ball-by-ball JSON for every major cricket match. Each match is one JSON file with `info` (teams, venue, toss, outcome) and `innings` (overs → deliveries → batter/bowler/runs/wickets).

### Pipeline Steps

```
Cricsheet ZIP  →  Extract JSON  →  clean_tournament.py  →  CSV/JSON output  →  upload_tournament.py  →  Supabase
```

### Key Scripts (in `scripts/`)

| Script | Purpose |
|---|---|
| `clean_ipl_data.py` | Original IPL-only cleaner (Phase 1) |
| `clean_tournament.py` | **Parameterised cleaner** — handles any tournament |
| `name_mappings.py` | Venue normalisation + player full-name lookups |
| `generate_players.py` | Helper to bootstrap player metadata |
| `generate_sql_inserts.py` | Generates SQL `INSERT` files for SQL Editor uploads |
| `upload_rest.py` | Original IPL uploader (deliveries + wickets only) |
| `upload_tournament.py` | **New multi-tournament uploader** — handles full data load |
| `upload_to_supabase.py` | Legacy uploader |
| `upload_sql_to_supabase.py` | Legacy SQL-based uploader |
| `upload_direct.py` | Legacy direct uploader |

### Running the Pipeline (for a new tournament)

```bash
# 1. Download from Cricsheet
curl -O https://cricsheet.org/downloads/sma_json.zip
unzip sma_json.zip -d scripts/data/sma_json/

# 2. Clean
python scripts/clean_tournament.py SMAT sma_json

# 3. Upload
python scripts/upload_tournament.py SMAT
```

### Cleaner Internals

`clean_tournament.py`:
- Builds **team maps** per tournament (BBL/PSL/CPL/SMAT/T20I franchise/state name mappings)
- Resolves **player short names → full names** via `name_mappings.py`
- Normalises **venues** (e.g. "Wankhede Stadium, Mumbai" → "Wankhede Stadium")
- Computes **phases** (powerplay/middle/death) from over number
- Aggregates **per-match player stats** (runs, balls, wickets, economy, etc.)
- Outputs to `supabase/data/<tournament>/` as JSON + CSV

### Uploader Internals

`upload_tournament.py`:
- Loads existing teams/venues/seasons from Supabase to avoid duplicates
- Upserts new refs via REST API
- Maps name strings → integer foreign-key IDs
- Streams deliveries CSV (avoids loading 700k rows into memory)
- Batches inserts (500 rows per request) with retry logic
- Tags every row with the `tournament` field

---

## Chapter 7 — AI Integration

### Provider

**Primary:** Anthropic Claude API (`claude-haiku-4-5`)
**Fallback:** Grok API (xAI) — used only if Anthropic key is missing
**Final fallback:** Hardcoded mock responses (for offline development)

### Where It Lives

All AI logic is in **`src/lib/grok.ts`** (filename is legacy — it routes to Claude first).

```typescript
askGrok(userPrompt, systemPrompt) → string
```

The function decides at runtime:
1. If `VITE_ANTHROPIC_API_KEY` exists → call Claude
2. Else if `VITE_GROK_API_KEY` exists → call Grok
3. Else → return a mock response

### System Prompts

Each AI feature has a dedicated system prompt:

| Prompt | Purpose |
|---|---|
| `STRATEGIST_SYSTEM_PROMPT` | Live auction bid recommendations |
| `SCOUT_SYSTEM_PROMPT` | Player tier classification + scouting insights |
| `COMPARE_SYSTEM_PROMPT` | Head-to-head player verdicts |
| `SEARCH_SYSTEM_PROMPT` | Converts natural-language queries → structured filters |
| `SQUAD_ANALYZER_SYSTEM_PROMPT` | Shortlist balance evaluation |
| `PRICE_PREDICTOR_SYSTEM_PROMPT` | Auction price predictions |

### Why Multiple Prompts?

Each AI use-case has different output requirements:
- Auction prompt → must return FAIR VALUE / BID CEILING / RECOMMENDATION in a fixed format
- Search prompt → must return JSON only (no markdown)
- Compare prompt → must return a definitive verdict under 100 words

Structured system prompts make Claude behave consistently across the app.

### Security Notes

- API keys are stored in `.env` (gitignored) and exposed via Vite's `import.meta.env`
- The current setup makes Claude calls **from the browser** using `anthropic-dangerous-direct-browser-access: true`
- For production, Phase 2 will introduce a FastAPI proxy so keys never leave the server

---

## Chapter 8 — Feature Catalogue (Pages)

The app has **20 pages** (in `src/pages/`). Grouped by purpose:

### A. Auction Experience

| Page | What It Does |
|---|---|
| `LandingPage.tsx` | Marketing entry point; describes the platform |
| `LobbyPage.tsx` | Pre-auction setup (pick franchise, set budget) |
| `AuctionRoomPage.tsx` | **The main live auction simulator** — bid in real time against AI |
| `AuctionResultsPage.tsx` | Post-auction summary with final squad + spend |
| `AuctionReplayPage.tsx` | Watch a previous auction unfold step by step |
| `StrategyPage.tsx` | Pre-auction strategy planner with AI advice |

### B. Player Intelligence

| Page | What It Does |
|---|---|
| `ScoutPage.tsx` | **Natural-language player search** — type "young left-arm spinner" and get ranked candidates with AI scouting reports |
| `PlayerProfilePage.tsx` | Deep-dive on one player: career stats, season trends, phase performance |
| `ComparePage.tsx` | Head-to-head comparison with AI verdict |
| `ShortlistPage.tsx` | User's saved player wishlist with AI squad-balance analysis |
| `OverAnalysisPage.tsx` | Visualises player performance by **powerplay / middle / death overs** with Recharts |
| `MatchupExplorerPage.tsx` | Specific batter-vs-bowler statistical matchups |

### C. Team & Venue Analytics

| Page | What It Does |
|---|---|
| `TeamsPage.tsx` | Lists all franchises with logos, colours, key stats |
| `FranchisePage.tsx` | Deep profile of a single franchise — squad, history, season performance |
| `HeadToHeadPage.tsx` | Head-to-head record between any two teams |
| `VenuesPage.tsx` | All venues with venue-specific stats (avg first innings, dew factor) |
| `SeasonPage.tsx` | Season-level summaries (winners, top scorers, top bowlers) |
| `AnalyticsPage.tsx` | Cross-cutting analytics dashboard |

### D. Utility

| Page | What It Does |
|---|---|
| `LoginPage.tsx` | Supabase auth login |
| `NotFoundPage.tsx` | 404 fallback |

### Signature AI-Powered Features

1. **AI Auction Strategist** — runs on every player during a live auction (`AuctionRoomPage`)
2. **Natural-Language Scout** — converts English queries to filters (`ScoutPage`)
3. **AI Player Comparison** — head-to-head with reasoned verdict (`ComparePage`)
4. **Squad Balance Analyzer** — gaps + strengths of a shortlist (`ShortlistPage`)
5. **Price Predictor** — predicts likely auction price (`PlayerProfilePage`)
6. **Phase-Aware Insights** — powerplay/middle/death analysis (`OverAnalysisPage`)

---

## Chapter 9 — Component Library

### Folder Layout (`src/components/`)

| Folder | Contains |
|---|---|
| `auction/` | Auction-specific UI: timer, bid panel, player card, squad tracker |
| `scout/` | Scout page: player tiles, filter chips, AI report card |
| `layout/` | Shell components: navbar, sidebar, footer |
| `ui/` | Generic primitives (button, card, dialog, tabs) — based on shadcn/ui |
| `magicui/` | Animated/fancy components (gradient effects, particles, etc.) |

### State Management (`src/store/`)

Zustand stores hold:
- Current auction state (purse, squad, current player)
- User's shortlist
- Active filters across pages

### Helpers (`src/lib/`)

- `grok.ts` — AI client + system prompts
- `supabase.ts` — Supabase client setup (assumed)
- Utility functions for formatting (runs, overs, currency)

### Static Data (`src/data/`)

Lookup tables not stored in the database — typically IPL franchise metadata, role definitions, etc.

---

## Chapter 10 — Project File Structure

```
Cricket_Website/
├── README.md
├── DOCUMENTATION.md          ← this file
├── package.json              ← npm scripts + dependencies
├── vite.config.ts            ← Vite config
├── tsconfig.json             ← TypeScript config
├── tailwind.config.js        ← Tailwind theme
├── .env                      ← API keys (gitignored)
│
├── public/                   ← Static assets
│
├── src/
│   ├── main.tsx              ← App entry point
│   ├── App.tsx               ← Top-level router
│   ├── index.css             ← Tailwind directives
│   │
│   ├── pages/                ← 20 route components (see Ch. 8)
│   ├── components/           ← Reusable UI (see Ch. 9)
│   │   ├── auction/
│   │   ├── scout/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── magicui/
│   │
│   ├── lib/
│   │   └── grok.ts           ← AI integration
│   ├── store/                ← Zustand state
│   ├── data/                 ← Static lookup tables
│   └── assets/               ← Images, logos
│
├── scripts/
│   ├── clean_tournament.py   ← Multi-tournament data cleaner
│   ├── upload_tournament.py  ← Multi-tournament uploader
│   ├── name_mappings.py      ← Venue + player name normalisation
│   ├── data/                 ← Raw Cricsheet downloads (gitignored)
│   │   ├── ipl_json/
│   │   ├── sma_json/
│   │   ├── bbl_json/
│   │   ├── psl_json/
│   │   ├── cpl_json/
│   │   └── t20s_male_json/
│   └── ...other scripts
│
└── supabase/
    ├── schema.sql            ← Database schema
    ├── data/                 ← Cleaned data ready to upload
    │   ├── smat/
    │   ├── bbl/
    │   ├── psl/
    │   ├── cpl/
    │   └── t20i/
    └── inserts/              ← Raw SQL inserts (Phase 1 IPL)
```

---

## Chapter 11 — Setup & Local Development

### Prerequisites

- Node.js 18+
- Python 3.10+
- A Supabase project (free tier works)
- An Anthropic API key (optional but recommended)

### First-Time Setup

```bash
# 1. Clone & install
cd Cricket_Website
npm install

# 2. Set up environment
# Create .env with:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
#   VITE_ANTHROPIC_API_KEY=...    (or VITE_GROK_API_KEY)

# 3. Set up the database
# In Supabase SQL Editor, run:
#   supabase/schema.sql
#   (then the Phase 2.1 migration — see Phase 2 chapter)

# 4. Load data
# For each tournament you want:
python scripts/clean_tournament.py SMAT sma_json
python scripts/upload_tournament.py SMAT

# 5. Run the dev server
npm run dev
```

### NPM Scripts

| Command | What It Does |
|---|---|
| `npm run dev` | Start Vite dev server (usually port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Chapter 12 — Phase 1 Summary

### What Was Delivered

**Data:**
- 1,175 IPL matches (Cricsheet, 2008–2024 seasons)
- 279,586 ball-by-ball deliveries
- 13,901 wickets
- Full player registry, teams, venues, seasons

**Features:**
- 20 pages spanning auction simulation, player intelligence, team/venue analytics
- 6 AI-powered features (auction strategist, scout, compare, squad analyzer, price predictor, phase insights)
- Interactive visualisations via Recharts
- Zustand-based state management
- Supabase auth + database

**Infrastructure:**
- Vite + React + TypeScript + Tailwind frontend
- Supabase PostgreSQL backend
- Python data pipeline (clean + upload)
- Claude API integration with structured prompts

### Phase 1 Headline Numbers

- **1 developer** built the entire platform with AI assistance
- **20 pages** shipped
- **~280k rows** of ball-by-ball data ingested
- **~6 AI integration points**

---

## Chapter 13 — Phase 2 Roadmap

Phase 2 has **nine major upgrades**, grouped into three themes:

### Theme A — Data Expansion (Phase 2.1)

**Goal:** Go beyond IPL.

| Tournament | Matches | Deliveries | Status |
|---|---|---|---|
| SMAT (Syed Mushtaq Ali Trophy) | 695 | 158,839 | Cleaned, upload pending |
| BBL (Big Bash League) | 662 | 153,250 | Cleaned, upload pending |
| PSL (Pakistan Super League) | 357 | 83,799 | Cleaned, upload pending |
| CPL (Caribbean Premier League) | 407 | 95,024 | Cleaned, upload pending |
| T20I Men's Internationals | 3,382 | 762,586 | Cleaned, upload pending |
| **Total new** | **5,503** | **1,253,498** | — |

**Schema migration completed** — `tournament` column added to all match-level tables; `tournaments` registry table seeded with 6 codes.

### Theme B — Platform & Monetization (Phases 2.2–2.6)

| Phase | What It Adds |
|---|---|
| **2.2 Real-time Multiplayer Auctions** | Supabase Realtime channels so friends can bid against each other live |
| **2.3 Predictive ML Layer** | ML models for price prediction, match outcome, player form trajectory |
| **2.4 User Accounts + Social** | Saved squads, public profiles, leaderboards, sharing |
| **2.5 Live Match Companion** | Integration with cricketdata.org API for live match feeds + AI commentary |
| **2.6 Monetisation (Stripe)** | Premium subscription tier; SaaS revenue stream |

### Theme C — Agentic AI (Phases 2.7–2.9)

This is where **LangChain and LangGraph** come in. Instead of one-shot Claude calls, these features use **multi-step agents** that plan, query, reason, and refine.

| Phase | What It Adds | Key Tech |
|---|---|---|
| **2.7 Agentic Scout** | Natural-language → autonomous DB query → analysis → report | LangGraph state machine |
| **2.8 Live Auction Co-Pilot** | Persistent-memory AI that watches every bid and re-plans live | LangGraph with checkpointing |
| **2.9 RAG Knowledge Layer** | AI answers backed by commentary, pitch reports, articles | LangChain + Supabase pgvector |

### Phase 2 Architecture Additions

```
NEW BACKEND SERVICE
┌──────────────────────────────────┐
│  FastAPI (Python)                │
│  - /api/scout-agent (LangGraph)  │
│  - /api/auction-copilot          │
│  - /api/rag-ask (LangChain)      │
│  - Calls Claude with tools       │
│  - Queries Supabase via SQL      │
│  - Queries pgvector for RAG      │
└──────────────────────────────────┘
              ↑
              │ HTTPS
              │
        React Frontend
```

### Phase 2 Recommended Build Order

1. **Phase 2.1** (data expansion) — finish in-progress upload
2. **Phase 2.4** (user accounts) — unlocks social features later
3. **Phase 2.9** (RAG) — easiest agentic build; gets FastAPI set up
4. **Phase 2.7** (Agentic Scout) — builds on FastAPI
5. **Phase 2.2** (real-time auctions) — high user appeal
6. **Phase 2.8** (Auction Co-Pilot) — combines everything
7. **Phase 2.3** (ML layer) — once enough data
8. **Phase 2.5** (live match companion) — external API integration
9. **Phase 2.6** (monetisation) — only after product-market fit signals

---

## Chapter 14 — Glossary

| Term | Meaning |
|---|---|
| **Cricsheet** | Open-source provider of ball-by-ball cricket JSON data |
| **IPL** | Indian Premier League — premier T20 franchise league |
| **SMAT** | Syed Mushtaq Ali Trophy — domestic Indian T20 tournament |
| **BBL / PSL / CPL** | Big Bash League / Pakistan Super League / Caribbean Premier League |
| **T20I** | T20 Internationals — country-vs-country format |
| **Powerplay** | Overs 1–6 of an innings (fielding restrictions in place) |
| **Middle overs** | Overs 7–15 |
| **Death overs** | Overs 16–20 (final stage, highest run rates) |
| **RTM** | Right To Match — auction card that lets a team match a winning bid for their former player |
| **PMS** | Player Match Stats — per-player-per-match aggregated stats table |
| **RPC** | Remote Procedure Call — Supabase term for server-side SQL functions |
| **LangChain** | Framework for AI apps that use tools (DB queries, APIs, file reads) |
| **LangGraph** | Framework for AI agents that plan in steps and loop back — state-machine for LLMs |
| **RAG** | Retrieval-Augmented Generation — AI answers backed by a searchable document store |
| **pgvector** | PostgreSQL extension for storing and searching vector embeddings |
| **Embedding** | Numerical representation of text used for similarity search |
| **SPA** | Single-Page Application — the frontend architecture style React uses |
| **Zustand** | Lightweight React state-management library |
| **shadcn/ui** | Set of copy-pasteable accessible React UI components |
| **Vite** | Fast modern build tool for frontend JavaScript projects |
| **Supabase** | Open-source Firebase alternative; PostgreSQL + auth + realtime |
| **Tailwind CSS** | Utility-first CSS framework |
| **Anthropic / Claude** | AI company / model used as the primary LLM in this project |

---

## Appendix — Quick Reference Card

**Tech Stack at a Glance:**
React · TypeScript · Tailwind · Vite · Supabase · PostgreSQL · Claude API · Python · Cricsheet

**Data at a Glance (after Phase 2.1):**
6 tournaments · 6,678 matches · 1.5M+ deliveries · ~6,000 players · ~80 teams · ~150 venues

**AI Features:**
Auction Strategist · NL Player Scout · Player Comparison · Squad Analyzer · Price Predictor · Phase Insights

**Phase 2 in One Line:**
Multi-tournament data · multiplayer auctions · ML predictions · user accounts · live match · monetisation · agentic scout · auction co-pilot · RAG knowledge.

---

*End of documentation. For questions or to contribute, open an issue or reach the project maintainer.*
