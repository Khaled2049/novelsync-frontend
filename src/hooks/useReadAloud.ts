import { useState, useCallback, useRef, useEffect } from "react";

// ── Module-level singletons (shared across all hook instances) ────────────────
// The worker (and its downloaded model) stays alive across unmounts, mirroring
// useWhisperDictation.
let sharedWorker: Worker | null = null;
let workerInitPromise: Promise<void> | null = null;
let sharedDevice: "webgpu" | "wasm" | null = null;
let nextRequestId = 0;

// Progress subscribers (same broadcast pattern as useWhisperDictation).
type ProgressUpdate = { progress?: number; status: string };
type ProgressListener = (update: ProgressUpdate) => void;
const progressListeners = new Set<ProgressListener>();

function broadcast(update: ProgressUpdate) {
  progressListeners.forEach((fn) => fn(update));
}

// Only one read-aloud session plays at a time; chunk/done/error messages are
// routed to whichever hook instance owns the current requestId.
interface SessionHandlers {
  requestId: number;
  onChunk: (msg: ChunkMsg) => void;
  onDone: () => void;
  onError: (message: string) => void;
}
let activeSession: SessionHandlers | null = null;

// ── Worker message types (mirrored from kokoro.worker.ts) ─────────────────────
interface ChunkMsg {
  type: "chunk";
  requestId: number;
  index: number;
  audio: Float32Array<ArrayBuffer>;
  sampleRate: number;
  text: string;
  start: number;
  end: number;
}

type WorkerOutbound =
  | { type: "progress"; progress: number; status: string }
  | { type: "ready" }
  | { type: "device"; device: "webgpu" | "wasm" }
  | ChunkMsg
  | { type: "done"; requestId: number }
  | { type: "error"; requestId?: number; message: string };

// ── Hook ──────────────────────────────────────────────────────────────────────

export type ReadAloudStatus =
  | "idle"
  | "loading"
  | "buffering"
  | "playing"
  | "paused"
  | "error";

export interface ReadAloudOptions {
  /** Plain text to read (chapter plainText). */
  text: string;
  voice: string;
  speed: number;
  onError?: (msg: string) => void;
}

interface ScheduledChunk {
  index: number;
  start: number;
  end: number;
  source: AudioBufferSourceNode;
}

export function useReadAloud({ text, voice, speed, onError }: ReadAloudOptions) {
  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [device, setDevice] = useState<"webgpu" | "wasm" | null>(sharedDevice);
  const [spokenRange, setSpokenRangeState] = useState<{
    start: number;
    end: number;
  } | null>(null);
  // Ref twin of spokenRange so restarts can read the position synchronously.
  const spokenRangeRef = useRef<{ start: number; end: number } | null>(null);
  const setSpokenRange = useCallback(
    (range: { start: number; end: number } | null) => {
      spokenRangeRef.current = range;
      setSpokenRangeState(range);
    },
    [],
  );

  const textRef = useRef(text);
  const voiceRef = useRef(voice);
  const speedRef = useRef(speed);
  const onErrorRef = useRef(onError);
  textRef.current = text;
  voiceRef.current = voice;
  speedRef.current = speed;
  onErrorRef.current = onError;

  const statusRef = useRef(status);
  statusRef.current = status;

  // Playback engine state (refs — never triggers renders).
  const audioCtxRef = useRef<AudioContext | null>(null);
  const requestIdRef = useRef(-1);
  const queueRef = useRef<ScheduledChunk[]>([]);
  const nextStartTimeRef = useRef(0);
  const doneRef = useRef(false);
  // Offset of the current session's text within the full chapter text (used
  // when restarting mid-chapter after a voice/speed change).
  const resumeBaseRef = useRef(0);
  // Bumped by stop(); invalidates sessions still awaiting the model download.
  const playEpochRef = useRef(0);

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
    if (sharedWorker && workerInitPromise === null) {
      setDevice(sharedDevice);
      return Promise.resolve(true);
    }

    if (workerInitPromise) {
      return workerInitPromise.then(() => {
        setDevice(sharedDevice);
        return !!sharedWorker;
      });
    }

    setLoadProgress(0);
    broadcast({ progress: 0, status: "Loading voice…" });

    workerInitPromise = new Promise<void>((resolve, reject) => {
      const worker = new Worker(
        new URL("../workers/kokoro.worker.ts", import.meta.url),
        { type: "module" },
      );

      worker.onmessage = (e: MessageEvent<WorkerOutbound>) => {
        const msg = e.data;
        if (msg.type === "progress") {
          broadcast({ progress: msg.progress, status: msg.status });
        } else if (msg.type === "device") {
          sharedDevice = msg.device;
        } else if (msg.type === "ready") {
          sharedWorker = worker;
          workerInitPromise = null;
          resolve();
        } else if (msg.type === "chunk") {
          if (msg.requestId === activeSession?.requestId) {
            activeSession.onChunk(msg);
          }
        } else if (msg.type === "done") {
          if (msg.requestId === activeSession?.requestId) {
            activeSession.onDone();
          }
        } else if (msg.type === "error") {
          if (msg.requestId === undefined) {
            reject(new Error(msg.message)); // init failure
          } else if (msg.requestId === activeSession?.requestId) {
            activeSession.onError(msg.message);
          }
        }
      };

      worker.onerror = (err) => {
        console.error("[ReadAloud] Worker error:", err);
        reject(new Error("Voice worker failed."));
      };

      worker.postMessage({ type: "init" });
    });

    return workerInitPromise
      .then(() => {
        setDevice(sharedDevice);
        return true;
      })
      .catch((err) => {
        console.error("[ReadAloud] Worker init failed:", err);
        workerInitPromise = null; // allow retry
        onErrorRef.current?.("Failed to load the voice model.");
        return false;
      });
  }, []);

  // ── Playback internals ───────────────────────────────────────────────────────

  const teardownPlayback = useCallback(() => {
    for (const { source } of queueRef.current) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // already stopped / never started
      }
      source.disconnect();
    }
    queueRef.current = [];
    nextStartTimeRef.current = 0;
    doneRef.current = false;
  }, []);

  const stop = useCallback(() => {
    playEpochRef.current++;
    requestIdRef.current = -1;
    activeSession = null;
    sharedWorker?.postMessage({ type: "stop" });
    teardownPlayback();
    // Leave the context suspended/closed state alone; play() resumes it.
    setSpokenRange(null);
    setStatus("idle");
  }, [teardownPlayback, setSpokenRange]);

  const handleChunk = useCallback((msg: ChunkMsg) => {
    const ctx = audioCtxRef.current;
    if (!ctx || msg.requestId !== requestIdRef.current) return;

    const buffer = ctx.createBuffer(1, msg.audio.length, msg.sampleRate);
    buffer.copyToChannel(msg.audio, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const base = resumeBaseRef.current;
    const entry: ScheduledChunk = {
      index: msg.index,
      start: base + msg.start,
      end: base + msg.end,
      source,
    };

    const wasEmpty = queueRef.current.length === 0;
    queueRef.current.push(entry);

    // Underrun recovery: if synthesis fell behind playback, restart the
    // timeline from "now" (brief gap) instead of scheduling in the past.
    const startAt = Math.max(ctx.currentTime + 0.02, nextStartTimeRef.current);
    nextStartTimeRef.current = startAt + buffer.duration;

    source.onended = () => {
      if (msg.requestId !== requestIdRef.current) return;
      queueRef.current = queueRef.current.filter((c) => c !== entry);
      sharedWorker?.postMessage({
        type: "ack",
        requestId: msg.requestId,
        index: msg.index,
      });
      const next = queueRef.current[0];
      if (next) {
        setSpokenRange({ start: next.start, end: next.end });
      } else if (doneRef.current) {
        // Finished the chapter.
        requestIdRef.current = -1;
        activeSession = null;
        nextStartTimeRef.current = 0;
        doneRef.current = false;
        setSpokenRange(null);
        setStatus("idle");
      } else {
        setStatus("buffering");
      }
    };

    source.start(startAt);

    if (wasEmpty) {
      // This chunk begins playing (nothing was queued before it).
      setSpokenRange({ start: entry.start, end: entry.end });
      setStatus("playing");
    }
  }, [setSpokenRange]);

  const startSession = useCallback(
    async (fromOffset: number) => {
      const epoch = playEpochRef.current;
      const ready = await initWorker();
      if (epoch !== playEpochRef.current) return; // stopped while loading
      if (!ready || !sharedWorker) {
        setStatus("error");
        return;
      }

      const fullText = textRef.current;
      const sessionText = fromOffset > 0 ? fullText.slice(fromOffset) : fullText;
      if (!sessionText.trim()) {
        setStatus("idle");
        return;
      }

      const requestId = nextRequestId++;
      requestIdRef.current = requestId;
      resumeBaseRef.current = fromOffset;
      doneRef.current = false;
      nextStartTimeRef.current = 0;

      activeSession = {
        requestId,
        onChunk: handleChunk,
        onDone: () => {
          if (requestId !== requestIdRef.current) return;
          doneRef.current = true;
          if (queueRef.current.length === 0) {
            // Everything already finished playing.
            requestIdRef.current = -1;
            activeSession = null;
            doneRef.current = false;
            setSpokenRange(null);
            setStatus("idle");
          }
        },
        onError: (message) => {
          if (requestId !== requestIdRef.current) return;
          teardownPlayback();
          requestIdRef.current = -1;
          activeSession = null;
          setSpokenRange(null);
          setStatus("error");
          onErrorRef.current?.(message);
        },
      };

      setStatus("buffering");
      sharedWorker.postMessage({
        type: "speak",
        requestId,
        text: sessionText,
        voice: voiceRef.current,
        speed: speedRef.current,
      });
    },
    [initWorker, handleChunk, teardownPlayback, setSpokenRange],
  );

  // ── Public API ────────────────────────────────────────────────────────────────

  const play = useCallback(async () => {
    // Create/resume the AudioContext inside the user gesture (iOS requirement).
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    void audioCtxRef.current.resume();

    if (statusRef.current === "paused") {
      setStatus("playing");
      return;
    }
    if (statusRef.current === "playing" || statusRef.current === "buffering") {
      return;
    }
    if (statusRef.current === "idle" || statusRef.current === "error") {
      // Model may still need downloading — reflect that until ready.
      if (!sharedWorker) setStatus("loading");
      await startSession(0);
    }
  }, [startSession]);

  const pause = useCallback(() => {
    if (statusRef.current !== "playing" && statusRef.current !== "buffering")
      return;
    void audioCtxRef.current?.suspend();
    setStatus("paused");
  }, []);

  // ── Voice / speed changes: restart from the current sentence ─────────────────
  // Debounced so dragging the speed slider doesn't restart on every tick.
  useEffect(() => {
    if (
      statusRef.current === "idle" ||
      statusRef.current === "error" ||
      statusRef.current === "loading"
    )
      return;

    const timer = setTimeout(() => {
      const resumeOffset =
        spokenRangeRef.current?.start ?? resumeBaseRef.current;

      sharedWorker?.postMessage({ type: "stop" });
      teardownPlayback();
      // Changing settings implies wanting to hear the result, even if paused.
      void audioCtxRef.current?.resume();
      void startSession(resumeOffset);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, speed]);

  // ── Text changes (chapter navigation) and unmount: stop everything ───────────
  useEffect(() => {
    return () => {
      // Runs on text change and unmount.
      stop();
    };
  }, [text, stop]);

  return {
    status,
    loadProgress,
    device,
    spokenRange,
    play,
    pause,
    stop,
  };
}
