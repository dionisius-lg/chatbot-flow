// ============================================================================
// Multi-Server Login Page
// ============================================================================
// Login form with IP Server, Username, and Password inputs.
// Validates: IP format (regex), required fields, loading spinner.
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  // ─── Local form state ───────────────────────────────────────────────────
  const [ipServer, setIpServer] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // ─── Global auth store ──────────────────────────────────────────────────
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  // ─── Submit handler ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validate required fields
    if (!ipServer.trim() || !username.trim() || !password.trim()) {
      setLocalError('All fields are required');
      return;
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipServer.trim())) {
      setLocalError('Invalid IP address format');
      return;
    }

    try {
      // Call store login action -> POST to API
      await login(ipServer.trim(), username.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">CHATBOT FLOW BUILDER</h1>
          <p className="text-indigo-300 text-sm mt-1">Synergix Solution</p>
        </div>

        {/* ─── Login Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
          {/* IP Server field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">IP Server</label>
            <input
              type="text"
              value={ipServer}
              onChange={(e) => setIpServer(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="172.31.0.116"
            />
          </div>

          {/* Username field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="username"
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="********"
            />
          </div>

          {/* ─── Error Display ────────────────────────────────────────────── */}
          {(localError || error) && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">
              {localError || error}
            </div>
          )}

          {/* ─── Submit Button (with loading spinner) ──────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing In...
              </span>
            ) : (
              'SIGN IN'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}