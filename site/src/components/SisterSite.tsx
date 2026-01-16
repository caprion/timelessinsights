import { ExternalLink } from 'lucide-react';

interface SisterSiteProps {
  label: string;
  url: string;
}

export default function SisterSite({ label, url }: SisterSiteProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-400 transition-colors rounded-full border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
    >
      <span className="font-medium">{label}</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
