import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Loader2, Check, X } from "lucide-react";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  className?: string;
}

export function EditableField({
  value,
  onSave,
  label,
  placeholder = "Click to edit...",
  multiline = false,
  maxLength,
  className,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-1", className)}>
        <label className="block text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          {label}
        </label>
        <div className="relative">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={maxLength}
              disabled={isLoading}
              className={cn(
                "w-full min-h-[80px] px-3 py-2 text-sm rounded-lg",
                "bg-white dark:bg-neutral-800",
                "border border-emerald-500 dark:border-emerald-400",
                "text-black dark:text-white",
                "placeholder:text-black/40 dark:placeholder:text-white/40",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "resize-none"
              )}
              placeholder={placeholder}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={maxLength}
              disabled={isLoading}
              className={cn(
                "w-full px-3 py-2 text-sm rounded-lg",
                "bg-white dark:bg-neutral-800",
                "border border-emerald-500 dark:border-emerald-400",
                "text-black dark:text-white",
                "placeholder:text-black/40 dark:placeholder:text-white/40",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              placeholder={placeholder}
            />
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {maxLength && (
                <span className="text-xs text-black/40 dark:text-white/40">
                  {editValue.length}/{maxLength}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
                    title="Save (Enter)"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 text-black/60 dark:text-white/60 transition-colors"
                    title="Cancel (Escape)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
        {label}
      </label>
      <button
        onClick={() => setIsEditing(true)}
        className={cn(
          "w-full text-left px-3 py-2 rounded-lg",
          "bg-neutral-50 dark:bg-neutral-800/50",
          "border border-transparent",
          "hover:border-emerald-500/30 dark:hover:border-emerald-400/30",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
          "transition-all duration-200",
          "group cursor-pointer"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-sm",
              value
                ? "text-black dark:text-white"
                : "text-black/40 dark:text-white/40 italic"
            )}
          >
            {value || placeholder}
          </span>
          <Pencil className="w-3.5 h-3.5 text-black/20 dark:text-white/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5" />
        </div>
      </button>
    </div>
  );
}
