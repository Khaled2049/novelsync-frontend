import { useState, useCallback, useEffect } from "react";
import "@/lib/transformersConfig";
import {
  pipeline,
  type TextClassificationPipeline,
} from "@huggingface/transformers";

export interface ModerationResult {
  flagged: boolean;
  reason: string;
}

const MODEL_ID = "Xenova/toxic-bert";

/** Default threshold for toxicity heads (sigmoid scores). */
const DEFAULT_THRESHOLD = 0.85;

/** Stricter sensitivity for threat and identity-based hate. */
const LABEL_THRESHOLDS: Record<string, number> = {
  toxic: DEFAULT_THRESHOLD,
  severe_toxic: DEFAULT_THRESHOLD,
  obscene: DEFAULT_THRESHOLD,
  insult: DEFAULT_THRESHOLD,
  threat: 0.55,
  identity_hate: 0.55,
};

const LABEL_REASON: Record<string, string> = {
  toxic: "Potentially toxic language detected.",
  severe_toxic: "Potentially harmful language detected.",
  obscene: "Potentially obscene language detected.",
  threat: "Potential threat detected.",
  insult: "Potentially insulting language detected.",
  identity_hate: "Potential identity-based harassment detected.",
};

type LabelScore = { label: string; score: number };

function evaluateScores(items: LabelScore[]): ModerationResult {
  let best: LabelScore | null = null;
  for (const item of items) {
    const key = item.label.toLowerCase();
    const threshold = LABEL_THRESHOLDS[key] ?? DEFAULT_THRESHOLD;
    if (item.score >= threshold && (!best || item.score > best.score)) {
      best = item;
    }
  }
  if (!best) return { flagged: false, reason: "" };
  return {
    flagged: true,
    reason:
      LABEL_REASON[best.label.toLowerCase()] ??
      "Potentially harmful content detected.",
  };
}

// ── Module-level singleton ────────────────────────────────────────────────────
let sharedClassifier: TextClassificationPipeline | null = null;
let classifierInitPromise: Promise<void> | null = null;

// All mounted hook instances subscribe here to receive live progress events.
type ProgressUpdate = { progress?: number; status: string };
type ProgressListener = (update: ProgressUpdate) => void;
const progressListeners = new Set<ProgressListener>();

function broadcast(update: ProgressUpdate) {
  progressListeners.forEach((fn) => fn(update));
}

type HubProgress =
  | { status: "progress"; file: string; progress: number }
  | { status: "initiate" | "download"; file: string; name?: string }
  | { status: "done"; file: string }
  | { status: "ready"; task: string; model: string };

function hubProgressToUpdate(info: HubProgress): ProgressUpdate | null {
  switch (info.status) {
    case "progress":
      return { progress: info.progress / 100, status: "Loading…" };
    case "initiate":
    case "download":
      return { status: "Loading…" };
    case "done":
      return { status: "Loading…" };
    case "ready":
      return { progress: 1, status: "Ready" };
    default:
      return null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export function useContentModeration() {
  // Initialise isInitializing to true if a load is already in flight when this
  // component mounts (e.g. another instance started it first).
  const [isInitializing, setIsInitializing] = useState(
    () => classifierInitPromise !== null && sharedClassifier === null,
  );
  const [initProgress, setInitProgress] = useState(0);
  const [initStatusText, setInitStatusText] = useState("");

  // Subscribe to broadcast progress so every mounted instance sees live updates,
  // regardless of which instance initiated the download.
  useEffect(() => {
    const listener: ProgressListener = ({ progress, status }) => {
      if (progress !== undefined) setInitProgress(progress);
      setInitStatusText(status);
    };
    progressListeners.add(listener);
    return () => {
      progressListeners.delete(listener);
    };
  }, []);

  const initEngine = useCallback(async () => {
    if (sharedClassifier) return;

    if (classifierInitPromise) {
      // Another instance already started the load — join and wait.
      setIsInitializing(true);
      await classifierInitPromise;
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);
    broadcast({ progress: 0, status: "Loading…" });

    classifierInitPromise = (async () => {
      const classifier = await pipeline("text-classification", MODEL_ID, {
        progress_callback: (info) => {
          const update = hubProgressToUpdate(info as HubProgress);
          if (update) broadcast(update);
        },
      });
      sharedClassifier = classifier;
    })();

    try {
      await classifierInitPromise;
    } catch (err) {
      console.error("[ContentModeration] Pipeline init failed:", err);
      classifierInitPromise = null; // allow retry on next attempt
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Pre-warm the model as soon as any consumer mounts so the download is hidden
  // behind natural user interaction rather than triggered on first submit.
  useEffect(() => {
    initEngine();
  }, [initEngine]);

  const checkContent = useCallback(
    async (text: string): Promise<ModerationResult> => {
      const trimmed = text.trim();
      if (!trimmed) return { flagged: false, reason: "" };

      if (!sharedClassifier) await initEngine();

      if (!sharedClassifier) {
        // Init failed — fail open so the post still goes through.
        console.warn(
          "[ContentModeration] Classifier unavailable — failing open.",
        );
        return { flagged: false, reason: "" };
      }

      try {
        // toxic-bert has 6 sigmoid heads; request all scores.
        const out = await sharedClassifier(trimmed, { top_k: 6 });
        return evaluateScores(out as LabelScore[]);
      } catch (err) {
        console.error("[ContentModeration] Check failed:", err);
        return { flagged: false, reason: "" };
      }
    },
    [initEngine],
  );

  return {
    checkContent,
    isInitializing,
    initProgress,
    initStatusText,
  };
}
