import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { encrypt, decrypt } from './encryption';

describe('encryption helpers', () => {
    let originalCrypto: any;

    beforeEach(() => {
        // Backup the original window.crypto
        originalCrypto = (window as any).crypto;
    });

    afterEach(() => {
        // Restore original window.crypto
        if (originalCrypto) {
            Object.defineProperty(window, 'crypto', {
                value: originalCrypto,
                configurable: true,
                writable: true,
            });
        } else {
            delete (window as any).crypto;
        }
        vi.restoreAllMocks();
    });

    describe('fallback mode (Base64)', () => {
        beforeEach(() => {
            // Force fallback mode by removing window.crypto
            Object.defineProperty(window, 'crypto', {
                value: undefined,
                configurable: true,
                writable: true,
            });
        });

        it('encrypts string with fallback prefix', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const raw = 'secret-message';
            const encrypted = await encrypt(raw);
            expect(encrypted).toBeDefined();
            expect(encrypted?.startsWith('fallback:')).toBe(true);
            consoleSpy.mockRestore();
        });

        it('decrypts fallback encrypted string correctly', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const raw = 'my-secret-key-123';
            const encrypted = await encrypt(raw);
            const decrypted = await decrypt(encrypted!);
            expect(decrypted).toBe(raw);
            consoleSpy.mockRestore();
        });

        it('returns empty string fallback decryption for empty input', async () => {
            const encrypted = 'fallback:';
            const decrypted = await decrypt(encrypted);
            expect(decrypted).toBe('');
        });
    });

    describe('standard crypto mode (Web Crypto API)', () => {
        beforeEach(() => {
            // Ensure window.crypto uses standard Web Crypto API from Node if available in jsdom,
            // or we stub it for test coverage.
            if (globalThis.crypto) {
                Object.defineProperty(window, 'crypto', {
                    value: globalThis.crypto,
                    configurable: true,
                    writable: true,
                });
            } else {
                // Mock implementation if globalThis.crypto doesn't exist
                const mockSubtle = {
                    importKey: vi.fn().mockResolvedValue('mock-key'),
                    encrypt: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
                    decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode('mocked-decrypted')),
                };
                const mockCrypto = {
                    subtle: mockSubtle,
                    getRandomValues: vi.fn().mockImplementation((arr) => {
                        arr.fill(1);
                        return arr;
                    }),
                };
                Object.defineProperty(window, 'crypto', {
                    value: mockCrypto,
                    configurable: true,
                    writable: true,
                });
            }
        });

        it('encrypts and decrypts correctly using Web Crypto APIs', async () => {
            // If we are using Node's real crypto or mock, encrypt/decrypt should complete successfully.
            const raw = 'hello-world-crypt';
            const encrypted = await encrypt(raw);
            expect(encrypted).toBeDefined();
            expect(encrypted?.startsWith('fallback:')).toBe(false);

            // Decrypt it back
            const decrypted = await decrypt(encrypted!);
            if (globalThis.crypto) {
                expect(decrypted).toBe(raw);
            } else {
                expect(decrypted).toBe('mocked-decrypted');
            }
        });

        it('returns null on invalid decrypt inputs', async () => {
            const result = await decrypt('');
            expect(result).toBeNull();
        });

        it('returns null if window is undefined (simulated server environment)', async () => {
            // Temporarily mock window being undefined in encrypt
            const originalWindow = globalThis.window;
            try {
                delete (globalThis as any).window;
                const result = await encrypt('hello');
                expect(result).toBeNull();
            } finally {
                globalThis.window = originalWindow;
            }
        });
    });
});
