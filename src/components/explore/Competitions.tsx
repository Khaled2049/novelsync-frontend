import { useState, useMemo } from "react";
import { Search, Filter, Trophy } from "lucide-react";
import { ICompetition, CompetitionStatus } from "@/types/ICompetition";
import CompetitionCard from "./CompetitionCard";

// Placeholder competition data
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
    organizer: "NovelSync Team",
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
    // TODO: Implement actual join logic
    const competition = mockCompetitions.find((c) => c.id === competitionId);
    if (competition) {
      alert(
        `Joining competition: ${competition.title}\n\nThis will be implemented with actual functionality.`
      );
      // In the future, this will:
      // 1. Check if user is authenticated
      // 2. Check if user has already joined
      // 3. Call API to register user for competition
      // 4. Navigate to competition details page
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(mockCompetitions.map((c) => c.category));
    return Array.from(cats).sort();
  }, []);

  // Filter competitions
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black w-full">
      <div className="max-w-7xl mx-auto p-6 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-dark-green dark:text-light-green" />
            <h1 className="text-4xl font-bold text-black dark:text-white">
              Competitions
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Compete for prizes, showcase your writing, and join a community of
            talented storytellers.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search competitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-dark-green dark:focus:border-light-green transition-colors"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as CompetitionStatus | "all")
                }
                className="px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-black dark:text-white focus:outline-none focus:border-dark-green dark:focus:border-light-green transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-black dark:text-white focus:outline-none focus:border-dark-green dark:focus:border-light-green transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Sponsored Filter */}
            <select
              value={sponsoredFilter}
              onChange={(e) =>
                setSponsoredFilter(
                  e.target.value as "all" | "sponsored" | "non-sponsored"
                )
              }
              className="px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-black dark:text-white focus:outline-none focus:border-dark-green dark:focus:border-light-green transition-colors"
            >
              <option value="all">All Competitions</option>
              <option value="sponsored">Sponsored Only</option>
              <option value="non-sponsored">Non-Sponsored Only</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredCompetitions.length} competition
            {filteredCompetitions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Competition Grid */}
        {filteredCompetitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompetitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                onJoin={handleJoinCompetition}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No competitions found
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Competitions;
