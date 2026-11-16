import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.{ts,tsx}"], environment: "jsdom" },
});
