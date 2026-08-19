import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? "/deep_work/" : "/",
  build: { target: "es2022" },
  plugins: [react(), tailwindcss()],
  worker: {
    rollupOptions: {
      output: { entryFileNames: "assets/[name].js" },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
