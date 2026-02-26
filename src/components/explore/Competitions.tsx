import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { ICompetition, CompetitionStatus } from "@/types/ICompetition";
import CompetitionCard from "./CompetitionCard";
import { APP_NAME } from "@/config/seo";

const mockCompetitions: ICompetition[] = [
  {
    id: "1",
    title: "Fantasy World Building Challenge",
    description:
      "Create a rich, immersive fantasy world with detailed lore, magic systems, and unique cultures. The winning entry will be featured in our showcase.",
    prizeAmount: 5000,
    prizeCurrency: "USDC",
    deadline: new Date("2024-12-31T23:59:59"),
    startDate: new Date("2024-11-01T00:00:00"),
    status: "active",
    difficulty: "intermediate",
    participants: 1247,
    maxParticipants: 5000,
    tags: ["Fantasy", "World Building", "Lore"],
    category: "World Building",
    organizer: `${APP_NAME} Team`,
    rules: [
      "Minimum 10,000 words",
      "Must include magic system",
      "Original content only",
    ],
    evaluationCriteria: "Creativity, depth, and originality",
    sponsor: {
      id: "sponsor-1",
      name: "Epic Publishing House",
      website: "https://example.com/epic-publishing",
      message:
        "We're excited to discover the next great fantasy world! The winning entry will receive consideration for publication.",
      tier: "gold",
    },
  },
  {
    id: "2",
    title: "500-Word Micro Story Competition",
    description:
      "Write a complete, compelling story in exactly 500 words. Challenge your brevity and creativity!",
    prizeAmount: 2000,
    prizeCurrency: "USDC",
    deadline: new Date("2024-12-15T23:59:59"),
    startDate: new Date("2024-11-15T00:00:00"),
    status: "active",
    difficulty: "beginner",
    participants: 3421,
    maxParticipants: 10000,
    tags: ["Micro Fiction", "Flash Fiction", "Short Story"],
    category: "Short Story",
    organizer: "Writing Community",
    rules: ["Exactly 500 words", "Any genre", "Original work"],
    evaluationCriteria: "Impact, creativity, and storytelling",
  },
  {
    id: "3",
    title: "Sci-Fi Character Development Challenge",
    description:
      "Develop a complex sci-fi character with a rich backstory, unique abilities, and compelling motivations.",
    prizeAmount: 3500,
    prizeCurrency: "USDC",
    deadline: new Date("2025-01-20T23:59:59"),
    startDate: new Date("2024-12-01T00:00:00"),
    status: "upcoming",
    difficulty: "intermediate",
    participants: 0,
    maxParticipants: 3000,
    tags: ["Sci-Fi", "Character Development", "Backstory"],
    category: "Character Development",
    organizer: "Sci-Fi Writers Guild",
    rules: [
      "Character must be original",
      "Include backstory and motivations",
      "Set in a sci-fi universe",
    ],
    evaluationCriteria: "Depth, originality, and relatability",
    sponsor: {
      id: "sponsor-2",
      name: "TechVerse Media",
      website: "https://example.com/techverse",
      message:
        "Supporting the next generation of sci-fi storytellers. Join us in shaping the future of science fiction!",
      tier: "platinum",
    },
  },
  {
    id: "4",
    title: "Plot Twist Master Competition",
    description:
      "Write a story where the ending completely surprises the reader. No one should see it coming!",
    prizeAmount: 4000,
    prizeCurrency: "USDC",
    deadline: new Date("2024-11-30T23:59:59"),
    startDate: new Date("2024-10-01T00:00:00"),
    status: "active",
    difficulty: "advanced",
    participants: 892,
    maxParticipants: 2000,
    tags: ["Plot Twist", "Suspense", "Mystery"],
    category: "Plot Development",
    organizer: "Mystery Writers Association",
    rules: [
      "Must have a surprising twist",
      "Minimum 5,000 words",
      "Foreshadowing must be subtle",
    ],
    evaluationCriteria: "Surprise factor, execution, and coherence",
  },
  {
    id: "5",
    title: "Historical Fiction Writing Contest",
    description:
      "Write a compelling historical fiction story set in any period before 1900. Accuracy and creativity are key.",
    prizeAmount: 6000,
    prizeCurrency: "USDC",
    deadline: new Date("2024-10-31T23:59:59"),
    startDate: new Date("2024-09-01T00:00:00"),
    status: "completed",
    difficulty: "advanced",
    participants: 2156,
    maxParticipants: 3000,
    tags: ["Historical Fiction", "Research", "Period Piece"],
    category: "Historical Fiction",
    organizer: "Historical Writers Society",
    rules: [
      "Must be historically accurate",
      "Minimum 15,000 words",
      "Set before 1900",
    ],
    evaluationCriteria: "Historical accuracy, storytelling, and research",
  },
  {
    id: "6",
    title: "Romance Novel Opening Challenge",
    description:
      "Write the first 10,000 words of a romance novel that hooks readers from the first page.",
    prizeAmount: 3000,
    prizeCurrency: "USDC",
    deadline: new Date("2025-01-15T23:59:59"),
    startDate: new Date("2024-12-01T00:00:00"),
    status: "upcoming",
    difficulty: "beginner",
    participants: 0,
    maxParticipants: 5000,
    tags: ["Romance", "Opening", "Hook"],
    category: "Romance",
    organizer: "Romance Writers Circle",
    rules: [
      "First 10,000 words only",
      "Must hook readers",
      "Any romance subgenre",
    ],
    evaluationCriteria: "Engagement, chemistry, and writing quality",
  },
  {
    id: "7",
    title: "Horror Short Story Competition",
    description:
      "Create a spine-chilling horror story that keeps readers up at night. Atmosphere and tension are everything.",
    prizeAmount: 4500,
    prizeCurrency: "USDC",
    deadline: new Date("2024-12-20T23:59:59"),
    startDate: new Date("2024-11-01T00:00:00"),
    status: "active",
    difficulty: "intermediate",
    participants: 1876,
    maxParticipants: 4000,
    tags: ["Horror", "Suspense", "Thriller"],
    category: "Horror",
    organizer: "Horror Writers Network",
    rules: [
      "Must be genuinely scary",
      "5,000-15,000 words",
      "No excessive gore",
    ],
    evaluationCriteria: "Fear factor, atmosphere, and pacing",
    sponsor: {
      id: "sponsor-3",
      name: "Midnight Press",
      website: "https://example.com/midnight-press",
      message:
        "We're looking for the next great horror voice. Top stories will be featured in our annual horror anthology!",
      tier: "silver",
    },
  },
  {
    id: "8",
    title: "Young Adult Fantasy Series Pitch",
    description:
      "Pitch the first book in a YA fantasy series. Include synopsis, character profiles, and world-building overview.",
    prizeAmount: 7500,
    prizeCurrency: "USDC",
    deadline: new Date("2025-02-28T23:59:59"),
    startDate: new Date("2024-12-15T00:00:00"),
    status: "upcoming",
    difficulty: "advanced",
    participants: 0,
    maxParticipants: 2000,
    tags: ["YA", "Fantasy", "Series", "Pitch"],
    category: "Young Adult",
    organizer: "YA Publishers Alliance",
    rules: [
      "Must be YA appropriate",
      "Include series outline",
      "Original concept",
    ],
    evaluationCriteria: "Marketability, originality, and series potential",
    sponsor: {
      id: "sponsor-4",
      name: "Young Readers Collective",
      website: "https://example.com/young-readers",
      message:
        "We're committed to discovering fresh YA voices. The winning pitch will receive a full manuscript review and potential publishing contract.",
      tier: "gold",
    },
  },
];

const STATUS_TABS: { value: CompetitionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

const Competitions: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CompetitionStatus | "all">(
    "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sponsoredFilter, setSponsoredFilter] = useState<
    "all" | "sponsored" | "non-sponsored"
  >("all");

  const handleJoinCompetition = (competitionId: string) => {
    const competition = mockCompetitions.find((c) => c.id === competitionId);
    if (competition) {
      alert(
        `Joining competition: ${competition.title}\n\nThis will be implemented with actual functionality.`
      );
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(mockCompetitions.map((c) => c.category));
    return Array.from(cats).sort();
  }, []);

  const filteredCompetitions = useMemo(() => {
    return mockCompetitions.filter((competition) => {
      const matchesSearch =
        competition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        competition.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        competition.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [searchQuery, statusFilter, categoryFilter, sponsoredFilter]);

  const selectClass =
    "font-ui text-[11px] font-semibold tracking-[0.1em] uppercase bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-500 pb-1.5 focus:outline-none focus:border-neutral-700 dark:focus:border-neutral-400 transition-colors cursor-pointer";

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 md:px-12 py-12 md:py-16">

        {/* Masthead */}
        <header className="mb-10">
          <p className="font-ui text-[10px] font-semibold tracking-[0.2em] uppercase text-dark-green dark:text-light-green mb-4">
            {APP_NAME} — Writing Prizes
          </p>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <h1 className="font-heading text-[3rem] md:text-[4.5rem] font-light italic leading-[1.05] text-neutral-900 dark:text-white">
              The Prize Room.
            </h1>
            <p className="font-body text-base text-neutral-500 dark:text-neutral-400 max-w-xs mb-1">
              Compete for prizes, get discovered, and push your writing further.
            </p>
          </div>
        </header>

        {/* Filters */}
        <div className="space-y-5">
          {/* Search */}
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

          {/* Status tabs + secondary filters */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Status tabs */}
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

            {/* Secondary filters */}
            <div className="flex items-center gap-6">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={sponsoredFilter}
                onChange={(e) =>
                  setSponsoredFilter(
                    e.target.value as "all" | "sponsored" | "non-sponsored"
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

        {/* Top rule + count */}
        <div className="mt-6 border-t border-neutral-900 dark:border-neutral-100" />
        <p className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600 mt-3">
          {filteredCompetitions.length} competition
          {filteredCompetitions.length !== 1 ? "s" : ""}
        </p>

        {/* List */}
        {filteredCompetitions.length > 0 ? (
          <div>
            {filteredCompetitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                onJoin={handleJoinCompetition}
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
