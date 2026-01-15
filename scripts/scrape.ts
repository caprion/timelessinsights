/**
 * Scrape articles from URLs in sources.yaml
 * Uses Cheerio for content extraction
 */

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const INPUT_DIR = './input';
const CONTENT_DIR = './content';
const CONFIG_DIR = './config';
const SOURCES_FILE = path.join(INPUT_DIR, 'sources.yaml');
const EXTRACTORS_FILE = path.join(CONFIG_DIR, 'extractors.yaml');
const AUTO_TAGS_FILE = path.join(CONFIG_DIR, 'auto-tags.yaml');

interface Source {
  url: string;
  tags: string[];
  status: 'pending' | 'scraped' | 'failed';
  added_at: string;
  scraped_at?: string;
}

interface SourcesData {
  sources: Source[];
}

interface ExtractorConfig {
  content: string;
  title: string;
  author?: string | null;
  date?: string;
}

interface ExtractorsData {
  extractors: Record<string, ExtractorConfig>;
}

interface AutoTagRule {
  keywords: string[];
  add_tags: string[];
}

interface UrlTagRule {
  pattern: string;
  add_tags: string[];
}

interface AutoTagsData {
  url_rules: UrlTagRule[];
  content_rules: AutoTagRule[];
}

// Initialize Turndown for HTML to Markdown
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Remove script and style tags
turndown.remove(['script', 'style', 'nav', 'footer', 'aside']);

function loadSources(): SourcesData {
  if (!fs.existsSync(SOURCES_FILE)) {
    return { sources: [] };
  }
  const content = fs.readFileSync(SOURCES_FILE, 'utf-8');
  return YAML.parse(content) || { sources: [] };
}

function saveSources(data: SourcesData): void {
  const yaml = YAML.stringify(data, { lineWidth: 0 });
  fs.writeFileSync(SOURCES_FILE, yaml);
}

function loadExtractors(): ExtractorsData {
  const content = fs.readFileSync(EXTRACTORS_FILE, 'utf-8');
  return YAML.parse(content);
}

function loadAutoTags(): AutoTagsData {
  const content = fs.readFileSync(AUTO_TAGS_FILE, 'utf-8');
  return YAML.parse(content);
}

function getExtractorForUrl(url: string, extractors: ExtractorsData): ExtractorConfig {
  const hostname = new URL(url).hostname.replace('www.', '');
  
  for (const [domain, config] of Object.entries(extractors.extractors)) {
    if (hostname.includes(domain)) {
      return config;
    }
  }
  
  return extractors.extractors['default'];
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

function applyAutoTags(url: string, content: string, autoTags: AutoTagsData): string[] {
  const tags: Set<string> = new Set();
  const contentLower = content.toLowerCase();
  
  // Apply URL rules
  for (const rule of autoTags.url_rules) {
    if (url.includes(rule.pattern)) {
      rule.add_tags.forEach((tag: string) => tags.add(tag));
    }
  }
  
  // Apply content rules
  for (const rule of autoTags.content_rules) {
    for (const keyword of rule.keywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        rule.add_tags.forEach((tag: string) => tags.add(tag));
        break;
      }
    }
  }
  
  return Array.from(tags);
}

function calculateReadingTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
}

async function scrapeUrl(url: string, extractors: ExtractorsData, autoTags: AutoTagsData): Promise<{
  success: boolean;
  slug?: string;
  title?: string;
  error?: string;
}> {
  try {
    console.log(`   Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const extractor = getExtractorForUrl(url, extractors);
    
    // Extract title
    let title = '';
    for (const selector of extractor.title.split(', ')) {
      const el = $(selector).first();
      if (el.length && el.text().trim()) {
        title = el.text().trim();
        break;
      }
    }
    
    if (!title) {
      title = $('title').text().trim() || 'Untitled';
    }
    
    // Extract content
    let contentHtml = '';
    for (const selector of extractor.content.split(', ')) {
      const el = $(selector).first();
      if (el.length && el.html()) {
        contentHtml = el.html() || '';
        break;
      }
    }
    
    if (!contentHtml) {
      return { success: false, error: 'Could not extract content' };
    }
    
    // Convert to markdown
    const markdown = turndown.turndown(contentHtml);
    
    // Extract author
    let author = 'Unknown';
    if (extractor.author) {
      for (const selector of extractor.author.split(', ')) {
        const el = $(selector).first();
        if (el.length && el.text().trim()) {
          author = el.text().trim();
          break;
        }
      }
    }
    
    // Special case for fs.blog
    if (url.includes('fs.blog')) {
      author = 'Shane Parrish';
    }
    
    // Generate slug and apply tags
    const slug = generateSlug(title);
    const tags = applyAutoTags(url, markdown, autoTags);
    const readingTime = calculateReadingTime(markdown);
    
    // Create frontmatter
    const frontmatter = {
      title,
      source_url: url,
      source: new URL(url).hostname.replace('www.', '').split('.')[0],
      author,
      scraped_at: new Date().toISOString().split('T')[0],
      tags,
      reading_time: readingTime,
      type: 'article',
    };
    
    // Create markdown file with frontmatter
    const fileContent = `---
${YAML.stringify(frontmatter)}---

${markdown}
`;
    
    // Ensure content directory exists
    if (!fs.existsSync(CONTENT_DIR)) {
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
    }
    
    // Save file
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);
    fs.writeFileSync(filePath, fileContent);
    
    return { success: true, slug, title };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Check for single URL mode
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    const singleUrl = args[urlIndex + 1];
    console.log(`🔗 Scraping single URL: ${singleUrl}\n`);
    
    const extractors = loadExtractors();
    const autoTags = loadAutoTags();
    
    const result = await scrapeUrl(singleUrl, extractors, autoTags);
    
    if (result.success) {
      console.log(`✅ Success: ${result.title}`);
      console.log(`   Saved as: content/${result.slug}.md`);
      
      // Also add to sources.yaml
      const sources = loadSources();
      if (!sources.sources.find(s => s.url === singleUrl)) {
        sources.sources.push({
          url: singleUrl,
          tags: [],
          status: 'scraped',
          added_at: new Date().toISOString(),
          scraped_at: new Date().toISOString(),
        });
        saveSources(sources);
      }
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
    return;
  }
  
  // Batch mode - scrape all pending
  console.log('🚀 Scraping pending articles...\n');
  
  const sources = loadSources();
  const extractors = loadExtractors();
  const autoTags = loadAutoTags();
  
  const pending = sources.sources.filter(s => s.status === 'pending');
  
  if (pending.length === 0) {
    console.log('No pending articles to scrape');
    console.log('Add URLs to input/urls.txt and run: npm run convert');
    return;
  }
  
  console.log(`Found ${pending.length} pending articles\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const source of pending) {
    const result = await scrapeUrl(source.url, extractors, autoTags);
    
    // Update source status
    const idx = sources.sources.findIndex(s => s.url === source.url);
    if (idx !== -1) {
      if (result.success) {
        sources.sources[idx].status = 'scraped';
        sources.sources[idx].scraped_at = new Date().toISOString();
        console.log(`✅ ${result.title}`);
        success++;
      } else {
        sources.sources[idx].status = 'failed';
        console.log(`❌ ${source.url}: ${result.error}`);
        failed++;
      }
    }
    
    // Save after each to preserve progress
    saveSources(sources);
    
    // Small delay to be nice to servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Success: ${success}`);
  console.log(`   Failed: ${failed}`);
  console.log(`\n💡 Run 'npm run build' to generate the site`);
}

main();
