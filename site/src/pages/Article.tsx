import { useState, useEffect, ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Tag from '../components/Tag';

// Callout type configuration
const CALLOUT_TYPES: Record<string, { icon: string; label: string; className: string }> = {
  highlight: { icon: '✨', label: 'Highlight', className: 'callout-highlight' },
  note: { icon: '📝', label: 'Note', className: 'callout-note' },
  question: { icon: '❓', label: 'Question', className: 'callout-question' },
  insight: { icon: '💡', label: 'Insight', className: 'callout-insight' },
  warning: { icon: '⚠️', label: 'Warning', className: 'callout-warning' },
  tip: { icon: '💡', label: 'Tip', className: 'callout-tip' },
};

// Custom blockquote component that handles callout syntax
function CalloutBlockquote({ children }: { children?: ReactNode }) {
  // Extract text content from children to detect callout syntax
  const childArray = Array.isArray(children) ? children : [children];
  
  // Look for callout pattern in the first paragraph
  const firstChild = childArray[0];
  if (firstChild && typeof firstChild === 'object' && 'props' in firstChild) {
    const firstParagraph = firstChild.props?.children;
    const textContent = extractTextContent(firstParagraph);
    
    // Match [!type] or [!type]+ (collapsible) pattern
    const calloutMatch = textContent?.match(/^\[!(\w+)\](\+)?\s*/);
    
    if (calloutMatch) {
      const calloutType = calloutMatch[1].toLowerCase();
      const config = CALLOUT_TYPES[calloutType];
      
      if (config) {
        // Remove the callout marker from the content
        const cleanContent = removeCalloutMarker(childArray, calloutMatch[0]);
        
        return (
          <div className={`callout ${config.className}`}>
            <div className="callout-title">
              <span className="callout-icon">{config.icon}</span>
              <span className="callout-label">{config.label}</span>
            </div>
            <div className="callout-content">
              {cleanContent}
            </div>
          </div>
        );
      }
    }
  }
  
  // Regular blockquote
  return <blockquote>{children}</blockquote>;
}

// Helper to extract text content from React nodes
function extractTextContent(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextContent).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractTextContent(node.props.children);
  }
  return '';
}

// Helper to remove the callout marker from content
function removeCalloutMarker(children: ReactNode[], marker: string): ReactNode[] {
  return children.map((child, index) => {
    if (index === 0 && child && typeof child === 'object' && 'props' in child) {
      const childContent = child.props?.children;
      if (typeof childContent === 'string') {
        const newContent = childContent.replace(marker, '');
        return { ...child, props: { ...child.props, children: newContent } };
      }
      if (Array.isArray(childContent)) {
        const newChildContent = childContent.map((c, i) => {
          if (i === 0 && typeof c === 'string') {
            return c.replace(marker, '');
          }
          return c;
        });
        return { ...child, props: { ...child.props, children: newChildContent } };
      }
    }
    return child;
  });
}

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
  // AI-enriched fields
  summary?: string;
  highlights?: string[];
  topic?: string;
  secondary_topic?: string | null;
  related_concepts?: string[];
  scope?: string;
  anti_pattern?: string;
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Article not found
          </h1>
          <Link to="/browse" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300">
            ← Back to browse
          </Link>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link 
          to="/browse" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-8"
        >
          ← Back to articles
        </Link>
        
        {/* Article header */}
        <header className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
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
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
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
        
        {/* AI-enriched summary and highlights */}
        {(article.summary || (article.highlights && article.highlights.length > 0)) && (
          <div className="mb-10 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
            {article.summary && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wide mb-2">
                  TL;DR
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            )}
            
            {article.highlights && article.highlights.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wide mb-2">
                  Key Takeaways
                </h2>
                <ul className="space-y-2">
                  {article.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-purple-500 dark:text-purple-400 mt-1">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* When to Use / When NOT to Use */}
            {(article.scope || article.anti_pattern) && (
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                {article.scope && (
                  <div>
                    <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">✓ When to Use</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{article.scope}</p>
                  </div>
                )}
                {article.anti_pattern && (
                  <div>
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">✗ Common Mistake</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{article.anti_pattern}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Related Concepts */}
            {article.related_concepts && article.related_concepts.length > 0 && (
              <div className="pt-4 border-t border-purple-200 dark:border-purple-800 mt-4">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">Related Concepts</h3>
                <div className="flex flex-wrap gap-2">
                  {article.related_concepts.map((concept) => (
                    <span 
                      key={concept}
                      className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Article content */}
        <article className="prose prose-lg">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              blockquote: CalloutBlockquote as Components['blockquote'],
            }}
          >
            {article.content}
          </ReactMarkdown>
        </article>
        
        {/* Back to browse */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <Link 
            to="/browse" 
            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
          >
            ← Browse more articles
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
