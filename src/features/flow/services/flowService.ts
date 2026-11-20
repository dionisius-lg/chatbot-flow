import api from '../../../config/api';

import type { BotTemplate, BotFlow, BotDialog, BotDialogOption, TemplateFilters } from '../../../types';

export const flowService = {
    getTemplates: async (page = 1, limit = 4, filters?: TemplateFilters) => {
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('page', String(page));
        if (filters?.name && filters.name.trim() !== '') {
            params.set('name', filters.name.trim());
        }
        if (filters?.media_id && filters.media_id.trim() !== '') {
            params.set('media_id', filters.media_id.trim());
        }
        if (filters?.is_active !== undefined && filters?.is_active !== null) {
            params.set('is_active', String(filters.is_active));
        }
        return await api.get(`/bot_templates?${params.toString()}`);
    },
    createTemplate: async (data: Partial<BotTemplate>) => {
        return await api.post('/bot_templates', data);
    },
    updateTemplate: async (id: number, data: Partial<BotTemplate>) => {
        return await api.put(`/bot_templates/${id}`, data);
    },
    getTemplate: async (id: number) => {
        return await api.get(`/bot_templates/${id}`);
    },
    getFlows: async (templateId: number) => {
        return await api.get(`/bot_flows?bot_template_id=${templateId}&is_active=1&limit=1000`);
    },
    createFlow: async (data: Partial<BotFlow>) => {
        return await api.post('/bot_flows', data);
    },
    updateFlow: async (id: number, data: Partial<BotFlow>) => {
        return await api.put(`/bot_flows/${id}`, data);
    },
    getDialogs: async (flowId: number) => {
        return await api.get(`/bot_dialogs?bot_flow_id=${flowId}&is_active=1&limit=1000`);
    },
    createDialog: async (data: Partial<BotDialog>) => {
        return await api.post('/bot_dialogs', data);
    },
    updateDialog: async (id: number, data: Partial<BotDialog>) => {
        return await api.put(`/bot_dialogs/${id}`, data);
    },
    deleteDialogHeader: async (id: number) => {
        return await api.delete(`/bot_dialogs/${id}/header`);
    },
    uploadDialogHeaderFile: async (id: number, formData: FormData) => {
        return await api.put(`/bot_dialogs/${id}/header/file`, formData);
    },
    setDialogHeaderText: async (id: number, text: string) => {
        return await api.put(`/bot_dialogs/${id}/header/text`, { text });
    },
    createMediaDialog: async (formData: FormData) => {
        return await api.post('/bot_dialogs/media', formData);
    },
    updateMediaDialog: async (id: number, formData: FormData) => {
        return await api.put(`/bot_dialogs/${id}/media`, formData);
    },
    getOptions: async (dialogId: number) => {
        return await api.get(`/bot_dialog_options?bot_dialog_id=${dialogId}&is_active=1&limit=1000`);
    },
    createOption: async (data: Partial<BotDialogOption>) => {
        return await api.post('/bot_dialog_options', data);
    },
    updateOption: async (id: number, data: Partial<BotDialogOption>) => {
        return await api.put(`/bot_dialog_options/${id}`, data);
    },
    getFlowTypes: async () => {
        return await api.get('/bot_flow_types?is_active=1&limit=1000');
    },
    getDialogTypes: async () => {
        return await api.get('/bot_dialog_types?is_active=1&limit=1000');
    },
};
