// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*', '.expo/*', 'public/sw.js', 'public/workbox-*.js'],
  },
  {
    rules: {
      // The @typescript-eslint plugin is scoped to eslint-config-expo's own
      // config object, so `any` is banned via a core rule instead.
      'no-restricted-syntax': [
        'error',
        { selector: 'TSAnyKeyword', message: 'Avoid `any` — use a real type or `unknown`.' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  {
    // The engine is pure game logic: it must never reach for React, Expo, or the store.
    files: ['src/engine/**/*.ts'],
    ignores: ['src/engine/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'expo', 'expo-*', '@/store/*', '@/components/*'],
              message: 'src/engine must stay pure: no React, Expo, store, or UI imports.',
            },
          ],
        },
      ],
    },
  },
]);
