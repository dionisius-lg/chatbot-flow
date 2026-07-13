import { useState, useEffect, useRef } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { DIALOG_TYPES } from '../../config/constants';
import OptionsEditor from './OptionsEditor';
import type { BotDialog } from '../../store/flowStore';

interface Props {
  dialog: BotDialog;
  setError?: (err: string | null) => void;
}

export default function DialogEditor({ dialog, setError }: Props) {
  const { updateDialog, updateMediaDialog, deleteDialog, dialogTypes, flows, saving, activeTemplate, deleteDialogHeader, uploadDialogHeaderFile, setDialogHeaderText } = useFlowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [editTypeId, setEditTypeId] = useState(dialog.bot_dialog_type_id);
  const [editBody, setEditBody] = useState(dialog.body || '');
  const [editSequence, setEditSequence] = useState(dialog.sequence);
  const [editShortcode, setEditShortcode] = useState(dialog.shortcode || '');
  const [editNextFlowId, setEditNextFlowId] = useState(dialog.next_flow_id || 0);
  const [editFooter, setEditFooter] = useState(dialog.footer || '');
  const [editMedia, setEditMedia] = useState(() => typeof dialog.media === 'string' ? dialog.media || '' : '');
  const [editOptionTitle, setEditOptionTitle] = useState(dialog.option_title || '');
  const [editMediaFile, setEditMediaFile] = useState<File | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showHeaderTextInput, setShowHeaderTextInput] = useState(false);
  const [newHeaderText, setNewHeaderText] = useState('');
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const isWhatsApp = activeTemplate?.media_id === '4';
  const dt = DIALOG_TYPES[editTypeId];

  let headerDisplay = '';
  let headerFormat: 'none' | 'text' | 'image' = 'none';
  const rawHeader = dialog.header;
  if (rawHeader) {
    let parsed: any = rawHeader;
    if (typeof rawHeader === 'string') {
      try { parsed = JSON.parse(rawHeader); } catch { parsed = rawHeader; }
    }
    if (parsed && typeof parsed === 'object') {
      headerFormat = parsed.format === 'image' ? 'image' : 'text';
      const raw = parsed.format === 'text' ? parsed.text : (parsed.link || parsed.url || parsed.file || '');
      headerDisplay = raw && typeof raw === 'object' ? (raw.text || raw.link || raw.url || '') : (raw || '');
    } else if (typeof parsed === 'string') {
      headerDisplay = parsed;
      headerFormat = 'text';
    }
  }

  let mediaDisplay = '';
  let mediaFormat: 'none' | 'image' | 'video' | 'document' | string = 'none';
  const rawMedia = dialog.media;
  if (rawMedia) {
    let parsed: any = rawMedia;
    if (typeof rawMedia === 'string') {
      try { parsed = JSON.parse(rawMedia); } catch { parsed = rawMedia; }
    }
    if (parsed && typeof parsed === 'object') {
      mediaFormat = parsed.format || 'file';
      const raw = parsed.link || parsed.url || parsed.file || '';
      mediaDisplay = raw && typeof raw === 'object' ? (raw.link || raw.url || raw.file || '') : (raw || '');
    } else if (typeof parsed === 'string') {
      mediaDisplay = parsed;
      mediaFormat = 'file';
    }
  }

  useEffect(() => {
    setEditTypeId(dialog.bot_dialog_type_id);
    setEditBody(dialog.body || '');
    setEditSequence(dialog.sequence);
    setEditShortcode(dialog.shortcode || '');
    setEditNextFlowId(dialog.next_flow_id || 0);
    setEditFooter(dialog.footer || '');
    setEditMedia(typeof dialog.media === 'string' ? dialog.media || '' : '');
    setEditOptionTitle(dialog.option_title || '');
    setShowHeaderTextInput(false);
    setNewHeaderText('');
    setDirty(false);
  }, [dialog]);

  const handleSave = async () => {
    if (savingAction) return;
    setSavingAction('save');
    setError?.(null);
    try {
      if (editTypeId === 6) {
        await updateMediaDialog(dialog.id, {
          bot_dialog_type_id: editTypeId,
          sequence: editSequence,
          next_flow_id: editNextFlowId,
          is_active: dialog.is_active,
        }, editMediaFile || undefined);
      } else {
        await updateDialog(dialog.id, {
          bot_dialog_type_id: editTypeId,
          body: editBody,
          sequence: editSequence,
          shortcode: editShortcode,
          next_flow_id: editNextFlowId,
          footer: editFooter || null,
          media: editMedia || null,
          option_title: editOptionTitle || null,
        });
      }
      setDirty(false);
      setEditMediaFile(null);
    } catch (err: any) {
      setError?.(err.message || 'Failed to save dialog');
    } finally {
      setSavingAction(null);
    }
  };

  const handleDelete = async () => {
    if (savingAction) return;
    if (!window.confirm('Delete this dialog?')) return;
    setSavingAction('delete');
    setError?.(null);
    try {
      await deleteDialog(dialog.id);
    } catch (err: any) {
      setError?.(err.message || 'Failed to delete dialog');
    } finally {
      setSavingAction(null);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || savingAction) return;
    setSavingAction('header');
    setError?.(null);
    try {
      await uploadDialogHeaderFile(dialog.id, file);
    } catch (err: any) {
      setError?.(err.message || 'Failed to upload header file');
    } finally {
      setSavingAction(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetHeaderText = async () => {
    if (!newHeaderText.trim() || savingAction) return;
    setSavingAction('header');
    setError?.(null);
    try {
      await setDialogHeaderText(dialog.id, newHeaderText.trim());
      setShowHeaderTextInput(false);
      setNewHeaderText('');
    } catch (err: any) {
      setError?.(err.message || 'Failed to set header text');
    } finally {
      setSavingAction(null);
    }
  };

  const handleDeleteHeader = async () => {
    if (savingAction) return;
    if (!window.confirm('Delete header?')) return;
    setSavingAction('header');
    setError?.(null);
    try {
      await deleteDialogHeader(dialog.id);
    } catch (err: any) {
      setError?.(err.message || 'Failed to delete header');
    } finally {
      setSavingAction(null);
    }
  };

  const hasOptions = [2, 3, 4].includes(editTypeId);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-gray-400">#{dialog.id}</span>
          <span className="text-xs truncate font-medium">
            {dialogTypes.find(dt => dt.id === editTypeId)?.name || `Type ${editTypeId}`}
          </span>
          <span className="text-[10px] text-gray-400">seq:{editSequence}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {dirty && (
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              disabled={saving || !!savingAction}
              className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
            >
              {savingAction === 'save' ? (
                <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving</>
              ) : 'Save'}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={saving || !!savingAction}
            className="text-[10px] text-red-500 hover:bg-red-50 px-1 py-1 rounded cursor-pointer disabled:opacity-50"
          >
            X
          </button>
          <span className="text-xs text-gray-400">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Type</label>
              <select
                value={editTypeId}
                onChange={(e) => { setEditTypeId(Number(e.target.value)); setDirty(true); }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {dialogTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>{dt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Sequence</label>
              <input
                type="number"
                value={editSequence}
                onChange={(e) => { setEditSequence(Number(e.target.value)); setDirty(true); }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                min={1}
              />
            </div>
          </div>

          {editTypeId !== 6 && (
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Body</label>
              <textarea
                value={editBody}
                onChange={(e) => { setEditBody(e.target.value); setDirty(true); }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                rows={3}
                placeholder="Message body (use {fullname}, {timeout}, etc.)"
              />
            </div>
          )}

          {editTypeId === 2 || editTypeId === 3 ? (
            <>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Option Title</label>
                <input
                  type="text"
                  value={editOptionTitle}
                  onChange={(e) => { setEditOptionTitle(e.target.value); setDirty(true); }}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Select Menu"
                />
              </div>

              {isWhatsApp ? (
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Header</label>
                  {headerFormat === 'none' ? (
                    <div className="text-[10px] text-gray-400 mb-1 italic">No header set</div>
                  ) : (
                    <div className="flex items-center gap-1 mb-1">
                      {/* asdasd */}
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                        {headerFormat === 'image' ? 'Image' : 'Text'}
                      </span>
                      <span className="text-[10px] text-gray-600 truncate flex-1">{headerDisplay}</span>
                      <button
                        onClick={handleDeleteHeader}
                        disabled={!!savingAction}
                        className="text-[10px] text-red-500 hover:text-red-700 cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {savingAction === 'header' ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}

                  {editTypeId === 3 && (
                    <div className="flex items-center gap-1 mb-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleUploadFile}
                        disabled={!!savingAction}
                        className="text-[10px] w-28 file:mr-1 file:text-[10px] file:px-1.5 file:py-0.5 file:rounded file:border file:border-gray-300 file:bg-white file:cursor-pointer disabled:opacity-50"
                      />
                      <button
                        onClick={() => { setShowHeaderTextInput(true); setNewHeaderText(''); }}
                        disabled={!!savingAction}
                        className="text-[10px] text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-50"
                      >
                        + Text
                      </button>
                    </div>
                  )}

                  {editTypeId === 2 && (
                    <button
                      onClick={() => { setShowHeaderTextInput(true); setNewHeaderText(''); }}
                      className="text-[10px] text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      + Set Header Text
                    </button>
                  )}

                  {showHeaderTextInput && (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={newHeaderText}
                        onChange={(e) => setNewHeaderText(e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Enter header text..."
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSetHeaderText(); }}
                      />
                      <button
                        onClick={handleSetHeaderText}
                        disabled={!newHeaderText.trim() || saving || !!savingAction}
                        className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                      >
                        {savingAction === 'header' ? <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Set</> : 'Set'}
                      </button>
                      <button
                        onClick={() => setShowHeaderTextInput(false)}
                        disabled={!!savingAction}
                        className="text-[10px] text-gray-500 hover:text-gray-700 px-1 py-1 cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Footer</label>
                <input
                  type="text"
                  value={editFooter}
                  onChange={(e) => { setEditFooter(e.target.value); setDirty(true); }}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  maxLength={50}
                  placeholder="Footer text (max 50 chars)"
                />
              </div>
            </>
          ) : null}

          {editTypeId === 5 && (
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Shortcode</label>
              <input
                type="text"
                value={editShortcode}
                onChange={(e) => { setEditShortcode(e.target.value); setDirty(true); }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="e.g. name, gender, age"
              />
            </div>
          )}

          {editTypeId === 6 && (
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Media File</label>
              <input
                type="file"
                onChange={(e) => { setEditMediaFile(e.target.files?.[0] || null); setDirty(true); }}
                className="text-[10px] w-full file:mr-2 file:text-xs file:px-2 file:py-1 file:rounded file:border file:border-gray-300 file:bg-white file:cursor-pointer"
              />
              {mediaFormat !== 'none' && !editMediaFile && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded capitalize">
                    {mediaFormat}
                  </span>
                  <span className="text-[10px] text-gray-600 truncate flex-1">{mediaDisplay}</span>
                </div>
              )}
              {editMediaFile && (
                <div className="text-[10px] text-indigo-600 mt-1">File selected: {editMediaFile.name}</div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Next Flow (override)</label>
            <select
              value={editNextFlowId}
              onChange={(e) => { setEditNextFlowId(Number(e.target.value)); setDirty(true); }}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value={0}>None (use flow default)</option>
              {flows.filter(f => f.id !== dialog.bot_flow_id).map((f) => (
                <option key={f.id} value={f.id}>{f.name || `Flow #${f.id}`}</option>
              ))}
            </select>
          </div>

          {hasOptions && (
            <OptionsEditor dialogId={dialog.id} options={dialog.options || []} setError={setError} />
          )}
        </div>
      )}
    </div>
  );
}
