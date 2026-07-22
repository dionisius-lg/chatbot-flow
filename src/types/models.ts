export interface User {
    id: number;
    username: string;
    fullname: string;
    role: string;
}

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

export interface FlowNodeData {
    flow: BotFlow;
    flowTypeName: string;
    flowTypeColor: string;
    dialogCount: number;
    dialogs: BotDialog[];
    options: BotDialogOption[];
}
