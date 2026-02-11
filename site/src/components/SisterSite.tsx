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
      className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-accent-600 transition-colors rounded-full border border-gray-200 hover:border-accent-300 hover:bg-amber-50"
    >
      <span className="font-medium">{label}</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
