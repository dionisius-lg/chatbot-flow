// ============================================================================
// OptionsEditor — Inline CRUD for dialog options
// ============================================================================
// Displays a list of dialog options with inline add/edit forms.
// Options are used for user-choice branching in the flow canvas.
// ============================================================================

import { useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import type { BotDialogOption } from '../../store/flowStore';

interface Props {
  dialogId: number;
  options: BotDialogOption[];
  setError?: (err: string | null) => void;
}

export default function OptionsEditor({ dialogId, options, setError }: Props) {
  const { createOption, updateOption, deleteOption, flows, saving } = useFlowStore();

  // ─── Local saving state per-action ──────────────────────────────────────
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const isBusy = saving || !!savingAction;

  // ─── Add form state ─────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newNextFlow, setNewNextFlow] = useState(0);

  // Handler: create a new option
  const handleAdd = async () => {
    if (!newTitle.trim() || isBusy) return;
    setSavingAction('add');
    setError?.(null);
    try {
      await createOption({
        bot_dialog_id: dialogId,
        title: newTitle.trim(),
        description: newDesc.trim(),
        next_flow_id: newNextFlow,
        is_active: 1,
      });
      setNewTitle('');
      setNewDesc('');
      setNewNextFlow(0);
      setShowAdd(false);
    } catch (err: any) {
      setError?.(err.message || 'Failed to add option');
    } finally {
      setSavingAction(null);
    }
  };

  // ─── Edit form state ────────────────────────────────────────────────────
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editNextFlow, setEditNextFlow] = useState(0);

  // Start editing an option
  const startEdit = (opt: BotDialogOption) => {
    setEditId(opt.id);
    setEditTitle(opt.title);
    setEditDesc(opt.description);
    setEditNextFlow(opt.next_flow_id);
  };

  // Save option changes
  const handleEditSave = async () => {
    if (editId === null || isBusy) return;
    setSavingAction('edit');
    setError?.(null);
    try {
      await updateOption(editId, {
        title: editTitle,
        description: editDesc,
        next_flow_id: editNextFlow,
      });
      setEditId(null);
    } catch (err: any) {
      setError?.(err.message || 'Failed to save option');
    } finally {
      setSavingAction(null);
    }
  };

  // Delete option
  const handleDeleteOption = async (optionId: number) => {
    if (isBusy) return;
    setSavingAction('delete');
    setError?.(null);
    try {
      await deleteOption(optionId);
    } catch (err: any) {
      setError?.(err.message || 'Failed to delete option');
    } finally {
      setSavingAction(null);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-2 mt-2">
      {/* ─── Header: title + Add button ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] text-gray-500 font-medium uppercase">Options ({options.length})</label>
          <button onClick={() => setShowAdd(!showAdd)} disabled={isBusy} className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600 disabled:opacity-50 cursor-pointer">
            + Add
          </button>
      </div>

      {/* ─── Add Option Form ──────────────────────────────────────────────── */}
      {showAdd && (
        <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200 space-y-1.5">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title (max 24 chars)"
            maxLength={24}
            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (max 72 chars)"
            maxLength={72}
            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <select
            value={newNextFlow}
            onChange={(e) => setNewNextFlow(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value={0}>No next flow</option>
            {flows.map((f) => (
              <option key={f.id} value={f.id}>{f.name || `Flow #${f.id}`}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <button onClick={() => setShowAdd(false)} disabled={isBusy} className="flex-1 text-[10px] border border-gray-300 rounded py-1 hover:bg-gray-50 disabled:opacity-50 cursor-pointer">Cancel</button>
            <button onClick={handleAdd} disabled={!newTitle.trim() || isBusy} className="flex-1 text-[10px] bg-blue-500 text-white rounded py-1 hover:bg-blue-600 disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1">
              {savingAction === 'add' ? <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Adding</> : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Options List ────────────────────────────────────────────────── */}
      <div className="space-y-1">
        {options.map((opt) => (
          <div key={opt.id} className="bg-white rounded border border-gray-200 px-2 py-1.5">
            {editId === opt.id ? (
              // ─── Edit Mode (inline form) ─────────────────────────────────
              <div className="space-y-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={24}
                  className="w-full border border-gray-300 rounded px-2 py-0.5 text-xs outline-none"
                />
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  maxLength={72}
                  className="w-full border border-gray-300 rounded px-2 py-0.5 text-xs outline-none"
                />
                <select
                  value={editNextFlow}
                  onChange={(e) => setEditNextFlow(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-0.5 text-xs outline-none"
                >
                  <option value={0}>None</option>
                  {flows.map((f) => (
                    <option key={f.id} value={f.id}>{f.name || `Flow #${f.id}`}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button onClick={() => setEditId(null)} className="flex-1 text-[10px] border border-gray-300 rounded py-1 hover:bg-gray-50 cursor-pointer disabled:opacity-50" disabled={isBusy}>Cancel</button>
                  <button onClick={handleEditSave} disabled={isBusy} className="flex-1 text-[10px] bg-indigo-600 text-white rounded py-1 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1">
                    {savingAction === 'edit' ? <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving</> : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              // ─── Display Mode ────────────────────────────────────────────
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{opt.title}</div>
                  {opt.description && <div className="text-[10px] text-gray-400 truncate">{opt.description}</div>}
                  {opt.next_flow_id > 0 && (
                    <div className="text-[10px] text-blue-500">{'\u2192'} Flow #{opt.next_flow_id}</div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 ml-1">
                  <button onClick={() => startEdit(opt)} disabled={isBusy} className="text-[10px] text-gray-500 hover:text-indigo-600 px-1 cursor-pointer disabled:opacity-50">{'\u270E'}</button>
                  <button onClick={() => handleDeleteOption(opt.id)} disabled={isBusy} className="text-[10px] text-gray-500 hover:text-red-600 px-1 cursor-pointer disabled:opacity-50">X</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}