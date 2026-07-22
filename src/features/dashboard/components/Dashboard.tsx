/**
 * Dashboard (Template List Page)
 *
 * The landing page after login. Displays a list of bot templates.
 * Includes full CRUD (Create, Read, Update) capabilities for bot templates.
 * Click a template to navigate to the Builder page.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { isEmpty, dateParse } from '../../../lib/value';
import Pagination from '../../../shared/components/ui/Pagination';
import { useAuthStore } from '../../auth/store/authStore';
import { useFlowStore } from '../../flow/store/flowStore';

import type { BotTemplate } from '../../../types';

// ─── Constants ──────────────────────────────────────────────────────────────
const MEDIA_LABELS: Record<string, string> = {
    '4': 'WhatsApp',
    '18': 'Live Chat',
};

function getMediaLabel(mediaId: string): string {
    return MEDIA_LABELS[mediaId] || `Media #${mediaId}`;
}

export default function Dashboard() {
    // ─── Store selectors ─────────────────────────────────────────────────────
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const serverIp = useAuthStore((s) => s.serverIp);
    const logout = useAuthStore((s) => s.logout);

    const templates = useFlowStore((s) => s.templates);
    const pagination = useFlowStore((s) => s.pagination);
    const loadTemplates = useFlowStore((s) => s.loadTemplates);
    const createTemplate = useFlowStore((s) => s.createTemplate);
    const updateTemplate = useFlowStore((s) => s.updateTemplate);
    const loading = useFlowStore((s) => s.loading);

    // ─── Local state ─────────────────────────────────────────────────────────
    const [showCreate, setShowCreate] = useState(false);
    const [editTemplate, setEditTemplate] = useState<BotTemplate | null>(null);
    const [formName, setFormName] = useState('');
    const [formMediaId, setFormMediaId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Fetch templates on mount with current page
    useEffect(() => {
        loadTemplates(page);
    }, [loadTemplates, page]);

    // ─── Pagination handlers ─────────────────────────────────────────────────
    const goToPage = (newPage: number) => {
        if (newPage < 1) {
            return;
        }
        setPage(newPage);
    };

    // ─── Handlers ───────────────────────────────────────────────────────────

    // Create a new template
    const handleCreate = async () => {
        if (!formName.trim() || submitting) {
            return;
        }
        setSubmitting(true);
        try {
            setError(null);
            await createTemplate({ name: formName.trim(), media_id: formMediaId || '4', is_active: 0 });
            setFormName('');
            setFormMediaId('');
            setShowCreate(false);
            setPage(1);
        } catch (err: any) {
            setError(err.message || 'Failed to create template');
        } finally {
            setSubmitting(false);
        }
    };

    // Update existing template (name & media only)
    const handleUpdate = async () => {
        if (!editTemplate || !formName.trim() || submitting) {
            return;
        }
        setSubmitting(true);
        try {
            setError(null);
            await updateTemplate(editTemplate.id, { name: formName.trim(), media_id: formMediaId || '4' });
            setEditTemplate(null);
            setFormName('');
            setFormMediaId('');
        } catch (err: any) {
            setError(err.message || 'Failed to update template');
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle template active/inactive status
    const handleToggleActive = async (tpl: BotTemplate) => {
        if (submitting) {
            return;
        }
        setSubmitting(true);
        try {
            setError(null);
            await updateTemplate(tpl.id, { is_active: tpl.is_active === 1 ? 0 : 1 });
        } catch (err: any) {
            setError(err.message || 'Failed to toggle template status');
        } finally {
            setSubmitting(false);
        }
    };

    // Open edit form with template data pre-filled
    const openEdit = (tpl: BotTemplate) => {
        setEditTemplate(tpl);
        setFormName(tpl.name);
        setFormMediaId(tpl.media_id);
        setShowCreate(false);
    };

    const getSubmitButtonContent = () => {
        if (submitting) {
            return (
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
                    {editTemplate ? 'Updating...' : 'Creating...'}
                </>
            );
        }
        return editTemplate ? 'Update' : 'Create';
    };

    const renderTemplates = () => {
        if (loading) {
            return (
                <div className='flex flex-col items-center justify-center py-12 text-gray-400'>
                    <svg className='animate-spin h-8 w-8 mb-3 text-indigo-500' viewBox='0 0 24 24'>
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
                    <span>Loading...</span>
                </div>
            );
        }

        if (isEmpty(templates)) {
            return (
                <div className='text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200'>
                    No templates yet. Create one to get started.
                </div>
            );
        }

        return (
            <div className='grid gap-3 sm:gap-4'>
                {templates.map((tpl) => (
                    <div
                        key={tpl.id}
                        className='bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition sm:flex sm:items-center sm:justify-between'
                    >
                        {/* Avatar + template info */}
                        <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
                            <div className='w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold shrink-0'>
                                {tpl.name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div className='min-w-0 flex-1'>
                                <h3 className='text-sm sm:font-medium text-gray-800 truncate'>{tpl.name}</h3>
                                <div className='flex items-center gap-2 sm:gap-3 text-xs text-gray-400 mt-0.5 flex-wrap'>
                                    {/* Status indicator dot */}
                                    <span className='flex items-center gap-1'>
                                        <span
                                            className={`inline-block w-2 h-2 rounded-full ${tpl.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                                        />
                                        {tpl.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span>{getMediaLabel(tpl.media_id)}</span>
                                    <span className='hidden sm:inline'>
                                        Created:{' '}
                                        {tpl.created
                                            ? (() => {
                                                  const p = dateParse(tpl.created);
                                                  return p.date ? `${p.date}/${p.month}/${p.year}` : '-';
                                              })()
                                            : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Action buttons */}
                        <div className='flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 sm:border-t-0 sm:pt-0 sm:mt-0 sm:ml-4 sm:shrink-0'>
                            <button
                                onClick={() => handleToggleActive(tpl)}
                                disabled={submitting}
                                className={`text-xs border px-2 sm:px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50 ${
                                    tpl.is_active
                                        ? 'text-orange-600 border-orange-200 hover:bg-orange-50'
                                        : 'text-green-600 border-green-200 hover:bg-green-50'
                                }`}
                            >
                                {tpl.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                                onClick={() => openEdit(tpl)}
                                className='text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-50 cursor-pointer'
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => navigate(`/builder/${tpl.id}`)}
                                className='text-xs bg-indigo-600 text-white px-3 sm:px-4 py-1.5 rounded-lg hover:bg-indigo-700 cursor-pointer'
                            >
                                Open
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className='min-h-screen bg-gray-50'>
            {/* ─── Header Bar ──────────────────────────────────────────────────── */}
            <header className='bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2 sm:gap-3 min-w-0'>
                    <h1 className='text-sm sm:text-lg font-bold text-indigo-600 truncate'>Chatbot Flow Builder</h1>
                </div>
                <div className='flex items-center gap-2 sm:gap-4 shrink-0'>
                    <span className='hidden sm:inline text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                        {serverIp}
                    </span>
                    <span className='hidden sm:inline text-sm text-gray-600'>{user?.fullname || user?.username}</span>
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className='text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 cursor-pointer'
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* ─── Main Content ────────────────────────────────────────────────── */}
            <main className='max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8'>
                {/* Section header with "New Template" button */}
                <div className='flex items-center justify-between mb-4 sm:mb-6'>
                    <h2 className='text-lg sm:text-xl font-semibold text-gray-800'>Bot Templates</h2>
                    <button
                        onClick={() => {
                            setShowCreate(true);
                            setEditTemplate(null);
                            setFormName('');
                            setFormMediaId('');
                        }}
                        className='bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer'
                    >
                        + New Template
                    </button>
                </div>

                {/* ─── Error Banner ──────────────────────────────────────────────── */}
                {error && (
                    <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between'>
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className='text-red-400 hover:text-red-600 cursor-pointer ml-2'
                        >
                            x
                        </button>
                    </div>
                )}

                {/* ─── Create / Edit Inline Form ──────────────────────────────────── */}
                {(showCreate || editTemplate) && (
                    <div className='bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm'>
                        <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                            {editTemplate ? 'Edit Template' : 'New Template'}
                        </h3>
                        <div className='space-y-3'>
                            <div>
                                <label className='text-xs text-gray-500 block mb-1'>Name</label>
                                <input
                                    type='text'
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none'
                                    placeholder='Template name'
                                />
                            </div>
                            <div>
                                <label className='text-xs text-gray-500 block mb-1'>Media</label>
                                <select
                                    value={formMediaId}
                                    onChange={(e) => setFormMediaId(e.target.value)}
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none'
                                >
                                    <option value='4'>WhatsApp</option>
                                    <option value='18'>Live Chat</option>
                                </select>
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    onClick={() => {
                                        setShowCreate(false);
                                        setEditTemplate(null);
                                    }}
                                    className='px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer'
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editTemplate ? handleUpdate : handleCreate}
                                    className='px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1'
                                    disabled={!formName.trim() || submitting}
                                >
                                    {getSubmitButtonContent()}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Template List / Loading / Empty ────────────────────────────── */}
                {renderTemplates()}
                {/* ─── Pagination ──────────────────────────────────────────────────── */}
                {!loading && templates.length > 0 && pagination.last_page > 1 && (
                    <Pagination pagination={pagination} onPageChange={goToPage} />
                )}
            </main>
        </div>
    );
}
