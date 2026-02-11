import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Network, Search, TrendingUp } from 'lucide-react';

interface ConceptData {
  name: string;
  count: number;
  articles: string[];
  relatedConcepts: Record<string, number>;
  topics: Record<string, number>;
}

interface GraphIndex {
  concepts: Record<string, ConceptData>;
  stats: {
    totalConcepts: number;
    totalArticles: number;
  };
}

export default function ConceptsPage() {
  const [graphData, setGraphData] = useState<GraphIndex | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'frequency' | 'alphabetical'>('frequency');

  useEffect(() => {
    fetch('/graph-index.json')
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(err => console.error('Failed to load graph data:', err));
  }, []);

  if (!graphData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Loading concepts...</div>
      </div>
    );
  }

  const concepts = Object.entries(graphData.concepts);
  
  // Filter concepts
  const filteredConcepts = concepts.filter(([name]) => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort concepts
  const sortedConcepts = filteredConcepts.sort((a, b) => {
    if (sortBy === 'frequency') {
      return b[1].count - a[1].count;
    }
    return a[0].localeCompare(b[0]);
  });

  // Group by topic
  const conceptsByTopic: Record<string, [string, ConceptData][]> = {};
  sortedConcepts.forEach(([name, data]) => {
    const topTopic = Object.entries(data.topics).sort((a, b) => b[1] - a[1])[0];
    if (topTopic) {
      const topic = topTopic[0];
      if (!conceptsByTopic[topic]) {
        conceptsByTopic[topic] = [];
      }
      conceptsByTopic[topic].push([name, data]);
    }
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Network className="w-8 h-8 text-accent-600" />
            <h1 className="font-serif text-4xl font-bold text-gray-900">
              Concept Map
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Explore {graphData.stats.totalConcepts} interconnected concepts across {graphData.stats.totalArticles} articles
          </p>
        </div>

        {/* Search and Sort */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('frequency')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'frequency'
                  ? 'bg-forest-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Frequency
            </button>
            <button
              onClick={() => setSortBy('alphabetical')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'alphabetical'
                  ? 'bg-forest-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              A-Z
            </button>
          </div>
        </div>

        {/* Concepts by Topic */}
        {Object.entries(conceptsByTopic).map(([topic, concepts]) => (
          <div key={topic} className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4 capitalize">
              {topic} ({concepts.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {concepts.map(([name, data]) => (
                <Link
                  key={name}
                  to={`/concept/${name}`}
                  className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-accent-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 group-hover:text-accent-600 transition-colors">
                      {name}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-accent-100 text-accent-700 rounded-full">
                      {data.count}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {data.count} article{data.count !== 1 ? 's' : ''}
                  </p>
                  {Object.keys(data.relatedConcepts).length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Related to {Object.keys(data.relatedConcepts).length} concept{Object.keys(data.relatedConcepts).length !== 1 ? 's' : ''}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filteredConcepts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No concepts found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
