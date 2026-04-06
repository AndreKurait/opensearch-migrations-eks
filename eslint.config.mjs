import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.mjs', '**/*.js'],
    ignores: ['node_modules/**', 'dist/**', '.astro/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
];
