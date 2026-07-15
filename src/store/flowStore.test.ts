import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useFlowStore } from './flowStore';
import apiClient from '../config/api';

// Mock the API client
vi.mock('../config/api', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
        },
    };
});

describe('flowStore', () => {
    beforeEach(() => {
        // Reset Zustand store state before each test
        useFlowStore.setState({
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
        });
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('has correct defaults', () => {
            const state = useFlowStore.getState();
            expect(state.templates).toEqual([]);
            expect(state.flows).toEqual([]);
            expect(state.nodes).toEqual([]);
            expect(state.edges).toEqual([]);
            expect(state.loading).toBe(false);
            expect(state.saving).toBe(false);
        });
    });

    describe('loadTemplates', () => {
        it('handles success template fetch and parses pagination details including previuos typo fallback', async () => {
            const mockResponse = {
                data: [
                    { id: 1, name: 'Template 1', media_id: '4', is_active: 1 },
                    { id: 2, name: 'Template 2', media_id: '18', is_active: 1 },
                ],
                paging: {
                    current: 1,
                    next: 2,
                    previuos: 1, // typo key returned by API
                    first: 1,
                    last: 5,
                },
                total_data: 25,
            };
            vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

            await useFlowStore.getState().loadTemplates(1);

            const state = useFlowStore.getState();
            expect(apiClient.get).toHaveBeenCalledWith('/bot_templates?&is_active=1&limit=5&page=1');
            expect(state.templates).toHaveLength(2);
            expect(state.pagination.total).toBe(25);
            expect(state.pagination.current_page).toBe(1);
            expect(state.pagination.last_page).toBe(5);
            expect(state.pagination.paging.previous).toBe(1);
        });

        it('handles API errors silently and keeps templates empty', async () => {
            vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

            await useFlowStore.getState().loadTemplates(1);

            const state = useFlowStore.getState();
            expect(state.templates).toEqual([]);
            expect(state.pagination.total).toBe(0);
        });
    });

    describe('Template CRUD actions', () => {
        it('creates a template successfully and reloads page 1', async () => {
            const mockCreateRes = { id: 3, name: 'New Template', success: true };
            vi.mocked(apiClient.post).mockResolvedValueOnce(mockCreateRes);

            // Mock get templates inside createTemplate reload
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: [{ id: 3, name: 'New Template' }],
                total_data: 1,
            });

            const res = await useFlowStore.getState().createTemplate({ name: 'New Template', media_id: '4' });
            expect(apiClient.post).toHaveBeenCalledWith('/bot_templates', { name: 'New Template', media_id: '4' });
            expect(res).toEqual(mockCreateRes);
            expect(apiClient.get).toHaveBeenCalledWith('/bot_templates?&is_active=1&limit=5&page=1');
        });

        it('throws an error during create if API returns success: false', async () => {
            vi.mocked(apiClient.post).mockResolvedValueOnce({
                success: false,
                message: 'Template limit exceeded',
            });

            await expect(
                useFlowStore.getState().createTemplate({ name: 'Bad Template', media_id: '4' }),
            ).rejects.toThrow('Template limit exceeded');
        });

        it('updates a template successfully and reloads the current page templates', async () => {
            // Set page state to 3
            useFlowStore.setState({
                pagination: {
                    total: 15,
                    per_page: 5,
                    current_page: 3,
                    last_page: 3,
                    paging: { current: 3, next: 3, previous: 2, first: 1, last: 3 },
                },
            });

            vi.mocked(apiClient.put).mockResolvedValueOnce({ success: true });
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                data: [],
                total_data: 15,
            });

            await useFlowStore.getState().updateTemplate(1, { name: 'Updated Template' });
            expect(apiClient.put).toHaveBeenCalledWith('/bot_templates/1', { name: 'Updated Template' });
            expect(apiClient.get).toHaveBeenCalledWith('/bot_templates?&is_active=1&limit=5&page=3');
        });

        it('deletes a template soft (puts is_active = 0) and reloads templates', async () => {
            vi.mocked(apiClient.put).mockResolvedValueOnce({ success: true });
            vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [], total_data: 0 });

            await useFlowStore.getState().deleteTemplate(1);
            expect(apiClient.put).toHaveBeenCalledWith('/bot_templates/1', { is_active: 0 });
        });
    });

    describe('loadWorkspace and canvas parser logic', () => {
        it('loads flows, dialogs, and options, then builds React Flow nodes and edges correctly', async () => {
            const templateId = 10;

            // 1. Mock Templates lookup fallback
            vi.mocked(apiClient.get).mockImplementation((url?: string) => {
                if (url === `/bot_templates/${templateId}`) {
                    return Promise.resolve({ id: templateId, name: 'Tpl 10', media_id: '4' });
                }
                if (url === `/bot_flows?bot_template_id=${templateId}&is_active=1&limit=100`) {
                    return Promise.resolve({
                        data: {
                            data: [
                                {
                                    id: 101,
                                    bot_template_id: templateId,
                                    bot_flow_type_id: 1, // Normal (green)
                                    name: 'Start Flow',
                                    next_flow_id: 102,
                                    timeout_duration: 30,
                                    is_initial: 1,
                                    is_active: 1,
                                },
                                {
                                    id: 102,
                                    bot_template_id: templateId,
                                    bot_flow_type_id: 2, // Direct Agent (blue)
                                    name: 'Agent Flow',
                                    next_flow_id: 0,
                                    timeout_duration: 0,
                                    is_initial: 0,
                                    is_active: 1,
                                },
                            ],
                        },
                    });
                }
                if (url === '/bot_flow_types?is_active=1&limit=100') {
                    return Promise.resolve({
                        data: {
                            data: [
                                { id: 1, name: 'Normal' },
                                { id: 2, name: 'Direct Agent' },
                            ],
                        },
                    });
                }
                if (url === '/bot_dialog_types?is_active=1&limit=100') {
                    return Promise.resolve({
                        data: {
                            data: [
                                { id: 1, name: 'Text' },
                                { id: 2, name: 'Reply List' },
                            ],
                        },
                    });
                }
                if (url === '/bot_dialogs?bot_flow_id=101&is_active=1&limit=100') {
                    return Promise.resolve({
                        data: {
                            data: [
                                {
                                    id: 501,
                                    bot_flow_id: 101,
                                    bot_dialog_type_id: 2, // Reply List (requires options fetch)
                                    body: 'Select options:',
                                    next_flow_id: 102, // dialog next_flow override edge (dashed purple)
                                    sequence: 1,
                                },
                            ],
                        },
                    });
                }
                if (url === '/bot_dialogs?bot_flow_id=102&is_active=1&limit=100') {
                    return Promise.resolve({ data: { data: [] } });
                }
                if (url === '/bot_dialog_options?bot_dialog_id=501&is_active=1&limit=100') {
                    return Promise.resolve({
                        data: {
                            data: [
                                {
                                    id: 801,
                                    bot_dialog_id: 501,
                                    next_flow_id: 102, // option next_flow edge (blue)
                                    title: 'Option A',
                                    is_active: 1,
                                },
                            ],
                        },
                    });
                }
                return Promise.reject(new Error(`Unmocked url GET: ${url}`));
            });

            // Call loadWorkspace
            await useFlowStore.getState().loadWorkspace(templateId);

            const state = useFlowStore.getState();
            expect(state.flows).toHaveLength(2);
            expect(state.loading).toBe(false);
            expect(state.activeTemplate).toEqual({ id: templateId, name: 'Tpl 10', media_id: '4' });

            // Verify Nodes
            expect(state.nodes).toHaveLength(2);
            const startNode = state.nodes.find((n) => n.id === 'flow-101');
            expect(startNode).toBeDefined();
            expect(startNode.type).toBe('botFlowNode');
            expect(startNode.data.flowTypeName).toBe('Normal');
            expect(startNode.data.flowTypeColor).toBe('#16a34a'); // Green
            expect(startNode.data.dialogCount).toBe(1);
            expect(startNode.data.dialogs[0].id).toBe(501);
            expect(startNode.data.options[0].id).toBe(801);

            // Verify Edges:
            // 1. flow.next_flow_id (101 -> 102): animated gray edge
            // 2. dialog.next_flow_id (dialog 501 -> 102): dashed purple edge
            // 3. option.next_flow_id (option 801 -> 102): blue labeled edge
            expect(state.edges).toHaveLength(3);

            const defaultEdge = state.edges.find((e) => e.id === 'edge-101-default');
            expect(defaultEdge).toBeDefined();
            expect(defaultEdge.target).toBe('flow-102');
            expect(defaultEdge.animated).toBe(true);
            expect(defaultEdge.style.stroke).toBe('#94a3b8');

            const dialogEdge = state.edges.find((e) => e.id === 'edge-dialog-501');
            expect(dialogEdge).toBeDefined();
            expect(dialogEdge.target).toBe('flow-102');
            expect(dialogEdge.style.strokeDasharray).toBe('5,5');
            expect(dialogEdge.style.stroke).toBe('#a78bfa');

            const optionEdge = state.edges.find((e) => e.id === 'edge-opt-801');
            expect(optionEdge).toBeDefined();
            expect(optionEdge.target).toBe('flow-102');
            expect(optionEdge.label).toBe('Option A');
            expect(optionEdge.style.stroke).toBe('#3b82f6');
        });
    });
});
