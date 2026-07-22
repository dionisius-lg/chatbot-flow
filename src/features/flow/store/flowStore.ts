/**
 * flowStore — Zustand State Management
 *
 * This file is the "brain" for all flow data and bot templates.
 * We use Zustand (instead of Redux) because it requires much less boilerplate
 * and doesn't need a Provider wrapper in React.
 * State here is global and can be accessed from any component using:
 * const { templates, loadTemplates } = useFlowStore();
 */

import { create } from 'zustand';

import { flowService } from '../services/flowService';

import type {
    BotFlowType,
    BotDialogType,
    BotDialogOption,
    BotDialog,
    BotFlow,
    FlowNodeData,
    FlowStoreState,
} from '../../../types';

// ─── Helper: Build React Flow nodes & edges from hierarchical data ───────────

function buildNodesAndEdges(flows: BotFlow[]): { nodes: any[]; edges: any[] } {
    // Hardcoded flow type mapping (fallback if flow type API not available)
    const typeMap: Record<number, { label: string; color: string }> = {
        1: { label: 'Normal', color: '#16a34a' },
        2: { label: 'Direct Agent', color: '#2563eb' },
        3: { label: 'Close Ticket', color: '#dc2626' },
        4: { label: 'Invalid', color: '#d97706' },
        5: { label: 'Timeout', color: '#6b7280' },
    };

    // Create a node for each flow, arranged in a 4-column grid
    const nodes = flows.map((flow, index) => {
        const ft = typeMap[flow.bot_flow_type_id] || { label: 'Unknown', color: '#94a3b8' };
        const dialogs = flow.bot_dialogs || [];
        const allOptions: BotDialogOption[] = [];
        dialogs.forEach((d) => {
            if (d.options) {
                allOptions.push(...d.options);
            }
        });

        const col = index % 4;
        const row = Math.floor(index / 4);

        const nodeData: FlowNodeData = {
            flow,
            flowTypeName: ft.label,
            flowTypeColor: ft.color,
            dialogCount: dialogs.length,
            dialogs,
            options: allOptions,
        };

        return {
            id: `flow-${flow.id}`,
            type: 'botFlowNode',
            position: { x: 220 * col + 40, y: 280 * row + 40 },
            data: nodeData,
        };
    });

    // Create edges for flow-to-flow connections
    const edges: any[] = [];

    flows.forEach((flow) => {
        // Default next_flow edge (animated gray)
        if (flow.next_flow_id > 0) {
            const targetExists = flows.some((f) => f.id === flow.next_flow_id);
            if (targetExists) {
                edges.push({
                    id: `edge-${flow.id}-default`,
                    source: `flow-${flow.id}`,
                    sourceHandle: 'default-output',
                    target: `flow-${flow.next_flow_id}`,
                    animated: true,
                    style: { stroke: '#94a3b8', strokeWidth: 2 },
                });
            }
        }

        const dialogs = flow.bot_dialogs || [];
        dialogs.forEach((dialog) => {
            // Dialog-level next_flow override (dashed purple)
            if (dialog.next_flow_id > 0) {
                const targetExists = flows.some((f) => f.id === dialog.next_flow_id);
                if (targetExists) {
                    edges.push({
                        id: `edge-dialog-${dialog.id}`,
                        source: `flow-${flow.id}`,
                        sourceHandle: `dialog-${dialog.id}`,
                        target: `flow-${dialog.next_flow_id}`,
                        style: { stroke: '#a78bfa', strokeWidth: 1.5, strokeDasharray: '5,5' },
                    });
                }
            }
            // Option-level branching (blue, labeled)
            if (dialog.options) {
                dialog.options.forEach((opt) => {
                    if (opt.next_flow_id > 0) {
                        const targetExists = flows.some((f) => f.id === opt.next_flow_id);
                        if (targetExists) {
                            edges.push({
                                id: `edge-opt-${opt.id}`,
                                source: `flow-${flow.id}`,
                                sourceHandle: `option-${opt.id}`,
                                target: `flow-${opt.next_flow_id}`,
                                style: { stroke: '#3b82f6', strokeWidth: 2 },
                                label: opt.title,
                            });
                        }
                    }
                });
            }
        });
    });

    return { nodes, edges };
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useFlowStore = create<FlowStoreState>((set, get) => ({
    // ─── Initial State ──────────────────────────────────────────────────────
    templates: [],
    pagination: {
        total: 0,
        per_page: 5,
        current_page: 1,
        last_page: 1,
        paging: { current: 1, next: 1, previous: 1, first: 1, last: 1 },
    },
    flowTypes: [],
    dialogTypes: [],
    activeTemplate: null,
    flows: [],
    nodes: [],
    edges: [],
    selectedNodeId: null,
    activeTemplateId: null,
    loading: false,
    saving: false,

    // ─── Template CRUD ─────────────────────────────────────────────────────

    // Fetch templates from API with pagination (limit=5)
    loadTemplates: async (page = 1) => {
        const perPage = 5;
        set({ loading: true });
        try {
            const res = await flowService.getTemplates(page, perPage);
            const data = res.data || [];
            const paging = res.paging ? { ...res.paging, previous: res.paging.previuos } : {};
            const totalData = res.total_data || 0;
            const lastPage = paging?.last || Math.ceil(totalData / perPage) || 1;
            const pagination = {
                total: totalData,
                per_page: perPage,
                current_page: paging?.current || page,
                last_page: lastPage,
                paging: paging || { current: page, next: page, previous: page, first: 1, last: lastPage },
            };
            set({ templates: Array.isArray(data) ? data : [], pagination });
        } catch (err) {
            console.error('Failed to load templates:', err);
        } finally {
            set({ loading: false });
        }
    },

    // Create new template — throws error if API returns success: false
    createTemplate: async (data) => {
        const res = await flowService.createTemplate(data);
        if (res && res.success === false) {
            throw new Error(res.message || 'Failed to create template');
        }
        // Reload first page to see the new template
        await get().loadTemplates(1);
        return res;
    },

    // Update existing template — throws error if API returns success: false
    updateTemplate: async (id, data) => {
        const res = await flowService.updateTemplate(id, data);
        if (res && res.success === false) {
            throw new Error(res.message || 'Failed to update template');
        }
        // Reload current page
        const currentPage = get().pagination.current_page;
        await get().loadTemplates(currentPage);
        return res;
    },

    // Soft-delete template (set is_active = 0)
    deleteTemplate: async (id) => {
        const res = await flowService.updateTemplate(id, { is_active: 0 });
        if (res && res.success === false) {
            throw new Error(res.message || 'Failed to delete template');
        }
        const currentPage = get().pagination.current_page;
        await get().loadTemplates(currentPage);
    },

    // ─── Workspace Loading ──────────────────────────────────────────────────

    // Load full workspace data for a template: flows + dialogs + options + types
    loadWorkspace: async (templateId) => {
        set({ loading: true, activeTemplateId: templateId });
        try {
            // Set active template from already-loaded templates array, or fetch it
            const currentTemplates = get().templates;
            const found = currentTemplates.find((t) => t.id === templateId);
            if (found) {
                set({ activeTemplate: found });
            } else {
                const tplRes = await flowService.getTemplate(templateId);
                const tpl = tplRes.data || tplRes;
                if (tpl && tpl.id) {
                    set({ activeTemplate: tpl });
                }
            }
            // Parallel: fetch flows, flow types, and dialog types
            const [flowsRes, flowTypesRes, dialogTypesRes] = await Promise.all([
                flowService.getFlows(templateId),
                flowService.getFlowTypes(),
                flowService.getDialogTypes(),
            ]);

            const flows: BotFlow[] = flowsRes.data?.data || flowsRes.data || [];

            // For each flow, fetch its dialogs and options (nested)
            const flowsWithDialogs = await Promise.all(
                flows.map(async (flow: BotFlow) => {
                    try {
                        const dialogsRes = await flowService.getDialogs(flow.id);
                        const dialogs: BotDialog[] = dialogsRes.data?.data || dialogsRes.data || [];

                        // For each dialog with options (type 2, 3, 4), fetch options
                        const dialogsWithOptions = await Promise.all(
                            dialogs.map(async (dialog: BotDialog) => {
                                if ([2, 3, 4].includes(dialog.bot_dialog_type_id)) {
                                    try {
                                        const optsRes = await flowService.getOptions(dialog.id);
                                        dialog.options = optsRes.data?.data || optsRes.data || [];
                                    } catch {
                                        dialog.options = [];
                                    }
                                } else {
                                    dialog.options = [];
                                }
                                return dialog;
                            }),
                        );
                        return { ...flow, bot_dialogs: dialogsWithOptions };
                    } catch {
                        return { ...flow, bot_dialogs: [] };
                    }
                }),
            );

            const flowTypesData: BotFlowType[] = flowTypesRes.data?.data || flowTypesRes.data || [];
            const dialogTypesData: BotDialogType[] = dialogTypesRes.data?.data || dialogTypesRes.data || [];

            // Build React Flow nodes and edges from the data
            const { nodes, edges } = buildNodesAndEdges(flowsWithDialogs);

            set({
                flows: flowsWithDialogs,
                flowTypes: flowTypesData,
                dialogTypes: dialogTypesData,
                nodes,
                edges,
                loading: false,
            });
        } catch (err) {
            console.error('Failed to load workspace:', err);
            set({ loading: false });
        }
    },

    // ─── Node Selection ─────────────────────────────────────────────────────
    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

    // ─── Flow CRUD ──────────────────────────────────────────────────────────

    updateFlow: async (flowId, data) => {
        set({ saving: true });
        try {
            const res = await flowService.updateFlow(flowId, data);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to update flow');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    createFlow: async (data) => {
        set({ saving: true });
        try {
            const res = await flowService.createFlow(data);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to create flow');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    deleteFlow: async (flowId) => {
        set({ saving: true });
        try {
            const res = await flowService.updateFlow(flowId, { is_active: 0 });
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to delete flow');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    // ─── Dialog CRUD ────────────────────────────────────────────────────────

    createDialog: async (data) => {
        set({ saving: true });
        try {
            const res = await flowService.createDialog(data);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to create dialog');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    updateDialog: async (dialogId, data) => {
        set({ saving: true });
        try {
            const res = await flowService.updateDialog(dialogId, data);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to update dialog');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    deleteDialog: async (dialogId) => {
        set({ saving: true });
        try {
            const res = await flowService.updateDialog(dialogId, { is_active: 0 });
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to delete dialog');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    deleteDialogHeader: async (dialogId) => {
        set({ saving: true });
        try {
            const res = await flowService.deleteDialogHeader(dialogId);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to delete dialog header');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    uploadDialogHeaderFile: async (dialogId, file) => {
        set({ saving: true });
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await flowService.uploadDialogHeaderFile(dialogId, formData);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to upload dialog header file');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    setDialogHeaderText: async (dialogId, text) => {
        set({ saving: true });
        try {
            const res = await flowService.setDialogHeaderText(dialogId, text);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to set dialog header text');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    createMediaDialog: async (data, file) => {
        set({ saving: true });
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (data.bot_flow_id !== undefined) {
                formData.append('bot_flow_id', String(data.bot_flow_id));
            }
            if (data.bot_dialog_type_id !== undefined) {
                formData.append('bot_dialog_type_id', String(data.bot_dialog_type_id));
            }
            if (data.sequence !== undefined) {
                formData.append('sequence', String(data.sequence));
            }
            if (data.next_flow_id !== undefined) {
                formData.append('next_flow_id', String(data.next_flow_id));
            }
            const res = await flowService.createMediaDialog(formData);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to create media dialog');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    updateMediaDialog: async (dialogId, data, file) => {
        set({ saving: true });
        try {
            const formData = new FormData();
            if (file) {
                formData.append('file', file);
            }
            if (data.bot_flow_id !== undefined) {
                formData.append('bot_flow_id', String(data.bot_flow_id));
            }
            if (data.bot_dialog_type_id !== undefined) {
                formData.append('bot_dialog_type_id', String(data.bot_dialog_type_id));
            }
            if (data.sequence !== undefined) {
                formData.append('sequence', String(data.sequence));
            }
            if (data.next_flow_id !== undefined) {
                formData.append('next_flow_id', String(data.next_flow_id));
            }
            if (data.is_active !== undefined) {
                formData.append('is_active', String(data.is_active));
            }
            const res = await flowService.updateMediaDialog(dialogId, formData);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to update media dialog');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    // ─── Option CRUD ────────────────────────────────────────────────────────

    createOption: async (data) => {
        set({ saving: true });
        try {
            const res = await flowService.createOption(data);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to create option');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    updateOption: async (optionId, data) => {
        set({ saving: true });
        try {
            const res = await flowService.updateOption(optionId, data);
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to update option');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    deleteOption: async (optionId) => {
        set({ saving: true });
        try {
            const res = await flowService.updateOption(optionId, { is_active: 0 });
            if (res && res.success === false) {
                throw new Error(res.message || 'Failed to delete option');
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },

    // ─── Connect Handler (drag-to-connect in canvas) ────────────────────────

    onConnect: async (connection) => {
        const { source, sourceHandle, target } = connection;
        const targetFlowId = parseInt(target.replace('flow-', ''));
        const sourceFlowId = parseInt(source.replace('flow-', ''));

        set({ saving: true });
        try {
            // Determine what type of handle was connected
            if (sourceHandle === 'default-output') {
                // Flow-level next_flow connection
                await flowService.updateFlow(sourceFlowId, { next_flow_id: targetFlowId });
            } else if (sourceHandle?.startsWith('option-')) {
                // Option-level branching connection
                const optionId = parseInt(sourceHandle.replace('option-', ''));
                await flowService.updateOption(optionId, { next_flow_id: targetFlowId });
            } else if (sourceHandle?.startsWith('dialog-')) {
                // Dialog-level next_flow override
                const dialogId = parseInt(sourceHandle.replace('dialog-', ''));
                await flowService.updateDialog(dialogId, { next_flow_id: targetFlowId });
            }
            const { activeTemplateId } = get();
            if (activeTemplateId) {
                await get().loadWorkspace(activeTemplateId);
            }
        } finally {
            set({ saving: false });
        }
    },
}));
