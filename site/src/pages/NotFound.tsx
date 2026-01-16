import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-24 text-center flex-1">
        <h1 className="font-serif text-4xl font-semibold text-gray-900 mb-4">
          Page not found
        </h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link 
          to="/" 
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Go home
        </Link>
      </main>
      <Footer />
    </div>
  );
}
