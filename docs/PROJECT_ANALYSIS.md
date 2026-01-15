# TimelessInsights - Project Analysis & Architecture Review

## 📋 Overview

This document analyzes the reference project `fs-insights-hub` which is designed to scrape, organize, and present content from fs.blog (Farnam Street) - Shane Parrish's blog focused on mental models, decision-making, and clear thinking.

---

## 🏗️ Current Architecture (fs-insights-hub)

### Tech Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + Vite + TypeScript | SPA with fast HMR |
| **Styling** | Tailwind CSS + shadcn/ui | Component library with utility-first CSS |
| **State** | TanStack Query (React Query) | Server state management & caching |
| **Routing** | React Router DOM | Client-side routing |
| **Backend** | Supabase | PostgreSQL database + Edge Functions |
| **Scraping** | Firecrawl API | Web scraping as a service |
| **Hosting** | Lovable.dev | Built via Lovable AI tool |

### Data Model
```
┌─────────────┐     ┌─────────────────────────┐     ┌──────────────┐
│   topics    │────<│       articles          │>────│ mental_models│
├─────────────┤     ├─────────────────────────┤     ├──────────────┤
│ id          │     │ id                      │     │ id           │
│ name        │     │ title                   │     │ name         │
│ slug        │     │ slug                    │     │ slug         │
│ description │     │ source_url              │     │ description  │
│ icon        │     │ content_markdown        │     │ category     │
│ article_cnt │     │ excerpt                 │     │ example      │
└─────────────┘     │ author                  │     │ source_url   │
                    │ topic_id (FK)           │     └──────────────┘
                    │ scraped_at              │
                    └─────────────────────────┘
                              │
                    ┌─────────────────────────┐
                    │ article_mental_models   │ (junction table)
                    ├─────────────────────────┤
                    │ article_id (FK)         │
                    │ mental_model_id (FK)    │
                    └─────────────────────────┘
```

### Page Structure
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Index.tsx | Homepage with hero, recent articles, topics, mental models |
| `/articles` | Articles.tsx | List all scraped articles |
| `/articles/:slug` | Article.tsx | Single article view with markdown rendering |
| `/topics` | Topics.tsx | Browse by topic categories |
| `/mental-models` | MentalModels.tsx | Browse mental models |
| `/search` | Search.tsx | Full-text search |
| `/admin` | Admin.tsx | **Scraping dashboard** - single & batch scraping |

---

## 🔍 Scraping Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CURRENT FLOW                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Page    │───>│ Supabase Edge   │───>│ Firecrawl API   │
│  (BatchScraper) │    │   Functions     │    │  (cloud SaaS)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                       │
                              │                       │
                              ▼                       ▼
                       ┌──────────────┐       ┌──────────────┐
                       │   Supabase   │       │  /v1/map     │ Discover URLs
                       │  PostgreSQL  │       │  /v1/scrape  │ Fetch content
                       └──────────────┘       └──────────────┘

Flow:
1. Admin clicks "Discover Articles" → firecrawl-map edge function
2. Firecrawl /v1/map returns all URLs on fs.blog (up to 5000)
3. URLs are filtered client-side (exclude /tag/, /category/, etc.)
4. URLs are cached in localStorage
5. Admin clicks "Scrape" → scrape-article edge function for each URL
6. Firecrawl /v1/scrape gets markdown content
7. Content saved to Supabase PostgreSQL
```

---

## 🎨 UX Analysis

### What Works Well ✅
1. **Clean, elegant design** - Serif fonts for headings, good typography hierarchy
2. **Responsive grid layouts** - Topics, mental models, articles adapt well
3. **Search-first experience** - Prominent search bar on homepage
4. **Loading states** - Skeleton loaders throughout
5. **Markdown rendering** - Articles render nicely with react-markdown
6. **Batch scraping UI** - Progress indicators, caching, stop functionality
7. **Fallback data** - Static data when DB is empty
8. **Mental models focus** - Key differentiator from just another blog reader

### UX Issues ⚠️
1. **No authentication** - Admin page is publicly accessible
2. **No offline support** - Requires network for everything
3. **No article categorization workflow** - Topic assignment is manual
4. **No mental model extraction** - Could auto-detect mental models in articles
5. **Limited search** - Basic `ilike` search, no full-text or semantic search

---

## 💰 Cost Analysis - Current Setup

| Component | Cost | Notes |
|-----------|------|-------|
| **Supabase** | $0-25/mo | Free tier: 500MB DB, 2GB bandwidth, 500K edge invocations |
| **Firecrawl API** | $16-76/mo | Free: 500 credits, Hobby: $16/mo for 3000 credits |
| **Lovable.dev** | $20/mo | For hosting & AI assistance |
| **Total** | ~$36-121/mo | For a personal project, this is excessive |

### Hidden Costs
- Firecrawl charges per scrape - 1 credit = 1 page
- fs.blog has 1000+ articles → Initial scrape = 1000+ credits
- Rate limiting concerns with cloud Firecrawl

---

## 🔴 Critique & Issues

### Architecture Problems

1. **Over-engineered for the use case**
   - Supabase is overkill for what's essentially a static content site
   - Edge functions add latency and complexity
   - No need for real-time database features

2. **Firecrawl API dependency**
   - Paid service with credit-based pricing
   - Rate limits affect batch scraping
   - Could be replaced with local scraping

3. **No static generation**
   - Content changes rarely (fs.blog posts ~1-2 times/week)
   - Every page load fetches from Supabase
   - Could be fully static with client-side search

4. **Data lives in the cloud**
   - If Supabase account is deleted, data is gone
   - No local backup strategy
   - Vendor lock-in

5. **Lovable.dev lock-in**
   - Project generated by AI tool
   - Some boilerplate/patterns are Lovable-specific
   - Over 40+ UI components imported (most unused)

### Code Quality Issues

1. **No tests** - Only example.test.ts placeholder
2. **Type inconsistencies** - Frontend types differ from Supabase types
3. **No error boundaries** - App will crash on errors
4. **No caching strategy** - React Query defaults only
5. **Large bundle** - All shadcn components imported

---

## ✅ Proposed Simplified Architecture

### Goals
- **$0/month hosting** (Cloudflare Pages / GitHub Pages)
- **Local-first scraping** (Firecrawl self-hosted or Playwright)
- **Static site generation** with client-side search
- **Git as database** (JSON/MDX files)
- **Incremental updates** (scrape only new articles)

### New Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                      PROPOSED FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

LOCAL MACHINE (one-time or periodic)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │ Firecrawl    │──>│   Scrape     │──>│  content/    │            │
│  │ (local/Docker)│  │   Script     │   │  articles/   │            │
│  │ or Playwright │  │  (Node.js)   │   │  *.md        │            │
│  └──────────────┘   └──────────────┘   └──────────────┘            │
│                            │                   │                    │
│                            ▼                   ▼                    │
│                     ┌──────────────┐   ┌──────────────┐            │
│                     │  index.json  │   │ search.json  │            │
│                     │  (manifest)  │   │ (search idx) │            │
│                     └──────────────┘   └──────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ git push
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 CLOUDFLARE PAGES / GITHUB PAGES                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    STATIC SITE                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │  React   │  │ Content  │  │  Search  │  │   Prebuilt   │ │  │
│  │  │   SPA    │  │  (JSON)  │  │  Index   │  │   Pages      │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Choices

| Layer | Option A (Simpler) | Option B (Richer) |
|-------|-------------------|-------------------|
| **Scraping** | Playwright local | Firecrawl Docker self-hosted |
| **Content** | JSON files | MDX files |
| **Frontend** | React + Vite (keep existing) | Astro (true SSG) |
| **Search** | Fuse.js (client-side) | Pagefind (build-time index) |
| **Hosting** | Cloudflare Pages | GitHub Pages |
| **CI/CD** | GitHub Actions | Cloudflare Workers |

### Cost Breakdown - New Setup
| Component | Cost | Notes |
|-----------|------|-------|
| **Cloudflare Pages** | $0 | Unlimited sites, 500 builds/mo |
| **Firecrawl (local)** | $0 | Self-hosted Docker |
| **GitHub** | $0 | Unlimited public repos |
| **Domain (optional)** | $10/yr | Cloudflare registrar |
| **Total** | **$0-10/mo** | ~100x cheaper |

---

## 📝 Implementation Plan

### Phase 1: Local Scraper (Week 1)
- [ ] Set up Firecrawl local with Docker OR Playwright
- [ ] Create Node.js scraping script
- [ ] Implement URL discovery (sitemap or crawl)
- [ ] Save articles as JSON/Markdown files
- [ ] Generate manifest file (index.json)
- [ ] Implement incremental scraping (only new articles)

### Phase 2: Static Site (Week 2)
- [ ] Port existing React components (keep the nice UX)
- [ ] Replace Supabase calls with JSON imports
- [ ] Implement client-side search with Fuse.js
- [ ] Add Pagefind for full-text search at build time
- [ ] Remove unused shadcn components

### Phase 3: Deployment (Week 2-3)
- [ ] Set up GitHub repository
- [ ] Configure Cloudflare Pages
- [ ] Set up GitHub Action for builds
- [ ] Optional: Add manual scrape trigger via workflow_dispatch

### Phase 4: Enhancements (Ongoing)
- [ ] Auto-categorize articles by topic (keyword matching)
- [ ] Extract mental models from article content
- [ ] Add reading time estimates
- [ ] Add "Related articles" feature
- [ ] RSS feed generation

---

## ❓ Questions to Consider

### Content Strategy
1. **What content to prioritize?**
   - All articles? Only mental models? Specific topics?
   - fs.blog has 1000+ articles spanning many years

2. **How often to update?**
   - fs.blog posts ~1-2 times per week
   - Weekly cron job? Manual trigger?

3. **Copyright considerations?**
   - Storing full article content vs excerpts + links
   - This is for personal use only?

### Technical Decisions
4. **Scraping approach preference?**
   - Playwright (more control, pure Node.js)
   - Firecrawl Docker (easier markdown extraction, heavier)
   - Simple fetch + cheerio (lightest, may miss dynamic content)

5. **Content format?**
   - JSON (simpler, good for data)
   - Markdown/MDX (better for content, can add frontmatter)

6. **Search requirements?**
   - Basic title/content search?
   - Semantic search (requires embeddings)?
   - Filter by topic/mental model?

7. **Framework choice?**
   - Keep React/Vite (familiar, SPA)
   - Switch to Astro (true SSG, smaller bundles, content-focused)
   - Next.js static export (SSG + React, larger)

### Hosting
8. **Cloudflare vs GitHub Pages?**
   - Cloudflare: Faster, edge functions available, custom domains easier
   - GitHub: Simpler, integrated with repo, familiar

9. **Build triggers?**
   - On every push?
   - Scheduled (weekly)?
   - Manual only?

---

## 📂 Proposed Directory Structure

```
timelessinsights/
├── content/                    # Scraped content (git-tracked)
│   ├── articles/
│   │   ├── first-principles.json
│   │   ├── inversion.json
│   │   └── ...
│   ├── mental-models.json      # Curated list
│   ├── topics.json             # Topic definitions
│   └── index.json              # Manifest/metadata
│
├── scripts/                    # Scraping tools
│   ├── scrape.ts               # Main scraper
│   ├── discover-urls.ts        # URL discovery
│   └── generate-search-index.ts
│
├── src/                        # Frontend (React/Vite)
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── lib/
│
├── public/
│   └── search-index.json       # Prebuilt search index
│
├── .github/
│   └── workflows/
│       ├── build.yml           # Build & deploy
│       └── scrape.yml          # Weekly scrape job
│
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🔗 References

- [fs.blog](https://fs.blog) - Source content
- [Firecrawl Self-hosted](https://github.com/mendableai/firecrawl) - Docker setup
- [Playwright](https://playwright.dev) - Browser automation
- [Fuse.js](https://fusejs.io) - Client-side fuzzy search
- [Pagefind](https://pagefind.app) - Static search library
- [Cloudflare Pages](https://pages.cloudflare.com) - Free hosting
- [Astro](https://astro.build) - Content-focused framework

---

*Document created: January 15, 2026*
*Reference repo: caprion/fs-insights-hub*
