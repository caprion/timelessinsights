import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '../components/Header';
import Tag from '../components/Tag';

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  source_url?: string;
  source?: string;
  author?: string;
  date: string;
  tags: string[];
  reading_time?: string;
  content: string;
}

interface SearchIndex {
  articles: Article[];
}

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  useEffect(() => {
    fetch('/search-index.json')
      .then(res => res.json())
      .then((data: SearchIndex) => {
        const found = data.articles.find(a => a.slug === slug);
        if (found) {
          setArticle(found);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-100 rounded"></div>
              <div className="h-4 bg-gray-100 rounded"></div>
              <div className="h-4 bg-gray-100 rounded w-5/6"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="font-serif text-2xl font-semibold text-gray-900 mb-4">
            Article not found
          </h1>
          <Link to="/browse" className="text-purple-600 hover:text-purple-800">
            ← Back to browse
          </Link>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link 
          to="/browse" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8"
        >
          ← Back to articles
        </Link>
        
        {/* Article header */}
        <header className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            {article.author && (
              <span>By {article.author}</span>
            )}
            {article.reading_time && (
              <span>{article.reading_time} read</span>
            )}
            {article.source_url && (
              <a 
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800"
              >
                View original ↗
              </a>
            )}
          </div>
          
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <Link key={tag} to={`/browse?tag=${encodeURIComponent(tag)}`}>
                  <Tag tag={tag} />
                </Link>
              ))}
            </div>
          )}
        </header>
        
        {/* Article content */}
        <article className="prose prose-lg">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </article>
        
        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <Link 
            to="/browse" 
            className="text-purple-600 hover:text-purple-800"
          >
            ← Browse more articles
          </Link>
        </footer>
      </main>
    </div>
  );
}
