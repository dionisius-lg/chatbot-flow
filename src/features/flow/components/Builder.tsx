/**
 * Builder (Bot Flow Editor)
 *
 * The main component (Page) for editing bot flows.
 * This component connects the FlowCanvas (visual editor) on the left
 * and the InspectorPanel (form editor) on the right.
 * Responsive: on mobile (smaller than md) the inspector panel becomes a toggleable overlay.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import FlowCanvas from './FlowCanvas';
import InspectorPanel from './InspectorPanel';
import { useAuthStore } from '../../auth/store/authStore';
import { useFlowStore } from '../store/flowStore';

export default function Builder() {
    // ─── Route params & navigation ──────────────────────────────────────────
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();

    // ─── Store selectors (selector pattern to prevent infinite re-renders) ──
    const user = useAuthStore((s) => s.user);
    const serverIp = useAuthStore((s) => s.serverIp);
    const logout = useAuthStore((s) => s.logout);
    const loadWorkspace = useFlowStore((s) => s.loadWorkspace);
    const templates = useFlowStore((s) => s.templates);
    const loading = useFlowStore((s) => s.loading);

    // ─── Responsive: inspector panel visibility for mobile ──────────────────
    // Default to visible on desktop (>=768px), hidden on mobile
    const [showInspector, setShowInspector] = useState(() => window.innerWidth >= 768);

    // Track window resize to toggle inspector on/off at md breakpoint
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setShowInspector(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Find the current template from store by URL param
    const template = templates.find((t) => t.id === Number(templateId));

    // Load workspace data when component mounts or templateId changes
    useEffect(() => {
        if (templateId) {
            loadWorkspace(Number(templateId));
        }
    }, [templateId, loadWorkspace]);

    return (
        <div className='h-screen flex flex-col bg-gray-50'>
            {/* ─── Header Bar ──────────────────────────────────────────────────── */}
            <header className='bg-white border-b border-gray-200 px-2 sm:px-4 py-2 flex items-center justify-between shrink-0 gap-1 sm:gap-3'>
                {/* Left: back button + template name */}
                <div className='flex items-center gap-1 sm:gap-3 min-w-0'>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className='text-gray-400 hover:text-gray-600 cursor-pointer shrink-0'
                    >
                        ←
                    </button>
                    <h1 className='text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1 sm:gap-2 truncate'>
                        {loading ? (
                            <>
                                <svg
                                    className='animate-spin h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 shrink-0'
                                    viewBox='0 0 24 24'
                                >
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
                                <span className='truncate'>Loading...</span>
                            </>
                        ) : (
                            <span className='truncate'>{template?.name || `Template #${templateId}`}</span>
                        )}
                    </h1>
                    <span className='hidden sm:inline text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0'>
                        ID: {templateId}
                    </span>
                </div>

                {/* Right: refresh, user info, toggle panel, logout */}
                <div className='flex items-center gap-1 sm:gap-3 shrink-0'>
                    {templateId && (
                        <button
                            onClick={() => loadWorkspace(Number(templateId))}
                            className='text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 px-2 sm:px-3 py-1 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
                            disabled={loading}
                            title='Refresh'
                        >
                            <svg
                                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${loading ? 'animate-spin' : ''}`}
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                            >
                                <path d='M21 12a9 9 0 1 1-6.219-8.56' />
                            </svg>
                            <span className='hidden sm:inline'>{loading ? 'Loading...' : 'Refresh'}</span>
                        </button>
                    )}
                    {/* Toggle inspector — visible on mobile only */}
                    <button
                        onClick={() => setShowInspector(true)}
                        className='md:hidden text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 cursor-pointer'
                        title='Open Panel'
                    >
                        Panel
                    </button>
                    <span className='hidden sm:inline text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                        {serverIp}
                    </span>
                    <span className='hidden sm:inline text-xs text-gray-600'>{user?.fullname || user?.username}</span>
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className='text-[10px] text-red-500 border border-red-200 px-2 py-1 rounded hover:bg-red-50 cursor-pointer'
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* ─── Main Content: FlowCanvas (left) + InspectorPanel (right) ────── */}
            <div className='flex-1 flex overflow-hidden relative'>
                <FlowCanvas />
                {/* InspectorPanel — overlay on mobile, sidebar on md+ */}
                <InspectorPanel showInspector={showInspector} onClose={() => setShowInspector(false)} />
            </div>
        </div>
    );
}
