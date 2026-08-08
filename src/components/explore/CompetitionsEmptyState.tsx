import { Button } from "@/components/ui/button";

export interface CompetitionsEmptyStateProps {
  /** "none" — nothing open at all. "filtered" — the active filters matched zero rows. */
  variant: "none" | "filtered";
  canHost: boolean;
  onHost: () => void;
  onClearFilters?: () => void;
}

export function CompetitionsEmptyState({
  variant,
  canHost,
  onHost,
  onClearFilters,
}: CompetitionsEmptyStateProps) {
  const isFiltered = variant === "filtered";

  return (
    <div className="flex flex-col items-center gap-[18px] px-12 py-14 text-center">
      <div
        className="h-[140px] w-[104px] rounded-ns border border-ns-border bg-ns-elevated"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(212,169,74,.06) 0 1px, transparent 1px 13px)",
        }}
      />
      <h2 className="font-heading text-[40px] leading-[1.05] text-ns-ink">
        {isFiltered ? "No competitions match those filters" : "No competitions open just yet"}
      </h2>
      <p className="font-body text-[17px] leading-[1.55] max-w-[36ch] text-ns-ink-secondary">
        {isFiltered
          ? "Try widening your filters or clearing your search to see everything that's open right now."
          : "There's nothing open to enter right now. Check back soon, or start a competition of your own and let the tribe write to it."}
      </p>
      <div className="mt-2 flex items-center gap-3">
        {isFiltered ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          canHost && (
            <Button className="bg-ns-ink text-ns-bg hover:opacity-90" onClick={onHost}>
              Host a competition
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export default CompetitionsEmptyState;
