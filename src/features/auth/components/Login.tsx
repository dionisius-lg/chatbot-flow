// ============================================================================
// Multi-Server Login Page
// ============================================================================
// Login form with IP Server, Username, and Password inputs.
// Validates: IP format (regex), required fields, loading spinner.
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { isValidHost } from '../../../lib/value';
import { useAuthStore } from '../store/authStore';

export default function Login() {
    // ─── Local form state ───────────────────────────────────────────────────
    const [ipServer, setIpServer] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');

    // ─── Global auth store ──────────────────────────────────────────────────
    const login = useAuthStore((s) => s.login);
    const loading = useAuthStore((s) => s.loading);
    const error = useAuthStore((s) => s.error);
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

        // Validate IP address or Domain format using imported helper
        const serverInput = ipServer.trim();

        if (serverInput.startsWith('http://') || serverInput.startsWith('https://')) {
            setLocalError('Do not include http:// or https://. Use IP or Domain only.');
            return;
        }

        if (!isValidHost(serverInput)) {
            setLocalError('Invalid format. Example: webcc.synergix.co.id');
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
        <div
            className='min-h-screen bg-[#fafbfc] flex flex-col justify-center items-center p-4 relative overflow-hidden'
            style={{
                backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
                backgroundSize: '24px 24px',
            }}
        >
            <div className='w-full max-w-[380px] relative z-10'>
                {/* ─── Header Branding ─────────────────────────────────────────── */}
                <div className='text-center mb-6 sm:mb-8'>
                    <div className='w-12 h-12 bg-white rounded-2xl shadow-xs border border-gray-200/80 flex items-center justify-center text-indigo-600 mb-4 mx-auto'>
                        <svg
                            className='w-6 h-6'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            aria-hidden='true'
                        >
                            <rect width='7' height='7' x='3' y='3' rx='1' />
                            <rect width='7' height='7' x='14' y='14' rx='1' />
                            <path d='M10 6.5h4a2 2 0 0 1 2 2V14' />
                        </svg>
                    </div>
                    <h1 className='text-xl sm:text-2xl font-bold text-gray-900 tracking-tight'>
                        Chatbot Flow Builder
                    </h1>
                    <p className='text-gray-500 text-xs sm:text-sm mt-1'>Synergix Solution</p>
                </div>

                {/* ─── Login Card ───────────────────────────────────────────────── */}
                <form
                    onSubmit={handleSubmit}
                    className='bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-xs p-6 sm:p-7 space-y-4'
                >
                    {/* Host Field */}
                    <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1.5'>Server Host</label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400'>
                                <svg
                                    className='w-4 h-4'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    aria-hidden='true'
                                >
                                    <rect width='20' height='8' x='2' y='2' rx='2' />
                                    <rect width='20' height='8' x='2' y='14' rx='2' />
                                    <line x1='6' x2='6.01' y1='6' y2='6' />
                                    <line x1='6' x2='6.01' y1='18' y2='18' />
                                </svg>
                            </div>
                            <input
                                type='text'
                                value={ipServer}
                                onChange={(e) => setIpServer(e.target.value)}
                                className='w-full pl-10 pr-3.5 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/10 outline-none transition'
                                placeholder='webcc.synergix.co.id'
                            />
                        </div>
                        <p className='text-[11px] text-gray-400 mt-1 pl-1'>Enter IP or domain without http/https</p>
                    </div>

                    {/* Username Field */}
                    <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1.5'>Username</label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400'>
                                <svg
                                    className='w-4 h-4'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    aria-hidden='true'
                                >
                                    <path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' />
                                    <circle cx='12' cy='7' r='4' />
                                </svg>
                            </div>
                            <input
                                type='text'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className='w-full pl-10 pr-3.5 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/10 outline-none transition'
                                placeholder='Username'
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1.5'>Password</label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400'>
                                <svg
                                    className='w-4 h-4'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    aria-hidden='true'
                                >
                                    <rect width='18' height='11' x='3' y='11' rx='2' ry='2' />
                                    <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                                </svg>
                            </div>
                            <input
                                type='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className='w-full pl-10 pr-3.5 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/10 outline-none transition'
                                placeholder='••••••••'
                            />
                        </div>
                    </div>

                    {/* ─── Error Display ─────────────────────────────────────────── */}
                    {(localError || error) && (
                        <div className='bg-rose-50 border border-rose-200/80 text-rose-600 text-xs rounded-xl p-3 flex items-start gap-2'>
                            <svg
                                className='w-4 h-4 shrink-0 mt-0.5'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                                strokeWidth='2'
                                aria-hidden='true'
                            >
                                <circle cx='12' cy='12' r='10' />
                                <line x1='12' x2='12' y1='8' y2='12' />
                                <line x1='12' x2='12.01' y1='16' y2='16' />
                            </svg>
                            <span className='leading-tight'>{localError || error}</span>
                        </div>
                    )}

                    {/* ─── Submit Button ─────────────────────────────────────────── */}
                    <button
                        type='submit'
                        disabled={loading}
                        className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2'
                    >
                        {loading ? (
                            <>
                                <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
                                    <circle
                                        className='opacity-25'
                                        cx='12'
                                        cy='12'
                                        r='10'
                                        stroke='currentColor'
                                        strokeWidth='4'
                                        fill='none'
                                    />
                                    <path
                                        className='opacity-75'
                                        fill='currentColor'
                                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                                    />
                                </svg>
                                <span>Signing In...</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>

                {/* ─── Footer ───────────────────────────────────────────────────── */}
                <div className='text-center mt-6 text-xs text-gray-400'>
                    <span>Secure session connection</span>
                </div>
            </div>
        </div>
    );
}
