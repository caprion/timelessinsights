/**
 * Enrich content with AI-generated summaries, highlights, and topics
 * Multi-provider: Gemini (primary) → Groq (fallback)
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import YAML from 'yaml';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Load enrichment config
interface EnrichConfig {
  max_content_length: number;
  delay_ms: number;
  topics: string[];
  prompt: string;
}

const CONFIG_PATH = './config/enrich.yaml';
const config = YAML.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as EnrichConfig;

const CONTENT_DIR = './content';
const MAX_CONTENT_LENGTH = config.max_content_length; // From config (default: 60000)
const OLD_CONTENT_LENGTH = 6000; // Previous limit - for detecting truncated articles
const DELAY_MS = config.delay_ms; // From config (default: 12000)
const TOPICS = config.topics as readonly string[];
const PROMPT = config.prompt;

// CLI flags
const FORCE_ALL = process.argv.includes('--force');
const FORCE_TRUNCATED = process.argv.includes('--force-truncated');
const TODAY = new Date().toISOString().split('T')[0];

// Parse --files flag for specific articles
const filesArgIndex = process.argv.indexOf('--files');
const SPECIFIC_FILES: string[] = filesArgIndex !== -1 && process.argv[filesArgIndex + 1]
  ? process.argv[filesArgIndex + 1].split(',')
  : [];

type Topic = typeof TOPICS[number];

interface EnrichmentResult {
  summary: string;
  highlights: string[];
  topic: Topic;
  secondary_topic: Topic | null;
  related_concepts: string[];
  scope: string;
  anti_pattern: string;
}

// Provider definitions
type ProviderName = 'gemini' | 'groq';

interface ProviderResult {
  success: boolean;
  text?: string;
  error?: string;
  rateLimited?: boolean;
}

// Gemini provider
async function callGemini(content: string): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    return { success: false, error: 'GEMINI_API_KEY not configured' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(PROMPT + content + '\n"""');
    return { success: true, text: result.response.text() };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const rateLimited = message.includes('429') || message.includes('quota') || message.includes('rate');
    return { success: false, error: message, rateLimited };
  }
}

// Groq provider
async function callGroq(content: string): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    return { success: false, error: 'GROQ_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: PROMPT + content + '\n"""'
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const rateLimited = response.status === 429;
      const errorText = await response.text();
      return { success: false, error: `${response.status}: ${errorText}`, rateLimited };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      return { success: false, error: 'Empty response from Groq' };
    }

    return { success: true, text };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// Provider chain with fallback
const providers: { name: ProviderName; call: (content: string) => Promise<ProviderResult> }[] = [
  { name: 'gemini', call: callGemini },
  { name: 'groq', call: callGroq },
];

async function callWithFallback(content: string): Promise<{ text: string; provider: ProviderName } | null> {
  for (const provider of providers) {
    const result = await provider.call(content);
    
    if (result.success && result.text) {
      return { text: result.text, provider: provider.name };
    }
    
    if (result.rateLimited) {
      console.log(`   ⚠️  ${provider.name} rate limited, trying next...`);
      continue;
    }
    
    if (result.error?.includes('not configured')) {
      // Skip unconfigured providers silently
      continue;
    }
    
    console.log(`   ⚠️  ${provider.name} failed: ${result.error}`);
  }
  
  return null;
}

function parseEnrichmentResponse(text: string): EnrichmentResult {
  // Clean response - remove markdown code blocks if present
  const cleanedResponse = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  return JSON.parse(cleanedResponse);
}

function validateEnrichment(enrichment: EnrichmentResult): EnrichmentResult {
  // Validate topic
  if (!TOPICS.includes(enrichment.topic)) {
    enrichment.topic = 'mental-models'; // Default fallback
  }
  
  // Validate secondary_topic
  if (enrichment.secondary_topic && !TOPICS.includes(enrichment.secondary_topic)) {
    enrichment.secondary_topic = null;
  }
  
  // Ensure exactly 3 highlights
  enrichment.highlights = (enrichment.highlights || []).slice(0, 3);
  
  // Ensure 2-4 related concepts
  enrichment.related_concepts = (enrichment.related_concepts || []).slice(0, 4);
  
  // Ensure scope and anti_pattern exist
  enrichment.scope = enrichment.scope || '';
  enrichment.anti_pattern = enrichment.anti_pattern || '';
  
  return enrichment;
}

async function enrichArticle(filePath: string, force: boolean = false, maxRetries: number = 2): Promise<{ success: boolean; provider?: ProviderName; skipped?: boolean }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(content);
  
  // Skip if already enriched (unless forced)
  if (parsed.data.enriched_at && !force) {
    return { success: false, skipped: true };
  }
  
  // Truncate content to manage tokens
  const truncatedContent = parsed.content.substring(0, MAX_CONTENT_LENGTH);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await callWithFallback(truncatedContent);
      
      if (!result) {
        console.error(`   ❌ All providers failed`);
        return { success: false };
      }
      
      const enrichment = validateEnrichment(parseEnrichmentResponse(result.text));
      
      // Update frontmatter
      parsed.data.summary = enrichment.summary;
      parsed.data.highlights = enrichment.highlights;
      parsed.data.topic = enrichment.topic;
      parsed.data.secondary_topic = enrichment.secondary_topic;
      parsed.data.related_concepts = enrichment.related_concepts;
      parsed.data.scope = enrichment.scope;
      parsed.data.anti_pattern = enrichment.anti_pattern;
      parsed.data.enriched_at = new Date().toISOString().split('T')[0];
      
      // Track content coverage
      const fullLength = parsed.content.length;
      parsed.data.content_coverage = truncatedContent.length >= fullLength ? 'full' : 'partial';
      if (parsed.data.content_coverage === 'partial') {
        parsed.data.content_analyzed = `${Math.round(truncatedContent.length / fullLength * 100)}%`;
      } else {
        delete parsed.data.content_analyzed;
      }
      
      // Write back
      const newContent = matter.stringify(parsed.content, parsed.data);
      fs.writeFileSync(filePath, newContent);
      
      return { success: true, provider: result.provider };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('JSON') && attempt < maxRetries) {
        console.log(`   ⚠️  JSON parse error, retrying (${attempt}/${maxRetries})...`);
        await sleep(2000); // Brief pause before retry
        continue;
      }
      console.error(`   ❌ Error: ${message}`);
      return { success: false };
    }
  }
  
  return { success: false };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🧠 Enriching content with AI...\n');
  
  // Check for at least one API key
  const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here';
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_api_key_here';
  
  if (!hasGemini && !hasGroq) {
    console.error('❌ No API keys configured');
    console.error('   Add at least one to .env.local:');
    console.error('   - GEMINI_API_KEY from https://aistudio.google.com/app/apikey');
    console.error('   - GROQ_API_KEY from https://console.groq.com/keys');
    process.exit(1);
  }
  
  console.log('📡 Providers available:');
  if (hasGemini) console.log('   ✓ Gemini (primary)');
  if (hasGroq) console.log('   ✓ Groq (fallback)');
  console.log('');
  
  // Get all content files
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('No content directory found');
    return;
  }
  
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(CONTENT_DIR, f));
  
// Determine which articles need enrichment
  const articleInfo = files.map(f => {
    const content = fs.readFileSync(f, 'utf-8');
    const parsed = matter(content);
    const bodyLength = parsed.content.length;
    const wasTruncated = bodyLength > OLD_CONTENT_LENGTH;
    const enrichedAt = parsed.data.enriched_at || null;
    const enrichedToday = enrichedAt === TODAY;
    return {
      path: f,
      name: path.basename(f, '.md'),
      enriched: !!enrichedAt,
      enrichedToday,
      wasTruncated,
      bodyLength
    };
  });

  let needsEnrichment: string[];
  let mode: string;

  if (SPECIFIC_FILES.length > 0) {
    // Filter to only specified files, force re-enrich them
    needsEnrichment = articleInfo
      .filter(a => SPECIFIC_FILES.includes(a.name) && !a.enrichedToday)
      .map(a => a.path);
    mode = 'specific';
  } else if (FORCE_ALL) {
    needsEnrichment = files;
    mode = 'force-all';
  } else if (FORCE_TRUNCATED) {
    // Skip ones already enriched today
    needsEnrichment = articleInfo
      .filter(a => (!a.enriched || a.wasTruncated) && !a.enrichedToday)
      .map(a => a.path);
    mode = 'force-truncated';
  } else {
    needsEnrichment = articleInfo
      .filter(a => !a.enriched)
      .map(a => a.path);
    mode = 'normal';
  }

  const truncatedCount = articleInfo.filter(a => a.enriched && a.wasTruncated && !a.enrichedToday).length;
  const enrichedCount = articleInfo.filter(a => a.enriched).length;
  const enrichedTodayCount = articleInfo.filter(a => a.enrichedToday).length;

  console.log(`📁 Found ${files.length} articles`);
  console.log(`   Already enriched: ${enrichedCount} (${enrichedTodayCount} today)`);
  console.log(`   Still need full-content enrichment: ${truncatedCount}`);
  
  if (mode === 'specific') {
    console.log(`\n🎯 --files: Processing ${needsEnrichment.length} specific articles\n`);
  } else if (mode === 'force-all') {
    console.log(`\n🔄 --force: Re-enriching ALL ${needsEnrichment.length} articles\n`);
  } else if (mode === 'force-truncated') {
    console.log(`\n🔄 --force-truncated: Re-enriching ${needsEnrichment.length} articles (new + truncated)\n`);
  } else {
    console.log(`\n🔄 ${needsEnrichment.length} need enrichment\n`);
  }

  if (needsEnrichment.length === 0) {
    console.log('✅ All articles already enriched!');
    if (truncatedCount > 0) {
      console.log(`\n💡 ${truncatedCount} articles were truncated at 6K chars.`);
      console.log('   Run with --force-truncated to re-enrich them with full content.');
    }
    return;
  }
  
  let enriched = 0;
  let failed = 0;
  const providerStats: Record<ProviderName, number> = { gemini: 0, groq: 0 };
  
  for (let i = 0; i < needsEnrichment.length; i++) {
    const file = needsEnrichment[i];
    const fileName = path.basename(file, '.md');
    
    // Estimate tokens for this article
    const fileContent = fs.readFileSync(file, 'utf-8');
    const fileParsed = matter(fileContent);
    const bodyLen = Math.min(fileParsed.content.length, MAX_CONTENT_LENGTH);
    const estTokens = Math.round(bodyLen / 4);
    
    console.log(`[${i + 1}/${needsEnrichment.length}] ${fileName} (~${estTokens} tokens)`);
    
    const forceThis = FORCE_ALL || FORCE_TRUNCATED || SPECIFIC_FILES.length > 0;
    const result = await enrichArticle(file, forceThis);
    
    if (result.success && result.provider) {
      enriched++;
      providerStats[result.provider]++;
      console.log(`   ✅ Enriched via ${result.provider}`);
    } else if (!result.skipped) {
      failed++;
    }
    
    // Rate limiting - wait between requests (skip on last item)
    if (i < needsEnrichment.length - 1) {
      await sleep(DELAY_MS);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Enriched: ${enriched}`);
  if (providerStats.gemini > 0) console.log(`      via Gemini: ${providerStats.gemini}`);
  if (providerStats.groq > 0) console.log(`      via Groq: ${providerStats.groq}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Skipped: ${files.length - needsEnrichment.length}`);
  console.log(`\n💡 Run 'npm run build:index' to update search index`);
}

main();
