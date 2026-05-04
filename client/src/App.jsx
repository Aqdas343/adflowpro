import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';

import HomePage              from './pages/HomePage';
import LoginPage             from './pages/LoginPage';
import RegisterPage          from './pages/RegisterPage';
import GigDetailPage         from './pages/GigDetailPage';
import CreateGigPage         from './pages/CreateGigPage';
import MyGigsPage            from './pages/MyGigsPage';
import EditGigPage           from './pages/EditGigPage';
import AdminDashboardPage    from './pages/AdminDashboardPage';
import ClientDashboardPage   from './pages/ClientDashboardPage';
import ProviderDashboardPage from './pages/ProviderDashboardPage';
import NotificationsPage     from './pages/NotificationsPage';
import OAuthCallbackPage     from './pages/OAuthCallbackPage';
import NotFoundPage          from './pages/NotFoundPage';

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function PageBoundary({ children }) {
  return (
    <ErrorBoundary page>
      {children}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<PageBoundary><HomePage /></PageBoundary>} />
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

          <Route path="/gigs/:slug" element={<PageBoundary><GigDetailPage /></PageBoundary>} />

          <Route path="/create-gig" element={
            <ProtectedRoute roles={['provider']}>
              <PageBoundary><CreateGigPage /></PageBoundary>
            </ProtectedRoute>
          } />

          <Route path="/my-gigs" element={
            <ProtectedRoute roles={['provider']}>
              <PageBoundary><MyGigsPage /></PageBoundary>
            </ProtectedRoute>
          } />

          <Route path="/edit-gig/:id" element={
            <ProtectedRoute roles={['provider']}>
              <PageBoundary><EditGigPage /></PageBoundary>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/provider" element={
            <ProtectedRoute roles={['provider']}>
              <PageBoundary><ProviderDashboardPage /></PageBoundary>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/admin" element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <PageBoundary><AdminDashboardPage /></PageBoundary>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/client" element={
            <ProtectedRoute roles={['client']}>
              <PageBoundary><ClientDashboardPage /></PageBoundary>
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute roles={['client', 'provider', 'admin', 'super_admin', 'moderator']}>
              <PageBoundary><NotificationsPage /></PageBoundary>
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-sm font-bold text-gray-900">GigMarket</span>
            <span className="text-xs text-gray-400 ml-2">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">About</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
