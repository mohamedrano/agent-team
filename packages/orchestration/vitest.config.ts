import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      all: true,
      lines: 0.8,
      functions: 0.8,
      branches: 0.8,
      statements: 0.8,
      include: ["src/**/*.ts"],
      exclude: ["src/**/__fixtures__/**"]
    }
  }
});
