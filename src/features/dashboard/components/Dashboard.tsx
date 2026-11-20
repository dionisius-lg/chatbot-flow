/**
 * Dashboard (Template List Page)
 *
 * The landing page after login. Displays a list of bot templates.
 * Includes full CRUD (Create, Read, Update) capabilities for bot templates.
 * Click a template to navigate to the Builder page.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCcw, X, Pencil, ArrowRight, ChevronDown } from 'lucide-react';

import { isEmpty, dateParse } from '../../../lib/value';
import Pagination from '../../../shared/components/ui/Pagination';
import { useAuthStore } from '../../auth/store/authStore';
import { useFlowStore } from '../../flow/store/flowStore';

import MediaIcon from './MediaIcon';
import { MEDIA_OPTIONS, getMediaLabel } from '../../../constants';
import type { BotTemplate, TemplateFilters } from '../../../types';

export default function Dashboard() {
    // ─── Store selectors ─────────────────────────────────────────────────────
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const serverIp = useAuthStore((s) => s.serverIp);
    const logout = useAuthStore((s) => s.logout);

    const templates = useFlowStore((s) => s.templates);
    const pagination = useFlowStore((s) => s.pagination);
    const templateFilters = useFlowStore((s) => s.templateFilters);
    const loadTemplates = useFlowStore((s) => s.loadTemplates);
    const setTemplateFilters = useFlowStore((s) => s.setTemplateFilters);
    const createTemplate = useFlowStore((s) => s.createTemplate);
    const updateTemplate = useFlowStore((s) => s.updateTemplate);
    const loading = useFlowStore((s) => s.loading);

    // ─── Local state ─────────────────────────────────────────────────────────
    const [showCreate, setShowCreate] = useState(false);
    const [editTemplate, setEditTemplate] = useState<BotTemplate | null>(null);
    const [formName, setFormName] = useState('');
    const [formMediaId, setFormMediaId] = useState('');
    const [formIsActive, setFormIsActive] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Filter bar state (synced with store's templateFilters)
    const [filterName, setFilterName] = useState(templateFilters.name || '');
    const [filterMediaId, setFilterMediaId] = useState(templateFilters.media_id || '');
    const [filterIsActive, setFilterIsActive] = useState<string>(
        templateFilters.is_active !== undefined ? String(templateFilters.is_active) : '',
    );

    // Track initial mount to prevent debounce effect from re-fetching on load
    const isFirstRender = useRef(true);

    // Keep a ref of current values so debounce and handlers always read freshest values
    const filterStateRef = useRef({
        name: filterName,
        media_id: filterMediaId,
        is_active: filterIsActive,
    });
    filterStateRef.current = {
        name: filterName,
        media_id: filterMediaId,
        is_active: filterIsActive,
    };

    // Helper to close and reset create/edit modal
    const closeModal = () => {
        setShowCreate(false);
        setEditTemplate(null);
        setFormName('');
        setFormMediaId('');
        setFormIsActive(0);
        setError(null);
    };

    // Close modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && (showCreate || editTemplate)) {
                closeModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showCreate, editTemplate]);

    // Initial mount: load first page
    useEffect(() => {
        loadTemplates(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced effect for template name ontype (min. 3 characters)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            const trimmed = filterName.trim();
            const currentMedia = filterStateRef.current.media_id.trim();
            const currentStatus = filterStateRef.current.is_active;

            const newFilters: TemplateFilters = {};
            // Aturan nama: minimal 3 karakter untuk dikirim, kurang dari 3 di-omit
            if (trimmed.length >= 3) {
                newFilters.name = trimmed;
            }
            if (currentMedia) {
                newFilters.media_id = currentMedia;
            }
            if (currentStatus !== '') {
                newFilters.is_active = Number(currentStatus);
            }

            setTemplateFilters(newFilters);
            loadTemplates(1, newFilters);
        }, 350);

        return () => clearTimeout(timer);
    }, [filterName, loadTemplates, setTemplateFilters]);

    // ─── Filter auto-trigger handlers ────────────────────────────────────────
    const handleMediaChange = (newMediaId: string) => {
        setFilterMediaId(newMediaId);
        const trimmed = filterStateRef.current.name.trim();
        const currentStatus = filterStateRef.current.is_active;

        const newFilters: TemplateFilters = {};
        if (trimmed.length >= 3) {
            newFilters.name = trimmed;
        }
        if (newMediaId.trim()) {
            newFilters.media_id = newMediaId.trim();
        }
        if (currentStatus !== '') {
            newFilters.is_active = Number(currentStatus);
        }

        setTemplateFilters(newFilters);
        loadTemplates(1, newFilters);
    };

    const handleStatusChange = (newStatus: string) => {
        setFilterIsActive(newStatus);
        const trimmed = filterStateRef.current.name.trim();
        const currentMedia = filterStateRef.current.media_id.trim();

        const newFilters: TemplateFilters = {};
        if (trimmed.length >= 3) {
            newFilters.name = trimmed;
        }
        if (currentMedia) {
            newFilters.media_id = currentMedia;
        }
        if (newStatus !== '') {
            newFilters.is_active = Number(newStatus);
        }

        setTemplateFilters(newFilters);
        loadTemplates(1, newFilters);
    };

    const handleClearName = () => {
        setFilterName('');
        const currentMedia = filterStateRef.current.media_id.trim();
        const currentStatus = filterStateRef.current.is_active;

        const newFilters: TemplateFilters = {};
        if (currentMedia) {
            newFilters.media_id = currentMedia;
        }
        if (currentStatus !== '') {
            newFilters.is_active = Number(currentStatus);
        }

        setTemplateFilters(newFilters);
        loadTemplates(1, newFilters);
    };

    const handleResetFilter = () => {
        setFilterName('');
        setFilterMediaId('');
        setFilterIsActive('');
        setTemplateFilters({});
        loadTemplates(1, {});
    };

    const hasActiveFilters = Boolean(
        filterName.trim().length > 0 || filterMediaId !== '' || filterIsActive !== '',
    );

    // ─── Pagination handlers ─────────────────────────────────────────────────
    const goToPage = (newPage: number) => {
        if (newPage < 1) {
            return;
        }
        loadTemplates(newPage);
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
            closeModal();
        } catch (err: any) {
            setError(err.message || 'Failed to create template');
        } finally {
            setSubmitting(false);
        }
    };

    // Update existing template (name and is_active; media_id is omitted)
    const handleUpdate = async () => {
        if (!editTemplate || !formName.trim() || submitting) {
            return;
        }
        setSubmitting(true);
        try {
            setError(null);
            await updateTemplate(editTemplate.id, {
                name: formName.trim(),
                is_active: formIsActive,
            });
            closeModal();
        } catch (err: any) {
            setError(err.message || 'Failed to update template');
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle template active/inactive status (shortcut)
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
        setFormIsActive(tpl.is_active);
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

        if (loading && isEmpty(templates)) {
            return (
                <div className='grid gap-3 sm:gap-4'>
                    {[1, 2, 3].map((n) => (
                        <div
                            key={n}
                            className='bg-white rounded-xl border border-gray-200 p-4 animate-pulse flex items-center justify-between'
                        >
                            <div className='flex items-center gap-4 flex-1'>
                                <div className='w-10 h-10 bg-gray-200 rounded-lg shrink-0' />
                                <div className='space-y-2 flex-1'>
                                    <div className='h-4 bg-gray-200 rounded w-1/3' />
                                    <div className='h-3 bg-gray-100 rounded w-1/4' />
                                </div>
                            </div>
                            <div className='h-8 bg-gray-200 rounded w-24 hidden sm:block' />
                        </div>
                    ))}
                </div>
            );
        }

        if (isEmpty(templates)) {
            const hasActiveFilters = Boolean(
                templateFilters.name || templateFilters.media_id || templateFilters.is_active !== undefined,
            );
            return (
                <div className='text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200'>
                    {hasActiveFilters ? (
                        <div>
                            <p className='font-medium text-gray-600 mb-1'>No templates found</p>
                            <p className='text-xs text-gray-400 mb-3'>Try adjusting your search or filters.</p>
                            <button
                                onClick={handleResetFilter}
                                className='text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer underline'
                            >
                                Reset filters
                            </button>
                        </div>
                    ) : (
                        'No templates yet. Create one to get started.'
                    )}
                </div>
            );
        }

        return (
            <div className='grid gap-3 sm:gap-4 w-full min-w-0'>
                {templates.map((tpl) => (
                    <div
                        key={tpl.id}
                        className='bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition sm:flex sm:items-center sm:justify-between w-full min-w-0'
                    >
                        {/* Media icon + template info */}
                        <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
                            <MediaIcon mediaId={tpl.media_id} />
                            <div className='min-w-0 flex-1'>
                                <h3 className='text-sm sm:font-medium text-gray-800 truncate'>{tpl.name}</h3>
                                <div className='flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap'>
                                    {/* Status Badge */}
                                    {tpl.is_active === 1 ? (
                                        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0'>
                                            <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                                            Active
                                        </span>
                                    ) : (
                                        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 shrink-0'>
                                            <span className='w-1.5 h-1.5 rounded-full bg-gray-400' />
                                            Inactive
                                        </span>
                                    )}
                                    <span className='font-medium text-gray-500'>{getMediaLabel(tpl.media_id)}</span>
                                    <span className='text-gray-300'>•</span>
                                    <span>
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
                        {/* Action buttons with Toggle Switch */}
                        <div className='flex items-center justify-end gap-2 sm:gap-2.5 mt-3 pt-3 border-t border-gray-100 sm:border-t-0 sm:pt-0 sm:mt-0 sm:ml-4 sm:shrink-0 flex-wrap'>
                            {/* Toggle Switch without text label */}
                            <button
                                type='button'
                                role='switch'
                                aria-checked={tpl.is_active === 1}
                                onClick={() => handleToggleActive(tpl)}
                                disabled={submitting}
                                title={tpl.is_active ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 ${
                                    tpl.is_active ? 'bg-emerald-500' : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        tpl.is_active ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>

                            <button
                                onClick={() => openEdit(tpl)}
                                className='inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-indigo-600 border border-gray-200 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-50 transition-colors cursor-pointer'
                            >
                                <Pencil className='w-3.5 h-3.5' />
                                <span>Edit</span>
                            </button>
                            <button
                                onClick={() => navigate(`/builder/${tpl.id}`)}
                                className='inline-flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 sm:px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs'
                            >
                                <span>Open</span>
                                <ArrowRight className='w-3.5 h-3.5' />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className='min-h-screen bg-gray-50 overflow-x-hidden w-full'>
            {/* ─── Header Bar ──────────────────────────────────────────────────── */}
            <header className='w-full bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center justify-between gap-2'>
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
                        className='text-xs text-red-500 hover:text-red-700 border border-red-200 px-2.5 sm:px-3 py-1 rounded-lg hover:bg-red-50 cursor-pointer'
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* ─── Main Content ────────────────────────────────────────────────── */}
            <main className='w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 min-w-0'>
                {/* Section header with "New Template" button */}
                <div className='flex items-center justify-between mb-4 sm:mb-6 gap-2'>
                    <h2 className='text-lg sm:text-xl font-semibold text-gray-800 truncate'>Bot Templates</h2>
                    <button
                        onClick={() => {
                            setShowCreate(true);
                            setEditTemplate(null);
                            setFormName('');
                            setFormMediaId('4');
                            setFormIsActive(0);
                        }}
                        className='bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer shrink-0'
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

                {/* ─── Create / Edit Popup Modal ──────────────────────────────────── */}
                {(showCreate || editTemplate) && (
                    <div
                        className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity'
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                closeModal();
                            }
                        }}
                    >
                        <div
                            role='dialog'
                            aria-modal='true'
                            className='relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6 overflow-hidden'
                        >
                            {/* Modal Header */}
                            <div className='flex items-center justify-between pb-3 mb-4 border-b border-gray-100'>
                                <div>
                                    <h3 className='text-base font-semibold text-gray-800'>
                                        {editTemplate ? 'Edit Template' : 'New Template'}
                                    </h3>
                                    <p className='text-xs text-gray-400 mt-0.5'>
                                        {editTemplate
                                            ? 'Update template name and activation status'
                                            : 'Create a new bot conversation template'}
                                    </p>
                                </div>
                                <button
                                    type='button'
                                    onClick={closeModal}
                                    className='text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer'
                                    title='Close'
                                >
                                    <X className='w-5 h-5' />
                                </button>
                            </div>

                            {/* Modal Body / Form */}
                            <div className='space-y-4'>
                                {/* 1. Name Field */}
                                <div>
                                    <label className='text-xs font-medium text-gray-700 block mb-1.5'>
                                        Template Name <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition bg-white placeholder:text-gray-400'
                                        placeholder='Enter template name...'
                                        autoFocus
                                    />
                                </div>

                                {/* 2. Media Field */}
                                <div>
                                    <label className='text-xs font-medium text-gray-700 block mb-1.5'>Media</label>
                                    {editTemplate ? (
                                        <div>
                                            <input
                                                type='text'
                                                readOnly
                                                disabled
                                                value={getMediaLabel(formMediaId)}
                                                className='w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed select-none'
                                            />
                                            <span className='text-[11px] text-gray-400 mt-1 block'>
                                                Media channel cannot be changed after creation.
                                            </span>
                                        </div>
                                    ) : (
                                        <div className='relative'>
                                            <select
                                                value={formMediaId}
                                                onChange={(e) => setFormMediaId(e.target.value)}
                                                className='w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition cursor-pointer appearance-none text-gray-800'
                                            >
                                                {MEDIA_OPTIONS.map((opt) => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {opt.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className='w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none' />
                                        </div>
                                    )}
                                </div>

                                {/* 3. Status Field (Segmented Control during Edit) */}
                                {editTemplate && (
                                    <div>
                                        <label className='text-xs font-medium text-gray-700 block mb-1.5'>
                                            Status
                                        </label>
                                        <div className='grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200'>
                                            <button
                                                type='button'
                                                onClick={() => setFormIsActive(1)}
                                                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                                    formIsActive === 1
                                                        ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <span
                                                    className={`w-2 h-2 rounded-full ${
                                                        formIsActive === 1 ? 'bg-emerald-500' : 'bg-gray-300'
                                                    }`}
                                                />
                                                <span>Active</span>
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setFormIsActive(0)}
                                                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                                    formIsActive === 0
                                                        ? 'bg-white text-gray-700 shadow-xs border border-gray-200'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <span
                                                    className={`w-2 h-2 rounded-full ${
                                                        formIsActive === 0 ? 'bg-gray-500' : 'bg-gray-300'
                                                    }`}
                                                />
                                                <span>Inactive</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className='flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-5'>
                                    <button
                                        type='button'
                                        onClick={closeModal}
                                        className='px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='button'
                                        onClick={editTemplate ? handleUpdate : handleCreate}
                                        disabled={!formName.trim() || submitting}
                                        className='px-4 py-2 text-xs sm:text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs'
                                    >
                                        {getSubmitButtonContent()}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Filter Bar ──────────────────────────────────────────────────── */}
                <div className='bg-white rounded-xl border border-gray-200 p-3.5 sm:p-5 mb-4 sm:mb-6 shadow-xs w-full min-w-0'>
                    {/* Header bar: Title + Reset Button */}
                    <div className='flex items-center justify-between gap-2 mb-3.5 flex-wrap'>
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-semibold uppercase tracking-wider text-gray-500'>
                                Filter Templates
                            </span>
                            {hasActiveFilters && (
                                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100'>
                                    Active
                                </span>
                            )}
                        </div>
                        {hasActiveFilters && (
                            <button
                                type='button'
                                onClick={handleResetFilter}
                                className='inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 transition cursor-pointer px-2 py-1 rounded-md hover:bg-gray-100'
                                title='Reset all filters'
                            >
                                <RotateCcw className='w-3.5 h-3.5' />
                                <span>Reset Filter</span>
                            </button>
                        )}
                    </div>

                    {/* Filter Controls: Optimized 12-column Grid (Name: 6, Media: 4, Status: 2) */}
                    <div className='grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4 min-w-0'>
                        {/* 1. Template Name (6 cols on desktop, 12 cols on tablet) */}
                        <div className='sm:col-span-12 lg:col-span-6'>
                            <label className='text-xs font-medium text-gray-700 block mb-1.5'>
                                Template Name <span className='text-[11px] font-normal text-gray-400'>(min. 3 chars)</span>
                            </label>
                            <div className='relative'>
                                <input
                                    type='text'
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                    placeholder='Search template name...'
                                    className='w-full border border-gray-300 rounded-lg pl-8 pr-8 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition bg-white placeholder:text-gray-400'
                                />
                                <Search className='w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
                                {filterName && (
                                    <button
                                        type='button'
                                        onClick={handleClearName}
                                        title='Clear search'
                                        className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition cursor-pointer'
                                    >
                                        <X className='w-3.5 h-3.5' />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. Media (4 cols on desktop, 6 cols on tablet) */}
                        <div className='sm:col-span-6 lg:col-span-4'>
                            <label className='text-xs font-medium text-gray-700 block mb-1.5'>Media</label>
                            <div className='relative'>
                                <select
                                    value={filterMediaId}
                                    onChange={(e) => handleMediaChange(e.target.value)}
                                    className='w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition cursor-pointer text-gray-800 appearance-none'
                                >
                                    <option value=''>All Media</option>
                                    {MEDIA_OPTIONS.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className='w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none' />
                            </div>
                        </div>

                        {/* 3. Status (2 cols on desktop, 6 cols on tablet) */}
                        <div className='sm:col-span-6 lg:col-span-2'>
                            <label className='text-xs font-medium text-gray-700 block mb-1.5'>Status</label>
                            <div className='relative'>
                                <select
                                    value={filterIsActive}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className='w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition cursor-pointer text-gray-800 appearance-none'
                                >
                                    <option value=''>All Status</option>
                                    <option value='1'>Active</option>
                                    <option value='0'>Inactive</option>
                                </select>
                                <ChevronDown className='w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none' />
                            </div>
                        </div>
                    </div>
                </div>

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
