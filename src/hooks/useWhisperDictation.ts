import { useState, useCallback, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";

/** Duration of each audio segment sent to Whisper (ms). */
const SEGMENT_MS = 3000;

// ── Module-level singletons (shared across all hook instances) ────────────────
let sharedWorker: Worker | null = null;
let workerInitPromise: Promise<void> | null = null;

// Pending transcription callbacks keyed by request id.
const pendingCallbacks = new Map<number, (text: string) => void>();
let nextId = 0;

// Progress subscribers (same broadcast pattern as useContentModeration).
type ProgressUpdate = { progress?: number; status: string };
type ProgressListener = (update: ProgressUpdate) => void;
const progressListeners = new Set<ProgressListener>();

function broadcast(update: ProgressUpdate) {
  progressListeners.forEach((fn) => fn(update));
}

// ── Worker message types (mirrored from whisper.worker.ts) ────────────────────
type WorkerOutbound =
  | { type: "progress"; progress: number; status: string }
  | { type: "ready" }
  | { type: "device"; device: "webgpu" | "wasm" }
  | { type: "result"; id: number; text: string }
  | { type: "error"; message: string };

// ── Audio helpers (must run on main thread — OfflineAudioContext not in workers) ──

async function blobToFloat32At16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const decodeCtx = new AudioContext();
  const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  await decodeCtx.close();

  const targetRate = 16000;
  const lengthAt16k = Math.ceil(decoded.duration * targetRate);
  const offCtx = new OfflineAudioContext(1, lengthAt16k, targetRate);
  const src = offCtx.createBufferSource();
  src.buffer = decoded;
  src.connect(offCtx.destination);
  src.start(0);
  const resampled = await offCtx.startRendering();
  return resampled.getChannelData(0);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface WhisperDictationOptions {
  editor: Editor | null;
  onError?: (msg: string) => void;
}

export function useWhisperDictation({
  editor,
  onError,
}: WhisperDictationOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const editorRef = useRef<Editor | null>(editor);
  const onErrorRef = useRef(onError);
  editorRef.current = editor;
  onErrorRef.current = onError;

  const activeRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // ── Progress subscription ────────────────────────────────────────────────────
  useEffect(() => {
    const listener: ProgressListener = ({ progress }) => {
      if (progress !== undefined) setLoadProgress(progress);
    };
    progressListeners.add(listener);
    return () => {
      progressListeners.delete(listener);
    };
  }, []);

  // ── Worker init ──────────────────────────────────────────────────────────────
  const initWorker = useCallback((): Promise<boolean> => {
    if (sharedWorker && workerInitPromise === null)
      return Promise.resolve(true);

    if (workerInitPromise) {
      return workerInitPromise.then(() => !!sharedWorker);
    }

    setIsLoading(true);
    setLoadProgress(0);
    broadcast({ progress: 0, status: "Loading Whisper…" });

    workerInitPromise = new Promise<void>((resolve, reject) => {
      const worker = new Worker(
        new URL("../workers/whisper.worker.ts", import.meta.url),
        { type: "module" },
      );

      worker.onmessage = (e: MessageEvent<WorkerOutbound>) => {
        const msg = e.data;
        if (msg.type === "progress") {
          broadcast({ progress: msg.progress, status: msg.status });
        } else if (msg.type === "ready") {
          sharedWorker = worker;
          resolve();
        } else if (msg.type === "result") {
          const cb = pendingCallbacks.get(msg.id);
          if (cb) {
            pendingCallbacks.delete(msg.id);
            cb(msg.text);
          }
        } else if (msg.type === "error") {
          onErrorRef.current?.(msg.message);
          reject(new Error(msg.message));
        }
        // 'device' message is informational — ignored for now.
      };

      worker.onerror = (err) => {
        console.error("[Whisper] Worker error:", err);
        reject(err);
      };

      worker.postMessage({ type: "init" });
    });

    return workerInitPromise
      .then(() => {
        setIsLoading(false);
        return true;
      })
      .catch((err) => {
        console.error("[Whisper] Worker init failed:", err);
        workerInitPromise = null; // allow retry
        setIsLoading(false);
        onErrorRef.current?.("Failed to load Whisper model.");
        return false;
      });
  }, []);

  // ── Transcription (main-thread audio decode → worker inference) ───────────────
  const transcribeBlob = useCallback(async (blob: Blob) => {
    if (!sharedWorker || blob.size < 1000) return;
    let audio: Float32Array;
    try {
      audio = await blobToFloat32At16k(blob);
    } catch {
      return; // decode failed (e.g. empty segment)
    }
    if (audio.length < 1600) return; // < 0.1 s — skip

    const id = nextId++;
    await new Promise<void>((resolve) => {
      pendingCallbacks.set(id, (text) => {
        if (text && editorRef.current) {
          editorRef.current
            .chain()
            .focus()
            .insertContent(text + " ")
            .run();
        }
        resolve();
      });
      // Transfer the buffer — avoids a 192 KB memcopy.
      sharedWorker!.postMessage({ type: "transcribe", id, audio }, [
        audio.buffer,
      ]);
    });
  }, []);

  // ── Recording loop with overlap ──────────────────────────────────────────────
  // recordSegment starts immediately after the previous recorder stops,
  // so recording and transcription run in parallel.
  const recordSegment = useCallback(
    (stream: MediaStream) => {
      if (!activeRef.current) return;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        // Overlap: kick off the next segment immediately before we process this one.
        if (activeRef.current) recordSegment(stream);

        const blob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });
        void transcribeBlob(blob);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, SEGMENT_MS);
    },
    [transcribeBlob],
  );

  // ── Public API ────────────────────────────────────────────────────────────────
  const startDictation = useCallback(async () => {
    if (activeRef.current) return;

    const ready = await initWorker();
    if (!ready) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch {
      onErrorRef.current?.("Microphone access denied.");
      return;
    }

    streamRef.current = stream;
    activeRef.current = true;
    setIsRecording(true);

    recordSegment(stream);
  }, [initWorker, recordSegment]);

  const stopDictation = useCallback(() => {
    activeRef.current = false;
    // Stop the active recorder so its onstop fires and releases the mic segment.
    // The onstop guard (activeRef.current === false) prevents a new segment from starting.
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  }, []);

  const toggleDictation = useCallback(async () => {
    if (isRecording) {
      stopDictation();
    } else {
      await startDictation();
    }
  }, [isRecording, startDictation, stopDictation]);

  // Cleanup on unmount (stop mic; keep worker alive for re-use).
  useEffect(() => {
    return () => {
      activeRef.current = false;
      recorderRef.current?.state === "recording" && recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    isLoading,
    loadProgress,
    isRecording,
    toggleDictation,
  };
}
