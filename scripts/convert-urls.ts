/**
 * Convert urls.txt to sources.yaml
 * Adds new URLs with pending status
 */

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const INPUT_DIR = './input';
const URLS_FILE = path.join(INPUT_DIR, 'urls.txt');
const SOURCES_FILE = path.join(INPUT_DIR, 'sources.yaml');

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

function loadUrls(): string[] {
  if (!fs.existsSync(URLS_FILE)) {
    console.log('No urls.txt found');
    return [];
  }

  const content = fs.readFileSync(URLS_FILE, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

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

function clearUrlsFile(): void {
  const header = `# TimelessInsights - URL Queue
# Add URLs here, one per line
# Run: npm run convert (to add to sources.yaml)
# Run: npm run scrape (to fetch and save)

`;
  fs.writeFileSync(URLS_FILE, header);
}

function main() {
  console.log('📋 Converting urls.txt to sources.yaml...\n');

  const urls = loadUrls();
  if (urls.length === 0) {
    console.log('No URLs to convert');
    return;
  }

  const sources = loadSources();
  const existingUrls = new Set(sources.sources.map(s => s.url));

  let added = 0;
  let skipped = 0;

  for (const url of urls) {
    if (existingUrls.has(url)) {
      console.log(`⏭️  Skip (exists): ${url}`);
      skipped++;
      continue;
    }

    sources.sources.push({
      url,
      tags: [],
      status: 'pending',
      added_at: new Date().toISOString(),
    });
    
    console.log(`✅ Added: ${url}`);
    added++;
  }

  saveSources(sources);
  clearUrlsFile();

  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total sources: ${sources.sources.length}`);
  console.log(`\n💡 Run 'npm run scrape' to fetch pending articles`);
}

main();
