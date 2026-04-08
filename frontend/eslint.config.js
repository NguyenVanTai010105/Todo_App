import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // This codebase intentionally sets state in effects for:
      // - fetching remote data
      // - keeping pagination in sync with filters
      'react-hooks/set-state-in-effect': 'off',

      // shadcn/ui patterns export both components + variants/helpers
      'react-refresh/only-export-components': 'off',

      // Allow intentionally omitted deps for stable functions defined in component scope.
      // (We keep fetchTasks tied to dateQuery to avoid re-creating callbacks.)
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
