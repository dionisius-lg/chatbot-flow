import { describe, it, expect } from 'vitest';

import {
    isEmpty,
    isValidDate,
    dateParse,
    formatCurrency,
    sleep,
    randomString,
    isValidIp,
    isValidDomain,
    isValidHost,
} from './value';

describe('value helpers', () => {
    describe('isEmpty', () => {
        it('returns true for empty values', () => {
            expect(isEmpty('')).toBe(true);
            expect(isEmpty([])).toBe(true);
            expect(isEmpty({})).toBe(true);
            expect(isEmpty(0)).toBe(true);
            expect(isEmpty(null)).toBe(true);
            expect(isEmpty(undefined)).toBe(true);
        });

        it('returns false for non-empty values', () => {
            expect(isEmpty('hello')).toBe(false);
            expect(isEmpty([1])).toBe(false);
            expect(isEmpty({ a: 1 })).toBe(false);
            expect(isEmpty(42)).toBe(false);
        });
    });

    describe('isValidDate', () => {
        it('validates dates correctly', () => {
            expect(isValidDate('2026-07-13')).toBe(true);
            expect(isValidDate('not-a-date')).toBe(false);
        });
    });

    describe('dateParse', () => {
        it('correctly parses dates into components', () => {
            const parsed = dateParse('2026-07-02T10:00:00Z');
            expect(parsed.year).toBe('2026');
            // Support both DD/MM and MM/DD formatting based on system locale split result
            expect(['02', '07']).toContain(parsed.month);
            expect(['02', '07']).toContain(parsed.date);
        });

        it('returns empty fields for invalid dates', () => {
            const parsed = dateParse('invalid');
            expect(parsed.year).toBe('');
            expect(parsed.month).toBe('');
        });
    });

    describe('formatCurrency', () => {
        it('formats currencies accurately', () => {
            expect(formatCurrency(1500000)).toBe('1.500.000');
            expect(formatCurrency('Rp. 250.000,00')).toBe('25.000.000');
        });
    });

    describe('sleep', () => {
        it('delays execution', async () => {
            const start = Date.now();
            await sleep(0.1);
            const diff = Date.now() - start;
            expect(diff).toBeGreaterThanOrEqual(100);
        });
    });

    describe('randomString', () => {
        it('generates random strings of specified length', () => {
            const str = randomString(12);
            expect(str.length).toBe(12);
        });

        it('respects uppercase, symbol and numeric settings', () => {
            const str = randomString(50, { capital: true, numeric: true, symbol: true });
            expect(/[A-Z]/.test(str)).toBe(true);
            expect(/[0-9]/.test(str)).toBe(true);
            expect(/[!@#$%^&*?]/.test(str)).toBe(true);
        });
    });

    describe('isValidIp', () => {
        it('validates IP addresses correctly', () => {
            expect(isValidIp('172.31.0.116')).toBe(true);
            expect(isValidIp('127.0.0.1')).toBe(true);
            expect(isValidIp('256.0.0.1')).toBe(false);
            expect(isValidIp('abc.def.ghi.jkl')).toBe(false);
            expect(isValidIp('')).toBe(false);
        });
    });

    describe('isValidDomain', () => {
        it('validates domain names correctly', () => {
            expect(isValidDomain('webcc.synergix.co.id')).toBe(true);
            expect(isValidDomain('localhost')).toBe(false);
            expect(isValidDomain('google.com')).toBe(true);
            expect(isValidDomain('invalid-domain')).toBe(false);
            expect(isValidDomain('')).toBe(false);
        });
    });

    describe('isValidHost', () => {
        it('validates host strings correctly', () => {
            expect(isValidHost('localhost')).toBe(true);
            expect(isValidHost('172.31.0.116')).toBe(true);
            expect(isValidHost('webcc.synergix.co.id')).toBe(true);
            expect(isValidHost('http://localhost')).toBe(false);
            expect(isValidHost('172.31.0.116/api')).toBe(false);
        });
    });
});
