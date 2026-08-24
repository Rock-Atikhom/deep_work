import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const manifest = readFileSync(resolve("extension/manifest.json"), "utf8");

function emitManifest(): Plugin {
  return {
    name: "emit-extension-manifest",
    generateBundle() {
      this.emitFile({
        fileName: "manifest.json",
        source: manifest,
        type: "asset",
      });
    },
  };
}

export default defineConfig({
  root: resolve("extension/src"),
  build: {
    emptyOutDir: true,
    outDir: resolve("dist-extension"),
    rollupOptions: {
      input: {
        background: resolve("extension/src/background.ts"),
        content: resolve("extension/src/content.ts"),
        popup: resolve("extension/src/popup.html"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "es",
      },
    },
    target: "es2022",
  },
  plugins: [emitManifest()],
  publicDir: false,
});
