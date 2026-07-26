import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests only — pure functions, no DOM and no database. `next build` cannot
// run on the dev machine (OOM), so this is the fast local correctness gate.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
