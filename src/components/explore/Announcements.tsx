import { APP_NAME } from "@/config/seo";

interface Release {
  date: string;
  tag: string;
  tagColor: string;
  title: string;
  description: string;
  details: string[];
}

const releases: Release[] = [
  {
    date: "Feb 2026",
    tag: "Feature",
    tagColor:
      "text-violet-500 dark:text-violet-400 border-violet-300 dark:border-violet-700",
    title: "AI Image Generation for Covers",
    description:
      "Writers can now generate custom book cover artwork directly within the platform. Describe your vision and the AI produces a high-quality cover image, ready to attach to your story.",
    details: [
      "Prompt-based image generation from the story editor",
      "Multiple style presets (illustrated, photorealistic, painterly)",
      "Cover saved to story metadata and displayed across the platform",
    ],
  },
  {
    date: "Feb 2026",
    tag: "Feature",
    tagColor:
      "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
    title: "Book Clubs",
    description:
      "A full reading-circle experience built into the platform. Members can join or found clubs, follow a shared reading schedule, track chapter progress, and discuss inside a spoiler-safe chat room.",
    details: [
      "Real-time club chat with spoiler-tagged messages",
      "Reading schedules with per-chapter pacing and due dates",
      "Discussion prompts unlocked by chapter progress",
      "Member polls for book selection, meetup logistics, and more",
    ],
  },
  {
    date: "Jan 2026",
    tag: "Infrastructure",
    tagColor:
      "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700",
    title: "Terraform & GitHub Actions for Deployment",
    description:
      "Infrastructure is now fully codified and automated. Terraform manages cloud resources declaratively, and GitHub Actions handles CI/CD — pushing to main triggers a full build, test, and deploy pipeline.",
    details: [
      "Terraform modules for Firebase, storage, and compute resources",
      "GitHub Actions workflow: lint → test → build → deploy",
      "Environment promotion: staging promoted to production on tag",
      "Secrets managed via GitHub encrypted environment variables",
    ],
  },
  {
    date: "Jan 2026",
    tag: "Web3",
    tagColor:
      "text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700",
    title: "Smart Contracts",
    description:
      "Initial smart contract infrastructure is in place. Contracts establish on-chain authorship records and lay the groundwork for future royalty and licensing features.",
    details: [
      "ERC-based contracts for story ownership registration",
      "Wallet connection via MetaMask and WalletConnect",
      "On-chain signature of story metadata hash",
      "Testnet deployment on Polygon Amoy",
    ],
  },
  {
    date: "Dec 2025",
    tag: "Design",
    tagColor:
      "text-rose-500 dark:text-rose-400 border-rose-300 dark:border-rose-700",
    title: "Design System & Light / Dark Mode",
    description:
      "The entire UI was rebuilt around a cohesive design system — the Inkwell token set — with full light and dark mode support across every surface. Typography, spacing, and color are now consistent end-to-end.",
    details: [
      "CSS variable–based token system for all colors and shadows",
      "Cormorant + Crimson Pro + Hanken Grotesk type stack",
      "System-preference dark mode with manual override toggle",
      "Tailwind config extended with semantic ns-* utility classes",
    ],
  },
  {
    date: "Nov 2025",
    tag: "AI",
    tagColor:
      "text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700",
    title: "RAG Implementation for Chatbot",
    description:
      "The writing assistant now uses Retrieval-Augmented Generation against your own story content. The chatbot can answer questions about characters, plot threads, and world-building details by grounding responses in your actual manuscript.",
    details: [
      "Story chapters chunked and embedded on save",
      "Semantic search over embeddings at query time",
      "Retrieved context injected into the system prompt",
      "Hallucination rate significantly reduced on story-specific queries",
    ],
  },
  {
    date: "Oct 2025",
    tag: "Editor",
    tagColor:
      "text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-neutral-600",
    title: "Text Editor — Document Mode",
    description:
      "The story editor was redesigned to feel like a true writing environment rather than a web form. A centered document canvas, print-like margins, and distraction-free typography put the focus on the words.",
    details: [
      "Centered A4-proportion canvas with generous top/bottom margin",
      "Serif body type at a comfortable reading size and line height",
      "Toolbar collapses on scroll, reappears on selection",
      "Word count, reading time, and chapter markers in the gutter",
    ],
  },
];

const tagBase =
  "inline-block font-ui text-[9px] font-bold tracking-[0.16em] uppercase border px-2 py-0.5";

const Announcements: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-5 md:px-10 py-14 md:py-20">
        {/* Header */}
        <header className="mb-2">
          <p className="font-ui text-[10px] font-semibold tracking-[0.2em] uppercase text-dark-green dark:text-light-green mb-4">
            {APP_NAME} — Build Log
          </p>
          <h1 className="font-heading text-[3rem] md:text-[4rem] font-light italic leading-[1.05] text-neutral-900 dark:text-white">
            What's New.
          </h1>
          <p className="mt-5 font-body text-base text-neutral-500 dark:text-neutral-400 max-w-lg">
            A running record of features shipped, systems built, and things
            worth knowing about.
          </p>
        </header>

        {/* Top rule */}
        <div className="mt-10 border-t border-neutral-900 dark:border-neutral-100" />

        {/* Release entries */}
        <div>
          {releases.map((release, i) => (
            <article
              key={i}
              className="group border-b border-neutral-200 dark:border-neutral-800 py-10 md:py-12"
            >
              <div className="flex flex-col md:flex-row md:gap-12">
                {/* Left column: date */}
                <div className="md:w-28 shrink-0 mb-4 md:mb-0">
                  <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600">
                    {release.date}
                  </span>
                </div>

                {/* Right column: content */}
                <div className="flex-1 min-w-0">
                  {/* Tag */}
                  <span
                    className={`${tagBase} ${release.tagColor} mb-4 inline-block`}
                  >
                    {release.tag}
                  </span>

                  {/* Title */}
                  <h2 className="font-heading text-2xl md:text-3xl font-light italic text-neutral-900 dark:text-neutral-50 leading-snug mb-4">
                    {release.title}
                  </h2>

                  {/* Description */}
                  <p className="font-body text-[0.95rem] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                    {release.description}
                  </p>

                  {/* Detail bullets */}
                  <ul className="space-y-2">
                    {release.details.map((detail, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 font-body text-sm text-neutral-500 dark:text-neutral-500"
                      >
                        <span className="mt-[0.45rem] shrink-0 w-[5px] h-[5px] rounded-full bg-dark-green dark:bg-light-green" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
