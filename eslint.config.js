import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
    // 1. Ignored Files
    { ignores: ['dist', 'node_modules', 'build', '.eslintcache'] },

    // 2. Base Configuration for TypeScript and React
    {
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked, // Menggunakan type-checked rules untuk analisa tipe data yang kuat
            eslintConfigPrettier,
        ],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node, // Mengizinkan global variabel Node.js (seperti proses build/vite)
            },
            parserOptions: {
                project: ['./tsconfig.json'], // Hanya menggunakan tsconfig.json yang tersedia
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            react: react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            import: importPlugin,
            prettier: prettierPlugin,
        },
        settings: {
            react: {
                version: 'detect', // Otomatis mendeteksi versi React yang terpasang
            },
        },
        rules: {
            // --- React & Hooks Rules ---
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules, // Mencegah error "React must be in scope" di React 17+
            ...reactHooks.configs.recommended.rules,
            'react/prop-types': 'off', // Dimatikan karena validasi tipe data sudah ditangani TypeScript
            'react/self-closing-comp': 'error', // Memaksa tag kosong untuk self-closing (cth: <div />)

            // --- TypeScript Rules ---
            '@typescript-eslint/no-explicit-any': 'off', // Diperbolehkan karena dipakai di helper values & state
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/prefer-promise-reject-errors': 'off', // Dimatikan agar response interceptor Axios bisa memicu reject error asli
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Error jika ada var tidak terpakai, kecuali diawali '_'
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }], // Memaksa struktur import type yang bersih

            // --- Clean Code & Best Practices ---
            'no-console': ['warn', { allow: ['warn', 'error'] }], // Melarang console.log masuk production
            'no-debugger': 'error',
            'react-hooks/set-state-in-effect': 'off', // Dimatikan karena form state sync pada komponen React didasarkan pada perubahan selected node props

            // --- Import Optimization (Sangat krusial untuk kerapian tim) ---
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index', 'object', 'type'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],

            // --- React Refresh (Vite) ---
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

            // ===========================
            // Best Practice
            // ===========================
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all'],
            'no-else-return': 'error',
            'no-nested-ternary': 'error',
            'no-multiple-empty-lines': [
                'error',
                {
                    max: 1,
                    maxEOF: 0,
                },
            ],

            // ===========================
            // ES6
            // ===========================
            'prefer-const': 'error',
            'prefer-template': 'error',
            'object-shorthand': ['error', 'always'],

            // ===========================
            // Import
            // ===========================
            'import/first': 'error',
            'import/newline-after-import': 'error',
            'import/no-duplicates': 'error',

            // ===========================
            // React
            // ===========================
            'react/jsx-boolean-value': ['error', 'never'],
            'react/jsx-curly-brace-presence': [
                'error',
                {
                    props: 'never',
                    children: 'never',
                },
            ],

            // ===========================
            // Prettier
            // ===========================
            'prettier/prettier': 'error',
        },
    },
);
