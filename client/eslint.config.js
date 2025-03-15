import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default ([
    js.configs.recommended,
    ...tseslint.configs.recommended,
    reactPlugin.configs.flat['jsx-runtime'],
    {
        files: ['**/*.{ts,tsx}'],
        settings: { react: { version: '18.2.0' } },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
    },
    globalIgnores(['postcss.config.cjs'])
]);