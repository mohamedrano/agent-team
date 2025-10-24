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
      "packages/ai/tests/**/*.test.ts",
      "packages/ai/tests/**/*.spec.ts",
      "packages/orchestration/tests/**/*.test.ts",
      "packages/orchestration/tests/**/*.spec.ts",
    ],

    // Exclude patterns
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],

    // Coverage configuration with MANDATORY thresholds - ZERO TOLERANCE POLICY ⚠️
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      all: true,
      include: [
        "packages/*/src/**/*.{ts,tsx}",
        "apps/*/src/**/*.{ts,tsx}"
      ],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/*.d.ts",
        "**/index.ts", // Only if simple export-only files
        "**/types.ts", // Only if pure interfaces/types
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/__tests__/**",
        "**/__mocks__/**"
      ],
      // MANDATORY THRESHOLDS - NO EXCEPTIONS ALLOWED
      thresholds: {
        global: {
          branches: 85,    // Absolute minimum - cannot be lower
          functions: 90,   // Absolute minimum - cannot be lower
          lines: 85,       // Absolute minimum - cannot be lower
          statements: 85,  // Absolute minimum - cannot be lower
        },
        // STRICTER REQUIREMENTS for critical files
        "packages/ai/src/**/*.{ts,tsx}": {
          branches: 95,
          functions: 100,  // 100% - NO ROOM FOR ERROR
          lines: 95,
          statements: 95,
        },
        "packages/orchestration/src/**/*.{ts,tsx}": {
          branches: 95,
          functions: 100,  // 100% - CRITICAL LOGIC
          lines: 95,
          statements: 95,
        },
        "packages/communication/src/**/*.{ts,tsx}": {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90,
        },
        "apps/server/src/**/*.{ts,tsx}": {
          branches: 85,
          functions: 90,
          lines: 85,
          statements: 85,
        },
        "**/utils/**/*.{ts,tsx}": {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        "**/core/**/*.{ts,tsx}": {
          branches: 95,
          functions: 100,  // 100% - BUSINESS CRITICAL
          lines: 95,
          statements: 95,
        },
        "**/services/**/*.{ts,tsx}": {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90,
        },
      },
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
