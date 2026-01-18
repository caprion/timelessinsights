import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Network, ArrowLeft, Tag } from 'lucide-react';
import ArticleCard from '../components/ArticleCard';

interface ConceptData {
  name: string;
  count: number;
  articles: string[];
  relatedConcepts: Record<string, number>;
  topics: Record<string, number>;
}

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  source?: string;
  author?: string;
  date: string;
  tags: string[];
  reading_time?: string;
  topic?: string;
}

interface GraphIndex {
  concepts: Record<string, ConceptData>;
  articles: Record<string, any>;
}

export default function ConceptDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [graphData, setGraphData] = useState<GraphIndex | null>(null);
  const [searchIndex, setSearchIndex] = useState<{ articles: Article[] } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/graph-index.json').then(res => res.json()),
      fetch('/search-index.json').then(res => res.json())
    ])
      .then(([graph, search]) => {
        setGraphData(graph);
        setSearchIndex(search);
      })
      .catch(err => console.error('Failed to load data:', err));
  }, []);

  if (!graphData || !searchIndex || !slug) {
    return (
      <div className="min-h-screen bg-white dark:bg-stone-900 flex items-center justify-center">
        <div className="text-gray-400 dark:text-stone-500">Loading...</div>
      </div>
    );
  }

  const concept = graphData.concepts[slug];

  if (!concept) {
    return (
      <div className="min-h-screen bg-white dark:bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/concepts" className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Concepts
          </Link>
          <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-stone-100 mb-4">
            Concept Not Found
          </h1>
          <p className="text-gray-600 dark:text-stone-400">
            The concept "{slug}" doesn't exist in the knowledge graph.
          </p>
        </div>
      </div>
    );
  }

  // Get article details
  const articles = concept.articles
    .map(articleSlug => searchIndex.articles.find(a => a.slug === articleSlug))
    .filter(Boolean) as Article[];

  // Sort related concepts by co-occurrence
  const relatedConcepts = Object.entries(concept.relatedConcepts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Get primary topic
  const primaryTopic = Object.entries(concept.topics).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="min-h-screen bg-white dark:bg-stone-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button */}
        <Link to="/concepts" className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to All Concepts
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Tag className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-stone-100">
                  {slug}
                </h1>
              </div>
              <p className="text-lg text-gray-600 dark:text-stone-400">
                Appears in {concept.count} article{concept.count !== 1 ? 's' : ''}
                {primaryTopic && (
                  <span className="ml-2">
                    • Primary topic: <span className="text-purple-600 dark:text-purple-400 font-medium capitalize">{primaryTopic[0]}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Related Concepts */}
        {relatedConcepts.length > 0 && (
          <div className="mb-12 p-6 bg-gray-50 dark:bg-stone-800 rounded-xl border border-gray-100 dark:border-stone-700">
            <div className="flex items-center gap-2 mb-4">
              <Network className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="font-serif text-xl font-semibold text-gray-900 dark:text-stone-100">
                Frequently Appears With
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {relatedConcepts.map(([conceptName, count]) => (
                <Link
                  key={conceptName}
                  to={`/concept/${conceptName}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-900 rounded-lg border border-gray-200 dark:border-stone-700 hover:border-purple-200 dark:hover:border-purple-600 hover:shadow-md transition-all group"
                >
                  <span className="text-gray-900 dark:text-stone-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                    {conceptName}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Articles */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-stone-100 mb-6">
            Articles Featuring This Concept
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {articles.map(article => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
