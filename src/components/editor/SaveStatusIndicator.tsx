import { Loader, Check, AlertCircle, Cloud, CloudOff } from "lucide-react";
import { SaveStatus } from "@/hooks/useAutosave";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  errorMessage?: string;
  isOnline?: boolean;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  lastSaved,
  errorMessage,
  isOnline = true,
  className = "",
}: SaveStatusIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOnline) {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-amber-500 dark:text-amber-400 ${className}`}
      >
        <CloudOff className="w-4 h-4" />
        <span>Offline - changes will sync when connected</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {status === "idle" && lastSaved && (
        <span className="text-black/50 dark:text-white/50 flex items-center gap-1.5">
          <Cloud className="w-4 h-4" />
          Last saved at {formatTime(lastSaved)}
        </span>
      )}

      {status === "pending" && (
        <span className="text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Unsaved changes
        </span>
      )}

      {status === "saving" && (
        <span className="text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
          <Loader className="w-4 h-4 animate-spin" />
          Saving...
        </span>
      )}

      {status === "saved" && (
        <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          {lastSaved ? `Saved at ${formatTime(lastSaved)}` : "Saved"}
        </span>
      )}

      {status === "error" && (
        <span className="text-red-500 dark:text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          {errorMessage || "Save failed"}
        </span>
      )}
    </div>
  );
}
