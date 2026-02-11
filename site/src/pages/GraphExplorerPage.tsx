import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, Filter } from 'lucide-react';

interface GraphData {
  graph: {
    nodes: Array<{
      id: string;
      type: 'article' | 'concept' | 'topic';
      label: string;
      value?: number;
      topic?: string;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      weight?: number;
    }>;
  };
  stats: {
    totalArticles: number;
    totalConcepts: number;
  };
}

// Custom node component
function CustomNode({ data }: any) {
  const colors = {
    article: {
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-900',
    },
    concept: {
      bg: 'bg-accent-100',
      border: 'border-accent-300',
      text: 'text-accent-900',
    },
    topic: {
      bg: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-900',
    },
  };

  const color = colors[data.nodeType as keyof typeof colors] || colors.concept;

  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 ${color.bg} ${color.border} ${color.text} text-xs font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
      style={{ minWidth: '80px', maxWidth: '200px' }}
    >
      <div className="truncate">{data.label}</div>
      {data.value && (
        <div className="text-[10px] opacity-70 mt-0.5">
          {data.value} {data.nodeType === 'concept' ? 'articles' : 'connections'}
        </div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export default function GraphExplorerPage() {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [viewMode, setViewMode] = useState<'all' | 'concepts' | 'articles'>('concepts');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    fetch('/graph-index.json')
      .then(res => res.json())
      .then(data => {
        setGraphData(data);
        buildGraph(data, viewMode, selectedTopic);
      })
      .catch(err => console.error('Failed to load graph data:', err));
  }, []);

  useEffect(() => {
    if (graphData) {
      buildGraph(graphData, viewMode, selectedTopic);
    }
  }, [viewMode, selectedTopic, graphData]);

  const buildGraph = (data: GraphData, mode: string, topic: string) => {
    let filteredNodes = data.graph.nodes;
    let filteredEdges = data.graph.edges;

    // Filter by view mode
    if (mode === 'concepts') {
      filteredNodes = filteredNodes.filter(n => n.type === 'concept' || n.type === 'topic');
      filteredEdges = filteredEdges.filter(e => 
        !e.source.startsWith('article:') && !e.target.startsWith('article:')
      );
    } else if (mode === 'articles') {
      filteredNodes = filteredNodes.filter(n => n.type === 'article');
      filteredEdges = filteredEdges.filter(e => e.type === 'related-article');
    }

    // Filter by topic
    if (topic !== 'all') {
      const articleNodes = filteredNodes.filter(n => n.type === 'article' && n.topic === topic);
      const articleIds = new Set(articleNodes.map(n => n.id));
      
      filteredNodes = filteredNodes.filter(n => {
        if (n.type === 'article') return n.topic === topic;
        if (n.type === 'concept') {
          // Keep concept if it's connected to an article in this topic
          return filteredEdges.some(e => 
            articleIds.has(e.source) && e.target === n.id ||
            articleIds.has(e.target) && e.source === n.id
          );
        }
        return n.type === 'topic';
      });

      filteredEdges = filteredEdges.filter(e => {
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        return nodeIds.has(e.source) && nodeIds.has(e.target);
      });
    }

    // Limit nodes for performance (show top nodes by value)
    const maxNodes = 100;
    if (filteredNodes.length > maxNodes) {
      const sortedNodes = [...filteredNodes].sort((a, b) => (b.value || 0) - (a.value || 0));
      const topNodes = sortedNodes.slice(0, maxNodes);
      const nodeIds = new Set(topNodes.map(n => n.id));
      
      filteredNodes = topNodes;
      filteredEdges = filteredEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    // Convert to ReactFlow format with force-directed layout
    const flowNodes: Node[] = filteredNodes.map((node, i) => {
      const angle = (i / filteredNodes.length) * 2 * Math.PI;
      const radius = 300;
      
      return {
        id: node.id,
        type: 'custom',
        position: { 
          x: Math.cos(angle) * radius + 400, 
          y: Math.sin(angle) * radius + 300 
        },
        data: { 
          label: node.label,
          value: node.value,
          nodeType: node.type,
          originalNode: node,
        },
      };
    });

    const flowEdges: Edge[] = filteredEdges.map(edge => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: edge.type === 'related-article',
      style: { 
        stroke: edge.type === 'related-article' ? '#c2452d' : '#94a3b8',
        strokeWidth: edge.weight ? Math.min(edge.weight, 3) : 1,
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data.originalNode);
    
    // Navigate based on node type
    const nodeId = node.id;
    if (nodeId.startsWith('article:')) {
      const slug = nodeId.replace('article:', '');
      navigate(`/article/${slug}`);
    } else if (nodeId.startsWith('concept:')) {
      const concept = nodeId.replace('concept:', '');
      navigate(`/concept/${concept}`);
    }
  }, [navigate]);

  if (!graphData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Loading graph...</div>
      </div>
    );
  }

  const topics = ['all', 'mental-models', 'learning', 'leadership', 'decision-making', 'psychology', 'productivity', 'communication', 'investing'];

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Network className="w-6 h-6 text-accent-600" />
              <h1 className="font-serif text-2xl font-bold text-gray-900">
                Knowledge Graph
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              {nodes.length} nodes • {edges.length} connections
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">View:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('concepts')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'concepts'
                    ? 'bg-forest-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Concepts
              </button>
              <button
                onClick={() => setViewMode('articles')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'articles'
                    ? 'bg-forest-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Articles
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-forest-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
            </div>

            {viewMode !== 'concepts' && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <span className="text-sm font-medium text-gray-700">Topic:</span>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  {topics.map(topic => (
                    <option key={topic} value={topic}>
                      {topic === 'all' ? 'All Topics' : topic}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const type = (node.data as any).nodeType;
              if (type === 'article') return '#3b82f6';
              if (type === 'concept') return '#c2452d';
              return '#22c55e';
            }}
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="absolute bottom-20 left-4 bg-white rounded-lg border border-gray-200 shadow-lg p-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Article</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-500"></div>
            <span className="text-gray-600">Concept</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Topic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
