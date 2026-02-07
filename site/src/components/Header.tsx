import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import SisterSite from './SisterSite';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-stone-950/95 backdrop-blur border-b border-gray-100 dark:border-stone-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-serif italic text-accent-600 dark:text-accent-400">ti</span>
          <span className="text-lg font-medium text-gray-900 dark:text-stone-200">TimelessInsights</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <SisterSite label="What I Write" url="https://againstentropy.pages.dev/" />
          <Link 
            to="/browse" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
          >
            Browse
          </Link>
          <Link 
            to="/concepts" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
          >
            Concepts
          </Link>
          <Link 
            to="/graph" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
          >
            Graph
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
