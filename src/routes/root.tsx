import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Coins,
  Globe2,
  MessageSquareQuote,
  PenTool,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";
import { APP_NAME } from "@/config/seo";

const pillars = [
  {
    icon: PenTool,
    title: "AI Draft Studio",
    description:
      "Write scene-by-scene with an AI copilot that respects your voice, structure, and pacing.",
  },
  {
    icon: MessageSquareQuote,
    title: "Global Feedback Loops",
    description:
      "Share drafts and get thoughtful critique from readers and authors across regions and genres.",
  },
  {
    icon: Trophy,
    title: "Challenges and Competitions",
    description:
      "Enter weekly prompts, seasonal contests, and judged showcases to grow your audience.",
  },
  {
    icon: Wallet,
    title: "Crypto Tipping",
    description:
      "Readers can directly tip authors with crypto to reward standout writing and serialized chapters.",
  },
];

const bestWork = [
  {
    title: "Ember Crown",
    genre: "Epic Fantasy",
    image: "/images/landing/best-work-ember.svg",
    engagement: "18.4K reads",
  },
  {
    title: "Orbit of Ash",
    genre: "Science Fiction",
    image: "/images/landing/best-work-orbit.svg",
    engagement: "12.7K reads",
  },
  {
    title: "Editors' Showcase",
    genre: "Featured Collection",
    image: "/images/landing/best-work-showcase.svg",
    engagement: "Top 50 of the month",
  },
];

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <SEOHead
        title={`${APP_NAME} - Write, Compete, and Grow as an Author`}
        description="NovelSync is a story writing platform where authors use AI to write better drafts, get feedback from a global community, join challenges and competitions, and receive crypto tips from readers."
        keywords={[
          "AI writing",
          "story writing platform",
          "author community",
          "writing feedback",
          "writing competitions",
          "crypto tipping",
          "novel writing",
        ]}
        url="/"
        type="website"
      />

      <div className="min-h-screen bg-ns-bg text-ns-ink ns-grain overflow-x-hidden">
        <section className="relative isolate border-b border-ns-border">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -left-12 h-72 w-72 rounded-full bg-ns-accent/10 blur-3xl" />
            <div className="absolute top-24 right-0 h-80 w-80 rounded-full bg-ns-gold/20 blur-3xl" />
            <div className="absolute inset-0 opacity-25" style={{
              backgroundImage:
                "linear-gradient(rgba(185,28,28,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(185,28,28,0.1) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-16 sm:pt-20 sm:pb-24">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ns-border-strong bg-ns-elevated px-4 py-2 text-xs font-ui tracking-[0.16em] uppercase text-ns-ink-secondary">
              <Sparkles className="h-4 w-4 text-ns-accent" />
              Story OS for modern authors
            </div>

            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div
                style={{
                  transform: `translateY(${Math.min(scrollY * 0.15, 28)}px)`,
                }}
              >
                <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl leading-[0.93] tracking-tight mb-6">
                  Write with AI.
                  <span className="block italic text-ns-accent">Publish to the world.</span>
                  <span className="block">Get rewarded.</span>
                </h1>

                <p className="font-body text-lg sm:text-xl text-ns-ink-secondary max-w-2xl leading-relaxed mb-10">
                  NovelSync helps storytellers build worlds, iterate faster, and receive high-quality feedback from a global community. Authors enter challenges, win competitions, and earn through direct crypto tips.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate("/sign-up")}
                    className="inline-flex items-center gap-2 rounded-full bg-ns-accent hover:bg-ns-accent-hover text-white px-7 py-3.5 font-ui font-semibold shadow-ns transition-all duration-300 hover:scale-105 active:scale-[0.98]"
                  >
                    Start writing now
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => navigate("/explore")}
                    className="inline-flex items-center gap-2 rounded-full border border-ns-border-strong bg-ns-elevated hover:bg-ns-surface px-7 py-3.5 font-ui font-semibold text-ns-ink transition-colors"
                  >
                    Explore stories
                    <BookOpen className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-ns-accent/20 via-transparent to-ns-gold/30 blur-2xl" />
                <img
                  src="/images/landing/hero-editorial.svg"
                  alt="Editorial scene of an AI-assisted writing studio"
                  className="relative rounded-[1.75rem] border border-ns-border-strong shadow-ns-xl w-full h-auto"
                />
              </div>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="rounded-ns-xl border border-ns-border bg-ns-elevated p-5 ns-lift">
                  <pillar.icon className="h-5 w-5 text-ns-accent mb-3" />
                  <h3 className="font-heading text-xl mb-1">{pillar.title}</h3>
                  <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-3">
            <article className="rounded-ns-2xl border border-ns-border bg-ns-elevated p-6 sm:p-7 shadow-ns">
              <img
                src="/images/landing/ai-copilot.svg"
                alt="AI writing copilot interface concept"
                className="w-full aspect-[4/3] object-cover rounded-ns-lg mb-5"
              />
              <h3 className="font-heading text-2xl mb-2">AI that understands your narrative</h3>
              <p className="font-body text-ns-ink-secondary leading-relaxed">
                Keep lore, characters, and plot context connected so AI suggestions stay coherent from chapter one to finale.
              </p>
            </article>

            <article className="rounded-ns-2xl border border-ns-border bg-ns-elevated p-6 sm:p-7 shadow-ns">
              <img
                src="/images/landing/community-workshop.svg"
                alt="Community workshop for story feedback"
                className="w-full aspect-[4/3] object-cover rounded-ns-lg mb-5"
              />
              <h3 className="font-heading text-2xl mb-2">A global room for critique</h3>
              <p className="font-body text-ns-ink-secondary leading-relaxed">
                Receive line edits, structural notes, and reader reactions from a global community of writers and fans.
              </p>
            </article>

            <article className="rounded-ns-2xl border border-ns-border bg-ns-elevated p-6 sm:p-7 shadow-ns">
              <img
                src="/images/landing/challenge-arena.svg"
                alt="Story challenge and competition arena concept"
                className="w-full aspect-[4/3] object-cover rounded-ns-lg mb-5"
              />
              <h3 className="font-heading text-2xl mb-2">Compete with visibility</h3>
              <p className="font-body text-ns-ink-secondary leading-relaxed">
                Weekly challenges and flagship competitions spotlight strong authors and unlock repeat readership.
              </p>
            </article>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="rounded-ns-2xl border border-ns-border-strong bg-[linear-gradient(120deg,var(--ns-accent-subtle),transparent_55%)] p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.08fr] items-center">
              <div>
                <div className="ns-divider max-w-xs mb-5">Author economy</div>
                <h2 className="font-heading text-4xl sm:text-5xl leading-tight mb-4">Tip the stories that move you</h2>
                <p className="font-body text-lg text-ns-ink-secondary leading-relaxed mb-6">
                  Build direct relationships between readers and authors. Every tip supports future chapters and keeps your top creators shipping new work.
                </p>
                <div className="grid grid-cols-2 gap-3 font-ui">
                  <div className="rounded-ns-lg border border-ns-border bg-ns-elevated p-4">
                    <div className="text-2xl font-bold text-ns-accent">Instant</div>
                    <div className="text-sm text-ns-ink-secondary">On-chain tipping flow</div>
                  </div>
                  <div className="rounded-ns-lg border border-ns-border bg-ns-elevated p-4">
                    <div className="text-2xl font-bold text-ns-accent">Global</div>
                    <div className="text-sm text-ns-ink-secondary">Support from any region</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-2 rounded-[1.4rem] bg-ns-gold/20 blur-xl" />
                <img
                  src="/images/landing/crypto-tipping.svg"
                  alt="Crypto tipping interface concept for supporting writers"
                  className="relative w-full rounded-[1.4rem] border border-ns-border-strong"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-ns-border bg-ns-surface/50 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
              <div>
                <div className="ns-divider max-w-xs mb-4">Best work</div>
                <h2 className="font-heading text-4xl sm:text-5xl leading-tight">Stories your community is already championing</h2>
              </div>
              <button
                onClick={() => navigate("/explore")}
                className="inline-flex items-center gap-2 rounded-full border border-ns-border-strong bg-ns-elevated px-6 py-3 text-sm font-ui font-semibold hover:bg-ns-bg transition-colors"
              >
                Browse all stories
                <Globe2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {bestWork.map((item, index) => (
                <article key={item.title} className="rounded-ns-2xl border border-ns-border bg-ns-elevated overflow-hidden shadow-ns ns-lift">
                  <img
                    src={item.image}
                    alt={`Featured story artwork for ${item.title}`}
                    className={`w-full object-cover ${index === 2 ? "aspect-[16/10]" : "aspect-[3/4]"}`}
                  />
                  <div className="p-5">
                    <h3 className="font-heading text-2xl mb-1">{item.title}</h3>
                    <p className="font-ui text-xs tracking-[0.14em] uppercase text-ns-ink-muted mb-2">{item.genre}</p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-ns-border px-3 py-1 text-xs font-ui text-ns-ink-secondary">
                      <Coins className="h-3.5 w-3.5 text-ns-gold" />
                      {item.engagement}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="font-heading text-4xl sm:text-5xl leading-tight mb-4">Ship your next chapter with NovelSync</h2>
          <p className="font-body text-lg sm:text-xl text-ns-ink-secondary max-w-3xl mx-auto mb-9">
            Move from first draft to audience momentum with AI tools, strong feedback loops, public challenges, and reader-backed rewards.
          </p>
          <div className="flex justify-center flex-wrap gap-4">
            <button
              onClick={() => navigate("/sign-up")}
              className="inline-flex items-center gap-2 rounded-full bg-ns-ink text-[var(--ns-bg)] px-8 py-3.5 font-ui font-bold hover:opacity-95 transition-opacity"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/explore")}
              className="inline-flex items-center gap-2 rounded-full border border-ns-border-strong bg-ns-elevated px-8 py-3.5 font-ui font-semibold hover:bg-ns-surface transition-colors"
            >
              Read featured stories
              <BookOpen className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
