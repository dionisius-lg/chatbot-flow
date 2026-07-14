import { describe, it, expect } from 'vitest';

import { resolveBaseUrl } from './api';

describe('resolveBaseUrl', () => {
    it('returns empty string if input is falsy', () => {
        expect(resolveBaseUrl('')).toBe('');
        expect(resolveBaseUrl(null as any)).toBe('');
    });

    it('correctly resolves domains to https with /api-backend path', () => {
        expect(resolveBaseUrl('webcc.synergix.co.id')).toBe('https://webcc.synergix.co.id/api-backend');
        expect(resolveBaseUrl('https://webcc.synergix.co.id/')).toBe('https://webcc.synergix.co.id/api-backend');
        expect(resolveBaseUrl('http://webcc.synergix.co.id')).toBe('https://webcc.synergix.co.id/api-backend');
    });

    it('correctly resolves IP addresses to http with port 8000', () => {
        expect(resolveBaseUrl('172.31.0.116')).toBe('http://172.31.0.116:8000');
        expect(resolveBaseUrl('127.0.0.1')).toBe('http://127.0.0.1:8000');
        expect(resolveBaseUrl('http://172.31.0.116/')).toBe('http://172.31.0.116:8000');
    });

    it('correctly resolves localhost to http with port 8000', () => {
        expect(resolveBaseUrl('localhost')).toBe('http://localhost:8000');
        expect(resolveBaseUrl('http://localhost')).toBe('http://localhost:8000');
    });
});
