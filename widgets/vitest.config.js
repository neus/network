import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '*.config.js'
      ]
    },
    
    // Test file patterns
    include: ['test/**/*.test.{js,jsx}'],
    
    // Files to exclude
    exclude: [
      'node_modules/**',
      'dist/**'
    ],
    
    // Global setup
    globals: true,
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': './src',
      '@test': './test'
    }
  }
});
