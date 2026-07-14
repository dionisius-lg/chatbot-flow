// ============================================================================
// FlowCanvas — React Flow Canvas
// ============================================================================
// Renders flow nodes and edges in a React Flow canvas.
// Features:
// - Drag, zoom, minimap, dot-grid background
// - Custom node type: botFlowNode
// - Click node → selects it for the inspector panel
// - Drag to connect nodes → auto-persists via API
// - "Add Flow" floating button with inline popup form
// - Loading overlay with spinner while workspace is loading
// ============================================================================

import {
    ReactFlow,
    Controls,
    MiniMap,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Node,
    type Edge,
    type NodeTypes,
} from '@xyflow/react';
import { useCallback, useRef, useEffect, useState } from 'react';

import '@xyflow/react/dist/style.css';
import BotFlowNode from './BotFlowNode';
import { useFlowStore } from '../../store/flowStore';

// Register custom node type for React Flow
const nodeTypes = { botFlowNode: BotFlowNode } as NodeTypes;

export default function FlowCanvas() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // ─── Store selectors ─────────────────────────────────────────────────────
    const storeNodes = useFlowStore((s) => s.nodes);
    const storeEdges = useFlowStore((s) => s.edges);
    const selectNode = useFlowStore((s) => s.selectNode);
    const onConnect = useFlowStore((s) => s.onConnect);
    const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
    const flowTypes = useFlowStore((s) => s.flowTypes);
    const loading = useFlowStore((s) => s.loading);

    // ─── React Flow local state ─────────────────────────────────────────────
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // ─── Local UI state (Add Flow popup) ────────────────────────────────────
    const [showNewFlow, setShowNewFlow] = useState(false);
    const [newFlowName, setNewFlowName] = useState('');
    const [newFlowType, setNewFlowType] = useState(1);
    const [creatingFlow, setCreatingFlow] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync nodes & edges from Zustand store to React Flow state
    useEffect(() => {
        setNodes(storeNodes);
        setEdges(storeEdges);
    }, [storeNodes, storeEdges, setNodes, setEdges]);

    // Reset error when popup status changes
    useEffect(() => {
        setError(null);
    }, [showNewFlow]);

    // ─── Event Handlers ─────────────────────────────────────────────────────

    // Handle connect: create a new edge and persist via API
    const onConnectHandler = useCallback(
        (params: Connection) => {
            const newEdge = addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, edges);
            setEdges(newEdge);
            onConnect(params);
        },
        [edges, onConnect, setEdges],
    );

    // Handle node click: select node for inspector panel
    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            selectNode(node.id);
        },
        [selectNode],
    );

    // Handle canvas click: deselect current node
    const onPaneClick = useCallback(() => {
        selectNode(null);
    }, [selectNode]);

    // Handle create new flow action
    const handleCreateFlow = useCallback(async () => {
        if (!activeTemplateId || !newFlowName.trim() || creatingFlow) {
            return;
        }
        setCreatingFlow(true);
        setError(null);
        try {
            const store = useFlowStore.getState();
            await store.createFlow({
                bot_template_id: activeTemplateId,
                name: newFlowName.trim(),
                bot_flow_type_id: newFlowType,
                is_initial: 0,
                next_flow_id: 0,
                timeout_duration: 0,
                is_active: 1,
            });
            setNewFlowName('');
            setShowNewFlow(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create flow');
        } finally {
            setCreatingFlow(false);
        }
    }, [activeTemplateId, newFlowName, newFlowType, creatingFlow]);

    return (
        <div className='flex-1 relative' ref={reactFlowWrapper}>
            {/* ─── React Flow Canvas ──────────────────────────────────────────── */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnectHandler}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition='bottom-left'
            >
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        if (node.type === 'botFlowNode') {
                            const data = node.data as any;
                            return data?.flowTypeColor || '#6366f1';
                        }
                        return '#6366f1';
                    }}
                    maskColor='rgba(0,0,0,0.1)'
                />
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            </ReactFlow>

            {/* ─── Loading Overlay ─────────────────────────────────────────────── */}
            {/* Shown when workspace data is being fetched — hides stale nodes */}
            {loading && (
                <div className='absolute inset-0 z-20 bg-white/70 flex items-center justify-center'>
                    <div className='flex flex-col items-center gap-3'>
                        <svg className='animate-spin h-10 w-10 text-indigo-500' viewBox='0 0 24 24'>
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
                        <span className='text-sm text-gray-500 font-medium'>Loading flows...</span>
                    </div>
                </div>
            )}

            {/* ─── Add Flow Button (floating, top-right) ────────────────────────── */}
            <div className='absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex gap-2'>
                <button
                    onClick={() => setShowNewFlow(!showNewFlow)}
                    className='bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md text-xs sm:text-sm font-medium transition-colors cursor-pointer'
                >
                    + Add Flow
                </button>
            </div>

            {/* ─── Add Flow Popup (responsive) ────────────────────────────────────── */}
            {showNewFlow && (
                <div className='absolute top-12 sm:top-16 right-2 sm:right-4 z-20 bg-white rounded-xl shadow-xl border border-gray-200 p-3 sm:p-4 w-64 sm:w-72'>
                    <h3 className='text-sm font-semibold text-gray-700 mb-3'>New Flow</h3>
                    {error && (
                        <div className='bg-red-50 border border-red-200 text-red-700 p-2 rounded-lg text-xs flex items-center justify-between mb-3'>
                            <span className='break-all'>{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className='text-red-500 hover:text-red-700 font-bold cursor-pointer ml-1'
                            >
                                x
                            </button>
                        </div>
                    )}
                    <div className='space-y-3'>
                        <div>
                            <label className='text-xs text-gray-500 block mb-1'>Name</label>
                            <input
                                type='text'
                                value={newFlowName}
                                onChange={(e) => setNewFlowName(e.target.value)}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
                                placeholder='Flow name'
                            />
                        </div>
                        <div>
                            <label className='text-xs text-gray-500 block mb-1'>Type</label>
                            <select
                                value={newFlowType}
                                onChange={(e) => setNewFlowType(Number(e.target.value))}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none'
                            >
                                {flowTypes.map((ft) => (
                                    <option key={ft.id} value={ft.id}>
                                        {ft.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setShowNewFlow(false)}
                                className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFlow}
                                className='flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1'
                                disabled={!newFlowName.trim() || creatingFlow}
                            >
                                {creatingFlow ? (
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
                                        Creating...
                                    </>
                                ) : (
                                    'Create'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
