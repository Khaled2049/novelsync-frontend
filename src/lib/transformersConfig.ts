import { env } from "@huggingface/transformers";

/**
 * Shared configuration for @huggingface/transformers, applied as a side effect.
 * Import this module once before any `pipeline()` call.
 *
 * By default transformers.js loads the ONNX Runtime WASM backend
 * (`ort-wasm-simd-threaded.jsep.mjs` + `.wasm`) from the jsdelivr CDN, which our
 * production Content-Security-Policy (`script-src 'self'`) rightly blocks. We
 * copy those files into `/ort/` at build time (see the `serve-ort-wasm` plugin
 * in vite.config.ts) and serve them same-origin instead.
 *
 * Model weights are still fetched from huggingface.co (allowed via `connect-src`
 * in the CSP) — only the executable WASM runtime is self-hosted.
 */
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = "/ort/";
}

export {};
