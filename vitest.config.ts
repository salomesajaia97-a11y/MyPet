import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests only — pure functions, no DOM and no database. `next build` cannot
// run on the dev machine (OOM), so this is the fast local correctness gate.
export default defineConfig({
  // The OG card tests import a .tsx route file; the app's tsconfig sets
  // jsx: "preserve" for Next, so tell esbuild to actually transform it.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
