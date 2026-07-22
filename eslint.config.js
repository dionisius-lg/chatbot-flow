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
            ...tseslint.configs.recommendedTypeChecked, // Use type-checked rules for strong typing analysis
            eslintConfigPrettier,
        ],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node, // Allow Node.js global variables (like process in Vite config)
            },
            parserOptions: {
                project: ['./tsconfig.json'], // Use only the provided tsconfig.json
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
                version: 'detect', // Automatically detect installed React version
            },
        },
        rules: {
            // --- React & Hooks Rules ---
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules, // Prevent "React must be in scope" error in React 17+
            ...reactHooks.configs.recommended.rules,
            'react/prop-types': 'off', // Disabled because type validation is handled by TypeScript
            'react/self-closing-comp': 'error', // Force empty tags to be self-closing (e.g. <div />)

            // --- TypeScript Rules ---
            '@typescript-eslint/no-explicit-any': 'off', // Allowed for value helpers & state
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/prefer-promise-reject-errors': 'off', // Disabled so Axios response interceptor can throw original error
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Error on unused variables, unless prefixed with '_'
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }], // Force clean type imports structure

            // --- Clean Code & Best Practices ---
            'no-console': ['warn', { allow: ['warn', 'error'] }], // Forbid console.log in production
            'no-debugger': 'error',
            'react-hooks/set-state-in-effect': 'off', // Disabled because React component form state sync is based on selected node props changes

            // --- Import Optimization (Critical for team consistency) ---
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
