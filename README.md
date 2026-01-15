# TimelessInsights

A personal knowledge library for curated wisdom on mental models, decision-making, and clear thinking.

## Quick Start

```bash
# Install dependencies
npm install

# Add URLs to scrape
# Edit input/urls.txt with article URLs

# Convert URLs to structured format
npm run convert

# Scrape articles
npm run scrape

# Start development server
npm run dev

# Build for production
npm run build
```

## Workflow

1. **Add URLs** — Drop URLs into `input/urls.txt` (one per line)
2. **Convert** — Run `npm run convert` to add them to `sources.yaml`
3. **Scrape** — Run `npm run scrape` to fetch and save as markdown
4. **Browse** — Run `npm run dev` to view your library

## Project Structure

```
timelessinsights/
├── input/               # Your URL inputs
│   ├── urls.txt         # Quick add URLs here
│   └── sources.yaml     # Structured source registry
├── content/             # Scraped articles (markdown)
├── config/              # Configuration files
│   ├── auto-tags.yaml   # Auto-tagging rules
│   ├── extractors.yaml  # Site-specific selectors
│   └── site.yaml        # Site settings
├── scripts/             # CLI tools
├── site/                # React frontend
└── public/              # Static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run convert` | Convert urls.txt → sources.yaml |
| `npm run scrape` | Scrape all pending URLs |
| `npm run scrape:one -- <url>` | Scrape a single URL |
| `npm run tag` | Re-apply auto-tagging rules |
| `npm run build:index` | Generate search index |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |

## Adding Content

### Scrape from URL
```bash
npm run scrape:one -- "https://fs.blog/first-principles/"
```

### Personal Notes
Create a markdown file directly in `content/`:

```markdown
---
title: "My Notes on Thinking"
type: personal
created_at: 2026-01-15
tags: [thinking, personal]
---

Your content here...
```

## Deployment

Build and deploy to Cloudflare Pages:

```bash
npm run build
# Deploy site/dist to Cloudflare Pages
```

## Configuration

### Auto-Tagging (`config/auto-tags.yaml`)
Define rules to automatically tag articles based on URL patterns and content keywords.

### Extractors (`config/extractors.yaml`)
Define CSS selectors for extracting content from different websites.

---

Built with ❤️ for clearer thinking.
