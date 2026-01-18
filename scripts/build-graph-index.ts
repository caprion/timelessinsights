/**
 * Build graph index from content files
 * Generates graph-index.json for relationship visualization
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = './content';
const PUBLIC_DIR = './public';
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'graph-index.json');

interface ArticleMetadata {
  slug: string;
  title: string;
  topic?: string;
  secondary_topic?: string | null;
  related_concepts?: string[];
  tags: string[];
  author?: string;
}

interface ConceptData {
  name: string;
  count: number;
  articles: string[]; // slugs
  relatedConcepts: Record<string, number>; // concept -> co-occurrence count
  topics: Record<string, number>; // topic -> count
}

interface ArticleRelationship {
  slug: string;
  title: string;
  weight: number; // Number of shared concepts/tags
  sharedConcepts: string[];
  sharedTags: string[];
}

interface ArticleGraphData {
  slug: string;
  title: string;
  topic?: string;
  concepts: string[];
  tags: string[];
  related: ArticleRelationship[];
}

interface GraphNode {
  id: string;
  type: 'article' | 'concept' | 'topic';
  label: string;
  value?: number; // For sizing (article count for concepts, connection count for articles)
  topic?: string; // For coloring articles
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'has-concept' | 'related-article' | 'topic-classification';
  weight?: number;
}

interface GraphIndex {
  concepts: Record<string, ConceptData>;
  articles: Record<string, ArticleGraphData>;
  topics: Record<string, string[]>; // topic -> article slugs
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  stats: {
    totalArticles: number;
    totalConcepts: number;
    totalTopics: number;
    avgConceptsPerArticle: number;
    avgConnectionsPerArticle: number;
  };
  generated_at: string;
}

function calculateArticleRelationships(
  articles: ArticleMetadata[]
): Record<string, ArticleRelationship[]> {
  const relationships: Record<string, ArticleRelationship[]> = {};
  
  // For each article, find related articles
  for (const article of articles) {
    const related: ArticleRelationship[] = [];
    
    for (const other of articles) {
      if (article.slug === other.slug) continue;
      
      const sharedConcepts = (article.related_concepts || []).filter(
        c => (other.related_concepts || []).includes(c)
      );
      
      const sharedTags = article.tags.filter(
        t => other.tags.includes(t) && !t.startsWith('source:')
      );
      
      // Only include if there are shared concepts or multiple shared tags
      if (sharedConcepts.length > 0 || sharedTags.length >= 2) {
        const weight = sharedConcepts.length * 2 + sharedTags.length; // Concepts weighted more
        
        related.push({
          slug: other.slug,
          title: other.title,
          weight,
          sharedConcepts,
          sharedTags,
        });
      }
    }
    
    // Sort by weight (strongest connections first), limit to top 10
    related.sort((a, b) => b.weight - a.weight);
    relationships[article.slug] = related.slice(0, 10);
  }
  
  return relationships;
}

function buildConceptIndex(articles: ArticleMetadata[]): Record<string, ConceptData> {
  const concepts: Record<string, ConceptData> = {};
  
  // First pass: collect all concepts and their articles
  for (const article of articles) {
    const articleConcepts = article.related_concepts || [];
    
    for (const concept of articleConcepts) {
      if (!concepts[concept]) {
        concepts[concept] = {
          name: concept,
          count: 0,
          articles: [],
          relatedConcepts: {},
          topics: {},
        };
      }
      
      concepts[concept].count++;
      concepts[concept].articles.push(article.slug);
      
      // Track topic distribution
      if (article.topic) {
        concepts[concept].topics[article.topic] = 
          (concepts[concept].topics[article.topic] || 0) + 1;
      }
    }
  }
  
  // Second pass: calculate co-occurrence of concepts
  for (const article of articles) {
    const articleConcepts = article.related_concepts || [];
    
    // For each pair of concepts in this article
    for (let i = 0; i < articleConcepts.length; i++) {
      for (let j = i + 1; j < articleConcepts.length; j++) {
        const concept1 = articleConcepts[i];
        const concept2 = articleConcepts[j];
        
        if (concepts[concept1]) {
          concepts[concept1].relatedConcepts[concept2] = 
            (concepts[concept1].relatedConcepts[concept2] || 0) + 1;
        }
        
        if (concepts[concept2]) {
          concepts[concept2].relatedConcepts[concept1] = 
            (concepts[concept2].relatedConcepts[concept1] || 0) + 1;
        }
      }
    }
  }
  
  return concepts;
}

function buildGraph(
  articles: ArticleMetadata[],
  concepts: Record<string, ConceptData>,
  relationships: Record<string, ArticleRelationship[]>
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  // Add article nodes
  for (const article of articles) {
    const connectionCount = relationships[article.slug]?.length || 0;
    
    nodes.push({
      id: `article:${article.slug}`,
      type: 'article',
      label: article.title,
      value: connectionCount + (article.related_concepts?.length || 0),
      topic: article.topic,
    });
    
    // Add edges from article to concepts
    for (const concept of article.related_concepts || []) {
      edges.push({
        source: `article:${article.slug}`,
        target: `concept:${concept}`,
        type: 'has-concept',
      });
    }
    
    // Add edges to related articles (only if weight >= 3 to keep graph clean)
    for (const related of relationships[article.slug] || []) {
      if (related.weight >= 3) {
        edges.push({
          source: `article:${article.slug}`,
          target: `article:${related.slug}`,
          type: 'related-article',
          weight: related.weight,
        });
      }
    }
  }
  
  // Add concept nodes
  for (const [conceptKey, conceptData] of Object.entries(concepts)) {
    nodes.push({
      id: `concept:${conceptKey}`,
      type: 'concept',
      label: conceptKey,
      value: conceptData.count,
    });
  }
  
  // Add topic nodes
  const topicSet = new Set(articles.map(a => a.topic).filter(Boolean));
  for (const topic of topicSet) {
    nodes.push({
      id: `topic:${topic}`,
      type: 'topic',
      label: topic!,
      value: articles.filter(a => a.topic === topic).length,
    });
  }
  
  return { nodes, edges };
}

function main() {
  console.log('🕸️  Building knowledge graph index...\n');
  
  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('No content directory found');
    const emptyIndex: GraphIndex = {
      concepts: {},
      articles: {},
      topics: {},
      graph: { nodes: [], edges: [] },
      stats: {
        totalArticles: 0,
        totalConcepts: 0,
        totalTopics: 0,
        avgConceptsPerArticle: 0,
        avgConnectionsPerArticle: 0,
      },
      generated_at: new Date().toISOString(),
    };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(emptyIndex, null, 2));
    return;
  }
  
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  
  // Read all articles
  const articles: ArticleMetadata[] = [];
  
  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(content);
    
    const slug = file.replace('.md', '');
    
    articles.push({
      slug,
      title: parsed.data.title || 'Untitled',
      topic: parsed.data.topic,
      secondary_topic: parsed.data.secondary_topic,
      related_concepts: parsed.data.related_concepts || [],
      tags: parsed.data.tags || [],
      author: parsed.data.author,
    });
  }
  
  console.log(`📚 Found ${articles.length} articles`);
  
  // Build concept index
  const concepts = buildConceptIndex(articles);
  console.log(`🏷️  Found ${Object.keys(concepts).length} unique concepts`);
  
  // Calculate relationships
  const relationships = calculateArticleRelationships(articles);
  const totalConnections = Object.values(relationships).reduce(
    (sum, rels) => sum + rels.length, 
    0
  );
  console.log(`🔗 Generated ${totalConnections} article relationships`);
  
  // Build article graph data
  const articleGraphData: Record<string, ArticleGraphData> = {};
  for (const article of articles) {
    articleGraphData[article.slug] = {
      slug: article.slug,
      title: article.title,
      topic: article.topic,
      concepts: article.related_concepts || [],
      tags: article.tags,
      related: relationships[article.slug] || [],
    };
  }
  
  // Build topic index
  const topics: Record<string, string[]> = {};
  for (const article of articles) {
    if (article.topic) {
      if (!topics[article.topic]) {
        topics[article.topic] = [];
      }
      topics[article.topic].push(article.slug);
    }
  }
  
  // Build graph structure
  const graph = buildGraph(articles, concepts, relationships);
  console.log(`🕸️  Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
  
  // Calculate stats
  const totalConcepts = Object.keys(concepts).length;
  const avgConceptsPerArticle = articles.length > 0
    ? articles.reduce((sum, a) => sum + (a.related_concepts?.length || 0), 0) / articles.length
    : 0;
  const avgConnectionsPerArticle = articles.length > 0
    ? totalConnections / articles.length
    : 0;
  
  const index: GraphIndex = {
    concepts,
    articles: articleGraphData,
    topics,
    graph,
    stats: {
      totalArticles: articles.length,
      totalConcepts,
      totalTopics: Object.keys(topics).length,
      avgConceptsPerArticle: Math.round(avgConceptsPerArticle * 10) / 10,
      avgConnectionsPerArticle: Math.round(avgConnectionsPerArticle * 10) / 10,
    },
    generated_at: new Date().toISOString(),
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Articles: ${articles.length}`);
  console.log(`   Concepts: ${totalConcepts}`);
  console.log(`   Topics: ${Object.keys(topics).length}`);
  console.log(`   Avg concepts/article: ${index.stats.avgConceptsPerArticle}`);
  console.log(`   Avg connections/article: ${index.stats.avgConnectionsPerArticle}`);
  console.log(`   Graph size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);
  console.log(`\n✅ Saved to ${OUTPUT_FILE}`);
  
  // Show top concepts
  const topConcepts = Object.entries(concepts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  
  console.log(`\n🔥 Top 10 concepts:`);
  topConcepts.forEach(([name, data], i) => {
    console.log(`   ${i + 1}. ${name} (${data.count} articles)`);
  });
}

main();
