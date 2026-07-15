// ============================================================================
// BotFlowNode — Custom React Flow Node
// ============================================================================
// Renders one flow as a visual node on the canvas:
// - Header: Flow ID, name, START badge (if is_initial)
// - Flow type badge (color-coded by type)
// - Dialog previews (max 4 items)
// - Options section with individual source handles for branching
// - Target handle (left) and default source handle (right)
// ============================================================================

import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';

import type { FlowNodeData, BotDialog, BotDialogOption } from '../../types';

function getDialogPreviewText(dialog: BotDialog): string {
    if (dialog.body) {
        return dialog.body.length > 40 ? `${dialog.body.substring(0, 40)}...` : dialog.body;
    }
    if (dialog.media) {
        try {
            const mediaObj = (typeof dialog.media === 'string' ? JSON.parse(dialog.media) : dialog.media) as Record<
                string,
                any
            > | null;
            const link = (mediaObj?.link || mediaObj?.url || '') as string;
            if (link) {
                return link.length > 40 ? `${link.substring(0, 40)}...` : link;
            }
        } catch {
            return '(empty)';
        }
    }
    return '(empty)';
}

interface BotFlowNodeProps {
    data: FlowNodeData;
    selected?: boolean;
}

function BotFlowNode({ data, selected }: BotFlowNodeProps) {
    const { flow, flowTypeName, flowTypeColor, dialogs, options } = data;
    const isInitial = flow.is_initial === 1;
    const isActive = flow.is_active === 1;

    // Icon mapping for each dialog type (based on bot_dialog_type_id)
    const dialogIcons: Record<number, string> = {
        1: '\u{1F4AC}', // Text
        2: '\u{1F4CB}', // Reply List
        3: '\u{1F518}', // Reply Button
        4: '\u{1F4DD}', // Text Menu
        5: '\u{270F}\uFE0F', // Text Ask Data
        6: '\u{1F5BC}\uFE0F', // Media
        7: '\u{1F464}', // Text Pre Ask Data
    };

    return (
        <div
            className={`bot-flow-node bg-white rounded-xl shadow-md border-2 transition-shadow ${selected ? 'border-indigo-500 shadow-lg' : 'border-gray-200'} ${!isActive ? 'opacity-60' : ''}`}
            style={{ width: 240 }}
        >
            {/* ─── Target Handle (input connection from other nodes) ───────────── */}
            <Handle type='target' position={Position.Left} className='!w-3 !h-3 !bg-gray-400 !border-2 !border-white' />

            {/* ─── Header: Flow ID + Name ──────────────────────────────────────── */}
            <div className='px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2 min-w-0'>
                    <span className='text-xs font-mono text-gray-400'>#{flow.id}</span>
                    <span className='text-sm font-semibold truncate'>{flow.name || `Node #${flow.id}`}</span>
                </div>
                <div className='flex items-center gap-1 shrink-0'>
                    {isInitial && (
                        <span className='text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium'>
                            START
                        </span>
                    )}
                </div>
            </div>

            {/* ─── Flow Type Badge ──────────────────────────────────────────────── */}
            <div className='px-3 py-2 flex items-center gap-2'>
                <span
                    className='text-xs px-2 py-0.5 rounded-full font-medium text-white'
                    style={{ background: flowTypeColor }}
                >
                    {flowTypeName}
                </span>
                {flow.timeout_duration > 0 && (
                    <span className='text-xs text-gray-500'>
                        {'\u23F1'} {flow.timeout_duration}s
                    </span>
                )}
            </div>

            {/* ─── Dialog Previews (max 4) ─────────────────────────────────────── */}
            {dialogs.length > 0 && (
                <div className='px-3 pb-2 space-y-1'>
                    {dialogs.slice(0, 4).map((dialog: BotDialog) => (
                        <div
                            key={dialog.id}
                            className='flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1'
                        >
                            <span>{dialogIcons[dialog.bot_dialog_type_id] || '\u{1F4AC}'}</span>
                            <span className='truncate flex-1'>{getDialogPreviewText(dialog)}</span>
                        </div>
                    ))}
                    {dialogs.length > 4 && (
                        <div className='text-xs text-gray-400 text-center'>+{dialogs.length - 4} more</div>
                    )}
                </div>
            )}

            {/* ─── Options Section (for dialogs with branching) ────────────────── */}
            {options.length > 0 && (
                <div className='px-3 pb-2 border-t border-gray-100 pt-1.5'>
                    <div className='text-[10px] text-gray-400 uppercase font-medium mb-1'>Options</div>
                    {options.map((opt: BotDialogOption) => (
                        <div key={opt.id} className='relative'>
                            {/* Source handle for each option (blue branching) */}
                            <Handle
                                type='source'
                                position={Position.Right}
                                id={`option-${opt.id}`}
                                className='!w-3 !h-3 !bg-blue-500 !border-2 !border-white'
                                style={{ top: 'auto', right: -8 }}
                            />
                            <div className='text-xs text-blue-600 truncate pl-1'>{opt.title}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Default Source Handle (next_flow_id) ─────────────────────────── */}
            <Handle
                type='source'
                position={Position.Right}
                id='default-output'
                className='!w-3 !h-3 !bg-gray-400 !border-2 !border-white'
                style={{ top: 12, right: -8 }}
            />
        </div>
    );
}

export default memo(BotFlowNode);
