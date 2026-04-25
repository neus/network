import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    testTimeout: 10000,

    hookTimeout: 10000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '*.config.js'
      ]
    },

    include: ['test/**/*.test.js'],

    exclude: [
      'node_modules/**',
      'dist/**'
    ],

    globals: true,

    mockReset: true,
    clearMocks: true,
    restoreMocks: true
  }
});