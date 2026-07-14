'use client';

const secret = 'a8e52a40b9c3f1d8e6a4c2b9f3a6e1d5';
const keyData = new TextEncoder().encode(secret);

if (keyData.length !== 32) {
    throw new Error('Invalid key length: AES-256 requires a 32-byte key.');
}

/**
 * Caches the cryptographic key to avoid re-importing on every call.
 * This is an optimization for performance.
 * @returns {Promise<CryptoKey>} The imported cryptographic key.
 */
async function getCryptoKey(): Promise<CryptoKey> {
    // Use a simple global cache to store the key after the first import
    if ((window as any).__cryptoKeyCache) {
        return (window as any).__cryptoKeyCache;
    }

    const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-CBC', length: 256 },
        true, // extractable
        ['encrypt', 'decrypt'],
    );

    (window as any).__cryptoKeyCache = key;
    return key;
}

/**
 * Encrypts a string using AES-256-CBC with a random IV.
 * @param {string} value - The string to encrypt.
 * @returns {Promise<string | null>} The encrypted data as a hex string, or null on error.
 */
export async function encrypt(value: string = ''): Promise<string | null> {
    try {
        if (typeof window === 'undefined') {
            return null;
        }
        if (!window.crypto || !window.crypto.subtle) {
            console.warn('Web Crypto API not available (possibly insecure context). Falling back to Base64.');
            return `fallback:${btoa(encodeURIComponent(value))}`;
        }
        const key = await getCryptoKey();
        // Generate a new random IV for each encryption
        const iv = window.crypto.getRandomValues(new Uint8Array(16));
        const encodedValue = new TextEncoder().encode(value);

        const encryptedData = await window.crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, encodedValue);

        // Combine the IV and the encrypted data into a single array for storage
        const fullData = new Uint8Array(iv.length + encryptedData.byteLength);
        fullData.set(iv, 0);
        fullData.set(new Uint8Array(encryptedData), iv.length);

        // Convert the combined Uint8Array to a hex string
        return Array.from(fullData)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    } catch (err) {
        console.error('Encryption error:', err);
        return null;
    }
}

/**
 * Decrypts a hex string using AES-256-CBC.
 * @param {string} data - The hex string to decrypt.
 * @returns {Promise<string | null>} The decrypted string, or null on error.
 */
export async function decrypt(data: string): Promise<string | null> {
    try {
        if (!data || typeof window === 'undefined') {
            return null;
        }
        if (data.startsWith('fallback:')) {
            const base64Str = data.substring(9);
            return decodeURIComponent(atob(base64Str));
        }
        if (!window.crypto || !window.crypto.subtle) {
            console.error('Web Crypto API not available but data requires decryption.');
            return null;
        }
        const key = await getCryptoKey();
        // Convert the hex string back to a Uint8Array
        const fullData = new Uint8Array(data.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

        // Extract the IV (first 16 bytes) and the encrypted data
        const iv = fullData.slice(0, 16);
        const encryptedData = fullData.slice(16);

        const decryptedData = await window.crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv,
            },
            key,
            encryptedData,
        );

        // Convert the decrypted Uint8Array back to a string
        return new TextDecoder().decode(decryptedData);
    } catch (err) {
        console.error('Decryption error:', err);
        return null;
    }
}
