import { Mail, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-stone-800 bg-white dark:bg-stone-900 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          {/* Disclaimer */}
          <div className="text-center max-w-2xl">
            <p className="text-xs text-gray-600 dark:text-stone-400 leading-relaxed">
              This is a personal knowledge library. All articles are curated from publicly available sources 
              and enriched with AI-generated notes for personal learning. All content belongs to the original 
              authors and publishers.{' '}
              <strong>If you own any content here and would like it removed, please email me</strong>
              {' '}and I'll take it down immediately.
            </p>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-6">
            <a
              href="mailto:st.garg19@gmail.com"
              className="group flex items-center gap-2 text-gray-600 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">Email</span>
            </a>
            
            <a
              href="https://www.linkedin.com/in/stgarg/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-gray-600 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>
            
            <a
              href="https://x.com/gargsumit"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-gray-600 dark:text-stone-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              aria-label="X (Twitter)"
            >
              <Twitter className="w-5 h-5" />
              <span className="text-sm font-medium">X</span>
            </a>
          </div>
          
          {/* Copyright */}
          <p className="text-xs text-gray-500 dark:text-stone-500">
            © {new Date().getFullYear()} Sumit. Built for learning and knowledge sharing.
          </p>
        </div>
      </div>
    </footer>
  );
}
