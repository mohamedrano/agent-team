// ═══════════════════════════════════════════════════════════════════════════════
// Vitest Configuration - Testing Framework Configuration
// ═══════════════════════════════════════════════════════════════════════════════

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@agent-team/orchestration": path.resolve(rootDir, "packages/orchestration/src/index.ts"),
      "@agent-team/communication": path.resolve(rootDir, "packages/communication/src/index.ts"),
    },
  },
  test: {
    // Use globals for describe, it, expect, etc.
    globals: true,

    // Test file patterns
    include: [
      "apps/server/src/**/*.test.ts",
      "apps/server/src/**/*.spec.ts",
      "apps/server/test/**/*.test.ts",
      "apps/server/test/**/*.spec.ts",
      "packages/communication/tests/**/*.test.ts",
      "packages/communication/tests/**/*.spec.ts",
    ],

    // Exclude patterns
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      all: true,
      lines: 0.8,
      functions: 0.8,
      branches: 0.8,
      statements: 0.8,
    },

    // Timeouts
    testTimeout: 30000, // 30 seconds (for long-running pipeline tests)
    hookTimeout: 60000, // 60 seconds for setup/teardown

    // Reporter configuration
    reporters: process.env.CI ? ["verbose", "json"] : ["verbose"],

    // Environment
    environment: "node",

    // Setup files
    setupFiles: [],

    // Watch mode
    watch: false,

    // Threads
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Retry failed tests in CI
    retry: process.env.CI ? 2 : 0,

    // Pool options
    pool: "threads",

    // Sequence
    sequence: {
      shuffle: false,
    },

    // Mock reset
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
});
