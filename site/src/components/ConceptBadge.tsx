import { Link } from 'react-router-dom';

interface ConceptBadgeProps {
  concept: string;
  clickable?: boolean;
  className?: string;
}

export default function ConceptBadge({ concept, clickable = true, className = '' }: ConceptBadgeProps) {
  const baseClasses = "inline-block px-3 py-1 text-sm bg-accent-100 text-accent-700 rounded-full transition-colors";
  
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
      className={`${baseClasses} hover:bg-accent-200 hover:shadow-sm ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {concept}
    </Link>
  );
}
