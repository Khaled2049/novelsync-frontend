/// <reference lib="webworker" />

import {
  pipeline,
  type AutomaticSpeechRecognitionPipeline,
} from "@huggingface/transformers";

const MODEL_ID = "Xenova/whisper-tiny.en";

// ── Singleton pipeline ────────────────────────────────────────────────────────
let asr: AutomaticSpeechRecognitionPipeline | null = null;

// ── Inference queue ───────────────────────────────────────────────────────────
// Allows the hook to send segments while a previous inference is still running.
// Each item mirrors the inbound 'transcribe' message shape.
interface TranscribeJob {
  id: number;
  audio: Float32Array;
}
const queue: TranscribeJob[] = [];
let isBusy = false;

// ── Message types ─────────────────────────────────────────────────────────────
type InboundMsg =
  | { type: "init" }
  | { type: "transcribe"; id: number; audio: Float32Array };

type OutboundMsg =
  | { type: "progress"; progress: number; status: string }
  | { type: "ready" }
  | { type: "device"; device: "webgpu" | "wasm" }
  | { type: "result"; id: number; text: string }
  | { type: "error"; message: string };

function post(msg: OutboundMsg) {
  self.postMessage(msg);
}

// ── Pipeline factory ──────────────────────────────────────────────────────────
async function createPipeline(
  device: "webgpu" | "wasm",
): Promise<AutomaticSpeechRecognitionPipeline> {
  // Cast via unknown to bypass the overly-complex pipeline overload union.
  const p = pipeline as (
    task: string,
    model: string,
    options: Record<string, unknown>,
  ) => Promise<AutomaticSpeechRecognitionPipeline>;
  return p("automatic-speech-recognition", MODEL_ID, {
    device,
    progress_callback: (info: unknown) => {
      const i = info as { status: string; file?: string; progress?: number };
      if (i.status === "progress" && i.progress !== undefined) {
        post({
          type: "progress",
          progress: i.progress / 100,
          status: `Downloading ${i.file ?? "model"}…`,
        });
      } else if (i.status === "ready") {
        post({ type: "progress", progress: 1, status: "Whisper ready" });
      }
    },
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    asr = await createPipeline("webgpu");
    post({ type: "device", device: "webgpu" });
  } catch {
    try {
      asr = await createPipeline("wasm");
      post({ type: "device", device: "wasm" });
    } catch (err) {
      post({ type: "error", message: "Failed to load Whisper model." });
      console.error("[whisper-worker] Init failed:", err);
      return;
    }
  }
  post({ type: "ready" });
}

// ── Inference ─────────────────────────────────────────────────────────────────
async function runInference(job: TranscribeJob) {
  isBusy = true;
  try {
    const result = await asr!(job.audio);
    const text =
      (Array.isArray(result)
        ? result[0]?.text
        : (result as { text: string })?.text
      )?.trim() ?? "";
    post({ type: "result", id: job.id, text });
  } catch (err) {
    console.error("[whisper-worker] Inference error:", err);
    // Still post a result so the hook's pending callback resolves.
    post({ type: "result", id: job.id, text: "" });
  } finally {
    isBusy = false;
    const next = queue.shift();
    if (next) void runInference(next);
  }
}

// ── Message handler ───────────────────────────────────────────────────────────
self.onmessage = (e: MessageEvent<InboundMsg>) => {
  const msg = e.data;
  if (msg.type === "init") {
    void init();
    return;
  }
  if (msg.type === "transcribe") {
    if (isBusy) {
      queue.push({ id: msg.id, audio: msg.audio });
    } else {
      void runInference({ id: msg.id, audio: msg.audio });
    }
  }
};
