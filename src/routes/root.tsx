import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
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
import { LANDING_IMAGES } from "@/config/landingImages";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const pillars = [
  {
    icon: PenTool,
    title: "AI Draft Studio",
    description:
      "Write scene-by-scene with an AI copilot that respects your voice, structure, and pacing.",
    num: "01",
  },
  {
    icon: MessageSquareQuote,
    title: "Global Feedback Loops",
    description:
      "Share drafts and get thoughtful critique from readers and authors across regions and genres.",
    num: "02",
  },
  {
    icon: Trophy,
    title: "Challenges & Competitions",
    description:
      "Enter weekly prompts, seasonal contests, and judged showcases to grow your audience.",
    num: "03",
  },
  {
    icon: Wallet,
    title: "Crypto Tipping",
    description:
      "Readers can directly tip authors with crypto to reward standout writing and serialized chapters.",
    num: "04",
  },
];

const bestWork = [
  {
    title: "Ember Crown",
    genre: "Epic Fantasy",
    image: LANDING_IMAGES.bestWorkEmber,
    engagement: "18.4K reads",
  },
  {
    title: "Orbit of Ash",
    genre: "Science Fiction",
    image: LANDING_IMAGES.bestWorkOrbit,
    engagement: "12.7K reads",
  },
  {
    title: "Neon Moon",
    genre: "Science Fiction",
    image: LANDING_IMAGES.bestWorkNeon,
    engagement: "10.2K reads",
  },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.12,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: {
      duration: 0.8,
      delay: i * 0.15,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      delay: i * 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  Scroll-triggered section wrapper                                   */
/* ------------------------------------------------------------------ */

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOverlayOpacity = useTransform(
    scrollYProgress,
    [0, 0.6],
    [0.45, 0.8],
  );

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
        {/* ========================================================== */}
        {/*  HERO -- Full-viewport cinematic                           */}
        {/* ========================================================== */}
        <section
          ref={heroRef}
          className="relative h-[70svh] min-h-[640px] flex items-end overflow-hidden"
        >
          {/* Background image with parallax */}
          <motion.div className="absolute inset-0 z-0" style={{ y: heroImgY }}>
            <img
              src={LANDING_IMAGES.heroEditorial}
              alt=""
              className="h-[120%] w-full object-cover object-center"
            />
          </motion.div>

          {/* Dark gradient overlay */}
          <motion.div
            className="absolute inset-0 z-[1]"
            style={{
              opacity: heroOverlayOpacity,
              background:
                "linear-gradient(to top, #0E0E0D 0%, rgba(14,14,13,0.85) 35%, rgba(14,14,13,0.3) 100%)",
            }}
          />

          {/* Film grain over hero */}
          <div
            className="absolute inset-0 z-[2] pointer-events-none mix-blend-soft-light opacity-40"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Decorative accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] z-[3] bg-gradient-to-r from-transparent via-ns-accent to-transparent opacity-70" />

          {/* Content */}
          <div className="relative z-[3] w-full max-w-7xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md px-4 py-2 text-xs font-ui tracking-[0.18em] uppercase text-white/70"
            >
              <Sparkles className="h-3.5 w-3.5 text-ns-accent" />
              Story OS for modern authors
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-heading text-[clamp(2.8rem,7vw,6rem)] leading-[0.92] tracking-tight text-white mb-5 max-w-4xl"
            >
              Write with AI.{" "}
              <span className="italic text-ns-accent">
                Publish to the world.
              </span>
              <br />
              Get rewarded.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-body text-lg sm:text-xl text-white/65 max-w-2xl leading-relaxed mb-9"
            >
              Build worlds, iterate faster, and receive high-quality feedback
              from a global community. Enter challenges, win competitions, and
              earn through direct crypto tips.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-wrap gap-4"
            >
              {!user && (
                <button
                  onClick={() => navigate("/sign-up")}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-ns-accent hover:bg-ns-accent-hover text-white px-8 py-3.5 font-ui font-semibold shadow-lg shadow-ns-accent/25 transition-all duration-300 hover:shadow-ns-accent/40 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Start writing now
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              )}
              <button
                onClick={() => navigate("/explore")}
                className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-sm hover:bg-white/[0.12] px-8 py-3.5 font-ui font-semibold text-white transition-all duration-300"
              >
                Explore stories
                <BookOpen className="h-4 w-4" />
              </button>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[3] flex flex-col items-center gap-2"
          >
            <span className="font-ui text-[10px] tracking-[0.2em] uppercase text-white/30">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "easeInOut",
              }}
              className="w-[1px] h-6 bg-gradient-to-b from-white/40 to-transparent"
            />
          </motion.div>
        </section>

        {/* ========================================================== */}
        {/*  PILLARS -- Numbered feature cards                         */}
        {/* ========================================================== */}
        <Section className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <motion.div variants={fadeUp} className="mb-14 max-w-2xl">
            <div className="ns-divider max-w-[180px] mb-5">How it works</div>
            <h2 className="font-heading text-4xl sm:text-5xl leading-tight tracking-tight">
              Four pillars of a
              <br />
              <span className="italic text-ns-accent">
                modern writing platform
              </span>
            </h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                variants={fadeUp}
                custom={i + 1}
                className="group relative rounded-ns-2xl border border-ns-border bg-ns-elevated p-6 transition-all duration-500 hover:border-ns-accent/30 hover:shadow-ns-lg"
              >
                {/* Large ghost number */}
                <span className="absolute top-4 right-5 font-heading text-[5rem] leading-none text-ns-ink/[0.04] select-none transition-colors duration-500 group-hover:text-ns-accent/[0.08]">
                  {pillar.num}
                </span>

                <div className="relative z-10">
                  <div className="mb-4 inline-flex items-center justify-center h-10 w-10 rounded-ns-lg bg-ns-accent/[0.08] border border-ns-accent/15">
                    <pillar.icon className="h-[18px] w-[18px] text-ns-accent" />
                  </div>
                  <h3 className="font-heading text-xl mb-2 tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ========================================================== */}
        {/*  FEATURES -- Editorial magazine grid                       */}
        {/* ========================================================== */}
        <Section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <motion.article
              variants={scaleIn}
              custom={0}
              className="group relative h-[430px] rounded-ns-2xl overflow-hidden border border-ns-border bg-ns-elevated shadow-ns transition-all duration-500 hover:shadow-ns-xl hover:border-ns-accent/20"
            >
              <div className="overflow-hidden">
                <img
                  src={LANDING_IMAGES.aiCopilot}
                  alt="AI writing copilot"
                  className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <span className="font-ui text-overline text-ns-accent mb-2 block">
                  Core tool
                </span>
                <h3 className="font-heading text-xl sm:text-2xl mb-2 tracking-tight">
                  AI writing assistant
                </h3>
                <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
                  Draft chapters faster with AI suggestions that stay aligned
                  with your story notes.
                </p>
              </div>
            </motion.article>

            <motion.article
              variants={scaleIn}
              custom={1}
              className="group relative h-[430px] rounded-ns-2xl overflow-hidden border border-ns-border bg-ns-elevated shadow-ns transition-all duration-500 hover:shadow-ns-xl hover:border-ns-accent/20"
            >
              <div className="overflow-hidden">
                <img
                  src={LANDING_IMAGES.communityWorkshop}
                  alt="Community feedback on drafts"
                  className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <span className="font-ui text-overline text-ns-accent mb-2 block">
                  Community
                </span>
                <h3 className="font-heading text-xl sm:text-2xl mb-2 tracking-tight">
                  Feedback from readers
                </h3>
                <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
                  Share drafts and get comments from readers and other writers.
                </p>
              </div>
            </motion.article>

            <motion.article
              variants={scaleIn}
              custom={2}
              className="group relative h-[430px] rounded-ns-2xl overflow-hidden border border-ns-border bg-ns-elevated shadow-ns transition-all duration-500 hover:shadow-ns-xl hover:border-ns-accent/20"
            >
              <div className="overflow-hidden">
                <img
                  src={LANDING_IMAGES.challengeArena}
                  alt="Writing challenge board"
                  className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <span className="font-ui text-overline text-ns-accent mb-2 block">
                  Challenges
                </span>
                <h3 className="font-heading text-xl sm:text-2xl mb-2 tracking-tight">
                  Weekly writing events
                </h3>
                <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
                  Join prompts and contests to keep momentum and reach more
                  readers.
                </p>
              </div>
            </motion.article>

            <motion.article
              variants={scaleIn}
              custom={3}
              className="group relative h-[430px] rounded-ns-2xl overflow-hidden border border-ns-border bg-ns-elevated shadow-ns transition-all duration-500 hover:shadow-ns-xl hover:border-ns-accent/20"
            >
              <div className="overflow-hidden">
                <img
                  src={LANDING_IMAGES.contextEditor}
                  alt="Context-aware writing editor"
                  className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <span className="font-ui text-overline text-ns-accent mb-2 block">
                  Editor
                </span>
                <h3 className="font-heading text-xl sm:text-2xl mb-2 tracking-tight">
                  Context-aware text editor
                </h3>
                <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
                  Keep characters, places, and plot details in view while you
                  write.
                </p>
              </div>
            </motion.article>

            <motion.article
              variants={scaleIn}
              custom={4}
              className="group relative h-[430px] rounded-ns-2xl overflow-hidden border border-ns-border bg-ns-elevated shadow-ns transition-all duration-500 hover:shadow-ns-xl hover:border-ns-accent/20"
            >
              <div className="overflow-hidden">
                <img
                  src={LANDING_IMAGES.bookClubs}
                  alt="Book club reading session"
                  className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <span className="font-ui text-overline text-ns-accent mb-2 block">
                  Community
                </span>
                <h3 className="font-heading text-xl sm:text-2xl mb-2 tracking-tight">
                  Book clubs
                </h3>
                <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
                  Create or join clubs to read together and discuss chapters as
                  they drop.
                </p>
              </div>
            </motion.article>

            <motion.article
              variants={scaleIn}
              custom={5}
              className="group relative h-[430px] rounded-ns-2xl overflow-hidden border border-ns-border bg-ns-elevated shadow-ns transition-all duration-500 hover:shadow-ns-xl hover:border-ns-accent/20"
            >
              <div className="overflow-hidden">
                <img
                  src={LANDING_IMAGES.minaBrainstorm}
                  alt="Mina brainstorming AI concept"
                  className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <span className="font-ui text-overline text-ns-accent mb-2 block">
                  AI
                </span>
                <h3 className="font-heading text-xl sm:text-2xl mb-2 tracking-tight">
                  Mina the brainstorming AI
                </h3>
                <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
                  Use Mina to explore plot ideas, character arcs, and scene
                  options when you are stuck.
                </p>
              </div>
            </motion.article>
          </div>
        </Section>

        {/* ========================================================== */}
        {/*  CRYPTO TIPPING -- Cinematic full-width feature            */}
        {/* ========================================================== */}
        <Section className="relative overflow-hidden">
          {/* Full-bleed background image */}
          <motion.div variants={fadeIn} className="absolute inset-0">
            <img
              src={LANDING_IMAGES.cryptoTipping}
              alt=""
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, var(--ns-bg) 0%, color-mix(in srgb, var(--ns-bg) 92%, transparent) 40%, color-mix(in srgb, var(--ns-bg) 50%, transparent) 65%, transparent 100%)",
              }}
            />
          </motion.div>

          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
            <div className="max-w-xl">
              <motion.div variants={fadeUp}>
                <div className="ns-divider max-w-[200px] mb-5">
                  Author economy
                </div>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                custom={1}
                className="font-heading text-4xl sm:text-5xl leading-tight tracking-tight mb-5"
              >
                Tip the stories{" "}
                <span className="italic text-ns-accent">that move you</span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="font-body text-lg text-ns-ink-secondary leading-relaxed mb-8"
              >
                Build direct relationships between readers and authors. Every
                tip supports future chapters and keeps your top creators
                creating new work.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="grid grid-cols-2 gap-3 font-ui max-w-sm"
              ></motion.div>
            </div>
          </div>
        </Section>

        {/* ========================================================== */}
        {/*  Featured stories -- Book cover gallery                           */}
        {/* ========================================================== */}
        <Section className="border-y border-ns-border bg-ns-surface/50 py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
              <motion.div variants={fadeUp}>
                <div className="ns-divider max-w-[160px] mb-4">
                  Featured stories
                </div>
                <h2 className="font-heading text-4xl sm:text-5xl leading-tight tracking-tight">
                  Stories your community is{" "}
                  <span className="italic text-ns-accent">
                    already championing
                  </span>
                </h2>
              </motion.div>
              <motion.button
                variants={fadeUp}
                custom={1}
                onClick={() => navigate("/explore")}
                className="inline-flex items-center gap-2 rounded-full border border-ns-border-strong bg-ns-elevated px-6 py-3 text-sm font-ui font-semibold hover:bg-ns-bg transition-colors"
              >
                Browse all stories
                <Globe2 className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {bestWork.map((item, index) => (
                <motion.article
                  key={item.title}
                  variants={scaleIn}
                  custom={index}
                  className="group rounded-ns-2xl border border-ns-border bg-ns-elevated overflow-hidden shadow-ns transition-all duration-500 hover:shadow-ns-xl hover:border-ns-accent/20"
                >
                  <div className="overflow-hidden">
                    <img
                      src={item.image}
                      alt={`Featured story artwork for ${item.title}`}
                      className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-2xl mb-1 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="font-ui text-xs tracking-[0.14em] uppercase text-ns-ink-muted mb-3">
                      {item.genre}
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-ns-border px-3 py-1 text-xs font-ui text-ns-ink-secondary">
                      <Coins className="h-3.5 w-3.5 text-ns-gold" />
                      {item.engagement}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </Section>

        {/* ========================================================== */}
        {/*  FINAL CTA                                                 */}
        {/* ========================================================== */}
        <Section className="relative overflow-hidden">
          {/* Atmospheric background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-ns-accent/[0.06] blur-[120px]" />
            <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-ns-gold/[0.04] blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
            <motion.div variants={fadeUp}>
              <div className="ns-divider max-w-[140px] mx-auto mb-6">
                Get started
              </div>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight mb-5"
            >
              Ship your next chapter
              <br />
              <span className="italic text-ns-accent">with {APP_NAME}</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="font-body text-lg sm:text-xl text-ns-ink-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Move from first draft to audience momentum with AI tools, strong
              feedback loops, public challenges, and reader-backed rewards.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex justify-center flex-wrap gap-4"
            >
              <button
                onClick={() => navigate("/sign-up")}
                className="group inline-flex items-center gap-2.5 rounded-full bg-ns-ink text-[var(--ns-bg)] px-9 py-4 font-ui font-bold transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-ns-lg"
              >
                Create your account
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate("/explore")}
                className="inline-flex items-center gap-2.5 rounded-full border border-ns-border-strong bg-ns-elevated px-9 py-4 font-ui font-semibold hover:bg-ns-surface transition-colors"
              >
                Read featured stories
                <BookOpen className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        </Section>
      </div>
    </>
  );
}
