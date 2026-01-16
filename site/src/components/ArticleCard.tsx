import { Link } from 'react-router-dom';

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  source?: string;
  author?: string;
  date: string;
  tags: string[];
  reading_time?: string;
}

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link 
      to={`/article/${article.slug}`}
      className="block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-600 hover:shadow-md transition-all group"
    >
      <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors mb-2">
        {article.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
        {article.excerpt}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-3">
          {article.source && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              {article.source}
            </span>
          )}
          {article.reading_time && (
            <span>{article.reading_time}</span>
          )}
        </div>
        <span>{article.date}</span>
      </div>
    </Link>
  );
}
