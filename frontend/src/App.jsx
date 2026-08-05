import { useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import DiagnosticPage from './pages/DiagnosticPage';
import ArtisanProfilePage from './pages/ArtisanProfilePage';
import MyReservationsPage from './pages/MyReservationsPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import DevenirArtisan from './pages/DevenirArtisan';
import { useAuth } from './hooks/useAuth';

import RagDocAssistantPage from './pages/RagDocAssistantPage';

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (isLoading) {
    return <p className="page-container py-16 text-gray-500 dark:text-gray-400">Chargement...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}

function DashboardPage() {
  const { role } = useAuth();
  return role === 'worker' ? <WorkerDashboard /> : <ClientDashboard />;
}

function NotFoundPage() {
  return (
    <div className="page-container py-24 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">404</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Cette page n'existe pas.</p>
    </div>
  );
}

import { useLocation } from 'react-router-dom';

export default function App() {
  const location = useLocation();
  const isAssistantPage = location.pathname === '/assistant';

  return (
    <div className="flex min-h-screen flex-col">
      {!isAssistantPage && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recherche" element={<SearchPage />} />
          <Route path="/diagnostic" element={<DiagnosticPage />} />
          <Route path="/devenir-artisan" element={<DevenirArtisan />} />
          <Route path="/artisans/:id" element={<ArtisanProfilePage />} />
          <Route path="/assistant" element={<RagDocAssistantPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
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
          <Route path="/connexion" element={<AuthPage />} />
          <Route path="/inscription" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isAssistantPage && <Footer />}
    </div>
  );
}
