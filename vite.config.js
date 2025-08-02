import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/**',
        '**/*.test.js',
        '**/*.config.js',
        'coverage/**',
        'dist/**'
      ],
      include: ['js/**/*.js'],
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80
        }
      }
    }
  },
}); 