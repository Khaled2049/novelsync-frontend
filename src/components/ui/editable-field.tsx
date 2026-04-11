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
        <label className="block text-xs font-medium font-ui uppercase tracking-wider text-ns-ink-muted">
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
                "w-full min-h-[80px] px-3 py-2 text-sm rounded-ns",
                "bg-ns-elevated",
                "border border-ns-accent",
                "text-ns-ink",
                "placeholder:text-ns-ink-muted",
                "focus:outline-none focus:ring-2 focus:ring-[var(--ns-ring)]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "resize-none",
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
                "w-full px-3 py-2 text-sm rounded-ns",
                "bg-ns-elevated",
                "border border-ns-accent",
                "text-ns-ink",
                "placeholder:text-ns-ink-muted",
                "focus:outline-none focus:ring-2 focus:ring-[var(--ns-ring)]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              placeholder={placeholder}
            />
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {maxLength && (
                <span className="text-xs text-ns-ink-muted">
                  {editValue.length}/{maxLength}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-ns-accent" />
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="p-1.5 rounded-ns hover:bg-ns-surface text-ns-accent transition-colors"
                    title="Save (Enter)"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-1.5 rounded-ns hover:bg-ns-surface text-ns-ink-muted transition-colors"
                    title="Cancel (Escape)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-ns-destructive mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-xs font-medium font-ui uppercase tracking-wider text-ns-ink-muted">
        {label}
      </label>
      <button
        onClick={() => setIsEditing(true)}
        className={cn(
          "w-full text-left px-3 py-2 rounded-ns",
          "bg-ns-surface",
          "border border-transparent",
          "hover:border-ns-border-strong",
          "hover:bg-ns-surface-hover",
          "transition-all duration-200",
          "group cursor-pointer",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-sm",
              value ? "text-ns-ink" : "text-ns-ink-muted italic",
            )}
          >
            {value || placeholder}
          </span>
          <Pencil className="w-3.5 h-3.5 text-ns-ink-muted group-hover:text-ns-accent transition-colors flex-shrink-0 mt-0.5" />
        </div>
      </button>
    </div>
  );
}
