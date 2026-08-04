import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { APP_NAME } from "@/config/seo";
import { useAuthContext } from "@/contexts/AuthContext";
import CompetitionCard from "./CompetitionCard";
import TokenBalanceBadge from "./TokenBalanceBadge";
import {
  useCancelCompetition,
  useCompetitionsQuery,
  useCreateCompetition,
  useJoinCompetition,
  useUpdateCompetition,
} from "@/hooks/queries/useCompetitionQueries";
import { formatMinorUnits, parseTokenInput } from "@/lib/money";
import { TALE_SYMBOL } from "@/types/IToken";
import {
  CompetitionDifficulty,
  CompetitionStatus,
  ICompetition,
  ICompetitionCreateInput,
  ICompetitionUpdate,
} from "@/types/ICompetition";

const STATUS_TABS: { value: CompetitionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

const DIFFICULTY_OPTIONS: CompetitionDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

interface CompetitionFormState {
  title: string;
  description: string;
  category: string;
  difficulty: CompetitionDifficulty;
  /** Whole TALE as typed, e.g. "1000". Converted to minor units on submit. */
  prizeAmount: string;
  startDate: string;
  deadline: string;
  votingDeadline: string;
  maxParticipants: string;
  tags: string;
}

const toDateTimeLocal = (date: Date): string => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

const getInitialFormState = (): CompetitionFormState => {
  const now = new Date();
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const deadline = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const votingDeadline = new Date(deadline.getTime() + 3 * 24 * 60 * 60 * 1000);

  return {
    title: "",
    description: "",
    category: "",
    difficulty: "beginner",
    prizeAmount: "",
    startDate: toDateTimeLocal(start),
    deadline: toDateTimeLocal(deadline),
    votingDeadline: toDateTimeLocal(votingDeadline),
    maxParticipants: "",
    tags: "",
  };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const mapCompetitionToForm = (
  competition: ICompetition,
): CompetitionFormState => {
  return {
    title: competition.title,
    description: competition.description,
    category: competition.category,
    difficulty: competition.difficulty,
    // Display only — the prize is immutable once escrow is funded, so the
    // field is rendered read-only while editing.
    prizeAmount: competition.prizePool
      ? formatMinorUnits(
          competition.prizePool.amount,
          competition.prizePool.decimals,
        )
      : String(competition.prizeAmount),
    startDate: toDateTimeLocal(competition.startDate),
    deadline: toDateTimeLocal(competition.deadline),
    votingDeadline: competition.votingDeadline
      ? toDateTimeLocal(competition.votingDeadline)
      : "",
    maxParticipants: competition.maxParticipants
      ? String(competition.maxParticipants)
      : "",
    tags: competition.tags.join(", "),
  };
};

const parseTags = (raw: string): string[] =>
  raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const Competitions: React.FC = () => {
  const { user } = useAuthContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CompetitionStatus | "all">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sponsoredFilter, setSponsoredFilter] = useState<
    "all" | "sponsored" | "non-sponsored"
  >("all");

  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCompetitionId, setEditingCompetitionId] = useState<
    string | null
  >(null);
  const [formState, setFormState] = useState<CompetitionFormState>(
    getInitialFormState(),
  );

  const {
    data: competitionsData,
    isLoading: loading,
    error: loadError,
  } = useCompetitionsQuery(user?.uid);
  const competitions = useMemo<ICompetition[]>(
    () => competitionsData ?? [],
    [competitionsData],
  );

  const createCompetition = useCreateCompetition();
  const updateCompetition = useUpdateCompetition();
  const cancelCompetition = useCancelCompetition();
  const joinCompetition = useJoinCompetition(user?.uid);

  const saving = createCompetition.isPending || updateCompetition.isPending;
  const joiningId = joinCompetition.isPending
    ? (joinCompetition.variables ?? null)
    : null;
  const displayedError =
    error ?? (loadError ? getErrorMessage(loadError, "Failed to load competitions.") : null);

  const handleFormChange = (
    field: keyof CompetitionFormState,
    value: string,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditingCompetitionId(null);
    setFormState(getInitialFormState());
    setShowForm(false);
  };

  const handleStartCreate = () => {
    setEditingCompetitionId(null);
    setFormState(getInitialFormState());
    setShowForm(true);
    setError(null);
  };

  const handleStartEdit = (competitionId: string) => {
    const competition = competitions.find((item) => item.id === competitionId);
    if (!competition) return;

    setEditingCompetitionId(competition.id);
    setFormState(mapCompetitionToForm(competition));
    setShowForm(true);
    setError(null);
  };

  const handleSaveCompetition = () => {
    if (!user) {
      setError("You must be logged in to manage competitions.");
      return;
    }

    setError(null);

    if (editingCompetitionId) {
      // The prize is deliberately absent — it is immutable once escrow is
      // funded, and the server rejects any attempt to change it.
      const updates: ICompetitionUpdate = {
        title: formState.title,
        description: formState.description,
        category: formState.category,
        difficulty: formState.difficulty,
        tags: parseTags(formState.tags),
        maxParticipants: formState.maxParticipants
          ? Number(formState.maxParticipants)
          : null,
        startDate: new Date(formState.startDate),
        deadline: new Date(formState.deadline),
        ...(formState.votingDeadline
          ? { votingDeadline: new Date(formState.votingDeadline) }
          : {}),
      };

      updateCompetition.mutate(
        { competitionId: editingCompetitionId, updates },
        {
          onSuccess: () => {
            toast.success("Competition updated");
            resetForm();
          },
          onError: (err) =>
            setError(getErrorMessage(err, "Failed to save competition.")),
        },
      );
      return;
    }

    // Parse the prize before hitting the network so a typo is caught here
    // rather than as a 400 — the server still validates it regardless.
    let prizeAmount: ICompetitionCreateInput["prizeAmount"];
    try {
      prizeAmount = parseTokenInput(formState.prizeAmount);
    } catch (err) {
      setError(getErrorMessage(err, "Enter a valid prize amount."));
      return;
    }

    createCompetition.mutate(
      {
        title: formState.title,
        description: formState.description,
        category: formState.category,
        difficulty: formState.difficulty,
        tags: parseTags(formState.tags),
        maxParticipants: formState.maxParticipants
          ? Number(formState.maxParticipants)
          : null,
        startDate: new Date(formState.startDate),
        deadline: new Date(formState.deadline),
        votingDeadline: new Date(formState.votingDeadline),
        prizeAmount,
        creatorName: user.username || user.email || "Unknown user",
      },
      {
        onSuccess: () => {
          toast.success(
            `Competition created — ${formState.prizeAmount} ${TALE_SYMBOL} moved into escrow`,
          );
          resetForm();
        },
        onError: (err) =>
          setError(getErrorMessage(err, "Failed to create competition.")),
      },
    );
  };

  /**
   * Cancel, not delete. A competition holding a prize pool cannot be removed —
   * the escrowed tokens are returned to the creator instead.
   */
  const handleCancelCompetition = (competitionId: string) => {
    if (!user) {
      setError("You must be logged in to manage competitions.");
      return;
    }

    if (
      !window.confirm(
        "Cancel this competition? The prize pool is refunded to the creator and it can't be reopened.",
      )
    ) {
      return;
    }

    setError(null);
    cancelCompetition.mutate(
      { competitionId },
      {
        onSuccess: () => {
          toast.success("Competition cancelled and prize refunded");
          if (editingCompetitionId === competitionId) resetForm();
        },
        onError: (err) =>
          setError(getErrorMessage(err, "Failed to cancel competition.")),
      },
    );
  };

  const handleJoinCompetition = (competitionId: string) => {
    if (!user) {
      setError("You must be logged in to join competitions.");
      return;
    }

    const competition = competitions.find((item) => item.id === competitionId);
    if (!competition || competition.isJoined) return;

    setError(null);
    joinCompetition.mutate(competitionId, {
      onError: (err) =>
        setError(getErrorMessage(err, "Failed to join competition.")),
    });
  };

  const categories = useMemo(() => {
    const cats = new Set(
      competitions.map((competition) => competition.category),
    );
    return Array.from(cats).sort();
  }, [competitions]);

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((competition) => {
      const matchesSearch =
        competition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        competition.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        competition.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesStatus =
        statusFilter === "all" || competition.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || competition.category === categoryFilter;
      const matchesSponsored =
        sponsoredFilter === "all" ||
        (sponsoredFilter === "sponsored" && !!competition.sponsor) ||
        (sponsoredFilter === "non-sponsored" && !competition.sponsor);

      return (
        matchesSearch && matchesStatus && matchesCategory && matchesSponsored
      );
    });
  }, [
    categoryFilter,
    competitions,
    searchQuery,
    sponsoredFilter,
    statusFilter,
  ]);

  const selectClass =
    "font-ui text-[11px] font-semibold tracking-[0.1em] uppercase bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-500 pb-1.5 focus:outline-none focus:border-neutral-700 dark:focus:border-neutral-400 transition-colors cursor-pointer";

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 md:px-12 py-12 md:py-16">
        <header className="mb-10">
          <p className="font-ui text-[10px] font-semibold tracking-[0.2em] uppercase text-dark-green dark:text-light-green mb-4">
            {APP_NAME} — Writing Prizes
          </p>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <h1 className="font-heading text-[3rem] md:text-[4.5rem] font-light italic leading-[1.05] text-neutral-900 dark:text-white">
              Time to write!
            </h1>
            <div className="flex flex-col items-end gap-3">
              <p className="font-body text-base text-neutral-500 dark:text-neutral-400 max-w-xs mb-1">
                Compete for prizes, get discovered, and push your writing
                further.
              </p>
              {user && <TokenBalanceBadge />}
              {user && (
                <button
                  onClick={handleStartCreate}
                  disabled={!user.isAdmin}
                  title={!user.isAdmin ? "Only admins can create competitions" : undefined}
                  className="inline-flex items-center gap-2 font-ui text-[11px] font-bold tracking-[0.12em] uppercase text-neutral-900 dark:text-white border border-neutral-900 dark:border-white px-4 py-2 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-900 dark:disabled:hover:bg-transparent dark:disabled:hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Competition
                </button>
              )}
            </div>
          </div>
        </header>

        {displayedError && (
          <div className="mb-6 p-3 border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between gap-3">
            <span>{displayedError}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {showForm && (
          <section className="mb-10 border border-neutral-200 dark:border-neutral-800 p-5 md:p-6 bg-white/60 dark:bg-neutral-900/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading italic text-3xl text-neutral-900 dark:text-white">
                {editingCompetitionId
                  ? "Edit Competition"
                  : "Create Competition"}
              </h2>
              <button
                onClick={resetForm}
                className="font-ui text-[11px] font-semibold tracking-[0.12em] uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Title
                </label>
                <input
                  value={formState.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                  placeholder="Competition title"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Category
                </label>
                <input
                  value={formState.category}
                  onChange={(e) => handleFormChange("category", e.target.value)}
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                  placeholder="Fantasy, Horror, Short Story..."
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Description
                </label>
                <textarea
                  value={formState.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm min-h-[96px]"
                  placeholder="Describe the competition and entry expectations"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Difficulty
                </label>
                <select
                  value={formState.difficulty}
                  onChange={(e) =>
                    handleFormChange(
                      "difficulty",
                      e.target.value as CompetitionDifficulty,
                    )
                  }
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                >
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Tags
                </label>
                <input
                  value={formState.tags}
                  onChange={(e) => handleFormChange("tags", e.target.value)}
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                  placeholder="Fantasy, Lore, Adventure"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Prize Pool ({TALE_SYMBOL})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formState.prizeAmount}
                  onChange={(e) =>
                    handleFormChange("prizeAmount", e.target.value)
                  }
                  disabled={!!editingCompetitionId}
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm disabled:opacity-50"
                  placeholder="1000"
                />
                <p className="font-ui text-[10px] text-neutral-400 dark:text-neutral-600">
                  {editingCompetitionId
                    ? "The prize can't be changed once it's escrowed — cancel and recreate instead."
                    : `Moved from your balance into escrow when the competition is created.`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={formState.startDate}
                  onChange={(e) =>
                    handleFormChange("startDate", e.target.value)
                  }
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Submissions Close
                </label>
                <input
                  type="datetime-local"
                  value={formState.deadline}
                  onChange={(e) => handleFormChange("deadline", e.target.value)}
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Voting Closes
                </label>
                <input
                  type="datetime-local"
                  value={formState.votingDeadline}
                  onChange={(e) =>
                    handleFormChange("votingDeadline", e.target.value)
                  }
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                />
                <p className="font-ui text-[10px] text-neutral-400 dark:text-neutral-600">
                  At least an hour after submissions close.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Max Participants (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formState.maxParticipants}
                  onChange={(e) =>
                    handleFormChange("maxParticipants", e.target.value)
                  }
                  className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSaveCompetition}
                disabled={saving}
                className="font-ui text-[11px] font-bold tracking-[0.12em] uppercase text-neutral-900 dark:text-white border border-neutral-900 dark:border-white px-4 py-2 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingCompetitionId
                    ? "Save Changes"
                    : "Create Competition"}
              </button>
              <button
                onClick={resetForm}
                className="font-ui text-[11px] font-semibold tracking-[0.12em] uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        <div className="space-y-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search competitions, categories, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 pb-3 text-base font-body text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-dark-green dark:focus:border-light-green transition-colors pr-8"
            />
            <Search className="absolute right-0 top-1 w-4 h-4 text-neutral-400 dark:text-neutral-600" />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              {STATUS_TABS.map((tab, i) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`font-ui text-[11px] font-semibold tracking-[0.12em] uppercase py-1.5 transition-colors duration-150 ${
                    i > 0 ? "ml-5" : ""
                  } ${
                    statusFilter === tab.value
                      ? "text-neutral-900 dark:text-white border-b border-neutral-900 dark:border-white"
                      : "text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={sponsoredFilter}
                onChange={(e) =>
                  setSponsoredFilter(
                    e.target.value as "all" | "sponsored" | "non-sponsored",
                  )
                }
                className={selectClass}
              >
                <option value="all">All</option>
                <option value="sponsored">Sponsored</option>
                <option value="non-sponsored">Independent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-900 dark:border-neutral-100" />
        <p className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600 mt-3">
          {filteredCompetitions.length} competition
          {filteredCompetitions.length !== 1 ? "s" : ""}
        </p>

        {loading ? (
          <div className="py-20 text-center">
            <p className="font-body text-sm text-neutral-500 dark:text-neutral-400">
              Loading competitions...
            </p>
          </div>
        ) : filteredCompetitions.length > 0 ? (
          <div>
            {filteredCompetitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                onJoin={handleJoinCompetition}
                onEdit={handleStartEdit}
                onDelete={handleCancelCompetition}
                joinLoading={joiningId === competition.id}
                canManage={
                  competition.creatorId === user?.uid || !!user?.isAdmin
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-28 text-center">
            <p className="font-heading italic text-3xl text-neutral-300 dark:text-neutral-700 mb-4">
              No competitions found.
            </p>
            <p className="font-body text-sm text-neutral-400 dark:text-neutral-600">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Competitions;
