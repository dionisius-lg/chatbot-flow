// ============================================================================
// InspectorPanel — Right Sidebar Panel
// ============================================================================
// Shows properties of the selected flow + its dialog list.
// Responsive: on mobile (< md) renders as a fixed full-screen overlay;
// on desktop (md+) renders as a fixed-width sidebar.
// Features:
// - Flow Properties: name, type, timeout, next_flow, is_initial, is_active
// - Dirty state detection: save button appears only when changes are detected
// - Dialog list with inline DialogEditor per item
// - Add Dialog form with type and body fields
// ============================================================================

import { useState, useEffect } from 'react';

import DialogEditor from './DialogEditor';
import { isEmpty } from '../../lib/value';
import { useFlowStore } from '../../store/flowStore';

import type { BotDialog } from '../../types';

interface InspectorPanelProps {
    showInspector: boolean;
    onClose: () => void;
}

export default function InspectorPanel({ showInspector, onClose }: InspectorPanelProps) {
    // ─── Store selectors ─────────────────────────────────────────────────────
    const nodes = useFlowStore((s) => s.nodes);
    const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
    const flowTypes = useFlowStore((s) => s.flowTypes);
    const dialogTypes = useFlowStore((s) => s.dialogTypes);
    const updateFlow = useFlowStore((s) => s.updateFlow);
    const deleteFlow = useFlowStore((s) => s.deleteFlow);
    const saving = useFlowStore((s) => s.saving);
    const createDialog = useFlowStore((s) => s.createDialog);
    const createMediaDialog = useFlowStore((s) => s.createMediaDialog);

    // ─── Derived data ───────────────────────────────────────────────────────
    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    const flow = selectedNode?.data?.flow;
    const dialogs: BotDialog[] = (selectedNode?.data?.dialogs || []) as BotDialog[];

    // ─── Local form state ───────────────────────────────────────────────────
    const [editName, setEditName] = useState('');
    const [editTypeId, setEditTypeId] = useState(1);
    const [editTimeout, setEditTimeout] = useState(0);
    const [editInitial, setEditInitial] = useState(0);
    const [editActive, setEditActive] = useState(1);
    const [editNextFlowId, setEditNextFlowId] = useState(0);
    const [dirty, setDirty] = useState(false);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [newDialogType, setNewDialogType] = useState(1);
    const [newDialogBody, setNewDialogBody] = useState('');
    const [savingFlow, setSavingFlow] = useState(false);
    const [addingDialog, setAddingDialog] = useState(false);
    const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Sync form state when flow changes (e.g., after reload or node switch)
    useEffect(() => {
        if (flow) {
            setEditName(flow.name || '');
            setEditTypeId(flow.bot_flow_type_id);
            setEditTimeout(flow.timeout_duration);
            setEditInitial(flow.is_initial);
            setEditActive(flow.is_active);
            setEditNextFlowId(flow.next_flow_id);
            setDirty(false);
            setError(null);
        }
    }, [flow]);

    // ─── Handlers ───────────────────────────────────────────────────────────

    // Save flow property changes via API
    const handleSave = async () => {
        if (!flow || savingFlow) {
            return;
        }
        setSavingFlow(true);
        setError(null);
        try {
            await updateFlow(flow.id, {
                name: editName,
                bot_flow_type_id: editTypeId,
                timeout_duration: editTimeout,
                is_initial: editInitial,
                is_active: editActive,
                next_flow_id: editNextFlowId,
            });
            setDirty(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save flow properties');
        } finally {
            setSavingFlow(false);
        }
    };

    // Soft-delete flow (set is_active = 0)
    const handleDelete = async () => {
        if (!flow || !window.confirm(`Delete flow "${flow.name || `#${flow.id}`}"?`)) {
            return;
        }
        setError(null);
        try {
            await deleteFlow(flow.id);
        } catch (err: any) {
            setError(err.message || 'Failed to delete flow');
        }
    };

    // Add a new dialog to the selected flow
    const handleAddDialog = async () => {
        if (!flow || addingDialog) {
            return;
        }
        setAddingDialog(true);
        setError(null);
        try {
            if (newDialogType === 6) {
                await createMediaDialog(
                    {
                        bot_flow_id: flow.id,
                        bot_dialog_type_id: 6,
                        sequence: dialogs.length + 1,
                        next_flow_id: 0,
                    },
                    newMediaFile!,
                );
            } else {
                await createDialog({
                    bot_flow_id: flow.id,
                    bot_dialog_type_id: newDialogType,
                    body: newDialogBody,
                    sequence: dialogs.length + 1,
                    is_active: 1,
                });
            }
            setShowNewDialog(false);
            setNewDialogBody('');
            setNewMediaFile(null);
        } catch (err: any) {
            setError(err.message || 'Failed to add dialog');
        } finally {
            setAddingDialog(false);
        }
    };

    const selectedFlow = nodes.find((n) => n.id === selectedNodeId);

    // ─── Hidden on mobile when not toggled ───────────────────────────────────
    if (!showInspector) {
        return null;
    }

    // ─── Shared container classes: overlay on mobile, sidebar on md+ ─────────
    const containerClasses =
        'fixed inset-0 z-40 bg-white md:relative md:inset-auto md:w-80 md:min-w-80 md:border-l border-gray-200 flex flex-col overflow-y-auto';

    // ─── Empty state (no node selected) ──────────────────────────────────────
    if (!selectedFlow || !flow) {
        return (
            <div className={containerClasses}>
                {/* Close button for mobile */}
                <div className='md:hidden flex items-center justify-between p-3 border-b border-gray-200'>
                    <span className='text-sm font-semibold text-gray-700'>Inspector</span>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700 text-lg cursor-pointer'>
                        x
                    </button>
                </div>
                <div className='p-4 text-center text-gray-400 text-sm mt-20'>Select a flow node to edit properties</div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            {/* ─── Mobile Header: title + close button ─────────────────────────── */}
            <div className='md:hidden flex items-center justify-between p-3 border-b border-gray-200'>
                <span className='text-sm font-semibold text-gray-700'>{flow.name || `Flow #${flow.id}`}</span>
                <button onClick={onClose} className='text-gray-500 hover:text-gray-700 text-lg cursor-pointer'>
                    x
                </button>
            </div>

            {/* ─── Error Banner ────────────────────────────────────────────────── */}
            {error && (
                <div className='mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center justify-between'>
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className='text-red-500 hover:text-red-700 font-bold cursor-pointer ml-2'
                    >
                        x
                    </button>
                </div>
            )}

            {/* ─── Flow Properties Section ─────────────────────────────────────── */}
            <div className='p-4 border-b border-gray-200'>
                {/* Header: title + save button (dirty only) + delete */}
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-sm font-semibold text-gray-700'>Flow Properties</h2>
                    <div className='flex gap-1'>
                        {dirty && (
                            <button
                                onClick={handleSave}
                                disabled={saving || savingFlow}
                                className='text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1'
                            >
                                {savingFlow ? (
                                    <>
                                        <svg className='animate-spin h-3 w-3' viewBox='0 0 24 24'>
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
                                        Saving...
                                    </>
                                ) : (
                                    'Save'
                                )}
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className='text-xs text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg cursor-pointer'
                        >
                            Delete
                        </button>
                    </div>
                </div>

                {/* Form fields */}
                <div className='space-y-3'>
                    {/* Flow ID (read-only) */}
                    <div>
                        <label className='text-xs text-gray-500 block mb-1'>Flow ID</label>
                        <input
                            type='text'
                            value={`#${flow.id}`}
                            disabled
                            className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400'
                        />
                    </div>

                    {/* Flow name */}
                    <div>
                        <label className='text-xs text-gray-500 block mb-1'>Name</label>
                        <input
                            type='text'
                            value={editName}
                            onChange={(e) => {
                                setEditName(e.target.value);
                                setDirty(true);
                            }}
                            className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
                            placeholder='Flow name'
                        />
                    </div>

                    {/* Flow type */}
                    <div>
                        <label className='text-xs text-gray-500 block mb-1'>Flow Type</label>
                        <select
                            value={editTypeId}
                            onChange={(e) => {
                                setEditTypeId(Number(e.target.value));
                                setDirty(true);
                            }}
                            className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none'
                        >
                            {flowTypes.map((ft) => (
                                <option key={ft.id} value={ft.id}>
                                    {ft.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Timeout & Next Flow (2-column grid) */}
                    <div className='grid grid-cols-2 gap-2'>
                        <div>
                            <label className='text-xs text-gray-500 block mb-1'>Timeout (s)</label>
                            <input
                                type='number'
                                value={editTimeout}
                                onChange={(e) => {
                                    setEditTimeout(Number(e.target.value));
                                    setDirty(true);
                                }}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none'
                                min={0}
                            />
                        </div>
                        <div>
                            <label className='text-xs text-gray-500 block mb-1'>Next Flow</label>
                            <select
                                value={editNextFlowId}
                                onChange={(e) => {
                                    setEditNextFlowId(Number(e.target.value));
                                    setDirty(true);
                                }}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none'
                            >
                                <option value={0}>None</option>
                                {useFlowStore
                                    .getState()
                                    .flows.filter((f) => f.id !== flow.id)
                                    .map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name || `Flow #${f.id}`}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Checkboxes: is_initial & is_active */}
                    <div className='flex gap-4'>
                        <label className='flex items-center gap-2 text-sm text-gray-600 cursor-pointer'>
                            <input
                                type='checkbox'
                                checked={editInitial === 1}
                                onChange={(e) => {
                                    setEditInitial(e.target.checked ? 1 : 0);
                                    setDirty(true);
                                }}
                                className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                            />
                            Initial
                        </label>
                        <label className='flex items-center gap-2 text-sm text-gray-600 cursor-pointer'>
                            <input
                                type='checkbox'
                                checked={editActive === 1}
                                onChange={(e) => {
                                    setEditActive(e.target.checked ? 1 : 0);
                                    setDirty(true);
                                }}
                                className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                            />
                            Active
                        </label>
                    </div>
                </div>
            </div>

            {/* ─── Dialogs Section ────────────────────────────────────────────── */}
            <div className='p-4 flex-1'>
                {/* Header: title + Add Dialog button */}
                <div className='flex items-center justify-between mb-3'>
                    <h2 className='text-sm font-semibold text-gray-700'>Dialogs ({dialogs.length})</h2>
                    <button
                        onClick={() => setShowNewDialog(!showNewDialog)}
                        className='text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 cursor-pointer'
                    >
                        + Add
                    </button>
                </div>

                {/* ─── Add Dialog Form ────────────────────────────────────────────── */}
                {showNewDialog && (
                    <div className='mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2'>
                        <div>
                            <label className='text-xs text-gray-500 block mb-1'>Type</label>
                            <select
                                value={newDialogType}
                                onChange={(e) => setNewDialogType(Number(e.target.value))}
                                className='w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none'
                            >
                                {dialogTypes.map((dt) => (
                                    <option key={dt.id} value={dt.id}>
                                        {dt.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {newDialogType === 6 ? (
                            <div>
                                <label className='text-xs text-gray-500 block mb-1'>Media File</label>
                                <input
                                    type='file'
                                    onChange={(e) => setNewMediaFile(e.target.files?.[0] || null)}
                                    className='w-full text-xs file:mr-2 file:text-xs file:px-2 file:py-1 file:rounded file:border file:border-gray-300 file:bg-white file:cursor-pointer'
                                />
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className='text-xs text-gray-500 block mb-1'>Body</label>
                                    <textarea
                                        value={newDialogBody}
                                        onChange={(e) => setNewDialogBody(e.target.value)}
                                        className='w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none'
                                        rows={3}
                                        placeholder='Message text...'
                                    />
                                </div>
                            </>
                        )}
                        <button
                            onClick={handleAddDialog}
                            className='w-full text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1'
                            disabled={
                                (newDialogType !== 6 && !newDialogBody.trim()) ||
                                (newDialogType === 6 && !newMediaFile) ||
                                addingDialog
                            }
                        >
                            {addingDialog ? (
                                <>
                                    <svg className='animate-spin h-3 w-3' viewBox='0 0 24 24'>
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
                                    Adding...
                                </>
                            ) : (
                                'Add'
                            )}
                        </button>
                    </div>
                )}

                {/* ─── Dialog List ────────────────────────────────────────────────── */}
                <div className='space-y-2'>
                    {dialogs.map((dialog) => (
                        <DialogEditor key={dialog.id} dialog={dialog} setError={setError} />
                    ))}
                    {isEmpty(dialogs) && (
                        <div className='text-xs text-gray-400 text-center py-4'>
                            No dialogs yet. Click &quot;+ Add&quot; to create one.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
