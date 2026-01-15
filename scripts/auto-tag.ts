/**
 * Apply auto-tagging rules to all content files
 * Useful after updating auto-tags.yaml
 */

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import matter from 'gray-matter';

const CONTENT_DIR = './content';
const CONFIG_DIR = './config';
const AUTO_TAGS_FILE = path.join(CONFIG_DIR, 'auto-tags.yaml');

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

function loadAutoTags(): AutoTagsData {
  const content = fs.readFileSync(AUTO_TAGS_FILE, 'utf-8');
  return YAML.parse(content);
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

function main() {
  console.log('🏷️  Applying auto-tags to content...\n');
  
  const autoTags = loadAutoTags();
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('No content directory found');
    return;
  }
  
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  
  if (files.length === 0) {
    console.log('No markdown files found');
    return;
  }
  
  let updated = 0;
  
  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(content);
    
    const sourceUrl = parsed.data.source_url || '';
    const newTags = applyAutoTags(sourceUrl, parsed.content, autoTags);
    
    // Merge with existing tags (preserve manual tags)
    const existingTags = new Set<string>(parsed.data.tags || []);
    newTags.forEach(tag => existingTags.add(tag));
    
    const mergedTags = Array.from(existingTags).sort();
    
    // Check if tags changed
    const oldTags = (parsed.data.tags || []).sort().join(',');
    const newTagsStr = mergedTags.join(',');
    
    if (oldTags !== newTagsStr) {
      parsed.data.tags = mergedTags;
      
      // Rebuild file
      const newContent = matter.stringify(parsed.content, parsed.data);
      fs.writeFileSync(filePath, newContent);
      
      console.log(`✅ ${file}: +${newTags.length - (parsed.data.tags?.length || 0)} tags`);
      updated++;
    } else {
      console.log(`⏭️  ${file}: no changes`);
    }
  }
  
  console.log(`\n📊 Updated ${updated} of ${files.length} files`);
}

main();
