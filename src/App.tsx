// ============================================================================
// App Root Component
// ============================================================================
// Defines routes, auth guard (ProtectedRoute), and session hydration.
// Before rendering, waits for auth session to be restored from storage.
// ============================================================================

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Builder from './views/Builder';

// ─── Auth Guard ─────────────────────────────────────────────────────────────
// Wraps protected components. Redirects to /login if user is not authenticated.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { restoreSession, isLoggedIn } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // Hydrate: restore auth session from storage before rendering
  useEffect(() => {
    (async () => {
      await restoreSession();
      setHydrated(true);
    })();
  }, [restoreSession]);

  // Show a loading screen while the session is being restored
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login page — redirects to dashboard if already logged in */}
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
        {/* Dashboard — template list */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        {/* Builder — flow canvas + inspector */}
        <Route path="/builder/:templateId" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
        {/* Catch-all — redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}