interface TagProps {
  tag: string;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
}

export default function Tag({ tag, count, selected, onClick }: TagProps) {
  const isClickable = !!onClick;
  
  const baseClasses = "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors";
  const interactiveClasses = isClickable ? "cursor-pointer" : "";
  const stateClasses = selected 
    ? "bg-purple-600 text-white" 
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";
  
  const className = `${baseClasses} ${interactiveClasses} ${stateClasses}`;
  
  if (isClickable) {
    return (
      <button onClick={onClick} className={className}>
        <span>{tag}</span>
        {count !== undefined && (
          <span className={`text-xs ${selected ? 'text-purple-200' : 'text-gray-400'}`}>
            {count}
          </span>
        )}
      </button>
    );
  }
  
  return (
    <span className={className}>
      <span>{tag}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-400">{count}</span>
      )}
    </span>
  );
}
