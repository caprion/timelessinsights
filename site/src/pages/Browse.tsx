import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import ArticleCard from '../components/ArticleCard';
import Tag from '../components/Tag';

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
    byTag: Record<string, number>;
  };
}

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(true);
  
  const selectedTag = searchParams.get('tag') || '';
  
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
  
  const filteredArticles = useMemo(() => {
    if (!index) return [];
    if (!selectedTag) return index.articles;
    return index.articles.filter(a => a.tags.includes(selectedTag));
  }, [index, selectedTag]);
  
  const handleTagClick = (tag: string) => {
    if (tag === selectedTag) {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', tag);
    }
    setSearchParams(searchParams);
  };
  
  // Get popular tags (top 15 by count)
  const popularTags = useMemo(() => {
    if (!index) return [];
    return Object.entries(index.stats.byTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag, count]) => ({ tag, count }));
  }, [index]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-stone-100">
            Browse Articles
          </h1>
          <span className="text-sm text-gray-500 dark:text-stone-400">
            {filteredArticles.length} articles
          </span>
        </div>
        
        {/* Search */}
        {index && (
          <div className="mb-8">
            <SearchBar 
              articles={index.articles}
              onSelect={(slug) => navigate(`/article/${slug}`)}
              placeholder="Search..."
            />
          </div>
        )}
        
        {/* Tags */}
        {popularTags.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {popularTags.map(({ tag, count }) => (
                <Tag 
                  key={tag}
                  tag={tag}
                  count={count}
                  selected={tag === selectedTag}
                  onClick={() => handleTagClick(tag)}
                />
              ))}
              {selectedTag && (
                <button 
                  onClick={() => handleTagClick(selectedTag)}
                  className="text-sm text-gray-500 hover:text-gray-700 ml-2"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Articles */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-6 bg-white dark:bg-stone-800 rounded-xl border border-gray-100 dark:border-stone-700 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-stone-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-100 dark:bg-stone-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-100 dark:bg-stone-700 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map(article => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-stone-400">
            <p>No articles found{selectedTag ? ` for tag "${selectedTag}"` : ''}.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
