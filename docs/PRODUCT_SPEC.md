# TimelessInsights - Product Specification

## Vision

A personal knowledge curator that turns scattered web articles into an organized, searchable library. Start with fs.blog, expand to any source. Include your own notes.

---

## Core Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   Quick Add      │
                    │   urls.txt       │
                    └────────┬─────────┘
                             │
                             ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Manual Entry    │──>│   sources.yaml   │──>│  npm run scrape  │
│  (with tags)     │   │  (structured)    │   │                  │
└──────────────────┘   └──────────────────┘   └────────┬─────────┘
                                                       │
                    ┌──────────────────┐               │
                    │  Personal Notes  │               │
                    │  (write .md)     │───────────────┤
                    └──────────────────┘               │
                                                       ▼
                                              ┌──────────────────┐
                                              │    content/      │
                                              │    *.md files    │
                                              └────────┬─────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │  npm run build   │
                                              │  (static site +  │
                                              │   search index)  │
                                              └────────┬─────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │  Cloudflare      │
                                              │  Pages           │
                                              └──────────────────┘
```

---

## Input Formats

### 1. Quick Add: urls.txt

For fast URL dropping. No structure needed.

```text
# urls.txt
# Just paste URLs, one per line
# Comments start with #

https://fs.blog/first-principles/
https://fs.blog/circle-of-competence/
https://fs.blog/mental-models/
https://www.lesswrong.com/posts/some-article
```

### 2. Structured: sources.yaml

Auto-generated from urls.txt + your manual additions.

```yaml
# sources.yaml
# Structured source list with optional metadata

sources:
  # Auto-converted from urls.txt (tags will be auto-extracted)
  - url: https://fs.blog/first-principles/
    tags: []  # Will be filled by auto-tagger
    status: pending
    
  # Manually added with tags
  - url: https://fs.blog/charlie-munger-mental-models/
    tags: [munger, mental-models, investing]
    status: pending
    priority: high
    
  # Already scraped
  - url: https://fs.blog/circle-of-competence/
    tags: [mental-models, self-awareness]
    status: scraped
    scraped_at: 2026-01-15
```

### 3. Personal Notes

Just create a .md file directly in content/ folder.

```markdown
---
title: "My Notes on Inversion"
type: personal
created_at: 2026-01-15
tags: [thinking, mental-models, personal]
---

After reading several articles on inversion, here are my takeaways...
```

---

## Content Format

### Scraped Article

```markdown
---
title: "First Principles Thinking"
source_url: https://fs.blog/first-principles/
source: fs-blog
author: Shane Parrish
scraped_at: 2026-01-15
tags: [thinking, mental-models, foundational]
reading_time: 8 min
type: article
---

# First Principles Thinking

[Clean markdown content...]
```

### Personal Note

```markdown
---
title: "My Thoughts on Decision Making"
type: personal
created_at: 2026-01-15
updated_at: 2026-01-20
tags: [decision-making, personal, draft]
---

[Your own writing...]
```

---

## Tag System

### Tag Types

| Prefix | Purpose | Examples |
|--------|---------|----------|
| (none) | Topic/theme | `thinking`, `mental-models`, `munger` |
| `source:` | Origin website | `source:fs-blog`, `source:lesswrong` |
| `type:` | Content type | `type:article`, `type:personal`, `type:book-notes` |
| `status:` | Your status | `status:must-read`, `status:review`, `status:archived` |

### Auto-Tagging Rules

The scraper will auto-detect tags based on:

```yaml
# config/auto-tags.yaml
rules:
  # URL patterns
  - pattern: "fs.blog"
    add_tags: [source:fs-blog]
    
  - pattern: "lesswrong.com"
    add_tags: [source:lesswrong]
    
  # Content keywords
  - keywords: ["mental model", "mental models"]
    add_tags: [mental-models]
    
  - keywords: ["Charlie Munger", "Munger"]
    add_tags: [munger]
    
  - keywords: ["first principles", "first-principles"]
    add_tags: [first-principles, thinking]
    
  - keywords: ["decision", "decisions", "deciding"]
    add_tags: [decision-making]
    
  - keywords: ["inversion", "invert"]
    add_tags: [inversion, thinking]
```

---

## Directory Structure

```
timelessinsights/
│
├── input/                        # YOUR INPUT
│   ├── urls.txt                  # Quick URL drops
│   └── sources.yaml              # Structured (auto-generated + manual)
│
├── content/                      # ALL CONTENT (human-readable markdown)
│   ├── first-principles.md       # Scraped article
│   ├── circle-of-competence.md   # Scraped article
│   ├── my-notes-on-thinking.md   # Personal note
│   └── ...
│
├── config/                       # CONFIGURATION
│   ├── auto-tags.yaml            # Auto-tagging rules
│   └── site.yaml                 # Site metadata
│
├── scripts/                      # TOOLING
│   ├── convert-urls.ts           # urls.txt → sources.yaml
│   ├── scrape.ts                 # Main scraper (Cheerio + Playwright fallback)
│   ├── auto-tag.ts               # Apply auto-tagging rules
│   └── build-search-index.ts     # Generate search index
│
├── site/                         # FRONTEND
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── index.tsx         # Home (recent + search)
│   │   │   ├── browse.tsx        # All articles + filter
│   │   │   └── [slug].tsx        # Article reader
│   │   └── lib/
│   │       └── search.ts         # Fuse.js search
│   ├── public/
│   │   └── search-index.json     # Pre-built search index
│   └── dist/                     # Built static site
│
├── .github/
│   └── workflows/
│       └── deploy.yml            # Build & deploy to Cloudflare
│
├── package.json
└── README.md
```

---

## MVP Features

### ✅ Phase 1: Core (Week 1)

| Feature | Description |
|---------|-------------|
| **URL Input** | Add URLs to urls.txt or sources.yaml |
| **Convert Script** | urls.txt → sources.yaml with empty tags |
| **Scraper** | Cheerio-based, extracts markdown content |
| **Auto-tagging** | Apply rules from auto-tags.yaml |
| **Personal Notes** | Just create .md in content/ |
| **Build Index** | Generate search-index.json |
| **Home Page** | Recent articles + search box |
| **Browse Page** | All articles, filter by tag |
| **Article Page** | Clean reading experience |
| **Deploy** | Cloudflare Pages |

### ⏳ Phase 2: Polish (Week 2)

| Feature | Description |
|---------|-------------|
| **Playwright fallback** | For JS-heavy sites |
| **Tag suggestions** | CLI shows suggested tags after scrape |
| **Reading time** | Auto-calculate from word count |
| **Related articles** | Based on shared tags |

### 🔮 Future (Maybe)

| Feature | Description |
|---------|-------------|
| **RSS feed** | Auto-generate feed.xml |
| **Highlights/annotations** | Mark important passages |
| **Semantic search** | Embeddings-based similarity |
| **Collections** | Group articles manually |

---

## Scripts API

### 1. Convert URLs

```bash
npm run convert
# Reads urls.txt, appends new entries to sources.yaml
# Marks them as status: pending
```

### 2. Scrape

```bash
npm run scrape
# Scrapes all pending URLs in sources.yaml
# Creates markdown files in content/
# Updates status to: scraped
# Applies auto-tags

npm run scrape -- --url "https://fs.blog/something"
# Scrape single URL (also adds to sources.yaml)
```

### 3. Auto-tag

```bash
npm run tag
# Re-applies auto-tagging rules to all content
# Useful after updating auto-tags.yaml
```

### 4. Build

```bash
npm run build
# 1. Generates search-index.json from all content
# 2. Builds static site to site/dist/
```

### 5. Dev

```bash
npm run dev
# Runs local dev server for the site
```

---

## Search Implementation

### How It Works

**Build time:**
```
content/*.md  →  parse frontmatter + content  →  search-index.json
```

**search-index.json structure:**
```json
{
  "articles": [
    {
      "slug": "first-principles",
      "title": "First Principles Thinking",
      "excerpt": "Breaking down complicated problems...",
      "tags": ["thinking", "mental-models", "source:fs-blog"],
      "source": "fs-blog",
      "type": "article",
      "date": "2026-01-15",
      "content": "Full text for search..." 
    }
  ],
  "tags": ["thinking", "mental-models", "munger", "source:fs-blog", ...],
  "stats": {
    "total": 150,
    "bySource": { "fs-blog": 120, "personal": 30 },
    "byTag": { "thinking": 45, "mental-models": 38 }
  }
}
```

**Runtime (browser):**
```typescript
import Fuse from 'fuse.js';
import searchIndex from '/search-index.json';

const fuse = new Fuse(searchIndex.articles, {
  keys: ['title', 'content', 'tags'],
  threshold: 0.3,
});

// Search
const results = fuse.search(query);

// Filter by tag
const filtered = searchIndex.articles.filter(a => a.tags.includes('munger'));
```

### Index Size Estimate

| Articles | Raw JSON | Gzipped |
|----------|----------|---------|
| 100 | ~200KB | ~40KB |
| 500 | ~1MB | ~150KB |
| 1000 | ~2MB | ~300KB |

For 500 articles, user downloads ~150KB on first visit. Acceptable.

---

## Scraping Strategy

### Cheerio (Default)

Fast, lightweight, works for static HTML.

```typescript
// Pseudocode
const html = await fetch(url).then(r => r.text());
const $ = cheerio.load(html);

// Extract main content (site-specific selectors)
const content = $('article').html() || $('.post-content').html();
const title = $('h1').first().text() || $('title').text();

// Convert to markdown
const markdown = turndown.turndown(content);
```

### Playwright Fallback

For JS-rendered sites. Heavier but works everywhere.

```typescript
// Pseudocode
const browser = await playwright.chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle' });

const content = await page.$eval('article', el => el.innerHTML);
// ... same conversion
```

### Site-Specific Extractors

```typescript
// config/extractors.ts
const extractors = {
  'fs.blog': {
    content: 'article.post-content',
    title: 'h1.post-title',
    author: '.author-name',
  },
  'lesswrong.com': {
    content: '.PostsPage-postContent',
    title: 'h1.PostsPageTitle-title',
    author: '.UsersNameDisplay-userName',
  },
  // Fallback for unknown sites
  'default': {
    content: 'article, .post-content, .entry-content, main',
    title: 'h1, .post-title, title',
  },
};
```

---

## Tech Stack

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| **Scraping** | Cheerio + Playwright fallback | Light by default, powerful when needed |
| **Content** | Markdown + YAML frontmatter | Human-readable, git-friendly |
| **Config** | YAML | Easy to edit |
| **Scripts** | TypeScript + Node.js | Type safety, modern |
| **Frontend** | React + Vite | Fast, familiar |
| **Styling** | Tailwind CSS | Utility-first, minimal CSS |
| **Search** | Fuse.js | Client-side, no server needed |
| **Hosting** | Cloudflare Pages | Free, fast, global CDN |

---

## Open Questions

1. **Markdown flavor**: Use GFM (GitHub Flavored Markdown)?
2. **Image handling**: Save images locally or keep external URLs?
3. **Duplicate detection**: What if same URL added twice?
4. **Error handling**: What if scrape fails? Mark as `status: failed`?

---

*Spec version: 1.0*
*Created: January 15, 2026*
