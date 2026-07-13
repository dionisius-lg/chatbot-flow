// ============================================================================
// Flow Store (Zustand) — Central state for templates, flows, dialogs, options
// ============================================================================
// Manages all CRUD operations for bot templates, flows, dialogs, and options.
// Provides React Flow node/edge construction from hierarchical API data.
// ============================================================================

import { create } from 'zustand';
import apiClient from '../config/api';

// ─── Data Models ─────────────────────────────────────────────────────────────

export interface BotTemplate {
  id: number;
  name: string;
  media_id: string;
  is_active: number;
  created: string;
  updated: string | null;
}

export interface PaginationInfo {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  paging: {
    current: number;
    next: number;
    previous: number;
    first: number;
    last: number;
  };
}

export interface BotFlowType {
  id: number;
  name: string;
  info: string;
}

export interface BotDialogType {
  id: number;
  name: string;
  info: string;
}

export interface BotDialogOption {
  id: number;
  bot_dialog_id: number;
  next_flow_id: number;
  title: string;
  description: string;
  is_active: number;
}

export interface BotDialog {
  id: number;
  sequence: number;
  bot_flow_id: number;
  bot_dialog_type_id: number;
  next_flow_id: number;
  header: string | null;
  body: string | null;
  footer: string | null;
  media: string | object | null;
  shortcode: string | null;
  option_title: string | null;
  is_record_usage: number;
  is_active: number;
  options?: BotDialogOption[];
}

export interface BotFlow {
  id: number;
  bot_template_id: number;
  bot_flow_type_id: number;
  name: string | null;
  next_flow_id: number;
  timeout_duration: number;
  is_initial: number;
  is_active: number;
  bot_dialogs?: BotDialog[];
}

// Data payload attached to each React Flow node
export interface FlowNodeData {
  flow: BotFlow;
  flowTypeName: string;
  flowTypeColor: string;
  dialogCount: number;
  dialogs: BotDialog[];
  options: BotDialogOption[];
}

// ─── Store State Interface ───────────────────────────────────────────────────

interface FlowStoreState {
  templates: BotTemplate[];
  pagination: PaginationInfo;
  flowTypes: BotFlowType[];
  dialogTypes: BotDialogType[];
  flows: BotFlow[];
  activeTemplate: BotTemplate | null;
  nodes: any[];
  edges: any[];
  selectedNodeId: string | null;
  activeTemplateId: number | null;
  loading: boolean;
  saving: boolean;

  loadTemplates: (page?: number) => Promise<void>;
  createTemplate: (data: Partial<BotTemplate>) => Promise<void>;
  updateTemplate: (id: number, data: Partial<BotTemplate>) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;

  loadWorkspace: (templateId: number) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  updateFlow: (flowId: number, data: Partial<BotFlow>) => Promise<void>;
  createFlow: (data: Partial<BotFlow>) => Promise<void>;
  deleteFlow: (flowId: number) => Promise<void>;

  createDialog: (data: Partial<BotDialog>) => Promise<void>;
  updateDialog: (dialogId: number, data: Partial<BotDialog>) => Promise<void>;
  deleteDialog: (dialogId: number) => Promise<void>;
  deleteDialogHeader: (dialogId: number) => Promise<void>;
  uploadDialogHeaderFile: (dialogId: number, file: File) => Promise<void>;
  setDialogHeaderText: (dialogId: number, text: string) => Promise<void>;
  createMediaDialog: (data: Partial<BotDialog>, file: File) => Promise<void>;
  updateMediaDialog: (dialogId: number, data: Partial<BotDialog>, file?: File) => Promise<void>;

  createOption: (data: Partial<BotDialogOption>) => Promise<void>;
  updateOption: (optionId: number, data: Partial<BotDialogOption>) => Promise<void>;
  deleteOption: (optionId: number) => Promise<void>;

  onConnect: (connection: any) => Promise<void>;
}

// ─── Helper: Build React Flow nodes & edges from hierarchical data ───────────

function buildNodesAndEdges(flows: BotFlow[], flowTypes: BotFlowType[]): { nodes: any[]; edges: any[] } {
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
    dialogs.forEach(d => {
      if (d.options) allOptions.push(...d.options);
    });

    const col = index % 4;
    const row = Math.floor(index / 4);

    return {
      id: `flow-${flow.id}`,
      type: 'botFlowNode',
      position: { x: 220 * col + 40, y: 280 * row + 40 },
      data: {
        flow,
        flowTypeName: ft.label,
        flowTypeColor: ft.color,
        dialogCount: dialogs.length,
        dialogs,
        options: allOptions,
      } as FlowNodeData,
    };
  });

  // Create edges for flow-to-flow connections
  const edges: any[] = [];

  flows.forEach(flow => {
    // Default next_flow edge (animated gray)
    if (flow.next_flow_id > 0) {
      const targetExists = flows.some(f => f.id === flow.next_flow_id);
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
    dialogs.forEach(dialog => {
      // Dialog-level next_flow override (dashed purple)
      if (dialog.next_flow_id > 0) {
        const targetExists = flows.some(f => f.id === dialog.next_flow_id);
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
        dialog.options.forEach(opt => {
          if (opt.next_flow_id > 0) {
            const targetExists = flows.some(f => f.id === opt.next_flow_id);
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
    try {
      const res = await apiClient.get(`/bot_templates?limit=${perPage}&page=${page}`);
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
    }
  },

  // Create new template — throws error if API returns success: false
  createTemplate: async (data) => {
    const res = await apiClient.post('/bot_templates', data);
    if (res && res.success === false) {
      throw new Error(res.message || 'Failed to create template');
    }
    // Reload first page to see the new template
    await get().loadTemplates(1);
    return res;
  },

  // Update existing template — throws error if API returns success: false
  updateTemplate: async (id, data) => {
    const res = await apiClient.put(`/bot_templates/${id}`, data);
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
    const res = await apiClient.put(`/bot_templates/${id}`, { is_active: 0 });
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
      const found = currentTemplates.find(t => t.id === templateId);
      if (found) {
        set({ activeTemplate: found });
      } else {
        const tplRes = await apiClient.get(`/bot_templates/${templateId}`);
        const tpl = tplRes.data || tplRes;
        if (tpl && tpl.id) set({ activeTemplate: tpl });
      }
      // Parallel: fetch flows, flow types, and dialog types
      const [flowsRes, flowTypesRes, dialogTypesRes] = await Promise.all([
        apiClient.get(`/bot_flows?bot_template_id=${templateId}`),
        apiClient.get('/bot_flow_types?is_active=1'),
        apiClient.get('/bot_dialog_types?is_active=1'),
      ]);

      let flows: BotFlow[] = flowsRes.data?.data || flowsRes.data || [];

      // For each flow, fetch its dialogs and options (nested)
      const flowsWithDialogs = await Promise.all(
        flows.map(async (flow: BotFlow) => {
          try {
            const dialogsRes = await apiClient.get(`/bot_dialogs?bot_flow_id=${flow.id}`);
            let dialogs: BotDialog[] = dialogsRes.data?.data || dialogsRes.data || [];

            // For each dialog with options (type 2, 3, 4), fetch options
            const dialogsWithOptions = await Promise.all(
              dialogs.map(async (dialog: BotDialog) => {
                if ([2, 3, 4].includes(dialog.bot_dialog_type_id)) {
                  try {
                    const optsRes = await apiClient.get(`/bot_dialog_options?bot_dialog_id=${dialog.id}`);
                    dialog.options = optsRes.data?.data || optsRes.data || [];
                  } catch {
                    dialog.options = [];
                  }
                } else {
                  dialog.options = [];
                }
                return dialog;
              })
            );
            return { ...flow, bot_dialogs: dialogsWithOptions };
          } catch {
            return { ...flow, bot_dialogs: [] };
          }
        })
      );

      const flowTypesData: BotFlowType[] = flowTypesRes.data?.data || flowTypesRes.data || [];
      const dialogTypesData: BotDialogType[] = dialogTypesRes.data?.data || dialogTypesRes.data || [];

      // Build React Flow nodes and edges from the data
      const { nodes, edges } = buildNodesAndEdges(flowsWithDialogs, flowTypesData);

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
      const res = await apiClient.put(`/bot_flows/${flowId}`, data);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to update flow');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  createFlow: async (data) => {
    set({ saving: true });
    try {
      const res = await apiClient.post('/bot_flows', data);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to create flow');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  deleteFlow: async (flowId) => {
    set({ saving: true });
    try {
      const res = await apiClient.put(`/bot_flows/${flowId}`, { is_active: 0 });
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to delete flow');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  // ─── Dialog CRUD ────────────────────────────────────────────────────────

  createDialog: async (data) => {
    set({ saving: true });
    try {
      const res = await apiClient.post('/bot_dialogs', data);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to create dialog');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  updateDialog: async (dialogId, data) => {
    set({ saving: true });
    try {
      const res = await apiClient.put(`/bot_dialogs/${dialogId}`, data);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to update dialog');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  deleteDialog: async (dialogId) => {
    set({ saving: true });
    try {
      const res = await apiClient.put(`/bot_dialogs/${dialogId}`, { is_active: 0 });
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to delete dialog');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  deleteDialogHeader: async (dialogId) => {
    set({ saving: true });
    try {
      const res = await apiClient.delete(`/bot_dialogs/${dialogId}/header`);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to delete dialog header');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  uploadDialogHeaderFile: async (dialogId, file) => {
    set({ saving: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.put(`/bot_dialogs/${dialogId}/header/file`, formData);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to upload dialog header file');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  setDialogHeaderText: async (dialogId, text) => {
    set({ saving: true });
    try {
      const res = await apiClient.put(`/bot_dialogs/${dialogId}/header/text`, { text });
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to set dialog header text');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  createMediaDialog: async (data, file) => {
    set({ saving: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (data.bot_flow_id !== undefined) formData.append('bot_flow_id', String(data.bot_flow_id));
      if (data.bot_dialog_type_id !== undefined) formData.append('bot_dialog_type_id', String(data.bot_dialog_type_id));
      if (data.sequence !== undefined) formData.append('sequence', String(data.sequence));
      if (data.next_flow_id !== undefined) formData.append('next_flow_id', String(data.next_flow_id));
      const res = await apiClient.post('/bot_dialogs/media', formData);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to create media dialog');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  updateMediaDialog: async (dialogId, data, file) => {
    set({ saving: true });
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (data.bot_flow_id !== undefined) formData.append('bot_flow_id', String(data.bot_flow_id));
      if (data.bot_dialog_type_id !== undefined) formData.append('bot_dialog_type_id', String(data.bot_dialog_type_id));
      if (data.sequence !== undefined) formData.append('sequence', String(data.sequence));
      if (data.next_flow_id !== undefined) formData.append('next_flow_id', String(data.next_flow_id));
      if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));
      const res = await apiClient.put(`/bot_dialogs/${dialogId}/media`, formData);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to update media dialog');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  // ─── Option CRUD ────────────────────────────────────────────────────────

  createOption: async (data) => {
    set({ saving: true });
    try {
      const res = await apiClient.post('/bot_dialog_options', data);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to create option');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  updateOption: async (optionId, data) => {
    set({ saving: true });
    try {
      const res = await apiClient.put(`/bot_dialog_options/${optionId}`, data);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to update option');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },

  deleteOption: async (optionId) => {
    set({ saving: true });
    try {
      const res = await apiClient.put(`/bot_dialog_options/${optionId}`, { is_active: 0 });
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to delete option');
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
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
        await apiClient.put(`/bot_flows/${sourceFlowId}`, { next_flow_id: targetFlowId });
      } else if (sourceHandle?.startsWith('option-')) {
        // Option-level branching connection
        const optionId = parseInt(sourceHandle.replace('option-', ''));
        await apiClient.put(`/bot_dialog_options/${optionId}`, { next_flow_id: targetFlowId });
      } else if (sourceHandle?.startsWith('dialog-')) {
        // Dialog-level next_flow override
        const dialogId = parseInt(sourceHandle.replace('dialog-', ''));
        await apiClient.put(`/bot_dialogs/${dialogId}`, { next_flow_id: targetFlowId });
      }
      const { activeTemplateId } = get();
      if (activeTemplateId) await get().loadWorkspace(activeTemplateId);
    } finally {
      set({ saving: false });
    }
  },
}));