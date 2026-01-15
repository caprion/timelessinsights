/**
 * Build search index from content files
 * Generates search-index.json for client-side search
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = './content';
const PUBLIC_DIR = './public';
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'search-index.json');

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  source_url?: string;
  source?: string;
  author?: string;
  date: string;
  tags: string[];
  type: string;
  reading_time?: string;
  content: string; // For full-text search
}

interface SearchIndex {
  articles: Article[];
  tags: string[];
  stats: {
    total: number;
    bySource: Record<string, number>;
    byTag: Record<string, number>;
    byType: Record<string, number>;
  };
  generated_at: string;
}

function extractExcerpt(content: string, maxLength: number = 200): string {
  // Remove markdown formatting
  const plain = content
    .replace(/^#+\s+.+$/gm, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/!\[.+?\]\(.+?\)/g, '') // Images
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/>\s+.+/g, '') // Blockquotes
    .replace(/\n+/g, ' ')
    .trim();
  
  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

function main() {
  console.log('🔍 Building search index...\n');
  
  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('No content directory found');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ articles: [], tags: [], stats: { total: 0, bySource: {}, byTag: {}, byType: {} }, generated_at: new Date().toISOString() }));
    return;
  }
  
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  
  const articles: Article[] = [];
  const allTags = new Set<string>();
  const bySource: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  const byType: Record<string, number> = {};
  
  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(content);
    
    const slug = file.replace('.md', '');
    const tags = parsed.data.tags || [];
    const source = parsed.data.source || 'unknown';
    const type = parsed.data.type || 'article';
    
    // Handle date - could be Date object or string
    let dateStr = '';
    if (parsed.data.scraped_at) {
      dateStr = typeof parsed.data.scraped_at === 'string' 
        ? parsed.data.scraped_at 
        : parsed.data.scraped_at.toISOString().split('T')[0];
    } else if (parsed.data.created_at) {
      dateStr = typeof parsed.data.created_at === 'string'
        ? parsed.data.created_at
        : parsed.data.created_at.toISOString().split('T')[0];
    }
    
    // Add to articles list
    articles.push({
      slug,
      title: parsed.data.title || 'Untitled',
      excerpt: extractExcerpt(parsed.content),
      source_url: parsed.data.source_url,
      source,
      author: parsed.data.author,
      date: dateStr,
      tags,
      type,
      reading_time: parsed.data.reading_time,
      content: parsed.content.substring(0, 5000), // Limit content for search
    });
    
    // Track tags
    tags.forEach((tag: string) => {
      allTags.add(tag);
      byTag[tag] = (byTag[tag] || 0) + 1;
    });
    
    // Track sources
    bySource[source] = (bySource[source] || 0) + 1;
    
    // Track types
    byType[type] = (byType[type] || 0) + 1;
    
    console.log(`📄 ${slug}`);
  }
  
  // Sort articles by date (newest first)
  articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  
  const index: SearchIndex = {
    articles,
    tags: Array.from(allTags).sort(),
    stats: {
      total: articles.length,
      bySource,
      byTag,
      byType,
    },
    generated_at: new Date().toISOString(),
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Articles: ${articles.length}`);
  console.log(`   Tags: ${allTags.size}`);
  console.log(`   Index size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);
  console.log(`\n✅ Saved to ${OUTPUT_FILE}`);
}

main();
