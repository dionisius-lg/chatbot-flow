import type {
    BotDialog,
    BotDialogOption,
    BotFlow,
    BotFlowType,
    BotDialogType,
    BotTemplate,
    PaginationInfo,
    User,
} from './models';

// ─── Auth Store State Interface ───────────────────────────────────────────────
export interface AuthState {
    token: string | null;
    refreshToken: string | null;
    serverIp: string | null;
    user: User | null;
    isLoggedIn: boolean;
    loading: boolean;
    error: string | null;
    login: (serverIp: string, username: string, password: string) => Promise<void>;
    logout: () => void;
    restoreSession: () => Promise<void>;
}

// ─── Flow Store State Interface ───────────────────────────────────────────────
export interface FlowStoreState {
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
