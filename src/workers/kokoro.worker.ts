/// <reference lib="webworker" />

import "@/lib/transformersConfig";
import {
  KokoroTTS,
  TextSplitterStream,
  type GenerateOptions,
} from "kokoro-js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

// Keep synthesis at most this many sentences ahead of playback. Without the
// gate a long chapter would buffer its entire PCM (~96 KB/s of f32) in memory.
const BUFFER_AHEAD = 4;

// ── Singleton model ───────────────────────────────────────────────────────────
let tts: KokoroTTS | null = null;

// ── Message types ─────────────────────────────────────────────────────────────
type InboundMsg =
  | { type: "init" }
  | { type: "speak"; requestId: number; text: string; voice: string; speed: number }
  | { type: "ack"; requestId: number; index: number }
  | { type: "stop" };

type OutboundMsg =
  | { type: "progress"; progress: number; status: string }
  | { type: "ready" }
  | { type: "device"; device: "webgpu" | "wasm" }
  | {
      type: "chunk";
      requestId: number;
      index: number;
      audio: Float32Array;
      sampleRate: number;
      text: string;
      /** Half-open [start, end) offsets of this chunk into the speak text. */
      start: number;
      end: number;
    }
  | { type: "done"; requestId: number }
  | { type: "error"; requestId?: number; message: string };

function post(msg: OutboundMsg, transfer?: Transferable[]) {
  self.postMessage(msg, { transfer });
}

// ── Model factory ─────────────────────────────────────────────────────────────
async function createModel(device: "webgpu" | "wasm"): Promise<KokoroTTS> {
  return KokoroTTS.from_pretrained(MODEL_ID, {
    device,
    // Quantized weights misbehave on WebGPU; q8 keeps the WASM download ~90 MB.
    dtype: device === "webgpu" ? "fp32" : "q8",
    progress_callback: (info: unknown) => {
      const i = info as { status: string; file?: string; progress?: number };
      if (i.status === "progress" && i.progress !== undefined) {
        post({
          type: "progress",
          progress: i.progress / 100,
          status: `Downloading ${i.file ?? "model"}…`,
        });
      } else if (i.status === "ready") {
        post({ type: "progress", progress: 1, status: "Voice ready" });
      }
    },
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    tts = await createModel("webgpu");
    post({ type: "device", device: "webgpu" });
  } catch {
    try {
      tts = await createModel("wasm");
      post({ type: "device", device: "wasm" });
    } catch (err) {
      post({ type: "error", message: "Failed to load the voice model." });
      console.error("[kokoro-worker] Init failed:", err);
      return;
    }
  }
  post({ type: "ready" });
}

// ── Speak session ─────────────────────────────────────────────────────────────
// Single active session; a new `speak` (or `stop`) marks the previous one stale
// via `activeRequestId` and its loop exits at the next iteration.
let activeRequestId = -1;
let lastAckedIndex = -1;
let releaseGate: (() => void) | null = null;

// Sessions are chained so two streams never run inference concurrently.
let sessionChain: Promise<void> = Promise.resolve();

function releasePending() {
  releaseGate?.();
  releaseGate = null;
}

async function waitForPlaybackAck(index: number, requestId: number) {
  while (
    requestId === activeRequestId &&
    index - lastAckedIndex > BUFFER_AHEAD
  ) {
    await new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
  }
}

interface SpeakJob {
  requestId: number;
  text: string;
  voice: string;
  speed: number;
}

async function runSpeak(job: SpeakJob) {
  if (job.requestId !== activeRequestId) return; // superseded while queued
  if (!tts) {
    post({
      type: "error",
      requestId: job.requestId,
      message: "Voice model is not loaded.",
    });
    return;
  }

  try {
    const splitter = new TextSplitterStream();
    splitter.push(job.text);
    splitter.close();

    const stream = tts.stream(splitter, {
      voice: job.voice as GenerateOptions["voice"],
      speed: job.speed,
    });

    let index = 0;
    let cursor = 0;
    for await (const { text, audio } of stream) {
      if (job.requestId !== activeRequestId) break;

      // Map the chunk back to offsets in the source text (the splitter may
      // trim whitespace, so search from the running cursor).
      const found = job.text.indexOf(text, cursor);
      const start = found !== -1 ? found : cursor;
      const end = start + text.length;
      cursor = end;

      const pcm = audio.audio;
      post(
        {
          type: "chunk",
          requestId: job.requestId,
          index,
          audio: pcm,
          sampleRate: audio.sampling_rate,
          text,
          start,
          end,
        },
        [pcm.buffer],
      );

      // Backpressure: the stream generator is pull-based, so awaiting here
      // genuinely pauses synthesis until playback catches up.
      await waitForPlaybackAck(index, job.requestId);
      index++;
    }

    if (job.requestId === activeRequestId) {
      post({ type: "done", requestId: job.requestId });
    }
  } catch (err) {
    console.error("[kokoro-worker] Synthesis error:", err);
    if (job.requestId === activeRequestId) {
      post({
        type: "error",
        requestId: job.requestId,
        message: "Speech generation failed.",
      });
    }
  }
}

// ── Message handler ───────────────────────────────────────────────────────────
self.onmessage = (e: MessageEvent<InboundMsg>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init":
      void init();
      return;
    case "speak": {
      activeRequestId = msg.requestId;
      lastAckedIndex = -1;
      releasePending(); // unblock a stale session so it can exit
      const job: SpeakJob = { ...msg };
      sessionChain = sessionChain.then(() => runSpeak(job));
      return;
    }
    case "ack":
      if (msg.requestId === activeRequestId) {
        lastAckedIndex = Math.max(lastAckedIndex, msg.index);
        releasePending();
      }
      return;
    case "stop":
      activeRequestId = -1;
      releasePending();
      return;
  }
};
