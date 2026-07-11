// src/components/reader/ReadAloudPanel.tsx

import React, { useEffect, useRef } from "react";
import { X, Headphones, Play, Pause, Square, Gauge, Mic2 } from "lucide-react";
import { TtsVoiceId } from "@/types/IReader";
import {
  TTS_VOICES,
  DEFAULT_VOICE_FOR_GENDER,
  voiceGender,
  TtsVoiceGender,
} from "../../constants/ttsVoices";
import type { ReadAloudStatus } from "@/hooks/useReadAloud";

interface ReadAloudPanelProps {
  status: ReadAloudStatus;
  loadProgress: number;
  device: "webgpu" | "wasm" | null;
  voice: TtsVoiceId;
  speed: number;
  onVoiceChange: (voice: TtsVoiceId) => void;
  onSpeedChange: (speed: number) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onClose: () => void;
}

const Spinner: React.FC = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      className="opacity-25"
    />
    <path
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      className="opacity-75"
    />
  </svg>
);

export const ReadAloudPanel: React.FC<ReadAloudPanelProps> = ({
  status,
  loadProgress,
  device,
  voice,
  speed,
  onVoiceChange,
  onSpeedChange,
  onPlayPause,
  onStop,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const gender = voiceGender(voice);
  const isBusy = status === "loading" || status === "buffering";
  const isActive = status === "playing" || isBusy;
  const genderOptions: TtsVoiceGender[] = ["female", "male"];

  return (
    <div
      ref={panelRef}
      className="fixed top-16 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Headphones size={20} className="text-gray-900 dark:text-gray-100" />
          Read Aloud
          {device && (
            <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {device === "webgpu" ? "GPU" : "CPU"}
            </span>
          )}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-900 dark:text-gray-100"
          aria-label="Close read aloud"
        >
          <X size={20} />
        </button>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onPlayPause}
          disabled={status === "loading"}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-medium transition-colors"
          aria-label={isActive ? "Pause" : "Play"}
        >
          {isBusy ? (
            <Spinner />
          ) : status === "playing" ? (
            <Pause size={18} />
          ) : (
            <Play size={18} />
          )}
          {status === "loading"
            ? "Preparing…"
            : status === "buffering"
              ? "Buffering…"
              : status === "playing"
                ? "Pause"
                : status === "paused"
                  ? "Resume"
                  : "Play"}
        </button>
        <button
          onClick={onStop}
          disabled={status === "idle" || status === "loading"}
          className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
          aria-label="Stop"
        >
          <Square size={18} />
        </button>
      </div>

      {/* Model download progress */}
      {status === "loading" && (
        <div className="mb-6">
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(loadProgress * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Downloading voice model… {Math.round(loadProgress * 100)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            One-time download, cached in your browser.
          </p>
        </div>
      )}

      {status === "error" && (
        <p className="mb-6 text-sm text-red-600 dark:text-red-400">
          Something went wrong. Press play to try again.
        </p>
      )}

      {/* Voice */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          <Mic2 size={16} className="text-gray-900 dark:text-gray-100" />
          Voice
        </label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {genderOptions.map((g) => (
            <button
              key={g}
              onClick={() => onVoiceChange(DEFAULT_VOICE_FOR_GENDER[g])}
              className={`px-4 py-2 rounded-lg border transition-all text-gray-900 dark:text-gray-100 capitalize ${
                gender === g
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              aria-pressed={gender === g}
            >
              {g}
            </button>
          ))}
        </div>
        <select
          value={voice}
          onChange={(e) => onVoiceChange(e.target.value as TtsVoiceId)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Voice"
        >
          {TTS_VOICES.filter((v) => v.gender === gender).map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Speed */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          <Gauge size={16} className="text-gray-900 dark:text-gray-100" />
          Speed: {speed.toFixed(1)}×
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
          <span>0.5×</span>
          <span>2.0×</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Changes apply from the current sentence.
        </p>
      </div>
    </div>
  );
};
