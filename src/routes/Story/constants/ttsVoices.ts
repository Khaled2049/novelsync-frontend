// src/constants/ttsVoices.ts

import { TtsVoiceId } from "@/types/IReader";

export type TtsVoiceGender = "female" | "male";

export interface TtsVoice {
  id: TtsVoiceId;
  label: string;
  gender: TtsVoiceGender;
}

/** Curated American English voices from Kokoro-82M, grouped by gender. */
export const TTS_VOICES: TtsVoice[] = [
  { id: "af_heart", label: "Heart", gender: "female" },
  { id: "af_bella", label: "Bella", gender: "female" },
  { id: "af_nicole", label: "Nicole", gender: "female" },
  { id: "af_sarah", label: "Sarah", gender: "female" },
  { id: "am_michael", label: "Michael", gender: "male" },
  { id: "am_puck", label: "Puck", gender: "male" },
  { id: "am_fenrir", label: "Fenrir", gender: "male" },
  { id: "am_eric", label: "Eric", gender: "male" },
];

export const DEFAULT_VOICE_FOR_GENDER: Record<TtsVoiceGender, TtsVoiceId> = {
  female: "af_heart",
  male: "am_michael",
};

export function voiceGender(id: TtsVoiceId): TtsVoiceGender {
  return TTS_VOICES.find((v) => v.id === id)?.gender ?? "female";
}
