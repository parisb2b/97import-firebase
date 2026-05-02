import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '97import2026_siteweb/**',
      'HTML-2030/**',
      'SAVE2026/**',
      'Codexxx/**',
      '97import-firebase/**',
      'MIGRATION_PACKAGE_FINAL/**',
      'majall/**',
      '1MAJALL/**',
      'PDF/**',
      'audit-gpt-97import/**',
      'audit-gpt-97import 2/**',
      'audit-v52/**',
      'audit/**',
      'ARCHIVE-*/**',
      '*.zip',
      '*.log',
      '*.txt',
      '*.md',
      'firebase-admin-sdk.json',
      'serviceAccountKey.json',
      '*service-account*.json',
      '*admin-sdk*.json',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        __APP_VERSION__: 'readonly',
        __BUILD_ISO__: 'readonly',
        __COMMIT_HASH__: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-this-alias': 'warn',
      'no-constant-condition': 'warn',
      'no-debugger': 'warn',
      'no-duplicate-case': 'warn',
      'no-empty': 'warn',
      'no-fallthrough': 'warn',
      'no-redeclare': 'warn',
      'no-self-assign': 'warn',
      'no-useless-escape': 'warn',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
);
