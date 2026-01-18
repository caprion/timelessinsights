import { Link } from 'react-router-dom';

interface ConceptBadgeProps {
  concept: string;
  clickable?: boolean;
  className?: string;
}

export default function ConceptBadge({ concept, clickable = true, className = '' }: ConceptBadgeProps) {
  const baseClasses = "inline-block px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full transition-colors";
  
  if (!clickable) {
    return (
      <span className={`${baseClasses} ${className}`}>
        {concept}
      </span>
    );
  }

  return (
    <Link
      to={`/concept/${concept}`}
      className={`${baseClasses} hover:bg-purple-200 dark:hover:bg-purple-800/40 hover:shadow-sm ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {concept}
    </Link>
  );
}
