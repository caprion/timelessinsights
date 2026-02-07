import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import ArticleCard from '../components/ArticleCard';

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  source?: string;
  author?: string;
  date: string;
  tags: string[];
  reading_time?: string;
  content: string;
}

interface SearchIndex {
  articles: Article[];
  tags: string[];
  stats: {
    total: number;
    bySource: Record<string, number>;
  };
}

export default function Home() {
  const navigate = useNavigate();
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/search-index.json')
      .then(res => res.json())
      .then(data => {
        setIndex(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);
  
  const recentArticles = index?.articles.slice(0, 6) || [];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
      <Header />
      
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-widest text-accent-600 dark:text-accent-400 mb-4">
            Personal Knowledge Library
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-gray-900 dark:text-stone-100 mb-6">
            Timeless ideas for <br className="hidden md:block" />
            <span className="italic">clearer thinking</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-stone-300 max-w-xl mx-auto mb-10">
            Curated articles on mental models, decision-making, and wisdom from the world's best thinkers.
          </p>
          
          {!loading && index && (
            <SearchBar 
              articles={index.articles}
              onSelect={(slug) => navigate(`/article/${slug}`)}
              placeholder="Search articles, topics, ideas..."
              large
            />
          )}
        </div>
      </section>
      
      {/* Stats */}
      {index && (
        <section className="py-8 border-t border-gray-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-stone-400">
              <div>
                <span className="font-semibold text-gray-900 dark:text-stone-200">{index.stats.total}</span> articles
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-stone-200">{index.tags.length}</span> tags
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-stone-200">{Object.keys(index.stats.bySource).length}</span> sources
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Recent Articles */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-stone-100">
              Recent Articles
            </h2>
            <button 
              onClick={() => navigate('/browse')}
              className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:text-accent-800 dark:hover:text-accent-300"
            >
              View all →
            </button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-6 bg-white dark:bg-stone-800 rounded-xl border border-gray-100 dark:border-stone-700 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-stone-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-100 dark:bg-stone-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-100 dark:bg-stone-700 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : recentArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentArticles.map(article => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No articles yet.</p>
              <p className="text-sm">Add URLs to <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">input/urls.txt</code> and run <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">npm run scrape</code></p>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
