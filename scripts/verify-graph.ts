/**
 * Quick verification script to display sample graph relationships
 */

import fs from 'fs';

const graphData = JSON.parse(fs.readFileSync('./public/graph-index.json', 'utf-8')) as any;

console.log('🕸️  KNOWLEDGE GRAPH VERIFICATION\n');
console.log('═'.repeat(60));

// Display stats
console.log('\n📊 STATISTICS:');
console.log(`   Total Articles: ${graphData.stats.totalArticles}`);
console.log(`   Total Concepts: ${graphData.stats.totalConcepts}`);
console.log(`   Total Topics: ${graphData.stats.totalTopics}`);
console.log(`   Avg Concepts per Article: ${graphData.stats.avgConceptsPerArticle}`);
console.log(`   Avg Connections per Article: ${graphData.stats.avgConnectionsPerArticle}`);

// Display top concepts
console.log('\n🔥 TOP 10 CONCEPTS:');
const sortedConcepts = Object.entries(graphData.concepts)
  .sort((a: any, b: any) => b[1].count - a[1].count)
  .slice(0, 10);

sortedConcepts.forEach(([name, data]: any, i) => {
  const topTopic = Object.entries(data.topics).sort((a: any, b: any) => b[1] - a[1])[0];
  console.log(`   ${(i + 1).toString().padStart(2)}. ${name.padEnd(30)} (${data.count} articles, topic: ${topTopic[0]})`);
});

// Display sample article relationships
console.log('\n🔗 SAMPLE ARTICLE RELATIONSHIPS:');
const sampleArticles = ['feynman-technique', 'critical-thinking', 'circle-of-competence'];

for (const slug of sampleArticles) {
  const conceptKey = `feynman-technique`;
  const articleKey = Object.keys(graphData.articles).find(k => k.includes(slug));
  
  if (!articleKey) continue;
  
  const article = graphData.articles[articleKey];
  console.log(`\n   📄 ${article.title}`);
  console.log(`      Topic: ${article.topic || 'N/A'}`);
  console.log(`      Concepts: ${article.concepts.join(', ')}`);
  console.log(`      Related Articles (${article.related.length}):`);
  
  article.related.slice(0, 3).forEach((rel: any) => {
    console.log(`         • ${rel.title} (weight: ${rel.weight})`);
    if (rel.sharedConcepts.length > 0) {
      console.log(`           Shared concepts: ${rel.sharedConcepts.join(', ')}`);
    }
  });
}

// Display concept co-occurrence
console.log('\n🔀 CONCEPT CO-OCCURRENCE EXAMPLES:');
const criticalThinking = graphData.concepts['critical-thinking'];
if (criticalThinking) {
  console.log(`\n   💡 "critical-thinking" frequently appears with:`);
  const topRelated = Object.entries(criticalThinking.relatedConcepts)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);
  topRelated.forEach(([concept, count]: any) => {
    console.log(`      • ${concept} (${count} times)`);
  });
}

// Display topics distribution
console.log('\n📚 TOPICS DISTRIBUTION:');
Object.entries(graphData.topics).forEach(([topic, articles]: any) => {
  console.log(`   ${topic.padEnd(20)} ${articles.length} articles`);
});

// Graph structure preview
console.log('\n🕸️  GRAPH STRUCTURE:');
console.log(`   Nodes: ${graphData.graph.nodes.length}`);
console.log(`   - Article nodes: ${graphData.graph.nodes.filter((n: any) => n.type === 'article').length}`);
console.log(`   - Concept nodes: ${graphData.graph.nodes.filter((n: any) => n.type === 'concept').length}`);
console.log(`   - Topic nodes: ${graphData.graph.nodes.filter((n: any) => n.type === 'topic').length}`);
console.log(`   Edges: ${graphData.graph.edges.length}`);
console.log(`   - has-concept: ${graphData.graph.edges.filter((e: any) => e.type === 'has-concept').length}`);
console.log(`   - related-article: ${graphData.graph.edges.filter((e: any) => e.type === 'related-article').length}`);

console.log('\n✅ Graph index verified successfully!\n');
