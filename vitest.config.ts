/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    // Don't run Playwright e2e tests via Vitest
    exclude: ['node_modules', 'dist', 'e2e', '.idea', '.git', '.cache'],
    // Split fast unit tests from slower integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'dist', 'e2e', '**/*.config.*', '**/*.d.ts'],
    },
  },
})
