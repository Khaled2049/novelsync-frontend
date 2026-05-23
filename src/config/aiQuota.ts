const DEFAULT_PLATFORM_AI_DAILY_LIMIT = 100;

function parseDailyLimit(raw: string | undefined): number {
  const parsed = Number.parseInt(raw || "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_PLATFORM_AI_DAILY_LIMIT;
  }
  return parsed;
}

export const PLATFORM_AI_DAILY_LIMIT = parseDailyLimit(
  import.meta.env.VITE_MAX_AI_USAGE,
);

export const AI_SETTINGS_COPY = {
  platformLabel: "NovelSync AI",
  platformResetHint:
    "Resets at midnight UTC. Each writing assistant action counts as one request.",
  byokNoLimitHint: "No NovelSync daily request limit while your key is connected.",
} as const;

function getTodayUtcDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function getTodayPlatformAiUsage(
  aiUsage?: number,
  lastAiUsageDate?: string,
): number {
  const safeUsage = typeof aiUsage === "number" && aiUsage > 0 ? aiUsage : 0;
  if (!lastAiUsageDate || lastAiUsageDate !== getTodayUtcDateKey()) {
    return 0;
  }
  return safeUsage;
}

export function getPlatformAiRemaining(
  aiUsage?: number,
  lastAiUsageDate?: string,
): number {
  const usedToday = getTodayPlatformAiUsage(aiUsage, lastAiUsageDate);
  return Math.max(0, PLATFORM_AI_DAILY_LIMIT - usedToday);
}
