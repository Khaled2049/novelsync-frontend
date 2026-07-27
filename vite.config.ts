import fs from "fs";
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * Self-host the ONNX Runtime WASM backend used by @huggingface/transformers.
 *
 * transformers.js otherwise loads these from the jsdelivr CDN, which our strict
 * production CSP (`script-src 'self'`) blocks. We serve them same-origin from
 * `/ort/` — via dev middleware in `yarn dev` and by copying into `dist/ort/` on
 * build. Keep in sync with `env.backends.onnx.wasm.wasmPaths` in
 * `src/lib/transformersConfig.ts`.
 */
function serveOrtWasm(): Plugin {
  const ortDist = path.resolve(__dirname, "node_modules/onnxruntime-web/dist");
  const files = [
    "ort-wasm-simd-threaded.jsep.mjs",
    "ort-wasm-simd-threaded.jsep.wasm",
    "ort-wasm-simd-threaded.mjs",
    "ort-wasm-simd-threaded.wasm",
  ];
  const contentType = (file: string) =>
    file.endsWith(".wasm") ? "application/wasm" : "text/javascript";

  return {
    name: "serve-ort-wasm",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/ort\/([^?]+)/);
        const file = match?.[1];
        if (!file || !files.includes(file)) return next();
        const full = path.join(ortDist, file);
        if (!fs.existsSync(full)) return next();
        res.setHeader("Content-Type", contentType(file));
        fs.createReadStream(full).pipe(res);
      });
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist/ort");
      fs.mkdirSync(outDir, { recursive: true });
      for (const file of files) {
        const src = path.join(ortDist, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(outDir, file));
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    serveOrtWasm(),
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
    // Pre-bundling these packages causes stale "504 Outdated Optimize Dep" errors in dev
    // (WASM/workers + size). kokoro-js must also stay unbundled so it resolves the same
    // @huggingface/transformers copy that transformersConfig.ts configures.
    exclude: ["@huggingface/transformers", "kokoro-js"],
  },
}));
