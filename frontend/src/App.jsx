import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ArtisanProfilePage from './pages/ArtisanProfilePage';
import MyReservationsPage from './pages/MyReservationsPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './hooks/useAuth';

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (isLoading) {
    return <p className="page-container py-16 text-gray-500 dark:text-gray-400">Chargement...</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="page-container py-16 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Connectez-vous pour accéder à cette page.
        </p>
        <button onClick={() => setShowLogin(true)} className="btn-primary mt-4">
          Se connecter
        </button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  return children;
}

function NotFoundPage() {
  return (
    <div className="page-container py-24 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">404</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Cette page n'existe pas.</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recherche" element={<SearchPage />} />
          <Route path="/artisans/:id" element={<ArtisanProfilePage />} />
          <Route
            path="/mes-reservations"
            element={
              <RequireAuth>
                <MyReservationsPage />
              </RequireAuth>
            }
          />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
