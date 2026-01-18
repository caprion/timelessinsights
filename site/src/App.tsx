import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Article from './pages/Article';
import ConceptsPage from './pages/ConceptsPage';
import ConceptDetailPage from './pages/ConceptDetailPage';
import GraphExplorerPage from './pages/GraphExplorerPage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/article/:slug" element={<Article />} />
      <Route path="/concepts" element={<ConceptsPage />} />
      <Route path="/concept/:slug" element={<ConceptDetailPage />} />
      <Route path="/graph" element={<GraphExplorerPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
