// ============================================================================
// App Root Component
// ============================================================================
// Defines routes, auth guard (ProtectedRoute), and session hydration.
// Before rendering, waits for auth session to be restored from storage.
// ============================================================================

import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAuthStore } from './store/authStore';

// Dynamic import (lazy loading) for views
const Login = lazy(() => import('./views/Login'));
const Dashboard = lazy(() => import('./views/Dashboard'));
const Builder = lazy(() => import('./views/Builder'));

// Simple loading indicator for lazy-loaded route transitions
const PageLoader = () => (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <svg className='animate-spin h-8 w-8 text-indigo-600' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
        </svg>
    </div>
);

// ─── Auth Guard ─────────────────────────────────────────────────────────────
// Wraps protected components. Redirects to /login if user is not authenticated.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    if (!isLoggedIn) {
        return <Navigate to='/login' replace />;
    }
    return <>{children}</>;
}

export default function App() {
    const restoreSession = useAuthStore((s) => s.restoreSession);
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
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
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                <div className='text-gray-400 text-sm'>Loading...</div>
            </div>
        );
    }

    const basePath = import.meta.env.VITE_APP_BASE_PATH || '';
    const resolvedBasename = basePath === '/' ? '' : basePath;

    return (
        <BrowserRouter basename={resolvedBasename}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Login page — redirects to dashboard if already logged in */}
                    <Route path='/login' element={isLoggedIn ? <Navigate to='/dashboard' replace /> : <Login />} />
                    {/* Dashboard — template list */}
                    <Route
                        path='/dashboard'
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    {/* Builder — flow canvas + inspector */}
                    <Route
                        path='/builder/:templateId'
                        element={
                            <ProtectedRoute>
                                <Builder />
                            </ProtectedRoute>
                        }
                    />
                    {/* Catch-all — redirect to login */}
                    <Route path='*' element={<Navigate to='/login' replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}
