// eslint.config.js (Flat Config, ESLint 8+)
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    plugins: {
      import: eslintPluginImport,
      'unused-imports': eslintPluginUnusedImports,
    },
    rules: {
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-console': 'off',
      'no-alert': 'error',
      'no-else-return': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'unused-imports/no-unused-imports': 'error',
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
        },
      ],
      'import/no-unresolved': 'off',
      'import/prefer-default-export': 'off',
    },
  },
];
