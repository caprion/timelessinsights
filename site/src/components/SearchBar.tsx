import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  content: string;
}

interface SearchBarProps {
  articles: Article[];
  onSelect: (slug: string) => void;
  placeholder?: string;
  large?: boolean;
}

export default function SearchBar({ articles, onSelect, placeholder = "Search articles...", large = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const fuse = useMemo(() => {
    return new Fuse(articles, {
      keys: ['title', 'excerpt', 'tags', 'content'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [articles]);
  
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 8);
  }, [fuse, query]);
  
  const handleSelect = (slug: string) => {
    setQuery('');
    setIsOpen(false);
    onSelect(slug);
  };
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <svg 
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 ${large ? 'w-5 h-5' : 'w-4 h-4'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className={`w-full bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-600 rounded-xl pl-11 pr-4 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500
            focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/30 focus:border-purple-500 dark:focus:border-purple-400
            ${large ? 'py-4 text-lg' : 'py-3 text-base'}`}
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-stone-800 rounded-xl border border-gray-200 dark:border-stone-600 shadow-lg dark:shadow-xl dark:shadow-black/30 overflow-hidden">
          {results.map((result) => (
            <button
              key={result.item.slug}
              onClick={() => handleSelect(result.item.slug)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-stone-700 border-b border-gray-100 dark:border-stone-700 last:border-0"
            >
              <div className="font-medium text-gray-900 dark:text-stone-100">{result.item.title}</div>
              <div className="text-sm text-gray-500 dark:text-stone-400 truncate">{result.item.excerpt}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
