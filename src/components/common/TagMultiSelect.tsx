import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import type { SelectOption } from "@/constants/storyOptions";

interface TagMultiSelectProps {
  options: SelectOption[];
  /** Selected values (must be option `value`s). */
  value: string[];
  onChange: (next: string[]) => void;
  /** Maximum selectable tags; further selections are blocked once reached. */
  max?: number;
  placeholder?: string;
}

/**
 * Chip-based multi-select backed by a fixed option list. Authors can only pick
 * from the provided options — there is no free-text entry — so tag values stay
 * normalized. Selected tags render as removable chips above the dropdown.
 */
export const TagMultiSelect = ({
  options,
  value,
  onChange,
  max,
  placeholder = "Select tags…",
}: TagMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const atMax = max !== undefined && value.length >= max;

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else if (!atMax) {
      onChange([...value, val]);
    }
  };

  const labelFor = (val: string) =>
    options.find((o) => o.value === val)?.label ?? val;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-11 flex items-center justify-between gap-2 px-3 rounded-md bg-ns-surface border border-ns-border text-sm font-ui text-ns-ink hover:border-ns-border-strong focus:outline-none focus:ring-2 focus:ring-ns-accent transition-colors"
      >
        <span className={value.length ? "text-ns-ink" : "text-ns-ink-muted"}>
          {value.length
            ? `${value.length} selected${max ? ` / ${max}` : ""}`
            : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-ns-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-ui bg-ns-accent/10 text-ns-accent"
            >
              {labelFor(val)}
              <button
                type="button"
                onClick={() => toggle(val)}
                className="hover:text-ns-accent/70 transition-colors leading-none"
                aria-label={`Remove ${labelFor(val)}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-ns-border bg-ns-elevated shadow-ns-lg py-1">
          {options.map(({ value: val, label }) => {
            const selected = value.includes(val);
            const disabled = !selected && atMax;
            return (
              <button
                key={val}
                type="button"
                onClick={() => toggle(val)}
                disabled={disabled}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-ui text-ns-ink hover:bg-ns-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {label}
                {selected && <Check className="w-4 h-4 text-ns-accent" />}
              </button>
            );
          })}
          {atMax && (
            <p className="px-3 py-2 text-xs font-ui text-ns-ink-muted">
              Maximum of {max} tags reached.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
