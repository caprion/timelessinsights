import { Link } from 'react-router-dom';
import SisterSite from './SisterSite';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-serif italic text-accent-600">ti</span>
          <span className="text-lg font-medium text-gray-900">TimelessInsights</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <SisterSite label="What I Write" url="https://againstentropy.pages.dev/" />
          <Link 
            to="/browse" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Browse
          </Link>
          <Link 
            to="/concepts" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Concepts
          </Link>
          <Link 
            to="/graph" 
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Graph
          </Link>
        </nav>
      </div>
    </header>
  );
}
