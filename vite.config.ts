import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "analyze" &&
      visualizer({
        open: true,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer/",
    },
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    include: ["buffer"],
    // Pre-bundling this package causes stale "504 Outdated Optimize Dep" errors in dev
    // (WASM/workers + size). Load it as native ESM instead.
    exclude: ["@huggingface/transformers"],
  },
}));
