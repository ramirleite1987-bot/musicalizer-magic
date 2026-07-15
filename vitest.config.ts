import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/test/**/*.test.{ts,tsx}"],
    css: true,
  },
  resolve: {
    alias: {
      // Server-only modules can't load in the jsdom environment
      "server-only": path.resolve(__dirname, "./src/test/stubs/empty.ts"),
      "@clerk/nextjs/server": path.resolve(
        __dirname,
        "./src/test/stubs/clerk-server.ts"
      ),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

