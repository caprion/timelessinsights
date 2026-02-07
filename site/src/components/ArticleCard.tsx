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
      className="block p-6 bg-white dark:bg-stone-800 rounded-xl border border-gray-100 dark:border-stone-700 hover:border-accent-200 dark:hover:border-accent-600 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all group"
    >
      <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-stone-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors mb-2">
        {article.title}
      </h3>
      <p className="text-gray-600 dark:text-stone-300 text-sm mb-4 line-clamp-2">
        {article.excerpt}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-stone-500">
        <div className="flex items-center gap-3">
          {article.source && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 rounded-full">
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
