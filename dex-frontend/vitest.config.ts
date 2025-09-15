import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 10000, // 10 seconds timeout
    hookTimeout: 10000, // 10 seconds for hooks
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
