import { Coins, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAiCreditsQuery } from "@/hooks/queries/useCreditQueries";

// Below this balance we surface a top-up button. A single co-write generation
// can reserve a few thousand credits up front, so this leaves headroom to buy
// more before a generation gets blocked.
const LOW_CREDIT_THRESHOLD = 5000;

/**
 * AI credit balance, designed to pin to the bottom of the story workspace's
 * leftmost nav (use `mt-auto` on this element via the wrapper). Platform users
 * only — BYOK users don't spend platform credits, so it renders nothing.
 */
export function AiCreditsFooter({ className = "" }: { className?: string }) {
  const { user } = useAuthContext();
  const { data, isLoading, isError, isFetching, refetch } = useAiCreditsQuery(
    user?.uid,
  );

  if (user?.hasCustomAiProvider) return null;

  const credits = data?.availableCredits;
  const isLow =
    !isLoading &&
    !isError &&
    typeof credits === "number" &&
    credits <= LOW_CREDIT_THRESHOLD;

  return (
    <div
      className={`flex-shrink-0 border-t border-ns-border px-3 py-3 space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-ui text-[10px] font-semibold text-ns-ink-muted uppercase tracking-widest">
          <Coins className="w-3 h-3" />
          AI Credits
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`font-ui text-xs font-medium tabular-nums ${
              isLow ? "text-ns-accent" : "text-ns-ink"
            }`}
          >
            {isLoading ? "…" : isError ? "—" : (credits ?? 0).toLocaleString()}
          </span>
          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="p-1 rounded text-ns-ink-muted hover:text-ns-ink hover:bg-ns-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh credits"
            title="Refresh credits"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isLow && user?.uid && (
        <Link
          to={`/profile/${user.uid}`}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-ns bg-ns-accent text-white font-ui text-xs font-medium hover:bg-ns-accent-hover active:scale-[0.98] transition-all duration-150"
        >
          <Coins className="w-3.5 h-3.5" />
          Buy credits
        </Link>
      )}
    </div>
  );
}
