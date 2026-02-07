import { Link } from 'react-router-dom';
import { Network } from 'lucide-react';

interface RelatedArticle {
  slug: string;
  title: string;
  weight: number;
  sharedConcepts: string[];
  sharedTags: string[];
}

interface RelatedArticlesProps {
  related: RelatedArticle[];
  maxDisplay?: number;
}

export default function RelatedArticles({ related, maxDisplay = 5 }: RelatedArticlesProps) {
  if (!related || related.length === 0) {
    return null;
  }

  const displayedArticles = related.slice(0, maxDisplay);

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-stone-700">
      <div className="flex items-center gap-2 mb-6">
        <Network className="w-5 h-5 text-accent-600 dark:text-accent-400" />
        <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-stone-100">
          Related Articles
        </h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedArticles.map((article) => (
          <Link
            key={article.slug}
            to={`/article/${article.slug}`}
            className="block p-4 bg-gray-50 dark:bg-stone-800 rounded-lg border border-gray-100 dark:border-stone-700 hover:border-accent-200 dark:hover:border-accent-600 hover:shadow-md transition-all group"
          >
            <h3 className="font-medium text-gray-900 dark:text-stone-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors mb-2 line-clamp-2">
              {article.title}
            </h3>
            
            {article.sharedConcepts.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-stone-400 mb-1">
                  Shared concepts:
                </p>
                <div className="flex flex-wrap gap-1">
                  {article.sharedConcepts.slice(0, 3).map((concept) => (
                    <span
                      key={concept}
                      className="px-2 py-0.5 text-xs bg-accent-100 dark:bg-stone-700 text-accent-700 dark:text-accent-300 rounded-full"
                    >
                      {concept}
                    </span>
                  ))}
                  {article.sharedConcepts.length > 3 && (
                    <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-stone-400">
                      +{article.sharedConcepts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-3 text-xs text-gray-400 dark:text-stone-500">
              Connection strength: {article.weight}
            </div>
          </Link>
        ))}
      </div>
      
      {related.length > maxDisplay && (
        <p className="mt-4 text-sm text-gray-500 dark:text-stone-400 text-center">
          +{related.length - maxDisplay} more related articles
        </p>
      )}
    </div>
  );
}
